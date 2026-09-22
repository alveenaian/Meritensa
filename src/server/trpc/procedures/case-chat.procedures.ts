import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { baseProcedure } from "~/server/trpc/main";
import { db } from "~/server/db";
import { requireAuth } from "~/lib/auth/session";
import { requireCaseAccess } from "~/lib/auth/case-access";
import { chat } from "~/lib/ai/claude.service";
import { determineIntakeStep } from "~/lib/ai/intake-orchestrator";
import { checkRateLimit } from "~/lib/utils/rate-limit";

/**
 * CRITICAL: Builds document context for AI, ensuring ONLY documents from the specified case are included.
 * This function is called during chat and analysis to provide document context to the AI.
 * 
 * SECURITY: We explicitly filter by caseId and validate that all returned documents
 * belong to the specified case to prevent cross-case data contamination.
 */
async function buildDocumentContext(caseId: string): Promise<string> {
  // EXPLICIT filter by caseId - do not rely solely on relationship includes
  const documents = await db.document.findMany({
    where: { 
      caseId: caseId, // CRITICAL: Only fetch documents for THIS case
    },
    select: {
      id: true,
      caseId: true, // Include for validation
      originalName: true,
      category: true,
      aiSummary: true,
      extractedText: true,
      relevance: true,
    },
    orderBy: [
      { relevance: "desc" },
      { uploadedAt: "desc" },
    ],
  });

  // VALIDATION: Verify all documents belong to this case (defense in depth)
  const invalidDocs = documents.filter(d => d.caseId !== caseId);
  if (invalidDocs.length > 0) {
    console.error(`CRITICAL: buildDocumentContext found ${invalidDocs.length} documents with wrong caseId!`);
    console.error(`Expected caseId: ${caseId}`);
    console.error(`Invalid documents:`, invalidDocs.map(d => ({ id: d.id, caseId: d.caseId })));
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Data integrity violation: Documents from wrong case detected",
    });
  }

  if (documents.length === 0) {
    return "\n\n## UPLOADED DOCUMENTS FOR THIS CASE\n\nNo documents have been uploaded for this case yet.";
  }

  let context = `\n\n## UPLOADED DOCUMENTS FOR THIS CASE (Case ID: ${caseId})\n\n`;
  context += `The user has uploaded ${documents.length} document(s) for THIS specific case:\n\n`;

  const maxCharsPerDoc = 5000; // ~1,250 tokens per document max
  const maxTotalChars = 20000; // ~5,000 tokens total for all documents

  let totalChars = 0;

  for (let i = 0; i < documents.length && totalChars < maxTotalChars; i++) {
    const doc = documents[i];
    context += `### Document ${i + 1}: ${doc.originalName}\n`;
    context += `Category: ${doc.category}\n`;

    if (doc.aiSummary) {
      context += `Summary: ${doc.aiSummary}\n`;
    }

    // Include extracted text, but limit to avoid token explosion
    if (doc.extractedText) {
      const remainingBudget = maxTotalChars - totalChars;
      const charsToUse = Math.min(maxCharsPerDoc, remainingBudget);
      const text =
        doc.extractedText.length > charsToUse
          ? doc.extractedText.substring(0, charsToUse) +
            "\n[... document truncated ...]"
          : doc.extractedText;
      context += `\nContent:\n${text}\n`;
      totalChars += text.length;
    }

    context += `\n---\n\n`;

    if (totalChars >= maxTotalChars) {
      context += `\n[Additional documents omitted due to context length limits]\n`;
      break;
    }
  }

  return context;
}

export const sendMessage = baseProcedure
  .input(
    z.object({
      token: z.string(),
      caseId: z.string(),
      content: z.string().min(1, "Message cannot be empty"),
    })
  )
  .mutation(async ({ input }) => {
    const user = await requireAuth(input.token);

    // Apply rate limiting (60 messages per minute)
    if (!checkRateLimit(`chat:${user.id}`, 60, 60000)) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: "Rate limit exceeded. Please slow down.",
      });
    }

    // Verify case ownership and fetch case data
    await requireCaseAccess(user.id, input.caseId);
    
    const caseRecord = await db.case.findUnique({
      where: { id: input.caseId },
      include: {
        messages: {
          where: { caseId: input.caseId },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!caseRecord) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Case not found",
      });
    }

    // Save user message
    const userMessage = await db.message.create({
      data: {
        caseId: caseRecord.id,
        role: "USER",
        content: input.content,
      },
    });

    // Determine current intake step based on stage
    let intakeStep = determineIntakeStep(caseRecord);
    
    // Override for conversation stage
    if (caseRecord.stage === "CONVERSATION") {
      if (caseRecord.needsNewSummary) {
        const clarificationCount = (caseRecord.clarificationCount || 0) + 1;
        
        await db.case.update({
          where: { id: caseRecord.id },
          data: { clarificationCount },
        });
        
        if (clarificationCount >= 2) {
          intakeStep = "clarification_summary";
          await db.case.update({
            where: { id: caseRecord.id },
            data: { 
              needsNewSummary: false,
              clarificationCount: 0,
            },
          });
        } else {
          intakeStep = "clarification";
        }
      } else {
        const messageCount = caseRecord.messages.length;
        if (messageCount >= 10) {
          intakeStep = "conversation_summary";
        } else {
          intakeStep = "conversation";
        }
      }
    }

    // Build document context for this case
    const documentContext = await buildDocumentContext(caseRecord.id);

    // Build additional context
    let additionalContext = "";
    if (caseRecord.userIntent) {
      additionalContext += `\n\nUSER'S STATED INTENT: ${caseRecord.userIntent}\n`;
      additionalContext += "Keep this in mind as you guide the conversation.\n";
    }

    // Build message history
    const messageHistory = [
      ...caseRecord.messages.map((m) => ({
        role: m.role.toLowerCase() as "user" | "assistant",
        content: m.content,
      })),
      { role: "user" as const, content: input.content },
    ];

    // Get AI response
    const aiResponse = await chat({
      messages: messageHistory,
      caseType: caseRecord.caseType,
      intakeStep,
      documentContext,
      additionalContext,
    });

    // Save assistant message
    const assistantMessage = await db.message.create({
      data: {
        caseId: caseRecord.id,
        role: "ASSISTANT",
        content: aiResponse.content,
        model: aiResponse.model,
        tokens: aiResponse.tokens,
        intakeStep,
      },
    });

    return {
      userMessage,
      assistantMessage,
      intakeStep,
    };
  });

