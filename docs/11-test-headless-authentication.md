# Step 11 — Test the Django Headless Authentication Flow

## Objective

Step 10 established that the backend passed Django's system check but had no
automated tests. This step adds a small baseline for the existing
django-allauth Headless integration without changing authentication behavior.

The tests cover:

1. The anonymous Headless configuration endpoint.
2. Google provider metadata in that configuration.
3. CSRF cookie and CORS behavior for the configured local frontend origin.
4. The anonymous session endpoint and its unauthenticated response.

This step does not attempt to fake a Google authorization-code exchange. A
successful browser login still requires a real Google OAuth interaction and
belongs to a separate integration verification step.

## Scope and safety

- Only backend tests were added.
- The existing tracked SQLite database was not reset, deleted, or modified by
  the test setup.
- Django's test runner creates an isolated test database and destroys it after
  the run.
- No Django REST Framework dependency was added.
- Existing staged and unstaged worktree changes were preserved.

## Implementation

Tests were added to
[`backend/config/tests.py`](../backend/config/tests.py).

The test class creates a test-only Google `SocialApp` and associates it with
the existing test `Site` record. The client ID and secret are dummy values
used only to make provider discovery deterministic; no real credential is
included in the test source.

### Configuration endpoint contract

The test requests:

```text
GET /_allauth/browser/v1/config
Origin: http://localhost:5173
```

It verifies:

- HTTP `200`
- `Access-Control-Allow-Origin: http://localhost:5173`
- A `csrftoken` cookie
- A Google provider entry
- The `provider_redirect` flow

### Anonymous session contract

The test requests:

```text
GET /_allauth/browser/v1/auth/session
```

It verifies:

- HTTP `401`
- `status: 401`
- `meta.is_authenticated: false`
- The expected anonymous flow identifiers:
  `login`, `signup`, `provider_redirect`, and `provider_token`

## Reproduce the tests

From the repository root:

```bash
cd backend
uv run python manage.py test config.tests
```

The broader backend commands remain useful:

```bash
uv run python manage.py check
uv run python manage.py test
```

## Results

The focused test run completed successfully:

```text
Ran 2 tests
OK
```

The full backend test command now discovers the same two tests rather than
reporting `NO TESTS RAN`.

## What this proves

The tests prove that the current backend can expose the configured Headless
provider metadata and correctly describe an anonymous browser session.
They also guard the local frontend origin and CSRF-cookie behavior that the
frontend depends on to start the provider redirect.

They do not prove:

- A real Google consent screen can be completed.
- Google returns an authorization code accepted by allauth.
- A user and `SocialAccount` are created after callback.
- A session persists across a real browser redirect.
- Logout and session expiry work correctly.
- Future application endpoints enforce authorization.

Those behaviors need dedicated tests or an explicitly documented integration
test with a real Google account.

## Next backend work

The next focused backend step should test state-changing Headless requests and
logout behavior using Django's test client. After that, add authorization
tests when the project has a protected backend application endpoint.
