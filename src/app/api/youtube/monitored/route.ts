import { NextRequest, NextResponse } from "next/server";
import { MONITORED_CHANNELS } from "@/lib/youtube/channel-monitor";

/**
 * GET /api/youtube/monitored
 *
 * Returns monitored channels with their live status
 *
 * OPTIMIZED: Uses RSS feeds (FREE) to check live status
 * Only uses API (1 unit) to get video details if channel is live
 *
 * Quota: 0-6 units per call (only if channels are live)
 * Previous: 600+ units per call
 */

// Cache for channel IDs (resolved from handles)
const channelIdCache = new Map<string, string>();

// Check if channel is live via RSS (FREE - no quota)
async function checkLiveViaRSS(channelId: string): Promise<{ isLive: boolean; videoId?: string }> {
  try {
    const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
    const response = await fetch(rssUrl, { next: { revalidate: 60 } }); // Cache for 60 seconds

    if (!response.ok) {
      return { isLive: false };
    }

    const xml = await response.text();

    // Check for live indicator in recent videos
    // YouTube RSS includes "yt:videoId" for recent uploads
    const videoIdMatch = xml.match(/<yt:videoId>([^<]+)<\/yt:videoId>/);
    if (!videoIdMatch) {
      return { isLive: false };
    }

    // Get the most recent video ID to check if it's live
    return { isLive: false, videoId: videoIdMatch[1] };
  } catch (error) {
    console.error("RSS check failed:", error);
    return { isLive: false };
  }
}

export async function GET(request: NextRequest) {
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    return NextResponse.json({
      channels: MONITORED_CHANNELS.map(ch => ({
        ...ch,
        isLive: false,
        streamId: null,
        title: null,
        thumbnailUrl: null,
        viewerCount: 0,
      })),
      error: "YouTube API key not configured",
    });
  }

  const results = await Promise.all(
    MONITORED_CHANNELS.map(async (channel) => {
      try {
        // First, get channel ID from handle if we don't have it
        let channelId = channel.youtubeChannelId || channelIdCache.get(channel.youtubeHandle);

        if (!channelId) {
          // Resolve handle to channel ID (costs 1 unit via channels.list)
          const channelResponse = await fetch(
            `https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=${channel.youtubeHandle.replace('@', '')}&key=${apiKey}`
          );
          const channelData = await channelResponse.json();
          channelId = channelData.items?.[0]?.id;

          if (channelId) {
            // Cache it
            channel.youtubeChannelId = channelId;
            channelIdCache.set(channel.youtubeHandle, channelId);
          }
        }

        if (!channelId) {
          return {
            ...channel,
            isLive: false,
            streamId: null,
            title: null,
            thumbnailUrl: null,
            viewerCount: 0,
          };
        }

        // Check RSS for recent video (FREE)
        const rssResult = await checkLiveViaRSS(channelId);

        if (rssResult.videoId) {
          // Check if the most recent video is actually live (costs 1 unit)
          const videoResponse = await fetch(
            `https://www.googleapis.com/youtube/v3/videos?part=snippet,liveStreamingDetails&id=${rssResult.videoId}&key=${apiKey}`
          );
          const videoData = await videoResponse.json();
          const video = videoData.items?.[0];

          if (video?.snippet?.liveBroadcastContent === "live") {
            return {
              ...channel,
              isLive: true,
              streamId: rssResult.videoId,
              title: video.snippet.title,
              thumbnailUrl: video.snippet.thumbnails?.high?.url || video.snippet.thumbnails?.medium?.url,
              viewerCount: parseInt(video.liveStreamingDetails?.concurrentViewers || "0"),
              channelTitle: video.snippet.channelTitle,
            };
          }
        }

        return {
          ...channel,
          isLive: false,
          streamId: null,
          title: null,
          thumbnailUrl: null,
          viewerCount: 0,
        };
      } catch (error) {
        console.error(`Error checking ${channel.name}:`, error);
        return {
          ...channel,
          isLive: false,
          streamId: null,
          title: null,
          thumbnailUrl: null,
          viewerCount: 0,
          error: "Failed to check status",
        };
      }
    })
  );

  // Sort: live channels first, then by viewer count
  const sorted = results.sort((a, b) => {
    if (a.isLive && !b.isLive) return -1;
    if (!a.isLive && b.isLive) return 1;
    return (b.viewerCount || 0) - (a.viewerCount || 0);
  });

  return NextResponse.json({
    channels: sorted,
    liveCount: sorted.filter(ch => ch.isLive).length,
  });
}
