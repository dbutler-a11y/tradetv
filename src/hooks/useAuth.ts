"use client";

import { useSession } from "next-auth/react";

/**
 * Custom hook to access authenticated user data
 * Returns the user ID, session data, and loading state
 */
export function useAuth() {
  const { data: session, status } = useSession();

  const userId = session?.user?.id ?? null;
  const user = session?.user ?? null;
  const isLoading = status === "loading";
  const isAuthenticated = status === "authenticated";

  return {
    userId,
    user,
    session,
    isLoading,
    isAuthenticated,
    status,
  };
}

/**
 * Hook that requires authentication
 * Will return loading state while checking, then redirect if not authenticated
 */
export function useRequireAuth() {
  const auth = useAuth();

  // For demo purposes, return a demo user ID if not authenticated
  // In production, you'd redirect to login
  const effectiveUserId = auth.userId ?? "demo-user-123";

  return {
    ...auth,
    userId: effectiveUserId,
    isDemo: !auth.userId,
  };
}
