import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { baseProcedure } from "~/server/trpc/main";
import { db } from "~/server/db";
import { requireAdmin } from "~/lib/auth/session";

// Page Procedures

export const listPages = baseProcedure
  .input(
    z.object({
      token: z.string(),
      includeUnpublished: z.boolean().optional().default(true),
      pageType: z.enum(["PAGE", "NEWS"]).optional(),
    })
  )
  .query(async ({ input }) => {
    await requireAdmin(input.token);

    const where: any = input.includeUnpublished ? {} : { isPublished: true };
    
    if (input.pageType) {
      where.pageType = input.pageType;
    }

    const pages = await db.sitePage.findMany({
      where,
      orderBy: [
        { displayOrder: "asc" },
        { publishedAt: "desc" },
        { createdAt: "desc" },
      ],
    });

    return pages;
  });

export const listBlogPosts = baseProcedure
  .input(
    z.object({
      limit: z.number().min(1).max(100).optional().default(10),
      offset: z.number().min(0).optional().default(0),
    })
  )
  .query(async ({ input }) => {
    const posts = await db.sitePage.findMany({
      where: {
        pageType: "NEWS",
        isPublished: true,
      },
      orderBy: {
        publishedAt: "desc",
      },
      take: input.limit,
      skip: input.offset,
    });

    const total = await db.sitePage.count({
      where: {
        pageType: "NEWS",
        isPublished: true,
      },
    });

    return {
      posts,
      total,
      hasMore: input.offset + input.limit < total,
    };
  });

export const getPage = baseProcedure
  .input(
    z.object({
      token: z.string(),
      pageId: z.string(),
    })
  )
  .query(async ({ input }) => {
    await requireAdmin(input.token);

    const page = await db.sitePage.findUnique({
      where: { id: input.pageId },
    });

    if (!page) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Page not found",
      });
    }

    return page;
  });

export const getPageBySlug = baseProcedure
  .input(
    z.object({
      slug: z.string(),
    })
  )
  .query(async ({ input }) => {
    const page = await db.sitePage.findUnique({
      where: { 
        slug: input.slug,
        isPublished: true,
      },
    });

    if (!page) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Page not found",
      });
    }

    return page;
  });

export const createPage = baseProcedure
  .input(
    z.object({
      token: z.string(),
      slug: z.string().regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
      title: z.string().min(1),
      content: z.string(),
      isPublished: z.boolean().default(false),
      pageType: z.enum(["PAGE", "NEWS"]).default("PAGE"),
      layoutType: z.enum(["MARKDOWN", "BLOCKS"]).default("MARKDOWN"),
      blocks: z.any().optional(),
      metaTitle: z.string().optional(),
      metaDescription: z.string().optional(),
      displayOrder: z.number().default(0),
      emailSubject: z.string().optional(),
      emailPreviewText: z.string().optional(),
      canSendAsEmail: z.boolean().default(false),
    })
  )
  .mutation(async ({ input }) => {
    await requireAdmin(input.token);

    // Check if slug already exists
    const existing = await db.sitePage.findUnique({
      where: { slug: input.slug },
    });

    if (existing) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "A page with this slug already exists",
      });
    }

    const page = await db.sitePage.create({
      data: {
        slug: input.slug,
        title: input.title,
        content: input.content,
        isPublished: input.isPublished,
        pageType: input.pageType,
        layoutType: input.layoutType,
        blocks: input.blocks,
        publishedAt: input.isPublished ? new Date() : null,
        metaTitle: input.metaTitle,
        metaDescription: input.metaDescription,
        displayOrder: input.displayOrder,
        emailSubject: input.emailSubject,
        emailPreviewText: input.emailPreviewText,
        canSendAsEmail: input.canSendAsEmail,
      },
    });

    return page;
  });

