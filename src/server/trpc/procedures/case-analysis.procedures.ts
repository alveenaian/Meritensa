import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { baseProcedure } from "~/server/trpc/main";
import { db } from "~/server/db";
import { requireAuth } from "~/lib/auth/session";
import { requireCaseAccess } from "~/lib/auth/case-access";
import { scoreCase, ScoringInput } from "~/lib/scoring/case-scorer";
import { anthropic } from "@ai-sdk/anthropic";
import { generateObject } from "ai";
import { AI_CONFIG } from "~/lib/config/ai";

/**
 * CRITICAL: Validates that all related records belong to the specified case.
 * This prevents data contamination between cases.
 */
async function validateCaseDataIntegrity(caseId: string) {
  const caseRecord = await db.case.findUnique({
    where: { id: caseId },
    include: {
      messages: { select: { id: true, caseId: true } },
      documents: { select: { id: true, caseId: true } },
      causesOfAction: { select: { id: true, caseId: true } },
    },
  });

  if (!caseRecord) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Case not found",
    });
  }

  // Verify all messages belong to this case
  const invalidMessages = caseRecord.messages.filter(m => m.caseId !== caseId);
  if (invalidMessages.length > 0) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Data integrity violation detected",
    });
  }

  // Verify all documents belong to this case
  const invalidDocuments = caseRecord.documents.filter(d => d.caseId !== caseId);
  if (invalidDocuments.length > 0) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Data integrity violation detected",
    });
  }

  // Verify all causes of action belong to this case
  const invalidCauses = caseRecord.causesOfAction.filter(c => c.caseId !== caseId);
  if (invalidCauses.length > 0) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Data integrity violation detected",
    });
  }

  return true;
}

export const calculateCaseScore = baseProcedure
  .input(
    z.object({
      token: z.string(),
      caseId: z.string(),
    })
  )
  .mutation(async ({ input }) => {
    const user = await requireAuth(input.token);

    await requireCaseAccess(user.id, input.caseId);
    
    const caseRecord = await db.case.findUnique({
      where: { id: input.caseId },
      include: {
        documents: {
          where: { caseId: input.caseId },
        },
        causesOfAction: {
          where: { caseId: input.caseId },
        },
      },
    });

    if (!caseRecord) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Case not found",
      });
    }

    // Build scoring input
    const scoringInput: ScoringInput = {
      documentCount: caseRecord.documents.length,
      hasContracts: caseRecord.documents.some(
        (d) => d.category === "CONTRACT"
      ),
      hasWrittenCommunications: caseRecord.documents.some(
        (d) => d.category === "EMAIL" || d.category === "TEXT_MESSAGE"
      ),
      hasFinancialRecords: caseRecord.documents.some(
        (d) => d.category === "FINANCIAL"
      ),
      hasWitnesses: false,
      causesOfAction: caseRecord.causesOfAction.map((c) => ({
        name: c.name,
        strength: c.strength || 50,
      })),
      clearBreach: caseRecord.causesOfAction.length > 0,
      estimatedDamages: caseRecord.estimatedDamages || 0,
      damagesDocumented: caseRecord.documents.some(
        (d) => d.category === "FINANCIAL"
      ),
      damagesCalculable: !!caseRecord.estimatedDamages,
      defendantType: caseRecord.defendantType,
      defendantKnownSolvent: caseRecord.defendantType === "CORPORATION" || 
                             caseRecord.defendantType === "GOVERNMENT",
      incidentDate: caseRecord.incidentDate,
      state: caseRecord.state,
      caseType: caseRecord.caseType,
    };

    // Calculate scores
    const scores = scoreCase(scoringInput);

    // Update case with scores
    await db.case.update({
      where: { id: caseRecord.id },
      data: {
        overallScore: scores.overallScore,
        evidenceScore: scores.evidenceScore,
        liabilityScore: scores.liabilityScore,
        damagesScore: scores.damagesScore,
        collectability: scores.collectability,
        solRisk: scores.solRisk,
      },
    });

    return scores;
  });

