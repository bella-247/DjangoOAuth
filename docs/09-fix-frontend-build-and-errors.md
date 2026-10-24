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
