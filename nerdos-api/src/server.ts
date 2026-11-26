import { buildApp } from './app.js';
import { loadEnv } from './shared/config/env.js';

async function main(): Promise<void> {
  const env = loadEnv(process.env);
  const app = await buildApp({ env });
  let stopping = false;

  const shutdown = async (reason: string, failed: boolean, error?: unknown): Promise<void> => {
    if (failed) process.exitCode = 1;
    if (stopping) return;
    stopping = true;
    if (error !== undefined) app.log.error({ err: error }, reason);
    else app.log.info(reason);
    try {
      await app.close();
    } catch (closeError) {
      process.exitCode = 1;
      app.log.error({ err: closeError }, 'Failed to close application');
    }
  };

  process.on('SIGINT', () => { void shutdown('Received SIGINT', false); });
  process.on('SIGTERM', () => { void shutdown('Received SIGTERM', false); });
  process.on('uncaughtException', (error) => { void shutdown('Uncaught exception', true, error); });
  process.on('unhandledRejection', (error) => { void shutdown('Unhandled rejection', true, error); });

  try {
    await app.listen({ host: env.HOST, port: env.PORT });
  } catch (error) {
    await shutdown('Failed to start server', true, error);
  }
}

main().catch((error: unknown) => {
  console.error('Failed to initialize server', error);
  process.exitCode = 1;
});
