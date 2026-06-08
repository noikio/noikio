import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { authService } from '../services/auth.service.js';
import { sendOtp } from '../services/email.service.js';
import { RegisterSchema, OtpRequestSchema, OtpVerifySchema } from '../types/index.js';
import { requireAuth } from '../middleware/auth.js';
import { createRateLimiter } from '../middleware/rate-limit.js';

const registerLimiter = createRateLimiter(60 * 60 * 1000, 10);
const otpLimiter = createRateLimiter(15 * 60 * 1000, 10);
const verifyLimiter = createRateLimiter(15 * 60 * 1000, 20);

export const authRouter = new Hono();

authRouter.post('/register', registerLimiter, zValidator('json', RegisterSchema), async (c) => {
  const { email, username } = c.req.valid('json');
  const result = authService.register(email, username);
  if ('conflict' in result) {
    return c.json({ error: `${result.conflict} already taken` }, 409);
  }
  return c.json({ id: result.id, email: result.email, username: result.username, plan: result.plan }, 201);
});

authRouter.post('/otp/request', otpLimiter, zValidator('json', OtpRequestSchema), async (c) => {
  const { email } = c.req.valid('json');
  const code = authService.requestOtp(email);
  // Always return ok — never reveal whether email exists or send failed
  if (code) {
    try { await sendOtp(email, code); } catch { /* swallow to prevent enumeration */ }
  }
  return c.json({ ok: true });
});

authRouter.post('/otp/verify', verifyLimiter, zValidator('json', OtpVerifySchema), (c) => {
  const { email, code } = c.req.valid('json');
  const result = authService.verifyOtp(email, code);
  if (!result) return c.json({ error: 'Invalid or expired code' }, 401);
  return c.json({
    token: result.token,
    user: { id: result.user.id, email: result.user.email, username: result.user.username, plan: result.user.plan },
  });
});

authRouter.post('/logout', requireAuth, (c) => {
  const token = c.req.header('Authorization')!.slice(7);
  authService.logout(token);
  return c.json({ ok: true });
});

authRouter.get('/me', requireAuth, (c) => {
  const user = c.get('user')!;
  return c.json({ id: user.id, email: user.email, username: user.username, plan: user.plan });
});
