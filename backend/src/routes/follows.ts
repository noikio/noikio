import { Hono } from 'hono';
import { db } from '../db/client.js';
import { requireAuth } from '../middleware/auth.js';
import { followsService } from '../services/follows.service.js';
import type { UserRow } from '../types/index.js';

export const followsRouter = new Hono();

// POST /api/users/:username/follow
followsRouter.post('/:username/follow', requireAuth, (c) => {
  const user = c.get('user')!;
  const { username } = c.req.param();
  const target = db.prepare('SELECT id FROM users WHERE username = ?').get(username) as Pick<UserRow, 'id'> | undefined;
  if (!target) return c.json({ error: 'User not found' }, 404);
  if (target.id === user.id) return c.json({ error: 'Cannot follow yourself' }, 400);
  followsService.follow(user.id, target.id);
  return c.json({ following: true });
});

// DELETE /api/users/:username/follow
followsRouter.delete('/:username/follow', requireAuth, (c) => {
  const user = c.get('user')!;
  const { username } = c.req.param();
  const target = db.prepare('SELECT id FROM users WHERE username = ?').get(username) as Pick<UserRow, 'id'> | undefined;
  if (!target) return c.json({ error: 'User not found' }, 404);
  followsService.unfollow(user.id, target.id);
  return c.json({ following: false });
});

// GET /api/users/:username/followers
followsRouter.get('/:username/followers', (c) => {
  const { username } = c.req.param();
  const target = db.prepare('SELECT id FROM users WHERE username = ?').get(username) as Pick<UserRow, 'id'> | undefined;
  if (!target) return c.json({ error: 'User not found' }, 404);
  return c.json(followsService.getFollowers(target.id));
});

// GET /api/users/:username/following
followsRouter.get('/:username/following', (c) => {
  const { username } = c.req.param();
  const target = db.prepare('SELECT id FROM users WHERE username = ?').get(username) as Pick<UserRow, 'id'> | undefined;
  if (!target) return c.json({ error: 'User not found' }, 404);
  return c.json(followsService.getFollowing(target.id));
});
