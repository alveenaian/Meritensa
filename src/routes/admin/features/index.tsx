import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "~/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/Card";
import { Button } from "~/components/ui/Button";
import { useTRPC } from "~/trpc/react";
import { useAuthStore } from "~/lib/stores/auth.store";
import { Settings, DollarSign, Lock, Unlock } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

export const Route = createFileRoute("/admin/features/")({
  component: AdminFeaturesPage,
  beforeLoad: () => {
    const user = useAuthStore.getState().user;
    if (!user || user.role !== "ADMIN") {
      throw redirect({ to: '/login' });
    }
  },
});

function AdminFeaturesPage() {
  const trpc = useTRPC();
  const token = useAuthStore((state) => state.token);

  const featuresQuery = useQuery(
    trpc.getFeatureConfigs.queryOptions({
      token: token!,
    })
  );

  const updateFeatureMutation = useMutation(
    trpc.updateFeatureConfig.mutationOptions({
      onSuccess: () => {
        toast.success("Feature updated successfully");
        featuresQuery.refetch();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to update feature");
      },
    })
  );

  if (featuresQuery.isLoading) {
    return (
      <AdminLayout>
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600"></div>
            <p className="text-gray-600">Loading features...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const features = featuresQuery.data || [];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3">
            <Settings className="h-8 w-8 text-primary-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              Feature Gating Configuration
            </h1>
          </div>
          <p className="mt-2 text-gray-600">
            Control which features require payment or referral. Changes take effect immediately.
          </p>
        </div>

        {/* Info banner */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <Lock className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-medium mb-1">Current Status: All Features FREE</p>
                <p>
                  All features are currently set to FREE access. The payment infrastructure
                  is ready but dormant. Change access types below to enable monetization.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features list */}
        <div className="space-y-4">
          {features.map((feature) => (
            <FeatureCard
              key={feature.id}
              feature={feature}
              onUpdate={(updates) => {
                updateFeatureMutation.mutate({
                  token: token!,
                  featureKey: feature.featureKey,
                  ...updates,
                });
              }}
              isUpdating={updateFeatureMutation.isPending}
            />
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}

function FeatureCard({
  feature,
  onUpdate,
  isUpdating,
}: {
  feature: any;
  onUpdate: (updates: any) => void;
  isUpdating: boolean;
}) {
  const [accessType, setAccessType] = useState(feature.accessType);
  const [price, setPrice] = useState(feature.price || 0);
  const [isEnabled, setIsEnabled] = useState(feature.isEnabled);

  const hasChanges =
    accessType !== feature.accessType ||
    price !== feature.price ||
    isEnabled !== feature.isEnabled;

  const handleSave = () => {
    onUpdate({
      accessType,
      price: accessType === "PAYMENT_REQUIRED" ? price : null,
      isEnabled,
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{feature.name}</CardTitle>
            {feature.description && (
              <p className="mt-1 text-sm text-gray-600">{feature.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isEnabled}
                onChange={(e) => setIsEnabled(e.target.checked)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="font-medium">Enabled</span>
            </label>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Access type selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Access Type
            </label>
            <select
              value={accessType}
              onChange={(e) => setAccessType(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-opacity-20"
            >
              <option value="FREE">Free</option>
              <option value="REFERRAL_REQUIRED">Requires Referral</option>
              <option value="PAYMENT_REQUIRED">Requires Payment</option>
            </select>
          </div>

          {/* Price input (only for PAYMENT_REQUIRED) */}
          {accessType === "PAYMENT_REQUIRED" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price (USD)
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <DollarSign className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.01"
                  className="block w-full rounded-lg border border-gray-300 pl-10 pr-3 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-opacity-20"
                />
              </div>
            </div>
          )}

          {/* Status badge */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Current Status:</span>
            {feature.accessType === "FREE" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
                <Unlock className="h-3 w-3" />
                Free Access
              </span>
            )}
            {feature.accessType === "REFERRAL_REQUIRED" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-800">
                <Lock className="h-3 w-3" />
                Referral Required
              </span>
            )}
            {feature.accessType === "PAYMENT_REQUIRED" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
                <DollarSign className="h-3 w-3" />
                ${feature.price?.toFixed(2) || "0.00"}
              </span>
            )}
          </div>

          {/* Save button */}
          {hasChanges && (
            <div className="pt-2">
              <Button
                onClick={handleSave}
                isLoading={isUpdating}
                size="sm"
                className="w-full sm:w-auto"
              >
                Save Changes
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
