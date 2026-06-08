import { db } from '../db/client.js';
import type { LeaderboardEntry, BadgeRow } from '../types/index.js';

export type Period = 'day' | 'week' | 'month' | 'year' | 'all';

function getTimeWindow(period: Period, ref: Date): { start: number | null; end: number | null } {
  switch (period) {
    case 'day': {
      const start = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      return { start: Math.floor(start.getTime() / 1000), end: Math.floor(end.getTime() / 1000) };
    }
    case 'week': {
      const start = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());
      start.setDate(start.getDate() - start.getDay());
      const end = new Date(start);
      end.setDate(end.getDate() + 7);
      return { start: Math.floor(start.getTime() / 1000), end: Math.floor(end.getTime() / 1000) };
    }
    case 'month': {
      const start = new Date(ref.getFullYear(), ref.getMonth(), 1);
      const end = new Date(ref.getFullYear(), ref.getMonth() + 1, 1);
      return { start: Math.floor(start.getTime() / 1000), end: Math.floor(end.getTime() / 1000) };
    }
    case 'year': {
      const start = new Date(ref.getFullYear(), 0, 1);
      const end = new Date(ref.getFullYear() + 1, 0, 1);
      return { start: Math.floor(start.getTime() / 1000), end: Math.floor(end.getTime() / 1000) };
    }
    default:
      return { start: null, end: null };
  }
}

function computeScores(start: number | null, end: number | null): LeaderboardEntry[] {
  const startFilter = start !== null ? 'AND pr.created_at >= @start' : '';
  const endFilter = end !== null ? 'AND pr.created_at < @end' : '';
  const cvStartFilter = start !== null ? 'AND cv.created_at >= @start' : '';
  const cvEndFilter = end !== null ? 'AND cv.created_at < @end' : '';

  const rows = db.prepare(`
    WITH prompt_scores AS (
      SELECT p.creator_id AS user_id,
             SUM(CASE WHEN pr.rating = 'like' THEN 2 ELSE -1 END) AS score
      FROM prompt_ratings pr
      JOIN prompts p ON p.id = pr.prompt_id
      WHERE p.creator_id IS NOT NULL ${startFilter} ${endFilter}
      GROUP BY p.creator_id
    ),
    comment_scores AS (
      SELECT c.user_id,
             SUM(CASE WHEN cv.vote = 'up' THEN 1 ELSE -1 END) AS score
      FROM comment_votes cv
      JOIN prompt_comments c ON c.id = cv.comment_id
      WHERE 1=1 ${cvStartFilter} ${cvEndFilter}
      GROUP BY c.user_id
    ),
    combined AS (
      SELECT user_id, SUM(score) AS total_score
      FROM (
        SELECT user_id, score FROM prompt_scores
        UNION ALL
        SELECT user_id, score FROM comment_scores
      )
      GROUP BY user_id
    )
    SELECT u.id AS user_id, u.username,
           COALESCE(c.total_score, 0) AS total_score,
           (SELECT COUNT(*) FROM prompts WHERE creator_id = u.id AND visibility = 'public') AS prompt_count
    FROM combined c
    JOIN users u ON u.id = c.user_id
    WHERE c.total_score > 0
    ORDER BY total_score DESC, u.username ASC
    LIMIT 100
  `).all({ start: start ?? 0, end: end ?? 0 }) as Omit<LeaderboardEntry, 'rank'>[];

  return rows.map((r, i) => ({ ...r, rank: i + 1 }));
}

// Active badge period: current calendar month (badges awarded from last month's top 3)
function activeBadgePeriod(): { year: number; month: number } {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

function prevMonthOf(year: number, month: number): { year: number; month: number } {
  if (month === 1) return { year: year - 1, month: 12 };
  return { year, month: month - 1 };
}

export const leaderboardService = {
  getLeaderboard(period: Period, ref: Date = new Date()): LeaderboardEntry[] {
    const { start, end } = getTimeWindow(period, ref);
    return computeScores(start, end);
  },

  ensureBadgesAssigned(year: number, month: number): void {
    const existing = db.prepare(
      'SELECT COUNT(*) AS cnt FROM user_badges WHERE year = ? AND month = ?'
    ).get(year, month) as { cnt: number };
    if (existing.cnt > 0) return;

    const prev = prevMonthOf(year, month);
    const prevRef = new Date(prev.year, prev.month - 1, 15);
    const { start, end } = getTimeWindow('month', prevRef);
    const top3 = computeScores(start, end).slice(0, 3);

    const insert = db.prepare(
      'INSERT OR IGNORE INTO user_badges (user_id, year, month, rank) VALUES (?, ?, ?, ?)'
    );
    for (let i = 0; i < top3.length; i++) {
      insert.run(top3[i].user_id, year, month, i + 1);
    }
  },

  getActiveBadge(userId: number): 1 | 2 | 3 | null {
    const { year, month } = activeBadgePeriod();
    this.ensureBadgesAssigned(year, month);
    const row = db.prepare(
      'SELECT rank FROM user_badges WHERE user_id = ? AND year = ? AND month = ?'
    ).get(userId, year, month) as { rank: number } | undefined;
    return (row?.rank as 1 | 2 | 3) ?? null;
  },

  getActiveBadgeYear(): number { return activeBadgePeriod().year; },
  getActiveBadgeMonth(): number { return activeBadgePeriod().month; },

  getUserBadges(userId: number): BadgeRow[] {
    return db.prepare(
      'SELECT * FROM user_badges WHERE user_id = ? ORDER BY year DESC, month DESC'
    ).all(userId) as BadgeRow[];
  },

  getActiveBadgesMap(): Map<number, 1 | 2 | 3> {
    const { year, month } = activeBadgePeriod();
    this.ensureBadgesAssigned(year, month);
    const rows = db.prepare(
      'SELECT user_id, rank FROM user_badges WHERE year = ? AND month = ?'
    ).all(year, month) as { user_id: number; rank: 1 | 2 | 3 }[];
    const map = new Map<number, 1 | 2 | 3>();
    for (const r of rows) map.set(r.user_id, r.rank);
    return map;
  },
};
