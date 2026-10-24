# Step 4: Configure django-allauth for Headless Google Authentication

## 1. Goal and scope

In this step, we configure `django-allauth` so Django can support Google sign-in for a separate React frontend.

The architecture we are working toward is:

```text
┌──────────────────────────┐
│      React frontend      │
│     localhost:5173       │
└────────────┬─────────────┘
             │
             │ Headless API requests
             │ Browser carries session cookies
             ▼
┌──────────────────────────┐
│      Django backend      │
│     localhost:8000       │
│                          │
│  django-allauth          │
│  ├── Headless API        │
│  ├── Social accounts     │
│  └── Google provider     │
└────────────┬─────────────┘
             │
             │ OAuth / OpenID Connect flow
             ▼
┌──────────────────────────┐
│       Google             │
│  Identity provider       │
└──────────────────────────┘
```

The diagram represents the intended architecture, not a completed end-to-end integration.

At the end of this step, Django should know about the relevant allauth applications, middleware, authentication backends, and URL routes. We should be able to verify that the routes resolve.

We are **not** yet testing a real Google login. That requires Google OAuth credentials, a configured database-backed `SocialApp`, and eventually a React frontend.

## 2. Prerequisites

The project directory is:

```text
~/Desktop/DJangoAuth/
```

The project uses:

- Django 6.1.2
- django-allauth 65.20.1
- Python 3.13
- SQLite for local development
- Django's built-in `User` model
- A React frontend planned for `http://localhost:5173`
- A Django backend planned for `http://localhost:8000`

The Python environment is activated by `direnv` through `.envrc`. Commands below therefore use `python` and `uv` directly rather than repeatedly invoking `uv run`.

If recreating the environment from scratch, install the dependencies with:

```bash
uv add django
uv add "django-allauth[headless,socialaccount]"
```

The `uv add` command updates the project's dependency declarations and lockfile while installing the packages into the managed environment.

## 3. Understand the dependencies we installed

Previously, the project had Django and django-allauth installed. We then requested the `headless` and `socialaccount` extras:

```bash
uv add "django-allauth[headless,socialaccount]"
```

The syntax has three important parts:

- `django-allauth` is the package name.
- `[headless,socialaccount]` requests the package's optional dependency groups.
- `uv add` records the dependency requirement in the project configuration and resolves the environment.

### What does the `headless` extra do?

A conventional web application can render its account pages directly from Django. A separate React application, however, needs an interface it can call over HTTP.

Allauth's headless functionality provides an API for operations such as inspecting authentication state and initiating account or social-authentication flows.

The headless API is the interface we intend to use from React.

**Important distinction:** Headless authentication does not mean authentication without a browser, without cookies, or without redirects. In our planned setup, the browser will still participate in the Google sign-in flow. The difference is that React owns the user interface while Django and allauth manage the authentication process.

### What does the `socialaccount` extra do?

The social-account functionality provides the common framework for authentication through external providers, including Google.

The Google provider is not a separate authentication system we need to implement ourselves. Allauth supplies the provider integration, OAuth flow handling, and account association behavior.

The optional extras declare the relevant optional dependencies. They do not configure Google credentials automatically.

### How can we inspect the installed versions?

Run:

```bash
uv tree
```

This displays the project's resolved dependency tree.

You can also check the installed package versions:

```bash
python -c "import importlib.metadata as m; print('Django:', m.version('django')); print('django-allauth:', m.version('django-allauth'))"
```

These commands verify the installed environment. They do not verify the Google provider configuration or authentication flow.

## 4. Register the Django applications

In `config/settings.py`, we configured `INSTALLED_APPS` as follows:

```python
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.sites",

    "allauth",
    "allauth.account",
    "allauth.socialaccount",
    "allauth.socialaccount.providers.google",
    "allauth.headless",
]
```

### What is `INSTALLED_APPS`?

Django applications are modules that contribute functionality to a Django project. They may define database models, URL configurations, management commands, templates, signals, or other components.

Adding an application to `INSTALLED_APPS` tells Django to load and register that application.

It does not mean every feature in that application is automatically exposed to users. For example, installing the Google provider and including the appropriate URLs are separate requirements.

### Why do we need each application?

| Application | Responsibility in this project |
|---|---|
| `django.contrib.admin` | Provides Django Admin, which we will use to configure the Google social application. |
| `django.contrib.auth` | Supplies Django's built-in users, groups, permissions, and authentication infrastructure. |
| `django.contrib.contenttypes` | Supports Django's content-type framework, which other Django components use. |
| `django.contrib.sessions` | Provides server-side session support for browser authentication. |
| `django.contrib.messages` | Provides Django's message framework. |
| `django.contrib.staticfiles` | Supports static-file collection and serving during development. |
| `django.contrib.sites` | Provides Site records used to associate database-backed allauth application settings with a site. |
| `allauth` | Provides the core allauth package. |
| `allauth.account` | Provides account-related functionality. |
| `allauth.socialaccount` | Provides the shared social-authentication framework and models. |
| `allauth.socialaccount.providers.google` | Registers the Google provider integration. |
| `allauth.headless` | Provides the headless API intended for the separate frontend. |

