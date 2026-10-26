# Step 10 — Audit the Django OAuth Backend

## Objective

This step audits the backend before adding more authentication behavior. It
answers:

- Does Django's configuration pass its system checks?
- Are backend tests present and running?
- Is the local SQLite database tracked by Git?
- What changes are staged or unstaged before the next backend task?

This is an audit, not a claim that the backend is production-ready. The
database, session lifecycle, logout behavior, authorization rules, and
production deployment settings still require dedicated verification.

## Scope

Only the backend was inspected in this step. React routing, protected
frontend pages, and frontend logout UI are intentionally deferred.

The inspected backend URL configuration is
[`backend/config/urls.py`](../backend/config/urls.py). It currently exposes:

- Django admin at `/admin/`
- django-allauth routes at `/accounts/`
- allauth Headless routes at `/_allauth/`

## Reproducible audit commands

Run these commands from the repository root:

```bash
printf '\n--- Backend URL configuration ---\n'
cat backend/config/urls.py

printf '\n--- Backend test files ---\n'
find backend -type f \( -name 'test_*.py' -o -name '*_tests.py' \) \
  -not -path '*/.venv/*' -print

printf '\n--- Django system check ---\n'
cd backend
uv run python manage.py check

printf '\n--- Existing automated tests ---\n'
uv run python manage.py test
```

Then inspect Git without changing the database:

```bash
cd ..

printf '\n--- Is the SQLite database tracked? ---\n'
git ls-files --error-unmatch backend/db.sqlite3

printf '\n--- Staged changes summary ---\n'
git diff --cached --stat

printf '\n--- Unstaged changes summary ---\n'
git diff --stat
```

Do not reset, delete, or commit the database automatically. It may contain the
local allauth `SocialApp` configuration and should be reviewed deliberately.

## Observed results

The audit was run on 2026-10-24.

### Django system check

```text
System check identified no issues (0 silenced).
```

The current Django configuration is internally valid according to
`manage.py check`.

### Automated tests

```text
----------------------------------------------------------------------
Ran 0 tests in 0.000s

NO TESTS RAN
```

No backend test files were found outside the virtual environment. This means
the OAuth backend has no automated coverage for configuration, session
creation, session persistence, logout, CSRF behavior, or authorization.

### Database tracking

```text
tracked
```

`backend/db.sqlite3` is tracked by Git. The audit also found both staged and
unstaged database changes. This database should not be reset or removed before
confirming whether its local `SocialApp`, `Site`, migration, and user data are
needed.

### Git change state

The worktree already contains staged and unstaged changes from earlier
implementation steps, including backend settings, dependency files, the
SQLite database, and frontend changes. This audit did not modify or stage any
of those changes.

Before committing a backend change, inspect the exact staged diff and confirm
that no OAuth client secret or other credential is included.

## Completion status

| Area | Status | Evidence |
| --- | --- | --- |
| Django project and dependencies | Implemented | `manage.py check` passes |
| Database migrations | Applied locally | Existing database and migration state |
| django-allauth Headless configuration | Implemented | Headless routes are registered |
| Google OAuth provider configuration | Implemented locally | Existing database-backed provider setup |
| Environment-based settings | Implemented for current settings | `settings.py` reads environment variables |
| Session creation and persistence | Not verified in automated tests | No backend tests exist |
| Logout behavior | Not verified | No backend tests exist |
| CSRF enforcement | Not verified | No backend tests exist |
| Authentication and authorization rules | Not comprehensively verified | No protected backend application endpoint exists |
| Production security settings | Not complete | Local SQLite and development OAuth settings remain |
| Automated backend authentication tests | Missing | Django reports `NO TESTS RAN` |

## What this audit establishes

The backend is a valid learning foundation for understanding Django OAuth. It
is not yet a completed backend implementation because passing Django's system
check validates configuration shape, not the complete OAuth and session
lifecycle.

The next backend task should add focused automated tests for the existing
allauth Headless flow and session lifecycle before expanding the application
API. Do not add Django REST Framework unless a separate API requirement is
agreed. That testing baseline is documented in
[`docs/11-test-headless-authentication.md`](11-test-headless-authentication.md).
Session, logout, CSRF, and protected-endpoint coverage is documented in
[`docs/12-test-session-logout-and-csrf.md`](12-test-session-logout-and-csrf.md).

## Next backend work

The recommended order is:

1. Add backend tests for anonymous and authenticated session endpoints.
2. Verify session creation and persistence after a successful provider login.
3. Verify logout and behavior after session expiry.
4. Verify CSRF enforcement for state-changing Headless requests.
5. Define and test authentication and authorization rules for any future
   backend endpoints.
6. Run Django's deployment checks and separate development settings from
   production settings.
