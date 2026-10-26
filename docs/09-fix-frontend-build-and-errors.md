# Step 9.1 — Fix Frontend Build and Authentication Error Handling

## Goal

Fix the unused React state setter that prevented the frontend production build from passing, and separate Google authentication logic from the sign-in page UI.

## Prerequisites

- Node.js and npm are installed.
- The frontend project dependencies have been installed.
- The project uses Vite+, TypeScript, React, and Django Allauth Headless.

## Project locations

- Frontend: `django-auth-client/`
- Authentication module: `django-auth-client/src/auth/google.ts`
- Sign-in page: `django-auth-client/src/pages/SignInPage.tsx`

## Problem

The sign-in page declared:

```tsx
const [notice, setNotice] = useState("");
```

The `notice` state was rendered in the UI, but `setNotice` was never called. TypeScript reported TS6133, and the production build failed.

The Google sign-in initialization function could also throw an error without the UI catching it, leaving the user without a useful error message.

## Implementation

### 1. Extract Google authentication logic

Move the Django Allauth Headless initialization and redirect-form submission into `src/auth/google.ts`.

Export the function:

```ts
export async function signInWithGoogle(): Promise<void> {
  // Initialize the headless flow and submit the redirect form.
}
```

The implementation performs these operations:

1. Fetch the Allauth headless configuration with credentials included.
2. Check the HTTP response status.
3. Retrieve the CSRF cookie.
4. Build a hidden POST form containing the provider, login process, callback URL, and CSRF token.
5. Submit the form to initiate browser navigation to Google.

The full implementation lives in `src/auth/google.ts`.

### 2. Keep UI state in the sign-in page

Import the authentication function:

```tsx
import { signInWithGoogle } from "../auth/google";
```

The page calls it inside a UI handler:

```tsx
async function handleGoogleSignIn() {
  setNotice("");

  try {
    await signInWithGoogle();
  } catch (error) {
    console.error("Google sign-in initialization failed:", error);

    setNotice(
      "Could not start Google sign-in. Check that the backend is running and try again.",
    );
  }
}
```

The button calls `handleGoogleSignIn`, and the existing notice element renders the error when present.

### 3. Separation of responsibilities

- `auth/google.ts`: Django/Allauth Google sign-in initialization and redirect.
- `pages/SignInPage.tsx`: React state, event handling, and user-facing feedback.

The authentication module throws errors rather than importing React or manipulating component state.

## Verification

Run from `django-auth-client/`:

```bash
vp run build
vp run lint
```

Results recorded on 2026-10-24:

- Production build: passed.
- TypeScript build: passed.
- Lint: passed with zero warnings and zero errors.

## Important limitations

Passing the build and lint checks does not prove that Google OAuth completes successfully.

Still to verify:

- The sign-in initialization error appears correctly in a browser.
- The frontend and backend origins are configured consistently.
- Google redirects back to the configured callback.
- Allauth establishes an authenticated session.
- Protected routes and logout behave correctly.

## Concepts learned

- React state setters update component state and trigger re-rendering.
- TypeScript build checks catch errors that may not prevent a development server from starting.
- `try/catch` converts thrown initialization errors into application-level UI feedback.
- A callback URL is part of the OAuth redirect flow.
- Extracting authentication logic reduces coupling between authentication mechanics and page presentation.



# Step 9.2 — Environment-Driven Configuration

## Goal

Move environment-specific URLs and Django security settings out of source code so local development and future deployments can use different configuration without editing application logic.

## Project locations

- Backend: `backend/`
- Backend settings: `backend/config/settings.py`
- Backend environment file: `backend/.env`
- Frontend: `django-auth-client/`
- Frontend environment file: `django-auth-client/.env.local`

## Backend configuration

### Environment variables

The backend `.env` contains:

```dotenv
DJANGO_SECRET_KEY=<locally-generated-secret>
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1
DJANGO_CORS_ALLOWED_ORIGINS=http://localhost:5173
DJANGO_CSRF_TRUSTED_ORIGINS=http://localhost:5173
DJANGO_FRONTEND_URL=http://localhost:5173
```

The secret value must remain private and must not be committed to Git.

### Dependency

The backend uses `python-dotenv` to load the `.env` file. The dependency should be declared in `backend/pyproject.toml` and recorded in `backend/uv.lock`.

Install or declare it from the backend directory with:

```bash
uv add python-dotenv
```

### Settings behavior

Django loads the environment file relative to the backend project directory. The settings derive the following values from environment variables:

- `SECRET_KEY`
- `DEBUG`
- `ALLOWED_HOSTS`
- `CORS_ALLOWED_ORIGINS`
- `HEADLESS_FRONTEND_URLS`
- `CSRF_TRUSTED_ORIGINS`

`DEBUG` is parsed as a boolean rather than relying on Python's truthiness for strings. The secret key is required; Django should not silently fall back to a hardcoded development key.

`CORS_ALLOW_CREDENTIALS` remains enabled because the frontend uses credentialed requests.

## Frontend configuration

The frontend `.env.local` contains:

```dotenv
VITE_DJANGO_API_URL=http://localhost:8000
VITE_FRONTEND_URL=http://localhost:5173
```

The frontend reads these values using `import.meta.env`:

- `src/auth/google.ts` reads both the backend URL and frontend URL.
- `src/pages/OAuthCallbackPage.tsx` reads the backend URL.

The Google sign-in callback URL is constructed from `VITE_FRONTEND_URL`, avoiding a duplicated hardcoded frontend origin.

**Security:** Vite exposes `VITE_` variables to browser code. Never put Django's secret key or a Google client secret in the frontend environment file.

## Vite development server

The Vite configuration specifies:

```ts
server: {
  host: "localhost",
  port: 5173,
  strictPort: true,
},
```

This keeps the frontend origin consistent with Django's CORS, CSRF, and Allauth redirect configuration. If port 5173 is occupied, Vite fails instead of silently switching ports.

## Git protection

The root `.gitignore` ignores local environment files while allowing example templates:

```gitignore
.env
.env.*
!.env.example
!.env.*.example
```

The frontend's existing `*.local` ignore rule excludes `.env.local`.

Verify both files with:

```bash
git check-ignore -v backend/.env django-auth-client/.env.local
```

Never commit the actual environment files or secret values.

## Verification

The following checks passed on 2026-10-24:

```bash
cd backend
uv run python manage.py check
```

Django reported no system-check issues.

Runtime inspection confirmed:

- `DEBUG` is `True` for local development.
- `ALLOWED_HOSTS` contains `localhost` and `127.0.0.1`.
- CORS and CSRF trusted origins contain `http://localhost:5173`.
- `FRONTEND_URL` is `http://localhost:5173`.
- The Django secret key is loaded without printing its value.
- Allauth frontend redirects use the configured frontend origin.

Frontend URL inspection confirmed both authentication files use environment variables instead of hardcoded localhost URLs. The frontend production build also passed, and `git diff --check` reported no whitespace errors.

## Important remaining work

- Verify the complete Google OAuth login flow in a browser.
- Verify the callback and authenticated session.
- Test protected routes and logout.
- Inspect staged changes to `backend/db.sqlite3` before committing.
- Configure production-specific secret, debug, host, HTTPS, and cookie settings before