import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";
import { Calendar, ArrowRight, Newspaper } from "lucide-react";
import { Button } from "~/components/ui/Button";
import { useState } from "react";
import { PublicHeader } from "~/components/layout/PublicHeader";
import { PublicFooter } from "~/components/layout/PublicFooter";
import { BRAND } from "~/lib/config/brand";

export const Route = createFileRoute("/news/")({
  component: NewsPage,
});

function NewsPage() {
  const trpc = useTRPC();
  const [page, setPage] = useState(0);
  const postsPerPage = 10;

  const postsQuery = useQuery(
    trpc.listBlogPosts.queryOptions({
      limit: postsPerPage,
      offset: page * postsPerPage,
    })
  );

  if (postsQuery.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
        <PublicHeader />
        <div className="flex items-center justify-center py-24">
          <div className="text-center">
            <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600"></div>
            <p className="text-gray-600">Loading news...</p>
          </div>
        </div>
      </div>
    );
  }

  const posts = postsQuery.data?.posts || [];
  const hasMore = postsQuery.data?.hasMore || false;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      <PublicHeader />

      {/* Hero Section */}
      <div className="border-b border-secondary-200/60 bg-white/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mb-4 flex items-center justify-center">
              <Newspaper className="h-12 w-12 text-primary-600" />
            </div>
            <h1 className="text-4xl font-bold text-secondary-900 sm:text-5xl lg:text-6xl">
              News & Updates
            </h1>
            <p className="mt-4 text-lg text-secondary-600 max-w-2xl mx-auto">
              Stay informed with the latest announcements, updates, and insights from {BRAND.name}
            </p>
          </div>
        </div>
      </div>

      {/* Posts Grid */}
      <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <Newspaper className="mx-auto h-16 w-16 text-gray-400" />
            <h3 className="mt-4 text-xl font-medium text-gray-900">No news yet</h3>
            <p className="mt-2 text-gray-600">Check back soon for updates and announcements.</p>
          </div>
        ) : (
          <>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => {
                const excerpt = post.content
                  .replace(/[#*`]/g, "")
                  .substring(0, 200)
                  .trim() + "...";
                const publishedDate = post.publishedAt
                  ? new Date(post.publishedAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "Draft";

                return (
                  <Link
                    key={post.id}
                    to={`/${post.slug}`}
                    className="group block"
                  >
                    <article className="h-full rounded-2xl bg-white p-6 shadow-card transition-all duration-200 hover:shadow-card-hover hover:-translate-y-1">
                      <div className="flex items-center gap-2 text-sm text-secondary-500 mb-3">
                        <Calendar className="h-4 w-4" />
                        <time dateTime={post.publishedAt || undefined}>
                          {publishedDate}
                        </time>
                      </div>
                      <h2 className="text-xl font-bold text-secondary-900 mb-3 group-hover:text-primary-600 transition-colors">
                        {post.title}
                      </h2>
                      <p className="text-secondary-600 mb-4 line-clamp-3">
                        {excerpt}
                      </p>
                      <div className="flex items-center text-primary-600 font-medium group-hover:gap-2 transition-all">
                        Read more
                        <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </article>
                  </Link>
                );
              })}
            </div>

            {/* Pagination */}
            {(hasMore || page > 0) && (
              <div className="mt-12 flex items-center justify-center gap-4">
                {page > 0 && (
                  <Button
                    variant="secondary"
                    onClick={() => setPage(page - 1)}
                  >
                    Previous
                  </Button>
                )}
                {hasMore && (
                  <Button onClick={() => setPage(page + 1)}>
                    Next
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </main>

      <PublicFooter />
    </div>
  );
}
