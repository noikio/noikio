import { randomBytes } from 'crypto';
import { db } from '../db/client.js';
import type { CreatePromptDto, UpdatePromptDto, PromptRow } from '../types/index.js';

function parseRequirements(raw: string | null) {
  if (!raw) return undefined;
  try { return JSON.parse(raw); } catch { return undefined; }
}

function toPrompt(row: PromptRow) {
  return {
    ...row,
    tag_ids: row.tag_ids ? row.tag_ids.split(',').map(Number) : [],
    requirements: parseRequirements(row.requirements),
    like_count: row.like_count ?? 0,
    dislike_count: row.dislike_count ?? 0,
    user_rating: row.user_rating ?? null,
  };
}

function escapeLike(value: string): string {
  return value.replace(/[%_\\]/g, '\\$&');
}

function ratingSubquery(withUser: boolean): string {
  return withUser
    ? '(SELECT rating FROM prompt_ratings WHERE prompt_id = p.id AND user_id = ?)'
    : 'NULL';
}

function baseSelect(withUser: boolean) {
  return `
    SELECT p.*,
      u.username as creator_username,
      GROUP_CONCAT(pt.tag_id) as tag_ids,
      COUNT(CASE WHEN pr.rating = 'like' THEN 1 END) as like_count,
      COUNT(CASE WHEN pr.rating = 'dislike' THEN 1 END) as dislike_count,
      ${ratingSubquery(withUser)} as user_rating,
      COALESCE((SELECT count FROM prompt_vem_uses WHERE prompt_id = p.id), 0) as vem_use_count
    FROM prompts p
    LEFT JOIN users u ON u.id = p.creator_id
    LEFT JOIN prompt_tags pt ON pt.prompt_id = p.id
    LEFT JOIN prompt_ratings pr ON pr.prompt_id = p.id
  `;
}

