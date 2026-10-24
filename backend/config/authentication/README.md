# Django Authentication Module

A reusable, drop-in authentication module for Django projects using django-allauth headless mode with Google OAuth (and other providers).

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

### 2. Update `settings.py`

Import and use the authentication settings:

```python
# your-project/config/settings.py

from pathlib import Path
from dotenv import load_dotenv

# Import ALL auth settings from the module
from .authentication.conf import (
    INSTALLED_APPS,
    MIDDLEWARE,
    AUTHENTICATION_BACKENDS,
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

### 3. Update `urls.py`

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

### 4. Configure Environment Variables

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
- `DJANGO_GOOGLE_CLIENT_ID` - Google OAuth client ID
- `DJANGO_GOOGLE_CLIENT_SECRET` - Google OAuth client secret

Optional (for additional providers):
- `DJANGO_AUTH_PROVIDERS=google,github` - Comma-separated list
- `DJANGO_GITHUB_CLIENT_ID` / `DJANGO_GITHUB_CLIENT_SECRET`
- `DJANGO_GITLAB_CLIENT_ID` / `DJANGO_GITLAB_CLIENT_SECRET`
- `DJANGO_MICROSOFT_CLIENT_ID` / `DJANGO_MICROSOFT_CLIENT_SECRET`

### 5. Run Migrations and Setup OAuth

```bash
python manage.py migrate
python manage.py setup_oauth  # Interactive, or use --client-id/--client-secret
python manage.py verify_oauth  # Verify everything is configured
```

### 6. Start Development Server

```bash
python manage.py runserver localhost:8000
```

## Management Commands

### `setup_oauth`

Interactively configure an OAuth provider:

```bash
# Interactive
python manage.py setup_oauth

# Non-interactive (CI/CD)
python manage.py setup_oauth --provider google --client-id $ID --client-secret $SECRET --domain localhost:8000

# Custom .env file
python manage.py setup_oauth --env-file /path/to/.env
```

### `verify_oauth`

Verify the complete OAuth configuration:

```bash
python manage.py verify_oauth
```

Checks:
1. Site record exists with correct domain
2. SocialApp exists for each enabled provider
3. Environment variables are set
4. Allauth headless config endpoint is accessible

## Supported Providers

| Provider | Env Vars | Allauth App |
|----------|----------|-------------|
| Google | `DJANGO_GOOGLE_CLIENT_ID`, `DJANGO_GOOGLE_CLIENT_SECRET` | `allauth.socialaccount.providers.google` |
| GitHub | `DJANGO_GITHUB_CLIENT_ID`, `DJANGO_GITHUB_CLIENT_SECRET` | `allauth.socialaccount.providers.github` |
| GitLab | `DJANGO_GITLAB_CLIENT_ID`, `DJANGO_GITLAB_CLIENT_SECRET` | `allauth.socialaccount.providers.gitlab` |
| Microsoft | `DJANGO_MICROSOFT_CLIENT_ID`, `DJANGO_MICROSOFT_CLIENT_SECRET` | `allauth.socialaccount.providers.microsoft` |

Add providers via `DJANGO_AUTH_PROVIDERS=google,github,gitlab`.

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
- [ ] `DJANGO_SECURE_SSL_REDIRECT=True`
- [ ] `DJANGO_SESSION_COOKIE_SECURE=True`
- [ ] `DJANGO_CSRF_COOKIE_SECURE=True`
- [ ] `DJANGO_SECURE_HSTS_SECONDS=31536000`
- [ ] Production database (not SQLite)
- [ ] Google/GitHub OAuth redirect URIs updated to production URLs
- [ ] Secrets in secret manager, not `.env`