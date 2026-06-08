import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { chainService } from '../services/chain.service.js';
import { CreateChainSchema, UpdateChainSchema } from '../types/index.js';
import { requireAuth } from '../middleware/auth.js';

export const chainsRouter = new Hono();

chainsRouter.get('/', (c) => {
  return c.json(chainService.list());
});

chainsRouter.post('/', requireAuth, zValidator('json', CreateChainSchema), (c) => {
  const body = c.req.valid('json');
  const user = c.get('user')!;
  return c.json(chainService.create(body, user.id), 201);
});

chainsRouter.get('/:id', (c) => {
  const id = Number(c.req.param('id'));
  const chain = chainService.getById(id);
  if (!chain) return c.json({ error: 'Not found' }, 404);
  return c.json(chain);
});

chainsRouter.put('/:id', requireAuth, zValidator('json', UpdateChainSchema), (c) => {
  const id = Number(c.req.param('id'));
  const user = c.get('user')!;
  const existing = chainService.getById(id);
  if (!existing) return c.json({ error: 'Not found' }, 404);
  if (existing.creator_id !== null && existing.creator_id !== user.id) {
    return c.json({ error: 'Forbidden' }, 403);
  }
  const body = c.req.valid('json');
  const chain = chainService.update(id, body);
  return c.json(chain);
});

chainsRouter.delete('/:id', requireAuth, (c) => {
  const id = Number(c.req.param('id'));
  const user = c.get('user')!;
  const existing = chainService.getById(id);
  if (!existing) return c.json({ error: 'Not found' }, 404);
  if (existing.creator_id !== null && existing.creator_id !== user.id) {
    return c.json({ error: 'Forbidden' }, 403);
  }
  chainService.delete(id);
  return c.json({ ok: true });
});
