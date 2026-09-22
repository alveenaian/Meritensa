import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC, useTRPCClient } from "~/trpc/react";
import { useAuthStore } from "~/lib/stores/auth.store";
import { Button } from "~/components/ui/Button";
import { Download, Trash2, FileText, Calendar, HardDrive } from "lucide-react";
import toast from "react-hot-toast";
import { formatDate } from "~/lib/utils";

const DOCUMENT_CATEGORIES = [
  { value: "CONTRACT", label: "Contract" },
  { value: "EMAIL", label: "Email" },
  { value: "TEXT_MESSAGE", label: "Text Message" },
  { value: "FINANCIAL", label: "Financial" },
  { value: "PHOTO_VIDEO", label: "Photo/Video" },
  { value: "LEGAL_DOCUMENT", label: "Legal Document" },
  { value: "CORRESPONDENCE", label: "Correspondence" },
  { value: "EVIDENCE_OTHER", label: "Other Evidence" },
  { value: "IDENTIFICATION", label: "Identification" },
  { value: "OTHER", label: "Other" },
] as const;

interface DocumentListProps {
  caseId: string;
}

function RelevanceBadge({ relevance }: { relevance: number | null }) {
  if (relevance === null) return null;
  
  let label = "Medium";
  let className = "bg-yellow-100 text-yellow-800";
  
  if (relevance >= 70) {
    label = "High";
    className = "bg-green-100 text-green-800";
  } else if (relevance < 40) {
    label = "Low";
    className = "bg-gray-100 text-gray-800";
  }
  
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${className}`}>
      {label} Relevance
    </span>
  );
}

export function DocumentList({ caseId }: DocumentListProps) {
  const trpc = useTRPC();
  const trpcClient = useTRPCClient();
  const queryClient = useQueryClient();
  const token = useAuthStore((state) => state.token);

  const documentsQuery = useQuery(
    trpc.listDocuments.queryOptions({
      token: token!,
      caseId,
    })
  );

  const deleteDocumentMutation = useMutation(
    trpc.deleteDocument.mutationOptions({
      onSuccess: () => {
        toast.success("Document deleted successfully");
        queryClient.invalidateQueries({
          queryKey: trpc.listDocuments.queryKey(),
        });
      },
      onError: (error) => {
        toast.error(error.message || "Failed to delete document");
      },
    })
  );

  const updateCategoryMutation = useMutation(
    trpc.updateDocumentCategory.mutationOptions({
      onSuccess: () => {
        toast.success("Category updated");
        queryClient.invalidateQueries({
          queryKey: trpc.listDocuments.queryKey(),
        });
      },
      onError: (error) => {
        toast.error(error.message || "Failed to update category");
      },
    })
  );

  const handleCategoryChange = (documentId: string, category: string) => {
    updateCategoryMutation.mutate({
      token: token!,
      documentId,
      category: category as any,
    });
  };

  const analyzeDocumentMutation = useMutation(
    trpc.analyzeDocument.mutationOptions({
      onSuccess: () => {
        toast.success("Document analyzed successfully");
        queryClient.invalidateQueries({
          queryKey: trpc.listDocuments.queryKey(),
        });
      },
      onError: (error) => {
        toast.error(error.message || "Failed to analyze document");
      },
    })
  );

  const handleDownload = async (documentId: string, filename: string) => {
    try {
      const result = await trpcClient.getDocumentDownloadUrl.query({
        token: token!,
        documentId,
      });

      // Create a temporary link and trigger download
      const link = document.createElement("a");
      link.href = result.downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      toast.error("Failed to download document");
    }
  };

  const handleDelete = (documentId: string) => {
    if (confirm("Are you sure you want to delete this document?")) {
      deleteDocumentMutation.mutate({
        token: token!,
        documentId,
      });
    }
  };

  const handleAnalyze = (documentId: string) => {
    analyzeDocumentMutation.mutate({
      token: token!,
      documentId,
    });
  };

  if (documentsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600"></div>
          <p className="text-sm text-gray-600">Loading documents...</p>
        </div>
      </div>
    );
  }

  const documents = documentsQuery.data || [];

  if (documents.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-gray-600">No documents uploaded yet</p>
        <p className="mt-1 text-sm text-gray-500">
          Upload documents to help strengthen your case
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {documents.map((doc) => (
        <div
          key={doc.id}
          className="rounded-lg border border-gray-200 bg-white p-4 hover:border-gray-300 transition-colors"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <FileText className="h-5 w-5 flex-shrink-0 text-gray-400 mt-0.5" />
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 truncate">
                  {doc.originalName}
                </h4>
                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                  <span className="inline-flex items-center gap-1">
                    <HardDrive className="h-3 w-3" />
                    {(doc.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(doc.uploadedAt)}
                  </span>
                  {doc.relevance !== null && <RelevanceBadge relevance={doc.relevance} />}
                </div>

                <div className="mt-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={doc.category}
                    onChange={(e) => handleCategoryChange(doc.id, e.target.value)}
                    disabled={updateCategoryMutation.isPending}
                    className="block w-full rounded-md border-gray-300 text-sm focus:border-primary-500 focus:ring-primary-500 disabled:opacity-50"
                  >
                    {DOCUMENT_CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* AI Summary */}
                {doc.aiSummary ? (
                  <div className="mt-3 rounded-md bg-blue-50 p-3 border border-blue-200">
                    <p className="text-xs font-medium text-blue-900 mb-1">
                      AI Analysis
                    </p>
                    <p className="text-xs text-blue-800">{doc.aiSummary}</p>
                  </div>
                ) : (
                  <div className="mt-3 rounded-md bg-gray-50 p-3 border border-gray-200">
                    <p className="text-xs text-gray-600">
                      {analyzeDocumentMutation.isPending && analyzeDocumentMutation.variables?.documentId === doc.id
                        ? "Analyzing document..."
                        : "No AI analysis yet"}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {!doc.aiSummary && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleAnalyze(doc.id)}
                  isLoading={analyzeDocumentMutation.isPending && analyzeDocumentMutation.variables?.documentId === doc.id}
                >
                  Analyze
                </Button>
              )}
              {doc.aiSummary && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleAnalyze(doc.id)}
                  isLoading={analyzeDocumentMutation.isPending && analyzeDocumentMutation.variables?.documentId === doc.id}
                >
                  Re-analyze
                </Button>
              )}
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleDownload(doc.id, doc.originalName)}
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleDelete(doc.id)}
                isLoading={deleteDocumentMutation.isPending}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
