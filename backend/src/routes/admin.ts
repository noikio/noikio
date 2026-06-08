import { Hono } from 'hono';
import type { Context, Next } from 'hono';
import { db } from '../db/client.js';
import { presenceService } from '../services/presence.service.js';
import type { UserRow } from '../types/index.js';

const ADMIN_EMAIL = process.env['ADMIN_EMAIL'] ?? 'admin@example.com';

export const adminRouter = new Hono();

async function requireAdmin(c: Context, next: Next): Promise<Response | void> {
  const user = c.get('user');
  if (!user) return c.json({ error: 'Unauthorized' }, 401);
  if (user.email !== ADMIN_EMAIL) return c.json({ error: 'Forbidden' }, 403);
  await next();
}

adminRouter.use('*', requireAdmin);

adminRouter.post('/heartbeat', (c) => {
  const user = c.get('user')!;
  presenceService.heartbeat(user.id);
  return c.json({ ok: true });
});

adminRouter.get('/stats', (c) => {
  const onlineIds = presenceService.getOnlineUserIds(60_000);

  const onlineUsers = onlineIds.length > 0
    ? (db.prepare(
        `SELECT id, username FROM users WHERE id IN (${onlineIds.map(() => '?').join(',')})`,
      ).all(...onlineIds) as Pick<UserRow, 'id' | 'username'>[])
    : [];

  const totalUsers = (db.prepare('SELECT COUNT(*) as n FROM users').get() as { n: number }).n;
  const newUsers7d = (db.prepare(
    `SELECT COUNT(*) as n FROM users WHERE created_at > unixepoch() - 7*86400`,
  ).get() as { n: number }).n;

  const totalPrompts = (db.prepare('SELECT COUNT(*) as n FROM prompts').get() as { n: number }).n;
  const publicPrompts = (db.prepare(
    `SELECT COUNT(*) as n FROM prompts WHERE visibility = 'public'`,
  ).get() as { n: number }).n;
  const privatePrompts = totalPrompts - publicPrompts;
  const newPrompts7d = (db.prepare(
    `SELECT COUNT(*) as n FROM prompts WHERE created_at > unixepoch() - 7*86400`,
  ).get() as { n: number }).n;

  const totalComments = (db.prepare('SELECT COUNT(*) as n FROM prompt_comments').get() as { n: number }).n;
  const totalRatings = (db.prepare('SELECT COUNT(*) as n FROM prompt_ratings').get() as { n: number }).n;

  const topUsers = db.prepare(`
    SELECT u.id, u.username, u.email, u.created_at,
      COUNT(p.id) as prompt_count
    FROM users u
    LEFT JOIN prompts p ON p.creator_id = u.id
    GROUP BY u.id
    ORDER BY prompt_count DESC
    LIMIT 10
  `).all() as { id: number; username: string; email: string; created_at: number; prompt_count: number }[];

  const recentUsers = db.prepare(
    `SELECT id, username, email, created_at FROM users ORDER BY created_at DESC LIMIT 10`,
  ).all() as Pick<UserRow, 'id' | 'username' | 'email' | 'created_at'>[];

  return c.json({
    online: { count: onlineUsers.length, users: onlineUsers },
    users: { total: totalUsers, new_7d: newUsers7d, recent: recentUsers },
    prompts: { total: totalPrompts, public: publicPrompts, private: privatePrompts, new_7d: newPrompts7d },
    engagement: { comments: totalComments, ratings: totalRatings },
    top_users: topUsers,
  });
});
