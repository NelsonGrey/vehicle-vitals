import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, expect, it } from 'vitest';
import { CAPABILITIES } from '../capabilities';

// Cross-language contract check: packages/mobile/lib/data/capabilities.dart
// mirrors this file's CAPABILITIES export by hand (no codegen). This test
// reads the Dart source as plain text and regex-parses each `Capability(...)`
// literal's id/fullLabel, so both platforms are proven to agree without a
// Dart-parsing dependency in the web toolchain.

interface ParsedMobileCapability {
  id: string;
  fullLabel: string;
}

function parseMobileCapabilities(dartSource: string): ParsedMobileCapability[] {
  // Matches only actual `Capability(` instantiations (id: '...' as the
  // first field), not the `const Capability({ required this.id, ... })`
  // constructor declaration, which also contains the substring "Capability(".
  const blocks = dartSource.split('Capability(').slice(1);
  return blocks
    .map(block => {
      const idMatch = block.match(/id:\s*'([^']*)'/);
      const labelMatch = block.match(/fullLabel:\s*'([^']*)'/);
      return {
        id: idMatch?.[1] ?? '',
        fullLabel: labelMatch?.[1] ?? '',
      };
    })
    .filter(capability => capability.id !== '');
}

describe('capability contract (web <-> mobile)', () => {
  const dartPath = resolve(
    __dirname,
    '../../../../mobile/lib/data/capabilities.dart'
  );
  const dartSource = readFileSync(dartPath, 'utf8');
  const mobileCapabilities = parseMobileCapabilities(dartSource);

  it('defines the same number of capabilities on both platforms', () => {
    expect(mobileCapabilities).toHaveLength(CAPABILITIES.length);
  });

  it('has matching ids and full labels, in the same order', () => {
    CAPABILITIES.forEach((webCapability, index) => {
      const mobileCapability = mobileCapabilities[index];
      expect(mobileCapability, `capability at index ${index}`).toBeDefined();
      expect(mobileCapability.id).toBe(webCapability.id);
      expect(mobileCapability.fullLabel).toBe(webCapability.fullLabel);
    });
  });

  it('every capability id is unique', () => {
    const ids = CAPABILITIES.map(capability => capability.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
