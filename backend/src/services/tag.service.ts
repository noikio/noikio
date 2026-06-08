import { db } from '../db/client.js';
import type { CreateTagDto, UpdateTagDto, TagRow } from '../types/index.js';

export const tagService = {
  list() {
    return db.prepare('SELECT * FROM tags ORDER BY is_system DESC, name').all() as TagRow[];
  },

  listDefaults() {
    return db.prepare('SELECT * FROM tags WHERE is_system = 1 ORDER BY name').all() as TagRow[];
  },

  suggest(q?: string, limit = 20) {
    if (!q?.trim()) {
      return db
        .prepare('SELECT * FROM tags ORDER BY is_system DESC, name LIMIT ?')
        .all(limit) as TagRow[];
    }
    const escaped = q.trim().toLowerCase().replace(/[%_\\]/g, '\\$&');
    const like = `%${escaped}%`;
    return db
      .prepare(`
        SELECT * FROM tags
        WHERE LOWER(name) LIKE ? ESCAPE '\\'
        ORDER BY is_system DESC, name
        LIMIT ?
      `)
      .all(like, limit) as TagRow[];
  },

  getById(id: number) {
    return db.prepare('SELECT * FROM tags WHERE id = ?').get(id) as TagRow | undefined;
  },

  create(dto: CreateTagDto) {
    const existing = db
      .prepare('SELECT id FROM tags WHERE LOWER(name) = LOWER(?)')
      .get(dto.name);
    if (existing) return { conflict: true as const };
    const result = db.prepare('INSERT INTO tags (name, color) VALUES (?, ?)').run(dto.name, dto.color);
    return this.getById(result.lastInsertRowid as number)!;
  },

  createOrGet(dto: CreateTagDto) {
    const existing = db
      .prepare('SELECT * FROM tags WHERE LOWER(name) = LOWER(?)')
      .get(dto.name) as TagRow | undefined;
    if (existing) return { tag: existing, created: false as const };
    const result = db.prepare('INSERT INTO tags (name, color) VALUES (?, ?)').run(dto.name, dto.color);
    return { tag: this.getById(result.lastInsertRowid as number)!, created: true as const };
  },

  update(id: number, dto: UpdateTagDto) {
    const existing = this.getById(id);
    if (!existing) return null;
    if (existing.is_system) return null;
    const name = dto.name ?? existing.name;
    const color = dto.color ?? existing.color;
    db.prepare('UPDATE tags SET name = ?, color = ? WHERE id = ?').run(name, color, id);
    return this.getById(id)!;
  },

  delete(id: number) {
    const existing = this.getById(id);
    if (!existing || existing.is_system) return false;
    const result = db.prepare('DELETE FROM tags WHERE id = ?').run(id);
    return result.changes > 0;
  },
};
