import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { baseProcedure } from "~/server/trpc/main";
import { db } from "~/server/db";
import { requireAuth } from "~/lib/auth/session";
import { requireCaseAccess } from "~/lib/auth/case-access";
import { minioClient } from "~/server/minio";
import { v4 as uuidv4 } from "uuid";
import { Readable } from "stream";

/**
 * Check if Minio is publicly accessible from the client.
 * This helps the client decide whether to use presigned URLs or the proxy upload.
 */
export const checkMinioPublicAccess = baseProcedure.query(async () => {
  // In Docker/preview environments, Minio is typically not publicly accessible
  const isDocker = process.env.DOCKER_CONTAINER === "true" || 
                   process.env.CODAPT_PREVIEW_URL !== undefined;
  
  return {
    isPubliclyAccessible: !isDocker,
    useProxyUpload: isDocker,
  };
});

/**
 * Server-side upload proxy for environments where Minio is not publicly accessible.
 * This allows uploads to go through the app server which can reach Minio via internal network.
 */
export const uploadDocumentProxy = baseProcedure
  .input(
    z.object({
      token: z.string(),
      caseId: z.string(),
      filename: z.string(),
      mimeType: z.string(),
      fileData: z.string(), // base64 encoded file data
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

    // Decode base64 file data
    const fileBuffer = Buffer.from(input.fileData, 'base64');
    const fileSize = fileBuffer.length;

    // Validate file size (50MB max)
    const MAX_SIZE = 50 * 1024 * 1024; // 50MB
    if (fileSize > MAX_SIZE) {
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

    console.log(`Uploading via proxy: ${storageKey} (${fileSize} bytes)`);

    try {
      // Upload to Minio via internal network
      const bucketName = "kairav-uploads";
      
      await minioClient.putObject(
        bucketName,
        storageKey,
        fileBuffer,
        fileSize,
        {
          'Content-Type': input.mimeType,
        }
      );

      console.log(`Successfully uploaded via proxy: ${storageKey}`);

      // Create document record
      const document = await db.document.create({
        data: {
          caseId: input.caseId,
          filename: storageFilename,
          originalName: input.filename,
          mimeType: input.mimeType,
          size: fileSize,
          storageKey,
          category: input.category,
        },
      });

      return {
        documentId: document.id,
        storageKey,
        success: true,
      };
    } catch (error) {
      console.error("Error uploading via proxy:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to upload file. Please try again.",
      });
    }
  });
