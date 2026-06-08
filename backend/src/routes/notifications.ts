import { Hono } from 'hono';
import { db } from '../db/client.js';
import { requireAuth } from '../middleware/auth.js';

export const notificationsRouter = new Hono();

interface NotificationRow {
  id: number;
  user_id: number;
  type: string;
  actor_id: number | null;
  actor_username: string | null;
  entity_id: number | null;
  entity_type: string | null;
  read: number;
  created_at: number;
}

// GET /api/notifications
notificationsRouter.get('/', requireAuth, (c) => {
  const user = c.get('user')!;
  const rows = db.prepare(`
    SELECT n.*, u.username as actor_username
    FROM notifications n
    LEFT JOIN users u ON u.id = n.actor_id
    WHERE n.user_id = ?
    ORDER BY n.created_at DESC
    LIMIT 50
  `).all(user.id) as NotificationRow[];

  const unread_count = (db.prepare('SELECT COUNT(*) as n FROM notifications WHERE user_id = ? AND read = 0').get(user.id) as { n: number }).n;

  return c.json({ notifications: rows, unread_count });
});

// POST /api/notifications/read — mark all as read
notificationsRouter.post('/read', requireAuth, (c) => {
  const user = c.get('user')!;
  db.prepare('UPDATE notifications SET read = 1 WHERE user_id = ?').run(user.id);
  return c.json({ ok: true });
});

// POST /api/notifications/:id/read — mark single as read
notificationsRouter.post('/:id/read', requireAuth, (c) => {
  const user = c.get('user')!;
  const id = Number(c.req.param('id'));
  db.prepare('UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?').run(id, user.id);
  return c.json({ ok: true });
});