export const updatePage = baseProcedure
  .input(
    z.object({
      token: z.string(),
      pageId: z.string(),
      slug: z.string().regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens").optional(),
      title: z.string().min(1).optional(),
      content: z.string().optional(),
      isPublished: z.boolean().optional(),
      pageType: z.enum(["PAGE", "NEWS"]).optional(),
      layoutType: z.enum(["MARKDOWN", "BLOCKS"]).optional(),
      blocks: z.any().optional(),
      metaTitle: z.string().optional().nullable(),
      metaDescription: z.string().optional().nullable(),
      displayOrder: z.number().optional(),
      emailSubject: z.string().optional().nullable(),
      emailPreviewText: z.string().optional().nullable(),
      canSendAsEmail: z.boolean().optional(),
    })
  )
  .mutation(async ({ input }) => {
    await requireAdmin(input.token);

    // If slug is being updated, check for conflicts
    if (input.slug) {
      const existing = await db.sitePage.findFirst({
        where: {
          slug: input.slug,
          NOT: { id: input.pageId },
        },
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A page with this slug already exists",
        });
      }
    }

    // Get current page to check if we're publishing for the first time
    const currentPage = await db.sitePage.findUnique({
      where: { id: input.pageId },
    });

    const updateData: any = {};
    if (input.slug !== undefined) updateData.slug = input.slug;
    if (input.title !== undefined) updateData.title = input.title;
    if (input.content !== undefined) updateData.content = input.content;
    if (input.pageType !== undefined) updateData.pageType = input.pageType;
    if (input.layoutType !== undefined) updateData.layoutType = input.layoutType;
    if (input.blocks !== undefined) updateData.blocks = input.blocks;
    if (input.metaTitle !== undefined) updateData.metaTitle = input.metaTitle;
    if (input.metaDescription !== undefined) updateData.metaDescription = input.metaDescription;
    if (input.displayOrder !== undefined) updateData.displayOrder = input.displayOrder;
    if (input.emailSubject !== undefined) updateData.emailSubject = input.emailSubject;
    if (input.emailPreviewText !== undefined) updateData.emailPreviewText = input.emailPreviewText;
    if (input.canSendAsEmail !== undefined) updateData.canSendAsEmail = input.canSendAsEmail;
    
    if (input.isPublished !== undefined) {
      updateData.isPublished = input.isPublished;
      // Set publishedAt timestamp when publishing for the first time
      if (input.isPublished && !currentPage?.isPublished && !currentPage?.publishedAt) {
        updateData.publishedAt = new Date();
      }
    }

    const page = await db.sitePage.update({
      where: { id: input.pageId },
      data: updateData,
    });

    return page;
  });

export const deletePage = baseProcedure
  .input(
    z.object({
      token: z.string(),
      pageId: z.string(),
    })
  )
  .mutation(async ({ input }) => {
    await requireAdmin(input.token);

    await db.sitePage.delete({
      where: { id: input.pageId },
    });

    return { success: true };
  });

export const togglePagePublish = baseProcedure
  .input(
    z.object({
      token: z.string(),
      pageId: z.string(),
    })
  )
  .mutation(async ({ input }) => {
    await requireAdmin(input.token);

    const page = await db.sitePage.findUnique({
      where: { id: input.pageId },
    });

    if (!page) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Page not found",
      });
    }

    const updateData: any = { isPublished: !page.isPublished };
    
    // Set publishedAt timestamp when publishing for the first time
    if (!page.isPublished && !page.publishedAt) {
      updateData.publishedAt = new Date();
    }

    const updatedPage = await db.sitePage.update({
      where: { id: input.pageId },
      data: updateData,
    });

    return updatedPage;
  });

export const sendPageAsEmail = baseProcedure
  .input(
    z.object({
      token: z.string(),
      pageId: z.string(),
      testEmail: z.string().email().optional(), // For testing, send to a specific email
    })
  )
  .mutation(async ({ input }) => {
    await requireAdmin(input.token);

    const page = await db.sitePage.findUnique({
      where: { id: input.pageId },
    });

    if (!page) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Page not found",
      });
    }

    if (!page.canSendAsEmail) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "This page is not configured for email sending",
      });
    }

    // For now, just return success - actual email sending would be implemented here
    // This would integrate with the email service to send to subscribers
    
    await db.sitePage.update({
      where: { id: input.pageId },
      data: { lastEmailSentAt: new Date() },
    });

    return { 
      success: true,
      message: input.testEmail 
        ? `Test email would be sent to ${input.testEmail}` 
        : "Email would be sent to all subscribers"
    };
  });

// Navigation Procedures

export const listNavigationItems = baseProcedure
  .input(
    z.object({
      includeDisabled: z.boolean().optional().default(false),
    })
  )
  .query(async ({ input }) => {
    const where = input.includeDisabled ? {} : { isEnabled: true };

    const items = await db.navigationItem.findMany({
      where,
      orderBy: { order: "asc" },
    });

    return items;
  });

export const createNavigationItem = baseProcedure
  .input(
    z.object({
      token: z.string(),
      label: z.string().min(1),
      href: z.string().min(1),
      order: z.number().default(0),
      isExternal: z.boolean().default(false),
      isEnabled: z.boolean().default(true),
    })
  )
  .mutation(async ({ input }) => {
    await requireAdmin(input.token);

    const item = await db.navigationItem.create({
      data: {
        label: input.label,
        href: input.href,
        order: input.order,
        isExternal: input.isExternal,
        isEnabled: input.isEnabled,
      },
    });

    return item;
  });

