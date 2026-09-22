import { useState } from "react";
import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "~/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/Card";
import { Button } from "~/components/ui/Button";
import { useTRPC } from "~/trpc/react";
import { useAuthStore } from "~/lib/stores/auth.store";
import { FileText, Plus, Edit, Trash2, Eye, EyeOff, ExternalLink } from "lucide-react";
import toast from "react-hot-toast";

export const Route = createFileRoute("/admin/pages/")({
  component: AdminPagesPage,
  beforeLoad: () => {
    const user = useAuthStore.getState().user;
    if (!user || user.role !== "ADMIN") {
      throw redirect({ to: '/login' });
    }
  },
});

function AdminPagesPage() {
  const trpc = useTRPC();
  const token = useAuthStore((state) => state.token);
  const [pageType, setPageType] = useState<"PAGE" | "NEWS" | "ALL">("ALL");

  const pagesQuery = useQuery(
    trpc.listPages.queryOptions({
      token: token!,
      includeUnpublished: true,
      pageType: pageType === "ALL" ? undefined : pageType,
    })
  );

  const togglePublishMutation = useMutation(
    trpc.togglePagePublish.mutationOptions({
      onSuccess: () => {
        toast.success("Page status updated");
        pagesQuery.refetch();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to update page status");
      },
    })
  );

  const deletePageMutation = useMutation(
    trpc.deletePage.mutationOptions({
      onSuccess: () => {
        toast.success("Page deleted");
        pagesQuery.refetch();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to delete page");
      },
    })
  );

  const handleTogglePublish = (pageId: string) => {
    togglePublishMutation.mutate({
      token: token!,
      pageId,
    });
  };

  const handleDelete = (pageId: string, title: string) => {
    if (confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      deletePageMutation.mutate({
        token: token!,
        pageId,
      });
    }
  };

  if (pagesQuery.isLoading) {
    return (
      <AdminLayout>
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600"></div>
            <p className="text-gray-600">Loading pages...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const pages = pagesQuery.data || [];
  const publishedCount = pages.filter(p => p.isPublished).length;
  const draftCount = pages.length - publishedCount;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-primary-600" />
              <h1 className="text-3xl font-bold text-gray-900">Content Management</h1>
            </div>
            <p className="mt-2 text-gray-600">
              Manage your site's pages and blog posts. Create, edit, and publish content without coding.
            </p>
          </div>
          <Link to="/admin/pages/new">
            <Button>
              <Plus className="mr-2 h-5 w-5" />
              New Content
            </Button>
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 border-b border-gray-200">
          <button
            onClick={() => setPageType("ALL")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              pageType === "ALL"
                ? "border-b-2 border-primary-600 text-primary-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            All Content
          </button>
          <button
            onClick={() => setPageType("PAGE")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              pageType === "PAGE"
                ? "border-b-2 border-primary-600 text-primary-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Pages
          </button>
          <button
            onClick={() => setPageType("NEWS")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              pageType === "NEWS"
                ? "border-b-2 border-primary-600 text-primary-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            News & Blog
          </button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="py-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900">{pages.length}</p>
                <p className="text-sm text-gray-600">
                  {pageType === "ALL" ? "Total Items" : pageType === "PAGE" ? "Pages" : "News Posts"}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">{publishedCount}</p>
                <p className="text-sm text-gray-600">Published</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-500">{draftCount}</p>
                <p className="text-sm text-gray-600">Drafts</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pages list */}
        {pages.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                No {pageType === "ALL" ? "content" : pageType === "PAGE" ? "pages" : "news posts"} yet
              </h3>
              <p className="mt-2 text-gray-600">
                Get started by creating your first {pageType === "NEWS" ? "news post" : "page"}.
              </p>
              <Link to="/admin/pages/new" className="mt-4 inline-block">
                <Button>
                  <Plus className="mr-2 h-5 w-5" />
                  Create {pageType === "NEWS" ? "Post" : "Page"}
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {pages.map((page) => (
              <Card key={page.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-lg">{page.title}</CardTitle>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          page.pageType === "NEWS" 
                            ? "bg-blue-100 text-blue-800" 
                            : "bg-purple-100 text-purple-800"
                        }`}>
                          {page.pageType === "NEWS" ? "News" : "Page"}
                        </span>
                        {page.isPublished ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
                            <Eye className="h-3 w-3" />
                            Published
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-800">
                            <EyeOff className="h-3 w-3" />
                            Draft
                          </span>
                        )}
                      </div>
                      <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                        <span className="font-mono">/{page.slug}</span>
                        <span>•</span>
                        <span>Updated {new Date(page.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {page.isPublished && (
                        <a
                          href={`/${page.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-500 hover:text-primary-600 transition-colors"
                        >
                          <ExternalLink className="h-5 w-5" />
                        </a>
                      )}
                      <Link to={`/admin/pages/${page.id}/edit`}>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleTogglePublish(page.id)}
                        isLoading={togglePublishMutation.isPending}
                      >
                        {page.isPublished ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(page.id, page.title)}
                        isLoading={deletePageMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
