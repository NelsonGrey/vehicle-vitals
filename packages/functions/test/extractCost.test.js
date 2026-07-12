const test = require('node:test');
const assert = require('node:assert/strict');

const { extractCost } = require('../lib/index.js');

test('extractCost prefers the grand total over a subtotal that appears first', () => {
  // Regression: the previous regex matched the FIRST "total"-adjacent
  // number, which meant "Subtotal: $450.00 Tax: $36.00 Total: $486.00"
  // returned the pre-tax subtotal (450.00) because "total" is a substring
  // of "subtotal" — undercounting the actual amount paid.
  const text = 'Subtotal: $450.00 Tax: $36.00 Total: $486.00';
  assert.equal(extractCost(text), 486.0);
});

test('extractCost handles thousands separators without truncating the amount', () => {
  // Regression: a comma was previously treated as a decimal separator, so
  // "$1,234.56" was read as "234.56" — an order-of-magnitude loss on any
  // large repair bill.
  assert.equal(extractCost('Total: $1,234.56'), 1234.56);
});

test('extractCost falls back to the largest bare dollar amount when no total label matches', () => {
  const text =
    'Oil filter $12.99, Labor $45.00, You saved $5 with loyalty card';
  assert.equal(extractCost(text), 45.0);
});

test('extractCost returns undefined for text with no dollar amount', () => {
  assert.equal(extractCost('No pricing information on this page'), undefined);
});

test('extractCost ignores non-positive or malformed amounts', () => {
  assert.equal(extractCost('Total: $0.00'), undefined);
});
