# Step 7 — Build the React Frontend

## Objective

Build the frontend for our Google authentication application using React, TypeScript, and Vite.

The frontend runs on a separate development server from Django:

- **React frontend:** `http://localhost:5173`
- **Django backend:** `http://localhost:8000`

Our frontend provides the user interface for signing in with Google, handling the OAuth callback, displaying authentication errors, and presenting a placeholder home page.

At this stage, the pages are implemented, but Google authentication is not yet connected to the React interface. We will integrate the actual authentication flow in a later step.

---

## 1. Understand the architecture

Our application has three main parts:

```text
Browser
   |
   | Loads the frontend
   v
React + TypeScript + Vite
http://localhost:5173
   |
   | Sends authentication requests
   v
Django + django-allauth
http://localhost:8000
   |
   | Redirects the browser to Google
   v
Google OAuth
```

Each component has a distinct responsibility.

- **React** renders the interface and handles client-side navigation.
- **Vite** provides the frontend development server and builds the application for production.
- **TypeScript** adds static type checking to our JavaScript code.
- **React Router** maps browser URLs to React pages.
- **Django and django-allauth** handle authentication on the backend.
- **Google OAuth** allows users to authenticate using their Google accounts.

The frontend must never contain the Google OAuth client secret. Sensitive OAuth configuration belongs on the backend.

## 2. Create the React application

If starting from scratch, create a Vite application with React and TypeScript:

```bash
mkdir django-auth-client
cd django-auth-client

npm create vite@latest . -- --template react-ts
npm install
```

The commands have different responsibilities:

- `mkdir` creates the project directory.
- `cd` enters the project directory.
- `npm create vite@latest` runs Vite's project scaffolding tool.
- `-- --template react-ts` selects the React + TypeScript template.
- `npm install` installs the dependencies declared in `package.json`.

If the project directory already contains our application, **do not run the scaffolding command again**. It may overwrite or conflict with existing files.

Start the development server:

```bash
npm run dev
```

Vite normally serves the application at:

```text
http://localhost:5173/
```

Keep the development server running while working on the frontend.

## 3. Install React Router

React Router allows us to display different pages based on the current browser URL without requiring a full page reload for every internal navigation.

Install it with:

```bash
npm install react-router
```

Our application uses the React Router v7 API.

We define the routes in `src/App.tsx`:

| Route | Component | Responsibility |
|---|---|---|
| `/` | `SignInPage` | Main sign-in interface |
| `/account/provider/callback` | `OAuthCallbackPage` | Landing page after the authentication provider redirects back |
| `/account/social/login/error` | `LoginErrorPage` | Displays a social authentication error |
| `/home` | `HomePage` | Placeholder for the post-login page |
| Any unmatched route | `NotFoundPage` | Displays a 404 page |

The callback route is deliberately aligned with the frontend callback URL configured in Django's `HEADLESS_FRONTEND_URLS` and supplied during the headless authentication flow.

The backend still receives Google's OAuth response at its own callback endpoint:

```text
http://localhost:8000/accounts/google/login/callback/
```

These two callback URLs serve different purposes: Google's redirect returns to Django, while Django can subsequently redirect the browser to the frontend.

## 4. Organize the source code

Our frontend uses this structure:

```text
django-auth-client/
├── public/
├── src/
│   ├── pages/
│   │   ├── SignInPage.tsx
│   │   ├── OAuthCallbackPage.tsx
│   │   ├── LoginErrorPage.tsx
│   │   ├── HomePage.tsx
│   │   └── NotFoundPage.tsx
│   ├── App.tsx
│   ├── App.css
│   ├── index.css
│   └── main.tsx
├── package.json
├── package-lock.json
├── tsconfig.json
└── vite.config.ts
```

Some generated files may differ slightly depending on the Vite version and template.

### `src/main.tsx`

This is the frontend entry point. It imports the global styles, creates the React root, and renders the application.

The `StrictMode` wrapper enables additional development-time checks that help identify certain problems in React components.

### `src/App.tsx`

This file defines the application's route table and connects URLs to page components.

