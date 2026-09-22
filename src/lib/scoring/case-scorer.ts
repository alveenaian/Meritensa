import { CaseType, DefendantType, SolRiskLevel } from "@prisma/client";

export interface ScoringInput {
  // Evidence
  documentCount: number;
  hasContracts: boolean;
  hasWrittenCommunications: boolean;
  hasFinancialRecords: boolean;
  hasWitnesses: boolean;

  // Liability
  causesOfAction: Array<{ name: string; strength: number }>;
  clearBreach: boolean;

  // Damages
  estimatedDamages: number;
  damagesDocumented: boolean;
  damagesCalculable: boolean;

  // Defendant
  defendantType: DefendantType | null;
  defendantKnownSolvent: boolean;

  // SOL
  incidentDate: Date | null;
  discoveryDate?: Date | null;
  state: string | null;
  caseType: CaseType;
}

export interface ScoringOutput {
  overallScore: number;
  evidenceScore: number;
  liabilityScore: number;
  damagesScore: number;
  collectability: number;
  solRisk: SolRiskLevel;
  breakdown: Record<string, number>;
}

export function scoreCase(input: ScoringInput): ScoringOutput {
  const evidenceScore = calculateEvidenceScore(input);
  const liabilityScore = calculateLiabilityScore(input);
  const damagesScore = calculateDamagesScore(input);
  const collectability = calculateCollectability(input);
  const solResult = calculateSolRisk(input);

  // Weighted average
  const overallScore =
    evidenceScore * 0.25 +
    liabilityScore * 0.25 +
    damagesScore * 0.2 +
    collectability * 0.15 +
    solResult.score * 0.15;

  return {
    overallScore: Math.round(overallScore),
    evidenceScore: Math.round(evidenceScore),
    liabilityScore: Math.round(liabilityScore),
    damagesScore: Math.round(damagesScore),
    collectability: Math.round(collectability),
    solRisk: solResult.risk,
    breakdown: {
      documentCount: input.documentCount,
      avgClaimStrength: average(input.causesOfAction.map((c) => c.strength)),
      estimatedDamages: input.estimatedDamages,
      daysUntilSol: solResult.daysRemaining,
    },
  };
}

function calculateEvidenceScore(input: ScoringInput): number {
  // Use document-based heuristics only
  let score = 0;

  // Document quantity (max 30 points)
  score += Math.min(input.documentCount * 5, 30);

  // Document types (max 70 points)
  if (input.hasContracts) score += 25;
  if (input.hasWrittenCommunications) score += 20;
  if (input.hasFinancialRecords) score += 15;
  if (input.hasWitnesses) score += 10;

  return Math.min(score, 100);
}

function calculateLiabilityScore(input: ScoringInput): number {
  // Use causes of action based scoring only
  if (input.causesOfAction.length === 0) return 0;

  // Average strength of top 3 claims
  const topClaims = input.causesOfAction
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 3);

  let score = average(topClaims.map((c) => c.strength));

  // Bonus for clear breach
  if (input.clearBreach) score += 10;

  return Math.min(score, 100);
}

function calculateDamagesScore(input: ScoringInput): number {
  let score = 0;

  // Damages amount (max 50 points)
  if (input.estimatedDamages >= 1000000) score += 50;
  else if (input.estimatedDamages >= 500000) score += 40;
  else if (input.estimatedDamages >= 100000) score += 30;
  else if (input.estimatedDamages >= 50000) score += 20;
  else score += 10;

  // Documentation (max 30 points)
  if (input.damagesDocumented) score += 30;

  // Calculability (max 20 points)
  if (input.damagesCalculable) score += 20;

  return Math.min(score, 100);
}

function calculateCollectability(input: ScoringInput): number {
  let score = 50; // Base score

  // Defendant type
  switch (input.defendantType) {
    case "CORPORATION":
      score += 30;
      break;
    case "GOVERNMENT":
      score += 40;
      break;
    case "SMALL_BUSINESS":
      score += 10;
      break;
    case "INDIVIDUAL":
      score -= 10;
      break;
  }

  // Known solvency
  if (input.defendantKnownSolvent) score += 20;

  return Math.min(Math.max(score, 0), 100);
}

