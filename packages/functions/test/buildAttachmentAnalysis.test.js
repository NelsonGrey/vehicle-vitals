const test = require('node:test');
const assert = require('node:assert/strict');

const { buildAttachmentAnalysis } = require('../lib/index.js');

test('rejects an implausible Gemini-extracted totalCost instead of trusting it blindly', () => {
  // Regression: Gemini's totalCost was stored with zero validation — no
  // positivity check, no upper bound — unlike the heuristic fallback path,
  // which already guarded against non-positive values. A misread or
  // hallucinated total (e.g. a vehicle purchase price on the same page as
  // a small service charge) would flow straight into every downstream
  // spend calculation with no server-side guardrail.
  const { extracted } = buildAttachmentAnalysis(
    'vehicles/VIN1/records/service/receipt.pdf',
    'application/pdf',
    undefined,
    { documentCategory: 'invoice', totalCost: 145000 }
  );

  assert.notEqual(extracted.totalCost, 145000);
});

test('falls back to a validated heuristic cost when the Gemini value is implausible', () => {
  const { extracted } = buildAttachmentAnalysis(
    'vehicles/VIN1/records/service/receipt.pdf',
    'application/pdf',
    { ocrText: 'Total: $89.99' },
    { documentCategory: 'invoice', totalCost: 145000 }
  );

  assert.equal(extracted.totalCost, 89.99);
});

test('accepts a plausible Gemini-extracted totalCost', () => {
  const { extracted } = buildAttachmentAnalysis(
    'vehicles/VIN1/records/service/receipt.pdf',
    'application/pdf',
    undefined,
    { documentCategory: 'invoice', totalCost: 450.5 }
  );

  assert.equal(extracted.totalCost, 450.5);
});

test('rejects a negative Gemini-extracted totalCost', () => {
  const { extracted } = buildAttachmentAnalysis(
    'vehicles/VIN1/records/service/receipt.pdf',
    'application/pdf',
    undefined,
    { documentCategory: 'invoice', totalCost: -50 }
  );

  assert.equal(extracted.totalCost, undefined);
});
