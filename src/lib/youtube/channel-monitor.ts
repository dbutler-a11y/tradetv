/**
 * YouTube Channel Monitor
 *
 * Polls YouTube channels to detect when they go live.
 * Designed to run as a cron job or background service.
 *
 * QUOTA OPTIMIZATION:
 * - Uses RSS feeds (free) + videos.list (1 unit) instead of search.list (100 units)
 * - With 5 channels and 10,000 daily quota:
 *   - Old method (search): ~100 checks/day total
 *   - New method (hybrid): ~2,000 checks/day per channel
 */

import { YouTubeClient } from "./client";
import {
  checkChannelLiveHybrid,
  getQuotaStatus,
  isMarketHours,
  calculatePollingStrategy,
  recordApiUsage,
} from "../monitoring/quota-manager";

export interface MonitoredChannel {
  id: string;
  name: string;
  youtubeHandle: string;  // e.g., "@PatrickWieland"
  youtubeChannelId?: string;  // e.g., "UCxxxxxxxx"
  platform: "tradovate" | "ninjatrader" | "tradingview" | "thinkorswim" | "unknown";
  isLive: boolean;
  currentStreamId?: string;
  currentStreamTitle?: string;
  lastChecked?: Date;
  lastLiveAt?: Date;
}

export interface LiveStreamInfo {
  channelId: string;
  channelName: string;
  streamId: string;
  title: string;
  viewerCount: number;
  startedAt: string;
  thumbnailUrl: string;
}

// Channels to monitor - stored in database in production
export const MONITORED_CHANNELS: MonitoredChannel[] = [
  {
    id: "patrick-wieland",
    name: "Patrick Wieland",
    youtubeHandle: "@PatrickWieland",
    platform: "tradovate",
    isLive: false,
  },
  {
    id: "lu-smooth-trader",
    name: "Lu Smooth Trader",
    youtubeHandle: "@LuSmoothTrader",
    platform: "tradovate",
    isLive: false,
  },
  {
    id: "pasha-irl",
    name: "Pasha IRL",
    youtubeHandle: "@pashairl",
    platform: "tradovate",
    isLive: false,
  },
  {
    id: "roensch-capital",
    name: "Roensch Capital",
    youtubeHandle: "@RoenschCapital",
    platform: "tradingview",
    isLive: false,
  },
  {
    id: "ninjatrader",
    name: "NinjaTrader",
    youtubeHandle: "@NinjaTrader",
    platform: "ninjatrader",
    isLive: false,
  },
];

/**
 * Resolve YouTube handle to channel ID
 */
