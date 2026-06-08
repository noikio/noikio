import 'dotenv/config';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { initSchema } from './db/schema.js';
import { apiRouter } from './routes/index.js';

initSchema();

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((s) => s.trim())
  : ['http://localhost:4200', 'http://localhost:3010'];

const app = new Hono();
app.use('*', secureHeaders());
app.use('*', cors({
  origin: allowedOrigins,
  allowHeaders: ['Authorization', 'Content-Type'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));
app.route('/api', apiRouter);

if (process.env.NODE_ENV === 'production') {
  app.use('*', serveStatic({ root: 'frontend/dist/frontend/browser' }));
  app.get('*', serveStatic({ path: 'frontend/dist/frontend/browser/index.html' }));
}

const port = Number(process.env.PORT ?? 3010);
serve({ fetch: app.fetch, port }, () => {
  console.log(`Backend running on http://localhost:${port}`);
});
