import { createContext } from "react";

import type { CurrentUser } from "./types";

export type AuthContextValue = {
  user: CurrentUser | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
