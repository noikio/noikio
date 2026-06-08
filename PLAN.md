# Plan: Prompt Engineering Web App

## Context

Build a personal prompt manager as a web app inside this monorepo. The goal is a fast, simple tool for storing, searching, and executing prompts — with architecture that supports advanced features (version history, chaining, AI execution) without over-engineering v1. Simplicity of use is the top priority.

---

## Stack

| Layer     | Choice                                                     |
| --------- | ---------------------------------------------------------- |
| Frontend  | Angular 21+ (standalone components, Signals, no NgModules) |
| Styling   | Tailwind CSS (no component library)                        |
| Backend   | Hono + `@hono/node-server` (TypeScript)                    |
| Database  | SQLite via `better-sqlite3` (synchronous)                  |
| Search    | SQLite FTS5 (triggers keep index in sync)                  |
| Workspace | npm workspaces (root `package.json`)                       |

---

## Directory Layout

```
prompts/                    ← repo root (existing files untouched)
├── package.json            ← NEW: npm workspace root
├── PLAN.md                 ← this file
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example        ← ANTHROPIC_API_KEY, OPENAI_API_KEY
│   ├── data/prompts.db     ← gitignored SQLite file
│   └── src/
│       ├── index.ts        ← Hono app, port 3000
│       ├── db/
│       │   ├── client.ts   ← better-sqlite3 singleton
│       │   ├── schema.ts   ← CREATE TABLE + FTS5 triggers (runs on startup)
│       │   └── migrate.ts
│       ├── routes/
│       │   ├── index.ts    ← combines routers
│       │   ├── prompts.ts
│       │   ├── tags.ts
│       │   ├── versions.ts
│       │   ├── chains.ts
│       │   └── run.ts      ← AI execution (501 stub in v1)
│       ├── services/
│       │   ├── prompt.service.ts
│       │   ├── tag.service.ts
│       │   ├── version.service.ts
│       │   ├── chain.service.ts
│       │   └── ai.service.ts   ← Claude/OpenAI abstraction
│       └── types/index.ts      ← Zod schemas / shared DTOs
└── frontend/
    ├── package.json
    ├── angular.json
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── proxy.conf.json         ← /api → localhost:3000
    └── src/
        ├── main.ts             ← bootstrapApplication()
        ├── app.config.ts       ← provideRouter, provideHttpClient
        ├── app.routes.ts
        ├── styles.css          ← @tailwind directives
        ├── core/
        │   ├── api/            ← HttpClient service wrappers per resource
        │   ├── models/         ← TS interfaces
        │   └── utils/
        │       └── template-parser.ts  ← extractVariables, interpolate
        ├── shared/
        │   └── components/     ← tag-badge, copy-button, confirm-dialog
        ├── state/
        │   ├── prompt.store.ts ← Signal-based store
        │   ├── tag.store.ts
        │   └── search.store.ts
        └── features/
            ├── prompt-list/    ← route: /
            ├── prompt-detail/  ← route: /prompts/:id
            ├── prompt-editor/  ← route: /prompts/new, /prompts/:id/edit
            ├── tag-manager/    ← route: /tags
            └── chain-editor/   ← route: /chains (stub in v1)
```

---

## Database Schema (`backend/src/db/schema.ts`)

```sql
CREATE TABLE IF NOT EXISTS tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT '#6366f1',
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
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS prompt_chain_steps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chain_id INTEGER NOT NULL REFERENCES prompt_chains(id) ON DELETE CASCADE,
  prompt_id INTEGER NOT NULL REFERENCES prompts(id),
  step_order INTEGER NOT NULL,
  variable_map TEXT NOT NULL DEFAULT '{}',  -- JSON: output_var → next input_var
  UNIQUE (chain_id, step_order)
);

-- FTS5 (content table mode — no data duplication)
CREATE VIRTUAL TABLE IF NOT EXISTS prompts_fts USING fts5(
  title, content, description,
  content='prompts', content_rowid='id'
);

-- Sync triggers
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

-- Auto-snapshot on update (saves the OLD values = the previous state)
CREATE TRIGGER IF NOT EXISTS prompts_version_au
  AFTER UPDATE OF title, content, description ON prompts BEGIN
  INSERT INTO prompt_versions (prompt_id, version, title, content, description)
  VALUES (
    old.id,
    COALESCE((SELECT MAX(version) FROM prompt_versions WHERE prompt_id = old.id), 0) + 1,
    old.title, old.content, old.description
  );
END;
```

