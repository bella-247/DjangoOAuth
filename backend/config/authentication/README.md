# Django Authentication Module

A reusable authentication module for Django projects using django-allauth
headless mode with Google OAuth. The first release is designed for a Django
project with a React/Vite frontend, Django on port 8000, the frontend on port
5173, and SQLite for local development.

This is the **Approach A** version: copy the module into an existing Django
project and add the small amount of settings and URL wiring below. A separate
installable `django-auth-headless` package is maintained in a separate
repository.

## Quick Start

### 1. Copy the Module

Copy the `config/authentication/` folder into your Django project:

```
your-project/
├── config/
│   ├── __init__.py
│   ├── settings.py
│   ├── urls.py
│   └── authentication/     # ← copy this folder
│       ├── __init__.py
│       ├── apps.py
│       ├── conf.py
│       ├── utils.py
│       ├── site_helpers.py
│       ├── urls.py
│       ├── views.py
│       ├── tests.py
│       └── management/
```

### 2. Install dependencies

The consuming project must already have these packages:

```bash
uv add django "django-allauth[headless,socialaccount]" django-cors-headers python-dotenv
```

The module supports django-allauth's `headless` and `socialaccount` features.

### 3. Register the module in `settings.py`

The copied folder must be registered in `INSTALLED_APPS`. Import the finished
settings exported by `conf.py`:

```python
# your-project/config/settings.py

from pathlib import Path
from dotenv import load_dotenv

# Import ALL auth settings from the module
from .authentication.conf import (
    INSTALLED_APPS,
    MIDDLEWARE,
    AUTHENTICATION_BACKENDS,
    SOCIALACCOUNT_ADAPTER,
    SITE_ID,
    HEADLESS_ONLY,
    HEADLESS_FRONTEND_URLS,
    CORS_ALLOWED_ORIGINS,
    CORS_ALLOW_CREDENTIALS,
    CSRF_TRUSTED_ORIGINS,
    SESSION_COOKIE_SECURE,
    CSRF_COOKIE_SECURE,
    SESSION_COOKIE_HTTPONLY,
    CSRF_COOKIE_HTTPONLY,
    SESSION_COOKIE_SAMESITE,
    CSRF_COOKIE_SAMESITE,
    SECURE_CONTENT_TYPE_NOSNIFF,
    SECURE_SSL_REDIRECT,
    SECURE_HSTS_SECONDS,
    SECURE_HSTS_INCLUDE_SUBDOMAINS,
    SECURE_HSTS_PRELOAD,
    SOCIALACCOUNT_PROVIDERS,
)

# `conf.py` already includes the copied authentication package in this list.
# Do not add it a second time.

BASE_DIR = Path(__file__).resolve().parent.parent

load_dotenv(BASE_DIR / ".env")

# Your project-specific settings
SECRET_KEY = os.environ["DJANGO_SECRET_KEY"]
DEBUG = os.getenv("DJANGO_DEBUG", "False").strip() == "True"

ALLOWED_HOSTS = [
    host.strip() for host in os.getenv("DJANGO_ALLOWED_HOSTS", "").split(",") if host.strip()
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [...]

WSGI_APPLICATION = "config.wsgi.application"

DATABASES = {...}

AUTH_PASSWORD_VALIDATORS = [...]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"

MAILERS = {
    "default": {
        "BACKEND": os.getenv(
            "DJANGO_EMAIL_BACKEND",
            "django.core.mail.backends.console.EmailBackend",
        ),
    },
}
```

`AuthenticationConfig` in `apps.py` is the AppConfig for the module. The
exported `INSTALLED_APPS` list already registers the copied authentication
package. Keep that imported list in your settings; this is what lets Django
discover the AppConfig and the `setup_oauth` and `verify_oauth` management
commands. If you build `INSTALLED_APPS` manually instead of importing the
list, add your copied package path yourself.

