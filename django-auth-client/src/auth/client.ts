import type { CurrentUser, CurrentUserResponse } from "./types";

const DJANGO_API_URL = import.meta.env.VITE_DJANGO_API_URL;
let accessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export async function exchangeAuthorizationCode(code: string): Promise<void> {
  const response = await fetch(`${DJANGO_API_URL}/api/auth/exchange`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });

  if (!response.ok) {
    throw new Error(`Authorization code exchange failed: ${response.status}`);
  }

  const result: {
    status: number;
    data?: { access_token?: string };
  } = await response.json();
  const token = result.data?.access_token;
  if (result.status !== 200 || !token) {
    throw new Error("Django returned an invalid token response.");
  }
  setAccessToken(token);
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const headers: HeadersInit = accessToken
    ? { Authorization: `Bearer ${accessToken}` }
    : {};
  const response = await fetch(`${DJANGO_API_URL}/api/me`, {
    credentials: "include",
    headers,
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Django returned HTTP ${response.status}`);
  }

  const result: CurrentUserResponse = await response.json();
  return result.status === 200 && result.data?.user ? result.data.user : null;
}
