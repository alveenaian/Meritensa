import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/Card";
import { DollarSign } from "lucide-react";

interface DamagesTabProps {
  caseData: any;
}

// Helper to safely format currency from string or number without precision loss
function formatDamageAmount(value: string | number | null | undefined): string {
  if (!value) return "$0";
  
  // If it's already a number, format it
  if (typeof value === "number") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }
  
  // If it's a string, parse it carefully to avoid precision loss
  const cleanedValue = String(value).replace(/[^0-9.]/g, '');
  const numValue = parseFloat(cleanedValue);
  
  if (isNaN(numValue)) return "$0";
  
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numValue);
}

export function DamagesTab({ caseData }: DamagesTabProps) {
  const intakeData = (caseData.intakeFormData as any) || {};
  const analysisResults = (caseData.analysisResults as any) || {};
  
  // Read damages from intakeFormData, with estimatedDamages as fallback for total only
  const damagesTotal = intakeData.damagesTotal || caseData.estimatedDamages;
  const damagesEconomic = intakeData.damagesEconomic || null;
  const damagesLostWages = intakeData.damagesLostWages || null;
  const damagesLostBusiness = intakeData.damagesLostBusiness || null;
  const damagesOther = intakeData.damagesOther || null;
  const damagesNotes = intakeData.damagesNotes || null;
  
  const damagesMemo = analysisResults.damagesMemo || caseData.generatedDamagesMemo;

  const hasDamagesData = damagesTotal || damagesEconomic || damagesLostWages || damagesLostBusiness || damagesOther;

  return (
    <div className="space-y-6">
      {/* Damages Memo */}
      {damagesMemo && (
        <Card>
          <CardHeader>
            <CardTitle>Damages Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <p className="whitespace-pre-wrap text-gray-700">{damagesMemo}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Damages Breakdown */}
      {hasDamagesData && (
        <Card>
          <CardHeader>
            <CardTitle>Damages Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {damagesEconomic && (
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-900">Economic Damages</td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                        {formatDamageAmount(damagesEconomic)}
                      </td>
                    </tr>
                  )}
                  {damagesLostWages && (
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-900">Lost Wages</td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                        {formatDamageAmount(damagesLostWages)}
                      </td>
                    </tr>
                  )}
                  {damagesLostBusiness && (
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-900">Lost Business</td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                        {formatDamageAmount(damagesLostBusiness)}
                      </td>
                    </tr>
                  )}
                  {damagesOther && (
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-900">Other Damages</td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                        {formatDamageAmount(damagesOther)}
                      </td>
                    </tr>
                  )}
                  <tr className="bg-gray-50">
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">Total Damages</td>
                    <td className="px-4 py-3 text-sm text-right font-bold text-gray-900">
                      {formatDamageAmount(damagesTotal)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {damagesNotes && (
              <div className="mt-4 rounded-lg bg-blue-50 p-4 border border-blue-200">
                <p className="text-sm font-medium text-blue-900 mb-1">Additional Notes</p>
                <p className="text-sm text-blue-800">{damagesNotes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!damagesMemo && !hasDamagesData && (
        <Card>
          <CardContent className="py-12 text-center">
            <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-4 text-gray-600">No damages information available</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
