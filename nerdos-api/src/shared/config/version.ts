import { readFileSync } from 'node:fs';

const packageInfo = JSON.parse(
  readFileSync(new URL('../../../package.json', import.meta.url), 'utf8'),
) as { name: string; version: string };

const version = process.env.APP_VERSION || packageInfo.version;
const commit = (process.env.GIT_SHA || process.env.RENDER_GIT_COMMIT ||
  process.env.RAILWAY_GIT_COMMIT_SHA || process.env.VERCEL_GIT_COMMIT_SHA || 'local').slice(0, 7);

/** Immutable application identity and release metadata captured at startup. */
export const buildMetadata = Object.freeze({
  APP_NAME: packageInfo.name,
  APP_VERSION: version,
  APP_COMMIT: commit,
  APP_RELEASE: `${version}+${commit}`,
});