The examples below assume the module is copied to
`config/authentication/`. The module derives its own package path internally,
so it can also be copied to another Python package without editing its
internal imports.

### 4. Update `urls.py`

```python
# your-project/config/urls.py

from django.contrib import admin
from django.urls import path
from config.authentication.urls import urlpatterns as auth_urlpatterns

urlpatterns = [
    path("admin/", admin.site.urls),
    *auth_urlpatterns,
]
```

### 5. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
# Edit .env with your actual credentials
```

Run this command from the backend project directory. If you copy the
authentication module into another project, place the project's `.env.example`
beside `manage.py`.

Required variables:
- `DJANGO_SECRET_KEY` - Django secret key
- `DJANGO_FRONTEND_URL` - Your frontend origin (e.g., `http://localhost:5173`)
- `DJANGO_CORS_ALLOWED_ORIGINS` - Same as frontend URL
- `DJANGO_CSRF_TRUSTED_ORIGINS` - Same as frontend URL
- `DJANGO_ACCESS_TOKEN_LIFETIME_SECONDS` - Lifetime of cross-domain bearer tokens
- `DJANGO_GOOGLE_CLIENT_ID` - Google OAuth client ID used by `setup_oauth`
- `DJANGO_GOOGLE_CLIENT_SECRET` - Google OAuth client secret used by `setup_oauth`

Optional (for additional providers):
- `DJANGO_AUTH_PROVIDERS=google,github` - Comma-separated list
- `DJANGO_GITHUB_CLIENT_ID` / `DJANGO_GITHUB_CLIENT_SECRET`
- `DJANGO_GITLAB_CLIENT_ID` / `DJANGO_GITLAB_CLIENT_SECRET`
- `DJANGO_MICROSOFT_CLIENT_ID` / `DJANGO_MICROSOFT_CLIENT_SECRET`

### 6. Run Migrations and Setup OAuth

```bash
python manage.py migrate
python manage.py setup_oauth  # Interactive, or use --client-id/--client-secret
python manage.py verify_oauth  # Verify everything is configured
```

OAuth credentials are stored in the database-backed `SocialApp` record. The
environment variables provide credentials to `setup_oauth`; they are not also
registered as a settings-backed provider application. Keeping one source of
provider credentials prevents django-allauth from finding multiple Google
applications for the same Site.

### 7. Start Development Server

```bash
python manage.py runserver localhost:8000
```

## Management commands

The commands are available only after the authentication module has been added
to `INSTALLED_APPS` and migrations have been applied.

### `setup_oauth`

Creates or updates the database-backed `SocialApp`, associates it with the
configured Site, and optionally writes the provider credentials to an env file.
It is safe to run again for the same provider.

```bash
# Interactive: prompts for the client ID and secret
python manage.py setup_oauth

# Non-interactive
python manage.py setup_oauth --provider google --client-id $ID --client-secret $SECRET --domain localhost:8000

# Write the credentials to a specific env file
python manage.py setup_oauth --env-file /path/to/.env
```

Options:

- `--provider`: `google`, `github`, `gitlab`, or `microsoft` (default:
  `google`)
- `--client-id`: skips the client ID prompt
- `--client-secret`: skips the client secret prompt
- `--domain`: Site domain (default: `localhost:8000`)
- `--name`: Site display name
- `--env-file`: env file to update; it is not required

### `verify_oauth`

Checks the Site, database-backed `SocialApp` records, provider environment
variables, and the allauth headless configuration endpoint:

```bash
python manage.py verify_oauth
```

Checks:
1. Site record exists with correct domain
2. SocialApp exists for each enabled provider
3. Environment variables are set
4. Allauth headless config endpoint is accessible

Run it after `setup_oauth` and whenever you change provider or environment
configuration.

## Supported Providers

