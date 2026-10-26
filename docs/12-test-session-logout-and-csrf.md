# Step 12 — Test Sessions, Logout, CSRF, and Authorization

## Objective

Step 11 established tests for anonymous Headless configuration and session
responses. This step extends the backend baseline to cover:

- An authenticated Headless session
- A protected backend endpoint
- Logout and session invalidation
- CSRF rejection for logout
- CSRF acceptance for logout with a valid token

The goal is to verify the backend session lifecycle without pretending to
automate Google's external authorization-code exchange.

## Implementation

### Protected endpoint

The backend now exposes:

```text
GET /api/me
```

The endpoint is implemented in
[`backend/config/views.py`](../backend/config/views.py). It returns the
authenticated user's ID, username, and email. Anonymous requests receive
HTTP `401` instead of being redirected to an HTML login page, which is the
appropriate contract for a frontend-consumed API endpoint.

This is intentionally a small endpoint for learning and verification. It is
not a replacement for a larger application API.

### Session and logout tests

The tests in
[`backend/config/tests.py`](../backend/config/tests.py) now verify:

- Anonymous users cannot access `/api/me`.
- A forced-in test user receives an authenticated Headless session.
- An authenticated user can access `/api/me`.
- `DELETE /_allauth/browser/v1/auth/session` logs the user out and returns
  the resulting anonymous-session response (`401`).
- The session endpoint returns `401` after logout.
- The protected endpoint returns `401` after logout.

`force_login` is used because the real Google redirect and authorization-code
exchange are external integration behavior. These tests verify Django and
allauth session behavior after authentication has already been established.

### CSRF tests

The logout endpoint is state-changing, so the tests use Django's
`Client(enforce_csrf_checks=True)`:

- A logout request without a CSRF token returns HTTP `403`.
- A logout request with a valid CSRF token succeeds and returns the resulting
  anonymous-session response with HTTP `401`.

The valid token is obtained from the Headless configuration request, matching
the browser flow used by the frontend.

## Reproduce the tests

From the repository root:

```bash
cd backend
uv run python manage.py test config.tests
uv run python manage.py check
```

Run the complete backend suite with:

```bash
uv run python manage.py test
```

## Results

The focused and full test runs completed successfully:

```text
Ran 7 tests
OK
```

Django's system check also completed successfully:

```text
System check identified no issues (0 silenced).
```

## What this proves

The backend now has automated evidence for:

- Anonymous versus authenticated Headless session responses
- A protected backend endpoint
- Logout invalidating the session
- CSRF enforcement on logout
- Valid CSRF requests being accepted

It still does not prove:

- A real Google consent screen can be completed.
- Google returns an authorization code accepted by allauth.
- A `SocialAccount` is created after a real callback.
- Browser cookies persist correctly across an external Google redirect.
- Session expiry and rotation behavior under production settings.
- Production HTTPS, cookie, host, database, and deployment configuration.

## Next backend work

The next step should run Django deployment checks and review production
settings separately from local learning settings. Real Google OAuth should be
documented as an explicit manual integration test rather than simulated with
fake provider credentials.
