import { Hono } from 'hono';
import { db } from '../db/client.js';
import type { PromptRow } from '../types/index.js';

export const trendingRouter = new Hono();

// GET /api/trending?period=24h|7d|30d&limit=20
trendingRouter.get('/', (c) => {
  const user = c.get('user');
  const period = c.req.query('period') ?? '7d';
  const limit = Math.min(Number(c.req.query('limit') ?? 20), 50);

  const periodSeconds: Record<string, number> = {
    '24h': 24 * 3600,
    '7d': 7 * 24 * 3600,
    '30d': 30 * 24 * 3600,
  };
  const since = Math.floor(Date.now() / 1000) - (periodSeconds[period] ?? periodSeconds['7d']);

  const rows = db.prepare(`
    SELECT p.*, u.username as creator_username,
      GROUP_CONCAT(pt.tag_id) as tag_ids,
      COUNT(CASE WHEN pr.rating = 'like' THEN 1 END) as like_count,
      COUNT(CASE WHEN pr.rating = 'dislike' THEN 1 END) as dislike_count,
      ${user ? '(SELECT rating FROM prompt_ratings WHERE prompt_id = p.id AND user_id = ?)' : 'NULL'} as user_rating,
      (COUNT(CASE WHEN pr.rating = 'like' THEN 1 END) * 2
        - COUNT(CASE WHEN pr.rating = 'dislike' THEN 1 END)
        + p.view_count * 0.1
        + COALESCE((SELECT count FROM prompt_vem_uses WHERE prompt_id = p.id), 0) * 3
      ) as score
    FROM prompts p
    LEFT JOIN users u ON u.id = p.creator_id
    LEFT JOIN prompt_tags pt ON pt.prompt_id = p.id
    LEFT JOIN prompt_ratings pr ON pr.prompt_id = p.id AND pr.created_at > ?
    WHERE p.visibility = 'public'
    GROUP BY p.id
    ORDER BY score DESC, p.view_count DESC
    LIMIT ?
  `).all(...(user ? [user.id, since, limit] : [since, limit])) as PromptRow[];

  return c.json(rows.map(row => ({
    ...row,
    tag_ids: row.tag_ids ? row.tag_ids.split(',').map(Number) : [],
    like_count: row.like_count ?? 0,
    dislike_count: row.dislike_count ?? 0,
    requirements: row.requirements ? JSON.parse(row.requirements) : undefined,
  })));
});
