import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { promptService } from '../services/prompt.service.js';
import { versionService } from '../services/version.service.js';
import { tagService } from '../services/tag.service.js';
import { CreatePromptSchema, CreateTagSchema, UpdatePromptSchema } from '../types/index.js';
import { optionalAuth, requireAuth } from '../middleware/auth.js';
import { db } from '../db/client.js';

export const promptsRouter = new Hono();

// Public discovery endpoints — no auth required
promptsRouter.get('/public/options', (c) => {
  return c.json(promptService.listPublicOptions());
});

promptsRouter.get('/public', optionalAuth, (c) => {
  const q = c.req.query('q');
  const platformRaw = c.req.query('platform');
  const platformsRaw = c.req.query('platforms');
  const tagRaw = c.req.query('tag');
  const tagsRaw = c.req.query('tags');
  const skillRaw = c.req.query('skill');
  const skillsRaw = c.req.query('skills');
  const mcpRaw = c.req.query('mcp');
  const mcpsRaw = c.req.query('mcps');
  const clauseRaw = c.req.query('clause');
  const user = c.get('user');
  const platforms = [
    ...(platformRaw ? [platformRaw] : []),
    ...(platformsRaw ? platformsRaw.split(',').map((s) => s.trim()) : []),
  ].filter(Boolean);
  const tagIds = [
    ...(tagRaw ? [Number(tagRaw)] : []),
    ...(tagsRaw ? tagsRaw.split(',').map((s) => Number(s.trim())) : []),
  ].filter((n) => Number.isInteger(n) && n > 0);
  const skills = [
    ...(skillRaw ? [skillRaw] : []),
    ...(skillsRaw ? skillsRaw.split(',').map((s) => s.trim()) : []),
  ].filter(Boolean);
  const mcps = [
    ...(mcpRaw ? [mcpRaw] : []),
    ...(mcpsRaw ? mcpsRaw.split(',').map((s) => s.trim()) : []),
  ].filter(Boolean);
  const clauseMode = clauseRaw === 'or' ? 'or' : 'and';
  return c.json(promptService.listPublic(q, platforms, user?.id ?? null, tagIds, skills, mcps, clauseMode));
});

promptsRouter.get('/public/:id', optionalAuth, (c) => {
  const id = Number(c.req.param('id'));
  const user = c.get('user');
  const prompt = promptService.getById(id, user?.id ?? null);
  if (!prompt || prompt.visibility !== 'public') return c.json({ error: 'Not found' }, 404);
  // Increment view count (fire-and-forget, non-blocking)
  db.prepare('UPDATE prompts SET view_count = view_count + 1 WHERE id = ?').run(id);
  return c.json(prompt);
});

// POST /api/prompts/token-exchange — exchange a run token for prompt content (single-use, 10-min TTL)
promptsRouter.post('/token-exchange', zValidator('json', z.object({ token: z.string().min(1) })), (c) => {
  const { token } = c.req.valid('json');
  const prompt = promptService.exchangeRunToken(token);
  if (!prompt) return c.json({ error: 'Token invalid or expired' }, 404);
  return c.json(prompt);
});

// Private library endpoints
promptsRouter.get('/', optionalAuth, (c) => {
  const q = c.req.query('q');
  const tagRaw = c.req.query('tag');
  const tagsRaw = c.req.query('tags');
  const tagIds = [
    ...(tagRaw ? [Number(tagRaw)] : []),
    ...(tagsRaw ? tagsRaw.split(',').map((s) => Number(s.trim())) : []),
  ].filter((n) => Number.isInteger(n) && n > 0);
  const user = c.get('user');
  return c.json(promptService.list(q, tagIds, user?.id ?? null));
});

promptsRouter.get('/tags', (c) => {
  return c.json(tagService.list());
});

promptsRouter.get('/tags/defaults', (c) => {
  return c.json(tagService.listDefaults());
});

promptsRouter.get('/tags/suggest', (c) => {
  const q = c.req.query('q');
  const limitRaw = Number(c.req.query('limit'));
  const limit = Number.isInteger(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 50) : 20;
  return c.json(tagService.suggest(q, limit));
});

promptsRouter.post('/tags', requireAuth, zValidator('json', CreateTagSchema), (c) => {
  const body = c.req.valid('json');
  const result = tagService.createOrGet(body);
  return c.json(result.tag, result.created ? 201 : 200);
});

promptsRouter.post('/', optionalAuth, zValidator('json', CreatePromptSchema), (c) => {
  const body = c.req.valid('json');
  const user = c.get('user');
  const prompt = promptService.create(body, user?.id);
  return c.json(prompt, 201);
});

promptsRouter.get('/:id', optionalAuth, (c) => {
  const id = Number(c.req.param('id'));
  const user = c.get('user');
  const prompt = promptService.getById(id, user?.id ?? null);
  if (!prompt) return c.json({ error: 'Not found' }, 404);
  if (prompt.visibility === 'private' && prompt.creator_id !== null && prompt.creator_id !== user?.id) {
    return c.json({ error: 'Not found' }, 404);
  }
  return c.json(prompt);
});