function calculateSolRisk(input: ScoringInput): {
  score: number;
  risk: SolRiskLevel;
  daysRemaining: number;
} {
  if (!input.incidentDate || !input.state) {
    return { score: 50, risk: "MEDIUM", daysRemaining: 365 };
  }

  const solYears = getStatuteOfLimitations(input.state, input.caseType);
  // Use discovery date if available (for claims with discovery rule),
  // otherwise use incident date
  const accrualDate = input.discoveryDate || input.incidentDate;
  const deadline = new Date(accrualDate);
  deadline.setFullYear(deadline.getFullYear() + solYears);

  const now = new Date();
  const daysRemaining = Math.floor(
    (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  let score: number;
  let risk: SolRiskLevel;

  if (daysRemaining < 0) {
    score = 0;
    risk = "EXPIRED";
  } else if (daysRemaining < 90) {
    score = 20;
    risk = "CRITICAL";
  } else if (daysRemaining < 180) {
    score = 40;
    risk = "HIGH";
  } else if (daysRemaining < 365) {
    score = 60;
    risk = "MEDIUM";
  } else {
    score = 100;
    risk = "LOW";
  }

  return { score, risk, daysRemaining };
}

function getStatuteOfLimitations(state: string, caseType: CaseType): number {
  // State-specific SOL lookup tables (matches the AI prompt data)
  const stateLookup: Record<string, Partial<Record<CaseType, number>>> = {
    'CA': { BREACH_OF_CONTRACT: 4, FRAUD: 3, EMPLOYMENT: 3, PERSONAL_INJURY: 2, IP_THEFT: 3, PARTNERSHIP_DISPUTE: 4 },
    'California': { BREACH_OF_CONTRACT: 4, FRAUD: 3, EMPLOYMENT: 3, PERSONAL_INJURY: 2, IP_THEFT: 3, PARTNERSHIP_DISPUTE: 4 },
    'NY': { BREACH_OF_CONTRACT: 6, FRAUD: 6, EMPLOYMENT: 3, PERSONAL_INJURY: 3, IP_THEFT: 3, PARTNERSHIP_DISPUTE: 6 },
    'New York': { BREACH_OF_CONTRACT: 6, FRAUD: 6, EMPLOYMENT: 3, PERSONAL_INJURY: 3, IP_THEFT: 3, PARTNERSHIP_DISPUTE: 6 },
    'TX': { BREACH_OF_CONTRACT: 4, FRAUD: 4, EMPLOYMENT: 2, PERSONAL_INJURY: 2, IP_THEFT: 3, PARTNERSHIP_DISPUTE: 4 },
    'Texas': { BREACH_OF_CONTRACT: 4, FRAUD: 4, EMPLOYMENT: 2, PERSONAL_INJURY: 2, IP_THEFT: 3, PARTNERSHIP_DISPUTE: 4 },
    'FL': { BREACH_OF_CONTRACT: 5, FRAUD: 4, EMPLOYMENT: 1, PERSONAL_INJURY: 4, IP_THEFT: 3, PARTNERSHIP_DISPUTE: 5 },
    'Florida': { BREACH_OF_CONTRACT: 5, FRAUD: 4, EMPLOYMENT: 1, PERSONAL_INJURY: 4, IP_THEFT: 3, PARTNERSHIP_DISPUTE: 5 },
    'IL': { BREACH_OF_CONTRACT: 10, FRAUD: 5, EMPLOYMENT: 2, PERSONAL_INJURY: 2, IP_THEFT: 5, PARTNERSHIP_DISPUTE: 10 },
    'Illinois': { BREACH_OF_CONTRACT: 10, FRAUD: 5, EMPLOYMENT: 2, PERSONAL_INJURY: 2, IP_THEFT: 5, PARTNERSHIP_DISPUTE: 10 },
    'PA': { BREACH_OF_CONTRACT: 4, FRAUD: 2, EMPLOYMENT: 2, PERSONAL_INJURY: 2, IP_THEFT: 3, PARTNERSHIP_DISPUTE: 4 },
    'Pennsylvania': { BREACH_OF_CONTRACT: 4, FRAUD: 2, EMPLOYMENT: 2, PERSONAL_INJURY: 2, IP_THEFT: 3, PARTNERSHIP_DISPUTE: 4 },
    'OH': { BREACH_OF_CONTRACT: 8, FRAUD: 4, EMPLOYMENT: 2, PERSONAL_INJURY: 2, IP_THEFT: 3, PARTNERSHIP_DISPUTE: 8 },
    'Ohio': { BREACH_OF_CONTRACT: 8, FRAUD: 4, EMPLOYMENT: 2, PERSONAL_INJURY: 2, IP_THEFT: 3, PARTNERSHIP_DISPUTE: 8 },
    'GA': { BREACH_OF_CONTRACT: 6, FRAUD: 4, EMPLOYMENT: 2, PERSONAL_INJURY: 2, IP_THEFT: 3, PARTNERSHIP_DISPUTE: 6 },
    'Georgia': { BREACH_OF_CONTRACT: 6, FRAUD: 4, EMPLOYMENT: 2, PERSONAL_INJURY: 2, IP_THEFT: 3, PARTNERSHIP_DISPUTE: 6 },
    'NC': { BREACH_OF_CONTRACT: 3, FRAUD: 3, EMPLOYMENT: 2, PERSONAL_INJURY: 3, IP_THEFT: 3, PARTNERSHIP_DISPUTE: 3 },
    'North Carolina': { BREACH_OF_CONTRACT: 3, FRAUD: 3, EMPLOYMENT: 2, PERSONAL_INJURY: 3, IP_THEFT: 3, PARTNERSHIP_DISPUTE: 3 },
    'NJ': { BREACH_OF_CONTRACT: 6, FRAUD: 6, EMPLOYMENT: 2, PERSONAL_INJURY: 2, IP_THEFT: 3, PARTNERSHIP_DISPUTE: 6 },
    'New Jersey': { BREACH_OF_CONTRACT: 6, FRAUD: 6, EMPLOYMENT: 2, PERSONAL_INJURY: 2, IP_THEFT: 3, PARTNERSHIP_DISPUTE: 6 },
  };

  const defaults: Record<CaseType, number> = {
    BREACH_OF_CONTRACT: 4,
    FRAUD: 3,
    EMPLOYMENT: 2,
    PERSONAL_INJURY: 2,
    IP_THEFT: 3,
    PARTNERSHIP_DISPUTE: 4,
    OTHER: 3,
  };

  // Try state-specific lookup first
  const stateData = stateLookup[state];
  if (stateData && stateData[caseType] !== undefined) {
    return stateData[caseType]!;
  }

  return defaults[caseType] || 3;
}

function average(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}
