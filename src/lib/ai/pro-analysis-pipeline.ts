import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import { db } from "~/server/db";
import { AI_CONFIG } from "~/lib/config/ai";

interface ProPacketResult {
  executiveSummary: string;
  adversarialLiability: string;
  solAndThresholdDefenses: string;
  damagesMemo: string;
  riskRegister: string;
  recommendations: string;
  outreachEmail: string;
  humanNarrative: string;
  generatedAt: string;
  model: string;
  totalTokens: number;
}

export async function generateProPacket(caseId: string): Promise<ProPacketResult> {
  // Load complete case data
  const caseRecord = await db.case.findUnique({
    where: { id: caseId },
    include: {
      user: { select: { name: true, state: true } },
      messages: {
        where: { caseId },
        orderBy: { createdAt: "asc" },
      },
      documents: {
        where: { caseId },
        orderBy: { uploadedAt: "desc" },
      },
    },
  });

  if (!caseRecord) throw new Error("Case not found");

  // Build comprehensive context that gets passed to every call
  const intakeData = (caseRecord.intakeFormData as any) || {};
  const analysisResults = (caseRecord.analysisResults as any) || {};
  const state = intakeData.incidentState || caseRecord.state || caseRecord.incidentState || "";

  let caseContext = `# CASE CONTEXT\n\n`;
  caseContext += `## CASE TYPE: ${caseRecord.caseType}\n`;
  caseContext += `## JURISDICTION: ${state}\n\n`;

  if (caseRecord.narrativeSummary) {
    caseContext += `## PLAINTIFF'S STORY\n${caseRecord.narrativeSummary}\n\n`;
  }

  if (caseRecord.preliminaryAssessment) {
    caseContext += `## PRELIMINARY ASSESSMENT\n${caseRecord.preliminaryAssessment}\n\n`;
  }

  // Add last 15 conversation messages for additional context
  if (caseRecord.messages.length > 0) {
    const recentMessages = caseRecord.messages.slice(-15);
    caseContext += `## CONVERSATION HISTORY (Last ${recentMessages.length} messages)\n\n`;
    for (const msg of recentMessages) {
      const speaker = msg.role === "USER" ? "Plaintiff" : "Kairav";
      caseContext += `**${speaker}:** ${msg.content}\n\n`;
    }
  }

  caseContext += `## INTAKE DATA\n`;
  if (intakeData.defendantName) caseContext += `Defendant: ${intakeData.defendantName}\n`;
  if (intakeData.defendantType) caseContext += `Defendant Type: ${intakeData.defendantType}\n`;
  if (intakeData.incidentDate) caseContext += `Incident Date: ${intakeData.incidentDate}\n`;
  if (intakeData.damagesTotal) caseContext += `Total Damages Claimed: $${parseFloat(intakeData.damagesTotal).toLocaleString()}\n`;
  if (intakeData.hasWrittenAgreement) caseContext += `Written Agreement: ${intakeData.hasWrittenAgreement}\n`;
  if (intakeData.hasArbitrationClause) caseContext += `Arbitration Clause: ${intakeData.hasArbitrationClause}\n`;
  if (intakeData.priorAttorneyContact) caseContext += `Prior Attorney Contact: ${intakeData.priorAttorneyContact}\n`;
  if (intakeData.hasCurrentAttorney) caseContext += `Current Attorney: ${intakeData.hasCurrentAttorney}\n`;
  caseContext += `\nFull Intake Data:\n${JSON.stringify(intakeData, null, 2)}\n\n`;

  // Add document summaries
  if (caseRecord.documents.length > 0) {
    caseContext += `## UPLOADED DOCUMENTS (${caseRecord.documents.length})\n\n`;
    for (const doc of caseRecord.documents) {
      caseContext += `### ${doc.originalName} (${doc.category})\n`;
      if (doc.aiSummary) caseContext += `Summary: ${doc.aiSummary}\n`;
      if (doc.extractedText) {
        caseContext += `Content: ${doc.extractedText.substring(0, 5000)}\n`;
      }
      caseContext += `\n`;
    }
  }

  // Add full basic analysis results if available
  if (Object.keys(analysisResults).length > 0) {
    caseContext += `## BASIC ANALYSIS RESULTS\n\n`;
    caseContext += `### Case Summary\n${analysisResults.caseSummary || 'N/A'}\n\n`;
    
    if (analysisResults.causesOfAction) {
      caseContext += `### Causes of Action\n`;
      for (const coa of analysisResults.causesOfAction) {
        caseContext += `**${coa.name}** (strength: ${coa.strength}%)\n`;
        if (coa.strengthReasoning) caseContext += `Reasoning: ${coa.strengthReasoning}\n`;
        if (coa.elements) {
          for (const el of coa.elements) {
            caseContext += `  - ${el.element}: ${el.status} — ${el.evidence}\n`;
          }
        }
        if (coa.weaknesses && coa.weaknesses.length > 0) {
          caseContext += `Weaknesses: ${coa.weaknesses.join('; ')}\n`;
        }
        caseContext += `\n`;
      }
    }
    
    if (analysisResults.solAnalysis) {
      const sol = analysisResults.solAnalysis;
      caseContext += `### SOL Analysis\n`;
      caseContext += `State: ${sol.state}, Period: ${sol.solPeriodYears} years\n`;
      caseContext += `Deadline: ${sol.estimatedDeadline}, Days remaining: ${sol.daysRemaining}\n`;
      caseContext += `Urgency: ${sol.urgency}\n`;
      if (sol.discoveryRuleExplanation) caseContext += `Discovery rule: ${sol.discoveryRuleExplanation}\n`;
      caseContext += `\n`;
    }
    
    if (analysisResults.evidenceInventory) {
      const ev = analysisResults.evidenceInventory;
      caseContext += `### Evidence Inventory\n`;
      if (ev.have) caseContext += `Have: ${ev.have.map((e: any) => e.item).join(', ')}\n`;
      if (ev.wouldHelp) caseContext += `Would help: ${ev.wouldHelp.map((e: any) => e.item).join(', ')}\n`;
      if (ev.missing) caseContext += `Missing: ${ev.missing.map((e: any) => e.item).join(', ')}\n`;
      caseContext += `\n`;
    }
    
    if (analysisResults.redFlags && analysisResults.redFlags.length > 0) {
      caseContext += `### Red Flags\n`;
      for (const flag of analysisResults.redFlags) {
        caseContext += `- [${flag.severity}] ${flag.concern}: ${flag.explanation}\n`;
      }
      caseContext += `\n`;
    }
    
    if (analysisResults.damagesMemo) {
      caseContext += `### Damages Memo\n${analysisResults.damagesMemo}\n\n`;
    }
  }

  // Import prompts
  const { getProPacketPrompts } = await import("~/lib/ai/prompts/pro-packet-prompts");
  const prompts = getProPacketPrompts(caseContext, state);

  const model = anthropic(AI_CONFIG.model);
  let totalTokens = 0;

  // Helper to make each call
  async function callClaude(prompt: string): Promise<string> {
    const result = await generateText({
      model,
      prompt,
      maxTokens: 4000,
    });
    totalTokens += result.usage.totalTokens;
    return result.text;
  }

  // Run calls sequentially — each section is independent so order doesn't matter
  // but sequential prevents rate limit issues
  const executiveSummary = await callClaude(prompts.executiveSummary);
  const adversarialLiability = await callClaude(prompts.adversarialLiability);
  const solAndThresholdDefenses = await callClaude(prompts.solAndThresholdDefenses);
  const damagesMemo = await callClaude(prompts.damagesMemo);
  const riskRegister = await callClaude(prompts.riskRegister);
  const recommendations = await callClaude(prompts.recommendations);
  const outreachEmail = await callClaude(prompts.outreachEmail);
  const humanNarrative = await callClaude(prompts.humanNarrative);

  return {
    executiveSummary,
    adversarialLiability,
    solAndThresholdDefenses,
    damagesMemo,
    riskRegister,
    recommendations,
    outreachEmail,
    humanNarrative,
    generatedAt: new Date().toISOString(),
    model: AI_CONFIG.model,
    totalTokens,
  };
}
