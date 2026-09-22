import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/Card";
import { CheckCircle2 } from "lucide-react";
import { formatDate } from "~/lib/utils";

interface StoryTabProps {
  caseData: any;
}

export function StoryTab({ caseData }: StoryTabProps) {
  return (
    <div className="space-y-6">
      {/* Story Confirmed Header */}
      <Card>
        <CardContent className="py-6">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-8 w-8 text-green-600 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Story Confirmed
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Confirmed on {caseData.narrativeConfirmedAt ? formatDate(caseData.narrativeConfirmedAt) : "Unknown date"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Narrative Summary */}
      {caseData.narrativeSummary && (
        <Card>
          <CardHeader>
            <CardTitle>Your Story Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <p className="whitespace-pre-wrap text-gray-700">
                {caseData.narrativeSummary}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preliminary Assessment */}
      {caseData.preliminaryAssessment && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-900">Initial Impressions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <p className="whitespace-pre-wrap text-blue-800">
                {caseData.preliminaryAssessment}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* If no narrative data available */}
      {!caseData.narrativeSummary && !caseData.preliminaryAssessment && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-600">No story information available</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
