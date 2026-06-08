import { Hono } from 'hono';
import { leaderboardService, type Period } from '../services/leaderboard.service.js';

export const leaderboardRouter = new Hono();

const VALID_PERIODS: Period[] = ['day', 'week', 'month', 'year', 'all'];

leaderboardRouter.get('/', (c) => {
  const period = (c.req.query('period') ?? 'month') as Period;
  if (!VALID_PERIODS.includes(period)) return c.json({ error: 'Invalid period' }, 400);

  const ref = c.req.query('ref') ? new Date(c.req.query('ref')!) : new Date();
  if (isNaN(ref.getTime())) return c.json({ error: 'Invalid ref date' }, 400);

  const entries = leaderboardService.getLeaderboard(period, ref);
  return c.json(entries);
});

leaderboardRouter.get('/active-badges', (c) => {
  const map = leaderboardService.getActiveBadgesMap();
  const result: Record<number, 1 | 2 | 3> = {};
  for (const [userId, rank] of map) result[userId] = rank;
  return c.json(result);
});