### Why explicitly register the Google provider?

The general social-account framework and a particular provider have different responsibilities.

Think of `socialaccount` as the shared integration framework and the Google provider as the adapter for Google's authentication protocol.

Registering the Google provider makes its provider-specific integration available to allauth. We also need to include the relevant URL configurations so the provider's views can be reached.

Neither action supplies the client ID or client secret. Those credentials will be configured separately.

## 5. Configure middleware

The relevant portion of `MIDDLEWARE` is:

```python
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "allauth.account.middleware.AccountMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]
```

### What is middleware?

Middleware is a chain of components that processes requests and responses around Django's URL routing and view execution.

A simplified request path looks like this:

```text
Incoming HTTP request
        |
        v
SecurityMiddleware
        |
        v
SessionMiddleware
        |
        v
CommonMiddleware
        |
        v
CsrfViewMiddleware
        |
        v
AuthenticationMiddleware
        |
        v
AccountMiddleware
        |
        v
URL resolver and view
        |
        v
Response returns through middleware
```

This diagram is a conceptual simplification; middleware behavior depends on the request and response.

### Why does the session middleware matter?

A browser needs a way to maintain authentication state across multiple HTTP requests.

Django's session framework stores session data on the server and associates the browser with a session using a cookie. After a successful authentication flow, Django can establish an authenticated session, and later requests can use that session to identify the user.

The session middleware must be present for Django's session framework to work correctly.

### Why does `AuthenticationMiddleware` matter?

It makes the current authenticated user available to request processing, commonly as `request.user`.

It depends on session middleware, which is why the session middleware appears earlier in the list.

### Why does allauth have its own account middleware?

`allauth.account.middleware.AccountMiddleware` supports allauth's account-related request processing. It is part of the standard allauth configuration and should be included after Django's authentication middleware.

### What about CSRF middleware?

We have retained `CsrfViewMiddleware`. It is relevant to protecting browser-based requests that change server state.

When we connect React to Django, we will need to configure the cross-origin request and CSRF behavior correctly. We should not disable CSRF protection merely to make frontend requests work.

## 6. Configure authentication backends

The relevant settings are:

```python
AUTHENTICATION_BACKENDS = [
    "django.contrib.auth.backends.ModelBackend",
    "allauth.account.auth_backends.AuthenticationBackend",
]
```

### What is an authentication backend?

An authentication backend is a component Django can consult to authenticate a user or check permissions.

It is not the same thing as a login page, a URL route, or an external identity provider.

The two backends have different responsibilities:

**`django.contrib.auth.backends.ModelBackend`**

This is Django's standard backend. It supports Django's usual username/password authentication and permission checks.

**`allauth.account.auth_backends.AuthenticationBackend`**

This integrates allauth's account authentication behavior with Django's authentication framework.

### Does having two backends mean we are building two login interfaces?

No.

The list tells Django which backends are available for authentication and related operations. It does not require us to expose both a password login page and a Google login page in our frontend.

Our planned React interface can offer only a **Continue with Google** button.

We will use allauth's existing Google integration rather than writing our own OAuth implementation.

## 7. Understand `SITE_ID`

We configured:

```python
SITE_ID = 1
```

This setting identifies a record in the database's `django_site` table, provided by `django.contrib.sites`.

It is not a port number, a Google project ID, a client ID, or an identifier generated by Google.

### Why do Sites matter for allauth?

Allauth can obtain social application configuration from the database. A `SocialApp` record stores information such as the provider and OAuth credentials, and it can be associated with one or more Site records.

When database-backed configuration is used, the current site's association helps allauth select the relevant social application configuration.

Later, we will verify that the Site record with ID `1` exists and configure its domain for local development.

For this project, the intended local domain will be associated with `localhost:8000`, because Django handles the provider login and callback routes.

### Is `SITE_ID` always required?

No. Its role depends on how the application is configured.

Allauth can also be configured with provider settings in Django's settings file. Because this project is deliberately using a database-backed `SocialApp`, the Sites framework is part of the configuration we are learning.

We will use one configuration method for Google credentials rather than configuring the same provider in both the database and settings.

## 8. Understand `HEADLESS_ONLY`

We configured:

```python
HEADLESS_ONLY = True
```

A headless application separates the user interface from the backend authentication functionality.

In our project:

- React will display the sign-in interface.
- Django will run the backend.
- Allauth will handle the social-authentication flow.
- Google will act as the external identity provider.

The setting indicates that the headless interface is the intended account interface, rather than allauth's normal account frontend.

It does not remove allauth's provider callback routes. Those are still needed for the browser to return to Django after authentication with Google.

### Why did we remove `HEADLESS_FRONTEND_URLS` for now?

