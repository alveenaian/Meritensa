import { z } from "zod";
import { TRPCError } from "@trpc/server";
import crypto from "crypto";
import { baseProcedure } from "~/server/trpc/main";
import { db } from "~/server/db";
import { hashPassword, verifyPassword, validatePassword } from "~/lib/auth/password";
import { generateToken, requireAuth } from "~/lib/auth/session";
import { sendEmail } from "~/lib/email/send";
import { welcomeEmail, emailVerificationEmail, passwordResetEmail } from "~/lib/email/templates";
import { getBaseUrl } from "~/server/utils/base-url";
import { checkRateLimit } from "~/lib/utils/rate-limit";

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
] as const;

export const register = baseProcedure
  .input(
    z.object({
      email: z.string().email("Invalid email address"),
      password: z.string().min(8, "Password must be at least 8 characters"),
      name: z.string().min(1, "Name is required"),
      state: z.enum(US_STATES, {
        errorMap: () => ({ message: "Please select a valid US state" }),
      }),
    })
  )
  .mutation(async ({ input }) => {
    // Rate limit: 5 registrations per email per 15 minutes
    const rateLimitKey = `register:${input.email.toLowerCase()}`;
    if (!checkRateLimit(rateLimitKey, 5, 15 * 60 * 1000)) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: "Too many registration attempts. Please try again in 15 minutes.",
      });
    }

    // Validate password strength
    const passwordValidation = validatePassword(input.password);
    if (!passwordValidation.valid) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: passwordValidation.errors.join(", "),
      });
    }

    // Check if email already exists
    const existingUser = await db.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (existingUser) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "An account with this email already exists",
      });
    }

    // Hash password
    const passwordHash = await hashPassword(input.password);

    // Create user
    const user = await db.user.create({
      data: {
        email: input.email.toLowerCase(),
        passwordHash,
        name: input.name,
        state: input.state,
        role: "PLAINTIFF",
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        state: true,
      },
    });

    // Generate session token
    const session = await generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Log analytics event
    await db.analyticsEvent.create({
      data: {
        userId: user.id,
        event: "user_registered",
        metadata: { state: user.state },
      },
    });

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const hashedVerificationToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
    const verificationExpiry = new Date();
    verificationExpiry.setHours(verificationExpiry.getHours() + 24); // 24 hour expiry

    await db.verificationToken.create({
      data: {
        identifier: user.email,
        token: hashedVerificationToken,
        expires: verificationExpiry,
      },
    });

    // Send welcome email
    const welcomeTemplate = welcomeEmail({
      name: user.name,
      email: user.email,
    });
    await sendEmail({
      to: user.email,
      subject: welcomeTemplate.subject,
      html: welcomeTemplate.html,
      text: welcomeTemplate.text,
    });

    // Send verification email
    const baseUrl = getBaseUrl();
    const verificationUrl = `${baseUrl}/verify-email?token=${verificationToken}`;
    const verificationTemplate = emailVerificationEmail({
      name: user.name,
      verificationUrl,
    });
    await sendEmail({
      to: user.email,
      subject: verificationTemplate.subject,
      html: verificationTemplate.html,
      text: verificationTemplate.text,
    });

    return {
      user,
      token: session.token,
    };
  });

export const login = baseProcedure
  .input(
    z.object({
      email: z.string().email("Invalid email address"),
      password: z.string().min(1, "Password is required"),
    })
  )
  .mutation(async ({ input }) => {
    // Rate limit: 5 login attempts per email per 15 minutes
    const rateLimitKey = `login:${input.email.toLowerCase()}`;
    if (!checkRateLimit(rateLimitKey, 5, 15 * 60 * 1000)) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: "Too many login attempts. Please try again in 15 minutes.",
      });
    }

    // Find user
    const user = await db.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (!user || !user.passwordHash) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid email or password",
      });
    }

    // Verify password
    const isValid = await verifyPassword(input.password, user.passwordHash);

    if (!isValid) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid email or password",
      });
    }

    // Generate session token
    const session = await generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Log analytics event
    await db.analyticsEvent.create({
      data: {
        userId: user.id,
        event: "user_login",
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        state: user.state,
      },
      token: session.token,
    };
  });

export const logout = baseProcedure
  .input(
    z.object({
      token: z.string(),
    })
  )
  .mutation(async ({ input }) => {
    // Don't verify the token - just try to revoke it
    // This allows logout to work even if the token is expired
    const { revokeSession } = await import("~/lib/auth/session");
    
    try {
      await revokeSession(input.token);
    } catch (error) {
      // Silently fail - the important thing is that the client clears its state
      console.log("Session revocation failed (token may be invalid):", error);
    }

    return { success: true };
  });

export const getCurrentUser = baseProcedure
  .input(
    z.object({
      token: z.string(),
    })
  )
  .query(async ({ input }) => {
    const user = await requireAuth(input.token);
    return user;
  });

export const forgotPassword = baseProcedure
  .input(
    z.object({
      email: z.string().email("Invalid email address"),
    })
  )
  .mutation(async ({ input, ctx }) => {
    // Rate limit: 3 requests per IP per hour (use a placeholder IP key for now)
    // In production, extract real IP from ctx or headers
    const ipKey = `forgot-password:ip:${ctx?.ip || 'unknown'}`;
    if (!checkRateLimit(ipKey, 3, 60 * 60 * 1000)) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: "Too many password reset requests. Please try again in an hour.",
      });
    }

    // Find user
    const user = await db.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return { success: true };
    }

    // Generate reset token (unhashed for email link)
    const resetToken = crypto.randomBytes(32).toString("hex");
    // Hash the token for database storage
    const hashedResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetExpiry = new Date();
    resetExpiry.setHours(resetExpiry.getHours() + 1); // 1 hour expiry

    // Store hashed token in database
    await db.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: hashedResetToken,
        passwordResetExpiresAt: resetExpiry,
      },
    });

    // Send reset email with unhashed token
    const baseUrl = getBaseUrl();
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;
    const resetTemplate = passwordResetEmail({
      name: user.name || "User",
      resetUrl,
    });
    await sendEmail({
      to: user.email,
      subject: resetTemplate.subject,
      html: resetTemplate.html,
      text: resetTemplate.text,
    });

    return { success: true };
  });

