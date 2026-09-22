import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";
import { useAuthStore } from "~/lib/stores/auth.store";
import { DashboardLayout } from "~/components/layout/DashboardLayout";
import { ConversationProgress } from "~/components/conversation/ConversationProgress";
import { DocumentUpload } from "~/components/documents/DocumentUpload";
import { DocumentList } from "~/components/documents/DocumentList";
import { Button } from "~/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/Card";
import { Upload, ArrowRight, SkipForward } from "lucide-react";
import { useState, useRef } from "react";
import toast from "react-hot-toast";

export const Route = createFileRoute("/dashboard/cases/$caseId/evidence/")({
  component: EvidenceScreen,
  beforeLoad: () => {
    const isAuthenticated = useAuthStore.getState().isAuthenticated();
    if (!isAuthenticated) {
      throw redirect({ to: '/login' });
    }
  },
});

function EvidenceScreen() {
  const { caseId } = Route.useParams();
  const navigate = useNavigate();
  const trpc = useTRPC();
  const token = useAuthStore((state) => state.token);
  const [documentRefreshKey, setDocumentRefreshKey] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzingProgress, setAnalyzingProgress] = useState({ current: 0, total: 0 });
  const uploadSectionRef = useRef<HTMLDivElement>(null);

  const caseQuery = useQuery(
    trpc.getCaseDetails.queryOptions({
      token: token!,
      caseId,
    })
  );

  const analyzeDocumentMutation = useMutation(
    trpc.analyzeDocument.mutationOptions()
  );

  const updateCaseStageMutation = useMutation(
    trpc.updateCaseStage.mutationOptions({
      onSuccess: () => {
        toast.success("Moving to analysis...");
        navigate({
          to: "/dashboard/cases/$caseId/analysis",
          params: { caseId },
        });
      },
      onError: (error) => {
        toast.error(error.message || "Failed to proceed to analysis");
      },
    })
  );

  const handleUploadComplete = () => {
    setDocumentRefreshKey((prev) => prev + 1);
    caseQuery.refetch();
  };

  const handleBatchAnalyze = async () => {
    if (documents.length === 0) return;
    
    setIsAnalyzing(true);
    setAnalyzingProgress({ current: 0, total: documents.length });
    
    try {
      // Analyze each document sequentially
      for (let i = 0; i < documents.length; i++) {
        setAnalyzingProgress({ current: i + 1, total: documents.length });
        await analyzeDocumentMutation.mutateAsync({
          token: token!,
          documentId: documents[i].id,
        });
      }
      
      // All documents analyzed, advance to ANALYSIS stage
      await updateCaseStageMutation.mutateAsync({
        token: token!,
        caseId,
        stage: "ANALYSIS",
      });
      
      toast.success("Analysis complete!");
      navigate({
        to: "/dashboard/cases/$caseId/analysis",
        params: { caseId },
      });
    } catch (error: any) {
      console.error("Batch analysis error:", error);
      toast.error(error.message || "Failed to analyze documents");
    } finally {
      setIsAnalyzing(false);
      setAnalyzingProgress({ current: 0, total: 0 });
    }
  };

  const handleSkipToAnalysis = () => {
    if (confirm("Are you sure you want to skip analyzing documents? You can always analyze them later.")) {
      updateCaseStageMutation.mutate({
        token: token!,
        caseId,
        stage: "ANALYSIS",
      });
    }
  };

  const scrollToUpload = () => {
    uploadSectionRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  if (caseQuery.isLoading) {
    return (
      <DashboardLayout>
        <ConversationProgress currentStage="EVIDENCE" caseId={caseId} />
        <div className="flex h-full items-center justify-center py-12">
          <div className="text-center">
            <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!caseQuery.data) {
    return (
      <DashboardLayout>
        <ConversationProgress currentStage="EVIDENCE" caseId={caseId} />
        <div className="text-center py-12">
          <p className="text-red-600">Case not found</p>
        </div>
      </DashboardLayout>
    );
  }

  const caseData = caseQuery.data;
  const documents = caseData.documents || [];
  const hasDocuments = documents.length > 0;

  return (
    <DashboardLayout>
      <ConversationProgress currentStage="EVIDENCE" caseId={caseId} />

      <div className="mx-auto max-w-5xl space-y-6 py-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Upload Your Evidence</h1>
          <p className="mt-2 text-lg text-gray-600">
            Add documents that support your case. These will be analyzed by our AI to strengthen your case file.
          </p>
        </div>

        {/* Upload Section */}
        <div ref={uploadSectionRef}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DocumentUpload caseId={caseId} onUploadComplete={handleUploadComplete} />
            </CardContent>
          </Card>
        </div>

        {/* Document List */}
        <Card>
          <CardHeader>
            <CardTitle>Uploaded Documents ({documents.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <DocumentList key={documentRefreshKey} caseId={caseId} />
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          {/* Analyze My Evidence Button */}
          <Button
            onClick={handleBatchAnalyze}
            disabled={!hasDocuments || isAnalyzing}
            isLoading={isAnalyzing}
            className="w-full"
            size="lg"
          >
            {isAnalyzing ? (
              <>Analyzing {analyzingProgress.current} of {analyzingProgress.total} documents...</>
            ) : (
              <>Analyze My Evidence</>
            )}
          </Button>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
            <Button
              variant="secondary"
              onClick={scrollToUpload}
              className="w-full sm:w-auto"
              disabled={isAnalyzing}
            >
              <Upload className="mr-2 h-5 w-5" />
              Add More Documents
            </Button>

            <Button
              variant="ghost"
              onClick={handleSkipToAnalysis}
              disabled={updateCaseStageMutation.isPending || isAnalyzing}
              className="w-full sm:w-auto"
            >
              <SkipForward className="mr-2 h-5 w-5" />
              Skip Analysis
            </Button>
          </div>
        </div>

        {/* Helper text */}
        {!hasDocuments && (
          <div className="rounded-lg bg-blue-50 p-4 text-center border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>Tip:</strong> Upload contracts, emails, financial records, photos, or any other documents that support your case. Our AI will analyze them to help build a stronger case file.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
