import { Hono } from 'hono';
import { db } from '../db/client.js';
import { leaderboardService } from '../services/leaderboard.service.js';
import { promptService } from '../services/prompt.service.js';
import { followsService } from '../services/follows.service.js';
import type { UserRow, PromptRow } from '../types/index.js';

export const usersRouter = new Hono();

usersRouter.get('/:username', (c) => {
  const { username } = c.req.param();
  const user = db.prepare('SELECT id, username, created_at FROM users WHERE username = ?').get(username) as Pick<UserRow, 'id' | 'username' | 'created_at'> | undefined;
  if (!user) return c.json({ error: 'User not found' }, 404);

  const badges = leaderboardService.getUserBadges(user.id);
  const activeBadge = leaderboardService.getActiveBadge(user.id);

  const promptRows = db.prepare(`
    SELECT p.*, u.username as creator_username,
      GROUP_CONCAT(pt.tag_id) as tag_ids,
      COUNT(CASE WHEN pr.rating = 'like' THEN 1 END) as like_count,
      COUNT(CASE WHEN pr.rating = 'dislike' THEN 1 END) as dislike_count,
      NULL as user_rating, NULL as requirements
    FROM prompts p
    LEFT JOIN users u ON u.id = p.creator_id
    LEFT JOIN prompt_tags pt ON pt.prompt_id = p.id
    LEFT JOIN prompt_ratings pr ON pr.prompt_id = p.id
    WHERE p.creator_id = ? AND p.visibility = 'public'
    GROUP BY p.id ORDER BY p.updated_at DESC
  `).all(user.id) as PromptRow[];

  const publicPrompts = promptRows.map((row) => ({
    ...row,
    tag_ids: row.tag_ids ? row.tag_ids.split(',').map(Number) : [],
    like_count: row.like_count ?? 0,
    dislike_count: row.dislike_count ?? 0,
    user_rating: null,
    requirements: undefined,
  }));

  const currentUser = c.get('user');
  const counts = followsService.getCounts(user.id);
  const is_following = currentUser ? followsService.isFollowing(currentUser.id, user.id) : false;

  return c.json({
    id: user.id,
    username: user.username,
    created_at: user.created_at,
    active_badge: activeBadge,
    badges,
    public_prompts: publicPrompts,
    follower_count: counts.followers,
    following_count: counts.following,
    is_following,
  });
});
