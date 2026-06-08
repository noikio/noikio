import type { Context, Next } from 'hono';
import { authService } from '../services/auth.service.js';
import type { UserRow } from '../types/index.js';

declare module 'hono' {
  interface ContextVariableMap {
    user: UserRow | null;
  }
}

function extractToken(c: Context): string | null {
  const header = c.req.header('Authorization');
  if (!header?.startsWith('Bearer ')) return null;
  return header.slice(7);
}

export async function optionalAuth(c: Context, next: Next): Promise<void> {
  const token = extractToken(c);
  c.set('user', token ? authService.getUserByToken(token) : null);
  await next();
}

export async function requireAuth(c: Context, next: Next): Promise<Response | void> {
  const token = extractToken(c);
  if (!token) return c.json({ error: 'Unauthorized' }, 401);
  const user = authService.getUserByToken(token);
  if (!user) return c.json({ error: 'Unauthorized' }, 401);
  c.set('user', user);
  await next();
}
