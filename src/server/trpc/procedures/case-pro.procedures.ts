import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { baseProcedure } from "~/server/trpc/main";
import { db } from "~/server/db";
import { requireAuth } from "~/lib/auth/session";
import { requireCaseAccess } from "~/lib/auth/case-access";

export const generateProAnalysis = baseProcedure
  .input(
    z.object({
      token: z.string(),
      caseId: z.string(),
    })
  )
  .mutation(async ({ input }) => {
    const user = await requireAuth(input.token);

    const caseRecord = await requireCaseAccess(user.id, input.caseId);

    if (caseRecord.stage !== "COMPLETE") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Basic analysis must be completed first",
      });
    }

    // Generate the pro packet
    const { generateProPacket } = await import("~/lib/ai/pro-analysis-pipeline");
    const proResults = await generateProPacket(input.caseId);

    // Save results
    await db.case.update({
      where: { id: input.caseId },
      data: {
        proAnalysisResults: proResults as any,
      },
    });

    // Log analytics
    await db.analyticsEvent.create({
      data: {
        userId: user.id,
        caseId: input.caseId,
        event: "pro_analysis_generated",
        metadata: {
          totalTokens: proResults.totalTokens,
        },
      },
    });

    return { success: true };
  });
