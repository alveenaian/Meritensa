import { describe, it, expect } from 'vitest';
import { generateDocumentAnalysisPrompt } from './ai-prompts';

describe('generateDocumentAnalysisPrompt', () => {
  it('wraps filename in XML tags and formats rubric correctly', () => {
    const prompt = generateDocumentAnalysisPrompt({ caseType: 'litigation', filename: 'contract.pdf' });
    expect(prompt).toContain('<filename>contract.pdf</filename>');
    expect(prompt).toContain('0–29');
    expect(prompt).toContain('30–69');
    expect(prompt).toContain('70–100');
  });
});