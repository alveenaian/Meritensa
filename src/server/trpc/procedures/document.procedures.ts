import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { baseProcedure } from "~/server/trpc/main";
import { db } from "~/server/db";
import { requireAuth } from "~/lib/auth/session";
import { requireCaseAccess } from "~/lib/auth/case-access";
import { minioClient, minioBaseUrl, isMinioAvailable } from "~/server/minio";
import { v4 as uuidv4 } from "uuid";
import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import Anthropic from "@anthropic-ai/sdk";
import { env } from "~/server/env";
import { AI_CONFIG } from "~/lib/config/ai";

const anthropicClient = new Anthropic({
  apiKey: env.ANTHROPIC_API_KEY,
});

/**
 * Determines how to process a file for Claude based on MIME type
 */
function getClaudeMediaType(mimeType: string): { 
  type: 'document' | 'image' | 'text', 
  mediaType: string 
} | null {
  // PDFs - use document type
  if (mimeType === 'application/pdf') {
    return { type: 'document', mediaType: 'application/pdf' };
  }
  
  // Images - use image type
  const imageTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
  if (imageTypes.includes(mimeType)) {
    return { type: 'image', mediaType: mimeType };
  }
  
  // Text-based files - extract and send as text
  const textTypes = ['text/plain', 'text/csv', 'application/json'];
  if (textTypes.includes(mimeType) || mimeType.startsWith('text/')) {
    return { type: 'text', mediaType: mimeType };
  }
  
  return null;
}

/**
 * Calculate relevance score based on AI summary and case type
 */
async function calculateRelevance(summary: string, caseType: string): Promise<number> {
  try {
    const response = await anthropicClient.messages.create({
      model: AI_CONFIG.model,
      max_tokens: 50,
      messages: [{
        role: "user",
        content: `On a scale of 0-100, how relevant is this document to a ${caseType} case? Only respond with a number.\n\nDocument summary: ${summary}`
      }]
    });
    
    const content = response.content[0];
    const scoreText = content.type === 'text' ? content.text : '50';
    const score = parseInt(scoreText.trim());
    return isNaN(score) ? 50 : Math.min(100, Math.max(0, score));
  } catch (error) {
    console.error("Error calculating relevance:", error);
    return 50; // Default to medium relevance
  }
}

export const getPresignedUploadUrl = baseProcedure
  .input(
    z.object({
      token: z.string(),
      caseId: z.string(),
      filename: z.string(),
      mimeType: z.string(),
      size: z.number(),
      category: z.enum([
        "CONTRACT",
        "EMAIL",
        "TEXT_MESSAGE",
        "FINANCIAL",
        "PHOTO_VIDEO",
        "LEGAL_DOCUMENT",
        "CORRESPONDENCE",
        "EVIDENCE_OTHER",
        "IDENTIFICATION",
        "OTHER",
      ]),
    })
  )
  .mutation(async ({ input }) => {
    const user = await requireAuth(input.token);

    // Verify case ownership
    await requireCaseAccess(user.id, input.caseId);

    // Check if Minio is available
    const minioAvailable = await isMinioAvailable();
    if (!minioAvailable) {
      throw new TRPCError({
        code: "SERVICE_UNAVAILABLE",
        message: "File storage service is not available. Please try again later or contact support.",
      });
    }

    // Validate file size (50MB max)
    const MAX_SIZE = 50 * 1024 * 1024; // 50MB
    if (input.size > MAX_SIZE) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "File size exceeds 50MB limit",
      });
    }

    // Generate unique filename
    const uuid = uuidv4();
    const extension = input.filename.split(".").pop();
    const storageFilename = `${uuid}.${extension}`;
    const storageKey = `uploads/${user.id}/${input.caseId}/${storageFilename}`;

    console.log(`Generating presigned URL for: ${storageKey}`);

    // Generate presigned URL for upload
    const bucketName = "kairav-uploads";
    
    try {
      const presignedUrl = await minioClient.presignedPutObject(
        bucketName,
        storageKey,
        24 * 60 * 60 // 24 hours
      );

      console.log(`Generated presigned URL successfully for: ${storageKey}`);

      // Create document record
      const document = await db.document.create({
        data: {
          caseId: input.caseId,
          filename: storageFilename,
          originalName: input.filename,
          mimeType: input.mimeType,
          size: input.size,
          storageKey,
          category: input.category,
        },
      });

      return {
        documentId: document.id,
        uploadUrl: presignedUrl,
        storageKey,
      };
    } catch (error) {
      console.error("Error generating presigned URL:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to generate upload URL. Please check if file storage is properly configured.",
      });
    }
  });

