import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { baseProcedure } from "~/server/trpc/main";
import { db } from "~/server/db";
import { requireAdmin, generateToken } from "~/lib/auth/session";
import { sendEmail } from "~/lib/email/send";
import { referralStatusUpdateEmail } from "~/lib/email/templates";

export const getAnalyticsSummary = baseProcedure
  .input(
    z.object({
      token: z.string(),
    })
  )
  .query(async ({ input }) => {
    await requireAdmin(input.token);

    // Get counts
    const [totalUsers, totalCases, totalDocuments, totalEvents] = await Promise.all([
      db.user.count(),
      db.case.count(),
      db.document.count(),
      db.analyticsEvent.count(),
    ]);

    const referralRequestsCount = await db.case.count({
      where: {
        referralRequested: true,
      },
    });

    // Get cases by status
    const casesByStatus = await db.case.groupBy({
      by: ["status"],
      _count: true,
    });

    // Get recent cases (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentCases = await db.case.count({
      where: {
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
    });

    // Get average case score
    const caseScores = await db.case.aggregate({
      _avg: {
        overallScore: true,
      },
      where: {
        overallScore: {
          not: null,
        },
      },
    });

    // Get score distribution
    const scoreRanges = [
      { min: 0, max: 25, label: "0-25" },
      { min: 26, max: 50, label: "26-50" },
      { min: 51, max: 75, label: "51-75" },
      { min: 76, max: 100, label: "76-100" },
    ];

    const scoreDistribution = await Promise.all(
      scoreRanges.map(async (range) => {
        const count = await db.case.count({
          where: {
            overallScore: {
              gte: range.min,
              lte: range.max,
            },
          },
        });
        return {
          label: range.label,
          count,
        };
      })
    );

    return {
      totalUsers,
      totalCases,
      totalDocuments,
      totalEvents,
      referralRequestsCount,
      recentCases,
      averageScore: caseScores._avg.overallScore || 0,
      casesByStatus: casesByStatus.map((item) => ({
        status: item.status,
        count: item._count,
      })),
      scoreDistribution,
    };
  });

export const getRecentActivity = baseProcedure
  .input(
    z.object({
      token: z.string(),
      limit: z.number().optional().default(50),
    })
  )
  .query(async ({ input }) => {
    await requireAdmin(input.token);

    const events = await db.analyticsEvent.findMany({
      take: input.limit,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        _count: true,
      },
    });

    return events;
  });

export const getAllCases = baseProcedure
  .input(
    z.object({
      token: z.string(),
      status: z.enum([
        "INTAKE",
        "INTAKE_COMPLETE",
        "UNDER_REVIEW",
        "REFERRAL_PENDING",
        "REFERRED",
        "CLOSED",
      ]).optional(),
      referralRequested: z.boolean().optional(),
      limit: z.number().optional().default(50),
      offset: z.number().optional().default(0),
    })
  )
  .query(async ({ input }) => {
    await requireAdmin(input.token);

    const where: any = {};
    if (input.status) {
      where.status = input.status;
    }
    // Support filtering by referral requests
    if (input.referralRequested !== undefined) {
      where.referralRequested = input.referralRequested;
    }

    const [cases, total] = await Promise.all([
      db.case.findMany({
        where,
        take: input.limit,
        skip: input.offset,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          _count: {
            select: {
              documents: true,
              messages: true,
            },
          },
        },
      }),
      db.case.count({ where }),
    ]);

    return {
      cases,
      total,
      hasMore: input.offset + input.limit < total,
    };
  });

