# Django OAuth Learning Project

This is a **learning project to understand how to implement OAuth in Django**.
It explores how a React frontend can use Django, `django-allauth`, and Google
OAuth to authenticate users without putting the Google client secret in the
frontend.

The project is intentionally small and educational. It is not presented as a
production-ready authentication service.

## Architecture

```text
React + TypeScript + Vite
        |
        | Headless authentication requests
        v
Django + django-allauth
        |
        | OAuth authorization-code flow
        v
Google
```

- `backend/` contains the Django project, allauth configuration, and the
  database-backed Google `SocialApp`.
- `django-auth-client/` contains the React frontend.
- `docs/` contains the step-by-step implementation notes and verification
  records.

## Local development

### 1. Start Django

The backend uses Python 3.13 and `uv`:

```bash
cd backend
uv sync
uv run python manage.py migrate
uv run python manage.py runserver localhost:8000
```

If the virtual environment has already been created, the equivalent command
is:

```bash
./.venv/bin/python manage.py runserver localhost:8000
```

### 2. Configure Google OAuth

Create a Google OAuth web client in Google Cloud and register this local
callback URL:

```text
http://localhost:8000/accounts/google/login/callback/
```

Store the client ID and secret in Django's database-backed allauth
`SocialApp`, associated with the local Django `Site`. The client secret must
remain on the backend and must never be added to the React application.

The detailed setup is documented in
[`docs/05-configure-google-oauth.md`](docs/05-configure-google-oauth.md).

### 3. Start the React frontend

```bash
cd django-auth-client
pnpm install
pnpm run dev
```

The frontend is expected to run at `http://localhost:5173`, while Django runs
at `http://localhost:8000`. The backend CORS and CSRF settings currently allow
this local development origin.

## Useful commands

From `django-auth-client/`:

```bash
pnpm run build
pnpm run lint
```

From `backend/`:

```bash
uv run python manage.py check
uv run python manage.py showmigrations
```

## Current learning scope

The project demonstrates:

- Django's session-based authentication foundation
- `django-allauth` provider configuration
- Google OAuth redirect and callback concepts
- allauth's headless browser API
- Cross-origin communication between a React frontend and Django backend
- Frontend loading, callback, error, and not-found screens

The authenticated home page and the complete browser-based Google sign-in flow
are still part of the learning work. A successful backend configuration check
does not by itself prove that Google consent, callback handling, cookies, and
session verification work end to end.

## Security notes

- Do not commit Google client secrets, `.env` files, or production credentials.
- Do not use the development `SECRET_KEY`, `DEBUG = True`, SQLite database, or
  local callback URLs in production.
- Before deployment, configure HTTPS, secure cookies, allowed hosts, trusted
  origins, production redirect URLs, and environment-managed secrets.

## Further reading

- [`docs/04-configure-allauth.md`](docs/04-configure-allauth.md)
- [`docs/05-configure-google-oauth.md`](docs/05-configure-google-oauth.md)
- [`docs/06-verify-headless-api.md`](docs/06-verify-headless-api.md)
- [`docs/07-build-react-frontend.md`](docs/07-build-react-frontend.md)
- [`docs/08-audit-oauth-frontend.md`](docs/08-audit-oauth-frontend.md)
