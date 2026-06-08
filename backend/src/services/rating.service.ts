import { db } from '../db/client.js';

export const ratingService = {
  set(promptId: number, userId: number, rating: 'like' | 'dislike'): void {
    db.prepare(`
      INSERT INTO prompt_ratings (prompt_id, user_id, rating)
      VALUES (?, ?, ?)
      ON CONFLICT(prompt_id, user_id) DO UPDATE SET rating = excluded.rating, created_at = unixepoch()
    `).run(promptId, userId, rating);

    // Notify prompt owner on like (not dislike, not self-likes)
    if (rating === 'like') {
      const prompt = db.prepare('SELECT creator_id FROM prompts WHERE id = ?').get(promptId) as { creator_id: number | null } | undefined;
      if (prompt?.creator_id && prompt.creator_id !== userId) {
        db.prepare(`
          INSERT OR IGNORE INTO notifications (user_id, type, actor_id, entity_id, entity_type)
          VALUES (?, 'prompt_liked', ?, ?, 'prompt')
        `).run(prompt.creator_id, userId, promptId);
      }
    }
  },

  remove(promptId: number, userId: number): void {
    db.prepare('DELETE FROM prompt_ratings WHERE prompt_id = ? AND user_id = ?').run(promptId, userId);
  },

  getCounts(promptId: number): { likes: number; dislikes: number } {
    const row = db.prepare(`
      SELECT
        COUNT(CASE WHEN rating = 'like' THEN 1 END) as likes,
        COUNT(CASE WHEN rating = 'dislike' THEN 1 END) as dislikes
      FROM prompt_ratings WHERE prompt_id = ?
    `).get(promptId) as { likes: number; dislikes: number };
    return row;
  },
};
