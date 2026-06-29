const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');

const ROOT = path.resolve(__dirname, '..', '..');

function loadLocalEnvFile(fileName) {
  const envPath = path.join(ROOT, fileName);
  if (!fs.existsSync(envPath)) {
    return false;
  }

  if (typeof process.loadEnvFile === 'function') {
    process.loadEnvFile(envPath);
    return true;
  }

  return false;
}

loadLocalEnvFile('.env.local');
if (!process.env.OPENAI_API_KEY) {
  loadLocalEnvFile('.env');
}

const DEFAULT_MODEL = process.env.VV_OPENAI_TTS_MODEL || 'gpt-4o-mini-tts';
const DEFAULT_VOICE = process.env.VV_OPENAI_TTS_VOICE || 'alloy';
const DEFAULT_FORMAT = process.env.VV_OPENAI_TTS_FORMAT || 'mp3';
const DEFAULT_TIMEOUT_MS = Number.parseInt(
  process.env.VV_OPENAI_TTS_TIMEOUT_MS || '45000',
  10
);
const DEFAULT_MAX_RETRIES = Number.parseInt(
  process.env.VV_OPENAI_TTS_MAX_RETRIES || '3',
  10
);
const DEFAULT_CACHE_DIR = path.join(ROOT, 'output', 'openai-tts-cache');
const VALID_FORMATS = new Set(['mp3', 'opus', 'aac', 'flac', 'wav', 'pcm']);
const VALID_VOICES = new Set([
  'alloy',
  'ash',
  'ballad',
  'coral',
  'echo',
  'fable',
  'onyx',
  'nova',
  'sage',
  'shimmer',
  'verse',
  'marin',
  'cedar',
]);
const MAX_INPUT_CHARS = 4096;

function validateSynthesisOptions(options) {
  const errors = [];
  const {
    apiKey,
    input,
    outputPath,
    model = DEFAULT_MODEL,
    voice = DEFAULT_VOICE,
    format = DEFAULT_FORMAT,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    maxRetries = DEFAULT_MAX_RETRIES,
  } = options;

  if (!apiKey) {
    errors.push('OPENAI_API_KEY is required when VV_TTS_PROVIDER=openai.');
  }

  if (!input || !input.trim()) {
    errors.push('Narration text must be non-empty.');
  }

  if (input && input.length > MAX_INPUT_CHARS) {
    errors.push(
      `Narration text exceeds the ${MAX_INPUT_CHARS}-character Speech API limit.`
    );
  }

  if (!outputPath) {
    errors.push('An output path is required for synthesized audio.');
  }

  if (voice && !VALID_VOICES.has(voice)) {
    errors.push(
      `Unsupported OpenAI TTS voice "${voice}". Use one of: ${[...VALID_VOICES].join(', ')}.`
    );
  }

  if (format && !VALID_FORMATS.has(format)) {
    errors.push(
      `Unsupported OpenAI TTS format "${format}". Use one of: ${[...VALID_FORMATS].join(', ')}.`
    );
  }

  if (!model || typeof model !== 'string') {
    errors.push('A valid OpenAI TTS model name is required.');
  }

  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    errors.push('VV_OPENAI_TTS_TIMEOUT_MS must be a positive integer.');
  }

  if (!Number.isInteger(maxRetries) || maxRetries < 0) {
    errors.push('VV_OPENAI_TTS_MAX_RETRIES must be a non-negative integer.');
  }

  if (errors.length) {
    const error = new Error(errors.join(' '));
    error.name = 'OpenAITTSConfigurationError';
    throw error;
  }
}

function buildCacheKey({
  model = DEFAULT_MODEL,
  voice = DEFAULT_VOICE,
  format = DEFAULT_FORMAT,
  input,
  instructions = '',
}) {
  return crypto
    .createHash('sha256')
    .update(
      JSON.stringify({
        model,
        voice,
        format,
        input,
        instructions,
      })
    )
    .digest('hex');
}

function cachePaths(cacheDir, cacheKey, format) {
  return {
    audioPath: path.join(cacheDir, `${cacheKey}.${format}`),
    metaPath: path.join(cacheDir, `${cacheKey}.json`),
  };
}

function ensureWritableDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
  fs.accessSync(dirPath, fs.constants.W_OK);
}

