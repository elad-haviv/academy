# End-to-end checks (permissions, creator workflow, SSO)

These run against a **real server** over HTTP, not mocks of our own code. They
drive the actual server-action forms, read the SQLite file to confirm what
landed, and assert on the rendered HTML.

## Run

```bash
# 1. build once
NODE_OPTIONS=--max-old-space-size=2560 npm run build

# 2. start the app on a throwaway database
export E2E_DATA=/tmp/academy-e2e
rm -rf "$E2E_DATA" && mkdir -p "$E2E_DATA"
ACADEMY_DATA_DIR="$E2E_DATA" ACADEMY_ADMINS=tester@example.com \
  bash scripts/serve-local.sh 3430

# 3. point the suites at it
export E2E_BASE=http://127.0.0.1:3430 E2E_DB="$E2E_DATA/academy.db"
python3 tests/e2e/e2e_academy.py        # creator flow: draft -> submit -> approve -> public
python3 tests/e2e/e2e_academy_flows2.py # custom roles, overrides, lab validation gate
python3 tests/e2e/e2e_academy_flows3.py # a real learner session: deny/allow/deny
```

For SSO, a second server is needed with the endpoints pointed at the mock
provider (a fresh database per server — `serve-local.sh` stops any other
standalone server on the box, so run this one alone):

```bash
python3 tests/e2e/mock_google.py &                # listens on 3499

ACADEMY_DATA_DIR="$E2E_DATA" ACADEMY_ADMINS=tester@example.com \
APP_ORIGIN=http://127.0.0.1:3431 \
GOOGLE_CLIENT_ID=mock-client GOOGLE_CLIENT_SECRET=mock-secret \
GOOGLE_AUTH_URL=http://127.0.0.1:3499/auth \
GOOGLE_TOKEN_URL=http://127.0.0.1:3499/token \
GOOGLE_USERINFO_URL=http://127.0.0.1:3499/userinfo \
  bash scripts/serve-local.sh 3431

E2E_BASE=http://127.0.0.1:3431 E2E_DB="$E2E_DATA/academy.db" \
  python3 tests/e2e/e2e_academy_sso.py
```

## Notes

- The session cookie is `Secure`, so a plain cookie jar drops it over `http://`.
  `e2e_academy_lib.py` stores and replays `Set-Cookie` by hand and does not
  follow redirects, because the 303 carries both the destination and the cookie.
- Suites 2 and 3 depend on users created by suite 1 (`tester@example.com`,
  `learner@example.com`); run them in order on a fresh database.
- `GOOGLE_*_URL` exists only so this flow can be exercised locally; production
  leaves them unset and talks to Google.
