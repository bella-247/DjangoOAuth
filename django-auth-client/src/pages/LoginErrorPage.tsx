
import { Link, useSearchParams } from "react-router";

export default function LoginErrorPage() {
  const [searchParams] = useSearchParams();
  const error = searchParams.get("error");

  return (
    <main className="message-layout">
      <section className="message-card">
        <div className="message-symbol error-symbol">!</div>
        <p className="eyebrow">SIGN-IN INTERRUPTED</p>
        <h1>We couldn't sign you in.</h1>
        <p className="message-description">
          The authentication flow did not complete. You can return
          to the sign-in page and try again.
        </p>

        {error && (
          <p className="error-detail">
            Error code: <code>{error}</code>
          </p>
        )}

        <Link className="primary-link" to="/">
          Back to sign in
        </Link>
      </section>
    </main>
  );
}
