import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";
import { useAuthStore } from "~/lib/stores/auth.store";
import { DashboardLayout } from "~/components/layout/DashboardLayout";
import { ConversationProgress } from "~/components/conversation/ConversationProgress";
import { CollapsibleSection } from "~/components/intake/CollapsibleSection";
import { Button } from "~/components/ui/Button";
import { Input } from "~/components/ui/Input";
import { Checkbox } from "~/components/ui/Checkbox";
import { Card } from "~/components/ui/Card";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Save, CheckCircle2 } from "lucide-react";
import { formatDate } from "~/lib/utils";

export const Route = createFileRoute("/dashboard/cases/$caseId/intake/")({
  component: IntakeFormPage,
  beforeLoad: () => {
    const isAuthenticated = useAuthStore.getState().isAuthenticated();
    if (!isAuthenticated) {
      throw redirect({ to: '/login' });
    }
  },
});

const intakeFormSchema = z.object({
  // Section 1 - The Other Party
  defendantName: z.string().min(1, "Defendant name is required"),
  defendantType: z.enum(["INDIVIDUAL", "SMALL_BUSINESS", "CORPORATION", "GOVERNMENT", "OTHER"]).optional(),
  defendantState: z.string().optional(),
  defendantAddress: z.string().optional(),
  
  // Section 2 - When & Where
  incidentState: z.string().optional(),
  incidentDate: z.string().optional(),
  isOngoing: z.boolean().default(false),
  incidentEndDate: z.string().optional(),
  discoveryDate: z.string().optional(),
  
  // Section 3 - Your Losses
  damagesTotal: z.string().optional(),
  damagesEconomic: z.string().optional(),
  damagesLostWages: z.string().optional(),
  damagesLostBusiness: z.string().optional(),
  damagesOther: z.string().optional(),
  damagesNotes: z.string().optional(),
  
  // Section 4 - The Agreement
  hasWrittenAgreement: z.enum(["yes", "no", "not_sure"]).optional(),
  agreementDate: z.string().optional(),
  agreementType: z.string().optional(),
  agreementNotes: z.string().optional(),
  hasArbitrationClause: z.enum(["yes", "no", "dont_know"]).optional(),
  hasVenueClause: z.enum(["yes", "no", "dont_know"]).optional(),
  hasNonCompete: z.boolean().optional(),
  
  // Section 5 - Evidence You Have
  evidenceContract: z.boolean().default(false),
  evidenceEmails: z.boolean().default(false),
  evidenceTexts: z.boolean().default(false),
  evidenceFinancial: z.boolean().default(false),
  evidencePhotos: z.boolean().default(false),
  evidenceWitness: z.boolean().default(false),
  evidenceOther: z.boolean().default(false),
  hasWitnesses: z.string().optional(),
  witnessCount: z.string().optional(),
  
  // Section 6 - Prior Legal Action
  priorAttorneyContact: z.string().optional(),
  priorCourtFiling: z.string().optional(),
  priorLegalNotes: z.string().optional(),
  
  // Section 7 - Contact Info
  plaintiffName: z.string().min(1, "Your name is required"),
  plaintiffState: z.string().optional(),
  plaintiffPhone: z.string().optional(),
  
  // Section 8 - Your Situation
  hasCurrentAttorney: z.string().optional(),
  currentAttorneyInfo: z.string().optional(),
  feePreference: z.enum(["contingency", "hybrid", "hourly", "unsure"]).optional(),
  awareOfDeadlines: z.string().optional(),
  deadlineNotes: z.string().optional(),
});

type IntakeFormData = z.infer<typeof intakeFormSchema>;

function getCurrentStepRoute(stage: string, caseId: string): string {
  switch (stage) {
    case "CONVERSATION":
      return `/dashboard/cases/${caseId}/conversation`;
    case "INTAKE":
      return `/dashboard/cases/${caseId}/intake`;
    case "EVIDENCE":
      return `/dashboard/cases/${caseId}/evidence`;
    case "ANALYSIS":
      return `/dashboard/cases/${caseId}/analysis`;
    case "COMPLETE":
      return `/dashboard/cases/${caseId}`;
    default:
      return `/dashboard/cases/${caseId}`;
  }
}

