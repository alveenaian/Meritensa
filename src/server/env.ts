import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production"]),
  
  // Database
  DATABASE_URL: z.string(),
  
  BASE_URL: z.string().optional(),
  BASE_URL_OTHER_PORT: z.string().optional(),
  ADMIN_PASSWORD: z.string(),
  
  // AI APIs
  ANTHROPIC_API_KEY: z.string(),
  ANTHROPIC_MODEL: z.string().default("claude-sonnet-4-6"),
  
  // Stripe (optional for MVP, all features are FREE by default)
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  
  // Google OAuth (optional)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  
  // App URL for payment redirects
  NEXT_PUBLIC_APP_URL: z.string().optional().default("http://localhost:3000"),
  
  // Authentication
  NEXTAUTH_SECRET: z.string().min(32, "NEXTAUTH_SECRET must be at least 32 characters for security"),
  
  // Email (optional for MVP)
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().optional().default("noreply@kairav.ai"),
  
  // Error Tracking (optional)
  SENTRY_DSN: z.string().optional(),
  SENTRY_ENVIRONMENT: z.string().optional().default("production"),
  
  // Analytics (optional)
  GA_MEASUREMENT_ID: z.string().optional(),
  FB_PIXEL_ID: z.string().optional(),
});

export const env = envSchema.parse(process.env);
