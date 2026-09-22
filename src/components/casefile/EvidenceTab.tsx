import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/Card";
import { Button } from "~/components/ui/Button";
import { DocumentList } from "~/components/documents/DocumentList";
import { CheckCircle2, HelpCircle, XCircle, Upload } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

interface EvidenceTabProps {
  caseId: string;
  caseData: any;
}

export function EvidenceTab({ caseId, caseData }: EvidenceTabProps) {
  const navigate = useNavigate();
  const analysisResults = (caseData.analysisResults as any) || {};
  const evidenceInventory = analysisResults.evidenceInventory || (caseData.generatedEvidenceInventory as any);
  const documents = caseData.documents || [];

  const handleAddMoreEvidence = () => {
    navigate({
      to: "/dashboard/cases/$caseId/evidence",
      params: { caseId },
    });
  };

  return (
    <div className="space-y-6">
      {/* Evidence Inventory */}
      {evidenceInventory && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Evidence We Have */}
          {evidenceInventory.have && evidenceInventory.have.length > 0 && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-900 text-base">
                  <CheckCircle2 className="h-5 w-5" />
                  Evidence You Have
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {evidenceInventory.have.map((item: string, index: number) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <span className="text-green-600 mt-0.5">✓</span>
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Evidence That Would Help */}
          {evidenceInventory.wouldHelp && evidenceInventory.wouldHelp.length > 0 && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-900 text-base">
                  <HelpCircle className="h-5 w-5" />
                  Would Strengthen Case
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {evidenceInventory.wouldHelp.map((item: string, index: number) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <span className="text-blue-600 mt-0.5">+</span>
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Missing Evidence */}
          {evidenceInventory.missing && evidenceInventory.missing.length > 0 && (
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-900 text-base">
                  <XCircle className="h-5 w-5" />
                  Missing Evidence
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {evidenceInventory.missing.map((item: string, index: number) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <span className="text-orange-600 mt-0.5">!</span>
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Uploaded Documents */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Uploaded Documents ({documents.length})</CardTitle>
            <Button size="sm" onClick={handleAddMoreEvidence}>
              <Upload className="mr-2 h-4 w-4" />
              Add More Evidence
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <DocumentList caseId={caseId} />
        </CardContent>
      </Card>
    </div>
  );
}
