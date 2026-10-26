const DJANGO_API_URL = import.meta.env.VITE_DJANGO_API_URL;
const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL;
const AUTH_MODE = import.meta.env.VITE_DJANGO_AUTH_MODE ?? "session";

export async function signInWithGoogle(): Promise<void> {
  // 1. Ask Django for its headless configuration and receive
  //    the CSRF cookie.
  const response = await fetch(
    `${DJANGO_API_URL}/_allauth/browser/v1/config`,
    { credentials: "include" },
  );

  if (!response.ok) {
    throw new Error(
      `Authentication configuration failed: ${response.status}`,
    );
  }

  // 2. Read the CSRF cookie.
  const csrfCookie = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith("csrftoken="));

  if (!csrfCookie) {
    throw new Error("Django did not provide a CSRF cookie.");
  }

  const csrfToken = decodeURIComponent(
    csrfCookie.substring("csrftoken=".length),
  );

  // 3. Prepare a normal browser form to start the OAuth redirect.
  const form = document.createElement("form");
  form.method = "POST";
  form.action =
    `${DJANGO_API_URL}/_allauth/browser/v1/auth/provider/redirect`;
  form.hidden = true;

  const fields: Record<string, string> = {
    provider: "google",
    process: "login",
    callback_url:
      AUTH_MODE === "cross-domain"
        ? `${DJANGO_API_URL}/api/auth/callback`
        : `${FRONTEND_URL}/account/provider/callback`,
    csrfmiddlewaretoken: csrfToken,
  };

  for (const [name, value] of Object.entries(fields)) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.appendChild(input);
  }

  // 4. Submit the form; the browser follows Django's redirect to Google.
  document.body.appendChild(form);
  form.submit();
}
