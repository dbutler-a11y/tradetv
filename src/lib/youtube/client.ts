/**
 * YouTube Data API v3 Client
 * Used for detecting live streams and fetching stream metadata
 */

const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";

export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  channelId: string;
  channelTitle: string;
  thumbnailUrl: string;
  publishedAt: string;
  liveBroadcastContent: "live" | "upcoming" | "none";
  viewCount?: number;
  likeCount?: number;
  concurrentViewers?: number; // For live streams
}

export interface YouTubeLiveStream {
  videoId: string;
  title: string;
  channelId: string;
  channelTitle: string;
  thumbnailUrl: string;
  concurrentViewers: number;
  actualStartTime: string;
  scheduledStartTime?: string;
}

export interface YouTubeChannel {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  subscriberCount: number;
  videoCount: number;
  customUrl?: string;
}

class YouTubeClient {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.YOUTUBE_API_KEY || "";
  }

  private async fetch<T>(endpoint: string, params: Record<string, string>): Promise<T> {
    if (!this.apiKey) {
      throw new Error("YouTube API key not configured");
    }

    const url = new URL(`${YOUTUBE_API_BASE}/${endpoint}`);
    url.searchParams.set("key", this.apiKey);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });

    const response = await fetch(url.toString());

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || `YouTube API error: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Extract video ID from various YouTube URL formats
   */
  extractVideoId(url: string): string | null {
    const patterns = [
      /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
      /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
      /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /(?:youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/,
      /^([a-zA-Z0-9_-]{11})$/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  }

  /**
   * Extract channel ID or handle from URL
   */
  extractChannelIdentifier(url: string): { type: "id" | "handle" | "username"; value: string } | null {
    // Channel ID
    const channelIdMatch = url.match(/youtube\.com\/channel\/([a-zA-Z0-9_-]+)/);
    if (channelIdMatch) {
      return { type: "id", value: channelIdMatch[1] };
    }

    // Handle (@username)
    const handleMatch = url.match(/youtube\.com\/@([a-zA-Z0-9_-]+)/);
    if (handleMatch) {
      return { type: "handle", value: handleMatch[1] };
    }

    // Legacy username
    const usernameMatch = url.match(/youtube\.com\/user\/([a-zA-Z0-9_-]+)/);
    if (usernameMatch) {
      return { type: "username", value: usernameMatch[1] };
    }

    return null;
  }

  /**
   * Get video details by ID
   */
  async getVideo(videoId: string): Promise<YouTubeVideo | null> {
    const data = await this.fetch<any>("videos", {
      part: "snippet,liveStreamingDetails,statistics",
      id: videoId,
    });

    if (!data.items?.length) {
      return null;
    }

    const item = data.items[0];
    const isLive = item.snippet.liveBroadcastContent === "live";
    const liveDetails = item.liveStreamingDetails;

    return {
      id: item.id,
      title: item.snippet.title,
      description: item.snippet.description,
      channelId: item.snippet.channelId,
      channelTitle: item.snippet.channelTitle,
      thumbnailUrl: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url,
      publishedAt: item.snippet.publishedAt,
      liveBroadcastContent: item.snippet.liveBroadcastContent,
      viewCount: isLive && liveDetails?.concurrentViewers
        ? parseInt(liveDetails.concurrentViewers)
        : parseInt(item.statistics?.viewCount || "0"),
      likeCount: parseInt(item.statistics?.likeCount || "0"),
      concurrentViewers: liveDetails?.concurrentViewers
        ? parseInt(liveDetails.concurrentViewers)
        : undefined,
    };
  }

  /**
   * Get live stream details
   */
  async getLiveStreamDetails(videoId: string): Promise<YouTubeLiveStream | null> {
    const data = await this.fetch<any>("videos", {
      part: "snippet,liveStreamingDetails",
      id: videoId,
    });

    if (!data.items?.length) {
      return null;
    }

    const item = data.items[0];
    const liveDetails = item.liveStreamingDetails;

    if (!liveDetails || item.snippet.liveBroadcastContent !== "live") {
      return null;
    }

    return {
      videoId: item.id,
      title: item.snippet.title,
      channelId: item.snippet.channelId,
      channelTitle: item.snippet.channelTitle,
      thumbnailUrl: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url,
      concurrentViewers: parseInt(liveDetails.concurrentViewers || "0"),
      actualStartTime: liveDetails.actualStartTime,
      scheduledStartTime: liveDetails.scheduledStartTime,
    };
  }

  /**
   * Search for live streams by query
   */
  async searchLiveStreams(query: string, maxResults: number = 10): Promise<YouTubeVideo[]> {
    const data = await this.fetch<any>("search", {
      part: "snippet",
      q: query,
      type: "video",
      eventType: "live",
      maxResults: maxResults.toString(),
      order: "viewCount",
    });

    return (data.items || []).map((item: any) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      channelId: item.snippet.channelId,
      channelTitle: item.snippet.channelTitle,
      thumbnailUrl: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url,
      publishedAt: item.snippet.publishedAt,
      liveBroadcastContent: "live" as const,
    }));
  }

  /**
   * Get channel details by ID
   */
  async getChannel(channelId: string): Promise<YouTubeChannel | null> {
    const data = await this.fetch<any>("channels", {
      part: "snippet,statistics",
      id: channelId,
    });

    if (!data.items?.length) {
      return null;
    }

    const item = data.items[0];
    return {
      id: item.id,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnailUrl: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url,
      subscriberCount: parseInt(item.statistics.subscriberCount || "0"),
      videoCount: parseInt(item.statistics.videoCount || "0"),
      customUrl: item.snippet.customUrl,
    };
  }

  /**
   * Get channel by handle (@username)
   */
  async getChannelByHandle(handle: string): Promise<YouTubeChannel | null> {
    const data = await this.fetch<any>("channels", {
      part: "snippet,statistics",
      forHandle: handle.startsWith("@") ? handle.slice(1) : handle,
    });

    if (!data.items?.length) {
      return null;
    }

    const item = data.items[0];
    return {
      id: item.id,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnailUrl: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url,
      subscriberCount: parseInt(item.statistics.subscriberCount || "0"),
      videoCount: parseInt(item.statistics.videoCount || "0"),
      customUrl: item.snippet.customUrl,
    };
  }

  /**
   * Check if a channel is currently live streaming
   */
  async getChannelLiveStream(channelId: string): Promise<YouTubeLiveStream | null> {
    const data = await this.fetch<any>("search", {
      part: "snippet",
      channelId: channelId,
      type: "video",
      eventType: "live",
      maxResults: "1",
    });

    if (!data.items?.length) {
      return null;
    }

    const videoId = data.items[0].id.videoId;
    return this.getLiveStreamDetails(videoId);
  }

  /**
   * Search for trading-related live streams
   * OPTIMIZED: Uses single query to save quota (100 units vs 500)
   */
  async searchTradingStreams(maxResults: number = 20): Promise<YouTubeVideo[]> {
    // Use single comprehensive query to save quota
    // Previous version used 5 queries = 500 units per call!
    // Now uses 1 query = 100 units per call
    const query = "live trading futures day trading forex crypto";

    try {
      return await this.searchLiveStreams(query, maxResults);
    } catch (error: any) {
      // Re-throw quota errors so they're visible
      if (error.message?.includes("quota")) {
        throw new Error("YouTube API quota exceeded. Quota resets at midnight Pacific Time.");
      }
      console.error("Error searching trading streams:", error);
      throw error;
    }
  }

  /**
   * Check if API key is configured and valid
   */
  isConfigured(): boolean {
    return Boolean(this.apiKey);
  }

  /**
   * Get API key status (for debugging)
   */
  getStatus(): { configured: boolean; keyPrefix: string } {
    return {
      configured: Boolean(this.apiKey),
      keyPrefix: this.apiKey ? this.apiKey.slice(0, 10) + "..." : "not set",
    };
  }
}

// Export singleton instance
export const youtube = new YouTubeClient();

// Export class for custom instances
export { YouTubeClient };
