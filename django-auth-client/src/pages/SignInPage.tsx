import { useState } from "react";
import { Link } from "react-router";

import { GoogleMark } from "../components/GoogleMark";
import { Button } from "../components/Button";
import { signInWithGoogle } from "../auth/google";

export default function SignInPage() {
  const [notice, setNotice] = useState("");

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

          <Button
            className="google-button"
            type="button"
            onClick={() => void handleGoogleSignIn()}
          >
            <GoogleMark />
            <span>Continue with Google</span>
          </Button>

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
