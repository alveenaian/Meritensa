import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";
import { Scale } from "lucide-react";
import { Button } from "~/components/ui/Button";
import Markdown from "markdown-to-jsx";
import { useEffect } from "react";
import { PublicHeader } from "~/components/layout/PublicHeader";
import { PublicFooter } from "~/components/layout/PublicFooter";
import { BlockRenderer } from "~/components/blocks/BlockRenderer";
import type { Block } from "~/components/blocks/types";

export const Route = createFileRoute("/$")({
  component: DynamicPage,
});

function DynamicPage() {
  const trpc = useTRPC();
  const navigate = useNavigate();
  const params = Route.useParams();
  
  // Get the slug from the splat parameter
  const slug = params["_splat"] || "";

  const pageQuery = useQuery(
    trpc.getPageBySlug.queryOptions({
      slug,
    })
  );

  // Update document title and meta tags
  useEffect(() => {
    if (pageQuery.data) {
      document.title = pageQuery.data.metaTitle || pageQuery.data.title || "Kairav.ai";
      
      // Update meta description
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute("content", pageQuery.data.metaDescription || "");
      } else if (pageQuery.data.metaDescription) {
        const meta = document.createElement("meta");
        meta.name = "description";
        meta.content = pageQuery.data.metaDescription;
        document.head.appendChild(meta);
      }
    }
  }, [pageQuery.data]);

  // Handle 404
  if (pageQuery.isError) {
    return (
      <div className="min-h-screen bg-white">
        <PublicHeader />

        {/* 404 Content */}
        <div className="flex items-center justify-center py-24">
          <div className="text-center">
            <h1 className="text-6xl font-bold text-gray-900">404</h1>
            <p className="mt-4 text-xl text-gray-600">Page not found</p>
            <p className="mt-2 text-gray-500">
              The page you're looking for doesn't exist or has been removed.
            </p>
            <Link to="/" className="mt-8 inline-block">
              <Button>Return Home</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (pageQuery.isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const page = pageQuery.data!;

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
