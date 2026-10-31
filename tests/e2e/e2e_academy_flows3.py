"""Flow 3: a real learner session — role-gated access, override grant, then revoke."""
import os
import hashlib, importlib.util, os, pathlib, sqlite3, sys

LIB = pathlib.Path(__file__).with_name('e2e_academy_lib.py')
spec = importlib.util.spec_from_file_location('e2e', str(LIB))
lib = importlib.util.module_from_spec(spec)
spec.loader.exec_module(lib)
BASE, DB, COOKIES = lib.BASE, lib.DB, lib.COOKIES
get, post_form, action_forms, check, checks = lib.get, lib.post_form, lib.action_forms, lib.check, lib.checks


def sql(query, args=()):
    con = sqlite3.connect(DB)
    con.row_factory = sqlite3.Row
    rows = con.execute(query, args).fetchall()
    con.commit()
    con.close()
    return [dict(r) for r in rows]


def scrypt_hash(password: str) -> str:
    salt = os.urandom(16).hex()
    digest = hashlib.scrypt(password.encode(), salt=salt.encode(), n=16384, r=8, p=1, dklen=64).hex()
    return f'scrypt${salt}${digest}'


def login(email, password):
    COOKIES.clear()
    status, html, _ = get('/login')
    aid = action_forms(html)[0][0]
    status, body, loc = post_form('/login', {'email': email, 'password': password, 'next': '/dashboard'}, aid)
    return status, loc


# a clean learner with a working password and no admin roles
sql("DELETE FROM user_roles WHERE user_id IN (SELECT id FROM users WHERE email='learner2@example.com')")
sql("DELETE FROM users WHERE email='learner2@example.com'")
con = sqlite3.connect(DB)
con.execute(
    "INSERT INTO users (email,name,password_hash,role,created_at) VALUES ('learner2@example.com','לומד שני',?, 'student', datetime('now'))",
    (scrypt_hash('learnerpass1'),),
)
con.commit()
learner_id = con.execute("SELECT id FROM users WHERE email='learner2@example.com'").fetchone()[0]
con.execute("INSERT INTO user_roles (user_id, role_id, created_at) SELECT ?, id, datetime('now') FROM roles WHERE slug='content_consumer'", (learner_id,))
con.commit()
con.close()

status, loc = login('learner2@example.com', 'learnerpass1')
check('learner logs in with a password', status in (303, 307) and 'academy_session' in COOKIES, f'{status} {loc}')

status, html, url = get('/dashboard')
check('learner reaches the dashboard', status == 200 and url == '/dashboard', f'{status} {url}')
check('header hides studio/admin for a consumer', 'סטודיו' not in html and 'ניהול' not in html, None)

for path in ['/admin', '/admin/review', '/studio']:
    status, html, url = get(path)
    check(f'consumer is denied {path}', url == '/403', f'{status} {url}')
status, html, _ = get('/403')
check('403 page explains the denial', status == 200 and 'אין הרשאה' in html, status)

# grant content.review as a per-user override, then the same session may review
lib.COOKIES.clear()
status, loc = login('tester@example.com', 'supersecret1')
status, html, _ = get(f'/admin/users/{learner_id}')
ov_aid = next((a for a, names in action_forms(html) if 'capability' in names and 'mode' in names), None)
status, body, loc = post_form(f'/admin/users/{learner_id}', {
    'user_id': str(learner_id), 'capability': 'content.review', 'mode': 'allow',
}, ov_aid)
check('override granted', status in (303, 307), f'{status} {loc}')

COOKIES.clear()
status, loc = login('learner2@example.com', 'learnerpass1')
status, html, url = get('/admin/review')
check('override opens the review queue', status == 200 and url == '/admin/review', f'{status} {url}')
status, html, url = get('/admin/users')
check('override did not open user administration', url == '/403', f'{status} {url}')

# revoke it (deny) and the page closes again
lib.COOKIES.clear()
login('tester@example.com', 'supersecret1')
status, html, _ = get(f'/admin/users/{learner_id}')
ov_aid = next((a for a, names in action_forms(html) if 'capability' in names and 'mode' in names), None)
post_form(f'/admin/users/{learner_id}', {'user_id': str(learner_id), 'capability': 'content.review', 'mode': 'deny'}, ov_aid)
lib.COOKIES.clear()
login('learner2@example.com', 'learnerpass1')
status, html, url = get('/admin/review')
check('deny closes the door again', url == '/403', f'{status} {url}')

print('\nSUMMARY:', sum(1 for _, ok in checks if ok), '/', len(checks), 'checks passed')
sys.exit(0 if all(ok for _, ok in checks) else 1)
