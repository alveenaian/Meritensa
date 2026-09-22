import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { baseProcedure } from "~/server/trpc/main";
import { db } from "~/server/db";
import { requireAuth } from "~/lib/auth/session";
import { requireCaseAccess } from "~/lib/auth/case-access";
import { chat } from "~/lib/ai/claude.service";
import { canCreateCase, canAccessFeature } from "~/lib/features/access";
import { generateCasePacketPDF } from "~/lib/pdf/generate-case-packet";
import { minioClient } from "~/server/minio";

export const createCase = baseProcedure
  .input(
    z.object({
      token: z.string(),
      caseType: z.enum([
        "BREACH_OF_CONTRACT",
        "FRAUD",
        "EMPLOYMENT",
        "PERSONAL_INJURY",
        "IP_THEFT",
        "PARTNERSHIP_DISPUTE",
        "OTHER",
      ]),
      title: z.string().optional(),
    })
  )
  .mutation(async ({ input }) => {
    const user = await requireAuth(input.token);

    // Check if user can create more cases
    const canCreate = await canCreateCase(user.id);
    if (!canCreate) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You have reached the maximum number of cases (3). Upgrade to create unlimited cases.",
      });
    }

    // Auto-generate title if not provided
    const caseTitle =
      input.title ||
      `${input.caseType.replace(/_/g, " ")} Case - ${new Date().toLocaleDateString()}`;

    const newCase = await db.case.create({
      data: {
        userId: user.id,
        caseType: input.caseType,
        title: caseTitle,
        status: "INTAKE",
      },
    });

    // Log analytics event
    await db.analyticsEvent.create({
      data: {
        userId: user.id,
        caseId: newCase.id,
        event: "case_created",
        metadata: { caseType: input.caseType },
      },
    });

    return newCase;
  });

export const listCases = baseProcedure
  .input(
    z.object({
      token: z.string(),
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(50).default(10),
      status: z.string().optional(),
    })
  )
  .query(async ({ input }) => {
    const user = await requireAuth(input.token);

    const where = {
      userId: user.id,
      ...(input.status && { status: input.status as any }),
    };

    const [cases, total] = await Promise.all([
      db.case.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip: (input.page - 1) * input.limit,
        take: input.limit,
        include: {
          _count: {
            select: { documents: true, messages: true },
          },
        },
      }),
      db.case.count({ where }),
    ]);

    return {
      cases,
      pagination: {
        page: input.page,
        limit: input.limit,
        total,
        pages: Math.ceil(total / input.limit),
      },
    };
  });

export const getCaseDetails = baseProcedure
  .input(
    z.object({
      token: z.string(),
      caseId: z.string(),
    })
  )
  .query(async ({ input }) => {
    const user = await requireAuth(input.token);

    const caseRecord = await db.case.findFirst({
      where: {
        id: input.caseId,
        userId: user.id,
      },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
        documents: {
          orderBy: { uploadedAt: "desc" },
        },
        causesOfAction: true,
      },
    });

    if (!caseRecord) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Case not found",
      });
    }

    return caseRecord;
  });

export const deleteCase = baseProcedure
  .input(
    z.object({
      token: z.string(),
      caseId: z.string(),
    })
  )
  .mutation(async ({ input }) => {
    const user = await requireAuth(input.token);

    // Verify user owns the case
    const caseRecord = await requireCaseAccess(user.id, input.caseId);

    // Delete the case (cascade will handle related records)
    await db.case.delete({
      where: { id: input.caseId },
    });

    // Log analytics event
    await db.analyticsEvent.create({
      data: {
        userId: user.id,
        event: "case_deleted",
        metadata: {
          caseId: input.caseId,
          caseType: caseRecord.caseType,
        },
      },
    });

    return { success: true };
  });

