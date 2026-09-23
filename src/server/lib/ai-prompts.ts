interface DocumentAnalysisPromptParams {
  caseType: string;
  filename: string;
}

export function generateDocumentAnalysisPrompt({
  caseType,
  filename,
}: DocumentAnalysisPromptParams): string {
  return `You are analyzing a document for a ${caseType} case.

<filename>${filename}</filename>

Score the document's relevance using this rubric:
- 0–29: Not relevant to the case
- 30–69: Somewhat relevant, may need follow-up review
- 70–100: Highly relevant, directly supports the case`;
}