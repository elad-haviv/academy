"""SSO flow: start -> mock Google -> callback -> session, linking and state checks."""
import os, pathlib, re, sqlite3, sys, importlib.util, urllib.request

LIB = pathlib.Path(__file__).with_name('e2e_academy_lib.py')
spec = importlib.util.spec_from_file_location('e2e', str(LIB))
lib = importlib.util.module_from_spec(spec)
spec.loader.exec_module(lib)
lib.BASE = os.environ.get('E2E_BASE', 'http://127.0.0.1:3431')
BASE, DB, COOKIES = lib.BASE, lib.DB, lib.COOKIES
get, post_form, action_forms, check, checks = lib.get, lib.post_form, lib.action_forms, lib.check, lib.checks


def sql(query, args=()):
    con = sqlite3.connect(DB)
    con.row_factory = sqlite3.Row
    rows = con.execute(query, args).fetchall()
    con.commit()
    con.close()
    return [dict(r) for r in rows]


# 1. login page advertises SSO only when credentials exist
status, html, _ = get('/login')
check('login page shows the Google button', 'כניסה עם Google' in html, status)

# 2. start: sets the state cookie and redirects to the (mock) provider
COOKIES.clear()
status, html, _ = get('/auth/google/start', follow=False)
check('start redirects to the provider', status in (302, 307), status)
check('start stores an oauth state cookie', 'academy_oauth_state' in COOKIES, list(COOKIES))

# 3. full round trip: start -> provider -> callback
loc = lib._request('/auth/google/start').headers.get('Location')
mock = lib._request_abs(loc)
callback_url = mock.headers.get('Location') or ''
callback_path = callback_url.replace('http://127.0.0.1:3431', '')
print('callback_url', callback_url)
status, html, url = get(callback_path)
check('callback lands on the app', status == 200, f'{status} {url}')
check('session issued after SSO', 'academy_session' in COOKIES, list(COOKIES))
user = sql("SELECT id, email, name, email_verified_at FROM users WHERE email = 'sso.user@example.com'")
check('user provisioned from the Google profile', len(user) == 1 and user[0]['email_verified_at'], user)
check('oauth link recorded', sql("SELECT provider FROM oauth_accounts WHERE provider_account_id = 'google-sub-1'"), None)
roles = sql("""SELECT r.slug FROM user_roles ur JOIN roles r ON r.id = ur.role_id
               WHERE ur.user_id = (SELECT id FROM users WHERE email='sso.user@example.com')""")
check('new SSO identity defaults to the consumer role', [r['slug'] for r in roles] == ['content_consumer'], roles)

status, html, url = get('/dashboard')
check('SSO session opens the dashboard', status == 200 and url == '/dashboard', f'{status} {url}')

# 4. second sign-in reuses the same account (no duplicate)
COOKIES.clear()
get('/auth/google/start', follow=False)
loc = lib._request('/auth/google/start').headers.get('Location')
cb = lib._request_abs(loc).headers.get('Location') or ''
get(cb.replace('http://127.0.0.1:3431', ''))
check('repeat sign-in does not duplicate the user',
      len(sql("SELECT id FROM users WHERE email='sso.user@example.com'")) == 1, None)

# 5. a forged/missing state is refused
COOKIES.clear()
status, html, url = get('/auth/google/callback?code=mock-code&state=forged', follow=True)
check('forged state is refused', 'error=sso_state' in url or 'sso_state' in html, f'{status} {url}')
check('forged state issues no session', 'academy_session' not in COOKIES, list(COOKIES))

print('\nSUMMARY:', sum(1 for _, ok in checks if ok), '/', len(checks), 'checks passed')
sys.exit(0 if all(ok for _, ok in checks) else 1)