export async function resolveChannelId(handle: string): Promise<string | null> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    console.warn("YOUTUBE_API_KEY not set");
    return null;
  }

  try {
    // Remove @ if present
    const cleanHandle = handle.startsWith("@") ? handle.slice(1) : handle;

    // Search for channel by handle
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(cleanHandle)}&key=${apiKey}`
    );

    if (!response.ok) {
      console.error("Failed to resolve channel:", response.statusText);
      return null;
    }

    const data = await response.json();

    if (data.items && data.items.length > 0) {
      return data.items[0].snippet.channelId;
    }

    return null;
  } catch (error) {
    console.error("Error resolving channel ID:", error);
    return null;
  }
}

/**
 * Check if a channel is currently live
 */
export async function checkChannelLiveStatus(channelId: string): Promise<LiveStreamInfo | null> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    console.warn("YOUTUBE_API_KEY not set");
    return null;
  }

  try {
    // Search for live streams from this channel
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&eventType=live&type=video&key=${apiKey}`
    );

    if (!response.ok) {
      console.error("Failed to check live status:", response.statusText);
      return null;
    }

    const data = await response.json();

    if (data.items && data.items.length > 0) {
      const liveStream = data.items[0];

      // Get live stream details including viewer count
      const detailsResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=liveStreamingDetails,snippet&id=${liveStream.id.videoId}&key=${apiKey}`
      );

      const detailsData = await detailsResponse.json();
      const details = detailsData.items?.[0];

      return {
        channelId,
        channelName: liveStream.snippet.channelTitle,
        streamId: liveStream.id.videoId,
        title: liveStream.snippet.title,
        viewerCount: parseInt(details?.liveStreamingDetails?.concurrentViewers || "0"),
        startedAt: details?.liveStreamingDetails?.actualStartTime || new Date().toISOString(),
        thumbnailUrl: liveStream.snippet.thumbnails?.high?.url || liveStream.snippet.thumbnails?.default?.url,
      };
    }

    return null;
  } catch (error) {
    console.error("Error checking live status:", error);
    return null;
  }
}

/**
 * Poll all monitored channels for live status
 * Uses original search.list method (100 units per channel)
 * @deprecated Use pollAllChannelsOptimized instead for 100x less quota usage
 */
export async function pollAllChannels(): Promise<{
  liveStreams: LiveStreamInfo[];
  errors: { channelId: string; error: string }[];
}> {
  const results: LiveStreamInfo[] = [];
  const errors: { channelId: string; error: string }[] = [];

  for (const channel of MONITORED_CHANNELS) {
    try {
      // Resolve channel ID if we don't have it
      let channelId: string | undefined = channel.youtubeChannelId;
      if (!channelId) {
        const resolved = await resolveChannelId(channel.youtubeHandle);
        if (resolved) {
          channelId = resolved;
          channel.youtubeChannelId = channelId;
        }
      }

      if (!channelId) {
        errors.push({ channelId: channel.id, error: "Could not resolve channel ID" });
        continue;
      }

      const liveInfo = await checkChannelLiveStatus(channelId);

      if (liveInfo) {
        results.push(liveInfo);
        channel.isLive = true;
        channel.currentStreamId = liveInfo.streamId;
        channel.currentStreamTitle = liveInfo.title;
        channel.lastLiveAt = new Date();
      } else {
        channel.isLive = false;
        channel.currentStreamId = undefined;
        channel.currentStreamTitle = undefined;
      }

      channel.lastChecked = new Date();

      // Rate limit - wait 100ms between channels
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error) {
      errors.push({
        channelId: channel.id,
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  return { liveStreams: results, errors };
}

/**
 * OPTIMIZED: Poll all channels using hybrid RSS + API approach
 *
 * Quota usage comparison for 5 channels:
 * - Old method (search.list): 500 units per poll = 20 polls/day
 * - New method (hybrid): 5 units per poll = 2,000 polls/day
 *
 * That's 100x more polling for the same quota!
 */
export async function pollAllChannelsOptimized(): Promise<{
  liveStreams: LiveStreamInfo[];
  errors: { channelId: string; error: string }[];
  quotaUsed: number;
  quotaStatus: { used: number; remaining: number; percentUsed: number };
}> {
  const results: LiveStreamInfo[] = [];
  const errors: { channelId: string; error: string }[] = [];
  let totalQuotaUsed = 0;

  // Check if we should poll based on market hours and quota
  const quotaStatus = getQuotaStatus();
  const strategy = calculatePollingStrategy({
    dailyLimit: 10000,
    channels: MONITORED_CHANNELS.length,
    marketHoursOnly: true,
    marketOpenHour: 9,
    marketCloseHour: 16,
  });

  // Skip polling if quota is exhausted
  if (strategy.strategy === "minimal" && quotaStatus.remaining < 50) {
    console.log("[Monitor] Skipping poll - quota exhausted");
    return {
      liveStreams: [],
      errors: [{ channelId: "system", error: "Daily quota exhausted" }],
      quotaUsed: 0,
      quotaStatus,
    };
  }

  for (const channel of MONITORED_CHANNELS) {
    try {
      // Resolve channel ID if we don't have it (costs 100 units first time)
      let channelId: string | undefined = channel.youtubeChannelId;
      if (!channelId) {
        const resolved = await resolveChannelId(channel.youtubeHandle);
        if (resolved) {
          channelId = resolved;
          channel.youtubeChannelId = channelId;
          recordApiUsage("search"); // resolveChannelId uses search
          totalQuotaUsed += 100;
        }
      }

      if (!channelId) {
        errors.push({ channelId: channel.id, error: "Could not resolve channel ID" });
        continue;
      }

      // Use optimized hybrid check (RSS free + videos.list 1 unit)
      const result = await checkChannelLiveHybrid(channelId);
      totalQuotaUsed += result.quotaUsed;

      if (result.isLive && result.streamId) {
        // Get additional details if live (1 more unit)
        const liveInfo: LiveStreamInfo = {
          channelId,
          channelName: channel.name,
          streamId: result.streamId,
          title: channel.currentStreamTitle || "Live Stream",
          viewerCount: 0,
          startedAt: new Date().toISOString(),
          thumbnailUrl: `https://i.ytimg.com/vi/${result.streamId}/maxresdefault_live.jpg`,
        };

        results.push(liveInfo);
        channel.isLive = true;
        channel.currentStreamId = result.streamId;
        channel.lastLiveAt = new Date();

        console.log(`[Monitor] ${channel.name} is LIVE! (via ${result.method})`);
      } else {
        channel.isLive = false;
        channel.currentStreamId = undefined;
        channel.currentStreamTitle = undefined;
      }

      channel.lastChecked = new Date();

      // Small delay between channels
      await new Promise(resolve => setTimeout(resolve, 50));

    } catch (error) {
      errors.push({
        channelId: channel.id,
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  const finalQuotaStatus = getQuotaStatus();
  console.log(
    `[Monitor] Poll complete. Quota: ${finalQuotaStatus.used}/${10000} (${finalQuotaStatus.percentUsed.toFixed(1)}%)`
  );

  return {
    liveStreams: results,
    errors,
    quotaUsed: totalQuotaUsed,
    quotaStatus: finalQuotaStatus,
  };
}

/**
 * Get recommended polling interval based on current quota usage
 */
export function getRecommendedPollingInterval(): {
  intervalMinutes: number;
  reason: string;
  marketOpen: boolean;
} {
  const marketOpen = isMarketHours();
  const strategy = calculatePollingStrategy({
    dailyLimit: 10000,
    channels: MONITORED_CHANNELS.length,
    marketHoursOnly: true,
    marketOpenHour: 9,
    marketCloseHour: 16,
  });

  if (!marketOpen) {
    return {
      intervalMinutes: 30,
      reason: "Market closed - reduced polling",
      marketOpen: false,
    };
  }

  return {
    intervalMinutes: strategy.pollIntervalMinutes,
    reason: `${strategy.strategy} mode - ${strategy.remaining} quota remaining`,
    marketOpen: true,
  };
}

/**
 * Get the embed URL for a live stream
 */
export function getStreamEmbedUrl(streamId: string): string {
  return `https://www.youtube.com/embed/${streamId}?autoplay=1`;
}

/**
 * Get the stream URL for capturing with yt-dlp
 */
export function getStreamCaptureUrl(streamId: string): string {
  return `https://www.youtube.com/watch?v=${streamId}`;
}
