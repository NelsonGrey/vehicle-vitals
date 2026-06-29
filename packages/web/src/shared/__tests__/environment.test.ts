import { describe, expect, it } from 'vitest';
import {
  inferEnvironmentFromHostname,
  inferEnvironmentFromProjectId,
  resolveAppEnvironment,
} from '../environment';

describe('environment helpers', () => {
  it('prefers an explicit environment override', () => {
    expect(
      resolveAppEnvironment({
        explicitEnvironment: 'staging',
        projectId: 'vehicle-vitals-dev',
        hostname: 'vehicle-vitals--vehicle-vitals-dev.us-central1.hosted.app',
        mode: 'production',
      })
    ).toBe('staging');
  });

  it('infers development from the App Hosting dev hostname', () => {
    expect(
      resolveAppEnvironment({
        hostname: 'vehicle-vitals--vehicle-vitals-dev.us-central1.hosted.app',
        mode: 'production',
      })
    ).toBe('development');
  });

  it('infers production from the configured project id', () => {
    expect(inferEnvironmentFromProjectId('vehicle-vitals-prod')).toBe(
      'production'
    );
  });

  it('treats localhost as development', () => {
    expect(inferEnvironmentFromHostname('localhost')).toBe('development');
  });
});
