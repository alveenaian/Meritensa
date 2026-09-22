import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "~/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/Card";
import { Button } from "~/components/ui/Button";
import { useTRPC } from "~/trpc/react";
import { useAuthStore } from "~/lib/stores/auth.store";
import { FileText, Download, ExternalLink, Briefcase } from "lucide-react";
import { formatDate, formatCaseType } from "~/lib/utils";
import { useState } from "react";

export const Route = createFileRoute("/dashboard/documents/")({
  component: DocumentsPage,
  beforeLoad: () => {
    const isAuthenticated = useAuthStore.getState().isAuthenticated();
    if (!isAuthenticated) {
      throw redirect({ to: '/login' });
    }
  },
});

function DocumentsPage() {
  const trpc = useTRPC();
  const token = useAuthStore((state) => state.token);
  const [page, setPage] = useState(1);
  const limit = 20;

  const documentsQuery = useQuery(
    trpc.listAllUserDocuments.queryOptions({
      token: token!,
      page,
      limit,
    })
  );

  const downloadUrlQuery = useTRPC();

  const documents = documentsQuery.data?.documents || [];
  const pagination = documentsQuery.data?.pagination;

  const handleDownload = async (documentId: string, filename: string) => {
    try {
      const result = await downloadUrlQuery.getDocumentDownloadUrl.query({
        token: token!,
        documentId,
      });
      
      // Open download URL in new tab
      window.open(result.downloadUrl, "_blank");
    } catch (error) {
      console.error("Error downloading document:", error);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Documents</h1>
          <p className="mt-2 text-gray-600">
            All documents across your cases
          </p>
        </div>

        {/* Documents list */}
        {documentsQuery.isLoading ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              Loading documents...
            </CardContent>
          </Card>
        ) : documents.length === 0 ? (
          <Card className="border-2 border-dashed border-gray-300">
            <CardContent className="py-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-semibold text-gray-900">
                No documents yet
              </h3>
              <p className="mt-2 text-gray-600">
                Documents you upload to your cases will appear here.
              </p>
              <Link to="/dashboard/cases">
                <Button className="mt-6" variant="secondary">
                  <Briefcase className="mr-2 h-5 w-5" />
                  Go to My Cases
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle>
                  All Documents ({pagination?.total || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {documents.map((document) => (
                    <div
                      key={document.id}
                      className="flex items-center justify-between rounded-lg border border-gray-200 p-4 hover:border-gray-300 hover:bg-gray-50"
                    >
                      <div className="flex items-start gap-3 flex-1">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary-100">
                          <FileText className="h-5 w-5 text-primary-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 truncate">
                            {document.originalName}
                          </h4>
                          <div className="mt-1 flex items-center gap-2 text-sm text-gray-600">
                            <Link
                              to="/dashboard/cases/$caseId"
                              params={{ caseId: document.case.id }}
                              className="flex items-center gap-1 hover:text-primary-600 hover:underline"
                            >
                              <Briefcase className="h-3.5 w-3.5" />
                              {document.case.title}
                            </Link>
                            <span>•</span>
                            <span className="capitalize">
                              {document.category.toLowerCase().replace(/_/g, " ")}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-gray-500">
                            Uploaded {formatDate(document.uploadedAt)}
                          </p>
                          {document.aiSummary && (
                            <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                              {document.aiSummary}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleDownload(document.id, document.originalName)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Link
                          to="/dashboard/cases/$caseId"
                          params={{ caseId: document.case.id }}
                        >
                          <Button size="sm" variant="ghost">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
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
                  {pagination.total} documents
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
