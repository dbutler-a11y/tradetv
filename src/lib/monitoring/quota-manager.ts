/**
 * YouTube API Quota Manager
 *
 * YouTube Data API v3 has a daily quota of 10,000 units.
 * This manager tracks usage and optimizes polling to stay within limits.
 *
 * API Costs:
 * - search.list: 100 units (checking if channel is live)
 * - videos.list: 1 unit (get video details)
 * - channels.list: 1 unit (get channel info)
 * - liveChat/messages: 5 units (get chat messages)
 *
 * With 5 channels and 10,000 daily quota:
 * - If using search.list (100 units): 100 checks/day = ~15/channel/day
 * - If using videos.list (1 unit): 10,000 checks/day = 2,000/channel/day
 */

export interface QuotaConfig {
  dailyLimit: number;
  channels: number;
  marketHoursOnly: boolean;
  marketOpenHour: number; // 9 for 9 AM ET
  marketCloseHour: number; // 16 for 4 PM ET
}

export interface QuotaBudget {
  totalDaily: number;
  used: number;
  remaining: number;
  checksRemaining: number;
  pollIntervalMinutes: number;
  strategy: "aggressive" | "normal" | "conservative" | "minimal";
}

// Cost per API operation
const API_COSTS = {
  search: 100,
  videos: 1,
  channels: 1,
  liveChat: 5,
  playlistItems: 1,
};

// In-memory quota tracking (reset daily)
let quotaState = {
  date: new Date().toDateString(),
  used: 0,
  lastReset: new Date(),
};

/**
 * Reset quota if new day
 */
function checkDailyReset(): void {
  const today = new Date().toDateString();
  if (quotaState.date !== today) {
    quotaState = {
      date: today,
      used: 0,
      lastReset: new Date(),
    };
    console.log("[Quota] Daily quota reset");
  }
}

/**
 * Record API usage
 */
export function recordApiUsage(
  operation: keyof typeof API_COSTS,
  count: number = 1
): void {
  checkDailyReset();
  const cost = API_COSTS[operation] * count;
  quotaState.used += cost;
  console.log(
    `[Quota] Used ${cost} units for ${operation}. Total: ${quotaState.used}/10000`
  );
}

/**
 * Check if we have quota for an operation
 */
export function hasQuotaFor(
  operation: keyof typeof API_COSTS,
  count: number = 1
): boolean {
  checkDailyReset();
  const cost = API_COSTS[operation] * count;
  return quotaState.used + cost <= 10000;
}

/**
 * Get current quota status
 */
export function getQuotaStatus(): {
  used: number;
  remaining: number;
  percentUsed: number;
  resetAt: Date;
} {
  checkDailyReset();
  const remaining = 10000 - quotaState.used;
  return {
    used: quotaState.used,
    remaining,
    percentUsed: (quotaState.used / 10000) * 100,
    resetAt: getNextResetTime(),
  };
}

/**
 * Get next quota reset time (midnight PT)
 */
function getNextResetTime(): Date {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow;
}

/**
 * Calculate optimal polling strategy based on remaining quota
 */
export function calculatePollingStrategy(
  config: QuotaConfig
): QuotaBudget {
  checkDailyReset();

  const remaining = config.dailyLimit - quotaState.used;

  // Calculate market hours remaining today
  const now = new Date();
  const currentHour = now.getHours();
  let hoursRemaining = 0;

  if (config.marketHoursOnly) {
    if (currentHour < config.marketOpenHour) {
      hoursRemaining = config.marketCloseHour - config.marketOpenHour;
    } else if (currentHour < config.marketCloseHour) {
      hoursRemaining = config.marketCloseHour - currentHour;
    }
    // If after market close, no hours remaining
  } else {
    hoursRemaining = 24 - currentHour;
  }

  const minutesRemaining = hoursRemaining * 60;

  // Using the cheaper videos.list approach (1 unit per check)
  // We need 1 check per channel per poll
  const unitsPerPoll = config.channels * API_COSTS.videos;
  const checksRemaining = Math.floor(remaining / unitsPerPoll);

  // Calculate optimal interval
  let pollIntervalMinutes: number;
  let strategy: "aggressive" | "normal" | "conservative" | "minimal";

  if (checksRemaining <= 0) {
    pollIntervalMinutes = Infinity;
    strategy = "minimal";
  } else if (minutesRemaining <= 0) {
    pollIntervalMinutes = Infinity;
    strategy = "minimal";
  } else {
    // Ideal: poll every X minutes to use remaining quota evenly
    pollIntervalMinutes = Math.ceil(minutesRemaining / checksRemaining);

    // Apply strategy based on remaining quota percentage
    const percentRemaining = (remaining / config.dailyLimit) * 100;

    if (percentRemaining > 75) {
      strategy = "aggressive";
      pollIntervalMinutes = Math.max(1, pollIntervalMinutes); // At least every minute
    } else if (percentRemaining > 50) {
      strategy = "normal";
      pollIntervalMinutes = Math.max(2, pollIntervalMinutes); // At least every 2 minutes
    } else if (percentRemaining > 25) {
      strategy = "conservative";
      pollIntervalMinutes = Math.max(5, pollIntervalMinutes); // At least every 5 minutes
    } else {
      strategy = "minimal";
      pollIntervalMinutes = Math.max(15, pollIntervalMinutes); // At least every 15 minutes
    }
  }

  return {
    totalDaily: config.dailyLimit,
    used: quotaState.used,
    remaining,
    checksRemaining,
    pollIntervalMinutes,
    strategy,
  };
}

