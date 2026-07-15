#!/usr/bin/env node

const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  DEFAULT_FORMAT,
  DEFAULT_MODEL,
  DEFAULT_VOICE,
  synthesizeSpeech,
} = require('./lib/openai-audio');

async function main() {
  const outputDir = path.join(
    path.resolve(__dirname, '..'),
    'output',
    'openai-tts-validation'
  );
  fs.mkdirSync(outputDir, { recursive: true });

  const outputPath = path.join(outputDir, `validation.${DEFAULT_FORMAT}`);
  const input =
    process.env.VV_OPENAI_TTS_VALIDATE_TEXT ||
    'Vehicle-Vitals OpenAI speech validation succeeded.';

  const result = await synthesizeSpeech({
    apiKey: process.env.OPENAI_API_KEY,
    input,
    outputPath,
    model: process.env.VV_OPENAI_TTS_MODEL || DEFAULT_MODEL,
    voice: process.env.VV_OPENAI_TTS_VOICE || DEFAULT_VOICE,
  });

  const size = fs.statSync(outputPath).size;
  if (size <= 0) {
    throw new Error('Validation audio file was empty.');
  }

  console.log(
    `[openai-tts] Validation OK: ${outputPath} (${size} bytes, cacheHit=${result.cacheHit})`
  );
}

main().catch(error => {
  console.error('[openai-tts] Validation failed:', error.message);
  process.exitCode = 1;
});
