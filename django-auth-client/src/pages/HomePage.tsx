
import { Link } from "react-router";

import { useAuth } from "../auth/useAuth";

export default function HomePage() {
  const { user } = useAuth();

  return (
    <main className="message-layout">
      <section className="message-card">
        <div className="message-symbol home-symbol">✓</div>
        <p className="eyebrow">APPLICATION HOME</p>
        <h1>Welcome, {user?.username}.</h1>
        <p className="message-description">
          Django confirmed your authenticated session. Your account details are
          available below.
        </p>
        <dl className="account-details">
          <div className="account-detail">
            <dt>User ID</dt>
            <dd>{user?.id}</dd>
          </div>
          <div className="account-detail">
            <dt>Username</dt>
            <dd>{user?.username}</dd>
          </div>
          <div className="account-detail">
            <dt>Email</dt>
            <dd>{user?.email}</dd>
          </div>
        </dl>
        <Link className="text-link" to="/">
          Return to sign in
        </Link>
      </section>
    </main>
  );
}
