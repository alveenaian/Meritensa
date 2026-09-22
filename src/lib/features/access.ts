import { db } from "~/server/db";
import { AccessType } from "@prisma/client";

export async function canAccessFeature(
  userId: string,
  featureKey: string
): Promise<{ allowed: boolean; reason?: string; price?: number }> {
  // Get feature config
  const feature = await db.featureConfig.findUnique({
    where: { featureKey },
  });

  if (!feature || !feature.isEnabled) {
    return { allowed: false, reason: "Feature not available" };
  }

  // FREE features are always accessible
  if (feature.accessType === "FREE") {
    return { allowed: true };
  }

  // Check if user has unlocked this feature
  const unlock = await db.userFeatureUnlock.findUnique({
    where: {
      userId_featureKey: { userId, featureKey },
    },
  });

  if (unlock) {
    return { allowed: true };
  }

  // Not unlocked — return requirements
  if (feature.accessType === "REFERRAL_REQUIRED") {
    return {
      allowed: false,
      reason: "Requires referral request",
    };
  }

  if (feature.accessType === "PAYMENT_REQUIRED") {
    return {
      allowed: false,
      reason: "Requires payment",
      price: feature.price ?? undefined,
    };
  }

  return { allowed: false, reason: "Access denied" };
}

export async function unlockFeature(
  userId: string,
  featureKey: string,
  via: "referral" | "payment" | "admin_grant",
  paymentId?: string
) {
  return db.userFeatureUnlock.create({
    data: {
      userId,
      featureKey,
      unlockedVia: via,
      paymentId,
    },
  });
}

export async function canCreateCase(userId: string): Promise<boolean> {
  const access = await canAccessFeature(userId, "unlimited_cases");
  if (access.allowed) return true;

  // Check current case count
  const caseCount = await db.case.count({
    where: { userId, status: { not: "CLOSED" } },
  });

  return caseCount < 3; // Free tier limit
}
