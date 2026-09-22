import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/Card";
import { CheckCircle2 } from "lucide-react";
import { formatDate } from "~/lib/utils";

interface DetailsTabProps {
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

export function DetailsTab({ caseData }: DetailsTabProps) {
  const intakeData = (caseData.intakeFormData as any) || {};
  
  // Helper function to get value from intakeData or fallback to old field
  const getValue = (intakeKey: string, oldKey: string) => {
    return intakeData[intakeKey] !== undefined ? intakeData[intakeKey] : caseData[oldKey];
  };

  return (
    <div className="space-y-6">
      {/* Intake Completed Header */}
      <Card>
        <CardContent className="py-6">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-8 w-8 text-green-600 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Intake Form Completed
              </h2>
              {caseData.intakeCompletedAt && (
                <p className="mt-1 text-sm text-gray-600">
                  Completed on {formatDate(caseData.intakeCompletedAt)}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 1 - The Other Party */}
      {getValue('defendantName', 'defendantName') && (
        <Card>
          <CardHeader>
            <CardTitle>The Other Party</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Defendant Name</dt>
                <dd className="mt-1 text-sm text-gray-900">{getValue('defendantName', 'defendantName')}</dd>
              </div>
              {getValue('defendantType', 'defendantType') && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Defendant Type</dt>
                  <dd className="mt-1 text-sm text-gray-900">{getValue('defendantType', 'defendantType').replace(/_/g, ' ')}</dd>
                </div>
              )}
              {getValue('defendantState', 'defendantState') && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Defendant State</dt>
                  <dd className="mt-1 text-sm text-gray-900">{getValue('defendantState', 'defendantState')}</dd>
                </div>
              )}
              {getValue('defendantAddress', 'defendantAddress') && (
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Defendant Address</dt>
                  <dd className="mt-1 text-sm text-gray-900">{getValue('defendantAddress', 'defendantAddress')}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>
      )}

      {/* Section 2 - When & Where */}
      {(getValue('incidentState', 'incidentState') || caseData.incidentDate) && (
        <Card>
          <CardHeader>
            <CardTitle>When & Where</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {getValue('incidentState', 'incidentState') && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Incident State</dt>
                  <dd className="mt-1 text-sm text-gray-900">{getValue('incidentState', 'incidentState')}</dd>
                </div>
              )}
              {caseData.incidentDate && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Incident Date</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatDate(caseData.incidentDate)}</dd>
                </div>
              )}
              {getValue('isOngoing', 'isOngoing') !== null && getValue('isOngoing', 'isOngoing') !== undefined && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Ongoing</dt>
                  <dd className="mt-1 text-sm text-gray-900">{getValue('isOngoing', 'isOngoing') ? "Yes" : "No"}</dd>
                </div>
              )}
              {getValue('incidentEndDate', 'incidentEndDate') && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">End Date</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatDate(getValue('incidentEndDate', 'incidentEndDate'))}</dd>
                </div>
              )}
              {getValue('discoveryDate', 'discoveryDate') && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Discovery Date</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatDate(getValue('discoveryDate', 'discoveryDate'))}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>
      )}

      {/* Section 3 - Your Losses */}
      {(getValue('damagesTotal', 'damagesTotal') || caseData.estimatedDamages) && (
        <Card>
          <CardHeader>
            <CardTitle>Your Losses</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Total Damages</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {formatDamageAmount(getValue('damagesTotal', 'damagesTotal') || caseData.estimatedDamages)}
                </dd>
              </div>
              {getValue('damagesEconomic', 'damagesEconomic') && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Economic Damages</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatDamageAmount(getValue('damagesEconomic', 'damagesEconomic'))}</dd>
                </div>
              )}
              {getValue('damagesLostWages', 'damagesLostWages') && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Lost Wages</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatDamageAmount(getValue('damagesLostWages', 'damagesLostWages'))}</dd>
                </div>
              )}
              {getValue('damagesLostBusiness', 'damagesLostBusiness') && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Lost Business</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatDamageAmount(getValue('damagesLostBusiness', 'damagesLostBusiness'))}</dd>
                </div>
              )}
              {getValue('damagesOther', 'damagesOther') && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Other Damages</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatDamageAmount(getValue('damagesOther', 'damagesOther'))}</dd>
                </div>
              )}
              {getValue('damagesNotes', 'damagesNotes') && (
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Additional Notes</dt>
                  <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{getValue('damagesNotes', 'damagesNotes')}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>
      )}

      {/* Section 4 - The Agreement */}
      {getValue('hasWrittenAgreement', 'hasWrittenAgreement') !== null && getValue('hasWrittenAgreement', 'hasWrittenAgreement') !== undefined && (
        <Card>
          <CardHeader>
            <CardTitle>The Agreement</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Written Agreement</dt>
                <dd className="mt-1 text-sm text-gray-900">{getValue('hasWrittenAgreement', 'hasWrittenAgreement') ? "Yes" : "No"}</dd>
              </div>
              {getValue('agreementDate', 'agreementDate') && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Agreement Date</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatDate(getValue('agreementDate', 'agreementDate'))}</dd>
                </div>
              )}
              {getValue('agreementType', 'agreementType') && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Agreement Type</dt>
                  <dd className="mt-1 text-sm text-gray-900">{getValue('agreementType', 'agreementType')}</dd>
                </div>
              )}
              {getValue('hasArbitrationClause', 'hasArbitrationClause') !== null && getValue('hasArbitrationClause', 'hasArbitrationClause') !== undefined && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Arbitration Clause</dt>
                  <dd className="mt-1 text-sm text-gray-900">{getValue('hasArbitrationClause', 'hasArbitrationClause') ? "Yes" : "No"}</dd>
                </div>
              )}
              {getValue('hasVenueClause', 'hasVenueClause') !== null && getValue('hasVenueClause', 'hasVenueClause') !== undefined && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Venue Clause</dt>
                  <dd className="mt-1 text-sm text-gray-900">{getValue('hasVenueClause', 'hasVenueClause') ? "Yes" : "No"}</dd>
                </div>
              )}
              {getValue('hasNonCompete', 'hasNonCompete') !== null && getValue('hasNonCompete', 'hasNonCompete') !== undefined && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Non-Compete Involved</dt>
                  <dd className="mt-1 text-sm text-gray-900">{getValue('hasNonCompete', 'hasNonCompete') ? "Yes" : "No"}</dd>
                </div>
              )}
              {getValue('agreementNotes', 'agreementNotes') && (
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Agreement Notes</dt>
                  <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{getValue('agreementNotes', 'agreementNotes')}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>
      )}

      {/* Section 5 - Evidence Types */}
      {(getValue('evidenceTypes', 'evidenceTypes') || intakeData.evidenceTypes) && (
        <Card>
          <CardHeader>
            <CardTitle>Evidence Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries((getValue('evidenceTypes', 'evidenceTypes') || {}) as Record<string, boolean>).map(([key, value]) => {
                if (!value) return null;
                const label = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
                return (
                  <div key={key} className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span className="text-sm text-gray-900">{label}</span>
                  </div>
                );
              })}
            </div>
            {getValue('hasWitnesses', 'hasWitnesses') !== null && getValue('hasWitnesses', 'hasWitnesses') !== undefined && (
              <div className="mt-4">
                <dt className="text-sm font-medium text-gray-500">Witnesses</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {getValue('hasWitnesses', 'hasWitnesses') ? `Yes (${getValue('witnessCount', 'witnessCount') || "unknown number"})` : "No"}
                </dd>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Section 6 - Prior Legal Action */}
      {(getValue('priorAttorneyContact', 'priorAttorneyContact') !== null || getValue('priorCourtFiling', 'priorCourtFiling') !== null) && (
        <Card>
          <CardHeader>
            <CardTitle>Prior Legal Action</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {getValue('priorAttorneyContact', 'priorAttorneyContact') !== null && getValue('priorAttorneyContact', 'priorAttorneyContact') !== undefined && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Contacted Other Attorneys</dt>
                  <dd className="mt-1 text-sm text-gray-900">{getValue('priorAttorneyContact', 'priorAttorneyContact') ? "Yes" : "No"}</dd>
                </div>
              )}
              {getValue('priorCourtFiling', 'priorCourtFiling') !== null && getValue('priorCourtFiling', 'priorCourtFiling') !== undefined && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Filed in Court</dt>
                  <dd className="mt-1 text-sm text-gray-900">{getValue('priorCourtFiling', 'priorCourtFiling') ? "Yes" : "No"}</dd>
                </div>
              )}
              {getValue('priorLegalNotes', 'priorLegalNotes') && (
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Details</dt>
                  <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{getValue('priorLegalNotes', 'priorLegalNotes')}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>
      )}

      {/* Section 7 - Contact Information */}
      {(getValue('plaintiffName', 'plaintiffName') || getValue('plaintiffState', 'plaintiffState') || getValue('plaintiffPhone', 'plaintiffPhone')) && (
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {getValue('plaintiffName', 'plaintiffName') && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Your Name</dt>
                  <dd className="mt-1 text-sm text-gray-900">{getValue('plaintiffName', 'plaintiffName')}</dd>
                </div>
              )}
              {getValue('plaintiffState', 'plaintiffState') && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Your State</dt>
                  <dd className="mt-1 text-sm text-gray-900">{getValue('plaintiffState', 'plaintiffState')}</dd>
                </div>
              )}
              {getValue('plaintiffPhone', 'plaintiffPhone') && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Phone Number</dt>
                  <dd className="mt-1 text-sm text-gray-900">{getValue('plaintiffPhone', 'plaintiffPhone')}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>
      )}

      {/* Section 8 - Your Situation */}
      {(getValue('hasCurrentAttorney', 'hasCurrentAttorney') !== null || getValue('feePreference', 'feePreference') || getValue('awareOfDeadlines', 'awareOfDeadlines') !== null) && (
        <Card>
          <CardHeader>
            <CardTitle>Your Situation</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {getValue('hasCurrentAttorney', 'hasCurrentAttorney') !== null && getValue('hasCurrentAttorney', 'hasCurrentAttorney') !== undefined && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Current Attorney</dt>
                  <dd className="mt-1 text-sm text-gray-900">{getValue('hasCurrentAttorney', 'hasCurrentAttorney') ? "Yes" : "No"}</dd>
                </div>
              )}
              {getValue('currentAttorneyInfo', 'currentAttorneyInfo') && (
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Attorney Information</dt>
                  <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{getValue('currentAttorneyInfo', 'currentAttorneyInfo')}</dd>
                </div>
              )}
              {getValue('feePreference', 'feePreference') && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Fee Preference</dt>
                  <dd className="mt-1 text-sm text-gray-900 capitalize">{getValue('feePreference', 'feePreference').replace(/_/g, ' ')}</dd>
                </div>
              )}
              {getValue('awareOfDeadlines', 'awareOfDeadlines') !== null && getValue('awareOfDeadlines', 'awareOfDeadlines') !== undefined && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Aware of Deadlines</dt>
                  <dd className="mt-1 text-sm text-gray-900">{getValue('awareOfDeadlines', 'awareOfDeadlines') ? "Yes" : "No"}</dd>
                </div>
              )}
              {getValue('deadlineNotes', 'deadlineNotes') && (
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Deadline Details</dt>
                  <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{getValue('deadlineNotes', 'deadlineNotes')}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>
      )}

      {/* If no intake data available */}
      {!getValue('defendantName', 'defendantName') && !getValue('incidentState', 'incidentState') && !getValue('damagesTotal', 'damagesTotal') && !caseData.estimatedDamages && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-600">No intake form data available</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
