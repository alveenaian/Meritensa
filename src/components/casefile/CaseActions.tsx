import { useMutation } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";
import { useAuthStore } from "~/lib/stores/auth.store";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "~/components/ui/Button";
import { FileText, Send, Edit, RefreshCw, Trash2, CheckCircle2, DollarSign } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { formatDate } from "~/lib/utils";

interface CaseActionsProps {
  caseId: string;
  caseData: any;
  onRefresh?: () => void;
}

export function CaseActions({ caseId, caseData, onRefresh }: CaseActionsProps) {
  const trpc = useTRPC();
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [showFundingModal, setShowFundingModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Mutations
  const downloadPacketMutation = useMutation(
    trpc.downloadCasePacket.mutationOptions({
      onSuccess: (data) => {
        const link = document.createElement("a");
        link.href = data.downloadUrl;
        link.download = data.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Case packet downloaded!");
      },
      onError: (error) => {
        toast.error(error.message || "Failed to download case packet");
      },
    })
  );

  const requestReferralMutation = useMutation(
    trpc.requestReferral.mutationOptions({
      onSuccess: () => {
        toast.success("Referral requested! We'll be in touch soon.");
        setShowReferralModal(false);
        onRefresh?.();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to request referral");
      },
    })
  );

  const requestFundingMutation = useMutation(
    trpc.requestFunding.mutationOptions({
      onSuccess: () => {
        toast.success("Funding request submitted! We'll review your case soon.");
        setShowFundingModal(false);
        onRefresh?.();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to request funding");
      },
    })
  );

  const revertToIntakeMutation = useMutation(
    trpc.updateCaseStage.mutationOptions({
      onSuccess: () => {
        toast.success("Returning to intake form...");
        navigate({
          to: "/dashboard/cases/$caseId/intake",
          params: { caseId },
        });
      },
      onError: (error) => {
        toast.error(error.message || "Failed to return to intake");
      },
    })
  );

  const reRunAnalysisMutation = useMutation(
    trpc.updateCaseStage.mutationOptions({
      onSuccess: () => {
        toast.success("Re-running analysis...");
        navigate({
          to: "/dashboard/cases/$caseId/analysis",
          params: { caseId },
        });
      },
      onError: (error) => {
        toast.error(error.message || "Failed to re-run analysis");
      },
    })
  );

  const deleteCaseMutation = useMutation(
    trpc.deleteCase.mutationOptions({
      onSuccess: () => {
        toast.success("Case deleted successfully");
        window.location.href = "/dashboard/cases";
      },
      onError: (error) => {
        toast.error(error.message || "Failed to delete case");
      },
    })
  );

  const handleDownloadPacket = () => {
    downloadPacketMutation.mutate({
      token: token!,
      caseId,
    });
  };

  const handleRequestReferral = () => {
    requestReferralMutation.mutate({
      token: token!,
      caseId,
    });
  };

  const handleRequestFunding = () => {
    requestFundingMutation.mutate({
      token: token!,
      caseId,
    });
  };

  const handleEditIntake = () => {
    if (confirm("This will return you to the intake form. Your analysis will remain saved. Continue?")) {
      revertToIntakeMutation.mutate({
        token: token!,
        caseId,
        stage: "INTAKE",
      });
    }
  };

  const handleReRunAnalysis = () => {
    if (confirm("This will re-analyze your case with the current information. Continue?")) {
      reRunAnalysisMutation.mutate({
        token: token!,
        caseId,
        stage: "ANALYSIS",
      });
    }
  };

  const handleDeleteCase = () => {
    deleteCaseMutation.mutate({
      token: token!,
      caseId,
    });
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Button
          variant="secondary"
          size="sm"
          onClick={handleDownloadPacket}
          isLoading={downloadPacketMutation.isPending}
          className="w-full"
        >
          <FileText className="mr-2 h-4 w-4" />
          Download Case Summary
        </Button>

        <Button
          variant="secondary"
          size="sm"
          onClick={handleDownloadPacket}
          isLoading={downloadPacketMutation.isPending}
          className="w-full"
        >
          <FileText className="mr-2 h-4 w-4" />
          Download Full Packet
        </Button>

        {!caseData.referralRequested ? (
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowReferralModal(true)}
            className="w-full"
          >
            <Send className="mr-2 h-4 w-4" />
            Request Law Firm Referral
          </Button>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            disabled
            className="w-full"
          >
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Referral Requested
          </Button>
        )}

        {!caseData.fundingRequested ? (
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowFundingModal(true)}
            className="w-full"
          >
            <DollarSign className="mr-2 h-4 w-4" />
            Submit for Funding
          </Button>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            disabled
            className="w-full"
          >
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Funding Requested
          </Button>
        )}

        <Button
          variant="secondary"
          size="sm"
          onClick={handleEditIntake}
          isLoading={revertToIntakeMutation.isPending}
          className="w-full lg:col-span-2"
        >
          <Edit className="mr-2 h-4 w-4" />
          Edit Intake
        </Button>

        <Button
          variant="secondary"
          size="sm"
          onClick={handleReRunAnalysis}
          isLoading={reRunAnalysisMutation.isPending}
          className="w-full"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Re-run Analysis
        </Button>

        <Button
          variant="destructive"
          size="sm"
          onClick={() => setShowDeleteModal(true)}
          className="w-full"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Case
        </Button>
      </div>

      {/* Referral Request Modal */}
      {showReferralModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Ready to connect with a law firm?
            </h3>
            <div className="space-y-4 text-sm text-gray-600">
              <p>
                By requesting a referral, you consent to sharing your case information
                with partner contingency law firms who handle cases like yours.
              </p>
              <div className="rounded-lg bg-blue-50 p-4 border border-blue-200">
                <p className="font-medium text-blue-900 mb-2">
                  Your case packet includes:
                </p>
                <ul className="list-disc list-inside space-y-1 text-blue-800">
                  <li>Your case summary and timeline</li>
                  <li>Identified causes of action</li>
                  <li>Evidence documents you've uploaded</li>
                  <li>AI-generated case score and analysis</li>
                </ul>
              </div>
              <p>
                Partner law firms will review your case and may contact you if they
                believe they can help. There is no obligation to work with any firm
                that contacts you.
              </p>
            </div>
            <div className="mt-6 flex gap-3">
              <Button
                onClick={handleRequestReferral}
                isLoading={requestReferralMutation.isPending}
                className="flex-1"
              >
                Request Referral
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowReferralModal(false)}
                className="flex-1"
                disabled={requestReferralMutation.isPending}
              >
                Cancel
              </Button>
            </div>
            <p className="mt-4 text-xs text-gray-500 text-center">
              By proceeding, you agree to our data sharing practices as outlined in our Privacy Policy.
            </p>
          </div>
        </div>
      )}

      {/* Funding Request Modal */}
      {showFundingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Submit Your Case for Funding?
            </h3>
            <div className="space-y-4 text-sm text-gray-600">
              <p>
                By submitting your case for funding consideration, you consent to sharing
                your case information with litigation funding partners who may be able to
                provide financial support for your case.
              </p>
              <div className="rounded-lg bg-green-50 p-4 border border-green-200">
                <p className="font-medium text-green-900 mb-2">
                  What is litigation funding?
                </p>
                <p className="text-green-800 mb-2">
                  Litigation funding provides financial resources to cover legal costs while
                  your case proceeds. This can include attorney fees, court costs, expert
                  witnesses, and other case-related expenses.
                </p>
                <p className="font-medium text-green-900 mb-2 mt-3">
                  Your case information includes:
                </p>
                <ul className="list-disc list-inside space-y-1 text-green-800">
                  <li>Your case summary and timeline</li>
                  <li>Identified causes of action and legal analysis</li>
                  <li>Evidence documents and case strength assessment</li>
                  <li>Estimated damages and case score</li>
                </ul>
              </div>
              <p>
                Funding partners will review your case and may contact you if they believe
                your case qualifies for funding. There is no obligation to accept funding
                from any partner that contacts you.
              </p>
              <div className="rounded-lg bg-blue-50 p-3 border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Litigation funding is non-recourse, meaning you
                  typically only repay if you win your case. Terms vary by provider.
                </p>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <Button
                onClick={handleRequestFunding}
                isLoading={requestFundingMutation.isPending}
                className="flex-1"
              >
                Submit for Funding
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowFundingModal(false)}
                className="flex-1"
                disabled={requestFundingMutation.isPending}
              >
                Cancel
              </Button>
            </div>
            <p className="mt-4 text-xs text-gray-500 text-center">
              By proceeding, you agree to our data sharing practices as outlined in our Privacy Policy.
            </p>
          </div>
        </div>
      )}

      {/* Delete Case Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Delete Case?
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to delete this case? This will permanently delete:
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 mb-6 space-y-1">
              <li>All messages and conversation history</li>
              <li>All uploaded documents</li>
              <li>Case analysis and scores</li>
              <li>All related data</li>
            </ul>
            <div className="rounded-lg bg-red-50 p-3 border border-red-200 mb-6">
              <p className="text-sm text-red-800 font-medium">
                This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleDeleteCase}
                isLoading={deleteCaseMutation.isPending}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                Delete Permanently
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowDeleteModal(false)}
                className="flex-1"
                disabled={deleteCaseMutation.isPending}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