export const getAnalysisStatus = baseProcedure
  .input(
    z.object({
      token: z.string(),
      caseId: z.string(),
    })
  )
  .query(async ({ input }) => {
    const user = await requireAuth(input.token);
    await requireCaseAccess(user.id, input.caseId);
    
    const caseRecord = await db.case.findUnique({
      where: { id: input.caseId },
      select: {
        id: true,
        stage: true,
        analyzedAt: true,
        analysisError: true,
        analysisResults: true,
      },
    });

    if (!caseRecord) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Case not found",
      });
    }

    return {
      stage: caseRecord.stage,
      isComplete: caseRecord.stage === "COMPLETE",
      isAnalyzing: caseRecord.stage === "ANALYSIS",
      analyzedAt: caseRecord.analyzedAt,
      error: caseRecord.analysisError,
      hasResults: !!caseRecord.analysisResults,
    };
  });

export const runCaseAnalysis = baseProcedure
  .input(
    z.object({
      token: z.string(),
      caseId: z.string(),
    })
  )
  .mutation(async ({ input }) => {
    const user = await requireAuth(input.token);

    // Validate data integrity with error handling
    try {
      await validateCaseDataIntegrity(input.caseId);
      console.log(`[Analysis] Data integrity validated for case ${input.caseId}`);
    } catch (integrityError: any) {
      console.error(`[Analysis] Data integrity check failed for case ${input.caseId}:`, integrityError);
      throw integrityError; // Re-throw as this is a critical error
    }

    // Verify user owns the case
    await requireCaseAccess(user.id, input.caseId);
    
    const caseRecord = await db.case.findUnique({
      where: { id: input.caseId },
      include: {
        messages: {
          where: { caseId: input.caseId },
          orderBy: { createdAt: "asc" },
        },
        documents: {
          where: { caseId: input.caseId },
          orderBy: { uploadedAt: "desc" },
        },
        causesOfAction: {
          where: { caseId: input.caseId },
        },
      },
    });

    if (!caseRecord) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Case not found",
      });
    }

    // Set case to ANALYSIS stage and clear any previous errors
    await db.case.update({
      where: { id: input.caseId },
      data: {
        stage: "ANALYSIS",
        analysisError: null,
      },
    });

    // Start the analysis in the background (fire-and-forget)
    // This allows us to return immediately and avoid timeout issues
    performAnalysisInBackground(input.caseId, user.id, caseRecord).catch((error) => {
      console.error(`[Analysis] Background analysis failed for case ${input.caseId}:`, error);
    });

    return {
      success: true,
      message: "Analysis started",
    };
  });

/**
 * Performs the actual case analysis in the background.
 * This function runs asynchronously and updates the case when complete.
 */
