import { baseProcedure } from "~/server/trpc/main";
import { db } from "~/server/db";

export const healthCheck = baseProcedure.query(async () => {
  // Check database connectivity
  try {
    await db.$queryRaw`SELECT 1`;
  } catch (error) {
    throw new Error("Database connection failed");
  }

  return {
    status: "ok",
    timestamp: new Date().toISOString(),
  };
});
