import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { baseProcedure } from "~/server/trpc/main";
import { db } from "~/server/db";
import { requireAdmin } from "~/lib/auth/session";

export const getAllUsers = baseProcedure
  .input(
    z.object({
      token: z.string(),
      search: z.string().optional(),
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(20),
    })
  )
  .query(async ({ input }) => {
    await requireAdmin(input.token);

    const where: any = {};
    if (input.search) {
      where.OR = [
        { email: { contains: input.search, mode: "insensitive" } },
        { name: { contains: input.search, mode: "insensitive" } },
      ];
    }

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        skip: (input.page - 1) * input.limit,
        take: input.limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          email: true,
          name: true,
          state: true,
          role: true,
          emailVerified: true,
          createdAt: true,
          _count: {
            select: {
              cases: true,
            },
          },
        },
      }),
      db.user.count({ where }),
    ]);

    return {
      users,
      pagination: {
        page: input.page,
        limit: input.limit,
        total,
        pages: Math.ceil(total / input.limit),
      },
    };
  });

export const getUserDetails = baseProcedure
  .input(
    z.object({
      token: z.string(),
      userId: z.string(),
    })
  )
  .query(async ({ input }) => {
    await requireAdmin(input.token);

    const user = await db.user.findUnique({
      where: { id: input.userId },
      include: {
        cases: {
          orderBy: { createdAt: "desc" },
          take: 10,
          select: {
            id: true,
            title: true,
            caseType: true,
            status: true,
            overallScore: true,
            createdAt: true,
            _count: {
              select: {
                documents: true,
                messages: true,
              },
            },
          },
        },
        _count: {
          select: {
            cases: true,
          },
        },
      },
    });

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    return user;
  });

export const updateUserRole = baseProcedure
  .input(
    z.object({
      token: z.string(),
      userId: z.string(),
      role: z.enum(["PLAINTIFF", "ADMIN"]),
    })
  )
  .mutation(async ({ input }) => {
    const admin = await requireAdmin(input.token);

    // Prevent self-demotion
    if (admin.id === input.userId && input.role === "PLAINTIFF") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "You cannot demote yourself from admin",
      });
    }

    const user = await db.user.update({
      where: { id: input.userId },
      data: { role: input.role },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    // Log the event
    await db.analyticsEvent.create({
      data: {
        userId: admin.id,
        event: "ADMIN_ROLE_CHANGE",
        metadata: {
          targetUserId: input.userId,
          targetUserEmail: user.email,
          newRole: input.role,
          adminEmail: admin.email,
        },
      },
    });

    return user;
  });
