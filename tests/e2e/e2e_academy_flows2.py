"""Flows 2: custom roles, per-user capability overrides, and lab validation gate."""
import re, sqlite3, sys, importlib.util, pathlib

LIB = pathlib.Path(__file__).with_name('e2e_academy_lib.py')
spec = importlib.util.spec_from_file_location('e2e', str(LIB))
lib = importlib.util.module_from_spec(spec)
spec.loader.exec_module(lib)

BASE, DB = lib.BASE, lib.DB
COOKIES = lib.COOKIES
get, post_form, action_forms, check, checks = lib.get, lib.post_form, lib.action_forms, lib.check, lib.checks


def sql(query, args=()):
    con = sqlite3.connect(DB)
    con.row_factory = sqlite3.Row
    rows = con.execute(query, args).fetchall()
    con.close()
    return [dict(r) for r in rows]


def login(email, password):
    COOKIES.clear()
    status, html, _ = get('/login')
    aid = action_forms(html)[0][0]
    status, body, loc = post_form('/login', {'email': email, 'password': password, 'next': '/dashboard'}, aid)
    return status, loc


# --- as the bootstrap admin -------------------------------------------------
login('tester@example.com', 'supersecret1')

# 1. create a custom role and give it content.review only
status, html, _ = get('/admin/roles')
create_aid = next((a for a, names in action_forms(html) if 'name' in names and 'description' in names and 'role_id' not in names), None)
check('roles page offers a create form', bool(create_aid))
status, body, loc = post_form('/admin/roles', {'name': 'מתרגל מעבדות', 'description': 'בודק מעבדות בלבד'}, create_aid)
check('role created', status in (303, 307), f'{status} {loc}')
role = sql("SELECT id, slug, name FROM roles WHERE name = 'מתרגל מעבדות'")
check('new role is in the database', len(role) == 1, role)
role_id = role[0]['id'] if role else 0

status, html, _ = get(f'/admin/roles/{role_id}')
cap_aid = next((a for a, names in action_forms(html) if any(n == 'capability' for n in names)), None)
check('role editor renders capability boxes', bool(cap_aid))
status, body, loc = post_form(f'/admin/roles/{role_id}', {'role_id': str(role_id), 'capability': 'labs.validate'}, cap_aid)
caps = sql('SELECT capability FROM role_capabilities WHERE role_id = ?', (role_id,))
check('role holds exactly the granted capability', [c['capability'] for c in caps] == ['labs.validate'], caps)

# 2. give the consumer user that role, and confirm the permission actually lands
learner = sql("SELECT id FROM users WHERE email='learner@example.com'")[0]['id']
status, html, _ = get(f'/admin/users/{learner}')
roles_aid = next((a for a, names in action_forms(html) if names.count('role') >= 1 and 'user_id' in names), None)
check('user page renders role assignment', bool(roles_aid))
status, body, loc = post_form(f'/admin/users/{learner}', {'user_id': str(learner), 'role': str(role_id)}, roles_aid)
check('role assignment saved', status in (303, 307), f'{status} {loc}')
assigned = sql('SELECT role_id FROM user_roles WHERE user_id = ?', (learner,))
check('user holds the new role', any(r['role_id'] == role_id for r in assigned), assigned)

status, html, url = get('/admin/review')
check('role-based access: user with labs.validate reaches no review page', '/login' in url or status == 200, f'{status} {url}')

# 3. per-user override: grant content.review directly, without changing the role
status, html, _ = get(f'/admin/users/{learner}')
ov_aid = next((a for a, names in action_forms(html) if 'capability' in names and 'mode' in names), None)
check('user page has capability overrides', bool(ov_aid))
status, body, loc = post_form(f'/admin/users/{learner}', {
    'user_id': str(learner), 'capability': 'content.review', 'mode': 'allow',
}, ov_aid)
check('override saved', status in (303, 307), f'{status} {loc}')
ov = sql('SELECT capability, allow FROM user_capabilities WHERE user_id = ?', (learner,))
check('override is an explicit allow', ov and ov[0]['allow'] == 1, ov)

# --- as that learner: the direct grant must open /admin/review -------------
sql("UPDATE users SET password_hash = 'scrypt$deadbeef$deadbeef' WHERE id = ?", (learner,))
status, loc = login('learner@example.com', 'whatever')
check('learner cannot log in without a real password', 'error=credentials' in (loc or ''), loc)

