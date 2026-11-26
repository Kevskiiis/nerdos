import { afterEach, expect, it, vi } from 'vitest';

const originalExitCode = process.exitCode;
afterEach(() => {
  process.exitCode = originalExitCode;
  vi.restoreAllMocks();
  vi.resetModules();
  vi.doUnmock('../src/app.js');
  vi.doUnmock('../src/shared/config/env.js');
});

it('closes the application once after a termination signal', async () => {
  const handlers = new Map<string, (...args: never[]) => void>();
  vi.spyOn(process, 'on').mockImplementation(((event: string, handler: (...args: never[]) => void) => {
    handlers.set(event, handler);
    return process;
  }) as typeof process.on);
  const app = { listen: vi.fn().mockResolvedValue(undefined), close: vi.fn().mockResolvedValue(undefined), log: { info: vi.fn(), error: vi.fn() } };
  vi.doMock('../src/app.js', () => ({ buildApp: vi.fn().mockResolvedValue(app) }));
  vi.doMock('../src/shared/config/env.js', () => ({ loadEnv: () => ({ HOST: '127.0.0.1', PORT: 3000 }) }));

  await import('../src/server.js');
  await vi.waitFor(() => expect(app.listen).toHaveBeenCalledWith({ host: '127.0.0.1', port: 3000 }));
  handlers.get('SIGTERM')?.();
  handlers.get('SIGINT')?.();
  await vi.waitFor(() => expect(app.close).toHaveBeenCalledOnce());
});

it('closes the application and sets a failure exit code when listen fails', async () => {
  vi.spyOn(process, 'on').mockImplementation((() => process) as typeof process.on);
  const app = { listen: vi.fn().mockRejectedValue(new Error('listen failed')), close: vi.fn().mockResolvedValue(undefined), log: { info: vi.fn(), error: vi.fn() } };
  vi.doMock('../src/app.js', () => ({ buildApp: vi.fn().mockResolvedValue(app) }));
  vi.doMock('../src/shared/config/env.js', () => ({ loadEnv: () => ({ HOST: '127.0.0.1', PORT: 3000 }) }));

  await import('../src/server.js');
  await vi.waitFor(() => expect(app.close).toHaveBeenCalledOnce());
  expect(process.exitCode).toBe(1);
});
