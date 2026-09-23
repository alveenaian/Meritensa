import { analyzeBatch } from '@/server/modules/documents/actions';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { analyzeOneDocument, DocumentRecord } from './actions';
import { readUploadedFile } from '../../../lib/document-storage';
import { generateDocumentAnalysis } from '../../lib/ai-response';
import { saveDocumentAnalysis } from './repository';

// Mocks match the relative import paths used in actions.ts
vi.mock('../../../lib/document-storage', () => ({
  readUploadedFile: vi.fn().mockResolvedValue(Buffer.from('mock file content')),
  deleteUploadedFile: vi.fn(),
}));

vi.mock('../../lib/ai-response', () => ({
  generateDocumentAnalysis: vi.fn().mockResolvedValue({
    summary: 'Mock analysis summary',
    relevance: 90,
  }),
  AiResponseError: class AiResponseError extends Error {
    userMessage: string;
    constructor(message: string, userMessage: string) {
      super(message);
      this.userMessage = userMessage;
    }
  },
}));

vi.mock('./repository', () => ({
  saveDocumentAnalysis: vi.fn().mockResolvedValue(undefined),
}));

describe('analyzeOneDocument', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns early if document is already analyzed', async () => {
    const doc: DocumentRecord = {
      id: 'doc_1',
      caseId: 'case_1',
      mimeType: 'application/pdf',
      filename: 'test.pdf',
      size: 100,
      storagePath: 'path/to/file.pdf',
      analyzedAt: new Date(),
    };

    await analyzeOneDocument(doc, 'litigation');

    expect(readUploadedFile).not.toHaveBeenCalled();
    expect(generateDocumentAnalysis).not.toHaveBeenCalled();
    expect(saveDocumentAnalysis).not.toHaveBeenCalled();
  });

  it('stubs analysis if PDF exceeds maximum size', async () => {
    const doc: DocumentRecord = {
      id: 'doc_2',
      caseId: 'case_1',
      mimeType: 'application/pdf',
      filename: 'large.pdf',
      size: 35 * 1024 * 1024,
      storagePath: 'path/to/large.pdf',
      analyzedAt: null,
    };

    await analyzeOneDocument(doc, 'litigation');

    expect(saveDocumentAnalysis).toHaveBeenCalledWith(
      'doc_2',
      'case_1',
      expect.objectContaining({ relevanceScore: null })
    );
    expect(readUploadedFile).not.toHaveBeenCalled();
  });

  it('processes valid PDF documents successfully', async () => {
    const doc: DocumentRecord = {
      id: 'doc_3',
      caseId: 'case_1',
      mimeType: 'application/pdf',
      filename: 'contract.pdf',
      size: 1024,
      storagePath: 'path/to/contract.pdf',
      analyzedAt: null,
    };

    await analyzeOneDocument(doc, 'litigation');

    expect(readUploadedFile).toHaveBeenCalledWith('path/to/contract.pdf');
    expect(generateDocumentAnalysis).toHaveBeenCalled();
    expect(saveDocumentAnalysis).toHaveBeenCalledWith(
      'doc_3',
      'case_1',
      { aiSummary: 'Mock analysis summary', relevanceScore: 90 }
    );
  });
});