export const updateCaseTitle = baseProcedure
  .input(
    z.object({
      token: z.string(),
      caseId: z.string(),
      title: z.string().min(1, "Title cannot be empty").max(200),
    })
  )
  .mutation(async ({ input }) => {
    const user = await requireAuth(input.token);

    // Verify user owns the case
    await requireCaseAccess(user.id, input.caseId);

    // Update the title
    const updatedCase = await db.case.update({
      where: { id: input.caseId },
      data: { title: input.title },
    });

    return updatedCase;
  });

export const updateCaseField = baseProcedure
  .input(
    z.object({
      token: z.string(),
      caseId: z.string(),
      field: z.enum(["needsNewSummary"]),
      value: z.boolean(),
    })
  )
  .mutation(async ({ input }) => {
    const user = await requireAuth(input.token);

    // Verify user owns the case
    await requireCaseAccess(user.id, input.caseId);

    // Update the specified field
    const updatedCase = await db.case.update({
      where: { id: input.caseId },
      data: {
        [input.field]: input.value,
      },
    });

    return updatedCase;
  });

export const updateCaseStage = baseProcedure
  .input(
    z.object({
      token: z.string(),
      caseId: z.string(),
      stage: z.enum(["CONVERSATION", "INTAKE", "EVIDENCE", "ANALYSIS", "COMPLETE"]),
    })
  )
  .mutation(async ({ input }) => {
    const user = await requireAuth(input.token);

    // Verify user owns the case
    await requireCaseAccess(user.id, input.caseId);

    const updatedCase = await db.case.update({
      where: { id: input.caseId },
      data: { stage: input.stage },
    });

    // Log analytics event
    await db.analyticsEvent.create({
      data: {
        userId: user.id,
        caseId: input.caseId,
        event: "case_stage_updated",
        metadata: { stage: input.stage },
      },
    });

    return updatedCase;
  });

export const saveUserIntent = baseProcedure
  .input(
    z.object({
      token: z.string(),
      caseId: z.string(),
      userIntent: z.string(),
    })
  )
  .mutation(async ({ input }) => {
    const user = await requireAuth(input.token);

    await requireCaseAccess(user.id, input.caseId);

    const updatedCase = await db.case.update({
      where: { id: input.caseId },
      data: { userIntent: input.userIntent },
    });

    // Log analytics event
    await db.analyticsEvent.create({
      data: {
        userId: user.id,
        caseId: input.caseId,
        event: "user_intent_selected",
        metadata: { userIntent: input.userIntent },
      },
    });

    return updatedCase;
  });

export const confirmNarrative = baseProcedure
  .input(
    z.object({
      token: z.string(),
      caseId: z.string(),
      narrativeSummary: z.string(),
    })
  )
  .mutation(async ({ input }) => {
    const user = await requireAuth(input.token);

    const caseRecord = await requireCaseAccess(user.id, input.caseId);

    // Generate preliminary assessment
    const assessmentResponse = await chat({
      messages: [
        {
          role: "user" as const,
          content: `Here is the user's confirmed narrative summary:\n\n${input.narrativeSummary}`,
        },
      ],
      caseType: caseRecord.caseType,
      intakeStep: "preliminary_assessment",
    });

    const updatedCase = await db.case.update({
      where: { id: input.caseId },
      data: {
        narrativeSummary: input.narrativeSummary,
        narrativeConfirmedAt: new Date(),
        preliminaryAssessment: assessmentResponse.content,
        stage: "INTAKE",
      },
    });

    // Log analytics event
    await db.analyticsEvent.create({
      data: {
        userId: user.id,
        caseId: input.caseId,
        event: "narrative_confirmed",
        metadata: { stage: "INTAKE" },
      },
    });

    return {
      case: updatedCase,
      preliminaryAssessment: assessmentResponse.content,
    };
  });

