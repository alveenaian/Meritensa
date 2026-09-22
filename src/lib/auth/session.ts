import crypto from "crypto";
import jwt from "jsonwebtoken";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { env } from "~/server/env";

export interface SessionPayload {
  userId: string;
  email: string;
  role: string;
  impersonatedBy?: string; // Admin user ID if this is an impersonation session
}

export interface SessionToken {
  token: string;
  expiresAt: Date;
}

const JWT_SECRET = env.NEXTAUTH_SECRET;
const TOKEN_EXPIRY = "7d"; // 7 days

export async function generateToken(
  payload: SessionPayload,
  options?: { impersonatedBy?: string }
): Promise<SessionToken> {
  // If impersonating, use shorter expiry and add to payload
  const isImpersonation = options?.impersonatedBy !== undefined;
  const expiry = isImpersonation ? "15m" : TOKEN_EXPIRY; // 15 minutes for impersonation, 7 days for normal
  
  const fullPayload: SessionPayload = {
    ...payload,
    ...(isImpersonation && { impersonatedBy: options.impersonatedBy }),
  };

  const token = jwt.sign(fullPayload, JWT_SECRET, {
    expiresIn: expiry,
  });

  const expiresAt = new Date();
  if (isImpersonation) {
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);
  } else {
    expiresAt.setDate(expiresAt.getDate() + 7);
  }

  // Hash the token before storing in database
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  // Create session record in database with hashed token for server-side revocation
  await db.session.create({
    data: {
      sessionToken: hashedToken,
      userId: payload.userId,
      expires: expiresAt,
    },
  });

  return { token, expiresAt };
}

export async function verifyToken(token: string): Promise<SessionPayload> {
  try {
    // First verify JWT signature and expiry
    const payload = jwt.verify(token, JWT_SECRET) as SessionPayload;
    
    // Hash the token to match database storage
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    
    // Then check if session exists in database (server-side revocation check)
    const session = await db.session.findUnique({
      where: { sessionToken: hashedToken },
    });

    if (!session) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Session has been revoked or does not exist",
      });
    }

    // Check if session has expired
    if (session.expires < new Date()) {
      // Clean up expired session
      await db.session.delete({
        where: { sessionToken: hashedToken },
      });
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Session has expired",
      });
    }

    return payload;
  } catch (error) {
    if (error instanceof TRPCError) {
      throw error;
    }
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Invalid or expired token",
    });
  }
}

export async function revokeSession(token: string): Promise<void> {
  // Hash the token to match database storage
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  
  await db.session.delete({
    where: { sessionToken: hashedToken },
  }).catch(() => {
    // Ignore errors if session doesn't exist
  });
}

export async function revokeAllUserSessions(userId: string): Promise<void> {
  await db.session.deleteMany({
    where: { userId },
  });
}

export async function requireAuth(token: string | undefined) {
  if (!token) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required",
    });
  }

  const payload = await verifyToken(token);

  const user = await db.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      state: true,
    },
  });

  if (!user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "User not found",
    });
  }

  return user;
}

export async function requireAdmin(token: string | undefined) {
  const user = await requireAuth(token);

  if (user.role !== "ADMIN") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Admin access required",
    });
  }

  return user;
}
