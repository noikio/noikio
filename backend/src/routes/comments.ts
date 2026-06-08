import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { commentService } from '../services/comment.service.js';
import { promptService } from '../services/prompt.service.js';
import { CreateCommentSchema, VoteCommentSchema } from '../types/index.js';
import { requireAuth } from '../middleware/auth.js';

export const commentsRouter = new Hono();

commentsRouter.get('/:id/comments', (c) => {
  const id = Number(c.req.param('id'));
  const user = c.get('user');
  const prompt = promptService.getById(id, user?.id ?? null);
  if (!prompt) return c.json({ error: 'Not found' }, 404);
  if (prompt.visibility === 'private' && prompt.creator_id !== null && prompt.creator_id !== user?.id) {
    return c.json({ error: 'Not found' }, 404);
  }
  return c.json(commentService.list(id, user?.id ?? null));
});

commentsRouter.post('/:id/comments', requireAuth, zValidator('json', CreateCommentSchema), (c) => {
  const id = Number(c.req.param('id'));
  const user = c.get('user')!;
  const { body, parentId } = c.req.valid('json');
  const prompt = promptService.getById(id, null);
  if (!prompt) return c.json({ error: 'Not found' }, 404);
  if (prompt.visibility !== 'public') return c.json({ error: 'Not found' }, 404);
  return c.json(commentService.create(id, user.id, body, parentId), 201);
});

commentsRouter.post('/:id/comments/:commentId/vote', requireAuth, zValidator('json', VoteCommentSchema), (c) => {
  const commentId = Number(c.req.param('commentId'));
  const user = c.get('user')!;
  const { vote } = c.req.valid('json');
  commentService.vote(commentId, user.id, vote);
  return c.json({ ok: true });
});

commentsRouter.delete('/:id/comments/:commentId/vote', requireAuth, (c) => {
  const commentId = Number(c.req.param('commentId'));
  const user = c.get('user')!;
  commentService.removeVote(commentId, user.id);
  return c.json({ ok: true });
});

commentsRouter.delete('/:id/comments/:commentId', requireAuth, (c) => {
  const commentId = Number(c.req.param('commentId'));
  const user = c.get('user')!;
  if (!commentService.delete(commentId, user.id)) {
    return c.json({ error: 'Not found or not authorized' }, 404);
  }
  return c.json({ ok: true });
});
