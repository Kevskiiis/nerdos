import underPressure from '@fastify/under-pressure';
import type { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { AppError } from '../exceptions/app-error.js';
import { ErrorCode } from '../exceptions/error-codes.js';

interface UnderPressureOptions {
  maxEventLoopDelay?: number;
  maxHeapUsedBytes?: number;
  sampleInterval?: number;
}

class ServiceUnavailableError extends AppError {
  constructor() {
    super({ status: 503, code: ErrorCode.SERVICE_UNAVAILABLE, detail: 'Service temporarily unavailable', retryable: true });
  }
}

const plugin: FastifyPluginAsync<UnderPressureOptions> = async (app, options) => {
  await app.register(underPressure, {
    maxEventLoopDelay: options.maxEventLoopDelay ?? 1000,
    maxHeapUsedBytes: options.maxHeapUsedBytes ?? 512 * 1024 * 1024,
    sampleInterval: options.sampleInterval,
    customError: ServiceUnavailableError,
  });
};

/** Sheds requests when event-loop delay or heap usage exceed the configured limits. */
export const underPressurePlugin = fp(plugin, { name: 'under-pressure' });
