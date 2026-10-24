# Step 14 — Modularize the Reusable Backend Configuration

## Objective

The backend is a learning project intended to be reused in other Django
projects. Step 14 separates stable authentication wiring from deployment
specific settings so the OAuth foundation can be copied and customized without
editing one large settings file.

The goal is not to hide configuration. `settings.py` remains the composition
point and continues to own values that vary by environment:

- Secret key and debug mode
- Allowed hosts
- CORS origins
- CSRF trusted origins
- Database
- Email backend
- Cookie and HTTPS security values
- Frontend origin

## New reusable modules

### `config/authentication/apps.py`

[`backend/config/authentication/apps.py`](../backend/config/authentication/apps.py)
exports
`INSTALLED_APPS`, including:

- Django authentication, sessions, sites, and admin
- django-allauth account and social-account applications
- Google provider support
- allauth Headless support
- CORS headers

### `config/authentication/middleware.py`

[`backend/config/authentication/middleware.py`](../backend/config/authentication/middleware.py)
exports the required `MIDDLEWARE` ordering. The order is important:

- CORS middleware must run early enough to add CORS headers.
- Session middleware must run before authentication middleware.
- Django authentication must run before allauth's account middleware.
- CSRF middleware remains enabled.

### `config/authentication/auth.py`

[`backend/config/authentication/auth.py`](../backend/config/authentication/auth.py)
exports:

- `AUTHENTICATION_BACKENDS`
- `SITE_ID`
- `HEADLESS_ONLY`
- `build_headless_frontend_urls()`

The module contains no environment loading and has no import-time dependency
on a `.env` file. The URL builder accepts one frontend origin and generates
allauth's account and social-login error destinations consistently. It strips
a trailing slash so callers can provide either `https://app.example.com` or
`https://app.example.com/`.

### `config/authentication/security.py`

[`backend/config/authentication/security.py`](../backend/config/authentication/security.py)
exports `build_security_settings()`. It owns the reusable Django security
policy for:

- HTTPS redirects and HSTS
- Secure session and CSRF cookies
- HttpOnly and SameSite cookie behavior
- Content-type sniffing protection

The function receives deployment-specific booleans and numbers as arguments;
it does not read environment variables or load `.env` files. `settings.py`
translates environment variables into those arguments and applies the
resulting Django setting names.

## Settings composition

[`backend/config/settings.py`](../backend/config/settings.py) imports these
reusable values:

```python
from .authentication.apps import INSTALLED_APPS
from .authentication.auth import (
    AUTHENTICATION_BACKENDS,
    HEADLESS_ONLY,
    SITE_ID,
    build_headless_frontend_urls,
)
from .authentication.middleware import MIDDLEWARE
from .authentication.security import build_security_settings
```

This keeps the Django settings contract unchanged while making the stable
authentication pieces independently reusable.

## Reuse in another Django project

Copy the `authentication/` package into the project's configuration package
and import its exports from that project's settings module:

```python
from .authentication.apps import INSTALLED_APPS
from .authentication.auth import (
    AUTHENTICATION_BACKENDS,
    HEADLESS_ONLY,
    SITE_ID,
    build_headless_frontend_urls,
)
from .authentication.middleware import MIDDLEWARE

HEADLESS_FRONTEND_URLS = build_headless_frontend_urls(FRONTEND_URL)
```

Only `settings.py` should load environment variables and `.env` files. The
reusable authentication package should receive deployment values as function
arguments, which makes it safe to import from tests, management commands, and
other Django settings modules.

Then customize:

1. The provider list in `apps.py` if the project uses providers other than
   Google.
2. `DJANGO_FRONTEND_URL` for the consuming frontend.
3. Hosts, CORS, and CSRF origins for the consuming deployment.
4. Database, email, cookie, HTTPS, and secret-manager settings.
5. URL routes if the consuming project uses a different API structure.

Do not copy local credentials, `.env` files, the SQLite database, or the
development Google client-secret file.

## Verification

The refactor is intended to preserve runtime behavior. Verify it with:

```bash
cd backend
uv run python manage.py check
uv run python manage.py test
```

The existing Headless provider, session, logout, CSRF, and `/api/me` tests
must continue to pass. This step changes configuration organization, not the
authentication contract.
