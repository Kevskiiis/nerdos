import Fastify from 'fastify';
import postgres from 'postgres';
import { expect, it, vi } from 'vitest';
import { databasePlugin } from '../../../src/shared/database/client.js';

vi.mock('postgres', () => ({ default: vi.fn() }));

it('creates one pool with the required settings and closes it on shutdown', async () => {
  const end = vi.fn().mockResolvedValue(undefined);
  const client = Object.assign(vi.fn(), { end });
  vi.mocked(postgres).mockReturnValueOnce(client as never);
  const app = Fastify();
  try {
    await app.register(databasePlugin, { env: { DATABASE_URL: 'postgresql://localhost/test' } });
    await app.ready();
    expect(postgres).toHaveBeenCalledOnce();
    expect(postgres).toHaveBeenCalledWith('postgresql://localhost/test', { max: 10, idle_timeout: 20, prepare: false });
    expect(app.sql).toBe(client);
  } finally {
    await app.close();
  }
  expect(end).toHaveBeenCalledOnce();
  expect(end).toHaveBeenCalledWith({ timeout: 5 });
});
