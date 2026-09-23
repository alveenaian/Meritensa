import Anthropic from '@anthropic-ai/sdk';
import { getCaseInstructions } from './case-instructions';

export class AiResponseError extends Error {
  userMessage: string;
  constructor(message: string, userMessage: string) {
    super(message);
    this.userMessage = userMessage;
  }
}

export interface AnalysisInput {
  caseType: string;
  filename: string;
  mimeType: string;
  content: Buffer;
}

export interface AnalysisOutput {
  summary: string;
  relevance: number;
}

// ---- Settings you can tune -------------------------------------------------

// Cheaper model for simple files, stronger model for complex ones.
const SIMPLE_MODEL = process.env.AI_MODEL_SIMPLE ?? 'claude-haiku-4-5-20251001';
const COMPLEX_MODEL = process.env.AI_MODEL_COMPLEX ?? 'claude-sonnet-5';

// A file counts as "simple" if it is smaller than these sizes. These are
// starting guesses: check them with your 20-30 document test, then adjust.
const SIMPLE_TEXT_MAX_BYTES = 10 * 1024; // short notes
const SIMPLE_PDF_MAX_BYTES = 300 * 1024; // roughly 1-3 text pages
const SIMPLE_IMAGE_MAX_BYTES = 1024 * 1024; // a single photo or scan

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);

export function pickModel(mimeType: string, sizeBytes: number): string {
  const isSimple =
    (mimeType.startsWith('text/') && sizeBytes < SIMPLE_TEXT_MAX_BYTES) ||
    (mimeType === 'application/pdf' && sizeBytes < SIMPLE_PDF_MAX_BYTES) ||
    (IMAGE_TYPES.has(mimeType) && sizeBytes < SIMPLE_IMAGE_MAX_BYTES);
  return isSimple ? SIMPLE_MODEL : COMPLEX_MODEL;
}

// ---- Request building ------------------------------------------------------

let client: Anthropic | null = null;
function getClient(): Anthropic {
  // Reads ANTHROPIC_API_KEY from the environment. The SDK retries rate-limit
  // and temporary server errors on its own, with waiting in between.
  client ??= new Anthropic({ maxRetries: 4 });
  return client;
}

const ANALYSIS_TOOL: Anthropic.Messages.Tool = {
  name: 'record_analysis',
  description: 'Record the analysis of the document.',
  input_schema: {
    type: 'object',
    properties: {
      summary: {
        type: 'string',
        description: 'Plain-language summary of the document, 3 to 6 sentences.',
      },
      relevance: {
        type: 'integer',
        minimum: 0,
        maximum: 100,
        description: 'How relevant the document is to the case, 0 to 100.',
      },
    },
    required: ['summary', 'relevance'],
  },
};

function buildDocumentBlock(input: AnalysisInput): Anthropic.Messages.ContentBlockParam {
  const { mimeType, content } = input;

  if (mimeType === 'application/pdf') {
    return {
      type: 'document',
      source: { type: 'base64', media_type: 'application/pdf', data: content.toString('base64') },
    };
  }
  if (IMAGE_TYPES.has(mimeType)) {
    return {
      type: 'image',
      source: {
        type: 'base64',
        media_type: mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
        data: content.toString('base64'),
      },
    };
  }
  if (mimeType.startsWith('text/')) {
    return { type: 'text', text: `<document>\n${content.toString('utf-8')}\n</document>` };
  }
  throw new AiResponseError(
    `Unsupported file type: ${mimeType}`,
    'This file type cannot be analyzed yet.'
  );
}

// ---- Main function ---------------------------------------------------------

export async function generateDocumentAnalysis(input: AnalysisInput): Promise<AnalysisOutput> {
  const model = pickModel(input.mimeType, input.content.length);
  const documentBlock = buildDocumentBlock(input);

  let response: Anthropic.Messages.Message;
  try {
    response = await getClient().messages.create({
      model,
      max_tokens: 1024,
      // 1. Static case instructions first, marked for caching.
      system: [
        {
          type: 'text',
          text: getCaseInstructions(input.caseType),
          cache_control: { type: 'ephemeral' },
        },
      ],
      tools: [ANALYSIS_TOOL],
      tool_choice: { type: 'tool', name: ANALYSIS_TOOL.name },
      // 2. The part that changes for every document goes last.
      messages: [
        {
          role: 'user',
          content: [documentBlock, { type: 'text', text: `File name: ${input.filename}` }],
        },
      ],
    });
  } catch (err) {
    throw new AiResponseError(
      err instanceof Error ? err.message : 'Unknown AI error',
      'The AI service could not analyze this document right now. Please try again.'
    );
  }

  // One log line per call. This is your cost audit: add it up by model, file
  // type and size. cacheReadTokens > 0 means caching is working. The file name
  // is left out on purpose because it can be confidential.
  console.info(
    JSON.stringify({
      event: 'ai_document_analysis',
      model,
      caseType: input.caseType,
      mimeType: input.mimeType,
      sizeBytes: input.content.length,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      cacheWriteTokens: response.usage.cache_creation_input_tokens ?? 0,
      cacheReadTokens: response.usage.cache_read_input_tokens ?? 0,
    })
  );

  const toolBlock = response.content.find(
    (block): block is Anthropic.Messages.ToolUseBlock => block.type === 'tool_use'
  );
  const result = toolBlock?.input as Partial<AnalysisOutput> | undefined;
  if (!result || typeof result.summary !== 'string' || typeof result.relevance !== 'number') {
    throw new AiResponseError(
      'AI response did not include a valid analysis',
      'The AI service returned an unexpected answer. Please try again.'
    );
  }

  return {
    summary: result.summary,
    relevance: Math.min(100, Math.max(0, Math.round(result.relevance))),
  };
}