export const listDocuments = baseProcedure
  .input(
    z.object({
      token: z.string(),
      caseId: z.string(),
    })
  )
  .query(async ({ input }) => {
    const user = await requireAuth(input.token);

    // Verify case ownership
    await requireCaseAccess(user.id, input.caseId);

    const documents = await db.document.findMany({
      where: { caseId: input.caseId },
      orderBy: { uploadedAt: "desc" },
    });

    return documents;
  });

export const getDocumentDownloadUrl = baseProcedure
  .input(
    z.object({
      token: z.string(),
      documentId: z.string(),
    })
  )
  .query(async ({ input }) => {
    const user = await requireAuth(input.token);

    const document = await db.document.findUnique({
      where: { id: input.documentId },
      include: {
        case: true,
      },
    });

    if (!document || document.case.userId !== user.id) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Document not found",
      });
    }

    // Generate presigned URL for download
    const bucketName = "kairav-uploads";
    const downloadUrl = await minioClient.presignedGetObject(
      bucketName,
      document.storageKey,
      24 * 60 * 60 // 24 hours
    );

    return {
      downloadUrl,
      filename: document.originalName,
      mimeType: document.mimeType,
    };
  });

export const deleteDocument = baseProcedure
  .input(
    z.object({
      token: z.string(),
      documentId: z.string(),
    })
  )
  .mutation(async ({ input }) => {
    const user = await requireAuth(input.token);

    const document = await db.document.findUnique({
      where: { id: input.documentId },
      include: {
        case: true,
      },
    });

    if (!document || document.case.userId !== user.id) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Document not found",
      });
    }

    // Delete from Minio
    const bucketName = "kairav-uploads";
    try {
      await minioClient.removeObject(bucketName, document.storageKey);
    } catch (error) {
      console.error("Error deleting from Minio:", error);
      // Continue with database deletion even if Minio deletion fails
    }

    // Delete from database
    await db.document.delete({
      where: { id: input.documentId },
    });

    return { success: true };
  });

export const getMinioBaseUrl = baseProcedure.query(() => {
  return { baseUrl: minioBaseUrl };
});

