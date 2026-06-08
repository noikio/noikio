import { db } from '../db/client.js';
import type { CreateChainDto, UpdateChainDto, ChainRow, ChainStepRow, UserRow } from '../types/index.js';

function hydrateSteps(chainId: number) {
  const rows = db.prepare(`
    SELECT cs.id, cs.chain_id, cs.prompt_id, cs.step_order, cs.variable_map,
           p.title as prompt_title, p.content as prompt_content
    FROM prompt_chain_steps cs
    JOIN prompts p ON p.id = cs.prompt_id
    WHERE cs.chain_id = ?
    ORDER BY cs.step_order
  `).all(chainId) as ChainStepRow[];

  return rows.map((r) => ({
    id: r.id,
    chain_id: r.chain_id,
    prompt_id: r.prompt_id,
    step_order: r.step_order,
    variable_map: JSON.parse(r.variable_map) as Record<string, string>,
    prompt: { id: r.prompt_id, title: r.prompt_title, content: r.prompt_content },
  }));
}

export const chainService = {
  list() {
    const rows = db.prepare(`
      SELECT c.*, COUNT(cs.id) as step_count
      FROM prompt_chains c
      LEFT JOIN prompt_chain_steps cs ON cs.chain_id = c.id
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `).all() as ChainRow[];
    return rows;
  },

  getById(id: number) {
    const chain = db.prepare('SELECT * FROM prompt_chains WHERE id = ?').get(id) as ChainRow | undefined;
    if (!chain) return null;
    return { ...chain, steps: hydrateSteps(id) };
  },

  create(dto: CreateChainDto, creatorId?: number) {
    const result = db.prepare(
      'INSERT INTO prompt_chains (name, description, creator_id) VALUES (?, ?, ?)'
    ).run(dto.name, dto.description, creatorId ?? null);
    const id = result.lastInsertRowid as number;
    setSteps(id, dto.steps);
    return this.getById(id)!;
  },

  update(id: number, dto: UpdateChainDto) {
    const existing = db.prepare('SELECT * FROM prompt_chains WHERE id = ?').get(id) as ChainRow | undefined;
    if (!existing) return null;
    const name = dto.name ?? existing.name;
    const description = dto.description ?? existing.description;
    db.prepare('UPDATE prompt_chains SET name = ?, description = ? WHERE id = ?').run(name, description, id);
    if (dto.steps !== undefined) setSteps(id, dto.steps);
    return this.getById(id)!;
  },

  delete(id: number) {
    const result = db.prepare('DELETE FROM prompt_chains WHERE id = ?').run(id);
    return result.changes > 0;
  },
};

function setSteps(chainId: number, steps: CreateChainDto['steps']): void {
  db.prepare('DELETE FROM prompt_chain_steps WHERE chain_id = ?').run(chainId);
  const insert = db.prepare(
    'INSERT INTO prompt_chain_steps (chain_id, prompt_id, step_order, variable_map) VALUES (?, ?, ?, ?)'
  );
  for (const step of steps) {
    insert.run(chainId, step.promptId, step.stepOrder, JSON.stringify(step.variableMap));
  }
}
