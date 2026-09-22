import { minioClient, isMinioAvailable, ensureBucket, setBucketPolicy } from "~/server/minio";
import { db } from "~/server/db";
import { hashPassword } from "~/lib/auth/password";
import { env } from "~/server/env";
import seedData from "./seed-data.json";

// Helper function to add timeout to any promise
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, operation: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${operation} timed out after ${timeoutMs}ms`)), timeoutMs)
    ),
  ]);
}

// Helper function to retry operations with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number,
  operation: string,
  timeoutMs: number = 5000
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await withTimeout(fn(), timeoutMs, operation);
    } catch (error) {
      lastError = error as Error;
      const delay = Math.min(1000 * Math.pow(2, i), 10000); // Max 10s delay
      console.log(`${operation} failed (attempt ${i + 1}/${maxRetries}): ${lastError.message}`);
      
      if (i < maxRetries - 1) {
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error(`${operation} failed after ${maxRetries} retries`);
}

// Helper to check if database is ready
async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await withTimeout(db.$queryRaw`SELECT 1`, 5000, "Database health check");
    return true;
  } catch (error) {
    console.error("Database not ready:", error);
    return false;
  }
}

// Helper to check if Minio is ready
async function checkMinioConnection(): Promise<boolean> {
  return await isMinioAvailable();
}

async function setup() {
  console.log("=== Starting application setup ===");
  const setupStartTime = Date.now();
  
  // Overall timeout for entire setup (2 minutes)
  const setupTimeout = 120000;
  
  try {
    await withTimeout(runSetup(), setupTimeout, "Overall setup");
  } catch (error) {
    console.error("Setup failed:", error);
    console.error("Application may not function correctly. Please check service health.");
    // Don't exit with error - allow app to start anyway
    // This prevents the deployment from being stuck
  }
  
  const setupDuration = Date.now() - setupStartTime;
  console.log(`=== Setup completed in ${setupDuration}ms ===`);
}

async function runSetup() {
  // Step 1: Wait for database to be ready
  console.log("\n[1/6] Checking database connection...");
  const dbReady = await retryWithBackoff(
    checkDatabaseConnection,
    10,
    "Database connection check",
    5000
  );
  
  if (!dbReady) {
    throw new Error("Database is not ready after multiple retries");
  }
  console.log("✓ Database is ready");

  // Step 2: Wait for Minio to be ready
  console.log("\n[2/6] Checking Minio connection...");
  const minioReady = await retryWithBackoff(
    checkMinioConnection,
    10,
    "Minio connection check",
    5000
  );
  
  if (!minioReady) {
    console.warn("⚠ Minio is not ready - file uploads may not work");
    // Continue anyway - this is not critical for app startup
  } else {
    console.log("✓ Minio is ready");
  }

  // Step 3: Setup Minio bucket (only if Minio is ready)
  if (minioReady) {
    console.log("\n[3/6] Setting up Minio bucket...");
    try {
      await setupMinioBucket();
      console.log("✓ Minio bucket setup complete");
    } catch (error) {
      console.error("⚠ Failed to setup Minio bucket:", error);
      console.warn("File uploads may not work until Minio is configured");
      // Continue anyway
    }
  } else {
    console.log("\n[3/6] Skipping Minio bucket setup (Minio not ready)");
  }

  // Step 4: Seed features
  console.log("\n[4/6] Seeding features...");
  try {
    await retryWithBackoff(
      seedFeatures,
      3,
      "Feature seeding",
      10000
    );
    console.log("✓ Feature seeding complete");
  } catch (error) {
    console.error("⚠ Failed to seed features:", error);
    // Continue anyway - features can be added later
  }

  // Step 5: Seed pages and blog posts
  console.log("\n[5/6] Seeding pages and blog posts...");
  try {
    await retryWithBackoff(
      seedPagesAndBlogPosts,
      3,
      "Page seeding",
      15000
    );
    console.log("✓ Page seeding complete");
  } catch (error) {
    console.error("⚠ Failed to seed pages:", error);
    // Continue anyway
  }

  // Step 6: Initialize admin user and settings
  console.log("\n[6/6] Initializing admin user and settings...");
  try {
    await retryWithBackoff(
      initializeAdminAndSettings,
      3,
      "Admin initialization",
      10000
    );
    console.log("✓ Admin initialization complete");
  } catch (error) {
    console.error("⚠ Failed to initialize admin:", error);
    // Continue anyway
  }
}

async function setupMinioBucket() {
  const bucketName = "kairav-uploads";
  
  const bucketCreated = await ensureBucket(bucketName);
  
  if (bucketCreated) {
    // Set bucket policy to allow public read for files with 'public/' prefix
    const policy = {
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Principal: { AWS: ["*"] },
          Action: ["s3:GetObject"],
          Resource: [`arn:aws:s3:::${bucketName}/public/*`],
        },
      ],
    };
    
    await setBucketPolicy(bucketName, policy);
  }
}

async function seedFeatures() {
  const defaultFeatures = [
    {
      featureKey: "full_score_breakdown",
      name: "Full Score Breakdown",
      description: "See detailed scoring across all 5 dimensions",
      isEnabled: true,
      accessType: "FREE" as const,
      price: null,
    },
    {
      featureKey: "causes_of_action",
      name: "Causes of Action Analysis",
      description: "See identified legal claims with strength percentages",
      isEnabled: true,
      accessType: "FREE" as const,
      price: null,
    },
    {
      featureKey: "case_summary",
      name: "AI Case Summary",
      description: "Get a professional summary of your case",
      isEnabled: true,
      accessType: "FREE" as const,
      price: null,
    },
    {
      featureKey: "download_packet",
      name: "Download Case Packet",
      description: "Download your complete case packet as PDF",
      isEnabled: true,
      accessType: "FREE" as const,
      price: 49,
    },
    {
      featureKey: "unlimited_cases",
      name: "Unlimited Cases",
      description: "Create unlimited cases (otherwise max 3)",
      isEnabled: true,
      accessType: "FREE" as const,
      price: null,
    },
    {
      featureKey: "document_analysis",
      name: "AI Document Analysis",
      description: "AI analyzes and summarizes uploaded documents",
      isEnabled: true,
      accessType: "FREE" as const,
      price: null,
    },
  ];

  for (const feature of defaultFeatures) {
    const existing = await db.featureConfig.findUnique({
      where: { featureKey: feature.featureKey },
    });

    if (!existing) {
      await db.featureConfig.create({
        data: feature,
      });
      console.log(`  Created feature: ${feature.featureKey}`);
    }
  }
}

async function seedPagesAndBlogPosts() {
  for (const pageData of seedData.pages) {
    const existing = await db.sitePage.findUnique({
      where: { slug: pageData.slug },
    });

    if (!existing) {
      await db.sitePage.create({
        data: {
          ...pageData,
          publishedAt: pageData.isPublished ? new Date() : null,
        },
      });
      console.log(`  Created page: ${pageData.slug}`);
    }
  }

  for (const postData of seedData.blogPosts) {
    const existing = await db.sitePage.findUnique({
      where: { slug: postData.slug },
    });

    if (!existing) {
      await db.sitePage.create({
        data: {
          ...postData,
          publishedAt: postData.publishedAt ? new Date(postData.publishedAt) : null,
        },
      });
      console.log(`  Created blog post: ${postData.slug}`);
    }
  }

  // Seed navigation items
  const defaultNavItems = [
    {
      label: "How It Works",
      href: "/how-it-works",
      order: 1,
      isExternal: false,
      isEnabled: true,
    },
    {
      label: "Pricing",
      href: "/pricing",
      order: 2,
      isExternal: false,
      isEnabled: true,
    },
    {
      label: "FAQ",
      href: "/faq",
      order: 3,
      isExternal: false,
      isEnabled: true,
    },
    {
      label: "About",
      href: "/about",
      order: 4,
      isExternal: false,
      isEnabled: true,
    },
    {
      label: "Mission",
      href: "/mission",
      order: 5,
      isExternal: false,
      isEnabled: true,
    },
    {
      label: "News",
      href: "/news",
      order: 6,
      isExternal: false,
      isEnabled: true,
    },
    {
      label: "Contact",
      href: "/contact",
      order: 7,
      isExternal: false,
      isEnabled: true,
    },
  ];

  for (const navData of defaultNavItems) {
    const existing = await db.navigationItem.findFirst({
      where: { href: navData.href },
    });

    if (!existing) {
      await db.navigationItem.create({
        data: navData,
      });
      console.log(`  Created navigation item: ${navData.label}`);
    }
  }
}

async function initializeAdminAndSettings() {
  // Initialize site settings singleton
  const existingSettings = await db.siteSettings.findUnique({
    where: { id: "singleton" },
  });

  if (!existingSettings) {
    await db.siteSettings.create({
      data: {
        id: "singleton",
        siteName: "Kairav.ai",
        tagline: "The Plaintiff Operating System",
        description: "AI-powered case preparation for plaintiffs seeking justice.",
        contactEmail: "contact@kairav.ai",
        supportEmail: "support@kairav.ai",
        companyName: "Kairav.ai",
        copyrightYear: new Date().getFullYear(),
      },
    });
    console.log("  Created default site settings");
  }

  // Create admin user if it doesn't exist
  const adminEmail = "kairavjoshi@gmail.com";
  const existingAdmin = await db.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const hashedPassword = await hashPassword(env.ADMIN_PASSWORD);
    
    await db.user.create({
      data: {
        email: adminEmail,
        passwordHash: hashedPassword,
        role: "ADMIN",
        emailVerified: new Date(),
        name: "Admin User",
      },
    });
    
    console.log(`  Created admin user: ${adminEmail}`);
    console.log(`  Admin password: ${env.ADMIN_PASSWORD}`);
  } else {
    console.log(`  Admin user already exists: ${adminEmail}`);
  }
}

setup()
  .then(() => {
    console.log("\n✓ Setup script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n✗ Setup script encountered an error:", error);
    console.error("Exiting with code 0 to allow app to start anyway");
    // Exit with 0 so the app can start even if setup had issues
    // This prevents the deployment from being stuck
    process.exit(0);
  });