Keeping the route definitions in one place makes the navigation structure easy to understand and maintain.

### `src/pages/`

Each page has its own component:

- **`SignInPage.tsx`** — the sign-in interface, including the Google sign-in button.
- **`OAuthCallbackPage.tsx`** — a temporary callback screen while authentication handling is developed.
- **`LoginErrorPage.tsx`** — reads an error query parameter and presents a useful message.
- **`HomePage.tsx`** — a placeholder for the authenticated application.
- **`NotFoundPage.tsx`** — handles URLs that do not match a defined route.

The home page is not yet protected by authentication. A polished page or successful navigation does not establish that the user has been authenticated.

### `src/App.css`

Contains component-level styles for the sign-in interface and message pages, including responsive layouts and mobile adjustments.

### `src/index.css`

Contains global styles such as CSS resets, base typography, and document-level styling.

Separating global styles from component styles helps keep the code organized.

## 5. Build the sign-in interface

The sign-in page provides the visual entry point to our application.

Its design includes:

- A clear application identity and sign-in heading.
- A Google sign-in button.
- Supporting security and authentication information.
- A visual overview of the React, Django, and Google architecture.
- Responsive styling for smaller screens.

The Google sign-in button currently displays an informational message rather than initiating the OAuth flow.

This is intentional: we first establish a working interface and route structure, then integrate authentication separately. It allows us to isolate frontend setup problems from authentication and session problems.

**Important:** A button that looks correct is not proof that Google authentication works. The next integration step must connect it to django-allauth's headless API.

## 6. Start and inspect the application

From the frontend project directory, run:

```bash
npm run dev
```

Open these URLs in a browser:

| URL | Expected result |
|---|---|
| `http://localhost:5173/` | Sign-in page |
| `http://localhost:5173/account/provider/callback` | Callback placeholder |
| `http://localhost:5173/account/social/login/error?error=unknown` | Authentication error page |
| `http://localhost:5173/home` | Placeholder home page |
| `http://localhost:5173/a-route-that-does-not-exist` | Not-found page |

The Django backend does not need to be running just to inspect these static frontend pages. It will be required when we integrate and test the real authentication flow.

## 7. Verify the production build

From the frontend directory, execute:

```bash
npm run build
```

This project uses a build script that runs TypeScript project checks before building the production frontend.

A successful build verifies that the configured TypeScript checks and Vite production build complete without errors. It does not prove that the authentication flow, API requests, cookies, or session handling work correctly.

If the build fails:

1. Read the first meaningful error in the terminal output.
2. Identify the file and line involved.
3. Fix the underlying issue rather than suppressing the error.
4. Run the build again.

Do not move on to authentication integration until the frontend compiles successfully.

## 8. Current implementation status

At the end of this step, we have:

- [x] A React + TypeScript frontend.
- [x] A Vite development server.
- [x] Client-side routing.
- [x] A sign-in page and Google sign-in button.
- [x] A frontend OAuth callback route.
- [x] An authentication error page.
- [x] A placeholder home page.
- [x] A not-found page.
- [x] Responsive styling.
- [ ] Real Google authentication initiated by the frontend.
- [ ] Callback processing and authenticated session verification.
- [ ] An authenticated route guard for the home page.

The frontend pages have been visually verified in the browser. Run the production build separately if it has not yet been verified.

## 9. Key concepts to remember

**Frontend routing is not authentication.** A user can navigate to `/home` unless we implement and enforce appropriate access controls.

**OAuth redirects involve both servers.** Google redirects to Django's registered callback URL. Django handles the provider response and then redirects the browser to the frontend callback URL when appropriate.

**A successful build is not an integration test.** TypeScript and Vite can validate the frontend code, but they cannot establish that Django correctly authenticates a Google user or maintains the resulting session.

**The backend remains responsible for authentication.** The React application initiates the user experience, while Django and django-allauth handle the trusted authentication flow and session state.

## Next step

Connect the Google sign-in button to django-allauth's headless API, implement the callback flow, and verify the authenticated session between the React frontend and Django backend.
