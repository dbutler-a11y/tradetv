"use client";

import { useState, useEffect, useCallback } from "react";

export interface FollowedUser {
  id: string;
  followedId: string;
  createdAt: string;
  followed: {
    id: string;
    name?: string;
    image?: string;
    trader?: {
      id: string;
      displayName: string;
      avatarUrl?: string;
      verificationTier: string;
      winRate?: number;
      profitFactor?: number;
      monthlyPnl?: number;
      isLive?: boolean;
    };
  };
}

interface UseFollowResult {
  following: FollowedUser[];
  loading: boolean;
  error: string | null;
  follow: (followedId: string) => Promise<boolean>;
  unfollow: (followedId: string) => Promise<boolean>;
  isFollowing: (followedId: string) => boolean;
  refetch: () => Promise<void>;
}

export function useFollow(userId: string | null): UseFollowResult {
  const [following, setFollowing] = useState<FollowedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFollowing = useCallback(async () => {
    if (!userId) {
      setFollowing([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/follow?userId=${userId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch following");
      }

      setFollowing(data.following || []);
    } catch (err: any) {
      setError(err.message);
      console.error("Error fetching following:", err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchFollowing();
  }, [fetchFollowing]);

  const follow = useCallback(
    async (followedId: string): Promise<boolean> => {
      if (!userId) return false;

      try {
        const response = await fetch("/api/follow", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ followerId: userId, followedId }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to follow");
        }

        await fetchFollowing();
        return true;
      } catch (err: any) {
        setError(err.message);
        console.error("Error following:", err);
        return false;
      }
    },
    [userId, fetchFollowing]
  );

  const unfollow = useCallback(
    async (followedId: string): Promise<boolean> => {
      if (!userId) return false;

      try {
        const response = await fetch("/api/follow", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ followerId: userId, followedId }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to unfollow");
        }

        setFollowing((prev) => prev.filter((f) => f.followedId !== followedId));
        return true;
      } catch (err: any) {
        setError(err.message);
        console.error("Error unfollowing:", err);
        return false;
      }
    },
    [userId]
  );

  const isFollowing = useCallback(
    (followedId: string): boolean => {
      return following.some((f) => f.followedId === followedId);
    },
    [following]
  );

  return {
    following,
    loading,
    error,
    follow,
    unfollow,
    isFollowing,
    refetch: fetchFollowing,
  };
}
