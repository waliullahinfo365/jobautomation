"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { AuthSessionPayload } from "@/lib/api/auth.api";
import {
  canSeeAdvancedNavigation,
  getEffectiveUserRole,
  isAdvancedUiEnabled,
  type ProductRole,
} from "@/config/productMode";

export type AuthSession = {
  user: AuthSessionPayload["user"];
  tenant: AuthSessionPayload["tenant"];
  productRole: ProductRole;
  advancedUi: boolean;
};

const AuthSessionContext = createContext<AuthSession | null>(null);

export function AuthSessionProvider({
  session,
  children,
}: {
  session: AuthSession;
  children: ReactNode;
}) {
  return <AuthSessionContext.Provider value={session}>{children}</AuthSessionContext.Provider>;
}

export function useAuthSession(): AuthSession | null {
  return useContext(AuthSessionContext);
}

export function useProductRole(): ProductRole {
  const session = useAuthSession();
  return session?.productRole ?? "user";
}

export function useAdvancedUi(): boolean {
  const session = useAuthSession();
  return session?.advancedUi ?? false;
}

export function buildAuthSession(payload: {
  user: AuthSessionPayload["user"];
  tenant: AuthSessionPayload["tenant"];
}): AuthSession {
  const productRole = getEffectiveUserRole(payload.user);
  return {
    ...payload,
    productRole,
    advancedUi: canSeeAdvancedNavigation(payload.user) && isAdvancedUiEnabled(productRole),
  };
}