/**
 * Check if currently within market hours (ET)
 */
export function isMarketHours(): boolean {
  const now = new Date();

  // Convert to ET
  const etTime = new Date(
    now.toLocaleString("en-US", { timeZone: "America/New_York" })
  );

  const day = etTime.getDay();
  const hour = etTime.getHours();

  // Monday (1) to Friday (5), 9 AM to 4 PM ET
  const isWeekday = day >= 1 && day <= 5;
  const isDuringHours = hour >= 9 && hour < 16;

  return isWeekday && isDuringHours;
}

/**
 * Get next market open time
 */
export function getNextMarketOpen(): Date {
  const now = new Date();
  const etNow = new Date(
    now.toLocaleString("en-US", { timeZone: "America/New_York" })
  );

  const day = etNow.getDay();
  const hour = etNow.getHours();

  let daysUntilOpen = 0;

  if (day === 0) {
    // Sunday
    daysUntilOpen = 1;
  } else if (day === 6) {
    // Saturday
    daysUntilOpen = 2;
  } else if (hour >= 16) {
    // After market close on weekday
    daysUntilOpen = day === 5 ? 3 : 1; // Friday -> Monday, else next day
  }

  const nextOpen = new Date(etNow);
  nextOpen.setDate(nextOpen.getDate() + daysUntilOpen);
  nextOpen.setHours(9, 0, 0, 0);

  return nextOpen;
}

/**
 * Optimized live check using videos.list instead of search.list
 *
 * This approach:
 * 1. Gets the channel's uploads playlist (1 unit, cached)
 * 2. Gets recent videos from playlist (1 unit)
 * 3. Checks if any are live streams (1 unit)
 *
 * Total: 2-3 units vs 100 units for search.list
 */
