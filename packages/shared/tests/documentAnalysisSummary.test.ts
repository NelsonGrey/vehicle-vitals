import { describe, expect, it } from 'vitest';
import {
  buildDocumentSummary,
  getSourceSnippet,
} from '../src/documentAnalysisSummary.js';

describe('getSourceSnippet', () => {
  it('returns empty string for missing source text', () => {
    expect(getSourceSnippet(undefined)).toBe('');
  });

  it('collapses whitespace and truncates beyond maxLength', () => {
    const text = 'a'.repeat(300);
    const snippet = getSourceSnippet(text, 240);
    expect(snippet).toHaveLength(243);
    expect(snippet.endsWith('...')).toBe(true);
  });
});

describe('buildDocumentSummary', () => {
  it('falls back to a source snippet when no extraction is available', () => {
    expect(buildDocumentSummary(undefined, 'Some raw OCR text')).toBe(
      'Some raw OCR text'
    );
    expect(buildDocumentSummary(undefined, undefined)).toBe(
      'No analysis summary available yet'
    );
  });

  it('formats category and key extracted fields', () => {
    const summary = buildDocumentSummary({
      documentCategory: 'service_invoice',
      serviceType: 'Oil change',
      totalCost: 89.99,
      serviceDate: '2026-01-15',
      mileage: 55000,
    });
    expect(summary).toBe(
      'Service Invoice: Oil change • $89.99 • 2026-01-15 • 55,000 mi'
    );
  });

  it('falls back to a source snippet when no key fields were extracted', () => {
    const summary = buildDocumentSummary(
      { documentCategory: 'document' },
      'Renewal completed for annual registration.'
    );
    expect(summary).toBe(
      'Document: Renewal completed for annual registration.'
    );
  });
});