promptsRouter.put('/:id', requireAuth, zValidator('json', UpdatePromptSchema), (c) => {
  const id = Number(c.req.param('id'));
  const user = c.get('user')!;
  const body = c.req.valid('json');
  const existing = promptService.getById(id, user.id);
  if (!existing) return c.json({ error: 'Not found' }, 404);
  if (existing.creator_id !== null && existing.creator_id !== user.id) {
    return c.json({ error: 'Forbidden' }, 403);
  }
  const prompt = promptService.update(id, body);
  return c.json(prompt);
});

promptsRouter.delete('/:id', requireAuth, (c) => {
  const id = Number(c.req.param('id'));
  const user = c.get('user')!;
  const existing = promptService.getById(id, null);
  if (!existing) return c.json({ error: 'Not found' }, 404);
  if (existing.creator_id !== null && existing.creator_id !== user.id) {
    return c.json({ error: 'Forbidden' }, 403);
  }
  promptService.delete(id);
  return c.json({ ok: true });
});

promptsRouter.get('/:id/versions', optionalAuth, (c) => {
  const promptId = Number(c.req.param('id'));
  const user = c.get('user');
  const prompt = promptService.getById(promptId, user?.id ?? null);
  if (!prompt) return c.json({ error: 'Not found' }, 404);
  if (prompt.visibility === 'private' && prompt.creator_id !== null && prompt.creator_id !== user?.id) {
    return c.json({ error: 'Not found' }, 404);
  }
  return c.json(versionService.list(promptId));
});

promptsRouter.get('/:id/versions/:vId', optionalAuth, (c) => {
  const promptId = Number(c.req.param('id'));
  const vId = Number(c.req.param('vId'));
  const user = c.get('user');
  const prompt = promptService.getById(promptId, user?.id ?? null);
  if (!prompt) return c.json({ error: 'Not found' }, 404);
  if (prompt.visibility === 'private' && prompt.creator_id !== null && prompt.creator_id !== user?.id) {
    return c.json({ error: 'Not found' }, 404);
  }
  const version = versionService.getById(promptId, vId);
  if (!version) return c.json({ error: 'Not found' }, 404);
  return c.json(version);
});

// POST /api/prompts/:id/fork — clone a public prompt into the user's library
promptsRouter.post('/:id/fork', requireAuth, (c) => {
  const id = Number(c.req.param('id'));
  const user = c.get('user')!;
  const source = promptService.getById(id, null);
  if (!source || source.visibility !== 'public') return c.json({ error: 'Not found' }, 404);

  const forked = db.prepare(`
    INSERT INTO prompts (title, content, description, creator_id, visibility, requirements, forked_from_id)
    VALUES (?, ?, ?, ?, 'private', ?, ?)
    RETURNING id
  `).get(
    `${source.title} (fork)`,
    source.content,
    source.description,
    user.id,
    source.requirements ?? null,
    id,
  ) as { id: number };

  // Increment fork_count on source
  db.prepare('UPDATE prompts SET fork_count = fork_count + 1 WHERE id = ?').run(id);

  return c.json({ id: forked.id, forked_from_id: id }, 201);
});

// POST /api/prompts/:id/run-token — generate a short-lived signed token for any public prompt or own private prompt
promptsRouter.post('/:id/run-token', requireAuth, (c) => {
  const id = Number(c.req.param('id'));
  const user = c.get('user')!;
  const result = promptService.generateRunToken(id, user.id);
  if (!result) return c.json({ error: 'Not found or forbidden' }, 404);
  return c.json(result);
});

// POST /api/prompts/:id/vem — track a "Run in vem.dev" click
promptsRouter.post('/:id/vem', (c) => {
  const id = Number(c.req.param('id'));
  const prompt = db.prepare("SELECT id FROM prompts WHERE id = ? AND visibility = 'public'").get(id);
  if (!prompt) return c.json({ error: 'Not found' }, 404);
  db.prepare(`
    INSERT INTO prompt_vem_uses (prompt_id, count) VALUES (?, 1)
    ON CONFLICT(prompt_id) DO UPDATE SET count = count + 1
  `).run(id);
  return c.json({ ok: true });
});

promptsRouter.post('/:id/versions/:vId/restore', requireAuth, (c) => {
  const promptId = Number(c.req.param('id'));
  const vId = Number(c.req.param('vId'));
  const user = c.get('user')!;
  const existing = promptService.getById(promptId, user.id);
  if (!existing) return c.json({ error: 'Not found' }, 404);
  if (existing.creator_id !== null && existing.creator_id !== user.id) {
    return c.json({ error: 'Forbidden' }, 403);
  }
  const prompt = versionService.restore(promptId, vId);
  if (!prompt) return c.json({ error: 'Not found' }, 404);
  return c.json(prompt);
});
