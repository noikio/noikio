const sessions = new Map<number, number>(); // userId -> lastSeen ms

function heartbeat(userId: number): void {
  sessions.set(userId, Date.now());
  const cutoff = Date.now() - 5 * 60 * 1000;
  for (const [uid, ts] of sessions) {
    if (ts < cutoff) sessions.delete(uid);
  }
}

function getOnlineUserIds(windowMs = 60_000): number[] {
  const cutoff = Date.now() - windowMs;
  return [...sessions.entries()]
    .filter(([, ts]) => ts >= cutoff)
    .map(([uid]) => uid);
}

export const presenceService = { heartbeat, getOnlineUserIds };
