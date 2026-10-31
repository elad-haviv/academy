import re, sqlite3, urllib.request, uuid, sys

import os
BASE = os.environ.get('E2E_BASE', 'http://127.0.0.1:3430')
DB = os.environ.get('E2E_DB', '/tmp/academy-e2e/academy.db')
COOKIES = {}


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *args, **kwargs):
        return None


opener = urllib.request.build_opener(NoRedirect)


def _absorb(resp):
    for sc in resp.headers.get_all('Set-Cookie') or []:
        first = sc.split(';')[0]
        if '=' not in first:
            continue
        k, v = first.split('=', 1)
        if v in ('', 'deleted'):
            COOKIES.pop(k.strip(), None)
        else:
            COOKIES[k.strip()] = v


def _request(path, data=None, headers=None, referer=None):
    req = urllib.request.Request(BASE + path, data=data, method='POST' if data else 'GET')
    req.add_header('User-Agent', 'e2e/1.0')
    if COOKIES:
        req.add_header('Cookie', '; '.join(f'{k}={v}' for k, v in COOKIES.items()))
    if referer:
        req.add_header('Referer', BASE + referer)
    if data:
        req.add_header('Origin', BASE)
    for k, v in (headers or {}).items():
        req.add_header(k, v)
    try:
        resp = opener.open(req)
    except urllib.error.HTTPError as e:
        resp = e
    _absorb(resp)
    return resp


def get(path, follow=True):
    resp = _request(path)
    hops = 0
    while follow and resp.status in (301, 302, 303, 307, 308) and hops < 6:
        loc = resp.headers.get('Location')
        if not loc:
            break
        path = loc.replace(BASE, '') or '/'
        resp = _request(path)
        hops += 1
    return resp.status, resp.read().decode(errors='replace'), path


def post_form(path, fields, action_id):
    boundary = '----e2e' + uuid.uuid4().hex
    data = dict(fields)
    data['$ACTION_ID_' + action_id] = ''
    body = b''
    for k, v in data.items():
        body += f'--{boundary}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n'.encode()
    body += f'--{boundary}--\r\n'.encode()
    resp = _request(
        path,
        data=body,
        headers={'Content-Type': f'multipart/form-data; boundary={boundary}'},
        referer=path,
    )
    return resp.status, resp.read().decode(errors='replace'), resp.headers.get('Location')


def action_forms(html):
    out = []
    for f in re.findall(r'<form.*?</form>', html, re.S):
        ids = re.findall(r'\$ACTION_ID_([a-f0-9]+)', f)
        if ids:
            out.append((ids[0], re.findall(r'name="([^"]+)"', f)))
    return out


checks = []


def check(name, cond, extra=''):
    checks.append((name, bool(cond)))
    print(('PASS ' if cond else 'FAIL ') + name + ('' if cond else f' — {extra}'))


status, _, url = get('/admin')
check('anonymous /admin bounced to login', 'login' in url, url)

status, html, _ = get('/register')
aid = action_forms(html)[0][0]
status, body, loc = post_form('/register', {
    'name': 'בודק מערכת', 'email': 'tester@example.com',
    'password': 'supersecret1', 'next': '/dashboard',
}, aid)
check('register issues a 303 redirect', status in (303, 307) and loc, f'{status} {loc}')
check('session cookie set', 'academy_session' in COOKIES, list(COOKIES))
if 'academy_session' not in COOKIES:
    status, html, _ = get('/login')
    aid = action_forms(html)[0][0]
    status, body, loc = post_form('/login', {'email': 'tester@example.com', 'password': 'supersecret1', 'next': '/dashboard'}, aid)
    check('password login fallback works', status in (303, 307) and 'academy_session' in COOKIES, f'{status} {loc}')

for path in ['/admin', '/admin/users', '/admin/roles', '/admin/review', '/admin/audit', '/studio']:
    status, html, url = get(path)
    check(f'{path} open to system admin', status == 200 and path in url, f'{status} {url}')