export const updateNavigationItem = baseProcedure
  .input(
    z.object({
      token: z.string(),
      itemId: z.string(),
      label: z.string().min(1).optional(),
      href: z.string().min(1).optional(),
      order: z.number().optional(),
      isExternal: z.boolean().optional(),
      isEnabled: z.boolean().optional(),
    })
  )
  .mutation(async ({ input }) => {
    await requireAdmin(input.token);

    const updateData: any = {};
    if (input.label !== undefined) updateData.label = input.label;
    if (input.href !== undefined) updateData.href = input.href;
    if (input.order !== undefined) updateData.order = input.order;
    if (input.isExternal !== undefined) updateData.isExternal = input.isExternal;
    if (input.isEnabled !== undefined) updateData.isEnabled = input.isEnabled;

    const item = await db.navigationItem.update({
      where: { id: input.itemId },
      data: updateData,
    });

    return item;
  });

export const deleteNavigationItem = baseProcedure
  .input(
    z.object({
      token: z.string(),
      itemId: z.string(),
    })
  )
  .mutation(async ({ input }) => {
    await requireAdmin(input.token);

    await db.navigationItem.delete({
      where: { id: input.itemId },
    });

    return { success: true };
  });

export const reorderNavigationItems = baseProcedure
  .input(
    z.object({
      token: z.string(),
      items: z.array(
        z.object({
          id: z.string(),
          order: z.number(),
        })
      ),
    })
  )
  .mutation(async ({ input }) => {
    await requireAdmin(input.token);

    // Update all items in a transaction
    await db.$transaction(
      input.items.map((item) =>
        db.navigationItem.update({
          where: { id: item.id },
          data: { order: item.order },
        })
      )
    );

    return { success: true };
  });

// Site Settings Procedures

export const getSiteSettings = baseProcedure
  .query(async () => {
    // Get or create the singleton settings record
    let settings = await db.siteSettings.findUnique({
      where: { id: "singleton" },
    });

    if (!settings) {
      // Create default settings if they don't exist
      settings = await db.siteSettings.create({
        data: { id: "singleton" },
      });
    }

    return settings;
  });

export const updateSiteSettings = baseProcedure
  .input(
    z.object({
      token: z.string(),
      siteName: z.string().optional(),
      tagline: z.string().optional(),
      description: z.string().optional(),
      footerText: z.string().optional().nullable(),
      contactEmail: z.string().email().optional(),
      supportEmail: z.string().email().optional(),
      linkedinUrl: z.string().url().optional().nullable(),
      twitterUrl: z.string().url().optional().nullable(),
      facebookUrl: z.string().url().optional().nullable(),
      companyName: z.string().optional(),
      copyrightYear: z.number().int().min(2020).max(2100).optional(),
      primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Primary color must be a valid hex color").optional().nullable(),
      accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Accent color must be a valid hex color").optional().nullable(),
      fontFamily: z.string().optional().nullable(),
      headingFont: z.string().optional().nullable(),
    })
  )
  .mutation(async ({ input }) => {
    await requireAdmin(input.token);

    const updateData: any = {};
    if (input.siteName !== undefined) updateData.siteName = input.siteName;
    if (input.tagline !== undefined) updateData.tagline = input.tagline;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.footerText !== undefined) updateData.footerText = input.footerText;
    if (input.contactEmail !== undefined) updateData.contactEmail = input.contactEmail;
    if (input.supportEmail !== undefined) updateData.supportEmail = input.supportEmail;
    if (input.linkedinUrl !== undefined) updateData.linkedinUrl = input.linkedinUrl;
    if (input.twitterUrl !== undefined) updateData.twitterUrl = input.twitterUrl;
    if (input.facebookUrl !== undefined) updateData.facebookUrl = input.facebookUrl;
    if (input.companyName !== undefined) updateData.companyName = input.companyName;
    if (input.copyrightYear !== undefined) updateData.copyrightYear = input.copyrightYear;
    if (input.primaryColor !== undefined) updateData.primaryColor = input.primaryColor;
    if (input.accentColor !== undefined) updateData.accentColor = input.accentColor;
    if (input.fontFamily !== undefined) updateData.fontFamily = input.fontFamily;
    if (input.headingFont !== undefined) updateData.headingFont = input.headingFont;

    // Upsert to handle case where settings don't exist yet
    const settings = await db.siteSettings.upsert({
      where: { id: "singleton" },
      update: updateData,
      create: { id: "singleton", ...updateData },
    });

    return settings;
  });
