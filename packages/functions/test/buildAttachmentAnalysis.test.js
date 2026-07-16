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

test('reports higher confidence when Gemini and the heuristic path agree on cost than when they disagree', () => {
  // Regression: confidence previously measured only how many fields got
  // populated, not whether they're correct — a document could get the
  // wrong cost and still score maximum confidence as long as SOME number
  // landed in the totalCost slot. Independent agreement between the AI and
  // regex extraction paths is real evidence of correctness; disagreement
  // is real evidence one of them is wrong.
  const metadata = { ocrText: 'Total: $89.99' };

  const agree = buildAttachmentAnalysis(
    'vehicles/VIN1/records/service/receipt.pdf',
    'application/pdf',
    metadata,
    { documentCategory: 'invoice', totalCost: 89.99 }
  );
  const disagree = buildAttachmentAnalysis(
    'vehicles/VIN1/records/service/receipt.pdf',
    'application/pdf',
    metadata,
    { documentCategory: 'invoice', totalCost: 500 }
  );

  assert.ok(
    agree.confidence > disagree.confidence,
    `expected agreement confidence (${agree.confidence}) to exceed disagreement confidence (${disagree.confidence})`
  );
  assert.ok(agree.confidence <= 0.95);
  assert.ok(disagree.confidence >= 0.05);
});
