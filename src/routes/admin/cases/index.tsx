import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "~/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/Card";
import { Button } from "~/components/ui/Button";
import { useTRPC } from "~/trpc/react";
import { useAuthStore } from "~/lib/stores/auth.store";
import { 
  Briefcase, 
  FileText, 
  MessageSquare,
  ExternalLink,
  Filter
} from "lucide-react";
import { formatDate, formatCaseType } from "~/lib/utils";
import { useState } from "react";
import toast from "react-hot-toast";

export const Route = createFileRoute("/admin/cases/")({
  component: AdminCasesPage,
  beforeLoad: () => {
    const user = useAuthStore.getState().user;
    if (!user || user.role !== "ADMIN") {
      throw redirect({ to: '/login' });
    }
  },
});

function AdminCasesPage() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const token = useAuthStore((state) => state.token);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [selectedCase, setSelectedCase] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<string>("");
  const [notes, setNotes] = useState("");

  const casesQuery = useQuery(
    trpc.getAllCases.queryOptions({
      token: token!,
      status: statusFilter as any,
      limit: 50,
    })
  );

  const updateStatusMutation = useMutation(
    trpc.updateCaseStatus.mutationOptions({
      onSuccess: () => {
        toast.success("Case status updated");
        setSelectedCase(null);
        setNotes("");
        queryClient.invalidateQueries({
          queryKey: trpc.getAllCases.queryKey(),
        });
      },
      onError: (error) => {
        toast.error(error.message || "Failed to update status");
      },
    })
  );

  const exportCsvMutation = useMutation(
    trpc.exportAllCasesCsv.mutationOptions({
      onSuccess: (data) => {
        // Create a blob and trigger download
        const blob = new Blob([data.csv], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = data.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        toast.success("CSV exported successfully");
      },
      onError: (error) => {
        toast.error(error.message || "Failed to export CSV");
      },
    })
  );

  const handleUpdateStatus = () => {
    if (!selectedCase || !newStatus) return;

    updateStatusMutation.mutate({
      token: token!,
      caseId: selectedCase,
      status: newStatus as any,
      notes: notes || undefined,
    });
  };

  const handleExportCsv = () => {
    exportCsvMutation.mutate({
      token: token!,
      status: statusFilter as any,
    });
  };

  const statuses = [
    { value: undefined, label: "All Cases" },
    { value: "INTAKE", label: "In Progress" },
    { value: "INTAKE_COMPLETE", label: "Ready for Review" },
    { value: "UNDER_REVIEW", label: "Under Review" },
    { value: "REFERRAL_PENDING", label: "Referral Pending" },
    { value: "REFERRED", label: "Referred" },
    { value: "CLOSED", label: "Closed" },
  ];

  if (casesQuery.isLoading) {
    return (
      <AdminLayout>
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600"></div>
            <p className="text-gray-600">Loading cases...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const cases = casesQuery.data?.cases || [];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">All Cases</h1>
            <p className="mt-2 text-gray-600">
              Manage and review all cases in the system
            </p>
          </div>
          <Button
            onClick={handleExportCsv}
            isLoading={exportCsvMutation.isPending}
            variant="secondary"
          >
            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export CSV
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-4">
              <Filter className="h-5 w-5 text-gray-400" />
              <div className="flex flex-wrap gap-2">
                {statuses.map((status) => (
                  <button
                    key={status.value || "all"}
                    onClick={() => setStatusFilter(status.value)}
                    className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                      statusFilter === status.value
                        ? "bg-primary-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {status.label}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cases list */}
        <div className="space-y-4">
          {cases.map((caseItem) => (
            <Card key={caseItem.id} className="hover:shadow-md transition-shadow">
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-3">
                      <Briefcase className="h-5 w-5 flex-shrink-0 text-gray-400 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {caseItem.title}
                        </h3>
                        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
                          <span>{formatCaseType(caseItem.caseType)}</span>
                          <span>•</span>
                          <span>{caseItem.user.email}</span>
                          <span>•</span>
                          <span>{formatDate(caseItem.createdAt)}</span>
                        </div>
                        <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {caseItem._count.messages} messages
                          </span>
                          <span className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {caseItem._count.documents} documents
                          </span>
                          {caseItem.overallScore && (
                            <span className="font-medium">
                              Score: {caseItem.overallScore.toFixed(0)}/100
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <StatusBadge status={caseItem.status} />
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setSelectedCase(caseItem.id);
                        setNewStatus(caseItem.status);
                      }}
                    >
                      Update Status
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {cases.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Briefcase className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-4 text-gray-600">No cases found</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Update status modal */}
      {selectedCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">
              Update Case Status
            </h3>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  New Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                >
                  <option value="INTAKE">In Progress</option>
                  <option value="INTAKE_COMPLETE">Ready for Review</option>
                  <option value="UNDER_REVIEW">Under Review</option>
                  <option value="REFERRAL_PENDING">Referral Pending</option>
                  <option value="REFERRED">Referred</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Notes (optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  placeholder="Add internal notes about this status change..."
                />
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <Button
                onClick={handleUpdateStatus}
                isLoading={updateStatusMutation.isPending}
                className="flex-1"
              >
                Update Status
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setSelectedCase(null);
                  setNotes("");
                }}
                className="flex-1"
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