export const analyzeDocument = baseProcedure
  .input(
    z.object({
      token: z.string(),
      documentId: z.string(),
    })
  )
  .mutation(async ({ input }) => {
    const user = await requireAuth(input.token);

    const document = await db.document.findUnique({
      where: { id: input.documentId },
      include: {
        case: true,
      },
    });

    if (!document || document.case.userId !== user.id) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Document not found",
      });
    }

    // Check if Minio is available
    const minioAvailable = await isMinioAvailable();
    if (!minioAvailable) {
      throw new TRPCError({
        code: "SERVICE_UNAVAILABLE",
        message: "File storage service is not available. Cannot analyze document at this time.",
      });
    }

    try {
      console.log(`Attempting to fetch document from Minio: ${document.storageKey}`);
      
      // Fetch document from Minio
      const bucketName = "kairav-uploads";
      const stream = await minioClient.getObject(bucketName, document.storageKey);
      
      console.log(`Successfully retrieved document stream for: ${document.storageKey}`);
      
      // Read the stream into a buffer
      const chunks: Buffer[] = [];
      for await (const chunk of stream) {
        chunks.push(Buffer.from(chunk));
      }
      const fileBuffer = Buffer.concat(chunks);

      console.log(`Read ${fileBuffer.length} bytes from document: ${document.storageKey}`);

      // Determine how to process the file
      const mediaInfo = getClaudeMediaType(document.mimeType);
      
      let extractedText = '';
      let aiSummary = '';
      
      if (!mediaInfo) {
        // Unsupported file type
        extractedText = `[File type ${document.mimeType} - manual review required]`;
        aiSummary = 'Unable to automatically analyze this file type.';
      } else if (mediaInfo.type === 'document' || mediaInfo.type === 'image') {
        // Use Claude's native document/image reading
        const contentBlock = mediaInfo.type === 'document' 
          ? {
              type: "document" as const,
              source: {
                type: "base64" as const,
                media_type: mediaInfo.mediaType,
                data: fileBuffer.toString('base64')
              }
            }
          : {
              type: "image" as const,
              source: {
                type: "base64" as const,
                media_type: mediaInfo.mediaType,
                data: fileBuffer.toString('base64')
              }
            };
        
        const response = await anthropicClient.messages.create({
          model: AI_CONFIG.model,
          max_tokens: 4096,
          messages: [{
            role: "user",
            content: [
              contentBlock,
              {
                type: "text",
                text: `Analyze this ${mediaInfo.type === 'document' ? 'document' : 'image'} for a legal case (${document.case.caseType}).
            
Please provide:
1. SUMMARY: A 2-3 sentence summary of what this contains
2. EXTRACTED TEXT: All text content from the ${mediaInfo.type}
3. KEY EVIDENCE: Important facts, dates, names, or figures
4. RELEVANCE: How this might support or relate to the legal case

Format your response as:
SUMMARY: [your summary]

EXTRACTED TEXT:
[all text from the document]

KEY EVIDENCE:
- [point 1]
- [point 2]
...

RELEVANCE: [assessment]`
              }
            ]
          }]
        });
        
        const content = response.content[0];
        const responseText = content.type === 'text' ? content.text : '';
        
        // Parse response
        const summaryMatch = responseText.match(/SUMMARY:\s*([\s\S]*?)(?=EXTRACTED TEXT:|$)/i);
        const textMatch = responseText.match(/EXTRACTED TEXT:\s*([\s\S]*?)(?=KEY EVIDENCE:|$)/i);
        
        aiSummary = summaryMatch ? summaryMatch[1].trim() : responseText.substring(0, 500);
        extractedText = textMatch ? textMatch[1].trim() : responseText;
        
      } else if (mediaInfo.type === 'text') {
        // Text files - read directly and summarize
        extractedText = fileBuffer.toString('utf-8');
        
        // Limit content for summary generation
        const contentToSummarize = extractedText.substring(0, 10000);
        
        const response = await anthropicClient.messages.create({
          model: AI_CONFIG.model,
          max_tokens: 1024,
          messages: [{
            role: "user",
            content: `Summarize this document for a legal case (${document.case.caseType}). Provide a 2-3 sentence summary and note any key evidence:\n\n${contentToSummarize}`
          }]
        });
        
        const content = response.content[0];
        aiSummary = content.type === 'text' ? content.text : '';
      }

      // Calculate relevance score based on summary
      const relevanceScore = await calculateRelevance(aiSummary, document.case.caseType);
      
      // Update document record
      await db.document.update({
        where: { id: input.documentId },
        data: {
          extractedText,
          aiSummary,
          relevance: relevanceScore,
          analyzedAt: new Date(),
        },
      });

      console.log(`Successfully analyzed document: ${document.storageKey}`);

      return {
        success: true,
        summary: aiSummary,
        relevance: relevanceScore,
      };
    } catch (error) {
      console.error("Error analyzing document:", error);
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes("NoSuchKey") || error.message.includes("Not Found")) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "The uploaded file could not be found in storage. The upload may have failed. Please try uploading again.",
          });
        }
        if (error.message.includes("AccessDenied")) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Access denied to file storage. Please contact support.",
          });
        }
      }
      
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to analyze document. Please try again or contact support if the problem persists.",
      });
    }
  });

export const listAllUserDocuments = baseProcedure
  .input(
    z.object({
      token: z.string(),
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(50).default(20),
    })
  )
  .query(async ({ input }) => {
    const user = await requireAuth(input.token);

    // Get all cases for this user
    const userCases = await db.case.findMany({
      where: { userId: user.id },
      select: { id: true },
    });

    const caseIds = userCases.map((c) => c.id);

    const where = {
      caseId: { in: caseIds },
    };

    const [documents, total] = await Promise.all([
      db.document.findMany({
        where,
        orderBy: { uploadedAt: "desc" },
        skip: (input.page - 1) * input.limit,
        take: input.limit,
        include: {
          case: {
            select: {
              id: true,
              title: true,
              caseType: true,
            },
          },
        },
      }),
      db.document.count({ where }),
    ]);

    return {
      documents,
      pagination: {
        page: input.page,
        limit: input.limit,
        total,
        pages: Math.ceil(total / input.limit),
      },
    };
  });

export const updateDocumentCategory = baseProcedure
  .input(
    z.object({
      token: z.string(),
      documentId: z.string(),
      category: z.enum([
        "CONTRACT",
        "EMAIL",
        "TEXT_MESSAGE",
        "FINANCIAL",
        "PHOTO_VIDEO",
        "LEGAL_DOCUMENT",
        "CORRESPONDENCE",
        "EVIDENCE_OTHER",
        "IDENTIFICATION",
        "OTHER",
      ]),
    })
  )
  .mutation(async ({ input }) => {
    const user = await requireAuth(input.token);

    const document = await db.document.findUnique({
      where: { id: input.documentId },
      include: {
        case: true,
      },
    });

    if (!document || document.case.userId !== user.id) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Document not found",
      });
    }

    const updatedDocument = await db.document.update({
      where: { id: input.documentId },
      data: { category: input.category },
    });

    return updatedDocument;
  });
