
import { useEffect, useState } from "react";

import {
  exchangeAuthorizationCode,
  getCurrentUser,
} from "../auth/client";
import { useAuth } from "../auth/useAuth";

type AuthState =
  | { status: "loading" }
  | {
      status: "authenticated";
      id: number;
      username: string;
      email: string;
    }
  | { status: "unauthenticated" }
  | { status: "error"; message: string };

export default function OAuthCallbackPage() {
  const [auth, setAuth] = useState<AuthState>({ status: "loading" });
  const { refresh } = useAuth();

  useEffect(() => {
    let cancelled = false;

    async function verifySession() {
      const params = new URLSearchParams(window.location.hash.slice(1));
      if (params.has("error")) {
        setAuth({ status: "unauthenticated" });
        return;
      }

      try {
        const code = params.get("code");
        if (!code) {
          setAuth({ status: "unauthenticated" });
          return;
        }
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname,
        );
        await exchangeAuthorizationCode(code);
        const user = await getCurrentUser();

        if (!user) {
          if (!cancelled) {
            setAuth({ status: "unauthenticated" });
          }
          return;
        }

        if (!cancelled) {
          await refresh();
          setAuth({
            status: "authenticated",
            id: user.id,
            username: user.username,
            email: user.email,
          });
        }
      } catch {
        if (!cancelled) {
          setAuth({
            status: "error",
            message:
              "Could not verify your session. Check that Django is running and try again.",
          });
        }
      }
    }

    void verifySession();

    return () => {
      cancelled = true;
    };
  }, [refresh]);

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "32px",
        background: "#f8fafc",
        color: "#172033",
        fontFamily: "inherit",
      }}
    >
      <header
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          padding: "16px 0",
          borderBottom: "1px solid #e2e8f0",
        }}
      >
        {auth.status === "authenticated" ? (
          <>
            <strong>Signed in as {auth.username}</strong>
            <div style={{ color: "#64748b", marginTop: "4px" }}>
              {auth.email}
            </div>
          </>
        ) : (
          <strong>Google authentication test</strong>
        )}
      </header>

      <section style={{ maxWidth: "900px", margin: "48px auto" }}>
        {auth.status === "loading" && <p>Verifying your Django session…</p>}

        {auth.status === "authenticated" && (
          <>
            <h1>Authentication successful</h1>
            <p>
              Django confirmed your session and returned your account
              information.
            </p>
            <dl className="account-details">
              <div className="account-detail">
                <dt>User ID</dt>
                <dd>{auth.id}</dd>
              </div>
              <div className="account-detail">
                <dt>Username</dt>
                <dd>{auth.username}</dd>
              </div>
              <div className="account-detail">
                <dt>Email</dt>
                <dd>{auth.email}</dd>
              </div>
            </dl>
          </>
        )}

        {auth.status === "unauthenticated" && (
          <>
            <h1>Authentication not confirmed</h1>
            <p>
              The callback was reached, but Django did not confirm an
              authenticated session.
            </p>
            <a href="/">Return to sign in</a>
          </>
        )}

        {auth.status === "error" && (
          <>
            <h1>Could not verify authentication</h1>
            <p>{auth.message}</p>
            <a href="/">Return to sign in</a>
          </>
        )}
      </section>
    </main>
  );
}
