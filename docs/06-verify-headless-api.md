# Step 6 — Verify the django-allauth Headless API

## Goal

Verify that Django and `django-allauth` are configured to expose the headless authentication API, recognize the Google OAuth provider, validate the frontend callback URL, and generate Google's authorization redirect.

This step verifies backend readiness. It does not implement the React frontend or prove that a complete browser-based Google sign-in has succeeded.

## Prerequisites

The previous steps should be complete:

- [ ] Python virtual environment and Django project are configured.
- [ ] `django-allauth` and its headless/social-account dependencies are installed.
- [ ] Allauth applications, middleware, and authentication backends are configured.
- [ ] Database migrations have been applied.
- [ ] The Django `Site` record is configured for local development.
- [ ] A Google `SocialApp` exists and is associated with the configured `Site`.
- [ ] Google's OAuth client has the backend callback URI registered.

Project directory:

```text
~/Desktop/DJangoAuth
```

The frontend will use port `5173`; Django uses port `8000`.

## 1. Confirm the URL configuration

In `config/urls.py`, the relevant configuration should be:

```python
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("accounts/", include("allauth.urls")),
    path("_allauth/", include("allauth.headless.urls")),
]
```

### Why these routes exist

- `admin/` exposes the Django administration interface.
- `accounts/` includes allauth's traditional account and social-account routes, including Google's OAuth callback.
- `_allauth/` exposes the headless authentication API used by a separate frontend.

The React application will communicate with the headless API instead of relying on Django-rendered authentication pages.

## 2. Confirm the relevant settings

The following settings should be present in `config/settings.py`:

```python
INSTALLED_APPS = [
    # Existing Django applications...
    "django.contrib.sites",
    "allauth",
    "allauth.account",
    "allauth.socialaccount",
    "allauth.socialaccount.providers.google",
    "allauth.headless",
]

MIDDLEWARE = [
    # Existing middleware...
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "allauth.account.middleware.AccountMiddleware",
    # Remaining middleware...
]

AUTHENTICATION_BACKENDS = [
    "django.contrib.auth.backends.ModelBackend",
    "allauth.account.auth_backends.AuthenticationBackend",
]

SITE_ID = 1
HEADLESS_ONLY = True

HEADLESS_FRONTEND_URLS = {
    "account_confirm_email": "http://localhost:5173/account/confirm-email/{key}",
    "account_reset_password": "http://localhost:5173/account/password/reset",
    "account_reset_password_from_key": "http://localhost:5173/account/password/reset/key/{key}",
    "account_signup": "http://localhost:5173/account/signup",
    "socialaccount_login_error": "http://localhost:5173/account/social/login/error",
}

CSRF_TRUSTED_ORIGINS = [
    "http://localhost:5173",
]
```

**Important:** These are excerpts, not a replacement for the complete lists in your settings file. Preserve existing Django applications and middleware.

### What the important settings mean

- `django.contrib.sites` and `SITE_ID` let allauth associate the application with a database `Site`.
- `allauth.socialaccount.providers.google` registers Google's provider implementation.
- `allauth.headless` enables the headless API.
- `HEADLESS_ONLY = True` selects the headless-only account interface.
- `HEADLESS_FRONTEND_URLS` tells allauth where to send the user for frontend account-related flows.
- `CSRF_TRUSTED_ORIGINS` includes the local React origin. In the installed allauth version, these origins also contribute to the hosts trusted by its redirect-safety check.

Do not use a wildcard to bypass redirect validation. In production, replace local origins with the real HTTPS frontend origin and configure the remaining production security settings appropriately.

## 3. Run Django's system check

From the project root, ensure the virtual environment is active. Your `direnv` setup should activate it automatically when you enter the directory.

Run:

```bash
python manage.py check
```

Expected result:

```text
System check identified no issues (0 silenced).
```

This check has already passed.

It detects many configuration problems, but it does not prove that Google OAuth works end to end.

## 4. Confirm database migrations

Run:

```bash
python manage.py migrate
```

Django should report that no migrations remain unapplied if the database is already current.

The initial migrations for Django's account infrastructure, `sites`, and allauth's social-account models have already been applied.

