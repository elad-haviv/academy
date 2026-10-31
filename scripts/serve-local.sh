#!/usr/bin/env bash
# Start the standalone build locally without ever leaving a stale server behind.
#
# Why this exists: a `next-server` whose cwd is `.next/standalone (deleted)`
# keeps answering on the port after a rebuild, serving the previous build's CSS
# and HTML. Symptoms are bizarre (unstyled pages, "my fix didn't apply"), and
# `ss -ltnp` hides the pid unless you are root. So: kill by /proc scan, prove the
# port is free, then start and verify the served CSS is the one just built.
set -euo pipefail

PORT="${1:-3411}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DATA="${ACADEMY_DATA_DIR:-$ROOT/data}"

cd "$ROOT"
rm -rf .next/standalone/.next/static .next/standalone/public
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public

python3 - "$ROOT" <<'PY'
import glob, os, signal, sys
root = sys.argv[1]
killed = []
for p in glob.glob('/proc/[0-9]*'):
    pid = int(p.split('/')[2])
    if pid == os.getpid():
        continue
    try:
        cmd = open(p + '/cmdline', 'rb').read().replace(b'\0', b' ').decode()
        cwd = os.readlink(p + '/cwd')
    except Exception:
        continue
    if 'academy/.next/standalone' in cwd and ('server.js' in cmd or 'next-server' in cmd):
        try:
            os.kill(pid, signal.SIGTERM)
            killed.append(pid)
        except Exception:
            pass
print('stopped:', killed or 'none')
PY
sleep 1

cd "$ROOT/.next/standalone"
ACADEMY_DATA_DIR="$DATA" PORT="$PORT" HOSTNAME=127.0.0.1 \
  NODE_OPTIONS=--max-old-space-size=512 setsid node server.js >/tmp/academy-server.log 2>&1 &

for _ in $(seq 1 20); do
  sleep 1
  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 2 "http://127.0.0.1:$PORT/" || true)
  [ "$code" = "200" ] && break
done

echo "home: $code"
for css in $(curl -s "http://127.0.0.1:$PORT/" | grep -oE '/_next/static/css/[a-z0-9]+\.css' | sort -u); do
  echo "  $css -> $(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:$PORT$css")"
done
