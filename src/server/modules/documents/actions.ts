interface DocumentRecord {
  id: string;
  caseId: string;
  mimeType: string;
  filename: string;
  size: number;
  analyzedAt: Date | null;
}

export async function analyzeOneDocument(
  doc: DocumentRecord,
  caseType: string
): Promise<void> {
  // Idempotency check: skip documents that have already been analyzed
  if (doc.analyzedAt) {
    return;
  }

  // TODO: wire up the real analysis pipeline here —
  // e.g. call generateDocumentAnalysisPrompt({ caseType, filename: doc.filename }),
  // send it to your AI client, then persist the result via your repository layer.
}