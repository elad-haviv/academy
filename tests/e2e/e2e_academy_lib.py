"""Shared HTTP client for the academy E2E flows (no-redirect opener, manual cookies)."""
import re, urllib.parse, urllib.request, uuid

import os
BASE = os.environ.get('E2E_BASE', 'http://127.0.0.1:3430')
DB = os.environ.get('E2E_DB', '/tmp/academy-e2e/academy.db')
COOKIES = {}
checks = []


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
        if loc.startswith('http'):
            parts = urllib.parse.urlsplit(loc)
            path = parts.path + (('?' + parts.query) if parts.query else '')
            other_origin = not loc.startswith(BASE)
        else:
            path = loc
            other_origin = False
        if other_origin:
            print('   (redirect to another origin, following locally)', loc)
        resp = _request(path or '/')
        hops += 1
    return resp.status, resp.read().decode(errors='replace'), path


def _request_abs(url):
    req = urllib.request.Request(url)
    req.add_header('User-Agent', 'e2e/1.0')
    if COOKIES:
        req.add_header('Cookie', '; '.join(f'{k}={v}' for k, v in COOKIES.items()))
    try:
        resp = opener.open(req)
    except urllib.error.HTTPError as e:
        resp = e
    _absorb(resp)
    return resp


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


def check(name, cond, extra=''):
    checks.append((name, bool(cond)))
    print(('PASS ' if cond else 'FAIL ') + name + ('' if cond else f' — {extra}'))
