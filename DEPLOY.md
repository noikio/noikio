# Deployment Guide

## Platform: Railway (recommended)

Single-service deployment — Hono serves both the API (`/api/*`) and the Angular static frontend on one port.

### Steps

1. **Push to GitHub** — Railway deploys from a GitHub repo.

2. **Create a Railway project**
   - [railway.app](https://railway.app) → New Project → Deploy from GitHub repo
   - Select this repo; Railway auto-detects `railway.toml`

3. **Add a Volume for SQLite persistence**
   - In the Railway service → Storage → Add Volume
   - Mount path: `/app/backend/data`
   - This keeps `prompts.db` across deploys

4. **Set environment variables** in Railway service settings:
   ```
   NODE_ENV=production
   ANTHROPIC_API_KEY=sk-ant-...
   OPENAI_API_KEY=sk-...
   RESEND_API_KEY=re_...
   JWT_SECRET=<random 64-char string>
   ```

5. **Deploy** — Railway runs `npm install && npm run build` then `node backend/dist/index.js`.
   - Using `node` directly avoids `npm error signal SIGTERM` noise during normal container replacement.

6. **Generate domain** → Railway Settings → Networking → Generate Domain

---

## Alternative: Docker (Fly.io, Render, VPS)

A `Dockerfile` is included. Any platform that runs Docker works.

```bash
# Build and run locally
docker build -t prompts .
docker run -p 3000:3000 -v $(pwd)/data:/app/backend/data \
  -e NODE_ENV=production \
  -e ANTHROPIC_API_KEY=... \
  prompts
```

For Fly.io:
```bash
fly launch   # generates fly.toml
fly volumes create prompts_data --size 1
fly deploy
```

---

## Notes

- SQLite file lives at `/app/backend/data/prompts.db` inside the container
- The volume must be mounted there for persistence; without it the DB resets on each deploy
- In production, `NODE_ENV=production` must be set — this enables Hono to serve the Angular frontend
- During normal Railway rollouts, an old container can receive `SIGTERM` while the new one is healthy; this is expected lifecycle behavior.
