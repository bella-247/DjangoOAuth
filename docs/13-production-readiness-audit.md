# Step 13 — Audit Production Readiness

## Objective

The previous steps verified the local Django OAuth foundation, Headless
sessions, logout, CSRF behavior, and a protected backend endpoint. This step
checks the settings that must change before deploying the backend to
production.

This is a production-readiness audit. Local development remains configured for
HTTP and the console email backend; those settings must not be reused as-is in
production.

## Threat model and trust boundaries

The backend has these relevant boundaries:

- Browser requests cross the frontend-to-Django boundary.
- OAuth authorization responses cross the Google-to-Django callback boundary.
- Session and CSRF cookies cross the browser transport boundary.
- Environment variables cross the deployment configuration boundary.
- The database stores users, sessions, and social-account associations.

The primary assets are the Django secret key, Google OAuth credentials, user
identity data, and authenticated sessions. The controls in this step reduce
session theft, insecure transport, accidental secret exposure, and
misconfigured cross-origin requests.

## Audit commands

Run the deployment checks with the backend environment loaded:

```bash
cd backend
uv run python manage.py check --deploy
```

Audit the frontend production dependency graph:

```bash
cd django-auth-client
pnpm audit --prod
```

Inspect potentially sensitive tracked files from the repository root:

```bash
git ls-files | grep -E '(^|/)(\.env|.*secret.*|.*credentials.*|db\.sqlite3)'
```

## Baseline findings

Before the Step 13 settings changes, `check --deploy` reported:

- `mail.E001`: the console email backend is development-only.
- `security.W004`: HSTS was not configured.
- `security.W008`: HTTPS redirect was not enabled.
- `security.W012`: the session cookie was not secure.
- `security.W016`: the CSRF cookie was not secure.
- `security.W018`: deployment was running with `DEBUG=True`.

The frontend production dependency audit completed with:

```text
No known vulnerabilities found
```

The tracked-file inspection found `backend/db.sqlite3` and `.envrc`. The
Google client-secret JSON is ignored by the backend ignore rules and was not
included in the tracked-file result. The SQLite database remains tracked and
must be replaced by a managed production database before deployment.

## Hardening implementation

The following settings are now environment-driven in
[`backend/config/settings.py`](../backend/config/settings.py):

- `DJANGO_SECURE_SSL_REDIRECT`
- `DJANGO_SECURE_HSTS_SECONDS`
- `DJANGO_SECURE_HSTS_INCLUDE_SUBDOMAINS`
- `DJANGO_SECURE_HSTS_PRELOAD`
- `DJANGO_SESSION_COOKIE_SECURE`
- `DJANGO_CSRF_COOKIE_SECURE`
- `DJANGO_EMAIL_BACKEND`

The backend also explicitly sets:

- `SESSION_COOKIE_HTTPONLY=True`
- `SESSION_COOKIE_SAMESITE="Lax"`
- `CSRF_COOKIE_HTTPONLY=False`
- `CSRF_COOKIE_SAMESITE="Lax"`
- `SECURE_CONTENT_TYPE_NOSNIFF=True`

`CSRF_COOKIE_HTTPONLY=False` is intentional: the current React integration
reads the CSRF cookie to submit the Headless provider redirect. The cookie
still uses `SameSite=Lax`; production deployment must use HTTPS and a
carefully scoped frontend origin.

The safe local-development values are documented in
[`backend/.env.example`](../backend/.env.example). Real `.env` files remain
ignored and must never be committed.

## Required production values

Production must set, at minimum:

```text
DJANGO_DEBUG=False
DJANGO_SECRET_KEY=<secret-manager-generated-value>
DJANGO_ALLOWED_HOSTS=api.example.com
DJANGO_FRONTEND_URL=https://app.example.com
DJANGO_CORS_ALLOWED_ORIGINS=https://app.example.com
DJANGO_CSRF_TRUSTED_ORIGINS=https://app.example.com
DJANGO_SECURE_SSL_REDIRECT=True
DJANGO_SECURE_HSTS_SECONDS=31536000
DJANGO_SECURE_HSTS_INCLUDE_SUBDOMAINS=True
DJANGO_SECURE_HSTS_PRELOAD=False
DJANGO_SESSION_COOKIE_SECURE=True
DJANGO_CSRF_COOKIE_SECURE=True
DJANGO_EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
```

Only enable HSTS preload after confirming that every subdomain is HTTPS-only
and the domain is intentionally ready for browser preload submission.

Production also needs SMTP host, port, credentials, sender configuration, and
the Google OAuth client secret supplied through the deployment secret manager.

## Results after the settings change

The ordinary backend checks and tests pass:

```text
Ran 7 tests
OK
System check identified no issues (0 silenced).
```

The default local environment is intentionally not expected to pass
`check --deploy`, because it uses HTTP and the console email backend for
learning. Run the deployment check with production values loaded. A passing
result requires a real production email backend, HTTPS deployment, secure
cookies, HSTS policy, allowed hosts, production database, and deployment
secret configuration.

## Remaining production work

This step does not claim production readiness. Before deployment, still:

1. Use a managed production database instead of tracked SQLite.
2. Store Django and Google secrets in a secret manager.
3. Configure a real email provider and verify password/account emails.
4. Register HTTPS Google OAuth redirect URLs.
5. Run `check --deploy` with the real production environment.
6. Verify HTTPS, cookie flags, security headers, CORS, and CSRF behavior at
   the deployed domains.
7. Add operational logging, backups, monitoring, rate-limit policy, and an
   account-data retention/deletion policy.
8. Run a clean, immutable dependency installation before release.

The backend is now better prepared for production configuration, but it is not
production-ready until these deployment-specific requirements are completed
and verified.
