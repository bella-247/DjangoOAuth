import { useState } from "react";
import { Link } from "react-router";

// Auth Handler

const DJANGO_API_URL = "http://localhost:8000";

async function startGoogleSignIn() {
  // Ask Django for its configuration and let the browser store
  // the CSRF cookie returned by the response.
  const response = await fetch(`${DJANGO_API_URL}/_allauth/browser/v1/config`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Could not initialize Google sign-in.");
  }

  const csrfCookie = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith("csrftoken="));

  if (!csrfCookie) {
    throw new Error("Django did not provide a CSRF cookie.");
  }

  const csrfToken = decodeURIComponent(
    csrfCookie.substring("csrftoken=".length),
  );

  // Submit a normal browser form so Django's 302 redirect
  // takes the browser to Google's authorization page.
  const form = document.createElement("form");
  form.method = "POST";
  form.action = `${DJANGO_API_URL}/_allauth/browser/v1/auth/provider/redirect`;
  form.hidden = true;

  const fields: Record<string, string> = {
    provider: "google",
    process: "login",
    callback_url: `${window.location.origin}/account/provider/callback`,
    csrfmiddlewaretoken: csrfToken,
  };

  for (const [name, value] of Object.entries(fields)) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.appendChild(input);
  }

  document.body.appendChild(form);
  form.submit();
}

function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" className="google-mark">
      <path
        fill="#4285F4"
        d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.1h6.6c3.9-3.6 6.1-8.8 6.1-15Z"
      />
      <path
        fill="#34A853"
        d="M24 44c5.5 0 10.1-1.8 13.5-4.8l-6.6-5.1c-1.8 1.2-4.1 2-6.9 2-5.3 0-9.8-3.6-11.4-8.4H5.8v5.3A20 20 0 0 0 24 44Z"
      />
      <path
        fill="#FBBC05"
        d="M12.6 27.7a12 12 0 0 1 0-7.4V15H5.8a20 20 0 0 0 0 18Z"
      />
      <path
        fill="#EA4335"
        d="M24 11.9c3 0 5.7 1 7.8 3.1l5.8-5.8A19.3 19.3 0 0 0 24 4 20 20 0 0 0 5.8 15l6.8 5.3c1.6-4.8 6.1-8.4 11.4-8.4Z"
      />
    </svg>
  );
}

export default function SignInPage() {
  const [notice, setNotice] = useState("");

  return (
    <main className="auth-layout">
      <section className="auth-panel">
        <Link to="/" className="brand" aria-label="Django Auth home">
          <span className="brand-mark">d</span>
          <span>
            django<span className="brand-light">auth</span>
          </span>
        </Link>

        <div className="auth-content">
          <div className="eyebrow">
            <span className="status-dot" />
            SECURE SIGN-IN
          </div>

          <h1>Welcome back.</h1>
          <p className="auth-description">
            Sign in to continue to your account. Simple, secure, and powered by
            Google.
          </p>

          <button
            className="google-button"
            type="button"
            onClick={() => void startGoogleSignIn()}
          >
            <GoogleMark />
            <span>Continue with Google</span>
          </button>

          {notice && (
            <p className="inline-notice" role="status">
              {notice}
            </p>
          )}

          <div className="auth-divider">
            <span />
            <span>YOUR ACCOUNT, YOUR CONTROL</span>
            <span />
          </div>

          <div className="security-note">
            <span className="security-icon" aria-hidden="true">
              ⌑
            </span>
            <p>
              Your authentication is handled securely by the backend. Your
              Google password is never shared with this application.
            </p>
          </div>
        </div>

        <footer className="auth-footer">
          <span>© 2026 Django Auth Demo</span>
          <span>Built for learning</span>
        </footer>
      </section>

      <aside className="visual-panel">
        <div className="visual-orb orb-one" />
        <div className="visual-orb orb-two" />

        <div className="visual-content">
          <div className="visual-label">
            <span className="visual-label-dot" />
            IDENTITY &amp; ACCESS
          </div>

          <div className="visual-heading">
            <span>One sign-in.</span>
            <span className="muted-heading">A simpler way</span>
            <span className="muted-heading">to get started.</span>
          </div>

          <p className="visual-description">
            A focused authentication demo built with React, Django, and Google
            OAuth.
          </p>

          <div className="architecture-card">
            <div className="architecture-row">
              <span className="architecture-icon react-icon">R</span>
              <div>
                <strong>React</strong>
                <span>Frontend experience</span>
              </div>
              <span className="architecture-status">UI</span>
            </div>

            <div className="architecture-connector" />

            <div className="architecture-row">
              <span className="architecture-icon django-icon">D</span>
              <div>
                <strong>Django</strong>
                <span>Authentication &amp; sessions</span>
              </div>
              <span className="architecture-status">API</span>
            </div>

            <div className="architecture-connector" />

            <div className="architecture-row">
              <span className="architecture-icon google-icon">G</span>
              <div>
                <strong>Google OAuth</strong>
                <span>Identity provider</span>
              </div>
              <span className="architecture-status">OAuth</span>
            </div>
          </div>
        </div>

        <div className="visual-bottom">
          <span>AUTHENTICATION, MADE CLEAR.</span>
          <span className="visual-bottom-line" />
        </div>
      </aside>
    </main>
  );
}
