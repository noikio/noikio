import { createHash, randomBytes, randomInt } from 'crypto';
import { db } from '../db/client.js';
import type { UserRow } from '../types/index.js';

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function generateToken(): string {
  return randomBytes(32).toString('hex');
}

function generateOtp(): string {
  return String(randomInt(100000, 1000000));
}

export const authService = {
  register(email: string, username: string) {
    const existingEmail = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existingEmail) return { conflict: 'email' as const };

    const existingUsername = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (existingUsername) return { conflict: 'username' as const };

    const result = db.prepare('INSERT INTO users (email, username) VALUES (?, ?)').run(email, username);
    return db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid) as UserRow;
  },

  requestOtp(email: string): string | null {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as UserRow | undefined;
    if (!user) return null;

    // Invalidate previous unused OTPs
    db.prepare('UPDATE otp_codes SET used = 1 WHERE user_id = ? AND used = 0').run(user.id);

    const code = generateOtp();
    const expiresAt = Math.floor(Date.now() / 1000) + 600; // 10 minutes
    db.prepare('INSERT INTO otp_codes (user_id, code_hash, expires_at) VALUES (?, ?, ?)').run(
      user.id,
      hashToken(code),
      expiresAt,
    );

    return code;
  },

  verifyOtp(email: string, code: string): { token: string; user: UserRow } | null {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as UserRow | undefined;
    if (!user) return null;

    const now = Math.floor(Date.now() / 1000);
    const otp = db.prepare(
      'SELECT * FROM otp_codes WHERE user_id = ? AND code_hash = ? AND used = 0 AND expires_at > ? ORDER BY id DESC LIMIT 1'
    ).get(user.id, hashToken(code), now) as { id: number } | undefined;

    if (!otp) return null;

    db.prepare('UPDATE otp_codes SET used = 1 WHERE id = ?').run(otp.id);

    const token = generateToken();
    const expiresAt = now + 60 * 60 * 24 * 30; // 30 days
    // Store hash only — raw token returned to client, never persisted
    db.prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)').run(
      hashToken(token),
      user.id,
      expiresAt,
    );

    return { token, user };
  },

  logout(token: string): void {
    db.prepare('DELETE FROM sessions WHERE token = ?').run(hashToken(token));
  },

  getUserByToken(token: string): UserRow | null {
    const now = Math.floor(Date.now() / 1000);
    const row = db.prepare(`
      SELECT u.* FROM sessions s
      JOIN users u ON u.id = s.user_id
      WHERE s.token = ? AND s.expires_at > ?
    `).get(hashToken(token), now) as UserRow | undefined;
    return row ?? null;
  },
};
