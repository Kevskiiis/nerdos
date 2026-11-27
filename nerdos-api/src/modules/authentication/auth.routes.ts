import type { FastifyPluginAsync, FastifyReply } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { AppError } from '../../shared/exceptions/app-error.js';
import { ErrorCode } from '../../shared/exceptions/error-codes.js';
import { errorResponseSchema } from '../../shared/exceptions/error-schema.js';
import { AUTH_RATE_LIMITS } from './auth.rate-limits.js';
import { authUserResponseSchema, changePasswordBodySchema, forgotPasswordBodySchema, loginBodySchema, logoutAllResponseSchema, logoutResponseSchema, meResponseSchema, messageResponseSchema, registerBodySchema, registerResponseSchema, resendVerificationBodySchema, resetPasswordBodySchema, verifyEmailBodySchema } from './auth.schemas.js';
import type { createAuthService } from './auth.service.js';

interface Options { authService: ReturnType<typeof createAuthService> }
const errors = { '4xx': errorResponseSchema, '5xx': errorResponseSchema };
function setCookies(reply: FastifyReply, cookies: string[]) { if (cookies.length) reply.header('set-cookie', cookies); }

/** Registers typed public and session-protected authentication routes. */
export const authRoutes: FastifyPluginAsync<Options> = async (instance, { authService }) => {
  const app = instance.withTypeProvider<ZodTypeProvider>();
  app.post('/register', { config: { rateLimit: AUTH_RATE_LIMITS.emailTrigger }, schema: { tags: ['Authentication'], body: registerBodySchema, response: { 201: registerResponseSchema, ...errors } } }, async (request, reply) => reply.code(201).send(await authService.register(request.body)));
  app.post('/resend-verification', { config: { rateLimit: AUTH_RATE_LIMITS.emailTrigger }, schema: { tags: ['Authentication'], body: resendVerificationBodySchema, response: { 200: messageResponseSchema, ...errors } } }, async (request) => authService.resendVerification(request.body));
  app.post('/forgot-password', { config: { rateLimit: AUTH_RATE_LIMITS.emailTrigger }, schema: { tags: ['Authentication'], body: forgotPasswordBodySchema, response: { 200: messageResponseSchema, ...errors } } }, async (request) => authService.forgotPassword(request.body));
  app.post('/login', { config: { rateLimit: AUTH_RATE_LIMITS.bruteForce }, schema: { tags: ['Authentication'], body: loginBodySchema, response: { 200: authUserResponseSchema, ...errors } } }, async (request, reply) => {
    const { user, setCookies: cookies } = await authService.login(request.body); setCookies(reply, cookies); return { user };
  });
  app.post('/verify-email', { config: { rateLimit: AUTH_RATE_LIMITS.bruteForce }, schema: { tags: ['Authentication'], body: verifyEmailBodySchema, response: { 200: authUserResponseSchema, ...errors } } }, async (request, reply) => {
    const { user, setCookies: cookies } = await authService.verifyEmail(request.body); setCookies(reply, cookies); return { user };
  });
  app.post('/reset-password', { config: { rateLimit: AUTH_RATE_LIMITS.bruteForce }, schema: { tags: ['Authentication'], body: resetPasswordBodySchema, response: { 200: messageResponseSchema, ...errors } } }, async (request, reply) => {
    const { message, setCookies: cookies } = await authService.resetPassword(request.body); setCookies(reply, cookies); return { message };
  });
  app.get('/me', { preHandler: [app.requireAuth], schema: { tags: ['Authentication'], response: { 200: meResponseSchema, ...errors } } }, async (request) => {
    const user = await authService.getMe(request.headers.cookie!);
    if (!user) throw new AppError({ status: 401, code: ErrorCode.UNAUTHORIZED, detail: 'Authentication required.' });
    return { user };
  });
  app.post('/logout', { preHandler: [app.requireAuth], schema: { tags: ['Authentication'], response: { 200: logoutResponseSchema, ...errors } } }, async (request, reply) => {
    const { message, setCookies: cookies } = await authService.logout(request.headers.cookie!); setCookies(reply, cookies); return { message };
  });
  app.post('/change-password', { preHandler: [app.requireAuth, app.rateLimit(AUTH_RATE_LIMITS.sensitiveUserAction)], schema: { tags: ['Authentication'], body: changePasswordBodySchema, response: { 200: messageResponseSchema, ...errors } } }, async (request) => authService.changePassword(request.headers.cookie!, request.body));
  app.post('/logout-all', { preHandler: [app.requireAuth, app.rateLimit(AUTH_RATE_LIMITS.sensitiveUserAction)], schema: { tags: ['Authentication'], response: { 200: logoutAllResponseSchema, ...errors } } }, async (request, reply) => {
    const { message, setCookies: cookies } = await authService.logoutAll(request.headers.cookie!); setCookies(reply, cookies); return { message };
  });
};
