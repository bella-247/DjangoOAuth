
import { useEffect, useState } from "react";

const DJANGO_API_URL = import.meta.env.VITE_DJANGO_API_URL;

type SessionResponse = {
  data?: {
    user?: {
      display?: string;
      email?: string;
      username?: string;
    };
  };
  meta?: {
    is_authenticated?: boolean;
  };
};

type AuthState =
  | { status: "loading" }
  | { status: "authenticated"; name: string; email: string }
  | { status: "unauthenticated" }
  | { status: "error"; message: string };

export default function OAuthCallbackPage() {
  const [auth, setAuth] = useState<AuthState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function verifySession() {
      const params = new URLSearchParams(window.location.search);
      if (params.has("error")) {
        setAuth({ status: "unauthenticated" });
        return;
      }

      try {
        const response = await fetch(
          `${DJANGO_API_URL}/_allauth/browser/v1/auth/session`,
          { credentials: "include" },
        );

        if (response.status === 401) {
          if (!cancelled) {
            setAuth({ status: "unauthenticated" });
          }
          return;
        }

        if (!response.ok) {
          throw new Error(`Django returned HTTP ${response.status}`);
        }

        const result: SessionResponse = await response.json();

        if (!result.meta?.is_authenticated || !result.data?.user) {
          if (!cancelled) {
            setAuth({ status: "unauthenticated" });
          }
          return;
        }

        const user = result.data.user;

        if (!cancelled) {
          setAuth({
            status: "authenticated",
            name: user.display || user.username || user.email || "Google user",
            email: user.email || "",
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
  }, []);

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
            <strong>Signed in as {auth.name}</strong>
            {auth.email && (
              <div style={{ color: "#64748b", marginTop: "4px" }}>
                {auth.email}
              </div>
            )}
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
              Django confirmed that you are authenticated and returned your
              account information.
            </p>
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
