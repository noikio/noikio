import { db } from '../db/client.js';

function follow(followerId: number, followingId: number): void {
  db.prepare(`
    INSERT OR IGNORE INTO user_follows (follower_id, following_id) VALUES (?, ?)
  `).run(followerId, followingId);

  // Notify the followed user
  db.prepare(`
    INSERT INTO notifications (user_id, type, actor_id, entity_id, entity_type)
    VALUES (?, 'new_follower', ?, ?, 'user')
  `).run(followingId, followerId, followerId);
}

function unfollow(followerId: number, followingId: number): void {
  db.prepare('DELETE FROM user_follows WHERE follower_id = ? AND following_id = ?').run(followerId, followingId);
}

function isFollowing(followerId: number, followingId: number): boolean {
  return !!db.prepare('SELECT 1 FROM user_follows WHERE follower_id = ? AND following_id = ?').get(followerId, followingId);
}

function getFollowers(userId: number): { id: number; username: string; created_at: number }[] {
  return db.prepare(`
    SELECT u.id, u.username, uf.created_at
    FROM user_follows uf
    JOIN users u ON u.id = uf.follower_id
    WHERE uf.following_id = ?
    ORDER BY uf.created_at DESC
  `).all(userId) as { id: number; username: string; created_at: number }[];
}

function getFollowing(userId: number): { id: number; username: string; created_at: number }[] {
  return db.prepare(`
    SELECT u.id, u.username, uf.created_at
    FROM user_follows uf
    JOIN users u ON u.id = uf.following_id
    WHERE uf.follower_id = ?
    ORDER BY uf.created_at DESC
  `).all(userId) as { id: number; username: string; created_at: number }[];
}

function getCounts(userId: number): { followers: number; following: number } {
  const followers = (db.prepare('SELECT COUNT(*) as n FROM user_follows WHERE following_id = ?').get(userId) as { n: number }).n;
  const following = (db.prepare('SELECT COUNT(*) as n FROM user_follows WHERE follower_id = ?').get(userId) as { n: number }).n;
  return { followers, following };
}

export const followsService = { follow, unfollow, isFollowing, getFollowers, getFollowing, getCounts };
