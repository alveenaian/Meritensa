import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Menu } from "@headlessui/react";
import { DashboardLayout } from "~/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/Card";
import { Button } from "~/components/ui/Button";
import { Input } from "~/components/ui/Input";
import { useTRPC } from "~/trpc/react";
import { useAuthStore } from "~/lib/stores/auth.store";
import { Plus, Briefcase, FileText, AlertCircle, TrendingUp, MoreVertical, Edit2, Trash2 } from "lucide-react";
import { formatCaseType, formatDate } from "~/lib/utils";
import toast from "react-hot-toast";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardPage,
  beforeLoad: () => {
    const user = useAuthStore.getState().user;
    const isAuthenticated = useAuthStore.getState().isAuthenticated();
    
    if (!isAuthenticated) {
      throw redirect({ to: '/login' });
    }
    
    // Redirect admins to admin dashboard
    if (user?.role === 'ADMIN') {
      throw redirect({ to: '/admin' });
    }
  },
});

function DashboardPage() {
  const navigate = useNavigate();
  const trpc = useTRPC();
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);

  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState<{ id: string; title: string } | null>(null);
  const [newCaseTitle, setNewCaseTitle] = useState("");

  const casesQuery = useQuery(
    trpc.listCases.queryOptions({
      token: token!,
      page: 1,
      limit: 5,
    })
  );

  const cases = casesQuery.data?.cases || [];
  const totalCases = casesQuery.data?.pagination.total || 0;

  const renameMutation = useMutation(
    trpc.updateCaseTitle.mutationOptions()
  );

  const deleteMutation = useMutation(
    trpc.deleteCase.mutationOptions()
  );

  const handleRenameClick = (caseItem: { id: string; title: string }) => {
    setSelectedCase(caseItem);
    setNewCaseTitle(caseItem.title);
    setRenameModalOpen(true);
  };

  const handleDeleteClick = (caseItem: { id: string; title: string }) => {
    setSelectedCase(caseItem);
    setDeleteModalOpen(true);
  };

  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase || !newCaseTitle.trim()) return;

    try {
      await renameMutation.mutateAsync({
        token: token!,
        caseId: selectedCase.id,
        title: newCaseTitle.trim(),
      });
      toast.success("Case renamed successfully");
      setRenameModalOpen(false);
      casesQuery.refetch();
    } catch (error) {
      toast.error("Failed to rename case");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedCase) return;

    try {
      await deleteMutation.mutateAsync({
        token: token!,
        caseId: selectedCase.id,
      });
      toast.success("Case deleted successfully");
      setDeleteModalOpen(false);
      casesQuery.refetch();
    } catch (error) {
      toast.error("Failed to delete case");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Welcome header */}
        <div>
          <h1 className="text-4xl font-bold text-secondary-900">
            Welcome back, {user?.name?.split(" ")[0] || "there"}
          </h1>
          <p className="mt-2 text-lg text-secondary-600">
            Manage your cases and track your legal journey
          </p>
        </div>

        {/* Quick stats */}
        <div className="grid gap-6 md:grid-cols-3">
          <StatCard
            icon={<Briefcase className="h-6 w-6 text-primary-600" />}
            label="Total Cases"
            value={totalCases.toString()}
          />
          <StatCard
            icon={<FileText className="h-6 w-6 text-success" />}
            label="Documents Uploaded"
            value={cases.reduce((sum, c) => sum + (c._count?.documents || 0), 0).toString()}
          />
          <StatCard
            icon={<TrendingUp className="h-6 w-6 text-info" />}
            label="Cases in Progress"
            value={cases.filter((c) => c.status === "INTAKE" || c.status === "INTAKE_COMPLETE").length.toString()}
          />
        </div>

        {/* Main actions */}
        {totalCases === 0 ? (
          <Card className="border-2 border-dashed border-secondary-300 bg-secondary-50/30">
            <CardContent className="py-16 text-center">
              <div className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-br from-primary-50 to-primary-100/50 p-4 mb-6 shadow-subtle">
                <Briefcase className="h-12 w-12 text-primary-600" />
              </div>
              <h3 className="text-2xl font-semibold text-secondary-900">
                No cases yet
              </h3>
              <p className="mt-3 text-secondary-600 max-w-md mx-auto">
                Get started by creating your first case. Our AI will guide you
                through the process.
              </p>
              <Link to="/dashboard/cases/new">
                <Button className="mt-8" size="lg">
                  <Plus className="mr-2 h-5 w-5" />
                  Start Your First Case
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Recent cases */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Recent Cases</CardTitle>
                  <Link to="/dashboard/cases/new">
                    <Button size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      New Case
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {casesQuery.isLoading ? (
                  <div className="py-8 text-center text-gray-500">
                    Loading cases...
                  </div>
                ) : cases.length === 0 ? (
                  <div className="py-8 text-center text-gray-500">
                    No cases found
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cases.map((caseItem) => (
                      <div
                        key={caseItem.id}
                        className="flex items-start gap-3 rounded-xl border border-secondary-200/60 p-5 transition-all duration-200 hover:border-primary-300 hover:bg-gradient-to-br hover:from-primary-50/30 hover:to-transparent hover:shadow-card"
                      >
                        <Link
                          to="/dashboard/cases/$caseId"
                          params={{ caseId: caseItem.id }}
                          className="flex-1 min-w-0"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-lg text-secondary-900 truncate">
                                {caseItem.title}
                              </h4>
                              <p className="mt-1 text-sm text-secondary-600">
                                {formatCaseType(caseItem.caseType)}
                              </p>
                              <div className="mt-3 flex items-center gap-4 text-xs text-secondary-500">
                                <span>Created {formatDate(caseItem.createdAt)}</span>
                                <span>•</span>
                                <span>{caseItem._count?.messages || 0} messages</span>
                                <span>•</span>
                                <span>{caseItem._count?.documents || 0} documents</span>
                              </div>
                            </div>
                            <StatusBadge status={caseItem.status} />
                          </div>
                        </Link>
                        
                        <Menu as="div" className="relative">
                          <Menu.Button className="rounded-lg p-2 text-secondary-400 hover:bg-secondary-100 hover:text-secondary-600 transition-colors">
                            <MoreVertical className="h-5 w-5" />
                          </Menu.Button>
                          <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-xl border border-secondary-200 bg-white shadow-elevated focus:outline-none overflow-hidden">
                            <div className="py-1">
                              <Menu.Item>
                                {({ active }) => (
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      handleRenameClick(caseItem);
                                    }}
                                    className={`${
                                      active ? "bg-secondary-50" : ""
                                    } flex w-full items-center px-4 py-2.5 text-sm text-secondary-700 transition-colors`}
                                  >
                                    <Edit2 className="mr-3 h-4 w-4" />
                                    Rename Case
                                  </button>
                                )}
                              </Menu.Item>
                              <Menu.Item>
                                {({ active }) => (
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      handleDeleteClick(caseItem);
                                    }}
                                    className={`${
                                      active ? "bg-red-50" : ""
                                    } flex w-full items-center px-4 py-2.5 text-sm text-red-600 transition-colors`}
                                  >
                                    <Trash2 className="mr-3 h-4 w-4" />
                                    Delete Case
                                  </button>
                                )}
                              </Menu.Item>
                            </div>
                          </Menu.Items>
                        </Menu>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Legal disclaimer */}
            <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50/30">
              <CardContent className="flex items-start gap-4 py-5">
                <div className="flex-shrink-0 rounded-lg bg-amber-100 p-2">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-secondary-900">
                    Important Legal Disclaimer
                  </p>
                  <p className="mt-2 text-sm text-secondary-700 leading-relaxed">
                    Kairav.ai provides legal information, not legal advice. This
                    platform uses AI technology that can make mistakes. Always
                    consult with a qualified attorney for legal advice specific to
                    your situation.
                  </p>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Rename Modal */}
      {renameModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-secondary-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-elevated">
            <h3 className="text-xl font-semibold text-secondary-900">Rename Case</h3>
            <form onSubmit={handleRenameSubmit} className="mt-6">
              <Input
                label="Case Title"
                value={newCaseTitle}
                onChange={(e) => setNewCaseTitle(e.target.value)}
                placeholder="Enter new case title"
                required
                autoFocus
              />
              <div className="mt-6 flex justify-end gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setRenameModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  isLoading={renameMutation.isPending}
                  disabled={!newCaseTitle.trim()}
                >
                  Rename
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-secondary-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-elevated">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0 rounded-lg bg-red-100 p-2">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-secondary-900">Delete Case</h3>
            </div>
            <p className="text-sm text-secondary-700 leading-relaxed">
              Are you sure you want to delete <strong>"{selectedCase?.title}"</strong>? This action cannot be undone.
              All messages, documents, and analysis associated with this case will be permanently deleted.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setDeleteModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDeleteConfirm}
                isLoading={deleteMutation.isPending}
              >
                Delete Case
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="flex items-center gap-4 py-6">
        <div className="rounded-xl bg-gradient-to-br from-primary-50 to-primary-100/50 p-3 shadow-subtle">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-secondary-600">{label}</p>
          <p className="text-3xl font-bold text-secondary-900 mt-1">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { label: string; className: string }> = {
    INTAKE: { label: "In Progress", className: "bg-blue-50 text-blue-700 border border-blue-200" },
    INTAKE_COMPLETE: { label: "Ready", className: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
    UNDER_REVIEW: { label: "Under Review", className: "bg-amber-50 text-amber-700 border border-amber-200" },
    REFERRAL_PENDING: { label: "Referral Pending", className: "bg-purple-50 text-purple-700 border border-purple-200" },
    REFERRED: { label: "Referred", className: "bg-indigo-50 text-indigo-700 border border-indigo-200" },
    CLOSED: { label: "Closed", className: "bg-secondary-100 text-secondary-700 border border-secondary-200" },
  };

  const config = statusConfig[status] || statusConfig.INTAKE;

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${config.className} whitespace-nowrap`}
    >
      {config.label}
    </span>
  );
}
