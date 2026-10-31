"""Mock Google OIDC endpoints for exercising the SSO flow locally."""
import os
import base64, json, os, sys, urllib.parse
from http.server import BaseHTTPRequestHandler, HTTPServer

PORT = 3499
EMAIL = os.environ.get('MOCK_GOOGLE_EMAIL', 'sso.user@example.com')
SUB = os.environ.get('MOCK_GOOGLE_SUB', 'google-sub-1')


class H(BaseHTTPRequestHandler):
    def _send(self, code, body=b'', headers=None):
        self.send_response(code)
        for k, v in (headers or {}).items():
            self.send_header(k, v)
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        u = urllib.parse.urlparse(self.path)
        q = urllib.parse.parse_qs(u.query)
        if u.path == '/auth':
            state = q.get('state', [''])[0]
            redirect = q.get('redirect_uri', [''])[0]
            loc = f"{redirect}?code=mock-code&state={urllib.parse.quote(state)}"
            self._send(302, b'', {'Location': loc})
        elif u.path == '/userinfo':
            body = json.dumps({
                'sub': SUB, 'email': EMAIL, 'email_verified': True, 'name': 'SSO Tester',
            }).encode()
            self._send(200, body, {'Content-Type': 'application/json'})
        else:
            self._send(404, b'no')

    def do_POST(self):
        length = int(self.headers.get('Content-Length') or 0)
        raw = self.rfile.read(length).decode()
        form = urllib.parse.parse_qs(raw)
        if self.path == '/token':
            if form.get('grant_type', [''])[0] != 'authorization_code':
                self._send(400, b'{"error":"bad_grant"}', {'Content-Type': 'application/json'})
                return
            body = json.dumps({'access_token': 'mock-access-token', 'token_type': 'Bearer', 'expires_in': 3600}).encode()
            self._send(200, body, {'Content-Type': 'application/json'})
        else:
            self._send(404, b'no')

    def log_message(self, *a):
        pass


print('mock google on', PORT, 'email', EMAIL, flush=True)
HTTPServer(('127.0.0.1', PORT), H).serve_forever()
