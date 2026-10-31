# Haviv Academy

Hebrew-first (RTL) learning portal for hands-on technical labs — academy.haviv.pro.

> **Fresh start.** The previous build (catalog/tutorial portal, Next.js 14) was
> cleared on 2026-10-31 at Elad's request to rebuild from scratch. The code and
> history are still fully recoverable — see below.

## Recovering the previous version

Everything up to the wipe is in this repo's history, tagged:

```bash
git tag -l 'archive/*'                 # archive/pre-wipe-2026-10-31
git checkout archive/pre-wipe-2026-10-31
```

Off-repo backups of the same state (bundle + working tree + SQLite volume):

- `/opt/data/backups/academy-backup-20261031-061845/`
- Garage S3: `shared/backups/academy/academy-backup-20261031-061845/`

`academy.bundle` is a full clone: `git clone academy.bundle academy-restored`.

## Preserved outside git

- `data/` — the SQLite volume (users, enrollments, completions). Gitignored and
  never wiped; it is the only copy of real learner data.
