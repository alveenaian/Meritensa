import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { AdminLayout } from "~/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/Card";
import { Button } from "~/components/ui/Button";
import { Input } from "~/components/ui/Input";
import { useTRPC } from "~/trpc/react";
import { useAuthStore } from "~/lib/stores/auth.store";
import { FileText, Save, Eye } from "lucide-react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useState } from "react";
import Markdown from "markdown-to-jsx";
import { BlockEditor } from "~/components/admin/BlockEditor";
import type { Block } from "~/components/blocks/types";

export const Route = createFileRoute("/admin/pages/new/")({
  component: NewPagePage,
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

function NewPagePage() {
  const trpc = useTRPC();
  const token = useAuthStore((state) => state.token);
  const navigate = useNavigate();
  const [showPreview, setShowPreview] = useState(false);
  const [blocks, setBlocks] = useState<Block[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PageForm>({
    defaultValues: {
      pageType: "PAGE",
      layoutType: "BLOCKS",
      displayOrder: 0,
      canSendAsEmail: false,
    },
  });

  const createPageMutation = useMutation(
    trpc.createPage.mutationOptions({
      onSuccess: () => {
        toast.success("Page created successfully");
        navigate({ to: "/admin/pages" });
      },
      onError: (error) => {
        toast.error(error.message || "Failed to create page");
      },
    })
  );

  const onSubmit = (data: PageForm, isPublished: boolean) => {
    createPageMutation.mutate({
      token: token!,
      title: data.title,
      slug: data.slug,
      content: data.content,
      pageType: data.pageType,
      layoutType: data.layoutType,
      blocks: data.layoutType === "BLOCKS" ? blocks : undefined,
      metaTitle: data.metaTitle || undefined,
      metaDescription: data.metaDescription || undefined,
      displayOrder: data.displayOrder,
      isPublished,
      emailSubject: data.emailSubject || undefined,
      emailPreviewText: data.emailPreviewText || undefined,
      canSendAsEmail: data.canSendAsEmail,
    });
  };

  const title = watch("title");
  const content = watch("content");

  // Auto-generate slug from title
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    const slug = newTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    setValue("slug", slug);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary-600" />
            <h1 className="text-3xl font-bold text-gray-900">Create New Page</h1>
          </div>
          <p className="mt-2 text-gray-600">
            Create a new content page with markdown support.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Form */}
          <div className="space-y-6">
            {/* Page Type Selector */}
            <Card>
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
                        Create a permanent page like About, Contact, or Terms of Service
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
                        Create a news article or blog post with publish date
                      </div>
                    </div>
                  </label>
                </div>
              </CardContent>
            </Card>

            {/* Layout Type Selector */}
            <Card>
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

            <Card>
              <CardHeader>
                <CardTitle>Page Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  label="Page Title"
                  {...register("title", { required: "Title is required" })}
                  error={errors.title?.message}
                  onChange={(e) => {
                    register("title").onChange(e);
                    handleTitleChange(e);
                  }}
                  placeholder="About Us"
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
                  placeholder="about-us"
                  helperText="This will be the URL path: /your-slug"
                  required
                />

                <Input
                  label="Display Order"
                  type="number"
                  {...register("displayOrder", { valueAsNumber: true })}
                  error={errors.displayOrder?.message}
                  placeholder="0"
                  helperText="Lower numbers appear first in navigation"
                />
              </CardContent>
            </Card>

            <Card>
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
              <Card>
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
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

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
                  <div className="flex items-center justify-between">
                    <CardTitle>Content</CardTitle>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPreview(!showPreview)}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      {showPreview ? "Hide" : "Show"} Preview
                    </Button>
                  </div>
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
                      placeholder="# Welcome&#10;&#10;Write your content in **markdown**..."
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

            <div className="flex gap-3">
              <Button
                onClick={handleSubmit((data) => onSubmit(data, false))}
                variant="secondary"
                isLoading={createPageMutation.isPending}
              >
                <Save className="mr-2 h-5 w-5" />
                Save as Draft
              </Button>
              <Button
                onClick={handleSubmit((data) => onSubmit(data, true))}
                isLoading={createPageMutation.isPending}
              >
                <Eye className="mr-2 h-5 w-5" />
                Publish Now
              </Button>
            </div>
          </div>

          {/* Preview */}
          {showPreview && (
            <div className="lg:sticky lg:top-6 lg:h-fit">
              <Card>
                <CardHeader>
                  <CardTitle>Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <h1>{title || "Untitled Page"}</h1>
                    {content ? (
                      <Markdown>{content}</Markdown>
                    ) : (
                      <p className="text-gray-500 italic">No content yet...</p>
                    )}
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
