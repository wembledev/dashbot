# Dashbot

AI-enabled dashboard utility for your car, gadget, or browser.

Born during a commute — I was driving on FSD and wanted to chat with my [OpenClaw](https://openclaw.ai/) server at home to vibe code in traffic. That session produced a working real-time feedback dashboard, deployed to a subdomain and opened in my Tesla's browser. Dashbot takes that proof of concept and rebuilds it on proper foundations — with a plugin widget system so I can keep vibe-coding on future commutes, and open-sourced for anyone who wants to try it.

## Prerequisites

- Ruby 4.0.1
- Node.js 24+
- SQLite3

## Local development

```sh
# Install dependencies
bundle install
npm install

# Set up database
bin/rails db:prepare

# Start Rails + Vite dev servers
bin/dev
```

Or use the setup script, which does all of the above and starts the server:

```sh
bin/setup
```

## Running tests

```sh
# Rails tests (Minitest)
bin/rails test

# System tests (requires vite build first)
npx vite build && bin/rails test:system

# Frontend tests (Vitest)
npm test

# TypeScript type-check
npm run check

# Ruby linting
bin/rubocop

# Full CI suite
bin/ci
```

## Environment variables

Copy the example file and fill in values:

```sh
cp .env.example .env
```

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `DASHBOT_PASSWORD` | Yes (seed) | — | Password for the initial admin user |
| `RAILS_MASTER_KEY` | Yes (prod) | — | Decrypts `credentials.yml.enc` |
| `SECRET_KEY_BASE` | Alt to above | — | Alternative to master key for PaaS deployments |
| `PORT` | No | 3000 | Puma listen port |
| `RAILS_MAX_THREADS` | No | 3 | Thread pool size |
| `WEB_CONCURRENCY` | No | 1 | Puma worker processes |
| `SOLID_QUEUE_IN_PUMA` | No | — | Run background jobs in web process |
| `JOB_CONCURRENCY` | No | 1 | Solid Queue worker count |
| `RAILS_LOG_LEVEL` | No | info | Log verbosity |

## Production deployment

### Docker

Build the image:

```sh
docker build -t dashbot .
```

Run with required environment variables:

```sh
docker run -d \
  -p 80:80 \
  -e RAILS_MASTER_KEY=<your-master-key> \
  -e DASHBOT_PASSWORD=<your-password> \
  -v dashbot-storage:/rails/storage \
  --name dashbot \
  dashbot
```

The entrypoint runs `db:prepare` automatically on startup. To seed the initial admin user:

```sh
docker exec dashbot bin/rails db:seed
```

### Persistent storage

Dashbot uses SQLite, so the `storage/` directory must be persisted across container restarts. Mount a volume to `/rails/storage` as shown above.

### Health check

The `/up` endpoint returns 200 when the app is running and the database is available.

### PaaS notes

**Kamal** — The Dockerfile is compatible with Kamal out of the box. Add your deploy config in `config/deploy.yml`.

**Dokku** — Push the repo to your Dokku remote. Set env vars with `dokku config:set`. Mount persistent storage for SQLite with `dokku storage:mount`.

## Tech stack

- **Backend:** Rails 8.1, Ruby 4.0.1, SQLite3
- **Frontend:** React 19, TypeScript 5.9, Vite 7, Tailwind v4
- **Bridge:** Inertia.js
- **UI:** shadcn/ui (New York style), Lucide icons
- **Background jobs:** Solid Queue
- **Caching:** Solid Cache
- **Web server:** Puma + Thruster
