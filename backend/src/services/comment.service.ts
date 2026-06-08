import { db } from '../db/client.js';
import type { CommentRow, CommentThread } from '../types/index.js';
import { leaderboardService } from './leaderboard.service.js';

function rowToThread(row: CommentRow): CommentThread {
  return {
    id: row.id,
    prompt_id: row.prompt_id,
    parent_id: row.parent_id,
    body: row.body,
    author: row.author,
    author_badge: (row.author_badge as 1 | 2 | 3 | null) ?? null,
    created_at: row.created_at,
    upvotes: row.upvotes,
    downvotes: row.downvotes,
    user_vote: (row.user_vote as 'up' | 'down' | null) ?? null,
    replies: [],
  };
}

export const commentService = {
  list(promptId: number, userId: number | null): CommentThread[] {
    const uid = userId ?? 0;
    const { year, month } = { year: leaderboardService.getActiveBadgeYear(), month: leaderboardService.getActiveBadgeMonth() };
    leaderboardService.ensureBadgesAssigned(year, month);

    const rows = db.prepare(`
      SELECT
        c.id, c.prompt_id, c.parent_id, c.body, c.created_at,
        u.username AS author,
        (SELECT rank FROM user_badges WHERE user_id = c.user_id AND year = ? AND month = ?) AS author_badge,
        COUNT(CASE WHEN cv.vote = 'up' THEN 1 END) AS upvotes,
        COUNT(CASE WHEN cv.vote = 'down' THEN 1 END) AS downvotes,
        (SELECT cv2.vote FROM comment_votes cv2 WHERE cv2.comment_id = c.id AND cv2.user_id = ?) AS user_vote
      FROM prompt_comments c
      JOIN users u ON u.id = c.user_id
      LEFT JOIN comment_votes cv ON cv.comment_id = c.id
      WHERE c.prompt_id = ?
      GROUP BY c.id
      ORDER BY c.created_at ASC
    `).all(year, month, uid, promptId) as CommentRow[];

    const byId = new Map<number, CommentThread>();
    const topLevel: CommentThread[] = [];

    for (const row of rows) {
      byId.set(row.id, rowToThread(row));
    }
    for (const row of rows) {
      const item = byId.get(row.id)!;
      if (row.parent_id) {
        byId.get(row.parent_id)?.replies.push(item);
      } else {
        topLevel.push(item);
      }
    }

    return topLevel;
  },

  create(promptId: number, userId: number, body: string, parentId?: number): CommentThread {
    const info = db.prepare(
      'INSERT INTO prompt_comments (prompt_id, user_id, parent_id, body) VALUES (?, ?, ?, ?)'
    ).run(promptId, userId, parentId ?? null, body);
    const id = Number(info.lastInsertRowid);
    const { year, month } = { year: leaderboardService.getActiveBadgeYear(), month: leaderboardService.getActiveBadgeMonth() };
    const row = db.prepare(`
      SELECT c.id, c.prompt_id, c.parent_id, c.body, c.created_at,
             u.username AS author,
             (SELECT rank FROM user_badges WHERE user_id = c.user_id AND year = ? AND month = ?) AS author_badge,
             0 AS upvotes, 0 AS downvotes, NULL AS user_vote
      FROM prompt_comments c
      JOIN users u ON u.id = c.user_id
      WHERE c.id = ?
    `).get(year, month, id) as CommentRow;

    // Notify parent comment author on reply (not self-replies)
    if (parentId) {
      const parent = db.prepare('SELECT user_id FROM prompt_comments WHERE id = ?').get(parentId) as { user_id: number } | undefined;
      if (parent && parent.user_id !== userId) {
        db.prepare(`
          INSERT OR IGNORE INTO notifications (user_id, type, actor_id, entity_id, entity_type)
          VALUES (?, 'comment_reply', ?, ?, 'comment')
        `).run(parent.user_id, userId, id);
      }
    }

    return rowToThread(row);
  },

  vote(commentId: number, userId: number, vote: 'up' | 'down'): void {
    db.prepare(`
      INSERT INTO comment_votes (comment_id, user_id, vote, created_at)
      VALUES (?, ?, ?, unixepoch())
      ON CONFLICT(comment_id, user_id) DO UPDATE SET vote = excluded.vote, created_at = unixepoch()
    `).run(commentId, userId, vote);
  },

  removeVote(commentId: number, userId: number): void {
    db.prepare('DELETE FROM comment_votes WHERE comment_id = ? AND user_id = ?').run(commentId, userId);
  },

  delete(commentId: number, userId: number): boolean {
    const info = db.prepare(
      'DELETE FROM prompt_comments WHERE id = ? AND user_id = ?'
    ).run(commentId, userId);
    return info.changes > 0;
  },
};