export const submitIntakeForm = baseProcedure
  .input(
    z.object({
      token: z.string(),
      caseId: z.string(),
      formData: z.record(z.any()), // Accept any JSON object
    })
  )
  .mutation(async ({ input }) => {
    const { token, caseId, formData } = input;
    
    const user = await requireAuth(token);

    // Verify case exists and belongs to user
    const existingCase = await requireCaseAccess(user.id, caseId);

    // Extract key fields for quick access (backwards compatibility)
    const defendantName = formData.defendantName;
    const incidentDate = formData.incidentDate ? new Date(formData.incidentDate) : null;
    const incidentState = formData.incidentState;
    
    // For damages, keep as string in intakeFormData to avoid precision loss
    // Only convert to Float for legacy field if value is reasonable
    let damagesFloat: number | null = null;
    if (formData.damagesTotal) {
      const damagesStr = String(formData.damagesTotal).replace(/[^0-9.]/g, '');
      const damagesNum = parseFloat(damagesStr);
      // Only store in Float field if it's a reasonable size (< 1 billion)
      // This prevents precision loss on very large numbers
      if (!isNaN(damagesNum) && damagesNum < 1_000_000_000) {
        damagesFloat = damagesNum;
      }
    }

    // Save form data AND update stage to EVIDENCE
    const updated = await db.case.update({
      where: { id: caseId },
      data: {
        intakeFormData: formData,
        // Update quick-access fields for backwards compatibility
        defendantName: defendantName || existingCase.defendantName,
        incidentDate: incidentDate || existingCase.incidentDate,
        incidentState: incidentState || existingCase.incidentState,
        state: incidentState || existingCase.state,  // Write incidentState to state column
        estimatedDamages: damagesFloat !== null ? damagesFloat : existingCase.estimatedDamages,
        stage: "EVIDENCE",
        intakeCompletedAt: new Date(),
      },
    });

    // Log analytics event
    await db.analyticsEvent.create({
      data: {
        userId: user.id,
        caseId,
        event: "intake_completed",
        metadata: { stage: "EVIDENCE" },
      },
    });

    return { success: true, nextStep: "evidence", case: updated };
  });

export const saveIntakeProgress = baseProcedure
  .input(
    z.object({
      token: z.string(),
      caseId: z.string(),
      formData: z.record(z.any()), // Accept any JSON object
    })
  )
  .mutation(async ({ input }) => {
    const { token, caseId, formData } = input;
    
    const user = await requireAuth(token);

    // Verify case exists and belongs to user
    const existingCase = await requireCaseAccess(user.id, caseId);

    // Merge with existing form data
    const currentFormData = (existingCase.intakeFormData as any) || {};
    const mergedFormData = { ...currentFormData, ...formData };

    // Extract key fields for quick access
    const defendantName = mergedFormData.defendantName;
    const incidentDate = mergedFormData.incidentDate ? new Date(mergedFormData.incidentDate) : null;
    const incidentState = mergedFormData.incidentState;
    
    // For damages, keep as string in intakeFormData to avoid precision loss
    let damagesFloat: number | null = null;
    if (mergedFormData.damagesTotal) {
      const damagesStr = String(mergedFormData.damagesTotal).replace(/[^0-9.]/g, '');
      const damagesNum = parseFloat(damagesStr);
      // Only store in Float field if it's a reasonable size (< 1 billion)
      if (!isNaN(damagesNum) && damagesNum < 1_000_000_000) {
        damagesFloat = damagesNum;
      }
    }

    // Save to database
    const updated = await db.case.update({
      where: { id: caseId },
      data: {
        intakeFormData: mergedFormData,
        // Update quick-access fields
        defendantName: defendantName || existingCase.defendantName,
        incidentDate: incidentDate || existingCase.incidentDate,
        incidentState: incidentState || existingCase.incidentState,
        estimatedDamages: damagesFloat !== null ? damagesFloat : existingCase.estimatedDamages,
      },
    });

    return { success: true, case: updated };
  });

