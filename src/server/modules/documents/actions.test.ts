import { describe, it, expect, vi } from 'vitest';
import { analyzeOneDocument } from '@/server/modules/documents/actions';
describe('analyzeOneDocument idempotency', () => {
  it('returns early if document is already analyzed', async () => {
    const doc = {
      id: 'doc_1',
      caseId: 'case_1',
      mimeType: 'application/pdf',
      filename: 'test.pdf',
      size: 100,
      analyzedAt: new Date()
    };
    
    await expect(analyzeOneDocument(doc as any, 'litigation' as any)).resolves.toBeUndefined();
  });
});