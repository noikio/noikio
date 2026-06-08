import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '../db/client.js';
import { requireAuth } from '../middleware/auth.js';

const PREDEFINED = ['Claude Code', 'Cursor', 'GitHub Copilot', 'Gemini', 'ChatGPT'];

export const platformsRouter = new Hono();

platformsRouter.get('/', (c) => {
  const rows = db.prepare('SELECT name FROM custom_platforms ORDER BY name').all() as { name: string }[];
  return c.json({ predefined: PREDEFINED, custom: rows.map(r => r.name) });
});

platformsRouter.post('/', requireAuth, zValidator('json', z.object({ name: z.string().min(1).max(100).trim() })), (c) => {
  const { name } = c.req.valid('json');
  if (PREDEFINED.some(p => p.toLowerCase() === name.toLowerCase())) {
    return c.json({ ok: true });
  }
  db.prepare('INSERT OR IGNORE INTO custom_platforms (name) VALUES (?)').run(name);
  return c.json({ ok: true }, 201);
});
