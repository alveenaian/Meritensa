import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "~/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/Card";
import { Button } from "~/components/ui/Button";
import { useTRPC } from "~/trpc/react";
import { useAuthStore } from "~/lib/stores/auth.store";
import { Plus, Briefcase } from "lucide-react";
import { formatCaseType, formatDate } from "~/lib/utils";
import { useState } from "react";

export const Route = createFileRoute("/dashboard/cases/")({
  component: MyCasesPage,
  beforeLoad: () => {
    const isAuthenticated = useAuthStore.getState().isAuthenticated();
    if (!isAuthenticated) {
      throw redirect({ to: '/login' });
    }
  },
});

function MyCasesPage() {
  const trpc = useTRPC();
  const token = useAuthStore((state) => state.token);
  const [page, setPage] = useState(1);
  const limit = 10;

  const casesQuery = useQuery(
    trpc.listCases.queryOptions({
      token: token!,
      page,
      limit,
    })
  );

  const cases = casesQuery.data?.cases || [];
  const pagination = casesQuery.data?.pagination;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Cases</h1>
            <p className="mt-2 text-gray-600">
              Manage and track all your legal cases
            </p>
          </div>
          <Link to="/dashboard/cases/new">
            <Button>
              <Plus className="mr-2 h-5 w-5" />
              New Case
            </Button>
          </Link>
        </div>

        {/* Cases list */}
        {casesQuery.isLoading ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              Loading cases...
            </CardContent>
          </Card>
        ) : cases.length === 0 ? (
          <Card className="border-2 border-dashed border-gray-300">
            <CardContent className="py-12 text-center">
              <Briefcase className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-semibold text-gray-900">
                No cases yet
              </h3>
              <p className="mt-2 text-gray-600">
                Get started by creating your first case. Our AI will guide you
                through the process.
              </p>
              <Link to="/dashboard/cases/new">
                <Button className="mt-6" size="lg">
                  <Plus className="mr-2 h-5 w-5" />
                  Start Your First Case
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle>
                  All Cases ({pagination?.total || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {cases.map((caseItem) => (
                    <Link
                      key={caseItem.id}
                      to="/dashboard/cases/$caseId"
                      params={{ caseId: caseItem.id }}
                      className="block rounded-lg border border-gray-200 p-4 transition-colors hover:border-primary-300 hover:bg-primary-50"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">
                            {caseItem.title}
                          </h4>
                          <p className="mt-1 text-sm text-gray-600">
                            {formatCaseType(caseItem.caseType)}
                          </p>
                          <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                            <span>Created {formatDate(caseItem.createdAt)}</span>
                            <span>•</span>
                            <span>{caseItem._count?.messages || 0} messages</span>
                            <span>•</span>
                            <span>{caseItem._count?.documents || 0} documents</span>
                          </div>
                          {caseItem.overallScore && (
                            <div className="mt-2">
                              <span className="text-xs text-gray-500">
                                Case Score:{" "}
                              </span>
                              <span className="text-sm font-semibold text-primary-600">
                                {Math.round(caseItem.overallScore)}/100
                              </span>
                            </div>
                          )}
                        </div>
                        <StatusBadge status={caseItem.status} />
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Showing {(page - 1) * limit + 1} to{" "}
                  {Math.min(page * limit, pagination.total)} of{" "}
                  {pagination.total} cases
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page >= pagination.pages}
                    onClick={() => setPage(page + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
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
