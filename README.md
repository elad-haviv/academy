# Haviv Academy

Hebrew-first, labs-first technical learning site for electrical and industrial work.
**The lab is the product; the courses are the shelf.**

Live: https://academy.haviv.pro · English shell: https://academy.haviv.pro/en

## Stack

Next.js 15 App Router · TypeScript · hand-written CSS (`src/app/globals.css`) · `node:sqlite` ·
`output: 'standalone'` · Docker on `node:26-alpine`. No Tailwind, no ORM, no auth framework.

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Hebrew home: hero, lab cards, shelf, pricing, employer band |
| `/labs`, `/labs/[slug]` | Lab front door: outcomes, failure modes, learner vs buyer roles |
| `/labs/[slug]/play` | Gated full-screen simulator embed |
| `/courses`, `/courses/[slug]`, `/courses/[slug]/[lesson]` | Shelf, syllabus, lesson reader |
| `/tutorials`, `/tutorials/[slug]` | Free writing — no signup |
| `/pricing` | ₪349/yr, ₪39/mo, free tier |
| `/for-employers` | Lead form → `waitlist` table |
| `/register`, `/login`, `/dashboard` | Accounts, 7-day trial, progress |
| `/en`, `/en/labs`, `/en/pricing`, `/en/for-employers` | English procurement shell |
| `/api/health` | DB + content + build diagnostics |
| `/sitemap.xml`, `/robots.txt`, `/icon.svg` | SEO |

## Access model

One function decides, `src/lib/access.ts`:

- Registration grants an `all` entitlement for 7 days (source `trial`), no card.
- `canAccess(user, 'lab:agl-field-course')` is what both the UI and the player check.
- A gated page still returns **200** with a real, formatted preview and a paywall block —
  never a 402, never blurred text. Gated lessons use `previewMarkdown()` so headings and code
  fences survive the cut.
- `correctnessOwner` + `validatedOn` are required before a lab can publish (`isPublishable`).

## Local development

```bash
npm install
npm run dev            # http://localhost:3000
npm run build && ./scripts/serve-local.sh 3411   # production-mode check
```

`scripts/serve-local.sh` exists for a reason: a stale `next-server` whose cwd is
`.next/standalone (deleted)` keeps answering after a rebuild and serves the *previous* build's
CSS. Symptoms look like "my fix didn't apply" or an unstyled page. The script kills any such
process by `/proc` scan, proves the port is free, starts, and verifies the served CSS hash.

## Data

`data/academy.db` (dev) / `/data/academy.db` (production volume) — 19 tables, canonical schema:
`users`, `sessions`, `entitlements`, `orders`, `courses`, `lessons`, `tutorials`, `completions`,
`lab_progress`, `waitlist`, `audit_log`, plus OAuth and email-token tables.

Lab definitions live in `content/labs/<slug>/lab.json` (Hebrew, plus `*En` fields for the English
shell). The AGL simulator itself is vendored at `public/lab-content/agl/`.

## Deploy

Push to `main`; the Coolify app builds the Dockerfile and serves `academy.haviv.pro`. The
entrypoint chowns `/data` and then drops to the `academy` user, because the volume predates this
image and was written by a root-running container.

## Recovering the previous version

Everything up to the 2026-10-31 wipe is still in history, tagged:

```bash
git tag -l 'archive/*'                 # archive/pre-wipe-2026-10-31
git checkout archive/pre-wipe-2026-10-31
```

Off-repo backups of the same state (bundle + working tree + SQLite volume):

- `/opt/data/backups/academy-backup-20261031-061845/`
- Garage S3: `shared/backups/academy/academy-backup-20261031-061845/`

`academy.bundle` is a full clone: `git clone academy.bundle academy-restored`.
