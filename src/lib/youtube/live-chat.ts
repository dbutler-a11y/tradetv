/**
 * YouTube Live Chat API Integration
 *
 * Fetches real chat messages from YouTube live streams
 * Quota: 5 units per liveChatMessages.list call
 */

const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";

export interface YouTubeChatMessage {
  id: string;
  authorChannelId: string;
  authorDisplayName: string;
  authorProfileImageUrl: string;
  message: string;
  publishedAt: string;
  isChatOwner: boolean;
  isChatModerator: boolean;
  isChatSponsor: boolean;
}

export interface LiveChatResponse {
  messages: YouTubeChatMessage[];
  nextPageToken?: string;
  pollingIntervalMs: number;
  error?: string;
}

/**
 * Get the liveChatId for a video
 * Quota: 1 unit (videos.list)
 */
export async function getLiveChatId(videoId: string): Promise<string | null> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    console.error("YouTube API key not configured");
    return null;
  }

  try {
    const response = await fetch(
      `${YOUTUBE_API_BASE}/videos?part=liveStreamingDetails&id=${videoId}&key=${apiKey}`
    );

    if (!response.ok) {
      const error = await response.json();
      console.error("Failed to get liveChatId:", error);
      return null;
    }

    const data = await response.json();

    if (!data.items?.length) {
      return null;
    }

    return data.items[0].liveStreamingDetails?.activeLiveChatId || null;
  } catch (error) {
    console.error("Error getting liveChatId:", error);
    return null;
  }
}

/**
 * Fetch live chat messages
 * Quota: 5 units per call
 */
export async function fetchLiveChatMessages(
  liveChatId: string,
  pageToken?: string
): Promise<LiveChatResponse> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return {
      messages: [],
      pollingIntervalMs: 2700000, // 45 minutes
      error: "YouTube API key not configured",
    };
  }

  try {
    const params = new URLSearchParams({
      liveChatId,
      part: "snippet,authorDetails",
      maxResults: "200",
      key: apiKey,
    });

    if (pageToken) {
      params.set("pageToken", pageToken);
    }

    const response = await fetch(
      `${YOUTUBE_API_BASE}/liveChat/messages?${params.toString()}`
    );

    if (!response.ok) {
      const error = await response.json();

      // Check for specific errors
      if (error.error?.errors?.[0]?.reason === "liveChatEnded") {
        return {
          messages: [],
          pollingIntervalMs: 2700000,
          error: "Live chat has ended",
        };
      }

      if (error.error?.errors?.[0]?.reason === "liveChatNotFound") {
        return {
          messages: [],
          pollingIntervalMs: 2700000,
          error: "Live chat not found",
        };
      }

      return {
        messages: [],
        pollingIntervalMs: 2700000,
        error: error.error?.message || "Failed to fetch chat",
      };
    }

    const data = await response.json();

    const messages: YouTubeChatMessage[] = (data.items || []).map((item: any) => ({
      id: item.id,
      authorChannelId: item.authorDetails?.channelId || "",
      authorDisplayName: item.authorDetails?.displayName || "Anonymous",
      authorProfileImageUrl: item.authorDetails?.profileImageUrl || "",
      message: item.snippet?.displayMessage || item.snippet?.textMessageDetails?.messageText || "",
      publishedAt: item.snippet?.publishedAt || new Date().toISOString(),
      isChatOwner: item.authorDetails?.isChatOwner || false,
      isChatModerator: item.authorDetails?.isChatModerator || false,
      isChatSponsor: item.authorDetails?.isChatSponsor || false,
    }));

    return {
      messages,
      nextPageToken: data.nextPageToken,
      // YouTube recommends polling interval, but we override to 45 min for quota savings
      pollingIntervalMs: 2700000, // 45 minutes (was: data.pollingIntervalMillis || 5000)
    };
  } catch (error) {
    console.error("Error fetching live chat:", error);
    return {
      messages: [],
      pollingIntervalMs: 2700000,
      error: "Failed to fetch chat messages",
    };
  }
}

/**
 * Cache for liveChatIds to avoid repeated lookups
 */
const liveChatIdCache = new Map<string, { id: string | null; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function getCachedLiveChatId(videoId: string): Promise<string | null> {
  const cached = liveChatIdCache.get(videoId);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.id;
  }

  const id = await getLiveChatId(videoId);
  liveChatIdCache.set(videoId, { id, timestamp: Date.now() });

  return id;
}
