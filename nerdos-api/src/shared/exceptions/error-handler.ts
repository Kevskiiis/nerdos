import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { hasZodFastifySchemaValidationErrors } from 'fastify-type-provider-zod';
import { ZodError } from 'zod';
import { AppError } from './app-error.js';
import { ErrorCode } from './error-codes.js';

const httpCodes: Record<number, ErrorCode> = {
  400: ErrorCode.BAD_REQUEST,
  401: ErrorCode.UNAUTHORIZED,
  403: ErrorCode.FORBIDDEN,
  404: ErrorCode.NOT_FOUND,
  409: ErrorCode.CONFLICT,
};

/** Registers unified error and not-found handlers on the supplied Fastify instance. */
export function registerErrorHandlers(app: FastifyInstance): void {
  app.setNotFoundHandler((request, reply) => {
    void reply.send(new AppError({ status: 404, code: ErrorCode.NOT_FOUND, detail: 'Resource not found' }));
  });

  app.setErrorHandler((error: unknown, request: FastifyRequest, reply: FastifyReply) => {
    let normalized: AppError;
    if (error instanceof AppError) {
      normalized = error;
    } else if (error instanceof ZodError) {
      normalized = new AppError({
        status: 422, code: ErrorCode.VALIDATION_ERROR, detail: 'Request validation failed',
        meta_data: { field_errors: error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })) },
      });
    } else if (hasZodFastifySchemaValidationErrors(error)) {
      normalized = new AppError({
        status: 422, code: ErrorCode.VALIDATION_ERROR, detail: 'Request validation failed',
        meta_data: { field_errors: error.validation.map((issue) => ({ path: issue.instancePath, message: issue.message })) },
      });
    } else if (error instanceof Error && 'statusCode' in error &&
      typeof error.statusCode === 'number' && Number.isInteger(error.statusCode) && error.statusCode >= 400 && error.statusCode < 500) {
      normalized = new AppError({ status: error.statusCode, code: httpCodes[error.statusCode] ?? ErrorCode.HTTP_ERROR, detail: error.message });
    } else {
      request.log.error({ err: error }, 'Unhandled request error');
      normalized = new AppError({ status: 500, code: ErrorCode.INTERNAL_ERROR, detail: 'Internal server error' });
    }

    void reply.status(normalized.status).send({
      status: normalized.status,
      code: normalized.code,
      detail: normalized.detail,
      instance: request.url.split('?')[0],
      trace_id: request.traceId ?? request.id,
      timestamp: new Date().toISOString(),
      retryable: normalized.retryable,
      ...(normalized.meta_data === undefined ? {} : { meta_data: normalized.meta_data }),
    });
  });
}
