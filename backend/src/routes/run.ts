import { Hono } from 'hono';

export const runRouter = new Hono();

runRouter.post('/prompt', (c) => {
  return c.json({ message: 'Not implemented' }, 501);
});

runRouter.post('/chain', (c) => {
  return c.json({ message: 'Not implemented' }, 501);
});
