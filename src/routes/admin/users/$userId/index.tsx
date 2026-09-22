import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "~/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/Card";
import { Button } from "~/components/ui/Button";
import { useTRPC } from "~/trpc/react";
import { useAuthStore } from "~/lib/stores/auth.store";
import { 
  User, 
  Mail, 
  MapPin, 
  Calendar, 
  Briefcase,
  Shield,
  ArrowLeft
} from "lucide-react";
import { formatDate, formatCaseType } from "~/lib/utils";
import { useState } from "react";
import toast from "react-hot-toast";

export const Route = createFileRoute("/admin/users/$userId/")({
  component: AdminUserDetailPage,
  beforeLoad: () => {
    const user = useAuthStore.getState().user;
    if (!user || user.role !== "ADMIN") {
      throw redirect({ to: '/login' });
    }
  },
});

function AdminUserDetailPage() {
  const { userId } = Route.useParams();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const token = useAuthStore((state) => state.token);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [newRole, setNewRole] = useState<"PLAINTIFF" | "ADMIN">("PLAINTIFF");

  const userQuery = useQuery(
    trpc.getUserDetails.queryOptions({
      token: token!,
      userId,
    })
  );

  const updateRoleMutation = useMutation(
    trpc.updateUserRole.mutationOptions({
      onSuccess: () => {
        toast.success("User role updated successfully");
        setShowRoleModal(false);
        queryClient.invalidateQueries({
          queryKey: trpc.getUserDetails.queryKey(),
        });
      },
      onError: (error) => {
        toast.error(error.message || "Failed to update role");
      },
    })
  );

  const impersonateMutation = useMutation(
    trpc.impersonateUser.mutationOptions({
      onSuccess: (data) => {
        // Update auth store with impersonated user's token
        const setAuth = useAuthStore.getState().setAuth;
        setAuth(data.user, data.token);
        
        toast.success(`Now impersonating ${data.user.email}`);
        
        // Redirect to dashboard as the impersonated user
        window.location.href = "/dashboard";
      },
      onError: (error) => {
        toast.error(error.message || "Failed to impersonate user");
      },
    })
  );

  const handleUpdateRole = () => {
    updateRoleMutation.mutate({
      token: token!,
      userId,
      role: newRole,
    });
  };

  const handleImpersonate = () => {
    if (window.confirm(`Are you sure you want to impersonate ${user.email}? You will be logged in as this user.`)) {
      impersonateMutation.mutate({
        token: token!,
        userId,
      });
    }
  };

  if (userQuery.isLoading) {
    return (
      <AdminLayout>
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600"></div>
            <p className="text-gray-600">Loading user details...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const user = userQuery.data;

  if (!user) {
    return (
      <AdminLayout>
        <div className="text-center">
          <p className="text-red-600">User not found</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <Link to="/admin/users" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Users
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{user.name}</h1>
              <p className="mt-2 text-gray-600">{user.email}</p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleImpersonate}
                isLoading={impersonateMutation.isPending}
                variant="secondary"
                disabled={user.role === "ADMIN"}
              >
                Impersonate User
              </Button>
              <Button
                onClick={() => {
                  setNewRole(user.role);
                  setShowRoleModal(true);
                }}
              >
                Manage Role
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* User info */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>User Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <InfoItem
                  icon={<User className="h-5 w-5" />}
                  label="Name"
                  value={user.name || "—"}
                />
                <InfoItem
                  icon={<Mail className="h-5 w-5" />}
                  label="Email"
                  value={user.email}
                />
                <InfoItem
                  icon={<MapPin className="h-5 w-5" />}
                  label="State"
                  value={user.state || "—"}
                />
                <InfoItem
                  icon={<Calendar className="h-5 w-5" />}
                  label="Registered"
                  value={formatDate(user.createdAt)}
                />
                <InfoItem
                  icon={<Shield className="h-5 w-5" />}
                  label="Role"
                  value={
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      user.role === "ADMIN" 
                        ? "bg-purple-100 text-purple-800" 
                        : "bg-gray-100 text-gray-800"
                    }`}>
                      {user.role}
                    </span>
                  }
                />
                <InfoItem
                  icon={<Briefcase className="h-5 w-5" />}
                  label="Total Cases"
                  value={user._count.cases}
                />
              </CardContent>
            </Card>
          </div>

          {/* User's cases */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Cases ({user.cases.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {user.cases.length === 0 ? (
                  <div className="py-12 text-center">
                    <Briefcase className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-4 text-gray-600">No cases yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {user.cases.map((caseItem) => (
                      <div
                        key={caseItem.id}
                        className="rounded-lg border border-gray-200 p-4 hover:border-gray-300 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 truncate">
                              {caseItem.title}
                            </h3>
                            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
                              <span>{formatCaseType(caseItem.caseType)}</span>
                              <span>•</span>
                              <span>{formatDate(caseItem.createdAt)}</span>
                              {caseItem.overallScore && (
                                <>
                                  <span>•</span>
                                  <span className="font-medium">
                                    Score: {caseItem.overallScore.toFixed(0)}/100
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                          <StatusBadge status={caseItem.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Role change modal */}
      {showRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Update User Role
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Role
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as "PLAINTIFF" | "ADMIN")}
                  className="block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
                >
                  <option value="PLAINTIFF">Plaintiff</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div className="rounded-lg bg-yellow-50 p-3 border border-yellow-200">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> Admins have full access to all platform features
                  including user management and case review.
                </p>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <Button
                onClick={handleUpdateRole}
                isLoading={updateRoleMutation.isPending}
                className="flex-1"
              >
                Update Role
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowRoleModal(false)}
                className="flex-1"
                disabled={updateRoleMutation.isPending}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-600">{label}</p>
        <p className="font-medium text-gray-900 truncate">{value}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { label: string; className: string }> = {
    INTAKE: { label: "In Progress", className: "bg-blue-100 text-blue-800" },
    INTAKE_COMPLETE: { label: "Ready", className: "bg-green-100 text-green-800" },
    UNDER_REVIEW: { label: "Under Review", className: "bg-yellow-100 text-yellow-800" },
    REFERRAL_PENDING: { label: "Referral Pending", className: "bg-purple-100 text-purple-800" },
    REFERRED: { label: "Referred", className: "bg-indigo-100 text-indigo-800" },
    CLOSED: { label: "Closed", className: "bg-gray-100 text-gray-800" },
  };

  const config = statusConfig[status] || statusConfig.INTAKE;

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${config.className}`}
    >
      {config.label}
    </span>
  );
}
