"use client";

import { useState, useEffect, useCallback } from "react";
import type { YouTubeVideo, YouTubeLiveStream } from "@/lib/youtube/client";

interface UseYouTubeStreamsOptions {
  query?: string;
  limit?: number;
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
}

interface UseYouTubeStreamsResult {
  streams: YouTubeVideo[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useYouTubeStreams({
  query = "",
  limit = 20,
  autoRefresh = true,
  refreshInterval = 300000, // 5 minutes default (was 1 min - too aggressive for quota)
}: UseYouTubeStreamsOptions = {}): UseYouTubeStreamsResult {
  const [streams, setStreams] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStreams = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (query) params.set("q", query);
      params.set("limit", limit.toString());

      const response = await fetch(`/api/youtube/live?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch streams");
      }

      setStreams(data.streams || []);
    } catch (err: any) {
      setError(err.message || "Failed to fetch streams");
      console.error("Error fetching YouTube streams:", err);
    } finally {
      setLoading(false);
    }
  }, [query, limit]);

  useEffect(() => {
    fetchStreams();
  }, [fetchStreams]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchStreams, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchStreams]);

  return {
    streams,
    loading,
    error,
    refresh: fetchStreams,
  };
}

// Hook for fetching a single stream's details
export function useYouTubeStream(videoId: string | null) {
  const [stream, setStream] = useState<YouTubeLiveStream | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStream = useCallback(async () => {
    if (!videoId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/youtube/stream/${videoId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch stream");
      }

      setStream(data.stream);
    } catch (err: any) {
      setError(err.message || "Failed to fetch stream");
      console.error("Error fetching stream:", err);
    } finally {
      setLoading(false);
    }
  }, [videoId]);

  useEffect(() => {
    fetchStream();
  }, [fetchStream]);

  return { stream, loading, error, refresh: fetchStream };
}