function IntakeFormPage() {
  const { caseId } = Route.useParams();
  const navigate = useNavigate();
  const trpc = useTRPC();
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const [showAddressSkip, setShowAddressSkip] = useState(false);
  const [showDiscoverySkip, setShowDiscoverySkip] = useState(false);
  const [showPhoneSkip, setShowPhoneSkip] = useState(false);

  const caseQuery = useQuery(
    trpc.getCaseDetails.queryOptions({
      token: token!,
      caseId,
    })
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    reset,
    formState: { errors },
  } = useForm<IntakeFormData>({
    resolver: zodResolver(intakeFormSchema),
    defaultValues: {
      plaintiffName: user?.name || "",
      plaintiffState: user?.state || "",
      isOngoing: false,
      hasNonCompete: false,
      evidenceContract: false,
      evidenceEmails: false,
      evidenceTexts: false,
      evidenceFinancial: false,
      evidencePhotos: false,
      evidenceWitness: false,
      evidenceOther: false,
    },
  });

  // Load existing data from case using reset()
  useEffect(() => {
    if (caseQuery.data) {
      const caseData = caseQuery.data;
      const intakeData = (caseData.intakeFormData as any) || {};
      
      // Helper to get value from intakeData or fall back to old field
      const getValue = (key: string, oldKey?: string) => {
        if (intakeData[key] !== undefined) return intakeData[key];
        if (oldKey && caseData[oldKey] !== undefined) return caseData[oldKey];
        return undefined;
      };
      
      reset({
        defendantName: getValue('defendantName', 'defendantName') || "",
        defendantType: getValue('defendantType', 'defendantType') || ("" as any),
        defendantState: getValue('defendantState', 'defendantState') || "",
        defendantAddress: getValue('defendantAddress', 'defendantAddress') || "",
        incidentState: getValue('incidentState', 'incidentState') || "",
        incidentDate: getValue('incidentDate') || (caseData.incidentDate ? new Date(caseData.incidentDate).toISOString().split('T')[0] : ""),
        isOngoing: getValue('isOngoing', 'isOngoing') ?? false,
        incidentEndDate: getValue('incidentEndDate') || "",
        discoveryDate: getValue('discoveryDate') || "",
        damagesTotal: getValue('damagesTotal') || (caseData.estimatedDamages ? caseData.estimatedDamages.toString() : ""),
        damagesEconomic: getValue('damagesEconomic') || "",
        damagesLostWages: getValue('damagesLostWages') || "",
        damagesLostBusiness: getValue('damagesLostBusiness') || "",
        damagesOther: getValue('damagesOther') || "",
        damagesNotes: getValue('damagesNotes') || "",
        hasWrittenAgreement: getValue('hasWrittenAgreement') as any || ("" as any),
        agreementDate: getValue('agreementDate') || "",
        agreementType: getValue('agreementType') || "",
        agreementNotes: getValue('agreementNotes') || "",
        hasArbitrationClause: getValue('hasArbitrationClause') as any || ("" as any),
        hasVenueClause: getValue('hasVenueClause') as any || ("" as any),
        hasNonCompete: getValue('hasNonCompete') ?? false,
        evidenceContract: getValue('evidenceContract') ?? false,
        evidenceEmails: getValue('evidenceEmails') ?? false,
        evidenceTexts: getValue('evidenceTexts') ?? false,
        evidenceFinancial: getValue('evidenceFinancial') ?? false,
        evidencePhotos: getValue('evidencePhotos') ?? false,
        evidenceWitness: getValue('evidenceWitness') ?? false,
        evidenceOther: getValue('evidenceOther') ?? false,
        hasWitnesses: getValue('hasWitnesses') as any,
        witnessCount: getValue('witnessCount') || "",
        priorAttorneyContact: getValue('priorAttorneyContact') as any,
        priorCourtFiling: getValue('priorCourtFiling') as any,
        priorLegalNotes: getValue('priorLegalNotes') || "",
        plaintiffName: user?.name || "",
        plaintiffState: user?.state || "",
        plaintiffPhone: getValue('plaintiffPhone') || "",
        hasCurrentAttorney: getValue('hasCurrentAttorney') as any,
        currentAttorneyInfo: getValue('currentAttorneyInfo') || "",
        feePreference: getValue('feePreference') as any || ("" as any),
        awareOfDeadlines: getValue('awareOfDeadlines') as any,
        deadlineNotes: getValue('deadlineNotes') || "",
      });
    }
  }, [caseQuery.data, reset, user]);

  const submitIntakeMutation = useMutation(
    trpc.submitIntakeForm.mutationOptions()
  );

  const saveProgressMutation = useMutation(
    trpc.saveIntakeProgress.mutationOptions()
  );

  const updateCaseStageMutation = useMutation(
    trpc.updateCaseStage.mutationOptions()
  );

  const onSubmit = async (data: IntakeFormData) => {
    try {
      // Send all form data as a JSON object
      await submitIntakeMutation.mutateAsync({
        token: token!,
        caseId,
        formData: data as any, // Send entire form as JSON
      });
      
      toast.success("Intake complete!");
      navigate({ to: `/dashboard/cases/${caseId}/evidence` });
    } catch (error: any) {
      console.error("Form submission failed:", error);
      toast.error("Failed to save your intake form. Please try again.");
    }
  };

  const handleSaveAndExit = async () => {
    const data = getValues();
    
    try {
      await saveProgressMutation.mutateAsync({
        token: token!,
        caseId,
        formData: data as any, // Send entire form as JSON
      });
      toast.success("Progress saved!");
      navigate({ to: "/dashboard/cases" });
    } catch (error: any) {
      console.error("Save failed:", error);
      toast.error(error.message || "Failed to save progress");
    }
  };

  // Watch for changes to determine section completion
  const watchedValues = watch();
  const hasWrittenAgreementValue = watch("hasWrittenAgreement");
  const isOngoingValue = watch("isOngoing");
  const hasWitnessesValue = watch("hasWitnesses");
  const priorAttorneyContactValue = watch("priorAttorneyContact");
  const priorCourtFilingValue = watch("priorCourtFiling");
  const hasCurrentAttorneyValue = watch("hasCurrentAttorney");
  const awareOfDeadlinesValue = watch("awareOfDeadlines");

  // Calculate section completion - simplified to focus on required fields
  const section1Complete = !!watchedValues.defendantName;
  const section2Complete = !!(watchedValues.incidentState || watchedValues.incidentDate);
  const section3Complete = !!watchedValues.damagesTotal;
  const section4Complete = !!watchedValues.hasWrittenAgreement;
  const section5Complete = !!(
    watchedValues.evidenceContract ||
    watchedValues.evidenceEmails ||
    watchedValues.evidenceTexts ||
    watchedValues.evidenceFinancial ||
    watchedValues.evidencePhotos ||
    watchedValues.evidenceWitness ||
    watchedValues.evidenceOther
  );
  const section6Complete = watchedValues.priorAttorneyContact !== undefined;
  const section7Complete = !!watchedValues.plaintiffName;
  const section8Complete = watchedValues.hasCurrentAttorney !== undefined;

  const overallProgress = [
    section1Complete,
    section2Complete,
    section3Complete,
    section4Complete,
    section5Complete,
    section6Complete,
    section7Complete,
    section8Complete,
  ].filter(Boolean).length;

  if (caseQuery.isLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600"></div>
            <p className="text-gray-600">Loading intake form...</p>
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

  // Show read-only view if intake has been completed
  if (caseData.stage !== "INTAKE" && caseData.intakeCompletedAt) {
    const intake = (caseData.intakeFormData ?? {}) as Record<string, any>;
    
    return (
      <DashboardLayout>
        <ConversationProgress currentStage="INTAKE" caseId={caseId} />
        
        <div className="mx-auto max-w-4xl py-6">
          <div className="mb-6">
            <div className="flex items-start gap-3 mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Intake Form Completed</h1>
                <p className="mt-2 text-gray-600">
                  Completed on {formatDate(caseData.intakeCompletedAt)}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {/* Section 1 - The Other Party */}
            {caseData.defendantName && (
              <Card>
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">The Other Party</h2>
                  <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Defendant Name</dt>
                      <dd className="mt-1 text-sm text-gray-900">{caseData.defendantName}</dd>
                    </div>
                    {caseData.defendantType && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Defendant Type</dt>
                        <dd className="mt-1 text-sm text-gray-900">{caseData.defendantType.replace(/_/g, ' ')}</dd>
                      </div>
                    )}
                    {intake.defendantState && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Defendant State</dt>
                        <dd className="mt-1 text-sm text-gray-900">{intake.defendantState}</dd>
                      </div>
                    )}
                    {intake.defendantAddress && (
                      <div className="sm:col-span-2">
                        <dt className="text-sm font-medium text-gray-500">Defendant Address</dt>
                        <dd className="mt-1 text-sm text-gray-900">{intake.defendantAddress}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              </Card>
            )}

            {/* Section 2 - When & Where */}
            {caseData.incidentState && (
              <Card>
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">When & Where</h2>
                  <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Incident State</dt>
                      <dd className="mt-1 text-sm text-gray-900">{caseData.incidentState}</dd>
                    </div>
                    {caseData.incidentDate && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Incident Date</dt>
                        <dd className="mt-1 text-sm text-gray-900">{formatDate(caseData.incidentDate)}</dd>
                      </div>
                    )}
                    {intake.isOngoing !== null && intake.isOngoing !== undefined && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Ongoing</dt>
                        <dd className="mt-1 text-sm text-gray-900">{intake.isOngoing ? "Yes" : "No"}</dd>
                      </div>
                    )}
                    {intake.incidentEndDate && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">End Date</dt>
                        <dd className="mt-1 text-sm text-gray-900">{formatDate(new Date(intake.incidentEndDate))}</dd>
                      </div>
                    )}
                    {intake.discoveryDate && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Discovery Date</dt>
                        <dd className="mt-1 text-sm text-gray-900">{formatDate(new Date(intake.discoveryDate))}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              </Card>
            )}

            {/* Section 3 - Your Losses */}
            {(intake.damagesTotal || caseData.estimatedDamages) && (
              <Card>
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Losses</h2>
                  <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Total Damages</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        ${(intake.damagesTotal || caseData.estimatedDamages)?.toLocaleString()}
                      </dd>
                    </div>
                    {intake.damagesEconomic && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Economic Damages</dt>
                        <dd className="mt-1 text-sm text-gray-900">${Number(intake.damagesEconomic).toLocaleString()}</dd>
                      </div>
                    )}
                    {intake.damagesLostWages && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Lost Wages</dt>
                        <dd className="mt-1 text-sm text-gray-900">${Number(intake.damagesLostWages).toLocaleString()}</dd>
                      </div>
                    )}
                    {intake.damagesLostBusiness && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Lost Business</dt>
                        <dd className="mt-1 text-sm text-gray-900">${Number(intake.damagesLostBusiness).toLocaleString()}</dd>
                      </div>
                    )}
                    {intake.damagesOther && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Other Damages</dt>
                        <dd className="mt-1 text-sm text-gray-900">${Number(intake.damagesOther).toLocaleString()}</dd>
                      </div>
                    )}
                    {intake.damagesNotes && (
                      <div className="sm:col-span-2">
                        <dt className="text-sm font-medium text-gray-500">Additional Notes</dt>
                        <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{intake.damagesNotes}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              </Card>
            )}

            {/* Section 4 - The Agreement */}
            {intake.hasWrittenAgreement && (
              <Card>
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">The Agreement</h2>
                  <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Written Agreement</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {intake.hasWrittenAgreement === "yes" ? "Yes" : intake.hasWrittenAgreement === "no" ? "No" : "Not Sure"}
                      </dd>
                    </div>
                    {intake.agreementDate && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Agreement Date</dt>
                        <dd className="mt-1 text-sm text-gray-900">{formatDate(new Date(intake.agreementDate))}</dd>
                      </div>
                    )}
                    {intake.agreementType && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Agreement Type</dt>
                        <dd className="mt-1 text-sm text-gray-900">{intake.agreementType}</dd>
                      </div>
                    )}
                    {intake.hasArbitrationClause && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Arbitration Clause</dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {intake.hasArbitrationClause === "yes" ? "Yes" : intake.hasArbitrationClause === "no" ? "No" : "Don't Know"}
                        </dd>
                      </div>
                    )}
                    {intake.hasVenueClause && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Venue Clause</dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {intake.hasVenueClause === "yes" ? "Yes" : intake.hasVenueClause === "no" ? "No" : "Don't Know"}
                        </dd>
                      </div>
                    )}
                    {intake.hasNonCompete !== null && intake.hasNonCompete !== undefined && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Non-Compete Involved</dt>
                        <dd className="mt-1 text-sm text-gray-900">{intake.hasNonCompete ? "Yes" : "No"}</dd>
                      </div>
                    )}
                    {intake.agreementNotes && (
                      <div className="sm:col-span-2">
                        <dt className="text-sm font-medium text-gray-500">Agreement Notes</dt>
                        <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{intake.agreementNotes}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              </Card>
            )}

            {/* Return to Current Step Button */}
            <div className="flex justify-center pt-6">
              <Button
                onClick={() => {
                  const currentRoute = getCurrentStepRoute(caseData.stage, caseId);
                  navigate({ to: currentRoute as any });
                }}
              >
                Return to Current Step
              </Button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <ConversationProgress currentStage="INTAKE" caseId={caseId} />
      
      <div className="mx-auto max-w-4xl py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Case Intake Form</h1>
          <p className="mt-2 text-gray-600">
            Please provide information about your case. Only your name and the defendant's name are required to submit - you can fill in other details as you have them.
          </p>
          <div className="mt-4 flex items-center gap-4">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all"
                style={{ width: `${(overallProgress / 8) * 100}%` }}
              />
            </div>
            <span className="text-sm font-medium text-gray-700">
              {overallProgress} of 8 sections complete
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Section 1 - The Other Party */}
          <CollapsibleSection
            title="The Other Party"
            sectionNumber={1}
            isComplete={section1Complete}
            defaultOpen={!section1Complete}
          >
            <div className="space-y-4">
              <Input
                label="Defendant Name"
                placeholder="Enter the name of the person or entity you're filing against"
                {...register("defendantName")}
                error={errors.defendantName?.message}
                required
              />

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Defendant Type
                </label>
                <select
                  {...register("defendantType")}
                  className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-opacity-20"
                >
                  <option value="">Select type</option>
                  <option value="INDIVIDUAL">Individual</option>
                  <option value="SMALL_BUSINESS">Small Business</option>
                  <option value="CORPORATION">Corporation</option>
                  <option value="GOVERNMENT">Government Entity</option>
                  <option value="OTHER">Other</option>
                </select>
                {errors.defendantType && (
                  <p className="mt-1.5 text-sm text-red-600">{errors.defendantType.message}</p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Defendant State
                </label>
                <select
                  {...register("defendantState")}
                  className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-opacity-20"
                >
                  <option value="">Select state</option>
                  <option value="AL">Alabama</option>
                  <option value="AK">Alaska</option>
                  <option value="AZ">Arizona</option>
                  <option value="AR">Arkansas</option>
                  <option value="CA">California</option>
                  <option value="CO">Colorado</option>
                  <option value="CT">Connecticut</option>
                  <option value="DE">Delaware</option>
                  <option value="FL">Florida</option>
                  <option value="GA">Georgia</option>
                  <option value="HI">Hawaii</option>
                  <option value="ID">Idaho</option>
                  <option value="IL">Illinois</option>
                  <option value="IN">Indiana</option>
                  <option value="IA">Iowa</option>
                  <option value="KS">Kansas</option>
                  <option value="KY">Kentucky</option>
                  <option value="LA">Louisiana</option>
                  <option value="ME">Maine</option>
                  <option value="MD">Maryland</option>
                  <option value="MA">Massachusetts</option>
                  <option value="MI">Michigan</option>
                  <option value="MN">Minnesota</option>
                  <option value="MS">Mississippi</option>
                  <option value="MO">Missouri</option>
                  <option value="MT">Montana</option>
                  <option value="NE">Nebraska</option>
                  <option value="NV">Nevada</option>
                  <option value="NH">New Hampshire</option>
                  <option value="NJ">New Jersey</option>
                  <option value="NM">New Mexico</option>
                  <option value="NY">New York</option>
                  <option value="NC">North Carolina</option>
                  <option value="ND">North Dakota</option>
                  <option value="OH">Ohio</option>
                  <option value="OK">Oklahoma</option>
                  <option value="OR">Oregon</option>
                  <option value="PA">Pennsylvania</option>
                  <option value="RI">Rhode Island</option>
                  <option value="SC">South Carolina</option>
                  <option value="SD">South Dakota</option>
                  <option value="TN">Tennessee</option>
                  <option value="TX">Texas</option>
                  <option value="UT">Utah</option>
                  <option value="VT">Vermont</option>
                  <option value="VA">Virginia</option>
                  <option value="WA">Washington</option>
                  <option value="WV">West Virginia</option>
                  <option value="WI">Wisconsin</option>
                  <option value="WY">Wyoming</option>
                </select>
                {errors.defendantState && (
                  <p className="mt-1.5 text-sm text-red-600">{errors.defendantState.message}</p>
                )}
              </div>

              {!showAddressSkip ? (
                <div className="space-y-2">
                  <Input
                    label="Defendant Address (Optional)"
                    placeholder="Enter full address if known"
                    {...register("defendantAddress")}
                    error={errors.defendantAddress?.message}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setValue("defendantAddress", "");
                      setShowAddressSkip(true);
                    }}
                  >
                    I don't know the address
                  </Button>
                </div>
              ) : (
                <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
                  Address marked as unknown
                </div>
              )}
            </div>
          </CollapsibleSection>

          {/* Section 2 - When & Where */}
          <CollapsibleSection
            title="When & Where"
            sectionNumber={2}
            isComplete={section2Complete}
            defaultOpen={!section2Complete && section1Complete}
          >
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Incident State
                </label>
                <select
                  {...register("incidentState")}
                  className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-opacity-20"
                >
                  <option value="">Select state</option>
                  <option value="AL">Alabama</option>
                  <option value="AK">Alaska</option>
                  <option value="AZ">Arizona</option>
                  <option value="AR">Arkansas</option>
                  <option value="CA">California</option>
                  <option value="CO">Colorado</option>
                  <option value="CT">Connecticut</option>
                  <option value="DE">Delaware</option>
                  <option value="FL">Florida</option>
                  <option value="GA">Georgia</option>
                  <option value="HI">Hawaii</option>
                  <option value="ID">Idaho</option>
                  <option value="IL">Illinois</option>
                  <option value="IN">Indiana</option>
                  <option value="IA">Iowa</option>
                  <option value="KS">Kansas</option>
                  <option value="KY">Kentucky</option>
                  <option value="LA">Louisiana</option>
                  <option value="ME">Maine</option>
                  <option value="MD">Maryland</option>
                  <option value="MA">Massachusetts</option>
                  <option value="MI">Michigan</option>
                  <option value="MN">Minnesota</option>
                  <option value="MS">Mississippi</option>
                  <option value="MO">Missouri</option>
                  <option value="MT">Montana</option>
                  <option value="NE">Nebraska</option>
                  <option value="NV">Nevada</option>
                  <option value="NH">New Hampshire</option>
                  <option value="NJ">New Jersey</option>
                  <option value="NM">New Mexico</option>
                  <option value="NY">New York</option>
                  <option value="NC">North Carolina</option>
                  <option value="ND">North Dakota</option>
                  <option value="OH">Ohio</option>
                  <option value="OK">Oklahoma</option>
                  <option value="OR">Oregon</option>
                  <option value="PA">Pennsylvania</option>
                  <option value="RI">Rhode Island</option>
                  <option value="SC">South Carolina</option>
                  <option value="SD">South Dakota</option>
                  <option value="TN">Tennessee</option>
                  <option value="TX">Texas</option>
                  <option value="UT">Utah</option>
                  <option value="VT">Vermont</option>
                  <option value="VA">Virginia</option>
                  <option value="WA">Washington</option>
                  <option value="WV">West Virginia</option>
                  <option value="WI">Wisconsin</option>
                  <option value="WY">Wyoming</option>
                </select>
                {errors.incidentState && (
                  <p className="mt-1.5 text-sm text-red-600">{errors.incidentState.message}</p>
                )}
              </div>

              <Input
                type="date"
                label="Incident Date"
                {...register("incidentDate")}
                error={errors.incidentDate?.message}
              />

              <Checkbox
                label="This situation is ongoing"
                {...register("isOngoing")}
              />

              {!isOngoingValue && (
                <Input
                  type="date"
                  label="End Date"
                  {...register("incidentEndDate")}
                  error={errors.incidentEndDate?.message}
                />
              )}

              {!showDiscoverySkip ? (
                <div className="space-y-2">
                  <Input
                    type="date"
                    label="Discovery Date (Optional)"
                    helperText="When did you first discover the issue?"
                    {...register("discoveryDate")}
                    error={errors.discoveryDate?.message}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const incidentDate = watch("incidentDate");
                      setValue("discoveryDate", incidentDate);
                      setShowDiscoverySkip(true);
                    }}
                  >
                    Same as incident date
                  </Button>
                </div>
              ) : (
                <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
                  Discovery date set to incident date
                </div>
              )}
            </div>
          </CollapsibleSection>

          {/* Section 3 - Your Losses */}
          <CollapsibleSection
            title="Your Losses"
            sectionNumber={3}
            isComplete={section3Complete}
            defaultOpen={!section3Complete && section2Complete}
          >
            <div className="space-y-4">
              <Input
                type="number"
                label="Total Damages"
                placeholder="Enter total amount in dollars"
                {...register("damagesTotal")}
                error={errors.damagesTotal?.message}
              />

              <div className="rounded-lg bg-blue-50 p-4 border border-blue-200">
                <p className="text-sm font-medium text-blue-900 mb-2">
                  Optional Breakdown
                </p>
                <p className="text-sm text-blue-800 mb-3">
                  You can provide a detailed breakdown of your damages below, or skip this section.
                </p>
                <div className="space-y-3">
                  <Input
                    type="number"
                    label="Economic Damages"
                    placeholder="Property damage, repair costs, etc."
                    {...register("damagesEconomic")}
                  />
                  <Input
                    type="number"
                    label="Lost Wages"
                    placeholder="Income lost due to this issue"
                    {...register("damagesLostWages")}
                  />
                  <Input
                    type="number"
                    label="Lost Business"
                    placeholder="Business opportunities or revenue lost"
                    {...register("damagesLostBusiness")}
                  />
                  <Input
                    type="number"
                    label="Other Damages"
                    placeholder="Any other quantifiable losses"
                    {...register("damagesOther")}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Additional Notes
                </label>
                <textarea
                  {...register("damagesNotes")}
                  rows={4}
                  className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-opacity-20"
                  placeholder="Provide any additional context about your losses"
                />
              </div>
            </div>
          </CollapsibleSection>

          {/* Section 4 - The Agreement */}
          <CollapsibleSection
            title="The Agreement"
            sectionNumber={4}
            isComplete={section4Complete}
            defaultOpen={!section4Complete && section3Complete}
          >
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Was there a written agreement?
                </label>
                <select
                  {...register("hasWrittenAgreement")}
                  className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-opacity-20"
                >
                  <option value="">Select an option</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                  <option value="not_sure">Not Sure</option>
                </select>
              </div>

              {hasWrittenAgreementValue === "yes" && (
                <div className="space-y-4 rounded-lg bg-gray-50 p-4">
                  <Input
                    type="date"
                    label="Agreement Date"
                    {...register("agreementDate")}
                  />
                  <Input
                    label="Agreement Type"
                    placeholder="e.g., Employment Contract, Service Agreement, etc."
                    {...register("agreementType")}
                  />
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <textarea
                      {...register("agreementNotes")}
                      rows={3}
                      className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-opacity-20"
                      placeholder="Brief description of the agreement"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Does the agreement have an arbitration clause?
                </label>
                <select
                  {...register("hasArbitrationClause")}
                  className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-opacity-20"
                >
                  <option value="">Select an option</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                  <option value="dont_know">Don't Know</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Does the agreement have a venue clause?
                </label>
                <select
                  {...register("hasVenueClause")}
                  className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-opacity-20"
                >
                  <option value="">Select an option</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                  <option value="dont_know">Don't Know</option>
                </select>
              </div>

              <Checkbox
                label="A non-compete agreement is involved"
                {...register("hasNonCompete")}
              />
            </div>
          </CollapsibleSection>

          {/* Section 5 - Evidence You Have */}
          <CollapsibleSection
            title="Evidence You Have"
            sectionNumber={5}
            isComplete={section5Complete}
            defaultOpen={!section5Complete && section4Complete}
          >
            <div className="space-y-4">
              <div>
                <p className="mb-3 text-sm font-medium text-gray-700">
                  What types of evidence do you have? (Select all that apply)
                </p>
                <div className="space-y-2">
                  <Checkbox label="Written Contract" {...register("evidenceContract")} />
                  <Checkbox label="Emails" {...register("evidenceEmails")} />
                  <Checkbox label="Text Messages" {...register("evidenceTexts")} />
                  <Checkbox label="Financial Records" {...register("evidenceFinancial")} />
                  <Checkbox label="Photos/Videos" {...register("evidencePhotos")} />
                  <Checkbox label="Witness Statements" {...register("evidenceWitness")} />
                  <Checkbox label="Other Evidence" {...register("evidenceOther")} />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Do you have witnesses?
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="true"
                      {...register("hasWitnesses")}
                      className="h-4 w-4 border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Yes</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="false"
                      {...register("hasWitnesses")}
                      className="h-4 w-4 border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">No</span>
                  </label>
                </div>
              </div>

              {hasWitnessesValue === "true" && (
                <Input
                  type="number"
                  label="How many witnesses?"
                  placeholder="Enter number"
                  {...register("witnessCount")}
                />
              )}
            </div>
          </CollapsibleSection>

          {/* Section 6 - Prior Legal Action */}
          <CollapsibleSection
            title="Prior Legal Action"
            sectionNumber={6}
            isComplete={section6Complete}
            defaultOpen={!section6Complete && section5Complete}
          >
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Have you contacted other attorneys about this case?
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="true"
                      {...register("priorAttorneyContact")}
                      className="h-4 w-4 border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Yes</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="false"
                      {...register("priorAttorneyContact")}
                      className="h-4 w-4 border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">No</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Have you filed this case in court?
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="true"
                      {...register("priorCourtFiling")}
                      className="h-4 w-4 border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Yes</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="false"
                      {...register("priorCourtFiling")}
                      className="h-4 w-4 border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">No</span>
                  </label>
                </div>
              </div>

              {(priorAttorneyContactValue === "true" || priorCourtFilingValue === "true") && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Please provide details
                  </label>
                  <textarea
                    {...register("priorLegalNotes")}
                    rows={4}
                    className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-opacity-20"
                    placeholder="Provide details about prior legal actions"
                  />
                </div>
              )}
            </div>
          </CollapsibleSection>

          {/* Section 7 - Contact Info */}
          <CollapsibleSection
            title="Contact Info"
            sectionNumber={7}
            isComplete={section7Complete}
            defaultOpen={!section7Complete && section6Complete}
          >
            <div className="space-y-4">
              <Input
                label="Your Full Name"
                {...register("plaintiffName")}
                error={errors.plaintiffName?.message}
                required
              />

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Your State
                </label>
                <select
                  {...register("plaintiffState")}
                  className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-opacity-20"
                >
                  <option value="">Select state</option>
                  <option value="AL">Alabama</option>
                  <option value="AK">Alaska</option>
                  <option value="AZ">Arizona</option>
                  <option value="AR">Arkansas</option>
                  <option value="CA">California</option>
                  <option value="CO">Colorado</option>
                  <option value="CT">Connecticut</option>
                  <option value="DE">Delaware</option>
                  <option value="FL">Florida</option>
                  <option value="GA">Georgia</option>
                  <option value="HI">Hawaii</option>
                  <option value="ID">Idaho</option>
                  <option value="IL">Illinois</option>
                  <option value="IN">Indiana</option>
                  <option value="IA">Iowa</option>
                  <option value="KS">Kansas</option>
                  <option value="KY">Kentucky</option>
                  <option value="LA">Louisiana</option>
                  <option value="ME">Maine</option>
                  <option value="MD">Maryland</option>
                  <option value="MA">Massachusetts</option>
                  <option value="MI">Michigan</option>
                  <option value="MN">Minnesota</option>
                  <option value="MS">Mississippi</option>
                  <option value="MO">Missouri</option>
                  <option value="MT">Montana</option>
                  <option value="NE">Nebraska</option>
                  <option value="NV">Nevada</option>
                  <option value="NH">New Hampshire</option>
                  <option value="NJ">New Jersey</option>
                  <option value="NM">New Mexico</option>
                  <option value="NY">New York</option>
                  <option value="NC">North Carolina</option>
                  <option value="ND">North Dakota</option>
                  <option value="OH">Ohio</option>
                  <option value="OK">Oklahoma</option>
                  <option value="OR">Oregon</option>
                  <option value="PA">Pennsylvania</option>
                  <option value="RI">Rhode Island</option>
                  <option value="SC">South Carolina</option>
                  <option value="SD">South Dakota</option>
                  <option value="TN">Tennessee</option>
                  <option value="TX">Texas</option>
                  <option value="UT">Utah</option>
                  <option value="VT">Vermont</option>
                  <option value="VA">Virginia</option>
                  <option value="WA">Washington</option>
                  <option value="WV">West Virginia</option>
                  <option value="WI">Wisconsin</option>
                  <option value="WY">Wyoming</option>
                </select>
                {errors.plaintiffState && (
                  <p className="mt-1.5 text-sm text-red-600">{errors.plaintiffState.message}</p>
                )}
              </div>

              {!showPhoneSkip ? (
                <div className="space-y-2">
                  <Input
                    type="tel"
                    label="Phone Number (Optional)"
                    placeholder="(555) 123-4567"
                    {...register("plaintiffPhone")}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setValue("plaintiffPhone", "");
                      setShowPhoneSkip(true);
                    }}
                  >
                    Prefer email contact
                  </Button>
                </div>
              ) : (
                <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
                  Email contact preferred
                </div>
              )}
            </div>
          </CollapsibleSection>

          {/* Section 8 - Your Situation */}
          <CollapsibleSection
            title="Your Situation"
            sectionNumber={8}
            isComplete={section8Complete}
            defaultOpen={!section8Complete && section7Complete}
          >
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Do you currently have an attorney?
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="true"
                      {...register("hasCurrentAttorney")}
                      className="h-4 w-4 border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Yes</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="false"
                      {...register("hasCurrentAttorney")}
                      className="h-4 w-4 border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">No</span>
                  </label>
                </div>
              </div>

              {hasCurrentAttorneyValue === "true" && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Attorney Information
                  </label>
                  <textarea
                    {...register("currentAttorneyInfo")}
                    rows={3}
                    className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-opacity-20"
                    placeholder="Name, firm, and reason for seeking additional counsel"
                  />
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Fee Preference
                </label>
                <select
                  {...register("feePreference")}
                  className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-opacity-20"
                >
                  <option value="">Select preference</option>
                  <option value="contingency">Contingency (% of recovery)</option>
                  <option value="hybrid">Hybrid (reduced hourly + %)</option>
                  <option value="hourly">Hourly Rate</option>
                  <option value="unsure">Unsure/Open to Discussion</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Are you aware of any filing deadlines?
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="true"
                      {...register("awareOfDeadlines")}
                      className="h-4 w-4 border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Yes</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="false"
                      {...register("awareOfDeadlines")}
                      className="h-4 w-4 border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">No</span>
                  </label>
                </div>
              </div>

              {awareOfDeadlinesValue === "true" && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Deadline Details
                  </label>
                  <textarea
                    {...register("deadlineNotes")}
                    rows={3}
                    className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-opacity-20"
                    placeholder="Please describe any deadlines you're aware of"
                  />
                </div>
              )}
            </div>
          </CollapsibleSection>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-6">
            <Button
              type="button"
              variant="secondary"
              onClick={handleSaveAndExit}
              isLoading={saveProgressMutation.isPending}
              className="flex-1"
            >
              <Save className="mr-2 h-5 w-5" />
              Save & Exit
            </Button>
            <Button
              type="submit"
              isLoading={submitIntakeMutation.isPending}
              className="flex-1"
            >
              Complete Intake
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