function formatOpenAIError(error) {
  const status = error?.status;
  const type = error?.name || 'Error';
  const details = error?.error?.message || error?.message || 'Unknown error.';

  if (status === 401) {
    return `OpenAI authentication failed. Check OPENAI_API_KEY. ${details}`;
  }

  if (status === 429) {
    return `OpenAI rate limit or quota error. Retry later or reduce generation volume. ${details}`;
  }

  if (status >= 500) {
    return `OpenAI server error (${status}). Retry the request. ${details}`;
  }

  if (type === 'APIConnectionTimeoutError' || type === 'APITimeoutError') {
    return `OpenAI request timed out after waiting for speech generation. ${details}`;
  }

  if (type === 'APIConnectionError') {
    return `OpenAI connection failed. Check network, proxy, firewall, or local SSL trust settings. ${details}`;
  }

  if (status === 400) {
    return `OpenAI rejected the TTS request. Check narration length, model, voice, and parameters. ${details}`;
  }

  return `OpenAI TTS request failed. ${details}`;
}

function createClient({ apiKey, timeoutMs = DEFAULT_TIMEOUT_MS, maxRetries = DEFAULT_MAX_RETRIES }) {
  return new OpenAI({
    apiKey,
    timeout: timeoutMs,
    maxRetries,
  });
}

async function synthesizeSpeech(options) {
  const {
    apiKey,
    input,
    outputPath,
    model = DEFAULT_MODEL,
    voice = DEFAULT_VOICE,
    format = DEFAULT_FORMAT,
    instructions = process.env.VV_OPENAI_TTS_INSTRUCTIONS || '',
    timeoutMs = DEFAULT_TIMEOUT_MS,
    maxRetries = DEFAULT_MAX_RETRIES,
    cacheDir = DEFAULT_CACHE_DIR,
    skipCache = process.env.VV_OPENAI_TTS_DISABLE_CACHE === '1',
    logger = console,
  } = options;

  validateSynthesisOptions({
    apiKey,
    input,
    outputPath,
    model,
    voice,
    format,
    timeoutMs,
    maxRetries,
  });

  ensureWritableDir(path.dirname(outputPath));
  ensureWritableDir(cacheDir);

  const cacheKey = buildCacheKey({ model, voice, format, input, instructions });
  const { audioPath: cachedAudioPath, metaPath } = cachePaths(
    cacheDir,
    cacheKey,
    format
  );

  if (!skipCache && fs.existsSync(cachedAudioPath)) {
    fs.copyFileSync(cachedAudioPath, outputPath);
    logger.log(
      `[openai-tts] Cache hit for ${path.basename(outputPath)} (${model}, ${voice})`
    );
    return {
      outputPath,
      cacheHit: true,
      cacheKey,
      model,
      voice,
      format,
      requestId: null,
    };
  }

  const client = createClient({ apiKey, timeoutMs, maxRetries });
  const request = {
    model,
    voice,
    input,
    format,
  };
  if (instructions.trim()) {
    request.instructions = instructions.trim();
  }

  try {
    const response = await client.audio.speech.create(request);
    const requestId = response.headers?.get?.('x-request-id') || null;
    const buffer = Buffer.from(await response.arrayBuffer());

    if (!buffer.length) {
      throw new Error('OpenAI returned an empty audio response.');
    }

    fs.writeFileSync(cachedAudioPath, buffer);
    fs.writeFileSync(
      metaPath,
      JSON.stringify(
        {
          cacheKey,
          model,
          voice,
          format,
          instructions: instructions.trim(),
          inputLength: input.length,
          requestId,
          cachedAt: new Date().toISOString(),
        },
        null,
        2
      )
    );
    fs.copyFileSync(cachedAudioPath, outputPath);

    logger.log(
      `[openai-tts] Wrote ${path.basename(outputPath)} with model=${model}, voice=${voice}${requestId ? `, request_id=${requestId}` : ''}`
    );

    return {
      outputPath,
      cacheHit: false,
      cacheKey,
      model,
      voice,
      format,
      requestId,
    };
  } catch (error) {
    const formatted = formatOpenAIError(error);
    const wrapped = new Error(formatted);
    wrapped.cause = error;
    wrapped.name = error?.name || 'OpenAITTSError';
    wrapped.status = error?.status;
    throw wrapped;
  }
}

module.exports = {
  DEFAULT_CACHE_DIR,
  DEFAULT_FORMAT,
  DEFAULT_MAX_RETRIES,
  DEFAULT_MODEL,
  DEFAULT_TIMEOUT_MS,
  DEFAULT_VOICE,
  MAX_INPUT_CHARS,
  VALID_FORMATS,
  VALID_VOICES,
  buildCacheKey,
  createClient,
  formatOpenAIError,
  synthesizeSpeech,
  validateSynthesisOptions,
};