export const promptService = {
  list(q?: string, tagIds: number[] = [], userId?: number | null) {
    // Scope to owner's prompts + unclaimed legacy prompts
    const ownerSql = userId != null
      ? '(p.creator_id = ? OR p.creator_id IS NULL)'
      : 'p.creator_id IS NULL';
    const ownerParams: unknown[] = userId != null ? [userId] : [];

    if (q) {
      try {
        const rows = db.prepare(`
          SELECT p.*,
            u.username as creator_username,
            GROUP_CONCAT(pt.tag_id) as tag_ids,
            COUNT(CASE WHEN pr.rating = 'like' THEN 1 END) as like_count,
            COUNT(CASE WHEN pr.rating = 'dislike' THEN 1 END) as dislike_count,
            NULL as user_rating
          FROM prompts_fts fts
          JOIN prompts p ON p.id = fts.rowid
          LEFT JOIN users u ON u.id = p.creator_id
          LEFT JOIN prompt_tags pt ON pt.prompt_id = p.id
          LEFT JOIN prompt_ratings pr ON pr.prompt_id = p.id
          WHERE prompts_fts MATCH ? AND ${ownerSql}
          GROUP BY p.id ORDER BY rank
        `).all(`${q}*`, ...ownerParams) as PromptRow[];
        const result = rows.map(toPrompt);
        return tagIds.length > 0
          ? result.filter((p) => tagIds.some((tagId) => p.tag_ids.includes(tagId)))
          : result;
      } catch {
        return [];
      }
    }

    if (tagIds.length > 0) {
      const placeholders = tagIds.map(() => '?').join(', ');
      const rows = db.prepare(`
        ${baseSelect(false)}
        WHERE p.id IN (SELECT prompt_id FROM prompt_tags WHERE tag_id IN (${placeholders}))
          AND ${ownerSql}
        GROUP BY p.id ORDER BY p.updated_at DESC
      `).all(...tagIds, ...ownerParams) as PromptRow[];
      return rows.map(toPrompt);
    }

    const rows = db.prepare(`
      ${baseSelect(false)}
      WHERE ${ownerSql}
      GROUP BY p.id ORDER BY p.updated_at DESC
    `).all(...ownerParams) as PromptRow[];
    return rows.map(toPrompt);
  },

  listPublic(
    q?: string,
    platforms: string[] = [],
    userId?: number | null,
    tagIds: number[] = [],
    skills: string[] = [],
    mcps: string[] = [],
    clauseMode: 'and' | 'or' = 'and',
  ) {
    const normalizedPlatforms = new Set(platforms.map((v) => v.toLowerCase()));
    const normalizedSkills = new Set(skills.map((v) => v.toLowerCase()));
    const normalizedMcps = new Set(mcps.map((v) => v.toLowerCase()));
    const postFilter = (result: ReturnType<typeof toPrompt>[]) => {
      return result.filter((p) => {
        const groupMatches: boolean[] = [];
        if (normalizedPlatforms.size > 0) {
          groupMatches.push(
            p.requirements?.platforms?.some((value: string) => normalizedPlatforms.has(value.toLowerCase())) ?? false,
          );
        }
        if (tagIds.length > 0) {
          groupMatches.push(tagIds.some((tagId) => p.tag_ids.includes(tagId)));
        }
        if (normalizedSkills.size > 0) {
          groupMatches.push(
            p.requirements?.skills?.some((value: string) => normalizedSkills.has(value.toLowerCase())) ?? false,
          );
        }
        if (normalizedMcps.size > 0) {
          groupMatches.push(
            p.requirements?.mcpServers?.some((value: string) => normalizedMcps.has(value.toLowerCase())) ?? false,
          );
        }
        if (groupMatches.length === 0) return true;
        return clauseMode === 'or' ? groupMatches.some(Boolean) : groupMatches.every(Boolean);
      });
    };

    if (q) {
      const withUser = userId != null;
      try {
        const rows = db.prepare(`
          SELECT p.*,
            u.username as creator_username,
            GROUP_CONCAT(pt.tag_id) as tag_ids,
            COUNT(CASE WHEN pr.rating = 'like' THEN 1 END) as like_count,
            COUNT(CASE WHEN pr.rating = 'dislike' THEN 1 END) as dislike_count,
            ${ratingSubquery(withUser)} as user_rating,
            COALESCE((SELECT count FROM prompt_vem_uses WHERE prompt_id = p.id), 0) as vem_use_count
          FROM prompts_fts fts
          JOIN prompts p ON p.id = fts.rowid
          LEFT JOIN users u ON u.id = p.creator_id
          LEFT JOIN prompt_tags pt ON pt.prompt_id = p.id
          LEFT JOIN prompt_ratings pr ON pr.prompt_id = p.id
          WHERE prompts_fts MATCH ? AND p.visibility = 'public'
          GROUP BY p.id ORDER BY rank
        `).all(...(withUser ? [userId, `${q}*`] : [`${q}*`])) as PromptRow[];
        return postFilter(rows.map(toPrompt));
      } catch {
        return [];
      }
    }

    const whereClauses: string[] = ['p.visibility = \'public\''];
    const params: unknown[] = [];

    if (clauseMode === 'and' && platforms.length > 0) {
      whereClauses.push(`(${platforms.map(() => "p.requirements LIKE ? ESCAPE '\\'").join(' OR ')})`);
      params.push(...platforms.map((value) => `%"${escapeLike(value)}"%`));
    }
    if (clauseMode === 'and' && tagIds.length > 0) {
      const placeholders = tagIds.map(() => '?').join(', ');
      whereClauses.push(`p.id IN (SELECT prompt_id FROM prompt_tags WHERE tag_id IN (${placeholders}))`);
      params.push(...tagIds);
    }
    if (clauseMode === 'and' && skills.length > 0) {
      whereClauses.push(`(${skills.map(() => "p.requirements LIKE ? ESCAPE '\\'").join(' OR ')})`);
      params.push(...skills.map((value) => `%${escapeLike(value)}%`));
    }
    if (clauseMode === 'and' && mcps.length > 0) {
      whereClauses.push(`(${mcps.map(() => "p.requirements LIKE ? ESCAPE '\\'").join(' OR ')})`);
      params.push(...mcps.map((value) => `%${escapeLike(value)}%`));
    }

    const withUser = userId != null;
    const rows = db.prepare(`
      ${baseSelect(withUser)}
      WHERE ${whereClauses.join(' AND ')}
      GROUP BY p.id ORDER BY p.updated_at DESC
    `).all(...(withUser ? [userId, ...params] : params)) as PromptRow[];
    // Post-filter skill/mcp to avoid false positives from LIKE on full JSON
    return postFilter(rows.map(toPrompt));
  },

  listPublicOptions() {
    const rows = db.prepare(
      'SELECT requirements FROM prompts WHERE visibility = \'public\' AND requirements IS NOT NULL'
    ).all() as { requirements: string }[];
    const skills = new Set<string>();
    const mcps = new Set<string>();
    for (const row of rows) {
      try {
        const r = JSON.parse(row.requirements);
        if (Array.isArray(r.skills)) r.skills.forEach((s: string) => skills.add(s));
        if (Array.isArray(r.mcpServers)) r.mcpServers.forEach((m: string) => mcps.add(m));
      } catch { /* skip malformed */ }
    }
    return { skills: [...skills].sort(), mcps: [...mcps].sort() };
  },

  getById(id: number, userId: number | null) {
    const withUser = userId != null;
    const row = db.prepare(`
      SELECT p.*,
        u.username as creator_username,
        GROUP_CONCAT(pt.tag_id) as tag_ids,
        COUNT(CASE WHEN pr.rating = 'like' THEN 1 END) as like_count,
        COUNT(CASE WHEN pr.rating = 'dislike' THEN 1 END) as dislike_count,
        ${withUser ? '(SELECT rating FROM prompt_ratings WHERE prompt_id = p.id AND user_id = ?)' : 'NULL'} as user_rating,
        ${withUser ? '(SELECT 1 FROM bookmarks WHERE prompt_id = p.id AND user_id = ?)' : '0'} as bookmarked,
        COALESCE((SELECT count FROM prompt_vem_uses WHERE prompt_id = p.id), 0) as vem_use_count
      FROM prompts p
      LEFT JOIN users u ON u.id = p.creator_id
      LEFT JOIN prompt_tags pt ON pt.prompt_id = p.id
      LEFT JOIN prompt_ratings pr ON pr.prompt_id = p.id
      WHERE p.id = ?
      GROUP BY p.id
    `).get(...(withUser ? [userId, userId, id] : [id])) as PromptRow | undefined;
    if (!row) return null;
    return {
      ...toPrompt(row),
      bookmarked: Boolean(row.bookmarked),
      vem_use_count: row.vem_use_count ?? 0,
    };
  },

  create(dto: CreatePromptDto, creatorId?: number) {
    const result = db.prepare(
      'INSERT INTO prompts (title, content, description, visibility, requirements, creator_id) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(
      dto.title,
      dto.content,
      dto.description,
      dto.visibility,
      dto.requirements ? JSON.stringify(dto.requirements) : null,
      creatorId ?? null,
    );
    const id = result.lastInsertRowid as number;
    if (dto.tagIds.length > 0) setTags(id, dto.tagIds);
    return this.getById(id, creatorId ?? null)!;
  },

  update(id: number, dto: UpdatePromptDto) {
    const existing = this.getById(id, null);
    if (!existing) return null;

    const title = dto.title ?? existing.title;
    const content = dto.content ?? existing.content;
    const description = dto.description ?? existing.description;
    const visibility = dto.visibility ?? existing.visibility;
    const requirements = dto.requirements !== undefined
      ? (dto.requirements ? JSON.stringify(dto.requirements) : null)
      : (existing.requirements ? JSON.stringify(existing.requirements) : null);

    db.prepare(
      'UPDATE prompts SET title = ?, content = ?, description = ?, visibility = ?, requirements = ?, updated_at = unixepoch() WHERE id = ?'
    ).run(title, content, description, visibility, requirements, id);

    if (dto.tagIds !== undefined) setTags(id, dto.tagIds);

    return this.getById(id, null)!;
  },

  delete(id: number) {
    const result = db.prepare('DELETE FROM prompts WHERE id = ?').run(id);
    return result.changes > 0;
  },

  generateRunToken(promptId: number, userId: number): { token: string } | null {
    const prompt = db.prepare(`
      SELECT p.id, p.title, p.content, p.visibility, p.creator_id, u.username as creator_username
      FROM prompts p LEFT JOIN users u ON u.id = p.creator_id
      WHERE p.id = ?
    `).get(promptId) as { id: number; title: string; content: string; visibility: string; creator_id: number | null; creator_username: string | null } | undefined;

    if (!prompt) return null;
    if (prompt.visibility === 'private' && prompt.creator_id !== userId) return null;

    // Purge expired tokens (older than 10 minutes) before inserting
    db.prepare('DELETE FROM prompt_run_tokens WHERE created_at < unixepoch() - 600').run();

    const token = randomBytes(32).toString('hex');
    db.prepare(`
      INSERT INTO prompt_run_tokens (token, prompt_id, title, content, creator_username)
      VALUES (?, ?, ?, ?, ?)
    `).run(token, promptId, prompt.title, prompt.content, prompt.creator_username ?? '');

    return { token };
  },

  exchangeRunToken(token: string): { id: number; title: string; content: string; creator_username: string } | null {
    // Purge expired first
    db.prepare('DELETE FROM prompt_run_tokens WHERE created_at < unixepoch() - 600').run();

    const row = db.prepare('SELECT * FROM prompt_run_tokens WHERE token = ?').get(token) as {
      token: string; prompt_id: number; title: string; content: string; creator_username: string;
    } | undefined;

    if (!row) return null;

    // Single-use: delete immediately
    db.prepare('DELETE FROM prompt_run_tokens WHERE token = ?').run(token);

    return { id: row.prompt_id, title: row.title, content: row.content, creator_username: row.creator_username };
  },
};

function setTags(promptId: number, tagIds: number[]): void {
  db.prepare('DELETE FROM prompt_tags WHERE prompt_id = ?').run(promptId);
  const insert = db.prepare('INSERT OR IGNORE INTO prompt_tags (prompt_id, tag_id) VALUES (?, ?)');
  for (const tagId of tagIds) insert.run(promptId, tagId);
}
