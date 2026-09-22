import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { DashboardLayout } from "~/components/layout/DashboardLayout";
import { Card } from "~/components/ui/Card";
import { useTRPC } from "~/trpc/react";
import { useAuthStore } from "~/lib/stores/auth.store";
import { 
  FileText, 
  AlertTriangle, 
  Briefcase, 
  HeartPulse, 
  Lightbulb, 
  Users,
  HelpCircle 
} from "lucide-react";
import toast from "react-hot-toast";
import { useState } from "react";

export const Route = createFileRoute("/dashboard/cases/new/")({
  component: NewCasePage,
  beforeLoad: () => {
    const isAuthenticated = useAuthStore.getState().isAuthenticated();
    if (!isAuthenticated) {
      throw redirect({ to: '/login' });
    }
  },
});

const CASE_TYPES = [
  {
    value: "BREACH_OF_CONTRACT",
    label: "Breach of Contract",
    description: "Someone failed to fulfill their obligations under an agreement",
    icon: FileText,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  {
    value: "FRAUD",
    label: "Fraud / Misrepresentation",
    description: "Someone lied or concealed facts that caused you harm",
    icon: AlertTriangle,
    color: "text-red-600",
    bgColor: "bg-red-50",
  },
  {
    value: "EMPLOYMENT",
    label: "Employment Dispute",
    description: "Issues with your employer (termination, discrimination, wages)",
    icon: Briefcase,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
  },
  {
    value: "PERSONAL_INJURY",
    label: "Personal Injury",
    description: "Physical or emotional harm caused by negligence or intent",
    icon: HeartPulse,
    color: "text-pink-600",
    bgColor: "bg-pink-50",
  },
  {
    value: "IP_THEFT",
    label: "IP Theft / Misappropriation",
    description: "Unauthorized use of your intellectual property or trade secrets",
    icon: Lightbulb,
    color: "text-yellow-600",
    bgColor: "bg-yellow-50",
  },
  {
    value: "PARTNERSHIP_DISPUTE",
    label: "Partnership Dispute",
    description: "Conflicts with business partners or co-owners",
    icon: Users,
    color: "text-green-600",
    bgColor: "bg-green-50",
  },
  {
    value: "OTHER",
    label: "Other",
    description: "My situation doesn't fit the categories above",
    icon: HelpCircle,
    color: "text-gray-600",
    bgColor: "bg-gray-50",
  },
] as const;

function NewCasePage() {
  const navigate = useNavigate();
  const trpc = useTRPC();
  const token = useAuthStore((state) => state.token);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const sendInitialGreetingMutation = useMutation(
    trpc.sendInitialGreeting.mutationOptions({
      onSuccess: (data, variables) => {
        // Navigate to conversation after greeting is sent
        navigate({ 
          to: "/dashboard/cases/$caseId/conversation", 
          params: { caseId: variables.caseId } 
        });
      },
      onError: (error, variables) => {
        // Even if greeting fails, still navigate (it will be sent on intent selection)
        console.error("Failed to send initial greeting:", error);
        navigate({ 
          to: "/dashboard/cases/$caseId/conversation", 
          params: { caseId: variables.caseId } 
        });
      },
    })
  );

  const createCaseMutation = useMutation(
    trpc.createCase.mutationOptions({
      onSuccess: (data) => {
        toast.success("Case created successfully!");
        // Send initial greeting before navigating
        sendInitialGreetingMutation.mutate({
          token: token!,
          caseId: data.id,
        });
      },
      onError: (error) => {
        toast.error(error.message || "Failed to create case");
      },
    })
  );

  const handleSelectType = (caseType: string) => {
    setSelectedType(caseType);
    createCaseMutation.mutate({
      token: token!,
      caseType: caseType as any,
    });
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Start a New Case
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            What type of legal issue are you facing?
          </p>
        </div>

        {/* Case type grid */}
        <div className="grid gap-4 md:grid-cols-2">
          {CASE_TYPES.map((caseType) => {
            const Icon = caseType.icon;
            const isSelected = selectedType === caseType.value;
            const isLoading = (createCaseMutation.isPending || sendInitialGreetingMutation.isPending) && isSelected;

            return (
              <button
                key={caseType.value}
                onClick={() => handleSelectType(caseType.value)}
                disabled={createCaseMutation.isPending || sendInitialGreetingMutation.isPending}
                className={`group relative rounded-xl border-2 p-6 text-left transition-all hover:shadow-lg ${
                  isSelected
                    ? "border-primary-500 bg-primary-50"
                    : "border-gray-200 bg-white hover:border-primary-300"
                } ${createCaseMutation.isPending || sendInitialGreetingMutation.isPending ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg ${caseType.bgColor}`}
                  >
                    <Icon className={`h-6 w-6 ${caseType.color}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {caseType.label}
                    </h3>
                    <p className="mt-1 text-sm text-gray-600">
                      {caseType.description}
                    </p>
                  </div>
                </div>

                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-white bg-opacity-75">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600"></div>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Help text */}
        <Card className="border-info/20 bg-info/5">
          <div className="flex items-start gap-3 p-6">
            <HelpCircle className="h-5 w-5 flex-shrink-0 text-info" />
            <div>
              <p className="text-sm font-medium text-gray-900">
                Not sure which category fits?
              </p>
              <p className="mt-1 text-sm text-gray-600">
                Choose "Other" and our AI assistant will help you figure it out
                during the intake conversation. You can always adjust later.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