export const updateCaseStatus = baseProcedure
  .input(
    z.object({
      token: z.string(),
      caseId: z.string(),
      status: z.enum([
        "INTAKE",
        "INTAKE_COMPLETE",
        "UNDER_REVIEW",
        "REFERRAL_PENDING",
        "REFERRED",
        "CLOSED",
      ]),
      notes: z.string().optional(),
    })
  )
  .mutation(async ({ input }) => {
    const admin = await requireAdmin(input.token);

    const caseRecord = await db.case.findUnique({
      where: { id: input.caseId },
    });

    if (!caseRecord) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Case not found",
      });
    }

    // Update case status
    const updatedCase = await db.case.update({
      where: { id: input.caseId },
      data: {
        status: input.status,
      },
    });

    // Add admin comment if notes provided
    if (input.notes) {
      await db.adminComment.create({
        data: {
          caseId: input.caseId,
          adminId: admin.id,
          content: input.notes,
          isInternal: true,
        },
      });
    }

    // Log the event
    await db.analyticsEvent.create({
      data: {
        userId: admin.id,
        caseId: input.caseId,
        event: "ADMIN_STATUS_UPDATE",
        metadata: {
          oldStatus: caseRecord.status,
          newStatus: input.status,
          adminEmail: admin.email,
        },
      },
    });

    // Send email notification if status changed to referral-related status
    if (
      input.status === "REFERRED" ||
      (updatedCase.referralStatus && 
       ["UNDER_REVIEW", "MATCHED", "ACCEPTED", "DECLINED"].includes(updatedCase.referralStatus))
    ) {
      const caseWithUser = await db.case.findUnique({
        where: { id: input.caseId },
        include: { user: true },
      });

      if (caseWithUser) {
        const emailTemplate = referralStatusUpdateEmail({
          name: caseWithUser.user.name || "User",
          caseTitle: caseWithUser.title,
          status: updatedCase.referralStatus || input.status,
          message: input.notes,
        });

        await sendEmail({
          to: caseWithUser.user.email,
          subject: emailTemplate.subject,
          html: emailTemplate.html,
          text: emailTemplate.text,
        });
      }
    }

    return updatedCase;
  });

export const getAdminCaseDetails = baseProcedure
  .input(
    z.object({
      token: z.string(),
      caseId: z.string(),
    })
  )
  .query(async ({ input }) => {
    await requireAdmin(input.token);

    const caseData = await db.case.findUnique({
      where: { id: input.caseId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            state: true,
            city: true,
          },
        },
        messages: {
          orderBy: {
            createdAt: "asc",
          },
        },
        documents: {
          orderBy: {
            uploadedAt: "desc",
          },
        },
        causesOfAction: true,
        adminComments: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!caseData) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Case not found",
      });
    }

    return caseData;
  });

export const addAdminComment = baseProcedure
  .input(
    z.object({
      token: z.string(),
      caseId: z.string(),
      content: z.string(),
      isInternal: z.boolean().default(true),
    })
  )
  .mutation(async ({ input }) => {
    const admin = await requireAdmin(input.token);

    const comment = await db.adminComment.create({
      data: {
        caseId: input.caseId,
        adminId: admin.id,
        content: input.content,
        isInternal: input.isInternal,
      },
    });

    return comment;
  });

export const getFeatureConfigs = baseProcedure
  .input(
    z.object({
      token: z.string(),
    })
  )
  .query(async ({ input }) => {
    await requireAdmin(input.token);

    const features = await db.featureConfig.findMany({
      orderBy: {
        name: "asc",
      },
    });

    return features;
  });

export const updateFeatureConfig = baseProcedure
  .input(
    z.object({
      token: z.string(),
      featureKey: z.string(),
      isEnabled: z.boolean().optional(),
      accessType: z.enum(["FREE", "REFERRAL_REQUIRED", "PAYMENT_REQUIRED"]).optional(),
      price: z.number().nullable().optional(),
    })
  )
  .mutation(async ({ input }) => {
    await requireAdmin(input.token);

    const updateData: any = {};
    if (input.isEnabled !== undefined) {
      updateData.isEnabled = input.isEnabled;
    }
    if (input.accessType !== undefined) {
      updateData.accessType = input.accessType;
    }
    if (input.price !== undefined) {
      updateData.price = input.price;
    }

    const feature = await db.featureConfig.update({
      where: { featureKey: input.featureKey },
      data: updateData,
    });

    return feature;
  });

export const impersonateUser = baseProcedure
  .input(
    z.object({
      token: z.string(),
      userId: z.string(),
    })
  )
  .mutation(async ({ input }) => {
    const admin = await requireAdmin(input.token);

    // Get target user
    const targetUser = await db.user.findUnique({
      where: { id: input.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        state: true,
      },
    });

    if (!targetUser) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    // Prevent impersonating other admins
    if (targetUser.role === "ADMIN") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Cannot impersonate other administrators",
      });
    }

    // Generate a new session token for the target user with impersonation tracking
    const { token: impersonationToken } = await generateToken(
      {
        userId: targetUser.id,
        email: targetUser.email,
        role: targetUser.role,
      },
      {
        impersonatedBy: admin.id, // Track which admin is impersonating
      }
    );

    // Log the impersonation event
    await db.analyticsEvent.create({
      data: {
        userId: admin.id,
        event: "ADMIN_IMPERSONATION",
        metadata: {
          adminEmail: admin.email,
          targetUserId: targetUser.id,
          targetUserEmail: targetUser.email,
        },
      },
    });

    return {
      token: impersonationToken,
      user: targetUser,
    };
  });

