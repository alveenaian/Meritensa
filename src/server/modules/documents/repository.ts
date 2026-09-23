export interface DocumentAnalysisResult {
  aiSummary: string;
  relevanceScore: number | null;
}

export async function saveDocumentAnalysis(
  documentId: string,
  caseId: string,
  result: DocumentAnalysisResult
): Promise<void> {
  // Database persistence stub
  return;
}
