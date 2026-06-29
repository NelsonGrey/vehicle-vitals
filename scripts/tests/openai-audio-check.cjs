const test = require('node:test');
const assert = require('node:assert/strict');

const {
  buildCacheKey,
  formatOpenAIError,
  validateSynthesisOptions,
} = require('../lib/openai-audio');

test('buildCacheKey is stable for identical inputs', () => {
  const first = buildCacheKey({
    model: 'gpt-4o-mini-tts',
    voice: 'alloy',
    format: 'mp3',
    input: 'hello world',
    instructions: 'steady narration',
  });
  const second = buildCacheKey({
    model: 'gpt-4o-mini-tts',
    voice: 'alloy',
    format: 'mp3',
    input: 'hello world',
    instructions: 'steady narration',
  });

  assert.equal(first, second);
});

test('buildCacheKey changes when synthesis inputs change', () => {
  const first = buildCacheKey({
    model: 'gpt-4o-mini-tts',
    voice: 'alloy',
    format: 'mp3',
    input: 'hello world',
  });
  const second = buildCacheKey({
    model: 'gpt-4o-mini-tts',
    voice: 'nova',
    format: 'mp3',
    input: 'hello world',
  });

  assert.notEqual(first, second);
});

test('validateSynthesisOptions rejects invalid voice and missing key', () => {
  assert.throws(
    () =>
      validateSynthesisOptions({
        apiKey: '',
        input: 'hello world',
        outputPath: '/tmp/out.mp3',
        voice: 'bad-voice',
      }),
    /OPENAI_API_KEY is required|Unsupported OpenAI TTS voice/
  );
});

test('formatOpenAIError maps common API failures', () => {
  assert.match(
    formatOpenAIError({ status: 401, message: 'bad key' }),
    /authentication failed/i
  );
  assert.match(
    formatOpenAIError({ status: 429, message: 'slow down' }),
    /rate limit|quota/i
  );
  assert.match(
    formatOpenAIError({
      name: 'APIConnectionError',
      message: 'certificate verify failed',
    }),
    /network|ssl trust/i
  );
});
