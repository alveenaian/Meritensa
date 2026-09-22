import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DashboardLayout } from "~/components/layout/DashboardLayout";
import { Card, CardContent } from "~/components/ui/Card";
import { Button } from "~/components/ui/Button";
import { useTRPC } from "~/trpc/react";
import { useAuthStore } from "~/lib/stores/auth.store";
import { useState, useEffect } from "react";
import { formatDate, formatCaseType } from "~/lib/utils";
import { StoryTab } from "~/components/casefile/StoryTab";
import { DetailsTab } from "~/components/casefile/DetailsTab";
import { SummaryTab } from "~/components/casefile/SummaryTab";
import { TimelineTab } from "~/components/casefile/TimelineTab";
import { LegalAnalysisTab } from "~/components/casefile/LegalAnalysisTab";
import { DamagesTab } from "~/components/casefile/DamagesTab";
import { EvidenceTab } from "~/components/casefile/EvidenceTab";
import { CaseActions } from "~/components/casefile/CaseActions";
import { ProAnalysisView } from "~/components/casefile/ProAnalysisView";
import { OutreachToolkitTab } from "~/components/casefile/OutreachToolkitTab";
import { CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";

export const Route = createFileRoute("/dashboard/cases/$caseId/")({
  component: CaseDetailPage,
  beforeLoad: () => {
    const isAuthenticated = useAuthStore.getState().isAuthenticated();
    if (!isAuthenticated) {
      throw redirect({ to: '/login' });
    }
  },
});

function CaseDetailPage() {
  const { caseId } = Route.useParams();
  const navigate = useNavigate();
  const trpc = useTRPC();
  const token = useAuthStore((state) => state.token);
  const [activeTab, setActiveTab] = useState<"pro-analysis" | "outreach" | "story" | "details" | "summary" | "timeline" | "legal" | "damages" | "evidence">("summary");

  const caseQuery = useQuery(
    trpc.getCaseDetails.queryOptions({
      token: token!,
      caseId,
    })
  );

  // Redirect based on case stage - only if user lands on base URL and case is not complete
  useEffect(() => {
    if (caseQuery.data) {
      const stage = caseQuery.data.stage;
      
      // Only redirect if the case is not yet complete
      // This allows users to view the case file when stage is COMPLETE
      if (stage !== "COMPLETE") {
        // Redirect to the current working step
        if (stage === "CONVERSATION") {
          navigate({
            to: "/dashboard/cases/$caseId/conversation",
            params: { caseId },
            replace: true,
          });
        } else if (stage === "INTAKE") {
          navigate({
            to: "/dashboard/cases/$caseId/intake",
            params: { caseId },
            replace: true,
          });
        } else if (stage === "EVIDENCE") {
          navigate({
            to: "/dashboard/cases/$caseId/evidence",
            params: { caseId },
            replace: true,
          });
        } else if (stage === "ANALYSIS") {
          navigate({
            to: "/dashboard/cases/$caseId/analysis",
            params: { caseId },
            replace: true,
          });
        }
      }
      // If stage is COMPLETE, stay on this page and show the case file view
    }
  }, [caseQuery.data?.stage, navigate, caseId]);

  const generateProMutation = useMutation(
    trpc.generateProAnalysis.mutationOptions({
      onSuccess: () => {
        toast.success("Attorney-Ready Packet generated!");
        caseQuery.refetch();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to generate analysis");
      },
    })
  );

  if (caseQuery.isLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600"></div>
            <p className="text-gray-600">Loading case...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!caseQuery.data) {
    return (
      <DashboardLayout>
        <div className="text-center">
          <p className="text-red-600">Case not found</p>
        </div>
      </DashboardLayout>
    );
  }

  const caseData = caseQuery.data;

  // Only render case file view if stage is COMPLETE
  if (caseData.stage !== "COMPLETE") {
    return (
      <DashboardLayout>
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600"></div>
            <p className="text-gray-600">Redirecting to current step...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Case header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl text-gray-900 truncate">{caseData.title}</h1>
            <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
              <span>{formatCaseType(caseData.caseType)}</span>
              <span>•</span>
              <span>Analyzed {formatDate(caseData.analyzedAt)}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <Card>
          <CardContent className="py-4">
            <CaseActions caseId={caseId} caseData={caseData} onRefresh={() => caseQuery.refetch()} />
          </CardContent>
        </Card>

        {/* Pro Analysis Section */}
        {!caseData.proAnalysisResults ? (
          <Card>
            <CardContent className="py-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Attorney-Ready Packet
                </h3>
                <p className="text-sm text-gray-600 mb-4 max-w-lg mx-auto">
                  Generate a comprehensive adversarial analysis with executive summary,
                  dual-attorney liability analysis, SOL defense strategy, damages memo,
                  and risk register — structured for contingency firm review.
                </p>
                <Button
                  onClick={() => generateProMutation.mutate({ token: token!, caseId })}
                  isLoading={generateProMutation.isPending}
                >
                  Generate Attorney-Ready Packet
                </Button>
                {generateProMutation.isPending && (
                  <p className="mt-3 text-sm text-gray-500">
                    Running deep analysis — this takes 1-2 minutes...
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-900">Attorney-Ready Packet Generated</span>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setActiveTab("pro-analysis")}
                >
                  View Full Analysis
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {caseData.proAnalysisResults && (
              <TabButton
                active={activeTab === "pro-analysis"}
                onClick={() => setActiveTab("pro-analysis")}
                label="Attorney Packet"
              />
            )}
            {caseData.proAnalysisResults && (
              <TabButton
                active={activeTab === "outreach"}
                onClick={() => setActiveTab("outreach")}
                label="Outreach Toolkit"
              />
            )}
            <TabButton
              active={activeTab === "story"}
              onClick={() => setActiveTab("story")}
              label="Story"
            />
            <TabButton
              active={activeTab === "details"}
              onClick={() => setActiveTab("details")}
              label="Details"
            />
            <TabButton
              active={activeTab === "summary"}
              onClick={() => setActiveTab("summary")}
              label="Summary"
            />
            <TabButton
              active={activeTab === "timeline"}
              onClick={() => setActiveTab("timeline")}
              label="Timeline"
            />
            <TabButton
              active={activeTab === "legal"}
              onClick={() => setActiveTab("legal")}
              label="Legal Analysis"
            />
            <TabButton
              active={activeTab === "damages"}
              onClick={() => setActiveTab("damages")}
              label="Damages"
            />
            <TabButton
              active={activeTab === "evidence"}
              onClick={() => setActiveTab("evidence")}
              label="Evidence"
            />
          </nav>
        </div>

        {/* Tab content */}
        <div className="pb-8">
          {activeTab === "pro-analysis" && caseData.proAnalysisResults && (
            <ProAnalysisView proResults={caseData.proAnalysisResults as any} />
          )}
          {activeTab === "outreach" && caseData.proAnalysisResults && (
            <OutreachToolkitTab 
              caseId={caseId}
              proResults={caseData.proAnalysisResults as any} 
            />
          )}
          {activeTab === "story" && <StoryTab caseData={caseData} />}
          {activeTab === "details" && <DetailsTab caseData={caseData} />}
          {activeTab === "summary" && <SummaryTab caseData={caseData} />}
          {activeTab === "timeline" && <TimelineTab caseData={caseData} />}
          {activeTab === "legal" && <LegalAnalysisTab caseData={caseData} />}
          {activeTab === "damages" && <DamagesTab caseData={caseData} />}
          {activeTab === "evidence" && <EvidenceTab caseId={caseId} caseData={caseData} />}
        </div>
      </div>
    </DashboardLayout>
  );
}

function TabButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
        active
          ? "border-primary-600 text-primary-600"
          : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
      }`}
    >
      {label}
    </button>
  );
}