---

## API Routes (Hono, all under `/api`)

```
GET    /api/health

GET    /api/prompts                          ?q= ?tag= ?page= ?limit=
POST   /api/prompts                          { title, content, description, tagIds[] }
GET    /api/prompts/:id
PUT    /api/prompts/:id
DELETE /api/prompts/:id

GET    /api/tags
POST   /api/tags                             { name, color }
PUT    /api/tags/:id
DELETE /api/tags/:id

GET    /api/prompts/:id/versions
GET    /api/prompts/:id/versions/:vId
POST   /api/prompts/:id/versions/:vId/restore

GET    /api/chains
POST   /api/chains                           { name, description, steps[] }
GET    /api/chains/:id
PUT    /api/chains/:id
DELETE /api/chains/:id

POST   /api/run/prompt                       → 501 in v1
POST   /api/run/chain                        → 501 in v1
```

FTS search query:

```sql
SELECT p.*, GROUP_CONCAT(t.id) as tag_ids
FROM prompts_fts fts
JOIN prompts p ON p.id = fts.rowid
LEFT JOIN prompt_tags pt ON pt.prompt_id = p.id
LEFT JOIN tags t ON t.id = pt.tag_id
WHERE prompts_fts MATCH ?
GROUP BY p.id ORDER BY rank
LIMIT ? OFFSET ?
```

---

## Variable Templating Flow

Critical file: `frontend/src/core/utils/template-parser.ts`

```typescript
const VAR_RE = /\{\{\s*(\w+)\s*\}\}/g;

export function extractVariables(content: string): string[] {
  return [...new Set([...content.matchAll(VAR_RE)].map((m) => m[1]))];
}
export function interpolate(
  content: string,
  values: Record<string, string>,
): string {
  return content.replace(VAR_RE, (_, name) => values[name] ?? `{{${name}}}`);
}
```

In `PromptDetailComponent`:

- Calls `extractVariables(prompt.content)` → string[]
- If any exist → renders `TemplateFormComponent` (ReactiveForm, one control per variable)
- `rendered = computed(() => interpolate(content(), variableValues()))` — live preview
- `CopyButtonComponent` copies `rendered()` to clipboard

---

## Angular Routes

```
/                     → PromptListComponent    (lazy)
/prompts/new          → PromptEditorComponent  (lazy)
/prompts/:id          → PromptDetailComponent  (lazy)
/prompts/:id/edit     → PromptEditorComponent  (lazy)
/tags                 → TagManagerComponent    (lazy)
/chains               → ChainEditorComponent   (lazy, stub)
```

All via `loadComponent` in `app.routes.ts`. Signal stores injected via Angular DI. No NgModules.

---

## npm Packages

**Backend**

- `hono`, `@hono/node-server` — framework
- `better-sqlite3`, `@types/better-sqlite3` — SQLite
- `zod` — validation
- `tsx` — dev watch runner (no compile step in dev)
- `dotenv` — env vars
- `@anthropic-ai/sdk`, `openai` — AI (stubbed v1)

**Frontend**

- `@angular/core`, `@angular/common`, `@angular/forms`, `@angular/router`
- `tailwindcss`, `autoprefixer`, `postcss`
- `@tailwindcss/typography` — prose rendering for prompt preview

---

## Startup

```bash
# From repo root
npm install
npm run dev          # starts both servers concurrently

npm run dev:be       # Hono on :3000 only
npm run dev:fe       # Angular on :4200 only (proxies /api → :3000)
```

Root `package.json` uses npm workspaces + `concurrently`.

---

## Verification

1. `npm run dev` — both servers start without errors
2. `http://localhost:4200` — app loads
3. Create a prompt with `{{name}}` in content → variable form appears in detail view
4. Fill variable → copy button pastes interpolated text
5. Edit prompt → `GET /api/prompts/:id/versions` returns a version entry
6. Assign a tag → tag appears on prompt card in list view
7. Search by keyword → FTS returns correct results
8. `GET /api/health` → `{ ok: true }`