export const requestReferral = baseProcedure
  .input(
    z.object({
      token: z.string(),
      caseId: z.string(),
    })
  )
  .mutation(async ({ input }) => {
    const user = await requireAuth(input.token);

    const caseRecord = await requireCaseAccess(user.id, input.caseId);

    // Validate case has been scored
    if (!caseRecord.overallScore) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Case must be scored before requesting a referral",
      });
    }

    // Check if referral already requested
    if (caseRecord.referralRequested) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Referral has already been requested for this case",
      });
    }

    // Update case
    const updatedCase = await db.case.update({
      where: { id: input.caseId },
      data: {
        status: "REFERRAL_PENDING",
        referralRequested: true,
        referralRequestedAt: new Date(),
        referralStatus: "REQUESTED",
      },
    });

    // Log analytics event
    await db.analyticsEvent.create({
      data: {
        userId: user.id,
        caseId: input.caseId,
        event: "referral_requested",
        metadata: {
          caseType: caseRecord.caseType,
          overallScore: caseRecord.overallScore,
        },
      },
    });

    return updatedCase;
  });

export const requestFunding = baseProcedure
  .input(
    z.object({
      token: z.string(),
      caseId: z.string(),
    })
  )
  .mutation(async ({ input }) => {
    const user = await requireAuth(input.token);

    const caseRecord = await requireCaseAccess(user.id, input.caseId);

    // Validate case has been scored
    if (!caseRecord.overallScore) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Case must be scored before requesting funding",
      });
    }

    // Check if funding already requested
    if (caseRecord.fundingRequested) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Funding has already been requested for this case",
      });
    }

    // Update case
    const updatedCase = await db.case.update({
      where: { id: input.caseId },
      data: {
        fundingRequested: true,
        fundingRequestedAt: new Date(),
        fundingStatus: "REQUESTED",
      },
    });

    // Log analytics event
    await db.analyticsEvent.create({
      data: {
        userId: user.id,
        caseId: input.caseId,
        event: "funding_requested",
        metadata: {
          caseType: caseRecord.caseType,
          overallScore: caseRecord.overallScore,
        },
      },
    });

    return updatedCase;
  });

export const downloadCasePacket = baseProcedure
  .input(
    z.object({
      token: z.string(),
      caseId: z.string(),
      packetType: z.enum(["summary", "one-pager", "full"]).default("summary"),
    })
  )
  .mutation(async ({ input }) => {
    const user = await requireAuth(input.token);

    // Check feature access
    const access = await canAccessFeature(user.id, "download_packet");
    if (!access.allowed) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: access.reason || "Access denied",
      });
    }

    // Verify user owns case
    await requireCaseAccess(user.id, input.caseId);

    // Generate PDF based on type
    let pdfBuffer: Buffer;
    let filename: string;

    if (input.packetType === "one-pager") {
      const { generateOnePagerPDF } = await import("~/lib/pdf/generate-case-packet");
      pdfBuffer = await generateOnePagerPDF(input.caseId);
      filename = `one-pager-${input.caseId}-${Date.now()}.pdf`;
    } else {
      // For both "summary" and "full", use the existing function
      // (we'll enhance it to include more detail for "full" later if needed)
      pdfBuffer = await generateCasePacketPDF(input.caseId);
      filename = `case-packet-${input.caseId}-${Date.now()}.pdf`;
    }

    // Upload to Minio temporarily
    const bucketName = "kairav-uploads";
    const storageKey = `temp/${user.id}/${filename}`;

    await minioClient.putObject(bucketName, storageKey, pdfBuffer, {
      "Content-Type": "application/pdf",
    });

    // Generate presigned URL (valid for 1 hour)
    const downloadUrl = await minioClient.presignedGetObject(
      bucketName,
      storageKey,
      60 * 60
    );

    // Log analytics
    await db.analyticsEvent.create({
      data: {
        userId: user.id,
        caseId: input.caseId,
        event: "case_packet_downloaded",
        metadata: { packetType: input.packetType },
      },
    });

    return { downloadUrl, filename };
  });
