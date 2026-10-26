# Step 8 — Audit the Django Google OAuth Integration and React Frontend

## 1. Objective

Audit the existing Django + django-allauth + React authentication setup before making further changes.

The objectives are to:

- Verify the existing backend configuration.
- Inspect the Google OAuth integration.
- Review the React sign-in and callback flow.
- Inspect the rendered frontend routes.
- Run available backend and frontend checks.
- Identify implementation defects and security gaps.
- Establish a baseline for fixing problems individually.

This step is an **audit only**. It records the existing state and does not claim that the authentication flow is complete or production-ready.

## 2. Project structure

The project uses separate backend and frontend applications.

```text
DJangoAuth/
├── backend/
│   ├── config/
│   │   ├── settings.py
│   │   └── urls.py
│   ├── manage.py
│   ├── pyproject.toml
│   ├── uv.lock
│   └── db.sqlite3
│
├── frontend/
│   └── django-auth-client/
│       ├── src/
│       │   ├── App.tsx
│       │   ├── App.css
│       │   ├── index.css
│       │   └── pages/
│       │       ├── SignInPage.tsx
│       │       ├── OAuthCallbackPage.tsx
│       │       ├── HomePage.tsx
│       │       ├── LoginErrorPage.tsx
│       │       └── NotFoundPage.tsx
│       └── package.json
│
└── docs/
    ├── 04-configure-allauth.md
    ├── 05-configure-google-oauth.md
    ├── 06-verify-headless-api.md
    ├── 07-build-react-frontend.md
    └── 08-audit-oauth-frontend.md
```

The listing shows the relevant files inspected during the audit. Some runtime files, such as the SQLite database and virtual environment, are generated locally and are not necessarily tracked by Git.

## 3. Existing architecture

The project uses:

- Django as the backend framework.
- django-allauth for authentication and social account integration.
- The allauth headless API for frontend-driven authentication.
- Google as the initial OAuth provider.
- React and TypeScript for the frontend.
- Vite-based development tooling for the frontend.
- SQLite for local development.

The frontend and backend run on separate development servers. Consequently, browser requests, cookie handling, CORS, CSRF protection, and redirect URLs must be configured consistently.

### Authentication flow

The intended flow is:

```text
User
 |
 | Clicks "Continue with Google"
 v
React sign-in page
 |
 | Initiates allauth provider redirect
 v
Django allauth headless API
 |
 | Redirects browser to Google
 v
Google OAuth consent and authorization
 |
 | Google redirects to Django callback
 v
Django /accounts/google/login/callback/
 |
 | Completes provider authentication
 | Establishes Django session
 v
React /account/provider/callback
 |
 | Requests current session
 v
Django /_allauth/browser/v1/auth/session
 |
 | Returns authenticated user/session information
 v
React authenticated application
```

This is the intended sequence, not proof that every transition works successfully.

## 4. Backend audit

### 4.1 Django configuration

The following components were present in `backend/config/settings.py`:

- Django authentication, sessions, sites, and related built-in applications.
- `allauth`, `allauth.account`, and `allauth.socialaccount`.
- The Google social provider.
- `allauth.headless`.
- `corsheaders`.
- Allauth's authentication backend and Django's standard authentication backend.
- The required account middleware.
- Headless frontend callback URLs.
- CORS and CSRF trusted-origin configuration.

The backend uses Django's built-in `User` model at this stage.

### 4.2 URL configuration

`backend/config/urls.py` registers the Django admin, traditional allauth URLs, and headless API:

```python
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("accounts/", include("allauth.urls")),
    path("_allauth/", include("allauth.headless.urls")),
]
```

The traditional `/accounts/` routes and headless `/_allauth/` routes serve different purposes. The Google provider callback is registered through the allauth routes.

### 4.3 Backend checks

The Django system check completed successfully:

```bash
cd ~/Desktop/DJangoAuth/backend
.venv/bin/python manage.py check
```

The command reported no system-check issues.

The database migration plan was also inspected. This does not prove that the full Google authentication flow works; it verifies a different part of the setup.

### 4.4 Headless configuration endpoint

The following endpoint was queried:

```text
GET http://localhost:8000/_allauth/browser/v1/config
```

The endpoint returned HTTP 200 and reported the configured Google provider and available authentication flows.

This verifies that the headless API can expose the provider configuration. It does not prove that Google consent, callback processing, and session establishment all succeed.

### 4.5 Google social application

The database was inspected for the Google `SocialApp` and its associated Django `Site`.

The expected configuration is:

- Provider: `google`
- Site domain: `localhost:8000`
- Site association: the local Django site
- Google OAuth credentials configured for the application

The credential values themselves must not be copied into documentation, source code, terminal logs, or Git history.

### Backend conclusion

