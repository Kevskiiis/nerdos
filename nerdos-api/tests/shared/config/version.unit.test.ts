import { afterEach, describe, expect, it, vi } from 'vitest';

const metadataKeys = ['APP_VERSION', 'GIT_SHA', 'RENDER_GIT_COMMIT', 'RAILWAY_GIT_COMMIT_SHA', 'VERCEL_GIT_COMMIT_SHA'] as const;

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('buildMetadata', () => {
  it('uses package metadata and local when no commit is provided', async () => {
    for (const key of metadataKeys) vi.stubEnv(key, undefined);
    const { buildMetadata } = await import('../../../src/shared/config/version.js');
    expect(buildMetadata).toEqual({ APP_NAME: 'nerdos-api', APP_VERSION: '0.1.0', APP_COMMIT: 'local', APP_RELEASE: '0.1.0+local' });
    expect(Object.isFrozen(buildMetadata)).toBe(true);
  });

  it('uses the version override and truncates the preferred commit', async () => {
    vi.stubEnv('APP_VERSION', '2.3.4');
    vi.stubEnv('GIT_SHA', '123456789abcdef');
    vi.stubEnv('RENDER_GIT_COMMIT', 'othercommit');
    const { buildMetadata } = await import('../../../src/shared/config/version.js');
    expect(buildMetadata.APP_VERSION).toBe('2.3.4');
    expect(buildMetadata.APP_COMMIT).toBe('1234567');
    expect(buildMetadata.APP_RELEASE).toBe('2.3.4+1234567');
  });

  it('falls back to a platform commit when GIT_SHA is absent', async () => {
    vi.stubEnv('GIT_SHA', undefined);
    vi.stubEnv('RENDER_GIT_COMMIT', 'abcdef123456');
    const { buildMetadata } = await import('../../../src/shared/config/version.js');
    expect(buildMetadata.APP_COMMIT).toBe('abcdef1');
  });
});
