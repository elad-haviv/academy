#!/bin/sh
# Runs first as root so it can fix ownership on the persistent volume, then
# drops to the unprivileged user. The /data volume predates this image (it was
# written by a root-running container), so a plain USER academy would fail to
# open the SQLite database with SQLITE_CANTOPEN.
set -e

if [ -d /data ]; then
  chown -R academy:academy /data 2>/dev/null || true
fi

exec su-exec academy "$@"
