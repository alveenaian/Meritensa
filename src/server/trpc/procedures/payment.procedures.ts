import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { baseProcedure } from "~/server/trpc/main";
import { db } from "~/server/db";
import { requireAuth } from "~/lib/auth/session";
import { unlockFeature } from "~/lib/features/access";
import { env } from "~/server/env";

// Only import Stripe if keys are configured
let stripe: any = null;
if (env.STRIPE_SECRET_KEY) {
  const Stripe = require("stripe");
  stripe = new Stripe(env.STRIPE_SECRET_KEY);
}

export const createCheckoutSession = baseProcedure
  .input(
    z.object({
      token: z.string(),
      featureKey: z.string(),
      caseId: z.string().optional(),
    })
  )
  .mutation(async ({ input }) => {
    const user = await requireAuth(input.token);

    if (!stripe) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Payment system not configured",
      });
    }

    const feature = await db.featureConfig.findUnique({
      where: { featureKey: input.featureKey },
    });

    if (!feature || feature.accessType !== "PAYMENT_REQUIRED") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Feature does not require payment",
      });
    }

    if (!feature.price) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Feature price not configured",
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: feature.name,
              description: feature.description || undefined,
            },
            unit_amount: Math.round(feature.price * 100), // Cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${env.NEXT_PUBLIC_APP_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${env.NEXT_PUBLIC_APP_URL}/payment/cancel`,
      metadata: {
        userId: user.id,
        featureKey: input.featureKey,
        caseId: input.caseId || "",
      },
    });

    return { sessionId: session.id, url: session.url };
  });

export const verifyPayment = baseProcedure
  .input(
    z.object({
      token: z.string(),
      sessionId: z.string(),
    })
  )
  .mutation(async ({ input }) => {
    const user = await requireAuth(input.token);

    if (!stripe) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Payment system not configured",
      });
    }

    const session = await stripe.checkout.sessions.retrieve(input.sessionId);

    if (session.payment_status !== "paid") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Payment not completed",
      });
    }

    if (session.metadata?.userId !== user.id) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Payment does not belong to this user",
      });
    }

    // Unlock the feature
    await unlockFeature(
      user.id,
      session.metadata.featureKey,
      "payment",
      session.payment_intent as string
    );

    // Log analytics event
    await db.analyticsEvent.create({
      data: {
        userId: user.id,
        event: "feature_unlocked",
        metadata: {
          featureKey: session.metadata.featureKey,
          via: "payment",
          amount: session.amount_total ? session.amount_total / 100 : 0,
        },
      },
    });

    return { success: true };
  });
