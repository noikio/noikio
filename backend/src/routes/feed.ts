import { Hono } from 'hono';
import { db } from '../db/client.js';
import type { PromptRow } from '../types/index.js';

export const feedRouter = new Hono();

// GET /api/feed?cursor=<id>&limit=20
// Returns prompts from followed users, falling back to trending for new/non-auth users
feedRouter.get('/', (c) => {
  const user = c.get('user');
  const limit = Math.min(Number(c.req.query('limit') ?? 20), 50);
  const cursor = c.req.query('cursor') ? Number(c.req.query('cursor')) : null;

  let rows: PromptRow[];

  if (user) {
    const hasFollows = !!(db.prepare('SELECT 1 FROM user_follows WHERE follower_id = ? LIMIT 1').get(user.id));

    if (hasFollows) {
      rows = db.prepare(`
        SELECT p.*, u.username as creator_username,
          GROUP_CONCAT(pt.tag_id) as tag_ids,
          COUNT(CASE WHEN pr.rating = 'like' THEN 1 END) as like_count,
          COUNT(CASE WHEN pr.rating = 'dislike' THEN 1 END) as dislike_count,
          (SELECT rating FROM prompt_ratings WHERE prompt_id = p.id AND user_id = ?) as user_rating
        FROM prompts p
        JOIN user_follows uf ON uf.following_id = p.creator_id AND uf.follower_id = ?
        LEFT JOIN users u ON u.id = p.creator_id
        LEFT JOIN prompt_tags pt ON pt.prompt_id = p.id
        LEFT JOIN prompt_ratings pr ON pr.prompt_id = p.id
        WHERE p.visibility = 'public' ${cursor ? 'AND p.id < ?' : ''}
        GROUP BY p.id
        ORDER BY p.created_at DESC
        LIMIT ?
      `).all(...(cursor ? [user.id, user.id, cursor, limit] : [user.id, user.id, limit])) as PromptRow[];
    } else {
      // Fallback to trending for users with no follows
      rows = getTrending(limit, cursor, user.id);
    }
  } else {
    rows = getTrending(limit, cursor, null);
  }

  return c.json({
    items: rows.map(row => ({
      ...row,
      tag_ids: row.tag_ids ? row.tag_ids.split(',').map(Number) : [],
      like_count: row.like_count ?? 0,
      dislike_count: row.dislike_count ?? 0,
      requirements: row.requirements ? JSON.parse(row.requirements) : undefined,
    })),
    next_cursor: rows.length === limit ? rows[rows.length - 1]?.id ?? null : null,
  });
});

function getTrending(limit: number, cursor: number | null, userId: number | null): PromptRow[] {
  const sevenDaysAgo = Math.floor(Date.now() / 1000) - 7 * 24 * 3600;
  return db.prepare(`
    SELECT p.*, u.username as creator_username,
      GROUP_CONCAT(pt.tag_id) as tag_ids,
      COUNT(CASE WHEN pr.rating = 'like' THEN 1 END) as like_count,
      COUNT(CASE WHEN pr.rating = 'dislike' THEN 1 END) as dislike_count,
      ${userId ? '(SELECT rating FROM prompt_ratings WHERE prompt_id = p.id AND user_id = ?)' : 'NULL'} as user_rating,
      (COUNT(CASE WHEN pr.rating = 'like' THEN 1 END) * 2 + p.view_count * 0.1) as score
    FROM prompts p
    LEFT JOIN users u ON u.id = p.creator_id
    LEFT JOIN prompt_tags pt ON pt.prompt_id = p.id
    LEFT JOIN prompt_ratings pr ON pr.prompt_id = p.id
    WHERE p.visibility = 'public' AND p.created_at > ? ${cursor ? 'AND p.id < ?' : ''}
    GROUP BY p.id
    ORDER BY score DESC, p.created_at DESC
    LIMIT ?
  `).all(...[...(userId ? [userId] : []), sevenDaysAgo, ...(cursor ? [cursor] : []), limit]) as PromptRow[];
}
