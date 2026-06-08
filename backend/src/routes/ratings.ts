import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { ratingService } from '../services/rating.service.js';
import { promptService } from '../services/prompt.service.js';
import { RateSchema } from '../types/index.js';
import { requireAuth } from '../middleware/auth.js';

export const ratingsRouter = new Hono();

ratingsRouter.post('/:id/rate', requireAuth, zValidator('json', RateSchema), (c) => {
  const id = Number(c.req.param('id'));
  const user = c.get('user')!;
  const { rating } = c.req.valid('json');
  const prompt = promptService.getById(id, null);
  if (!prompt) return c.json({ error: 'Not found' }, 404);
  if (prompt.visibility !== 'public') return c.json({ error: 'Not found' }, 404);
  ratingService.set(id, user.id, rating);
  return c.json({ ok: true });
});

ratingsRouter.delete('/:id/rate', requireAuth, (c) => {
  const id = Number(c.req.param('id'));
  const user = c.get('user')!;
  ratingService.remove(id, user.id);
  return c.json({ ok: true });
});
