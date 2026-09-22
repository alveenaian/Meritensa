import { CheckCircle2, Circle } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { cn } from "~/lib/utils";

interface ConversationProgressProps {
  currentStage: "CONVERSATION" | "INTAKE" | "EVIDENCE" | "ANALYSIS" | "COMPLETE";
  caseId: string;
}

const STAGES = [
  { key: "CONVERSATION", label: "Story", description: "Share your story" },
  { key: "INTAKE", label: "Details", description: "Key facts & dates" },
  { key: "EVIDENCE", label: "Evidence", description: "Upload documents" },
  { key: "ANALYSIS", label: "Analysis", description: "AI assessment" },
  { key: "COMPLETE", label: "Case File", description: "Ready to share" },
] as const;

export function ConversationProgress({ currentStage, caseId }: ConversationProgressProps) {
  const currentIndex = STAGES.findIndex((s) => s.key === currentStage);
  const navigate = useNavigate();

  const handleStageClick = (stageKey: string, index: number) => {
    // Don't allow clicking on future stages
    if (index > currentIndex) {
      return;
    }

    // Determine the route based on the stage key
    // For completed steps (index < currentIndex) and current step (index === currentIndex),
    // navigate to the stage's route. The route component will decide whether to show
    // read-only or editable view based on the case stage.
    let to: string;

    if (stageKey === "CONVERSATION") {
      to = `/dashboard/cases/${caseId}/conversation`;
    } else if (stageKey === "INTAKE") {
      to = `/dashboard/cases/${caseId}/intake`;
    } else if (stageKey === "EVIDENCE") {
      to = `/dashboard/cases/${caseId}/evidence`;
    } else if (stageKey === "ANALYSIS") {
      to = `/dashboard/cases/${caseId}/analysis`;
    } else if (stageKey === "COMPLETE") {
      to = `/dashboard/cases/${caseId}`;
    } else {
      return;
    }

    navigate({ to: to as any });
  };

  return (
    <div className="w-full bg-white border-b border-gray-200 px-4 py-3">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          {STAGES.map((stage, index) => {
            const isCompleted = index < currentIndex;
            const isCurrent = index === currentIndex;
            const isUpcoming = index > currentIndex;

            return (
              <div key={stage.key} className="flex items-center flex-1">
                {/* Stage indicator */}
                <button
                  onClick={() => handleStageClick(stage.key, index)}
                  disabled={isUpcoming}
                  className={cn(
                    "flex flex-col items-center transition-opacity",
                    isUpcoming ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:opacity-80"
                  )}
                  type="button"
                >
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors",
                      isCompleted && "border-primary-600 bg-primary-600 text-white",
                      isCurrent && "border-primary-600 bg-white text-primary-600",
                      isUpcoming && "border-gray-300 bg-white text-gray-400"
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <Circle className="h-5 w-5" fill={isCurrent ? "currentColor" : "none"} />
                    )}
                  </div>
                  <div className="mt-2 text-center">
                    <div
                      className={cn(
                        "text-sm font-medium",
                        (isCompleted || isCurrent) && "text-gray-900",
                        isUpcoming && "text-gray-500"
                      )}
                    >
                      {stage.label}
                    </div>
                    <div className="text-xs text-gray-500 hidden sm:block">
                      {stage.description}
                    </div>
                  </div>
                </button>

                {/* Connector line */}
                {index < STAGES.length - 1 && (
                  <div
                    className={cn(
                      "h-0.5 flex-1 mx-2 transition-colors",
                      index < currentIndex ? "bg-primary-600" : "bg-gray-300"
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
