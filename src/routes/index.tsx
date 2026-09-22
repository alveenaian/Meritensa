import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";
import { useEffect } from "react";
import { Button } from "~/components/ui/Button";
import { PublicHeader } from "~/components/layout/PublicHeader";
import { PublicFooter } from "~/components/layout/PublicFooter";
import { BRAND } from "~/lib/config/brand";
import { BlockRenderer } from "~/components/blocks/BlockRenderer";
import type { Block } from "~/components/blocks/types";
import Markdown from "markdown-to-jsx";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const trpc = useTRPC();

  // Check if a "home" page exists in the CMS
  const homePageQuery = useQuery(
    trpc.getPageBySlug.queryOptions({
      slug: "home",
    })
  );

  // Update document title and meta tags when page loads
  useEffect(() => {
    if (homePageQuery.data) {
      document.title = homePageQuery.data.metaTitle || homePageQuery.data.title || BRAND.name;
      
      // Update meta description
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute("content", homePageQuery.data.metaDescription || "");
      } else if (homePageQuery.data.metaDescription) {
        const meta = document.createElement("meta");
        meta.name = "description";
        meta.content = homePageQuery.data.metaDescription;
        document.head.appendChild(meta);
      }
    }
  }, [homePageQuery.data]);

  // If home page exists in CMS, render it directly
  if (homePageQuery.data) {
    const page = homePageQuery.data;
    
    // Determine if this is a block-based page
    const isBlocksPage = page.layoutType === "BLOCKS" && page.blocks;
    const blocks = isBlocksPage ? (page.blocks as Block[]) : null;

    return (
      <div className="min-h-screen bg-white">
        <PublicHeader />

        {/* Page Content */}
        {isBlocksPage && blocks ? (
          <BlockRenderer blocks={blocks} />
        ) : (
          <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
            <article className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-primary-600 prose-strong:text-gray-900">
              <Markdown>{page.content}</Markdown>
            </article>
          </main>
        )}

        <PublicFooter />
      </div>
    );
  }

  // Minimal fallback if CMS page doesn't exist (shouldn't happen with proper seeding)
  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />
      <div className="flex items-center justify-center py-24">
        <div className="text-center max-w-2xl px-4">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to {BRAND.name}
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            The CMS home page is being set up. Please check back soon.
          </p>
          <Link to="/register">
            <Button size="lg">Get Started</Button>
          </Link>
        </div>
      </div>
      <PublicFooter />
    </div>
  );
}
