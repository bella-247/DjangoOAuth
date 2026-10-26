import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import { getCurrentUser } from "./client";
import { AuthContext } from "./AuthContext";
import type { CurrentUser } from "./types";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadUser() {
    setError(null);

    try {
      setUser(await getCurrentUser());
    } catch {
      setUser(null);
      setError("Could not verify your session. Check that Django is running.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void Promise.resolve().then(loadUser);
  }, []);

  async function refresh() {
    setIsLoading(true);
    await loadUser();
  }

  const value = useMemo(
    () => ({ user, isLoading, error, refresh }),
    [user, isLoading, error],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
