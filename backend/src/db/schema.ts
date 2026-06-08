import { db } from './client.js';

export function initSchema(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      username TEXT UNIQUE NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS otp_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      code_hash TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      used INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      expires_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      color TEXT NOT NULL DEFAULT '#6366f1',
      is_system INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS prompts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS prompt_tags (
      prompt_id INTEGER NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
      tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
      PRIMARY KEY (prompt_id, tag_id)
    );

    CREATE TABLE IF NOT EXISTS prompt_versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      prompt_id INTEGER NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
      version INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      saved_at INTEGER NOT NULL DEFAULT (unixepoch()),
      UNIQUE (prompt_id, version)
    );

    CREATE TABLE IF NOT EXISTS prompt_chains (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      creator_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS prompt_chain_steps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chain_id INTEGER NOT NULL REFERENCES prompt_chains(id) ON DELETE CASCADE,
      prompt_id INTEGER NOT NULL REFERENCES prompts(id),
      step_order INTEGER NOT NULL,
      variable_map TEXT NOT NULL DEFAULT '{}',
      UNIQUE (chain_id, step_order)
    );

    CREATE VIRTUAL TABLE IF NOT EXISTS prompts_fts USING fts5(
      title, content, description,
      content='prompts', content_rowid='id'
    );

    CREATE TRIGGER IF NOT EXISTS prompts_ai AFTER INSERT ON prompts BEGIN
      INSERT INTO prompts_fts(rowid, title, content, description)
      VALUES (new.id, new.title, new.content, new.description);
    END;

    CREATE TRIGGER IF NOT EXISTS prompts_au AFTER UPDATE ON prompts BEGIN
      INSERT INTO prompts_fts(prompts_fts, rowid, title, content, description)
        VALUES ('delete', old.id, old.title, old.content, old.description);
      INSERT INTO prompts_fts(rowid, title, content, description)
        VALUES (new.id, new.title, new.content, new.description);
    END;

    CREATE TRIGGER IF NOT EXISTS prompts_ad AFTER DELETE ON prompts BEGIN
      INSERT INTO prompts_fts(prompts_fts, rowid, title, content, description)
        VALUES ('delete', old.id, old.title, old.content, old.description);
    END;

    CREATE TRIGGER IF NOT EXISTS prompts_version_au
      AFTER UPDATE OF title, content, description ON prompts BEGIN
      INSERT INTO prompt_versions (prompt_id, version, title, content, description)
      VALUES (
        old.id,
        COALESCE((SELECT MAX(version) FROM prompt_versions WHERE prompt_id = old.id), 0) + 1,
        old.title, old.content, old.description
      );
    END;

    CREATE TABLE IF NOT EXISTS prompt_ratings (
      prompt_id INTEGER NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      rating TEXT NOT NULL CHECK (rating IN ('like', 'dislike')),
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      PRIMARY KEY (prompt_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS prompt_comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      prompt_id INTEGER NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      parent_id INTEGER REFERENCES prompt_comments(id) ON DELETE CASCADE,
      body TEXT NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS comment_votes (
      comment_id INTEGER NOT NULL REFERENCES prompt_comments(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      vote TEXT NOT NULL CHECK (vote IN ('up', 'down')),
      PRIMARY KEY (comment_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS user_badges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      year INTEGER NOT NULL,
      month INTEGER NOT NULL,
      rank INTEGER NOT NULL CHECK (rank IN (1, 2, 3)),
      awarded_at INTEGER NOT NULL DEFAULT (unixepoch()),
      UNIQUE (year, month, rank)
    );
  `);

  // Safe column additions
  const promptCols = (db.pragma('table_info(prompts)') as { name: string }[]).map(c => c.name);
  if (!promptCols.includes('creator_id')) db.exec('ALTER TABLE prompts ADD COLUMN creator_id INTEGER REFERENCES users(id)');
  if (!promptCols.includes('visibility')) db.exec("ALTER TABLE prompts ADD COLUMN visibility TEXT NOT NULL DEFAULT 'private'");
  if (!promptCols.includes('requirements')) db.exec('ALTER TABLE prompts ADD COLUMN requirements TEXT');

  const userCols = (db.pragma('table_info(users)') as { name: string }[]).map(c => c.name);
  if (!userCols.includes('plan')) db.exec('ALTER TABLE users ADD COLUMN plan TEXT');

  const chainCols = (db.pragma('table_info(prompt_chains)') as { name: string }[]).map(c => c.name);
  if (!chainCols.includes('creator_id')) db.exec('ALTER TABLE prompt_chains ADD COLUMN creator_id INTEGER REFERENCES users(id) ON DELETE SET NULL');

  const cvCols = (db.pragma('table_info(comment_votes)') as { name: string }[]).map(c => c.name);
  if (!cvCols.includes('created_at')) db.exec('ALTER TABLE comment_votes ADD COLUMN created_at INTEGER NOT NULL DEFAULT 0');

  const tagCols = (db.pragma('table_info(tags)') as { name: string }[]).map(c => c.name);
  if (!tagCols.includes('is_system')) db.exec('ALTER TABLE tags ADD COLUMN is_system INTEGER NOT NULL DEFAULT 0');

  const defaultTags = [
    { name: 'Software Engineering', color: '#6366f1' },
    { name: 'Backend', color: '#0ea5e9' },
    { name: 'Frontend', color: '#ec4899' },
    { name: 'API Design', color: '#14b8a6' },
    { name: 'Debugging', color: '#f59e0b' },
    { name: 'Testing', color: '#22c55e' },
    { name: 'DevOps', color: '#8b5cf6' },
    { name: 'Database', color: '#06b6d4' },
    { name: 'Security', color: '#ef4444' },
    { name: 'Performance', color: '#84cc16' },
    { name: 'Refactoring', color: '#a855f7' },
    { name: 'Documentation', color: '#64748b' },
  ];
  const upsertDefaultTag = db.prepare(`
    INSERT INTO tags (name, color, is_system)
    VALUES (?, ?, 1)
    ON CONFLICT(name) DO UPDATE SET is_system = 1
  `);
  for (const tag of defaultTags) upsertDefaultTag.run(tag.name, tag.color);

  db.exec('CREATE TABLE IF NOT EXISTS custom_platforms (name TEXT PRIMARY KEY NOT NULL)');

  db.exec(`
    CREATE TABLE IF NOT EXISTS user_follows (
      follower_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      following_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      PRIMARY KEY (follower_id, following_id),
      CHECK (follower_id != following_id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL CHECK (type IN ('new_follower', 'prompt_liked', 'comment_reply', 'badge_awarded')),
      actor_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      entity_id INTEGER,
      entity_type TEXT,
      read INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS bookmarks (
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      prompt_id INTEGER NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      PRIMARY KEY (user_id, prompt_id)
    );

    CREATE TABLE IF NOT EXISTS prompt_vem_uses (
      prompt_id INTEGER NOT NULL PRIMARY KEY REFERENCES prompts(id) ON DELETE CASCADE,
      count INTEGER NOT NULL DEFAULT 0
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS prompt_run_tokens (
      token TEXT PRIMARY KEY,
      prompt_id INTEGER NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      creator_username TEXT NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );
  `);

  // Safe column additions for new features
  const promptColsV2 = (db.pragma('table_info(prompts)') as { name: string }[]).map(c => c.name);
  if (!promptColsV2.includes('view_count')) db.exec('ALTER TABLE prompts ADD COLUMN view_count INTEGER NOT NULL DEFAULT 0');
  if (!promptColsV2.includes('forked_from_id')) db.exec('ALTER TABLE prompts ADD COLUMN forked_from_id INTEGER REFERENCES prompts(id) ON DELETE SET NULL');
  if (!promptColsV2.includes('fork_count')) db.exec('ALTER TABLE prompts ADD COLUMN fork_count INTEGER NOT NULL DEFAULT 0');
}
