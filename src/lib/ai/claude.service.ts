import { anthropic } from "@ai-sdk/anthropic";
import { generateText, generateObject } from "ai";
import { z } from "zod";
import { SYSTEM_PROMPT } from "./prompts/system";
import { INTAKE_PROMPTS } from "./prompts/intake-steps";
import { AI_CONFIG } from "~/lib/config/ai";

interface ChatRequest {
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  caseType: string;
  intakeStep?: string;
  additionalContext?: string;
  documentContext?: string;
}

interface ChatResponse {
  content: string;
  model: string;
  tokens: number;
  extractedData?: ExtractedCaseData;
}

const extractedDataSchema = z.object({
  causesOfAction: z.array(
    z.object({
      name: z.string(),
      strength: z.number().min(0).max(100),
    })
  ).optional(),
  estimatedDamagesLow: z.number().optional(),
  estimatedDamagesHigh: z.number().optional(),
  solDeadline: z.string().optional(),
  solRisk: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL", "EXPIRED"]).optional(),
  defendantType: z.enum(["INDIVIDUAL", "SMALL_BUSINESS", "CORPORATION", "GOVERNMENT", "OTHER"]).optional(),
  keyDates: z.array(
    z.object({
      date: z.string(),
      event: z.string(),
    })
  ).optional(),
});

type ExtractedCaseData = z.infer<typeof extractedDataSchema>;

export async function chat(request: ChatRequest): Promise<ChatResponse> {
  const systemPrompt = buildSystemPrompt(request);
  const model = anthropic(AI_CONFIG.model);

  const response = await generateText({
    model,
    system: systemPrompt,
    messages: request.messages,
    maxTokens: 2048,
  });

  // Extract structured data if this is a summary step
  let extractedData: ExtractedCaseData | undefined;
  if (request.intakeStep === "summary") {
    extractedData = await extractStructuredData(response.text);
  }

  return {
    content: response.text,
    model: AI_CONFIG.model,
    tokens: response.usage.totalTokens,
    extractedData,
  };
}

function buildSystemPrompt(request: ChatRequest): string {
  let prompt = SYSTEM_PROMPT;

  prompt += `\n\n## CURRENT CONTEXT\n`;
  prompt += `Case Type: ${request.caseType}\n`;

  if (request.intakeStep) {
    prompt += `Current Intake Step: ${request.intakeStep}\n`;
    
    // Add step-specific instructions
    const stepPrompt = INTAKE_PROMPTS[request.intakeStep];
    if (stepPrompt) {
      prompt += `\n${stepPrompt.replace("{caseType}", request.caseType)}\n`;
    }
  }

  if (request.documentContext) {
    prompt += `\n${request.documentContext}`;
  }

  if (request.additionalContext) {
    prompt += `\nAdditional Context:\n${request.additionalContext}`;
  }

  return prompt;
}

async function extractStructuredData(
  summaryText: string
): Promise<ExtractedCaseData> {
  const model = anthropic(AI_CONFIG.model);

  try {
    const result = await generateObject({
      model,
      schema: extractedDataSchema,
      prompt: `Extract structured data from the following case summary. If any field cannot be determined, omit it from the response.

Summary:
${summaryText}`,
    });

    return result.object;
  } catch (error) {
    console.error("Error extracting structured data:", error);
    return {};
  }
}