## 5. Verify URL resolution

Run:

```bash
python manage.py shell -c "from django.urls import resolve; print(resolve('/_allauth/browser/v1/config'))"
```

The resolved view should be allauth's headless configuration view.

Check the Google login route too:

```bash
python manage.py shell -c "from django.urls import resolve; print(resolve('/accounts/google/login/'))"
```

The resolved view should belong to allauth's Google provider integration.

Both routes have already been resolved successfully.

## 6. Inspect the headless configuration endpoint

Start Django if it is not already running:

```bash
python manage.py runserver localhost:8000
```

In another terminal, run:

```bash
curl -i http://localhost:8000/_allauth/browser/v1/config
```

Alternatively, open this URL in a browser:

`http://localhost:8000/_allauth/browser/v1/config`

The response should be HTTP `200` and contain configuration data, including the registered social providers.

The verified response included Google with these relevant properties:

- Provider ID: `google`
- Provider name: `Google`
- Flows: `provider_redirect` and `provider_token`
- Google OAuth client ID

### What this proves

Allauth has loaded its headless configuration and recognizes the Google provider.

The configuration response may expose the OAuth client ID. That ID is intended to be public; **the client secret must remain private on the backend**.

## 7. Inspect the authentication session endpoint

Run:

```bash
curl -i http://localhost:8000/_allauth/browser/v1/auth/session
```

For a request without an authenticated session, the observed response was HTTP `401` with data similar to:

```json
{
  "status": 401,
  "data": {
    "flows": [
      {"id": "login"},
      {"id": "signup"},
      {"id": "provider_redirect", "providers": ["google"]},
      {"id": "provider_token", "providers": ["google"]}
    ]
  },
  "meta": {
    "is_authenticated": false
  }
}
```

The exact response may vary by configuration and allauth version.

### Why `401` is expected here

The endpoint reports the current authentication session. An unauthenticated request has no logged-in user, so `401` is expected in this test.

It does not indicate a broken API. The important observations are that the endpoint responds and identifies the available authentication flows.

## 8. Verify the frontend callback URL

The frontend callback URL used in this step is:

```text
http://localhost:5173/account/provider/callback
```

The backend's Google OAuth callback is different:

```text
http://localhost:8000/accounts/google/login/callback/
```

These URLs serve different purposes:

1. Google's OAuth callback returns the authorization response to Django.
2. The headless `callback_url` identifies where allauth should return the browser after processing the frontend authentication flow.

### Validate the callback with allauth

Run this diagnostic command:

```bash
python manage.py shell -c '
from django.test import RequestFactory
from allauth.headless.socialaccount.forms import RedirectToProviderForm
from allauth.core import context

request = RequestFactory().post(
    "/_allauth/browser/v1/auth/provider/redirect",
    HTTP_HOST="localhost:8000",
)
context.request = request

form = RedirectToProviderForm({
    "provider": "google",
    "process": "login",
    "callback_url": "http://localhost:5173/account/provider/callback",
})

print("Form valid:", form.is_valid())
print("Form errors:", form.errors.as_json())
'
```

Expected output:

```text
Form valid: True
Form errors: {}
```

This test has passed.

### Why the CSRF trusted origin mattered

Initially, allauth rejected the callback URL with:

```json
{
  "callback_url": [
    {
      "message": "Invalid URL.",
      "code": "invalid_url"
    }
  ]
}
```

Inspection of the installed allauth source showed that its `is_safe_url()` implementation considers the current request host, `ALLOWED_HOSTS`, and hosts derived from `CSRF_TRUSTED_ORIGINS`.

The frontend's port `5173` differed from the backend's port `8000`. Adding this origin to `CSRF_TRUSTED_ORIGINS` resolved the form validation failure:

```python
CSRF_TRUSTED_ORIGINS = [
    "http://localhost:5173",
]
```

This is a targeted local-development configuration, not a reason to disable redirect validation.

The form test uses `RequestFactory` and allauth's internal request context to isolate validation. It is a diagnostic test, not a production integration test.

## 9. Verify the Google authorization redirect

The next test submits a provider-redirect request through Django's test client:

