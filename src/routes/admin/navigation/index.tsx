import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "~/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/Card";
import { Button } from "~/components/ui/Button";
import { Input } from "~/components/ui/Input";
import { useTRPC } from "~/trpc/react";
import { useAuthStore } from "~/lib/stores/auth.store";
import { Navigation, Plus, Edit, Trash2, ChevronUp, ChevronDown, ExternalLink, Check, X } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

export const Route = createFileRoute("/admin/navigation/")({
  component: AdminNavigationPage,
  beforeLoad: () => {
    const user = useAuthStore.getState().user;
    if (!user || user.role !== "ADMIN") {
      throw redirect({ to: '/login' });
    }
  },
});

function AdminNavigationPage() {
  const trpc = useTRPC();
  const token = useAuthStore((state) => state.token);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);

  const navQuery = useQuery(
    trpc.listNavigationItems.queryOptions({
      includeDisabled: true,
    })
  );

  const createNavMutation = useMutation(
    trpc.createNavigationItem.mutationOptions({
      onSuccess: () => {
        toast.success("Navigation item created");
        navQuery.refetch();
        setShowNewForm(false);
      },
      onError: (error) => {
        toast.error(error.message || "Failed to create item");
      },
    })
  );

  const updateNavMutation = useMutation(
    trpc.updateNavigationItem.mutationOptions({
      onSuccess: () => {
        toast.success("Navigation item updated");
        navQuery.refetch();
        setEditingId(null);
      },
      onError: (error) => {
        toast.error(error.message || "Failed to update item");
      },
    })
  );

  const deleteNavMutation = useMutation(
    trpc.deleteNavigationItem.mutationOptions({
      onSuccess: () => {
        toast.success("Navigation item deleted");
        navQuery.refetch();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to delete item");
      },
    })
  );

  const reorderMutation = useMutation(
    trpc.reorderNavigationItems.mutationOptions({
      onSuccess: () => {
        toast.success("Order updated");
        navQuery.refetch();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to update order");
      },
    })
  );

  const handleMove = (index: number, direction: "up" | "down") => {
    if (!navQuery.data) return;
    
    const items = [...navQuery.data];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    
    if (newIndex < 0 || newIndex >= items.length) return;
    
    // Swap items
    [items[index], items[newIndex]] = [items[newIndex], items[index]];
    
    // Update order values
    const updates = items.map((item, idx) => ({
      id: item.id,
      order: idx,
    }));
    
    reorderMutation.mutate({
      token: token!,
      items: updates,
    });
  };

  const handleDelete = (id: string, label: string) => {
    if (confirm(`Are you sure you want to delete "${label}"?`)) {
      deleteNavMutation.mutate({
        token: token!,
        itemId: id,
      });
    }
  };

  if (navQuery.isLoading) {
    return (
      <AdminLayout>
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600"></div>
            <p className="text-gray-600">Loading navigation...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const items = navQuery.data || [];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Navigation className="h-8 w-8 text-primary-600" />
              <h1 className="text-3xl font-bold text-gray-900">Site Navigation</h1>
            </div>
            <p className="mt-2 text-gray-600">
              Manage your site's main navigation menu. Items appear in the order shown below.
            </p>
          </div>
          <Button onClick={() => setShowNewForm(true)}>
            <Plus className="mr-2 h-5 w-5" />
            Add Item
          </Button>
        </div>

        {/* New item form */}
        {showNewForm && (
          <Card className="border-primary-200 bg-primary-50">
            <CardHeader>
              <CardTitle>New Navigation Item</CardTitle>
            </CardHeader>
            <CardContent>
              <NavigationForm
                onSubmit={(data) => {
                  createNavMutation.mutate({
                    token: token!,
                    ...data,
                    order: items.length,
                  });
                }}
                onCancel={() => setShowNewForm(false)}
                isLoading={createNavMutation.isPending}
              />
            </CardContent>
          </Card>
        )}

        {/* Navigation items list */}
        {items.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Navigation className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">No navigation items</h3>
              <p className="mt-2 text-gray-600">Get started by adding your first navigation item.</p>
              <Button className="mt-4" onClick={() => setShowNewForm(true)}>
                <Plus className="mr-2 h-5 w-5" />
                Add Item
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {items.map((item, index) => (
              <Card key={item.id}>
                <CardContent className="py-4">
                  {editingId === item.id ? (
                    <NavigationForm
                      defaultValues={{
                        label: item.label,
                        href: item.href,
                        isExternal: item.isExternal,
                        isEnabled: item.isEnabled,
                      }}
                      onSubmit={(data) => {
                        updateNavMutation.mutate({
                          token: token!,
                          itemId: item.id,
                          ...data,
                        });
                      }}
                      onCancel={() => setEditingId(null)}
                      isLoading={updateNavMutation.isPending}
                    />
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="flex flex-col gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMove(index, "up")}
                            disabled={index === 0 || reorderMutation.isPending}
                          >
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMove(index, "down")}
                            disabled={index === items.length - 1 || reorderMutation.isPending}
                          >
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{item.label}</span>
                            {item.isExternal && (
                              <ExternalLink className="h-4 w-4 text-gray-400" />
                            )}
                            {!item.isEnabled && (
                              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                Disabled
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 font-mono">{item.href}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingId(item.id)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(item.id, item.label)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

interface NavigationFormData {
  label: string;
  href: string;
  isExternal: boolean;
  isEnabled: boolean;
}

function NavigationForm({
  defaultValues,
  onSubmit,
  onCancel,
  isLoading,
}: {
  defaultValues?: NavigationFormData;
  onSubmit: (data: NavigationFormData) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const [label, setLabel] = useState(defaultValues?.label || "");
  const [href, setHref] = useState(defaultValues?.href || "");
  const [isExternal, setIsExternal] = useState(defaultValues?.isExternal || false);
  const [isEnabled, setIsEnabled] = useState(defaultValues?.isEnabled ?? true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ label, href, isExternal, isEnabled });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Input
          label="Label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="About Us"
          required
        />
        <Input
          label="Link URL"
          value={href}
          onChange={(e) => setHref(e.target.value)}
          placeholder="/about or https://example.com"
          required
        />
      </div>
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isExternal}
            onChange={(e) => setIsExternal(e.target.checked)}
            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <span>External Link</span>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isEnabled}
            onChange={(e) => setIsEnabled(e.target.checked)}
            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <span>Enabled</span>
        </label>
      </div>
      <div className="flex gap-2">
        <Button type="submit" isLoading={isLoading}>
          <Check className="mr-2 h-4 w-4" />
          Save
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          <X className="mr-2 h-4 w-4" />
          Cancel
        </Button>
      </div>
    </form>
  );
}
