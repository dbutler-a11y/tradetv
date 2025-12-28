import { NextRequest, NextResponse } from "next/server";
import {
  pollAllChannelsOptimized,
  getRecommendedPollingInterval,
  MONITORED_CHANNELS,
} from "@/lib/youtube/channel-monitor";
import { getQuotaStatus, isMarketHours } from "@/lib/monitoring/quota-manager";

/**
 * GET /api/monitor/poll
 *
 * OPTIMIZED for free tier usage:
 * - Uses RSS feeds (free) + videos.list (1 unit) instead of search.list (100 units)
 * - 100x more efficient: 2,000 polls/day vs 20 polls/day for same quota
 * - Smart polling based on market hours and remaining quota
 *
 * This endpoint is designed to be called by:
 * 1. Vercel Cron (every 1-5 minutes during market hours)
 * 2. n8n webhook
 * 3. External monitoring service
 */
export async function GET(request: NextRequest) {
  // Verify cron secret for security (optional)
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    // Allow without auth in development
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // Check market hours - reduce polling outside market hours
  const marketOpen = isMarketHours();
  const quotaStatus = getQuotaStatus();
  const pollingRecommendation = getRecommendedPollingInterval();

  console.log(
    `[${new Date().toISOString()}] Polling ${MONITORED_CHANNELS.length} channels...` +
      ` Market: ${marketOpen ? "OPEN" : "CLOSED"} | Quota: ${quotaStatus.used}/${10000}`
  );

  const startTime = Date.now();
  const { liveStreams, errors, quotaUsed, quotaStatus: updatedQuota } =
    await pollAllChannelsOptimized();
  const duration = Date.now() - startTime;

  // Log results
  console.log(
    `Poll complete in ${duration}ms: ${liveStreams.length} live, ${errors.length} errors, ${quotaUsed} quota used`
  );

  // For each new live stream, trigger capture (in production)
  const newLiveStreams = liveStreams.filter((stream) => {
    const channel = MONITORED_CHANNELS.find(
      (c) => c.youtubeChannelId === stream.channelId
    );
    // Check if this is a new stream (not already being captured)
    return channel && !channel.currentStreamId;
  });

  if (newLiveStreams.length > 0) {
    console.log(
      `New live streams detected: ${newLiveStreams.map((s) => s.channelName).join(", ")}`
    );
  }

  return NextResponse.json({
    success: true,
    polledAt: new Date().toISOString(),
    duration: `${duration}ms`,
    channelsPolled: MONITORED_CHANNELS.length,

    // Market status
    marketOpen,
    recommendedInterval: pollingRecommendation,

    // Quota tracking
    quota: {
      used: updatedQuota.used,
      remaining: updatedQuota.remaining,
      percentUsed: updatedQuota.percentUsed.toFixed(1) + "%",
      thisRequest: quotaUsed,
    },

    // Live streams
    liveStreams: liveStreams.map((s) => ({
      channel: s.channelName,
      streamId: s.streamId,
      title: s.title,
      viewers: s.viewerCount,
      watchUrl: `https://youtube.com/watch?v=${s.streamId}`,
      thumbnailUrl: s.thumbnailUrl,
    })),
    newStreamsDetected: newLiveStreams.length,
    errors: errors.length > 0 ? errors : undefined,
  });
}

/**
 * POST /api/monitor/poll
 *
 * Manual trigger with options
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { channelIds, forceCheck = false } = body;

    // If specific channels requested, filter
    let channelsToCheck = MONITORED_CHANNELS;
    if (channelIds && Array.isArray(channelIds)) {
      channelsToCheck = MONITORED_CHANNELS.filter((c) =>
        channelIds.includes(c.id)
      );
    }

    // Check quota before proceeding
    const quotaStatus = getQuotaStatus();
    if (!forceCheck && quotaStatus.remaining < 10) {
      return NextResponse.json(
        {
          error: "Quota limit reached",
          quota: quotaStatus,
          suggestion: "Wait for daily reset or use forceCheck: true",
        },
        { status: 429 }
      );
    }

    const { liveStreams, errors, quotaUsed, quotaStatus: updatedQuota } =
      await pollAllChannelsOptimized();

    return NextResponse.json({
      success: true,
      polledAt: new Date().toISOString(),
      channelsPolled: channelsToCheck.length,
      liveStreams,
      errors,
      quota: {
        used: updatedQuota.used,
        remaining: updatedQuota.remaining,
        thisRequest: quotaUsed,
      },
    });
  } catch (error) {
    console.error("Poll error:", error);
    return NextResponse.json(
      { error: "Failed to poll channels" },
      { status: 500 }
    );
  }
}
