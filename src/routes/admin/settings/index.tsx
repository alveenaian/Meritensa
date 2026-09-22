import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "~/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/Card";
import { Button } from "~/components/ui/Button";
import { Input } from "~/components/ui/Input";
import { useTRPC } from "~/trpc/react";
import { useAuthStore } from "~/lib/stores/auth.store";
import { Settings, Save } from "lucide-react";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

export const Route = createFileRoute("/admin/settings/")({
  component: AdminSettingsPage,
  beforeLoad: () => {
    const user = useAuthStore.getState().user;
    if (!user || user.role !== "ADMIN") {
      throw redirect({ to: '/login' });
    }
  },
});

function AdminSettingsPage() {
  const trpc = useTRPC();
  const token = useAuthStore((state) => state.token);

  const settingsQuery = useQuery(
    trpc.getSiteSettings.queryOptions()
  );

  const updateSettingsMutation = useMutation(
    trpc.updateSiteSettings.mutationOptions({
      onSuccess: () => {
        toast.success("Settings updated successfully");
        settingsQuery.refetch();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to update settings");
      },
    })
  );

  const [formData, setFormData] = useState({
    siteName: "",
    tagline: "",
    description: "",
    footerText: "",
    contactEmail: "",
    supportEmail: "",
    linkedinUrl: "",
    twitterUrl: "",
    facebookUrl: "",
    companyName: "",
    copyrightYear: new Date().getFullYear(),
    primaryColor: "",
    accentColor: "",
    fontFamily: "",
    headingFont: "",
  });

  useEffect(() => {
    if (settingsQuery.data) {
      setFormData({
        siteName: settingsQuery.data.siteName,
        tagline: settingsQuery.data.tagline,
        description: settingsQuery.data.description,
        footerText: settingsQuery.data.footerText || "",
        contactEmail: settingsQuery.data.contactEmail,
        supportEmail: settingsQuery.data.supportEmail,
        linkedinUrl: settingsQuery.data.linkedinUrl || "",
        twitterUrl: settingsQuery.data.twitterUrl || "",
        facebookUrl: settingsQuery.data.facebookUrl || "",
        companyName: settingsQuery.data.companyName,
        copyrightYear: settingsQuery.data.copyrightYear,
        primaryColor: settingsQuery.data.primaryColor || "",
        accentColor: settingsQuery.data.accentColor || "",
        fontFamily: settingsQuery.data.fontFamily || "",
        headingFont: settingsQuery.data.headingFont || "",
      });
    }
  }, [settingsQuery.data]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    updateSettingsMutation.mutate({
      token: token!,
      ...formData,
      footerText: formData.footerText || null,
      linkedinUrl: formData.linkedinUrl || null,
      twitterUrl: formData.twitterUrl || null,
      facebookUrl: formData.facebookUrl || null,
      primaryColor: formData.primaryColor || null,
      accentColor: formData.accentColor || null,
      fontFamily: formData.fontFamily || null,
      headingFont: formData.headingFont || null,
    });
  };

  const handleChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (settingsQuery.isLoading) {
    return (
      <AdminLayout>
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600"></div>
            <p className="text-gray-600">Loading settings...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3">
            <Settings className="h-8 w-8 text-primary-600" />
            <h1 className="text-3xl font-bold text-gray-900">Site Settings</h1>
          </div>
          <p className="mt-2 text-gray-600">
            Manage your site's name, tagline, footer, and contact information.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* General Settings */}
          <Card>
            <CardHeader>
              <CardTitle>General Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Site Name"
                value={formData.siteName}
                onChange={(e) => handleChange("siteName", e.target.value)}
                placeholder="Kairav.ai"
                required
              />
              <Input
                label="Tagline"
                value={formData.tagline}
                onChange={(e) => handleChange("tagline", e.target.value)}
                placeholder="The Plaintiff Operating System"
                required
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder="AI-powered case preparation for plaintiffs seeking justice."
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-colors"
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Footer Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Footer Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Footer Text
                </label>
                <textarea
                  value={formData.footerText}
                  onChange={(e) => handleChange("footerText", e.target.value)}
                  placeholder="Optional custom footer text (supports Markdown)"
                  rows={4}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-colors"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Leave empty to use the default description. Supports Markdown formatting.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label="Company Name"
                  value={formData.companyName}
                  onChange={(e) => handleChange("companyName", e.target.value)}
                  placeholder="Kairav.ai"
                  required
                />
                <Input
                  label="Copyright Year"
                  type="number"
                  value={formData.copyrightYear}
                  onChange={(e) => handleChange("copyrightYear", parseInt(e.target.value))}
                  min={2020}
                  max={2100}
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label="Contact Email"
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => handleChange("contactEmail", e.target.value)}
                  placeholder="contact@kairav.ai"
                  required
                />
                <Input
                  label="Support Email"
                  type="email"
                  value={formData.supportEmail}
                  onChange={(e) => handleChange("supportEmail", e.target.value)}
                  placeholder="support@kairav.ai"
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Social Media */}
          <Card>
            <CardHeader>
              <CardTitle>Social Media Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="LinkedIn URL"
                type="url"
                value={formData.linkedinUrl}
                onChange={(e) => handleChange("linkedinUrl", e.target.value)}
                placeholder="https://www.linkedin.com/company/kairav-ai"
              />
              <Input
                label="Twitter URL"
                type="url"
                value={formData.twitterUrl}
                onChange={(e) => handleChange("twitterUrl", e.target.value)}
                placeholder="https://twitter.com/kairavai"
              />
              <Input
                label="Facebook URL"
                type="url"
                value={formData.facebookUrl}
                onChange={(e) => handleChange("facebookUrl", e.target.value)}
                placeholder="https://www.facebook.com/kairavai"
              />
            </CardContent>
          </Card>

          {/* Theme Customization */}
          <Card>
            <CardHeader>
              <CardTitle>Theme Customization</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600 mb-4">
                Customize your site's colors and fonts. Leave blank to use default values.
                Changes will apply site-wide on the next page load.
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Primary Color
                  </label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={formData.primaryColor || "#6366f1"}
                      onChange={(e) => handleChange("primaryColor", e.target.value)}
                      className="w-20 h-10 p-1"
                    />
                    <Input
                      type="text"
                      value={formData.primaryColor}
                      onChange={(e) => handleChange("primaryColor", e.target.value)}
                      placeholder="#6366f1 (default)"
                      pattern="^#[0-9A-Fa-f]{6}$"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Main brand color for buttons, links, etc.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Accent Color
                  </label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={formData.accentColor || "#a855f7"}
                      onChange={(e) => handleChange("accentColor", e.target.value)}
                      className="w-20 h-10 p-1"
                    />
                    <Input
                      type="text"
                      value={formData.accentColor}
                      onChange={(e) => handleChange("accentColor", e.target.value)}
                      placeholder="#a855f7 (default)"
                      pattern="^#[0-9A-Fa-f]{6}$"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Secondary color for accents and highlights.
                  </p>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label="Body Font Family"
                  value={formData.fontFamily}
                  onChange={(e) => handleChange("fontFamily", e.target.value)}
                  placeholder="Inter (default)"
                />
                <Input
                  label="Heading Font Family"
                  value={formData.headingFont}
                  onChange={(e) => handleChange("headingFont", e.target.value)}
                  placeholder="Inter (default)"
                />
              </div>
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> For custom fonts, you'll need to ensure they're loaded via Google Fonts or another font service. 
                  Common options: Inter, Roboto, Open Sans, Lato, Montserrat, Poppins, Source Sans Pro.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              type="submit"
              size="lg"
              isLoading={updateSettingsMutation.isPending}
            >
              <Save className="mr-2 h-5 w-5" />
              Save Settings
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