| Provider | Env Vars | Allauth App |
|----------|----------|-------------|
| Google | `DJANGO_GOOGLE_CLIENT_ID`, `DJANGO_GOOGLE_CLIENT_SECRET` | `allauth.socialaccount.providers.google` |
| GitHub | `DJANGO_GITHUB_CLIENT_ID`, `DJANGO_GITHUB_CLIENT_SECRET` | `allauth.socialaccount.providers.github` |
| GitLab | `DJANGO_GITLAB_CLIENT_ID`, `DJANGO_GITLAB_CLIENT_SECRET` | `allauth.socialaccount.providers.gitlab` |
| Microsoft | `DJANGO_MICROSOFT_CLIENT_ID`, `DJANGO_MICROSOFT_CLIENT_SECRET` | `allauth.socialaccount.providers.microsoft` |

Enable providers with
`DJANGO_AUTH_PROVIDERS=google,github,gitlab,microsoft`. The first release
focuses on Google; the other providers are configuration-ready but are not
covered by the React example.

## Frontend Integration

The module expects a React/Vue frontend at `DJANGO_FRONTEND_URL`. Required routes:

- `/account/provider/callback` - OAuth callback landing page
- `/account/social/login/error` - OAuth error page

The frontend should:
1. Call `/_allauth/browser/v1/config` to get CSRF cookie
2. POST to `/_allauth/browser/v1/auth/provider/redirect` with provider, callback_url
3. Browser redirects to provider OAuth consent
4. Provider redirects back to Django `/accounts/{provider}/login/callback/`
5. Django redirects to frontend `/account/provider/callback`
6. Frontend calls `GET /api/me` to verify the session and load the signed-in
   user's account data.

The authenticated user endpoint returns HTTP 401 when no authenticated session
exists. For an authenticated session, `GET /api/me` returns:

```json
{
  "status": 200,
  "data": {
    "user": {
      "id": 1,
      "username": "example",
      "email": "example@example.com"
    }
  }
}
```

The frontend uses the `data.user` object to display the user's ID, username,
and email after the OAuth callback completes.

Google includes the email in its identity response when the `email` scope is
requested. The authentication adapter copies that value into Django's user
record when the local email is empty. The `/api/me` endpoint also falls back
to the linked social account for existing users that were created before this
synchronization was enabled.

## Testing

```bash
# Run auth module tests
python manage.py test config.authentication.tests

# Run all tests
python manage.py test
```

## Production Checklist

Before deploying:
- [ ] `DJANGO_DEBUG=False`
- [ ] `DJANGO_SECRET_KEY` from secret manager
- [ ] `DJANGO_ALLOWED_HOSTS` set to production domain
- [ ] `DJANGO_FRONTEND_URL` = production frontend URL
- [ ] `DJANGO_CORS_ALLOWED_ORIGINS` = production frontend URL
- [ ] `DJANGO_CSRF_TRUSTED_ORIGINS` = production frontend URL

For unrelated frontend and backend domains, use the feature branch's
authorization-code exchange. Django redirects with a short-lived one-time code
in the URL fragment; the frontend posts it to `/api/auth/exchange`, then sends
the returned access token in the `Authorization: Bearer` header. The reusable
access token is never placed in the URL.
- [ ] `DJANGO_SECURE_SSL_REDIRECT=True`
- [ ] `DJANGO_SESSION_COOKIE_SECURE=True`
- [ ] `DJANGO_CSRF_COOKIE_SECURE=True`
- [ ] `DJANGO_SECURE_HSTS_SECONDS=31536000`
- [ ] Production database (not SQLite)
- [ ] Google/GitHub OAuth redirect URIs updated to production URLs
- [ ] Secrets in secret manager, not `.env`

## Approach A status

Approach A is complete as a universal copy-paste module. Copy the folder,
import its exported settings, include its URL patterns, run migrations, and
use the two management commands. The module derives its package path instead
of requiring the consuming project to be named `config`.

Approach B is separate: it will move this implementation into an installable
`django-auth-headless` package in a separate repository.