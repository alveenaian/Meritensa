import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";

/**
 * Verify that a user has access to a case.
 * Throws NOT_FOUND if the case doesn't exist or the user doesn't own it.
 * 
 * @param userId - The ID of the user attempting to access the case
 * @param caseId - The ID of the case to access
 * @returns The case record if access is granted
 * @throws TRPCError with code NOT_FOUND if access is denied
 */
export async function requireCaseAccess(userId: string, caseId: string) {
  const caseRecord = await db.case.findFirst({
    where: {
      id: caseId,
      userId,
    },
  });

  if (!caseRecord) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Case not found",
    });
  }

  return caseRecord;
}
