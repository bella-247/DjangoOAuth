
import { Link } from "react-router";

export default function NotFoundPage() {
  return (
    <main className="message-layout">
      <section className="message-card">
        <p className="eyebrow">404 · PAGE NOT FOUND</p>
        <h1>This page doesn't exist.</h1>
        <p className="message-description">
          The address may be incorrect, or the page may have moved.
        </p>
        <Link className="primary-link" to="/">
          Go to sign in
        </Link>
      </section>
    </main>
  );
}
