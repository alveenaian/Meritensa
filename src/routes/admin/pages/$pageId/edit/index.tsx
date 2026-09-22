import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "~/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/Card";
import { Button } from "~/components/ui/Button";
import { Input } from "~/components/ui/Input";
import { useTRPC } from "~/trpc/react";
import { useAuthStore } from "~/lib/stores/auth.store";
import { FileText, Save, Eye, EyeOff, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useState, useEffect } from "react";
import Markdown from "markdown-to-jsx";
import { BlockEditor } from "~/components/admin/BlockEditor";
import type { Block } from "~/components/blocks/types";

export const Route = createFileRoute("/admin/pages/$pageId/edit/")({
  component: EditPagePage,
  beforeLoad: () => {
    const user = useAuthStore.getState().user;
    if (!user || user.role !== "ADMIN") {
      throw redirect({ to: '/login' });
    }
  },
});

interface PageForm {
  title: string;
  slug: string;
  content: string;
  pageType: "PAGE" | "NEWS";
  layoutType: "MARKDOWN" | "BLOCKS";
  metaTitle?: string;
  metaDescription?: string;
  displayOrder: number;
  emailSubject?: string;
  emailPreviewText?: string;
  canSendAsEmail: boolean;
}

function EditPagePage() {
  const { pageId } = Route.useParams();
  const trpc = useTRPC();
  const token = useAuthStore((state) => state.token);
  const navigate = useNavigate();
  const [showPreview, setShowPreview] = useState(false);
  const [showLivePreview, setShowLivePreview] = useState(true);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [iframeKey, setIframeKey] = useState(0);

  const pageQuery = useQuery(
    trpc.getPage.queryOptions({
      token: token!,
      pageId,
    })
  );

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<PageForm>();

  // Load page data into form
  useEffect(() => {
    if (pageQuery.data) {
      reset({
        title: pageQuery.data.title,
        slug: pageQuery.data.slug,
        content: pageQuery.data.content,
        pageType: pageQuery.data.pageType,
        layoutType: pageQuery.data.layoutType || "MARKDOWN",
        metaTitle: pageQuery.data.metaTitle || undefined,
        metaDescription: pageQuery.data.metaDescription || undefined,
        displayOrder: pageQuery.data.displayOrder,
        emailSubject: pageQuery.data.emailSubject || undefined,
        emailPreviewText: pageQuery.data.emailPreviewText || undefined,
        canSendAsEmail: pageQuery.data.canSendAsEmail || false,
      });
      
      // Load blocks if available
      if (pageQuery.data.blocks) {
        setBlocks(pageQuery.data.blocks as Block[]);
      }
    }
  }, [pageQuery.data, reset]);

  // Refresh iframe when blocks change or content is saved
  useEffect(() => {
    if (showLivePreview && pageQuery.data) {
      // Small delay to allow save to complete
      const timer = setTimeout(() => {
        setIframeKey(prev => prev + 1);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [blocks, showLivePreview, pageQuery.data?.updatedAt]);

  const updatePageMutation = useMutation(
    trpc.updatePage.mutationOptions({
      onSuccess: () => {
        toast.success("Page updated successfully");
        pageQuery.refetch();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to update page");
      },
    })
  );

  const togglePublishMutation = useMutation(
    trpc.togglePagePublish.mutationOptions({
      onSuccess: () => {
        toast.success("Page status updated");
        pageQuery.refetch();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to update status");
      },
    })
  );

  const deletePageMutation = useMutation(
    trpc.deletePage.mutationOptions({
      onSuccess: () => {
        toast.success("Page deleted");
        navigate({ to: "/admin/pages" });
      },
      onError: (error) => {
        toast.error(error.message || "Failed to delete page");
      },
    })
  );

  const sendEmailMutation = useMutation(
    trpc.sendPageAsEmail.mutationOptions({
      onSuccess: (data) => {
        toast.success(data.message || "Email sent successfully");
        pageQuery.refetch();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to send email");
      },
    })
  );

  const onSubmit = (data: PageForm) => {
    updatePageMutation.mutate({
      token: token!,
      pageId,
      title: data.title,
      slug: data.slug,
      content: data.content,
      pageType: data.pageType,
      layoutType: data.layoutType,
      blocks: data.layoutType === "BLOCKS" ? blocks : undefined,
      metaTitle: data.metaTitle || null,
      metaDescription: data.metaDescription || null,
      displayOrder: data.displayOrder,
      emailSubject: data.emailSubject || null,
      emailPreviewText: data.emailPreviewText || null,
      canSendAsEmail: data.canSendAsEmail,
    });
  };

  const handleTogglePublish = () => {
    togglePublishMutation.mutate({
      token: token!,
      pageId,
    });
  };

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete "${pageQuery.data?.title}"? This action cannot be undone.`)) {
      deletePageMutation.mutate({
        token: token!,
        pageId,
      });
    }
  };

  const handleSendEmail = (testEmail?: string) => {
    if (!page.canSendAsEmail) {
      toast.error("This page is not configured for email sending");
      return;
    }

    const message = testEmail 
      ? `Send test email to ${testEmail}?`
      : "Send this post as an email to all subscribers? This action cannot be undone.";
    
    if (confirm(message)) {
      sendEmailMutation.mutate({
        token: token!,
        pageId,
        testEmail,
      });
    }
  };

  if (pageQuery.isLoading) {
    return (
      <AdminLayout>
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600"></div>
            <p className="text-gray-600">Loading page...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!pageQuery.data) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-gray-600">Page not found</p>
        </div>
      </AdminLayout>
    );
  }

  const page = pageQuery.data;
  const title = watch("title");
  const content = watch("content");

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between fade-in">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center shadow-sm">
                <FileText className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Edit Page</h1>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-sm text-gray-600">
                    {page.title}
                  </p>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    page.isPublished 
                      ? 'bg-green-100 text-green-800 border border-green-200' 
                      : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                  }`}>
                    {page.isPublished ? '● Published' : '● Draft'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={handleTogglePublish}
              isLoading={togglePublishMutation.isPending}
              className="shadow-md hover:shadow-lg"
            >
              {page.isPublished ? (
                <>
                  <EyeOff className="mr-2 h-5 w-5" />
                  Unpublish
                </>
              ) : (
                <>
                  <Eye className="mr-2 h-5 w-5" />
                  Publish
                </>
              )}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              isLoading={deletePageMutation.isPending}
              className="shadow-md hover:shadow-lg"
            >
              <Trash2 className="mr-2 h-5 w-5" />
              Delete
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Form */}
          <div className="space-y-6">
            <Card className="fade-in" style={{ animationDelay: "50ms" }}>
              <CardHeader>
                <CardTitle>Page Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  label="Page Title"
                  {...register("title", { required: "Title is required" })}
                  error={errors.title?.message}
                  required
                />

                <Input
                  label="URL Slug"
                  {...register("slug", {
                    required: "Slug is required",
                    pattern: {
                      value: /^[a-z0-9-]+$/,
                      message: "Slug must contain only lowercase letters, numbers, and hyphens",
                    },
                  })}
                  error={errors.slug?.message}
                  helperText="This will be the URL path: /your-slug"
                  required
                />

                <Input
                  label="Display Order"
                  type="number"
                  {...register("displayOrder", { valueAsNumber: true })}
                  error={errors.displayOrder?.message}
                  helperText="Lower numbers appear first in navigation"
                />
              </CardContent>
            </Card>

            <Card className="fade-in" style={{ animationDelay: "100ms" }}>
              <CardHeader>
                <CardTitle>Content Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="radio"
                      value="PAGE"
                      {...register("pageType")}
                      className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500"
                    />
                    <div>
                      <div className="font-medium text-gray-900">Static Page</div>
                      <div className="text-sm text-gray-600">
                        A permanent page like About, Contact, or Terms of Service
                      </div>
                    </div>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="radio"
                      value="NEWS"
                      {...register("pageType")}
                      className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500"
                    />
                    <div>
                      <div className="font-medium text-gray-900">News/Blog Post</div>
                      <div className="text-sm text-gray-600">
                        A news article or blog post with publish date
                      </div>
                    </div>
                  </label>
                </div>
              </CardContent>
            </Card>

            <Card className="fade-in" style={{ animationDelay: "150ms" }}>
              <CardHeader>
                <CardTitle>SEO Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  label="Meta Title"
                  {...register("metaTitle")}
                  placeholder="Leave empty to use page title"
                  helperText="Shown in browser tabs and search results"
                />

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Meta Description
                  </label>
                  <textarea
                    {...register("metaDescription")}
                    className="block w-full rounded-xl border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-400 transition-all duration-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                    rows={3}
                    placeholder="Brief description for search engines"
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    Shown in search results (150-160 characters recommended)
                  </p>
                </div>
              </CardContent>
            </Card>

            {watch("pageType") === "NEWS" && (
              <Card className="fade-in" style={{ animationDelay: "175ms" }}>
                <CardHeader>
                  <CardTitle>Email Publishing (Beehiiv-style)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl hover:bg-gray-50 transition-colors border-2 border-gray-200">
                    <input
                      type="checkbox"
                      {...register("canSendAsEmail")}
                      className="mt-1 h-4 w-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                    />
                    <div>
                      <div className="font-medium text-gray-900">Enable Email Sending</div>
                      <div className="text-sm text-gray-600">
                        Allow this post to be sent as an email newsletter
                      </div>
                    </div>
                  </label>

                  {watch("canSendAsEmail") && (
                    <div className="space-y-4 pt-2 border-t border-gray-200">
                      <Input
                        label="Email Subject Line"
                        {...register("emailSubject")}
                        placeholder={watch("title") || "Your email subject"}
                        helperText="Leave empty to use the post title"
                      />

                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          Email Preview Text
                        </label>
                        <textarea
                          {...register("emailPreviewText")}
                          className="block w-full rounded-xl border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-400 transition-all duration-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                          rows={2}
                          placeholder="Brief preview text shown in email clients"
                        />
                        <p className="mt-2 text-sm text-gray-500">
                          Shown in email client previews (50-100 characters recommended)
                        </p>
                      </div>

                      {page.lastEmailSentAt && (
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                          <p className="text-sm text-blue-800">
                            <strong>Last sent:</strong> {new Date(page.lastEmailSentAt).toLocaleString()}
                          </p>
                        </div>
                      )}

                      <div className="flex gap-2 pt-2">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            const email = prompt("Enter test email address:");
                            if (email) handleSendEmail(email);
                          }}
                          isLoading={sendEmailMutation.isPending}
                        >
                          Send Test Email
                        </Button>
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          onClick={() => handleSendEmail()}
                          isLoading={sendEmailMutation.isPending}
                        >
                          Send to Subscribers
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <Card className="fade-in" style={{ animationDelay: "200ms" }}>
              <CardHeader>
                <CardTitle>Layout Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="radio"
                      value="MARKDOWN"
                      {...register("layoutType")}
                      className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500"
                    />
                    <div>
                      <div className="font-medium text-gray-900">Markdown (Legacy)</div>
                      <div className="text-sm text-gray-600">
                        Simple markdown content with prose styling
                      </div>
                    </div>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="radio"
                      value="BLOCKS"
                      {...register("layoutType")}
                      className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500"
                    />
                    <div>
                      <div className="font-medium text-gray-900">Blocks (Modern)</div>
                      <div className="text-sm text-gray-600">
                        Visual block-based layout like Notion or Framer
                      </div>
                    </div>
                  </label>
                </div>
              </CardContent>
            </Card>

            {watch("layoutType") === "BLOCKS" ? (
              <Card>
                <CardHeader>
                  <CardTitle>Page Blocks</CardTitle>
                </CardHeader>
                <CardContent>
                  <BlockEditor blocks={blocks} onChange={setBlocks} />
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Content</CardTitle>
                </CardHeader>
                <CardContent>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Markdown Content
                    </label>
                    <textarea
                      {...register("content", { required: "Content is required" })}
                      className="block w-full rounded-xl border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-400 transition-all duration-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none font-mono text-sm"
                      rows={20}
                    />
                    {errors.content && (
                      <p className="mt-2 text-sm text-red-600">{errors.content.message}</p>
                    )}
                    <p className="mt-2 text-sm text-gray-500">
                      Supports full Markdown syntax including headings, lists, links, and images
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            <Button
              onClick={handleSubmit(onSubmit)}
              isLoading={updatePageMutation.isPending}
              className="w-full shadow-lg hover:shadow-xl fade-in"
              style={{ animationDelay: "250ms" }}
            >
              <Save className="mr-2 h-5 w-5" />
              Save Changes
            </Button>
          </div>

          {/* Preview Options */}
          {watch("layoutType") === "MARKDOWN" && (
            <div className="lg:sticky lg:top-6 lg:h-fit fade-in">
              <Card className="shadow-xl border-2 border-primary-100">
                <CardHeader className="bg-gradient-to-r from-primary-50 to-purple-50">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="h-5 w-5 text-primary-600" />
                      Preview
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={showPreview ? "primary" : "ghost"}
                        size="sm"
                        onClick={() => {
                          setShowPreview(!showPreview);
                          if (!showPreview) setShowLivePreview(false);
                        }}
                      >
                        Markdown
                      </Button>
                      <Button
                        type="button"
                        variant={showLivePreview ? "primary" : "ghost"}
                        size="sm"
                        onClick={() => {
                          setShowLivePreview(!showLivePreview);
                          if (!showLivePreview) setShowPreview(false);
                        }}
                      >
                        Live Page
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="bg-white">
                  {showPreview && (
                    <div className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-headings:font-bold prose-p:text-gray-700 prose-p:leading-relaxed prose-a:text-primary-600 prose-a:no-underline hover:prose-a:text-primary-700">
                      <h1>{title || "Untitled Page"}</h1>
                      {content ? (
                        <Markdown>{content}</Markdown>
                      ) : (
                        <p className="text-gray-400 italic">Start typing to see your content preview...</p>
                      )}
                    </div>
                  )}
                  {showLivePreview && page.slug && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                        <span>Viewing: /{page.slug}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setIframeKey(prev => prev + 1)}
                        >
                          Refresh
                        </Button>
                      </div>
                      <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
                        <iframe
                          key={iframeKey}
                          src={`/${page.slug}`}
                          className="w-full h-[600px]"
                          title="Live Preview"
                        />
                      </div>
                      <p className="text-xs text-gray-500 text-center">
                        This shows the actual page as users will see it. Save changes to update.
                      </p>
                    </div>
                  )}
                  {!showPreview && !showLivePreview && (
                    <p className="text-gray-400 italic text-center py-8">
                      Select a preview mode above to see your content
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Block-based preview */}
          {watch("layoutType") === "BLOCKS" && showLivePreview && page.slug && (
            <div className="lg:sticky lg:top-6 lg:h-fit fade-in">
              <Card className="shadow-xl border-2 border-primary-100">
                <CardHeader className="bg-gradient-to-r from-primary-50 to-purple-50">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="h-5 w-5 text-primary-600" />
                      Live Page Preview
                    </CardTitle>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setIframeKey(prev => prev + 1)}
                    >
                      Refresh
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="bg-white">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                      <span>Viewing: /{page.slug}</span>
                    </div>
                    <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
                      <iframe
                        key={iframeKey}
                        src={`/${page.slug}`}
                        className="w-full h-[600px]"
                        title="Live Preview"
                      />
                    </div>
                    <p className="text-xs text-gray-500 text-center">
                      This shows the actual page as users will see it. Save changes to update.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
