import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { baseProcedure } from "~/server/trpc/main";
import { db } from "~/server/db";

export const joinWaitlistStepOne = baseProcedure
  .input(
    z.object({
      email: z.string().email("Invalid email address"),
    })
  )
  .mutation(async ({ input }) => {
    // Check if email already exists in waitlist
    const existingEntry = await db.waitlistEntry.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (existingEntry) {
      // If they already completed step 2, tell them they're already on the list
      if (existingEntry.completedStepTwo) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "You're already on our waitlist! We'll notify you when we launch.",
        });
      }
      // If they only completed step 1, return their ID so they can complete step 2
      return {
        id: existingEntry.id,
        email: existingEntry.email,
        alreadyExists: true,
      };
    }

    // Create new waitlist entry
    const entry = await db.waitlistEntry.create({
      data: {
        email: input.email.toLowerCase(),
      },
      select: {
        id: true,
        email: true,
      },
    });

    // Log analytics event
    await db.analyticsEvent.create({
      data: {
        event: "waitlist_step_one_completed",
        metadata: { email: entry.email },
      },
    });

    return {
      id: entry.id,
      email: entry.email,
      alreadyExists: false,
    };
  });

export const updateWaitlistStepTwo = baseProcedure
  .input(
    z.object({
      id: z.string(),
      firstName: z.string().min(1, "First name is required"),
      lastName: z.string().min(1, "Last name is required"),
      interest: z.enum(["PLAINTIFF", "LAWYER", "INVESTOR", "OTHER"], {
        errorMap: () => ({ message: "Please select your interest" }),
      }),
      comments: z.string().optional(),
    })
  )
  .mutation(async ({ input }) => {
    // Find the waitlist entry
    const entry = await db.waitlistEntry.findUnique({
      where: { id: input.id },
    });

    if (!entry) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Waitlist entry not found",
      });
    }

    // Update with step 2 information
    const updatedEntry = await db.waitlistEntry.update({
      where: { id: input.id },
      data: {
        firstName: input.firstName,
        lastName: input.lastName,
        interest: input.interest,
        comments: input.comments || null,
        completedStepTwo: true,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        interest: true,
      },
    });

    // Log analytics event
    await db.analyticsEvent.create({
      data: {
        event: "waitlist_step_two_completed",
        metadata: {
          email: updatedEntry.email,
          interest: updatedEntry.interest,
        },
      },
    });

    return {
      success: true,
      entry: updatedEntry,
    };
  });
