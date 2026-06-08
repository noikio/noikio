# noikio — Sky-Rocket Feature Plan

## Context

noikio is a prompt community platform (Angular 21 + Hono/SQLite) that currently has a **retention problem**: users arrive, copy a prompt, and leave. There's no social loop pulling them back daily. The goal is to turn it into a platform people open every day — driven by a feed, community gravity, and a viral flywheel with **vem.dev** (the user's agent task manager/validator). The confirmed success metrics are **DAU growth + viral sharing**.

**What already exists (don't rebuild):**
- Comments + threaded replies + voting (`comments.ts`, `CommentsComponent`)
- Like/dislike on prompts (`ratings.ts`, `RatingComponent`)
- Leaderboard + monthly badges (`leaderboard.ts`, `LeaderboardComponent`)
- User profiles with badge history (`users.ts`, `UserProfileComponent`)
- Discover with advanced FTS5 filtering (`prompts.ts`, `DiscoverComponent`)
- Copy/share link button (`CopyButtonComponent`)
- OTP auth + sessions (`auth.ts`, `AuthStore`)

**Critical gap:** No follows, no feed, no notifications, no vem.dev bridge.

---

## Features — Ordered by DAU/Viral Impact

### Tier 1 — Core Social Loop (DAU engine)

#### 1. Follow System
- DB: `user_follows` table (`follower_id`, `following_id`, `created_at`)
- Backend: `POST/DELETE /api/users/:username/follow`, `GET /api/users/:username/followers`, `GET /api/users/:username/following`
- Frontend: Follow button on `UserProfileComponent` and prompt cards in Discover; follower/following counts on profile
- Reuse: `AuthStore` for current user, existing `user-api.service.ts`

#### 2. Home Feed (replaces "open noikio, see nothing new")
- New route `/feed` — personalized feed of new prompts from followed users + algorithmically ranked trending
- Backend: `GET /api/feed` — union of followed users' new public prompts + top trending (by like velocity), paginated
- Frontend: New `FeedComponent` with infinite scroll; cards reuse existing discover prompt card UI
- Fallback for new users (no follows yet): show trending/curated prompts

#### 3. Notifications
- DB: `notifications` table (`id`, `user_id`, `type`, `actor_id`, `entity_id`, `entity_type`, `read`, `created_at`)
- Types: `new_follower`, `prompt_liked`, `comment_reply`, `badge_awarded`
- Backend: `GET /api/notifications` (unread count + list), `POST /api/notifications/read`
- Frontend: Bell icon in navbar with unread badge; notification dropdown; clicking navigates to entity
- Trigger notifications on: follow, like, comment reply, badge award (in existing service logic)

#### 4. Bookmarks / Collections
- DB: `bookmarks` table (`user_id`, `prompt_id`, `created_at`)
- Backend: `POST/DELETE /api/prompts/:id/bookmark`, `GET /api/bookmarks`
- Frontend: Bookmark icon on prompt cards; `/bookmarks` route showing saved prompts
- Creates daily return behavior: "check my saved prompts"

---

### Tier 2 — Viral Mechanics

#### 5. vem.dev Bridge (the flywheel)
This is the highest-leverage viral feature. Every prompt on noikio gets a **"Run in vem.dev"** button that deep-links into vem.dev with the prompt pre-loaded. Conversely, vem.dev projects that use noikio prompts show attribution back.

- Frontend: "Run in vem.dev" CTA button on every `DiscoverDetailComponent` and prompt cards
- Deep-link format: `https://vem.dev/run?prompt_source=noikio&prompt_id=<id>` (coordinate URL schema with vem.dev)
- DB: `prompt_vem_uses` table (`prompt_id`, `count`) — incremented when deep-link is followed (tracks "Used by X vem.dev projects")
- Show "Used in X vem.dev projects" counter on prompt detail view (social proof)
- Attribution: noikio prompt embed card shown inside vem.dev project context

#### 6. Trending Page + View Counts
- DB: Add `view_count` column to `prompts` table; increment on `GET /api/prompts/public/:id`
- Backend: `GET /api/prompts/trending` — sorted by (likes + views) velocity over last 24h/7d
- Frontend: `/trending` route; tab on Discover page ("New" | "Trending" | "Top All Time")
- Trending feeds the feed fallback for new users and powers external sharing ("check what's trending")

#### 7. Prompt Fork ("Remix")
- Backend: `POST /api/prompts/:id/fork` — clones public prompt into authenticated user's library with `forked_from_id` reference
- DB: Add `forked_from_id` to `prompts` table
- Frontend: "Fork & Remix" button on discover detail; forked prompt editor opens pre-filled; source attribution shown ("Forked from @user")
- Viral: fork chains create attribution graphs; original gets "Forked X times" counter

#### 8. Rich Embed / Share Cards
- Backend: `GET /api/prompts/:id/og` — returns OpenGraph meta (title, description, like count, creator) for link previews
- Frontend: Each public prompt URL renders proper OG tags so Discord/Twitter/Slack unfurl a rich card
- Add social share buttons (X/Twitter, copy link) to discover detail view
- One well-shared prompt = hundreds of new visitors

---

### Tier 3 — Developer Hooks (DAU for power users)

#### 9. Public API
- `GET /api/v1/prompts` — public read-only API with API key auth
- Developers can fetch prompts programmatically → they build tools that reference noikio → they come back to add prompts → flywheel
- API key management: `POST /api/auth/api-keys`, listed in user profile settings
- Rate-limited by key (not IP)

#### 10. Prompt Collections (Packs)
- DB: `collections` table (`id`, `creator_id`, `name`, `description`, `visibility`) + `collection_prompts` join table
- Backend: CRUD for collections; `GET /api/collections/public`
- Frontend: `/collections` route; curated packs like "10 prompts for Claude agents" or "System prompt starter kit"
- Collections are highly shareable units (one link = multiple prompts)

#### 11. Weekly Community Challenges
- DB: `challenges` table (`id`, `title`, `description`, `start_date`, `end_date`, `theme`)
- `challenge_entries` table (`challenge_id`, `prompt_id`, `user_id`, `votes`)
- Backend: `GET /api/challenges/active`, `POST /api/challenges/:id/enter`
- Frontend: Challenge banner on landing + discover; challenge detail with ranked entries
- Drives: urgency (time-limited), sharing (vote for my entry), recurring visits (new challenge weekly)

---

## Implementation Order

1. **Follow system** → enables everything else
2. **Home feed** → the core DAU hook
3. **Notifications** → closes the engagement loop
4. **vem.dev bridge** → the viral flywheel (coordinate URL schema first)
5. **Trending + view counts** → feeds the feed and enables sharing
6. **Bookmarks** → deepens daily return habit
7. **Prompt fork/remix** → viral attribution graph
8. **Rich embed/OG cards** → makes every shared link work
9. **Public API** → developer retention
10. **Collections** → shareable bundles
11. **Challenges** → recurring community pulse

---

## Key Files to Modify

- `backend/src/db/schema.ts` — add tables (confirm before schema changes per CLAUDE.md)
- `backend/src/routes/` — new route files: `follows.ts`, `feed.ts`, `notifications.ts`, `bookmarks.ts`, `trending.ts`
- `backend/src/services/` — corresponding service files
- `frontend/src/features/` — new: `feed/`, `notifications/`, `bookmarks/`, `collections/`
- `frontend/src/shared/components/` — extend: follow button, bookmark icon, vem.dev CTA button
- `frontend/src/core/api/` — new API services for each feature
- `frontend/src/app/app.routes.ts` — add `/feed`, `/trending`, `/bookmarks`, `/collections` routes

---

## Verification

For each feature:
1. Run `npm run dev` (both servers)
2. Register two test accounts, follow one from the other
3. Verify feed shows followed user's new prompts
4. Verify notification bell shows unread count
5. Click "Run in vem.dev" — confirm deep-link URL is correct
6. Share a prompt URL in a Slack/Discord preview — confirm OG card renders
7. Fork a prompt — confirm attribution shows on the new prompt
8. Hit `/api/v1/prompts` with an API key — confirm response
