import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "~/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/Card";
import { Button } from "~/components/ui/Button";
import { Input } from "~/components/ui/Input";
import { useTRPC } from "~/trpc/react";
import { useAuthStore } from "~/lib/stores/auth.store";
import { Users, Search, ChevronLeft, ChevronRight, Shield, User } from "lucide-react";
import { formatDate } from "~/lib/utils";
import { useState } from "react";

export const Route = createFileRoute("/admin/users/")({
  component: AdminUsersPage,
  beforeLoad: () => {
    const user = useAuthStore.getState().user;
    if (!user || user.role !== "ADMIN") {
      throw redirect({ to: '/login' });
    }
  },
});

function AdminUsersPage() {
  const trpc = useTRPC();
  const token = useAuthStore((state) => state.token);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 20;

  const usersQuery = useQuery(
    trpc.getAllUsers.queryOptions({
      token: token!,
      search: search || undefined,
      page,
      limit,
    })
  );

  if (usersQuery.isLoading) {
    return (
      <AdminLayout>
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600"></div>
            <p className="text-gray-600">Loading users...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const data = usersQuery.data;
  const users = data?.users || [];
  const pagination = data?.pagination;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Users</h1>
            <p className="mt-2 text-gray-600">
              Manage all users and their roles
            </p>
          </div>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-4">
              <Search className="h-5 w-5 text-gray-400" />
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="flex-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Users table */}
        <Card>
          <CardHeader>
            <CardTitle>All Users ({pagination?.total || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="pb-3 text-left text-sm font-semibold text-gray-900">
                      User
                    </th>
                    <th className="pb-3 text-left text-sm font-semibold text-gray-900">
                      State
                    </th>
                    <th className="pb-3 text-left text-sm font-semibold text-gray-900">
                      Role
                    </th>
                    <th className="pb-3 text-left text-sm font-semibold text-gray-900">
                      Cases
                    </th>
                    <th className="pb-3 text-left text-sm font-semibold text-gray-900">
                      Registered
                    </th>
                    <th className="pb-3 text-left text-sm font-semibold text-gray-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-gray-100">
                      <td className="py-4">
                        <div>
                          <p className="font-medium text-gray-900">{user.name}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                          {user.emailVerified && (
                            <span className="inline-flex items-center gap-1 text-xs text-green-600">
                              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              Verified
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 text-sm text-gray-600">
                        {user.state || "—"}
                      </td>
                      <td className="py-4">
                        <RoleBadge role={user.role} />
                      </td>
                      <td className="py-4 text-sm text-gray-600">
                        {user._count.cases}
                      </td>
                      <td className="py-4 text-sm text-gray-600">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="py-4">
                        <Link to="/admin/users/$userId" params={{ userId: user.id }}>
                          <Button size="sm" variant="secondary">
                            View Details
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {users.length === 0 && (
                <div className="py-12 text-center">
                  <Users className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-4 text-gray-600">No users found</p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Showing {(page - 1) * limit + 1} to{" "}
                  {Math.min(page * limit, pagination.total)} of {pagination.total} users
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="flex items-center px-3 text-sm text-gray-600">
                    Page {page} of {pagination.pages}
                  </span>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                    disabled={page === pagination.pages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

function RoleBadge({ role }: { role: string }) {
  if (role === "ADMIN") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-semibold text-purple-800">
        <Shield className="h-3 w-3" />
        Admin
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-800">
      <User className="h-3 w-3" />
      Plaintiff
    </span>
  );
}