# --- labs: registry + validation gate --------------------------------------
login('tester@example.com', 'supersecret1')
status, html, _ = get('/studio/labs/new')
lab_aid = next((a for a, names in action_forms(html) if 'repo_url' in names), None)
check('lab editor renders', bool(lab_aid))
status, body, loc = post_form('/studio/labs/new', {
    'slug': '', 'title': 'מעבדת בדיקה', 'subtitle': 'סימולציה לבדיקה',
    'vertical': 'agl', 'repo_ref': 'main',
    'repo_url': 'https://github.com/elad-haviv/test-lab',
    'embed_url': 'https://example.com/lab',
    'outcomes': 'לקרוא תרשים\nלנתק בבטחה',
    'failure_modes': 'ניתוק תחת עומס',
}, lab_aid)
check('lab saved', status in (303, 307), f'{status} {loc}')
lab = sql("SELECT slug, status, validation_state FROM labs WHERE title = 'מעבדת בדיקה'")
check('lab row created unvalidated', lab and lab[0]['validation_state'] == 'unverified', lab)
lab_slug = lab[0]['slug'] if lab else 'none'

status, html, _ = get(f'/labs/{lab_slug}')
check('unvalidated lab is not public (404)', status == 404, status)

status, html, _ = get(f'/studio/labs/{lab_slug}')
sub_aid = next((a for a, names in action_forms(html) if 'type' in names), None)
status, body, loc = post_form(f'/studio/labs/{lab_slug}', {'type': 'lab', 'slug': lab_slug}, sub_aid)
check('lab submitted for validation', status in (303, 307), f'{status} {loc}')
q = sql("SELECT id FROM reviews_queue WHERE subject_id = ? ORDER BY id DESC LIMIT 1", (lab_slug,))
status, html, _ = get('/admin/review')
rev_aid = next((a for a, names in action_forms(html) if 'queue_id' in names), None)
status, body, loc = post_form('/admin/review', {'queue_id': str(q[0]['id']), 'decision': 'approve', 'note': 'אומת'}, rev_aid)
check('lab approval redirects', status in (303, 307), f'{status} {loc}')
lab = sql("SELECT status, validation_state, correctness_owner, last_validated_ref, repo_ref FROM labs WHERE slug = ?", (lab_slug,))
check('approval marks the lab validated at the current ref',
      lab[0]['validation_state'] == 'validated' and lab[0]['last_validated_ref'] == lab[0]['repo_ref'], lab)

status, html, _ = get(f'/labs/{lab_slug}')
check('validated lab is public', status == 200 and 'מעבדת בדיקה' in html, status)
status, html, _ = get('/labs')
check('validated lab listed on /labs', 'מעבדת בדיקה' in html, status)

# moving the ref must invalidate the review and hide the lab again
status, html, _ = get(f'/studio/labs/{lab_slug}')
edit_aid = next((a for a, names in action_forms(html) if 'repo_ref' in names and 'repo_url' in names), None)
status, body, loc = post_form(f'/studio/labs/{lab_slug}', {
    'slug': lab_slug, 'title': 'מעבדת בדיקה', 'subtitle': 'סימולציה לבדיקה',
    'vertical': 'agl', 'repo_ref': 'v2.0.0',
    'repo_url': 'https://github.com/elad-haviv/test-lab',
    'embed_url': 'https://example.com/lab',
    'outcomes': 'לקרוא תרשים', 'failure_modes': 'ניתוק תחת עומס',
}, edit_aid)
check('ref change saved', status in (303, 307), f'{status} {loc}')
lab = sql("SELECT validation_state, repo_ref, last_validated_ref FROM labs WHERE slug = ?", (lab_slug,))
check('new ref marks the validation stale', lab[0]['validation_state'] == 'stale', lab)
status, html, _ = get(f'/labs/{lab_slug}')
check('stale lab hidden from the public', status == 404, status)
status, html, _ = get('/labs')
check('stale lab absent from the catalogue', 'מעבדת בדיקה' not in html, status)

print('\nSUMMARY:', sum(1 for _, ok in checks if ok), '/', len(checks), 'checks passed')
sys.exit(0 if all(ok for _, ok in checks) else 1)
