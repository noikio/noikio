import { Hono } from 'hono';
import { db } from '../db/client.js';
import { requireAuth } from '../middleware/auth.js';
import type { PromptRow } from '../types/index.js';

// Mounted at /api/prompts — handles /:id/bookmark
export const bookmarkActionRouter = new Hono();

bookmarkActionRouter.post('/:id/bookmark', requireAuth, (c) => {
  const user = c.get('user')!;
  const promptId = Number(c.req.param('id'));
  const prompt = db.prepare("SELECT id FROM prompts WHERE id = ? AND visibility = 'public'").get(promptId);
  if (!prompt) return c.json({ error: 'Prompt not found' }, 404);
  db.prepare('INSERT OR IGNORE INTO bookmarks (user_id, prompt_id) VALUES (?, ?)').run(user.id, promptId);
  return c.json({ bookmarked: true });
});

bookmarkActionRouter.delete('/:id/bookmark', requireAuth, (c) => {
  const user = c.get('user')!;
  const promptId = Number(c.req.param('id'));
  db.prepare('DELETE FROM bookmarks WHERE user_id = ? AND prompt_id = ?').run(user.id, promptId);
  return c.json({ bookmarked: false });
});

// Mounted at /api/bookmarks — handles GET /
export const bookmarksRouter = new Hono();

bookmarksRouter.get('/', requireAuth, (c) => {
  const user = c.get('user')!;
  const rows = db.prepare(`
    SELECT p.*, u.username as creator_username,
      GROUP_CONCAT(DISTINCT pt.tag_id) as tag_ids,
      COUNT(CASE WHEN pr.rating = 'like' THEN 1 END) as like_count,
      COUNT(CASE WHEN pr.rating = 'dislike' THEN 1 END) as dislike_count,
      (SELECT rating FROM prompt_ratings WHERE prompt_id = p.id AND user_id = ?) as user_rating,
      1 as bookmarked,
      b.created_at as bookmarked_at
    FROM bookmarks b
    JOIN prompts p ON p.id = b.prompt_id
    LEFT JOIN users u ON u.id = p.creator_id
    LEFT JOIN prompt_tags pt ON pt.prompt_id = p.id
    LEFT JOIN prompt_ratings pr ON pr.prompt_id = p.id
    WHERE b.user_id = ?
    GROUP BY p.id
    ORDER BY b.created_at DESC
  `).all(user.id, user.id) as (PromptRow & { bookmarked: number; bookmarked_at: number })[];

  return c.json(rows.map(row => ({
    ...row,
    tag_ids: row.tag_ids ? row.tag_ids.split(',').map(Number) : [],
    like_count: row.like_count ?? 0,
    dislike_count: row.dislike_count ?? 0,
    requirements: row.requirements ? JSON.parse(row.requirements) : undefined,
  })));
});