export const exportAllCasesCsv = baseProcedure
  .input(
    z.object({
      token: z.string(),
      status: z.enum([
        "INTAKE",
        "INTAKE_COMPLETE",
        "UNDER_REVIEW",
        "REFERRAL_PENDING",
        "REFERRED",
        "CLOSED",
      ]).optional(),
    })
  )
  .query(async ({ input }) => {
    await requireAdmin(input.token);

    const where: any = {};
    if (input.status) {
      where.status = input.status;
    }

    const cases = await db.case.findMany({
      where,
      include: {
        user: {
          select: {
            email: true,
            name: true,
          },
        },
        _count: {
          select: {
            documents: true,
            messages: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Generate CSV content
    const headers = [
      "Case ID",
      "Title",
      "Case Type",
      "Status",
      "User Email",
      "User Name",
      "Created At",
      "Overall Score",
      "Evidence Score",
      "Liability Score",
      "Damages Score",
      "Collectability",
      "Estimated Damages",
      "Referral Requested",
      "Referral Status",
      "Documents Count",
      "Messages Count",
      "State",
      "Incident Date",
    ];

    const rows = cases.map((c) => [
      c.id,
      `"${c.title.replace(/"/g, '""')}"`,
      c.caseType,
      c.status,
      c.user.email,
      c.user.name || "",
      c.createdAt.toISOString(),
      c.overallScore?.toFixed(2) || "",
      c.evidenceScore?.toFixed(2) || "",
      c.liabilityScore?.toFixed(2) || "",
      c.damagesScore?.toFixed(2) || "",
      c.collectability?.toFixed(2) || "",
      c.estimatedDamages?.toFixed(2) || "",
      c.referralRequested ? "Yes" : "No",
      c.referralStatus || "",
      c._count.documents,
      c._count.messages,
      c.state || "",
      c.incidentDate?.toISOString().split("T")[0] || "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    return {
      csv: csvContent,
      filename: `kairav-cases-export-${new Date().toISOString().split("T")[0]}.csv`,
    };
  });

export const getSystemHealth = baseProcedure
  .input(
    z.object({
      token: z.string(),
    })
  )
  .query(async ({ input }) => {
    await requireAdmin(input.token);

    const health = {
      database: { status: "unknown" as "healthy" | "unhealthy" | "unknown", message: "" },
      minio: { status: "unknown" as "healthy" | "unhealthy" | "unknown", message: "" },
      anthropic: { status: "unknown" as "healthy" | "unhealthy" | "unknown", message: "" },
      timestamp: new Date().toISOString(),
    };

    // Check database
    try {
      await db.$queryRaw`SELECT 1`;
      health.database.status = "healthy";
      health.database.message = "Database connection successful";
    } catch (error) {
      health.database.status = "unhealthy";
      health.database.message = `Database error: ${error instanceof Error ? error.message : "Unknown error"}`;
    }

    // Check Minio
    try {
      const { minioClient } = await import("~/server/minio");
      await minioClient.listBuckets();
      health.minio.status = "healthy";
      health.minio.message = "Object storage connection successful";
    } catch (error) {
      health.minio.status = "unhealthy";
      health.minio.message = `Minio error: ${error instanceof Error ? error.message : "Unknown error"}`;
    }

    // Check Anthropic API
    try {
      const { env } = await import("~/server/env");
      if (env.ANTHROPIC_API_KEY) {
        health.anthropic.status = "healthy";
        health.anthropic.message = "API key configured";
      } else {
        health.anthropic.status = "unhealthy";
        health.anthropic.message = "API key not configured";
      }
    } catch (error) {
      health.anthropic.status = "unhealthy";
      health.anthropic.message = `Configuration error: ${error instanceof Error ? error.message : "Unknown error"}`;
    }

    return health;
  });
