# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Repo Is

A monorepo with two concerns:

1. **Prompt Manager Web App** — a personal tool for storing, searching, and executing prompts. Full spec in `PLAN.md`.
2. **Design Skills** — AI agent skills (prompts + scripts + reference docs) for brand identity, design systems, UI styling, logos, CIP mockups, presentations, banners, and social media images.

---

## Web App Stack

| Layer     | Choice                                                     |
| --------- | ---------------------------------------------------------- |
| Frontend  | Angular 21+ (standalone components, Signals, no NgModules) |
| Styling   | Tailwind CSS (no component library)                        |
| Backend   | Hono + `@hono/node-server` (TypeScript)                    |
| Database  | SQLite via `better-sqlite3` (synchronous)                  |
| Search    | SQLite FTS5 (triggers keep index in sync)                  |
| Workspace | npm workspaces (root `package.json`)                       |

### Dev Commands

```bash
npm install          # from repo root
npm run dev          # starts both servers concurrently
npm run dev:be       # Hono on :3000 only
npm run dev:fe       # Angular on :4200 (proxies /api → :3000)
```

### Directory Layout

```
prompts/
├── package.json        ← npm workspace root
├── PLAN.md             ← full spec (schema, routes, components)
├── backend/
│   ├── src/
│   │   ├── index.ts    ← Hono app, port 3000
│   │   ├── db/         ← client.ts, schema.ts (FTS5 + triggers), migrate.ts
│   │   ├── routes/     ← prompts, tags, versions, chains, run
│   │   └── services/   ← prompt, tag, version, chain, ai services
│   └── data/prompts.db ← gitignored SQLite file
└── frontend/
    └── src/
        ├── core/       ← api wrappers, models, template-parser.ts
        ├── shared/     ← tag-badge, copy-button, confirm-dialog
        ├── state/      ← Signal stores (prompt, tag, search)
        └── features/   ← prompt-list, prompt-detail, prompt-editor, tag-manager, chain-editor
```

### Key Details

- Template variables use `{{name}}` syntax — see `frontend/src/core/utils/template-parser.ts`
- `/api/run/*` endpoints are 501 stubs in v1
- Version history is auto-snapshotted via SQLite trigger on prompt update
- See `PLAN.md` for full DB schema, API routes, and verification checklist

### Environment Setup

```bash
export ANTHROPIC_API_KEY="your-key"   # for AI execution (v1 stub)
export OPENAI_API_KEY="your-key"      # optional
```

---

## Code Conventions

### Angular (Frontend)

- **Standalone components only** — `standalone: true` on every component. No NgModules ever.
- **Signals for state** — use `signal()`, `computed()`, `effect()`. Never RxJS Observables in state stores.
- **`inject()` function** — never constructor injection.
- **Named exports only** — no `export default` anywhere.
- **Lazy routes** — all routes use `loadComponent`, never `component:`.
- **One component per file.**
- **File naming** — `kebab-case.component.ts`, `kebab-case.store.ts`, `kebab-case.service.ts`
- **HttpClient** — wrap in `core/api/` services; components never call `HttpClient` directly.

Example component shape:
```typescript
import { Component, inject, signal, computed } from '@angular/core';

@Component({
  selector: 'app-example',
  standalone: true,
  imports: [...],
  template: `...`,
})
export class ExampleComponent {
  private readonly store = inject(PromptStore);
  readonly items = this.store.items;
}
```

### Hono Backend

- **Routes** (`routes/`) — validation + HTTP only. No business logic.
- **Services** (`services/`) — all business logic. Return plain objects, never Hono Response.
- **Zod** — validate all incoming request bodies at the route boundary.
- **SQLite is synchronous** — never use `async/await` with `better-sqlite3` calls.
- **No `any`** — TypeScript strict mode throughout.

Example route shape:
```typescript
app.post('/', zValidator('json', CreatePromptSchema), (c) => {
  const body = c.req.valid('json');
  const result = promptService.create(body);
  return c.json(result, 201);
});
```

---

## Boundaries — Never Do These

- Never commit `.env` files or `data/prompts.db`
- Never add NgModules to the Angular app
- Never use RxJS Observables in Signal stores
- Never use `async/await` with `better-sqlite3` (it blocks the thread synchronously — that's intentional)
- Never use `export default` in TypeScript files
- Ask before changing the DB schema (may require a migration)

---

## vem (Agent Workflow Manager)

All agents in this repo use `vem` for session continuity. At the start of each session:

```bash
vem task list        # see active tasks
vem context show     # see project context
```

After code or content changes:

```bash
vem context set      # persist context updates
vem decision add     # record architectural decisions
vem finalize         # finalize any vem_update blocks (run immediately after producing one)
```

**Rule:** Never leave a `vem_update` block unfinalized. Use:
```bash
cat <<'EOF' | vem finalize --file /dev/stdin
{ ...vem_update JSON... }
EOF
```

---

## Design Skills Architecture

Skills live under `.agents/skills/<skill-name>/` and follow this layout:

```
SKILL.md            # Skill definition (frontmatter + instructions)
references/         # Reference docs loaded on demand
scripts/            # Automation scripts (Python or Node.js CJS)
data/               # CSV lookup tables for search/BM25
templates/          # Starter templates
```

`skills-lock.json` tracks installed skills (source repo + hash). Skills are sourced from GitHub (`nextlevelbuilder/ui-ux-pro-max-skill`).

### Available Skills

| Skill | Trigger | Purpose |
|-------|---------|---------|
| `ckm-brand` | Brand identity work | Voice, visual identity, asset validation, token sync |
| `ckm-design` | Design tasks | Logo, CIP, slides, banners, icons, social photos |
| `ckm-design-system` | Token/spec work | Design tokens, component specs, Tailwind integration |
| `ckm-ui-styling` | UI implementation | shadcn/ui + Tailwind CSS |
| `ckm-slides` | Presentations | HTML/CSS slide decks with Chart.js |
| `ckm-banner-design` | Banner creation | Social/ads/web/print banners |
| `ui-ux-pro-max` | General UI/UX | Comprehensive frontend design |

### Design Environment

```bash
export GEMINI_API_KEY="your-key"   # Required for logo/CIP/icon generation
pip install google-genai pillow    # Python deps for design scripts
```

### Brand Source of Truth

When brand guidelines are updated:
1. Edit `docs/brand-guidelines.md`
2. Run `node .agents/skills/ckm-brand/scripts/sync-brand-to-tokens.cjs` → updates `assets/design-tokens.json` and `assets/design-tokens.css`
3. Verify with `node .agents/skills/ckm-brand/scripts/inject-brand-context.cjs --json`
