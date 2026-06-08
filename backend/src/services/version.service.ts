import { db } from '../db/client.js';
import type { VersionRow } from '../types/index.js';
import { promptService } from './prompt.service.js';

export const versionService = {
  list(promptId: number) {
    return db.prepare(
      'SELECT * FROM prompt_versions WHERE prompt_id = ? ORDER BY version DESC'
    ).all(promptId) as VersionRow[];
  },

  getById(promptId: number, versionId: number) {
    return db.prepare(
      'SELECT * FROM prompt_versions WHERE prompt_id = ? AND id = ?'
    ).get(promptId, versionId) as VersionRow | undefined;
  },

  restore(promptId: number, versionId: number) {
    const version = this.getById(promptId, versionId);
    if (!version) return null;
    return promptService.update(promptId, {
      title: version.title,
      content: version.content,
      description: version.description,
    });
  },
};
