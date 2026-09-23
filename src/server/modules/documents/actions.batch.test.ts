import { describe, it, expect, vi, beforeEach } from 'vitest';
import { analyzeBatch, DocumentRecord } from './actions';
import { generateDocumentAnalysis } from '../../lib/ai-response';

vi.mock('../../lib/document-storage', () => ({
  readUploadedFile: vi.fn().mockResolvedValue(Buffer.from('x')),
  deleteUploadedFile: vi.fn(),
}));
vi.mock('../../lib/ai-response', () => ({ generateDocumentAnalysis: vi.fn() }));
vi.mock('./repository', () => ({ saveDocumentAnalysis: vi.fn().mockResolvedValue(undefined) }));

const makeDoc = (n: number, analyzedAt: Date | null = null): DocumentRecord => ({
  id: `doc_${n}`, caseId: 'case_1', mimeType: 'text/plain', filename: `note_${n}.txt`,
  size: 10, storagePath: `path/${n}`, analyzedAt,
});

describe('analyzeBatch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('runs the first document alone, then the rest with a concurrency cap', async () => {
    let running = 0;
    let maxRunning = 0;
    const runningAtStart: number[] = [];
    vi.mocked(generateDocumentAnalysis).mockImplementation(async () => {
      running++;
      runningAtStart.push(running);
      maxRunning = Math.max(maxRunning, running);
      await new Promise((resolve) => setTimeout(resolve, 10));
      running--;
      return { summary: 's', relevance: 1 };
    });

    const results = await analyzeBatch([0, 1, 2, 3, 4, 5, 6, 7].map((n) => makeDoc(n)), 'litigation', 3);

    expect(results).toHaveLength(8);
    expect(results.every((r) => r.ok)).toBe(true);
    expect(runningAtStart.slice(0, 2)).toEqual([1, 1]); // 2nd started only after 1st finished
    expect(maxRunning).toBe(3);
  });

  it('skips already analyzed documents and keeps going after a failure', async () => {
    vi.mocked(generateDocumentAnalysis)
      .mockResolvedValueOnce({ summary: 's', relevance: 1 })
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce({ summary: 's', relevance: 1 });

    const results = await analyzeBatch([makeDoc(0), makeDoc(1, new Date()), makeDoc(2), makeDoc(3)], 'litigation');

    expect(results.map((r) => [r.docId, r.ok])).toEqual([
      ['doc_0', true],
      ['doc_2', false],
      ['doc_3', true],
    ]);
  });
});
