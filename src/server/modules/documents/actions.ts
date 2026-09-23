import { readUploadedFile } from '../../lib/document-storage';
import { generateDocumentAnalysis } from '../../lib/ai-response';
import { runWithConcurrency } from '../../lib/run-with-concurrency';
import { saveDocumentAnalysis } from './repository';


export interface DocumentRecord {
  id: string;
  caseId: string;
  mimeType: string;
  filename: string;
  size: number;
  storagePath: string;
  analyzedAt: Date | null;
}

// The API's 32MB limit covers the whole request, and base64 encoding makes a
// file about 33% bigger, so a 32MB PDF would be rejected. 20MB leaves room.
const MAX_PDF_SIZE_BYTES = 20 * 1024 * 1024;

// How many documents are analyzed at the same time in a batch (3 to 5 is safe).
const BATCH_CONCURRENCY = 4;

export async function analyzeOneDocument(
  doc: DocumentRecord,
  caseType: string
): Promise<void> {
  // Idempotency check: skip documents that have already been analyzed
  if (doc.analyzedAt) {
    return;
  }

  // Check size limits on large PDFs
  if (doc.mimeType === 'application/pdf' && doc.size > MAX_PDF_SIZE_BYTES) {
    await saveDocumentAnalysis(doc.id, doc.caseId, {
      aiSummary: 'File size exceeds maximum threshold for full analysis.',
      relevanceScore: null,
    });
    return;
  }

  // Read file and generate AI response analysis
  const fileBuffer = await readUploadedFile(doc.storagePath);
  const analysis = await generateDocumentAnalysis({
    caseType,
    filename: doc.filename,
    mimeType: doc.mimeType,
    content: fileBuffer,
  });

  // Persist results
  await saveDocumentAnalysis(doc.id, doc.caseId, {
    aiSummary: analysis.summary,
    relevanceScore: analysis.relevance,
  });
}

export interface BatchResult {
  docId: string;
  ok: boolean;
  error?: unknown;
}

// Analyzes a whole batch: the first document alone (so the case instructions
// get cached), then the rest a few at a time. One failed document does not
// stop the others; check the returned list for failures.
export async function analyzeBatch(
  docs: DocumentRecord[],
  caseType: string,
  concurrency: number = BATCH_CONCURRENCY
): Promise<BatchResult[]> {
  const pending = docs.filter((doc) => !doc.analyzedAt);
  if (pending.length === 0) return [];

  const [first, ...rest] = pending;
  await analyzeBatch({ caseId, documents });

  const firstResults = await runWithConcurrency([first], 1, analyze);
  const restResults = await runWithConcurrency(rest, concurrency, analyze);

  return [...firstResults, ...restResults].map((result, i) => ({
    docId: pending[i].id,
    ok: result.status === 'fulfilled',
    error: result.status === 'rejected' ? result.reason : undefined,
  }));
}