async function performAnalysisInBackground(
  caseId: string,
  userId: string,
  caseRecord: any
) {
  try {
    console.log(`[Analysis] Starting background analysis for case ${caseId}`);

    // Build comprehensive context for AI
    const intakeData = (caseRecord.intakeFormData as any) || {};
    let context = `# COMPREHENSIVE CASE ANALYSIS REQUEST\n\n`;
    context += `**CASE ID: ${caseId}**\n\n`;
    context += `## CASE TYPE\n${caseRecord.caseType}\n\n`;

    // Add narrative summary
    if (caseRecord.narrativeSummary) {
      context += `## USER'S STORY\n${caseRecord.narrativeSummary}\n\n`;
    }

    // Add last 15 conversation messages for additional context
    if (caseRecord.messages.length > 0) {
      const recentMessages = caseRecord.messages.slice(-15);
      context += `## CONVERSATION HISTORY (Last ${recentMessages.length} messages)\n\n`;
      for (const msg of recentMessages) {
        const speaker = msg.role === "USER" ? "Plaintiff" : "Kairav";
        context += `**${speaker}:** ${msg.content}\n\n`;
      }
    }

    // Add intake form data
    context += `## INTAKE FORM DATA\n\n`;
    if (intakeData.defendantName) context += `**Defendant:** ${intakeData.defendantName}\n`;
    if (intakeData.defendantType) context += `**Defendant Type:** ${intakeData.defendantType}\n`;
    if (intakeData.incidentDate) context += `**Incident Date:** ${intakeData.incidentDate}\n`;
    if (intakeData.incidentState) context += `**Incident State:** ${intakeData.incidentState}\n`;
    if (intakeData.damagesTotal) context += `**Total Damages:** $${parseFloat(intakeData.damagesTotal).toLocaleString()}\n`;
    
    // Add more intake data as needed
    context += `\n**Full Intake Data:**\n${JSON.stringify(intakeData, null, 2)}\n\n`;

    // Add document summaries
    if (caseRecord.documents.length > 0) {
      context += `\n## UPLOADED DOCUMENTS (${caseRecord.documents.length} total)\n\n`;
      for (const doc of caseRecord.documents) {
        context += `### ${doc.originalName} (${doc.category})\n`;
        if (doc.aiSummary) {
          context += `**AI Summary:** ${doc.aiSummary}\n`;
        }
        if (doc.extractedText) {
          const textPreview = doc.extractedText.substring(0, 5000);
          context += `**Content Preview:** ${textPreview}${doc.extractedText.length > 5000 ? "..." : ""}\n`;
        }
        context += `\n`;
      }
    }

    // Define the analysis output schema - made more lenient to handle AI variations
    const analysisSchema = z.object({
      caseSummary: z.string().default(""),
      timeline: z.array(
        z.object({
          date: z.string(),
          event: z.string(),
          significance: z.string().optional().default(""),
        })
      ).default([]),
      damagesMemo: z.string().default(""),
      solAnalysis: z.object({
        state: z.string(),
        claimType: z.string(),
        solPeriodYears: z.number(),
        incidentDate: z.string(),
        discoveryDate: z.string().optional(),
        estimatedDeadline: z.string(),
        daysRemaining: z.number(),
        discoveryRuleApplicable: z.boolean().default(false),
        discoveryRuleExplanation: z.string().optional(),
        urgency: z.enum(["EXPIRED", "CRITICAL", "HIGH", "MEDIUM", "LOW"]).default("MEDIUM"),
      }).optional(),
      causesOfAction: z.array(
        z.object({
          name: z.string(),
          elements: z.array(
            z.object({
              element: z.string(),
              status: z.enum(["SUPPORTED", "PARTIALLY_SUPPORTED", "UNSUPPORTED", "UNKNOWN"]).default("UNKNOWN"),
              evidence: z.string().default(""),
            })
          ).default([]),
          strength: z.number().min(0).max(100).default(50),
          strengthReasoning: z.string().default(""),
          weaknesses: z.array(z.string()).default([]),
        })
      ).default([]),
      evidenceInventory: z.object({
        have: z.array(z.object({
          item: z.string(),
          supports: z.string().default(""),
        })).default([]),
        wouldHelp: z.array(z.object({
          item: z.string(),
          wouldProve: z.string().default(""),
        })).default([]),
        missing: z.array(z.object({
          item: z.string(),
          criticality: z.string().default(""),
        })).default([]),
      }).default({ have: [], wouldHelp: [], missing: [] }),
      caseScore: z.object({
        overall: z.number().default(0),
        evidence: z.number().default(0),
        liability: z.number().default(0),
        damages: z.number().default(0),
        collectability: z.number().default(0),
        solRisk: z.number().default(0),
      }).default({ overall: 0, evidence: 0, liability: 0, damages: 0, collectability: 0, solRisk: 0 }),
      redFlags: z.array(
        z.object({
          concern: z.string(),
          severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
          explanation: z.string().default(""),
        })
      ).default([]),
      recommendations: z.array(z.string()).default([]),
    });

    // Call AI to generate analysis with comprehensive error handling
    const model = anthropic(AI_CONFIG.model);
    
    const prompt = `${context}

## YOUR TASK

You are a legal analyst conducting a preliminary case assessment. Your analysis will be shown to the plaintiff and potentially to attorneys reviewing this case for contingency representation. Accuracy and intellectual honesty are critical. Do NOT inflate assessments to make the plaintiff feel good. An attorney who receives an overly optimistic assessment will lose trust in this platform.

### INSTRUCTIONS FOR EACH CAUSE OF ACTION

For EVERY cause of action you identify, you MUST:

1. **Name the specific legal claim** (e.g., "Breach of Written Contract" not just "Breach of Contract")
2. **List the required legal elements** for that claim in the relevant jurisdiction (${intakeData.incidentState || 'state unknown'}). For example, breach of contract requires: (a) existence of a valid contract, (b) plaintiff's performance or excuse for non-performance, (c) defendant's material breach, (d) resulting damages.
3. **For each element, state whether the evidence supports it, partially supports it, or is missing.** Cite specific facts from the narrative, intake data, or uploaded documents. If an element has no supporting evidence, say so explicitly.
4. **Assess strength as a percentage (0-100)** where:
   - 80-100: All elements clearly supported by evidence — an attorney would likely take this
   - 60-79: Most elements supported, 1-2 gaps that could be filled — worth attorney review
   - 40-59: Some elements supported but significant gaps — uncertain outcome
   - 20-39: Weak support, major elements missing — unlikely to attract contingency representation
   - 0-19: Insufficient facts to support this claim
5. **List specific weaknesses** — what a defense attorney would argue, what evidence is missing, what facts undermine this claim

### INSTRUCTIONS FOR STATUTE OF LIMITATIONS

Use these actual statute of limitations periods by state and claim type. If the state is not listed, use the default:

**Breach of Contract (Written):**
CA: 4yr, NY: 6yr, TX: 4yr, FL: 5yr, IL: 10yr, PA: 4yr, OH: 8yr, GA: 6yr, NC: 3yr, NJ: 6yr, Default: 4yr

**Breach of Contract (Oral):**
CA: 2yr, NY: 6yr, TX: 4yr, FL: 4yr, IL: 5yr, PA: 4yr, OH: 6yr, GA: 4yr, NC: 3yr, NJ: 6yr, Default: 3yr

**Fraud:**
CA: 3yr, NY: 6yr, TX: 4yr, FL: 4yr, IL: 5yr, PA: 2yr, OH: 4yr, GA: 4yr, NC: 3yr, NJ: 6yr, Default: 3yr

**Personal Injury:**
CA: 2yr, NY: 3yr, TX: 2yr, FL: 4yr, IL: 2yr, PA: 2yr, OH: 2yr, GA: 2yr, NC: 3yr, NJ: 2yr, Default: 2yr

**Employment (Discrimination/Wrongful Termination):**
CA: 3yr (FEHA) / 1yr (DFEH filing), NY: 3yr, TX: 2yr (state) / 300 days (EEOC), FL: 1yr, IL: 300 days, Default: 2yr

**IP Theft / Trade Secrets:**
CA: 3yr, NY: 3yr, TX: 3yr, FL: 3yr, IL: 5yr, Default: 3yr

**Partnership Dispute:**
Use the breach of contract SOL for the relevant state.

Note: The discovery rule may toll the SOL in some states — if the plaintiff did not discover the harm until later, note this and explain how it could affect the deadline. Compute the deadline from the incident date (or discovery date if provided) and flag if < 180 days remain.

### INSTRUCTIONS FOR DAMAGES ANALYSIS

- Only count damages the plaintiff has actually described or documented
- Distinguish between economic damages (calculable losses) and non-economic damages (pain/suffering)
- If the plaintiff provided a total number but no breakdown, note that the damages need documentation
- Do NOT speculate about damages categories the plaintiff hasn't mentioned

### INSTRUCTIONS FOR EVIDENCE INVENTORY

For each piece of evidence in the "have" list, briefly note which cause of action element it supports.
For each piece in the "wouldHelp" list, explain specifically what it would prove.
For the "missing" list, flag evidence that is critical for the strongest claim — without this, what falls apart?

### INSTRUCTIONS FOR RED FLAGS

Only flag real concerns. Common red flags include:
- SOL expired or about to expire
- Plaintiff was also at fault (contributory/comparative negligence)
- Arbitration clause in the contract
- Defendant is judgment-proof (individual with no assets)
- Verbal-only agreement with no witnesses
- Inconsistencies in the plaintiff's timeline
- Claims that require proving intent (fraud) with only circumstantial evidence

Do NOT manufacture red flags to appear balanced. If there are none, say so.

### INSTRUCTIONS FOR SCORING

Do NOT fill in the caseScore object with your own numbers. Instead, provide your qualitative assessment in the caseSummary and causesOfAction, and leave all caseScore values at 0. The scores will be calculated by a separate deterministic algorithm based on the structured data you provide.

### INSTRUCTIONS FOR RECOMMENDATIONS

Provide 3-5 actionable next steps. Prioritize:
1. Urgent deadlines (SOL)
2. Evidence to gather before it disappears
3. Whether this case is suitable for contingency representation
4. Specific type of attorney to seek (e.g., "employment law attorney experienced in FLSA claims" not just "a lawyer")
`;

    let analysis;
    try {
      console.log(`[Analysis] Starting AI analysis for case ${caseId}`);
      
      const result = await generateObject({
        model,
        schema: analysisSchema,
        prompt,
        maxTokens: 16000,
      });

      analysis = result.object;
      console.log(`[Analysis] AI analysis completed successfully for case ${caseId}`);
      
      // Validate that we got meaningful data
      if (!analysis.caseSummary || analysis.caseSummary.length < 50) {
        console.warn(`[Analysis] AI returned minimal case summary for case ${caseId}`);
      }
      
      if (!analysis.causesOfAction || analysis.causesOfAction.length === 0) {
        console.warn(`[Analysis] AI returned no causes of action for case ${caseId}`);
      }
      
    } catch (aiError: any) {
      console.error(`[Analysis] AI generation failed for case ${caseId}:`, aiError);
      
      // Store error in database
      let errorMessage = "Failed to generate case analysis";
      
      if (aiError.message?.includes("timeout")) {
        errorMessage = "Analysis timed out. Please try again.";
      } else if (aiError.message?.includes("rate limit")) {
        errorMessage = "Service is temporarily busy. Please try again in a moment.";
      } else if (aiError.message?.includes("token")) {
        errorMessage = "Case is too complex to analyze. Please contact support.";
      } else if (aiError.message) {
        errorMessage = `Analysis failed: ${aiError.message}`;
      }
      
      await db.case.update({
        where: { id: caseId },
        data: {
          analysisError: errorMessage,
          stage: "ANALYSIS", // Keep in ANALYSIS stage so user can retry
        },
      });
      
      throw aiError;
    }

    // Use deterministic scorer for scores instead of AI-generated numbers
    let deterministicScores;
    try {
      const scoringInput: ScoringInput = {
        documentCount: caseRecord.documents.length,
        hasContracts: caseRecord.documents.some((d) => d.category === "CONTRACT"),
        hasWrittenCommunications: caseRecord.documents.some(
          (d) => d.category === "COMMUNICATIONS" || d.category === "EMAIL"
        ),
        hasFinancialRecords: caseRecord.documents.some(
          (d) => d.category === "FINANCIAL"
        ),
        hasWitnesses: intakeData.hasWitnesses === "yes",
        causesOfAction: analysis.causesOfAction.map((c) => ({
          name: c.name,
          strength: c.strength,
        })),
        clearBreach: analysis.causesOfAction.some((c) => c.strength >= 70),
        estimatedDamages: parseFloat(intakeData.damagesTotal) || 0,
        damagesDocumented: caseRecord.documents.some(
          (d) => d.category === "FINANCIAL" || d.category === "MEDICAL"
        ),
        damagesCalculable: !!(intakeData.damagesTotal && parseFloat(intakeData.damagesTotal) > 0),
        defendantType: intakeData.defendantType || null,
        defendantKnownSolvent: intakeData.defendantType === "CORPORATION" || intakeData.defendantType === "GOVERNMENT",
        incidentDate: intakeData.incidentDate ? new Date(intakeData.incidentDate) : null,
        discoveryDate: intakeData.discoveryDate ? new Date(intakeData.discoveryDate) : null,
        state: intakeData.incidentState || null,
        caseType: caseRecord.caseType,
      };

      deterministicScores = scoreCase(scoringInput);
      console.log(`[Analysis] Calculated deterministic scores for case ${caseId}`);
    } catch (scoringError: any) {
      console.error(`[Analysis] Scoring calculation failed for case ${caseId}:`, scoringError);
      
      // Provide default scores if scoring fails
      deterministicScores = {
        overallScore: 50,
        evidenceScore: 50,
        liabilityScore: 50,
        damagesScore: 50,
        collectability: 50,
        solRisk: "MEDIUM" as const,
      };
    }

    // Override AI scores with deterministic scores
    analysis.caseScore = {
      overall: deterministicScores.overallScore,
      evidence: deterministicScores.evidenceScore,
      liability: deterministicScores.liabilityScore,
      damages: deterministicScores.damagesScore,
      collectability: deterministicScores.collectability,
      solRisk: deterministicScores.solRisk === "EXPIRED" ? 0
        : deterministicScores.solRisk === "CRITICAL" ? 20
        : deterministicScores.solRisk === "HIGH" ? 40
        : deterministicScores.solRisk === "MEDIUM" ? 60
        : 100,
    };

    // Update case with consolidated analysis results
    try {
      await db.case.update({
        where: { id: caseId },
        data: {
          analysisResults: analysis as any,
          // Also update individual score fields for backwards compatibility
          overallScore: analysis.caseScore.overall,
          evidenceScore: analysis.caseScore.evidence,
          liabilityScore: analysis.caseScore.liability,
          damagesScore: analysis.caseScore.damages,
          collectability: analysis.caseScore.collectability,
          analyzedAt: new Date(),
          stage: "COMPLETE",
          analysisError: null,
          // Keep legacy summary field for backwards compatibility
          summary: analysis.caseSummary,
        },
      });
      
      console.log(`[Analysis] Successfully updated case ${caseId} in database`);
    } catch (dbError: any) {
      console.error(`[Analysis] Database update failed for case ${caseId}:`, dbError);
      
      await db.case.update({
        where: { id: caseId },
        data: {
          analysisError: "Failed to save analysis results. Please try again.",
          stage: "ANALYSIS",
        },
      });
      
      throw dbError;
    }

    // Log analytics event
    try {
      await db.analyticsEvent.create({
        data: {
          userId: userId,
          caseId: caseId,
          event: "case_analysis_completed",
          metadata: {
            overallScore: analysis.caseScore.overall,
            causesOfActionCount: analysis.causesOfAction.length,
            redFlagsCount: analysis.redFlags.length,
          },
        },
      });
    } catch (analyticsError) {
      // Don't fail the whole operation if analytics fails
      console.error(`[Analysis] Analytics event creation failed for case ${caseId}:`, analyticsError);
    }

    console.log(`[Analysis] Background analysis completed successfully for case ${caseId}`);
  } catch (error: any) {
    console.error(`[Analysis] Fatal error in background analysis for case ${caseId}:`, error);
    
    // Try to update the case with an error message
    try {
      await db.case.update({
        where: { id: caseId },
        data: {
          analysisError: error.message || "An unexpected error occurred during analysis",
          stage: "ANALYSIS",
        },
      });
    } catch (updateError) {
      console.error(`[Analysis] Failed to update case with error message for case ${caseId}:`, updateError);
    }
  }
}