```bash
python manage.py shell -c "from django.test import Client; from urllib.parse import urlparse, parse_qs; c = Client(HTTP_HOST='localhost:8000'); r = c.post('/_allauth/browser/v1/auth/provider/redirect', {'provider': 'google', 'process': 'login', 'callback_url': 'http://localhost:5173/account/provider/callback'}); loc = r.get('Location', ''); print('HTTP status:', r.status_code); print('Redirect location:', loc); print('OAuth parameters:', list(parse_qs(urlparse(loc).query).keys()) if 'accounts.google.com' in loc else 'Not a Google authorization URL'); print('Response body:', r.content.decode()[:1500] if r.status_code >= 400 else '')"
```

### Verified result

The observed response was:

```text
HTTP status: 302
Redirect location: https://accounts.google.com/o/oauth2/v2/auth?...
OAuth parameters: ['client_id', 'redirect_uri', 'scope', 'response_type', 'state']
Response body:
```

The full redirect URL includes the configured client ID and other OAuth parameters. Do not copy OAuth state values or full authentication URLs into public logs or documentation.

### What the parameters mean

- `client_id`: identifies the Google OAuth client.
- `redirect_uri`: tells Google where to send its authorization response. In this setup, it is Django's `/accounts/google/login/callback/` endpoint.
- `scope`: specifies the Google account information being requested.
- `response_type=code`: requests an authorization code.
- `state`: correlates the authorization response with the initiated flow and helps protect against request forgery.

### What this proves

The request passed allauth's provider-redirect handling and generated a redirect to Google's authorization endpoint.

It demonstrates that allauth can find the Google provider and its configured application and construct an OAuth authorization request.

It does **not** prove that the browser can complete consent, Google will issue an authorization code, Django can exchange that code successfully, or the resulting session will be authenticated.

## 10. Verify Google's authorized redirect URI

In Google Cloud Console, open the OAuth 2.0 client used by this application.

Under **Authorized redirect URIs**, verify that the following URI is registered exactly:

```text
http://localhost:8000/accounts/google/login/callback/
```

The URI must match the backend callback, including its trailing slash.

This registration has already been confirmed.

Do not substitute the React callback URL here. Google redirects to Django, while the headless flow uses a separate frontend callback URL.

## Troubleshooting notes

### `Invalid HTTP_HOST header: 'testserver'`

Django's test client uses `testserver` by default. For this diagnostic, instantiate it with the expected local host:

```python
client = Client(HTTP_HOST="localhost:8000")
```

Do not add `testserver` to production `ALLOWED_HOSTS` merely to make a local test pass.

### Callback URL rejected as unsafe

Check the actual implementation of `is_safe_url()` in the installed allauth version, and verify that the frontend origin is configured correctly.

Do not disable redirect safety or allow arbitrary redirect destinations.

### Redirect to the frontend's social-login error page

Inspect the form validation errors and the provider redirect response before changing configuration. A `302` by itself does not guarantee that the location is Google's authorization endpoint.

### Google reports `redirect_uri_mismatch`

Compare Google's registered redirect URI with the `redirect_uri` parameter in the generated authorization URL. They must match exactly.

## Completion checklist

- [x] Django system check passes.
- [x] Database migrations are applied.
- [x] Headless configuration route resolves.
- [x] Google provider login route resolves.
- [x] Headless configuration endpoint returns HTTP `200`.
- [x] Unauthenticated session endpoint reports the unauthenticated state and available flows.
- [x] Google provider is present in the configuration response.
- [x] Google `SocialApp` is associated with the configured `Site`.
- [x] Frontend callback URL passes allauth's form validation.
- [x] Provider redirect generates Google's authorization URL.
- [x] Google's authorized redirect URI matches the backend callback.
- [ ] React frontend implements the provider redirect and callback handling.
- [ ] Complete browser-based Google sign-in succeeds.
- [ ] Authenticated session is verified after sign-in.

## Result

The Django headless authentication backend is configured and has passed its initial API and OAuth-redirect checks. The next step is to build the React integration, initiate sign-in through the headless API, handle the frontend callback, and verify the authenticated session.

This concludes Step 6. It does not yet constitute a complete end-to-end authentication test.
