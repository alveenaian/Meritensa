import { env } from "~/server/env";

/**
 * Centralized AI configuration.
 * 
 * Model IDs are subject to change as Anthropic retires older snapshots.
 * By centralizing this configuration, we can update the model in one place
 * when needed.
 * 
 * Current recommended models:
 * - claude-sonnet-4-6: Strong reasoning, good for legal analysis (default)
 * - claude-haiku-4-5-20251001: Fast/cheap, good for conversational intake
 */
export const AI_CONFIG = {
  /**
   * The Anthropic model ID to use for all AI operations.
   * Defaults to claude-sonnet-4-6 if not set in environment.
   */
  model: env.ANTHROPIC_MODEL,
} as const;
