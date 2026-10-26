import { Navigate, Outlet } from "react-router";

import { useAuth } from "../auth/useAuth";

export function ProtectedRoute() {
  const { user, isLoading, error } = useAuth();

  if (isLoading) {
    return (
      <main className="message-layout" aria-busy="true">
        <section className="message-card">
          <p className="eyebrow">AUTHENTICATION</p>
          <h1>Checking your session.</h1>
          <p className="message-description">Verifying your account with Django…</p>
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main className="message-layout">
        <section className="message-card">
          <p className="eyebrow">CONNECTION ERROR</p>
          <h1>We couldn't verify your session.</h1>
          <p className="message-description">{error}</p>
        </section>
      </main>
    );
  }

  return user ? <Outlet /> : <Navigate to="/" replace />;
}
