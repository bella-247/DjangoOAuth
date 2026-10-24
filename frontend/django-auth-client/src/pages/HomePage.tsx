
import { Link } from "react-router";

export default function HomePage() {
  return (
    <main className="message-layout">
      <section className="message-card">
        <div className="message-symbol home-symbol">✓</div>
        <p className="eyebrow">APPLICATION HOME</p>
        <h1>Your home, after sign-in.</h1>
        <p className="message-description">
          This page is a placeholder. We'll load the authenticated
          user's session from Django before allowing access.
        </p>
        <Link className="text-link" to="/">
          Return to sign in
        </Link>
      </section>
    </main>
  );
}