export const sendInitialGreeting = baseProcedure
  .input(
    z.object({
      token: z.string(),
      caseId: z.string(),
    })
  )
  .mutation(async ({ input }) => {
    const user = await requireAuth(input.token);

    // Verify user owns the case
    await requireCaseAccess(user.id, input.caseId);
    
    const caseRecord = await db.case.findUnique({
      where: { id: input.caseId },
      include: {
        messages: true,
      },
    });

    if (!caseRecord) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Case not found",
      });
    }

    // Only send greeting if there are no messages yet
    if (caseRecord.messages.length > 0) {
      return { alreadyHasMessages: true };
    }

    // Get the initial greeting from the AI
    const aiResponse = await chat({
      messages: [
        { role: "user", content: "Hello, I need help with my case." }
      ],
      caseType: caseRecord.caseType,
      intakeStep: "initial",
    });

    // Save the greeting as the first message
    const greetingMessage = await db.message.create({
      data: {
        caseId: caseRecord.id,
        role: "ASSISTANT",
        content: aiResponse.content,
        model: aiResponse.model,
        tokens: aiResponse.tokens,
        intakeStep: "initial",
      },
    });

    return {
      message: greetingMessage,
      alreadyHasMessages: false,
    };
  });

export const acknowledgeDocument = baseProcedure
  .input(
    z.object({
      token: z.string(),
      caseId: z.string(),
      documentId: z.string(),
    })
  )
  .mutation(async ({ input }) => {
    const user = await requireAuth(input.token);

    // Verify case ownership
    await requireCaseAccess(user.id, input.caseId);
    
    const caseRecord = await db.case.findUnique({
      where: { id: input.caseId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!caseRecord) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Case not found",
      });
    }

    // Get document details
    const document = await db.document.findFirst({
      where: {
        id: input.documentId,
        caseId: input.caseId,
      },
    });

    if (!document) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Document not found",
      });
    }

    // Build document context for AI
    let documentInfo = `The user just uploaded a document:\n`;
    documentInfo += `- Filename: ${document.originalName}\n`;
    documentInfo += `- Category: ${document.category}\n`;
    
    if (document.aiSummary) {
      documentInfo += `- AI Summary: ${document.aiSummary}\n`;
    }
    
    if (document.extractedText) {
      const preview = document.extractedText.substring(0, 2000);
      documentInfo += `- Content Preview: ${preview}${document.extractedText.length > 2000 ? "..." : ""}\n`;
    }

    // Build message history
    const messageHistory = caseRecord.messages.map((m) => ({
      role: m.role.toLowerCase() as "user" | "assistant",
      content: m.content,
    }));

    // Get AI acknowledgment
    const aiResponse = await chat({
      messages: [
        ...messageHistory,
        {
          role: "user" as const,
          content: `[SYSTEM: User uploaded a document]\n\n${documentInfo}`,
        },
      ],
      caseType: caseRecord.caseType,
      intakeStep: caseRecord.stage === "CONVERSATION" ? "conversation" : undefined,
      additionalContext: `The user just uploaded a document during the conversation. Acknowledge it naturally:
- Thank them for sharing it
- Briefly describe what you can see in the document
- Explain how it helps you understand their situation
- Continue the conversation naturally

Keep it conversational and warm. Don't overwhelm them with analysis - just acknowledge and integrate it into your understanding.`,
    });

    // Save assistant message
    const assistantMessage = await db.message.create({
      data: {
        caseId: caseRecord.id,
        role: "ASSISTANT",
        content: aiResponse.content,
        model: aiResponse.model,
        tokens: aiResponse.tokens,
        intakeStep: "document_acknowledgment",
      },
    });

    return {
      message: assistantMessage,
    };
  });
