import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/Card";
import { AlertCircle, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { formatDate, formatCurrency, formatCaseType } from "~/lib/utils";

function getDaysUntil(date: Date): number {
  return Math.floor((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function formatSolCountdown(date: Date): string {
  const days = getDaysUntil(date);
  if (days < 0) return "EXPIRED";
  if (days === 0) return "TODAY";
  if (days === 1) return "1 day remaining";
  if (days < 30) return `${days} days remaining`;
  if (days < 365) return `${Math.floor(days / 30)} months remaining`;
  return `${(days / 365).toFixed(1)} years remaining`;
}

function getSolUrgencyClass(date: Date): string {
  const days = getDaysUntil(date);
  if (days < 0) return "bg-gray-100 border border-gray-300";
  if (days < 90) return "bg-red-50 border border-red-200";
  if (days < 180) return "bg-orange-50 border border-orange-200";
  if (days < 365) return "bg-yellow-50 border border-yellow-200";
  return "bg-green-50 border border-green-200";
}

function getSolTextClass(date: Date): string {
  const days = getDaysUntil(date);
  if (days < 0) return "text-gray-700";
  if (days < 90) return "text-red-700";
  if (days < 180) return "text-orange-700";
  if (days < 365) return "text-yellow-700";
  return "text-green-700";
}

function getScoreColor(score: number) {
  if (score >= 76) return "text-score-high";
  if (score >= 51) return "text-score-medium";
  return "text-score-low";
}

function getScoreBarColor(score: number) {
  if (score >= 76) return "bg-score-high";
  if (score >= 51) return "bg-score-medium";
  return "bg-score-low";
}

interface SummaryTabProps {
  caseData: any;
}

export function SummaryTab({ caseData }: SummaryTabProps) {
  // Read from consolidated analysisResults field
  const analysisResults = (caseData.analysisResults as any) || {};
  const generatedScore = analysisResults.caseScore || (caseData.generatedScore as any);
  const generatedRedFlags = analysisResults.redFlags || (caseData.generatedRedFlags as any[]) || [];
  const generatedRecommendations = analysisResults.recommendations || (caseData.generatedRecommendations as string[]) || [];
  const caseSummary = analysisResults.caseSummary || caseData.generatedSummary || caseData.summary;

  return (
    <div className="space-y-6">
      {/* AI Disclaimer */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
        <p className="text-sm text-blue-800 leading-relaxed">
          <strong>AI-Generated Analysis:</strong> Scores are calculated from structured case data. 
          Legal assessments are AI-generated estimates, not attorney opinions. 
          Always consult with a qualified attorney before making legal decisions.
        </p>
      </div>

      {/* Case Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Case Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Case Type</p>
              <p className="mt-1 text-base text-gray-900">{formatCaseType(caseData.caseType)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Defendant</p>
              <p className="mt-1 text-base text-gray-900">{caseData.defendantName || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Jurisdiction</p>
              <p className="mt-1 text-base text-gray-900">{caseData.incidentState || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Incident Date</p>
              <p className="mt-1 text-base text-gray-900">{formatDate(caseData.incidentDate)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Damages</p>
              <p className="mt-1 text-base text-gray-900">{formatCurrency(caseData.estimatedDamages)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Fee Preference</p>
              <p className="mt-1 text-base text-gray-900 capitalize">
                {((caseData.intakeFormData as any)?.feePreference || "Not specified").replace(/_/g, " ")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SOL Deadline */}
      {caseData.solDeadline && (
        <div className={`rounded-xl p-5 shadow-card ${getSolUrgencyClass(new Date(caseData.solDeadline))}`}>
          <div className="flex items-center justify-between">
            <span className="font-semibold text-secondary-900">Statute of Limitations</span>
            <span className={`text-xl font-bold ${getSolTextClass(new Date(caseData.solDeadline))}`}>
              {formatSolCountdown(new Date(caseData.solDeadline))}
            </span>
          </div>
          {getDaysUntil(new Date(caseData.solDeadline)) < 90 && getDaysUntil(new Date(caseData.solDeadline)) >= 0 && (
            <div className="mt-3 flex items-start gap-3 p-3 rounded-lg bg-red-100/50">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 leading-relaxed">
                <strong>Urgent:</strong> Less than 90 days remaining. Consider seeking legal
                counsel immediately to preserve your rights.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Red Flags */}
      {generatedRedFlags.length > 0 && (
        <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-900">
              <AlertCircle className="h-6 w-6" />
              Red Flags & Concerns
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {generatedRedFlags.map((flag: any, index: number) => (
                <div
                  key={index}
                  className={`rounded-xl p-4 shadow-subtle ${
                    flag.severity === "CRITICAL"
                      ? "bg-red-50 border border-red-200"
                      : flag.severity === "HIGH"
                      ? "bg-orange-50 border border-orange-200"
                      : flag.severity === "MEDIUM"
                      ? "bg-yellow-50 border border-yellow-200"
                      : "bg-blue-50 border border-blue-200"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                        flag.severity === "CRITICAL"
                          ? "bg-red-100 text-red-800"
                          : flag.severity === "HIGH"
                          ? "bg-orange-100 text-orange-800"
                          : flag.severity === "MEDIUM"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {flag.severity}
                    </span>
                  </div>
                  <p className="mt-3 font-semibold text-secondary-900">{flag.concern}</p>
                  <p className="mt-2 text-sm text-secondary-700 leading-relaxed">{flag.explanation}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Case Score Visualization */}
      {generatedScore && (
        <Card>
          <CardHeader>
            <CardTitle>Case Score Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {/* Overall score circle */}
              <div className="text-center">
                <div className="inline-flex items-center justify-center">
                  <div className="relative h-40 w-40">
                    <svg className="h-40 w-40 -rotate-90 transform">
                      <circle
                        cx="80"
                        cy="80"
                        r="70"
                        stroke="currentColor"
                        strokeWidth="10"
                        fill="none"
                        className="text-secondary-100"
                      />
                      <circle
                        cx="80"
                        cy="80"
                        r="70"
                        stroke="currentColor"
                        strokeWidth="10"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 70}`}
                        strokeDashoffset={`${2 * Math.PI * 70 * (1 - generatedScore.overall / 100)}`}
                        className={getScoreColor(generatedScore.overall)}
                        strokeLinecap="round"
                        style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className={`text-4xl font-bold ${getScoreColor(generatedScore.overall)}`}>
                        {generatedScore.overall}
                      </span>
                      <span className="text-sm font-medium text-secondary-500 mt-1">Overall Score</span>
                    </div>
                  </div>
                </div>
                <p className="mt-6 text-sm text-secondary-600">
                  Overall Case Viability Assessment
                </p>
              </div>

              {/* Score breakdown */}
              <div className="space-y-5">
                <h4 className="font-semibold text-lg text-secondary-900">Detailed Breakdown</h4>
                <ScoreBar label="Evidence Strength" score={generatedScore.evidence || 0} />
                <ScoreBar label="Liability Clarity" score={generatedScore.liability || 0} />
                <ScoreBar label="Damages Quantifiability" score={generatedScore.damages || 0} />
                <ScoreBar label="Defendant Collectability" score={generatedScore.collectability || 0} />
                {generatedScore.solRisk !== undefined && (
                  <ScoreBar label="SOL Risk" score={100 - generatedScore.solRisk} inverted />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Narrative Summary */}
      {caseSummary && (
        <Card>
          <CardHeader>
            <CardTitle>Case Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <p className="whitespace-pre-wrap text-secondary-700 leading-relaxed">{caseSummary}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {generatedRecommendations.length > 0 && (
        <Card className="bg-gradient-to-br from-primary-50/30 to-transparent">
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {generatedRecommendations.map((rec: string, index: number) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1 h-1.5 w-1.5 rounded-full bg-primary-600"></div>
                  <span className="text-secondary-700 leading-relaxed">{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ScoreBar({ label, score, inverted }: { label: string; score: number; inverted?: boolean }) {
  const displayScore = inverted ? 100 - score : score;
  const getBarColor = (score: number) => {
    if (score >= 76) return "bg-emerald-500";
    if (score >= 51) return "bg-amber-500";
    return "bg-red-500";
  };
  
  const getTextColor = (score: number) => {
    if (score >= 76) return "text-emerald-600";
    if (score >= 51) return "text-amber-600";
    return "text-red-600";
  };

  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-2">
        <span className="font-medium text-secondary-700">{label}</span>
        <span className={`font-semibold ${getTextColor(displayScore)}`}>{Math.round(displayScore)}/100</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-secondary-100">
        <div
          className={`h-full transition-all duration-1000 ease-out ${getBarColor(displayScore)}`}
          style={{ width: `${displayScore}%` }}
        />
      </div>
    </div>
  );
}