**Status: Basic configuration checks passed.**

The Django project recognizes the Google provider and exposes the allauth headless API. End-to-end authentication remains unverified.

## 5. Frontend audit

### 5.1 Sign-in page

`src/pages/SignInPage.tsx` contains the Google sign-in interface and the logic for initiating authentication.

The intended integration:

1. Requests the headless configuration endpoint.
2. Obtains the CSRF token.
3. Submits a browser form to the headless provider-redirect endpoint.
4. Supplies the provider, login process, and frontend callback URL.
5. Allows the browser to navigate to Google.

Using a browser navigation for an endpoint that responds with an OAuth redirect is intentional. It is not equivalent to fetching the redirect endpoint with JavaScript and expecting the same browser navigation behavior.

#### Audit findings

- The sign-in interface renders.
- The Google button is present.
- The frontend build fails because `setNotice` is declared but never used.
- The sign-in initialization has insufficient visible error handling. A failed request can result in an unhandled error rather than a clear message to the user.

These problems should be fixed without weakening the OAuth or CSRF protections.

### 5.2 OAuth callback page

`src/pages/OAuthCallbackPage.tsx` is intended to query the headless session endpoint after Google authentication.

The endpoint is:

```text
GET http://localhost:8000/_allauth/browser/v1/auth/session
```

The frontend sends the request with:

```typescript
{
  credentials: "include"
}
```

This option is necessary for cross-origin fetches that must include applicable cookies.

The callback page checks whether Django reports an authenticated session and, if so, reads the returned user information.

An unauthenticated session can produce HTTP 401. That response alone does not indicate a backend defect: it is expected when no authenticated session exists.

The remaining issue is to verify the complete browser flow and confirm that the session is established and readable after Google redirects back to the application.

### 5.3 Home page

`src/pages/HomePage.tsx` is a placeholder.

The route can be accessed directly, but it does not yet verify the Django session or prevent an unauthenticated user from accessing the page.

This means the existence of a `/home` route must not be interpreted as proof that authentication-based access control is implemented.

### 5.4 Login error page

`src/pages/LoginErrorPage.tsx` provides a route for social-login errors.

The audit reached an error route containing:

```text
/account/social/login/error?error=access_denied
```

This indicates that the browser arrived at the error route with an OAuth error parameter. It does not establish the root cause of the denial.

### 5.5 Not-found page

`src/pages/NotFoundPage.tsx` provides a basic fallback for unknown routes. It is functional, but the audit did not establish that it represents a final production design.

## 6. CORS and development origins

The current backend configuration allows this frontend origin:

```text
http://localhost:5173
```

During browser testing, the frontend was also accessed through origins such as:

```text
http://127.0.0.1:5174
http://[::1]:5173
```

Requests from those origins failed the configured CORS policy.

This is consistent with an origin mismatch. These URLs are not interchangeable for CORS purposes, even when they reach the same machine.

For example, the following are different origins:

```text
http://localhost:5173
http://127.0.0.1:5173
http://localhost:5174
https://localhost:5173
```

An origin consists of the scheme, hostname, and port.

### Important distinction

CORS and CSRF protection solve different problems:

- **CORS** determines whether browser JavaScript is permitted to read cross-origin responses.
- **CSRF protection** validates requests that could cause an unwanted state change using a user's browser session.

The fix must use a consistent development origin and correctly configured trusted origins. Disabling CSRF is not an acceptable solution.

We should not permanently allow every origin merely to avoid development-server port mismatches.

## 7. Browser and visual audit

The frontend was launched locally and inspected in a browser.

### Sign-in page

The sign-in page has a strong initial visual design:

- Clear two-panel layout.
- Consistent typography and spacing.
- Good visual hierarchy.
- Prominent Google sign-in action.
- Responsive layout.
- Consistent color palette.

The page is visually suitable for an early-stage authentication demo.

### Other routes

The other routes are less complete:

- The callback page is primarily a technical verification screen.
- The home page is a placeholder.
- The login-error page is minimal.
- The not-found page is basic.
- There is no complete session-aware navigation, protected dashboard, or finished logout flow.

The visual audit therefore supports a limited conclusion: the sign-in page is polished, but the application as a whole is still an authentication prototype.

### Responsive check

A mobile viewport of 390 × 844 pixels was used for a layout check. The inspected page did not show meaningful horizontal overflow.

This is a limited responsive check, not a comprehensive test across devices, browsers, or accessibility requirements.

## 8. Validation results