Previously, we considered a configuration like this:

```python
HEADLESS_FRONTEND_URLS = {
    "account_confirm_email": "http://localhost:5173/verify-email/{key}",
    "account_reset_password": "http://localhost:5173/password/reset",
    "account_reset_password_from_key": "http://localhost:5173/password/reset/key/{key}",
    "account_signup": "http://localhost:5173/signup",
}
```

These entries describe frontend destinations for specific account flows, such as email confirmation, password reset, and signup.

They are not the Google client credentials, and they do not register the Google callback URI with Google.

We removed them for now because we are focusing on the smallest useful experiment: Google sign-in through a separate React frontend. We have not implemented those additional account pages, so configuring their destinations now would introduce settings that we cannot yet use or verify.

**This is a deliberate deferral, not a claim that the setting is unnecessary for every headless application.** We can add appropriate frontend URLs later if we implement the corresponding flows or if our chosen allauth configuration requires them.

## 9. Configure URL routing

In `config/urls.py`, we configured:

```python
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("accounts/", include("allauth.urls")),
    path("_allauth/", include("allauth.headless.urls")),
]
```

### What does `include()` do?

Django's URL configuration maps URL paths to views.

The `include()` function delegates a portion of the URL space to another URL configuration. This lets an application supply its own routes without requiring the project to manually define every individual view.

For example:

```python
path("_allauth/", include("allauth.headless.urls"))
```

means that requests beginning with `/_allauth/` are resolved using allauth's headless URL configuration.

The prefix is part of the project's URL design; it is not a special Django keyword.

### Why include both URL configurations?

The two prefixes serve different purposes:

- `/accounts/` includes allauth's conventional account and provider routes, including the Google login and callback views.
- `/_allauth/` exposes allauth's headless API routes, which our React application will use.

`HEADLESS_ONLY = True` does not make these URL configurations interchangeable. The headless API and the provider's browser redirect/callback flow work together.

## 10. Verify the routes

Django's URL resolver lets us test route registration without running a browser or contacting Google.

### Check the headless configuration route

Run:

```bash
python manage.py shell -c "from django.urls import resolve; print(resolve('/_allauth/browser/v1/config'))"
```

Expected result: a `ResolverMatch` for `allauth.headless.base.views.ConfigView`.

This confirms that Django can resolve the route. It does not yet verify the response content, React integration, session behavior, or Google credentials.

### Check the Google login route

Run:

```bash
python manage.py shell -c "from django.urls import resolve; print(resolve('/accounts/google/login/'))"
```

Expected result: a `ResolverMatch` for the Google provider's login view.

This confirms that the provider login URL is registered. It does not prove that the Google client ID and secret are valid or that a browser can finish authentication.

### Run Django's system checks

```bash
python manage.py check
```

Django performs system checks for common configuration problems.

### Apply migrations

```bash
python manage.py migrate
```

This applies any migrations that are pending for the installed applications. If the database is already up to date, Django will report that there is nothing to apply.

These checks should be run after changes to application registration and other project configuration.

## 11. What we have and have not accomplished

### Completed in this step

- [x] Requested the `headless` and `socialaccount` dependency extras.
- [x] Registered the core allauth applications.
- [x] Registered the Google provider.
- [x] Added allauth's account middleware.
- [x] Configured Django and allauth authentication backends.
- [x] Set `SITE_ID = 1`.
- [x] Enabled headless-only account behavior.
- [x] Included allauth's conventional and headless URL configurations.
- [x] Verified that the headless configuration route resolves.
- [x] Verified that the Google login route resolves.
- [x] Confirm the latest system check and migration commands succeed.

### Still to do

- [ ] Verify the local Site record in the database.
- [ ] Create the Google OAuth client in Google Cloud.
- [ ] Configure its authorized redirect URI.
- [ ] Store the Google client ID and secret in a database-backed `SocialApp`.
- [ ] Configure and launch the React frontend.
- [ ] Complete a real Google sign-in.
- [ ] Verify that Django establishes a session and React can inspect authentication state.
- [ ] Configure CORS and CSRF for the separate frontend origin before cross-origin integration.

Do not mark these remaining items complete until they have actually been tested.

## 12. Next step: configure the Site and Google credentials

The next step will connect the Django configuration to a real Google OAuth client.

The sequence will be:

1. Verify the database's Site record.
2. Create a Google Cloud project or select an existing one for this experiment.
3. Configure the Google OAuth consent screen and an appropriate test-user setup.
4. Create an OAuth client for a web application.
5. Register the exact Django callback URI required by allauth.
6. Open Django Admin and create the Google `SocialApp`.
7. Associate that `SocialApp` with the local Site record.
8. Verify the saved configuration before attempting the browser flow.

We will not write our own OAuth callback or implement Google's protocol from scratch. Allauth already provides that machinery.

The purpose of the next step is to understand how our local Django configuration is connected to Google's registered OAuth client, and how the browser is routed back to Django after Google authentication.