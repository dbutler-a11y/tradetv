"use client";

import { useState, useEffect, useCallback } from "react";

export interface UserPreferences {
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    subscriptionTier: string;
    tradovateLinked: boolean;
  };
  preferences: {
    notifications: {
      onEntry: boolean;
      onExit: boolean;
      onProfit: boolean;
      onLoss: boolean;
      method: "push" | "email" | "both";
    };
    display: {
      theme: "light" | "dark" | "system";
      compactView: boolean;
      showPnl: boolean;
    };
  };
}

interface UseUserPreferencesResult {
  data: UserPreferences | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateProfile: (updates: { name?: string; image?: string }) => Promise<boolean>;
}

export function useUserPreferences(userId: string | null): UseUserPreferencesResult {
  const [data, setData] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPreferences = useCallback(async () => {
    if (!userId) {
      setData(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/user/preferences?userId=${userId}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch preferences");
      }

      setData(result);
    } catch (err: any) {
      setError(err.message);
      console.error("Error fetching preferences:", err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  const updateProfile = useCallback(
    async (updates: { name?: string; image?: string }): Promise<boolean> => {
      if (!userId) return false;

      try {
        const response = await fetch("/api/user/preferences", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, ...updates }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to update profile");
        }

        // Update local state with new user data
        if (data) {
          setData({
            ...data,
            user: result.user,
          });
        }

        return true;
      } catch (err: any) {
        setError(err.message);
        console.error("Error updating profile:", err);
        return false;
      }
    },
    [userId, data]
  );

  return {
    data,
    loading,
    error,
    refetch: fetchPreferences,
    updateProfile,
  };
}