export const resetPassword = baseProcedure
  .input(
    z.object({
      token: z.string(),
      password: z.string().min(8, "Password must be at least 8 characters"),
    })
  )
  .mutation(async ({ input }) => {
    // Rate limit: 5 reset attempts per token per 15 minutes
    const rateLimitKey = `reset-password:${input.token}`;
    if (!checkRateLimit(rateLimitKey, 5, 15 * 60 * 1000)) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: "Too many reset attempts. Please try again in 15 minutes.",
      });
    }

    // Validate password strength
    const passwordValidation = validatePassword(input.password);
    if (!passwordValidation.valid) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: passwordValidation.errors.join(", "),
      });
    }

    // Hash the incoming token to match database
    const hashedToken = crypto.createHash('sha256').update(input.token).digest('hex');

    // Find user with this hashed token
    const user = await db.user.findFirst({
      where: {
        passwordResetToken: hashedToken,
        passwordResetExpiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Invalid or expired reset token",
      });
    }

    // Hash new password
    const passwordHash = await hashPassword(input.password);

    // Update password and clear reset token
    await db.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpiresAt: null,
      },
    });

    return { success: true };
  });

export const verifyEmail = baseProcedure
  .input(
    z.object({
      token: z.string(),
    })
  )
  .mutation(async ({ input }) => {
    // Hash the incoming token to match database
    const hashedToken = crypto.createHash('sha256').update(input.token).digest('hex');

    // Find verification token
    const verificationToken = await db.verificationToken.findUnique({
      where: { token: hashedToken },
    });

    if (!verificationToken) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Invalid verification token",
      });
    }

    // Check if expired
    if (verificationToken.expires < new Date()) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Verification token has expired",
      });
    }

    // Update user
    await db.user.update({
      where: { email: verificationToken.identifier },
      data: {
        emailVerified: new Date(),
      },
    });

    // Delete the token
    await db.verificationToken.delete({
      where: { token: hashedToken },
    });

    return { success: true };
  });

export const updateProfile = baseProcedure
  .input(
    z.object({
      token: z.string(),
      name: z.string().min(1, "Name is required").optional(),
      state: z.enum(US_STATES, {
        errorMap: () => ({ message: "Please select a valid US state" }),
      }).optional(),
    })
  )
  .mutation(async ({ input }) => {
    const user = await requireAuth(input.token);

    const updateData: any = {};
    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    if (input.state !== undefined) {
      updateData.state = input.state;
    }

    if (Object.keys(updateData).length === 0) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "No fields to update",
      });
    }

    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        state: true,
      },
    });

    return updatedUser;
  });

export const changePassword = baseProcedure
  .input(
    z.object({
      token: z.string(),
      currentPassword: z.string().min(1, "Current password is required"),
      newPassword: z.string().min(8, "Password must be at least 8 characters"),
    })
  )
  .mutation(async ({ input }) => {
    const user = await requireAuth(input.token);

    // Get user with password hash
    const userWithPassword = await db.user.findUnique({
      where: { id: user.id },
      select: { passwordHash: true },
    });

    if (!userWithPassword || !userWithPassword.passwordHash) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "User does not have a password set",
      });
    }

    // Verify current password
    const isValid = await verifyPassword(
      input.currentPassword,
      userWithPassword.passwordHash
    );

    if (!isValid) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Current password is incorrect",
      });
    }

    // Validate new password strength
    const passwordValidation = validatePassword(input.newPassword);
    if (!passwordValidation.valid) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: passwordValidation.errors.join(", "),
      });
    }

    // Hash new password
    const newPasswordHash = await hashPassword(input.newPassword);

    // Update password
    await db.user.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash },
    });

    // Revoke all sessions for this user (force re-login on all devices)
    const { revokeAllUserSessions } = await import("~/lib/auth/session");
    await revokeAllUserSessions(user.id);

    return { success: true };
  });

export const deleteAccount = baseProcedure
  .input(
    z.object({
      token: z.string(),
      password: z.string().min(1, "Password is required for account deletion"),
    })
  )
  .mutation(async ({ input }) => {
    const user = await requireAuth(input.token);

    // Get user with password hash
    const userWithPassword = await db.user.findUnique({
      where: { id: user.id },
      select: { 
        passwordHash: true,
        email: true,
        name: true,
      },
    });

    if (!userWithPassword || !userWithPassword.passwordHash) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "User does not have a password set",
      });
    }

    // Verify password
    const isValid = await verifyPassword(
      input.password,
      userWithPassword.passwordHash
    );

    if (!isValid) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Incorrect password",
      });
    }

    // Log the deletion event before deleting
    await db.analyticsEvent.create({
      data: {
        userId: user.id,
        event: "user_account_deleted",
        metadata: {
          email: userWithPassword.email,
          name: userWithPassword.name,
          deletedAt: new Date().toISOString(),
        },
      },
    });

    // Revoke all sessions for this user before deletion
    const { revokeAllUserSessions } = await import("~/lib/auth/session");
    await revokeAllUserSessions(user.id);

    // Delete the user (cascading deletes will handle related records)
    await db.user.delete({
      where: { id: user.id },
    });

    return { success: true };
  });