status, html, url = get('/studio/tutorials/new')
save_aid = next((a for a, names in action_forms(html) if 'body' in names), None)
check('tutorial editor renders a save form', bool(save_aid))
status, body, loc = post_form('/studio/tutorials/new', {
    'slug': '', 'title': 'בדיקת מערכת: לנתק מעגל בלי לשרוף את השנאי',
    'excerpt': 'שיעור קצר על ניתוק עומס', 'category': 'תאורת מסלולים',
    'level': 'Beginner', 'tags': 'בדיקה',
    'body': '<h2>למה זה חשוב</h2><p>ניתוק תחת עומס <b>שורף</b> מגעים.</p><script>alert(1)</script>',
}, save_aid)
check('save redirects to the editor', status in (303, 307) and 'saved=1' in (loc or ''), f'{status} {loc}')

con = sqlite3.connect(DB)
con.row_factory = sqlite3.Row
row = con.execute('SELECT slug,status,minutes,origin,body FROM tutorials ORDER BY rowid DESC LIMIT 1').fetchone()
check('draft stored as draft/studio', row and row['status'] == 'draft' and row['origin'] == 'studio', dict(row) if row else None)
check('reading minutes computed', row and row['minutes'] >= 1, row['minutes'] if row else None)
slug = row['slug'] if row else 'missing'

status, html, url = get(f'/studio/tutorials/{slug}')
sub_aid = next((a for a, names in action_forms(html) if 'type' in names), None)
check('submit-for-review form present', bool(sub_aid))
status, body, loc = post_form(f'/studio/tutorials/{slug}', {'type': 'tutorial', 'slug': slug}, sub_aid)
check('submission redirects', status in (303, 307) and 'submitted=' in (loc or ''), f'{status} {loc}')
row = con.execute('SELECT status FROM tutorials WHERE slug = ?', (slug,)).fetchone()
check('status becomes in-review', row['status'] == 'in-review', row['status'])
q = con.execute("SELECT id,status FROM reviews_queue WHERE subject_id = ? ORDER BY id DESC LIMIT 1", (slug,)).fetchone()
check('review queue item created', q and q['status'] == 'pending', dict(q) if q else None)

status, html, _ = get(f'/tutorials/{slug}')
check('unreviewed tutorial not public', status == 404, status)

status, html, url = get('/admin/review')
check('queue page lists the item', 'בדיקת מערכת' in html, status)
rev_aid = next((a for a, names in action_forms(html) if 'queue_id' in names), None)
status, body, loc = post_form('/admin/review', {
    'queue_id': str(q['id']), 'decision': 'approve', 'note': 'נראה טוב',
}, rev_aid)
check('approval redirects', status in (303, 307) and 'saved=1' in (loc or ''), f'{status} {loc}')
row = con.execute('SELECT status FROM tutorials WHERE slug = ?', (slug,)).fetchone()
check('approved tutorial is published', row['status'] == 'published', row['status'])

status, html, _ = get(f'/tutorials/{slug}')
check('published tutorial is public', status == 200 and 'לנתק מעגל' in html, status)
check('rich body rendered', '<h2>למה זה חשוב</h2>' in html and 'שורף' in html, None)
check('script tag stripped by the sanitiser', '<script>alert(1)</script>' not in html, None)

actions = {r['action']: r['n'] for r in con.execute('SELECT action, count(*) n FROM audit_log GROUP BY action')}
check('audit log records save/submit/approve',
      all(a in actions for a in ['tutorial.save', 'content.submit', 'content.approve']), actions)

con.execute("INSERT INTO users (email,name,password_hash,role,created_at) VALUES ('learner@example.com','לומד',NULL,'student',datetime('now'))")
uid = con.execute("SELECT id FROM users WHERE email='learner@example.com'").fetchone()['id']
con.execute("INSERT INTO user_roles (user_id, role_id, created_at) SELECT ?, id, datetime('now') FROM roles WHERE slug='content_consumer'", (uid,))
con.commit()
COOKIES.clear()
status, html, _ = get('/login')
aid = action_forms(html)[0][0]
status, body, loc = post_form('/login', {'email': 'learner@example.com', 'password': 'x'}, aid)
check('consumer with no password cannot sign in', 'academy_session' not in COOKIES, loc)

print('\nSUMMARY:', sum(1 for _, ok in checks if ok), '/', len(checks), 'checks passed')
sys.exit(0 if all(ok for _, ok in checks) else 1)
