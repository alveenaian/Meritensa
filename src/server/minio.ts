import { Client } from "minio";
import { env } from "./env";

/**
 * Get the Minio endpoint configuration based on the environment.
 * 
 * In local development: Use localhost:9000
 * In Docker/preview environments: Use internal Docker hostname (minio:9000)
 * 
 * The key insight is that in preview/production environments, Minio is only
 * accessible via the internal Docker network, not via external URLs.
 */
function getMinioConfig(): {
  endPoint: string;
  port: number;
  useSSL: boolean;
  accessKey: string;
  secretKey: string;
} {
  // Check if we're running inside Docker (common environment variable)
  const isDocker = process.env.DOCKER_CONTAINER === "true" || 
                   process.env.HOSTNAME?.startsWith("app-") ||
                   process.env.CODAPT_PREVIEW_URL !== undefined;

  if (isDocker) {
    // In Docker/preview environments, use internal Docker network hostname
    console.log("Detected Docker/preview environment - using internal Minio hostname");
    return {
      endPoint: "minio",  // Docker Compose service name
      port: 9000,
      useSSL: false,
      accessKey: "admin",
      secretKey: env.ADMIN_PASSWORD,
    };
  } else {
    // In local development, use localhost
    console.log("Detected local development - using localhost Minio");
    return {
      endPoint: "localhost",
      port: 9000,
      useSSL: false,
      accessKey: "admin",
      secretKey: env.ADMIN_PASSWORD,
    };
  }
}

// Create Minio client with appropriate configuration
const minioConfig = getMinioConfig();
export const minioClient = new Client(minioConfig);

// Export the base URL for reference (though presigned URLs will use the client's config)
export const minioBaseUrl = minioConfig.useSSL 
  ? `https://${minioConfig.endPoint}:${minioConfig.port}`
  : `http://${minioConfig.endPoint}:${minioConfig.port}`;

/**
 * Check if Minio is available and accessible.
 * This is useful for graceful degradation in environments where Minio is not set up.
 */
export async function isMinioAvailable(): Promise<boolean> {
  try {
    // Try to list buckets as a connectivity test
    await Promise.race([
      minioClient.listBuckets(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Timeout")), 5000)
      )
    ]);
    return true;
  } catch (error) {
    console.warn("Minio is not available:", error instanceof Error ? error.message : error);
    return false;
  }
}

/**
 * Ensure a bucket exists, creating it if necessary.
 * Returns true if the bucket exists or was created successfully.
 */
export async function ensureBucket(bucketName: string): Promise<boolean> {
  try {
    const exists = await minioClient.bucketExists(bucketName);
    if (!exists) {
      await minioClient.makeBucket(bucketName, "us-east-1");
      console.log(`Created Minio bucket: ${bucketName}`);
    }
    return true;
  } catch (error) {
    console.error(`Failed to ensure bucket ${bucketName}:`, error);
    return false;
  }
}

/**
 * Set a bucket policy to make it publicly readable (for specific prefixes if needed).
 */
export async function setBucketPolicy(bucketName: string, policy: any): Promise<boolean> {
  try {
    await minioClient.setBucketPolicy(bucketName, JSON.stringify(policy));
    console.log(`Set policy for bucket: ${bucketName}`);
    return true;
  } catch (error) {
    console.error(`Failed to set policy for bucket ${bucketName}:`, error);
    return false;
  }
}