| Check | Result | Interpretation |
|---|---|---|
| Django system check | Passed | No reported Django configuration errors |
| Migration plan inspection | Completed | Migration state was inspected |
| Headless config endpoint | HTTP 200 | API configuration is accessible |
| Google provider discovery | Passed | Provider appears in headless configuration |
| Sign-in page rendering | Passed | Page renders in the browser |
| Callback route rendering | Partially verified | Route exists; authentication success is not proven |
| Error route rendering | Passed | Error route can be rendered |
| Home route rendering | Passed | Route renders, but access is not protected |
| Responsive spot check | Passed | No meaningful horizontal overflow observed in the tested viewport |
| Frontend production build | Failed | Unused `setNotice` setter reported |
| Browser initialization from alternate origins | Failed | CORS configuration did not permit those origins |
| Complete Google OAuth flow | Not verified | Browser navigation reached an OAuth error route with `access_denied` during testing |
| Authenticated home page | Not implemented | Session verification and route protection are missing |
| Production security readiness | Not ready | Environment-specific configuration and deployment hardening remain incomplete |

## 9. Security and production-readiness gaps

The audit identified the following configuration concerns:

- `DEBUG = True`.
- `ALLOWED_HOSTS = []`.
- The Django secret key is hardcoded in settings.
- Production HTTPS and redirect URLs have not been configured.
- Production cookie settings have not been reviewed.
- OAuth configuration needs a documented environment and secret-management strategy.
- Protected frontend routes and logout behavior are incomplete.

These settings must be evaluated in their deployment context. Some are normal in a local development environment, but they must not be copied blindly into production.

The local Google client-secret JSON file is ignored by the backend Git ignore configuration. This is good practice, but `.gitignore` does not remove secrets that were already committed or exposed elsewhere.

## 10. Issues to fix, in order

We will address these problems one at a time rather than changing the entire authentication system simultaneously.

### Issue 1 — Fix the frontend build

Remove or correctly use the unused `setNotice` setter and ensure sign-in initialization errors are presented clearly.

**Acceptance criteria:**

- The frontend production build succeeds.
- No unused-setter error remains.
- A failed sign-in initialization produces a visible, understandable error.
- No OAuth security checks are disabled.

### Issue 2 — Standardize development origins

Choose one frontend origin and use it consistently when starting the frontend, configuring CORS and CSRF, and constructing callback URLs.

**Acceptance criteria:**

- The frontend runs at the selected origin.
- The headless configuration request succeeds from that origin.
- Requests requiring cookies and CSRF protection use the correct configuration.
- No wildcard origin is introduced merely to suppress errors.

### Issue 3 — Verify Google OAuth end to end

Test the complete browser sequence from the Google sign-in button through the provider callback and back to React.

**Acceptance criteria:**

- Google authorization starts from the frontend.
- Google redirects to the configured Django callback.
- Django completes the provider flow.
- React receives the callback.
- The headless session endpoint confirms the authenticated session.
- Failures are surfaced clearly without exposing credentials.

### Issue 4 — Protect the authenticated home page

Make the home route verify the Django session and redirect unauthenticated users to sign-in.

**Acceptance criteria:**

- Authenticated users can access the protected page.
- Unauthenticated users cannot use the frontend route to access authenticated UI.
- Django remains responsible for enforcing authorization on protected backend resources.

### Issue 5 — Complete the session lifecycle

Implement a coherent authenticated state, appropriate post-login navigation, and logout behavior.

**Acceptance criteria:**

- The frontend displays the current user's public profile information.
- Authentication state is refreshed correctly after navigation or reload.
- Logout invalidates the session through the supported allauth flow.
- The UI handles expired sessions and authentication errors.

### Issue 6 — Review production configuration

Separate local development settings from deployment settings and handle secrets safely.

**Acceptance criteria:**

- Secrets are supplied through an appropriate secret-management mechanism.
- `DEBUG` is disabled in production.
- Hosts, origins, redirect URLs, and cookie settings are deployment-specific.
- HTTPS and relevant security settings are reviewed.
- No credentials are committed to version control.

## 11. Working rules for subsequent steps

1. Fix one issue at a time.
2. Inspect the current implementation before changing it.
3. Explain the cause of each problem before proposing a fix.
4. Make the smallest reasonable change that addresses the issue.
5. Run the relevant check immediately after the change.
6. Distinguish automated test results from real browser verification.
7. Update this documentation when a finding is resolved or the implementation changes.
8. Do not describe authentication as successful until the authenticated session has been verified.
9. Keep secrets out of source code, documentation, terminal output, and Git history.

## 12. Final assessment

The project has the main Django allauth and Google provider components configured, and the React sign-in page has a polished visual foundation.

However, the frontend build currently fails, the development origins are inconsistent, and the browser test did not establish a successful end-to-end Google sign-in. The home page also lacks session-based protection.

**The correct status is: partially implemented, with end-to-end authentication still unverified.**

The next step is Issue 1: fix the frontend build and error handling without changing the authentication architecture unnecessarily.