export async function checkChannelLiveOptimized(
  channelId: string,
  uploadsPlaylistId?: string
): Promise<{
  isLive: boolean;
  streamId?: string;
  title?: string;
  viewerCount?: number;
  quotaUsed: number;
}> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return { isLive: false, quotaUsed: 0 };
  }

  let quotaUsed = 0;
  let playlistId = uploadsPlaylistId;

  // Step 1: Get uploads playlist ID if not cached
  if (!playlistId) {
    if (!hasQuotaFor("channels")) {
      return { isLive: false, quotaUsed: 0 };
    }

    const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${apiKey}`;
    const channelRes = await fetch(channelUrl);
    const channelData = await channelRes.json();
    recordApiUsage("channels");
    quotaUsed += API_COSTS.channels;

    playlistId =
      channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
    if (!playlistId) {
      return { isLive: false, quotaUsed };
    }
  }

  // Step 2: Get recent videos from uploads playlist
  if (!hasQuotaFor("playlistItems")) {
    return { isLive: false, quotaUsed };
  }

  const playlistUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=5&key=${apiKey}`;
  const playlistRes = await fetch(playlistUrl);
  const playlistData = await playlistRes.json();
  recordApiUsage("playlistItems");
  quotaUsed += API_COSTS.playlistItems;

  const videoIds =
    playlistData.items
      ?.map(
        (item: { snippet?: { resourceId?: { videoId?: string } } }) =>
          item.snippet?.resourceId?.videoId
      )
      .filter(Boolean)
      .join(",") || "";

  if (!videoIds) {
    return { isLive: false, quotaUsed };
  }

  // Step 3: Check if any videos are live
  if (!hasQuotaFor("videos")) {
    return { isLive: false, quotaUsed };
  }

  const videosUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,liveStreamingDetails&id=${videoIds}&key=${apiKey}`;
  const videosRes = await fetch(videosUrl);
  const videosData = await videosRes.json();
  recordApiUsage("videos");
  quotaUsed += API_COSTS.videos;

  // Find live video
  const liveVideo = videosData.items?.find(
    (video: {
      snippet?: { liveBroadcastContent?: string };
      liveStreamingDetails?: { concurrentViewers?: string };
    }) => video.snippet?.liveBroadcastContent === "live"
  );

  if (liveVideo) {
    return {
      isLive: true,
      streamId: liveVideo.id,
      title: liveVideo.snippet?.title,
      viewerCount: parseInt(
        liveVideo.liveStreamingDetails?.concurrentViewers || "0"
      ),
      quotaUsed,
    };
  }

  return { isLive: false, quotaUsed };
}

/**
 * Free alternative: RSS feed check
 *
 * YouTube provides RSS feeds that don't count against API quota.
 * However, they don't include live status directly.
 * We can use this to reduce API calls by checking RSS first.
 */
export async function checkChannelRSS(
  channelId: string
): Promise<{ recentVideoIds: string[]; lastUpdate: Date }> {
  try {
    const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
    const response = await fetch(rssUrl);
    const xml = await response.text();

    // Extract video IDs from RSS
    const videoIds: string[] = [];
    const idMatches = xml.matchAll(/<yt:videoId>([^<]+)<\/yt:videoId>/g);
    for (const match of idMatches) {
      videoIds.push(match[1]);
    }

    return {
      recentVideoIds: videoIds.slice(0, 5),
      lastUpdate: new Date(),
    };
  } catch {
    return { recentVideoIds: [], lastUpdate: new Date() };
  }
}

/**
 * Hybrid approach: RSS + minimal API
 *
 * 1. Check RSS feed (free) to get recent video IDs
 * 2. Only call videos.list API when we have new videos
 * 3. Cache results to avoid redundant checks
 */
const videoStatusCache = new Map<
  string,
  { isLive: boolean; checkedAt: Date }
>();

export async function checkChannelLiveHybrid(
  channelId: string
): Promise<{
  isLive: boolean;
  streamId?: string;
  quotaUsed: number;
  method: "cache" | "rss" | "api";
}> {
  const apiKey = process.env.YOUTUBE_API_KEY;

  // Step 1: Get recent videos from RSS (free)
  const rss = await checkChannelRSS(channelId);
  if (rss.recentVideoIds.length === 0) {
    return { isLive: false, quotaUsed: 0, method: "rss" };
  }

  // Step 2: Check cache for these videos
  const uncheckedIds: string[] = [];
  for (const videoId of rss.recentVideoIds) {
    const cached = videoStatusCache.get(videoId);
    if (cached) {
      // Cache hit - if live, return immediately
      if (cached.isLive) {
        return { isLive: true, streamId: videoId, quotaUsed: 0, method: "cache" };
      }
      // If cached as not live and recent (< 5 min), skip
      const age = Date.now() - cached.checkedAt.getTime();
      if (age < 5 * 60 * 1000) {
        continue;
      }
    }
    uncheckedIds.push(videoId);
  }

  if (uncheckedIds.length === 0) {
    return { isLive: false, quotaUsed: 0, method: "cache" };
  }

  // Step 3: Check uncached videos with API (1 unit)
  if (!apiKey || !hasQuotaFor("videos")) {
    return { isLive: false, quotaUsed: 0, method: "rss" };
  }

  const videosUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${uncheckedIds.join(",")}&key=${apiKey}`;
  const response = await fetch(videosUrl);
  const data = await response.json();
  recordApiUsage("videos");

  // Update cache and check for live
  let liveStreamId: string | undefined;
  for (const video of data.items || []) {
    const isLive = video.snippet?.liveBroadcastContent === "live";
    videoStatusCache.set(video.id, { isLive, checkedAt: new Date() });
    if (isLive) {
      liveStreamId = video.id;
    }
  }

  return {
    isLive: !!liveStreamId,
    streamId: liveStreamId,
    quotaUsed: API_COSTS.videos,
    method: "api",
  };
}
