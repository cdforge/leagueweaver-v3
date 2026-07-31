"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { SignInModal } from "@/components/account/SignInModal";

type AuthMode = "signin" | "signup";
type AuthModalContextValue = { openSignIn: (mode?: AuthMode) => void };

const AuthModalContext = createContext<AuthModalContextValue>({
  // Graceful fallback if a trigger ever renders outside the provider.
  openSignIn: () => { if (typeof window !== "undefined") window.location.assign("/account"); },
});

export function useAuthModal() {
  return useContext(AuthModalContext);
}

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<{ open: boolean; mode: AuthMode }>({ open: false, mode: "signin" });
  const openSignIn = useCallback((mode: AuthMode = "signin") => setState({ open: true, mode }), []);
  const close = useCallback(() => setState((current) => ({ ...current, open: false })), []);
  const value = useMemo(() => ({ openSignIn }), [openSignIn]);

  return (
    <AuthModalContext.Provider value={value}>
      {children}
      {state.open && <SignInModal initialMode={state.mode} onClose={close} />}
    </AuthModalContext.Provider>
  );
}
