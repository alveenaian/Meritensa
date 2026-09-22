import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";
import { useAuthStore } from "~/lib/stores/auth.store";
import { DashboardLayout } from "~/components/layout/DashboardLayout";
import { ConversationProgress } from "~/components/conversation/ConversationProgress";
import { Card, CardContent } from "~/components/ui/Card";
import { Button } from "~/components/ui/Button";
import { CheckCircle2, Loader2, Play, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export const Route = createFileRoute("/dashboard/cases/$caseId/analysis/")({
  component: AnalysisScreen,
  beforeLoad: () => {
    const isAuthenticated = useAuthStore.getState().isAuthenticated();
    if (!isAuthenticated) {
      throw redirect({ to: '/login' });
    }
  },
});

const ANALYSIS_STEPS = [
  { key: "story", label: "Reviewing your story", duration: 2000 },
  { key: "documents", label: "Analyzing documents", duration: 3000 },
  { key: "claims", label: "Identifying legal claims", duration: 2500 },
  { key: "score", label: "Calculating case score", duration: 2000 },
  { key: "recommendations", label: "Generating recommendations", duration: 2000 },
] as const;

function AnalysisScreen() {
  const { caseId } = Route.useParams();
  const navigate = useNavigate();
  const trpc = useTRPC();
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [hasStarted, setHasStarted] = useState(false);
  const [isPolling, setIsPolling] = useState(false);

  // Fetch case details to show info before starting
  const caseQuery = useQuery(
    trpc.getCaseDetails.queryOptions({
      token: token!,
      caseId,
    })
  );

  // Poll analysis status when analysis is running
  const statusQuery = useQuery({
    ...trpc.getAnalysisStatus.queryOptions({
      token: token!,
      caseId,
    }),
    enabled: isPolling,
    refetchInterval: isPolling ? 2000 : false, // Poll every 2 seconds
    refetchIntervalInBackground: true,
  });

  const runAnalysisMutation = useMutation(
    trpc.runCaseAnalysis.mutationOptions({
      onSuccess: () => {
        console.log("[Analysis] Analysis started successfully, beginning polling");
        setIsPolling(true);
      },
      onError: (error) => {
        toast.error(error.message || "Failed to start analysis");
        setHasStarted(false);
        setCurrentStepIndex(0);
        setCompletedSteps(new Set());
      },
    })
  );

  // Handle manual start of analysis
  const handleStartAnalysis = () => {
    setHasStarted(true);
    setCurrentStepIndex(0);
    setCompletedSteps(new Set());
    runAnalysisMutation.mutate({
      token: token!,
      caseId,
    });
  };

  // Monitor status query for completion or errors
  useEffect(() => {
    if (!statusQuery.data || !isPolling) return;

    const status = statusQuery.data;

    // Check for errors
    if (status.error) {
      console.log("[Analysis] Error detected:", status.error);
      setIsPolling(false);
      setHasStarted(false);
      toast.error(status.error);
      return;
    }

    // Check for completion
    if (status.isComplete) {
      console.log("[Analysis] Analysis complete!");
      setIsPolling(false);
      setCompletedSteps(new Set(ANALYSIS_STEPS.map(s => s.key)));
      toast.success("Analysis complete!");
      
      // Invalidate the case details query to ensure fresh data
      queryClient.invalidateQueries({
        queryKey: trpc.getCaseDetails.queryKey({ token: token!, caseId }),
      });
      
      // Small delay before redirect to show completion
      setTimeout(() => {
        navigate({
          to: "/dashboard/cases/$caseId",
          params: { caseId },
        });
      }, 1500);
    }
  }, [statusQuery.data, isPolling, caseId, navigate, queryClient, token, trpc]);

  // Simulate progress through steps (only when analysis is running)
  useEffect(() => {
    if (isPolling && currentStepIndex < ANALYSIS_STEPS.length) {
      const step = ANALYSIS_STEPS[currentStepIndex];
      const timer = setTimeout(() => {
        setCompletedSteps(prev => new Set([...prev, step.key]));
        setCurrentStepIndex(prev => prev + 1);
      }, step.duration);

      return () => clearTimeout(timer);
    }
  }, [currentStepIndex, isPolling]);

  const isComplete = statusQuery.data?.isComplete || false;
  const hasError = !!statusQuery.data?.error && !isPolling;
  const isRunning = isPolling && !hasError && !isComplete;
  const errorMessage = statusQuery.data?.error;

  // Show loading state while fetching case details
  if (caseQuery.isLoading) {
    return (
      <DashboardLayout>
        <ConversationProgress currentStage="ANALYSIS" caseId={caseId} />
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const caseData = caseQuery.data;
  const documentCount = caseData?.documents?.length || 0;

  return (
    <DashboardLayout>
      <ConversationProgress currentStage="ANALYSIS" caseId={caseId} />

      <div className="mx-auto max-w-3xl space-y-6 py-12">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            {hasError ? "Analysis Failed" : isComplete ? "Analysis Complete!" : hasStarted ? "Analyzing Your Case" : "Ready to Analyze Your Case"}
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            {hasError 
              ? "We encountered an error. Please try again."
              : isComplete 
              ? "Your comprehensive case analysis is ready"
              : hasStarted
              ? "Our AI is reviewing all the information you've provided"
              : "Click the button below to start your comprehensive case analysis"}
          </p>
        </div>

        {/* Ready to Start State */}
        {!hasStarted && !isComplete && !hasError && (
          <Card>
            <CardContent className="py-8">
              <div className="space-y-6">
                <div className="rounded-lg bg-blue-50 p-6 border border-blue-200">
                  <h3 className="text-lg font-semibold text-blue-900 mb-3">
                    What we'll analyze:
                  </h3>
                  <ul className="space-y-2 text-blue-800">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" />
                      <span>Your case narrative and intake form details</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" />
                      <span>{documentCount} uploaded document{documentCount !== 1 ? 's' : ''}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" />
                      <span>Potential legal claims and their strength</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" />
                      <span>Timeline of key events</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" />
                      <span>Damages assessment and evidence inventory</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" />
                      <span>Red flags and recommendations</span>
                    </li>
                  </ul>
                </div>

                <div className="text-center">
                  <Button
                    onClick={handleStartAnalysis}
                    size="lg"
                    className="px-8 py-4 text-lg"
                    disabled={runAnalysisMutation.isPending}
                  >
                    <Play className="mr-2 h-6 w-6" />
                    Start Case Analysis
                  </Button>
                  <p className="mt-3 text-sm text-gray-600">
                    This usually takes 30-60 seconds
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Progress State (when running) */}
        {hasStarted && !isComplete && !hasError && (
          <Card>
            <CardContent className="py-8">
              <div className="space-y-6">
                {ANALYSIS_STEPS.map((step, index) => {
                  const isCompleted = completedSteps.has(step.key);
                  const isCurrent = index === currentStepIndex && isRunning;
                  const isPending = index > currentStepIndex;

                  return (
                    <div key={step.key} className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        {isCompleted ? (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                            <CheckCircle2 className="h-6 w-6 text-green-600" />
                          </div>
                        ) : isCurrent ? (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100">
                            <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
                          </div>
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-gray-300 bg-white">
                            <div className="h-3 w-3 rounded-full bg-gray-300"></div>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p
                          className={`text-lg font-medium ${
                            isCompleted || isCurrent
                              ? "text-gray-900"
                              : "text-gray-500"
                          }`}
                        >
                          {step.label}
                        </p>
                        {isCurrent && (
                          <div className="mt-2 h-1 overflow-hidden rounded-full bg-gray-200">
                            <div className="h-full animate-pulse bg-primary-600" style={{ width: '70%' }} />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Info box */}
              <div className="mt-6 rounded-lg bg-blue-50 p-4 text-center border border-blue-200">
                <p className="text-sm text-blue-800">
                  Please don't close this page. This usually takes 30-60 seconds.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Completion State */}
        {isComplete && (
          <Card>
            <CardContent className="py-8">
              <div className="text-center">
                <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle2 className="h-10 w-10 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Analysis Complete!
                </h3>
                <p className="text-gray-600 mb-6">
                  Redirecting to your case file...
                </p>
                <div className="rounded-lg bg-green-50 p-4 border border-green-200">
                  <p className="text-sm font-medium text-green-900">
                    Your comprehensive case analysis is ready to view
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {hasError && (
          <Card>
            <CardContent className="py-8">
              <div className="text-center">
                <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                  <AlertCircle className="h-10 w-10 text-red-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Analysis Failed
                </h3>
                <p className="text-gray-600 mb-6">
                  {errorMessage || "An error occurred during analysis"}
                </p>
                <div className="space-y-3">
                  <Button onClick={handleStartAnalysis} className="w-full sm:w-auto">
                    <Play className="mr-2 h-5 w-5" />
                    Try Again
                  </Button>
                  <div className="text-center">
                    <button
                      onClick={() => navigate({ to: "/dashboard/cases/$caseId/evidence", params: { caseId } })}
                      className="text-sm text-primary-600 hover:text-primary-700"
                    >
                      Go back to add more information
                    </button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
