"use client";

import { useState, useEffect, useCallback } from "react";
import { StreamCard, StreamData } from "./StreamCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Clock, Users, Flame, RefreshCw, Wifi, WifiOff, Star } from "lucide-react";
import { useYouTubeStreams } from "@/hooks/useYouTubeStreams";
import { CopyTraderModal } from "@/components/modals/CopyTraderModal";
import type { YouTubeVideo } from "@/lib/youtube/client";

// Hook to fetch monitored channels
function useMonitoredChannels() {
  const [channels, setChannels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [liveCount, setLiveCount] = useState(0);

  const fetchChannels = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/youtube/monitored");
      const data = await response.json();
      setChannels(data.channels || []);
      setLiveCount(data.liveCount || 0);
    } catch (error) {
      console.error("Failed to fetch monitored channels:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChannels();
    // Refresh every 5 minutes
    const interval = setInterval(fetchChannels, 300000);
    return () => clearInterval(interval);
  }, [fetchChannels]);

  return { channels, loading, liveCount, refresh: fetchChannels };
}

// Convert monitored channel to StreamData format
function monitoredToStreamData(channel: any): StreamData {
  return {
    id: channel.streamId || channel.id,
    traderId: channel.youtubeChannelId || channel.id,
    traderName: channel.channelTitle || channel.name,
    traderAvatar: undefined,
    verificationTier: "ELITE", // Monitored channels get elite badge
    title: channel.title || `${channel.name} Live Stream`,
    thumbnailUrl: channel.thumbnailUrl,
    viewerCount: channel.viewerCount || 0,
    copierCount: 0,
    isLive: channel.isLive,
    category: "Futures",
    instruments: ["ES", "NQ"],
    winRate: undefined,
    todayPnl: undefined,
    youtubeVideoId: channel.streamId,
    isMonitored: true, // Flag to show special badge
  };
}

// Demo data - used as fallback when YouTube API is not configured
const demoStreams: StreamData[] = [
  {
    id: "1",
    traderId: "trader-1",
    traderName: "TopTrader_Mike",
    traderAvatar: undefined,
    verificationTier: "ELITE",
    title: "ES Scalping - NY Session Live",
    thumbnailUrl: undefined,
    viewerCount: 2847,
    copierCount: 1243,
    isLive: true,
    category: "Futures",
    instruments: ["ES", "NQ"],
    winRate: 68,
    todayPnl: 2340,
  },
  {
    id: "2",
    traderId: "trader-2",
    traderName: "NQ_Pro_Sarah",
    traderAvatar: undefined,
    verificationTier: "PRO",
    title: "NQ Momentum Trading",
    thumbnailUrl: undefined,
    viewerCount: 1523,
    copierCount: 876,
    isLive: true,
    category: "Futures",
    instruments: ["NQ"],
    winRate: 72,
    todayPnl: 1890,
  },
  {
    id: "3",
    traderId: "trader-3",
    traderName: "FX_Master_Jay",
    traderAvatar: undefined,
    verificationTier: "VERIFIED",
    title: "EUR/USD London Session",
    thumbnailUrl: undefined,
    viewerCount: 892,
    copierCount: 432,
    isLive: true,
    category: "Forex",
    instruments: ["EUR/USD", "GBP/USD"],
    winRate: 64,
    todayPnl: -450,
  },
  {
    id: "4",
    traderId: "trader-4",
    traderName: "CryptoKing_Alex",
    traderAvatar: undefined,
    verificationTier: "PRO",
    title: "BTC Swing Trading Analysis",
    thumbnailUrl: undefined,
    viewerCount: 1234,
    copierCount: 567,
    isLive: true,
    category: "Crypto",
    instruments: ["BTC", "ETH"],
    winRate: 58,
    todayPnl: 3200,
  },
  {
    id: "5",
    traderId: "trader-5",
    traderName: "DayTrader_Emma",
    traderAvatar: undefined,
    verificationTier: "VERIFIED",
    title: "Small Cap Momentum Plays",
    thumbnailUrl: undefined,
    viewerCount: 678,
    copierCount: 234,
    isLive: true,
    category: "Stocks",
    instruments: ["SPY", "QQQ"],
    winRate: 61,
    todayPnl: 890,
  },
  {
    id: "6",
    traderId: "trader-6",
    traderName: "YM_Specialist",
    traderAvatar: undefined,
    verificationTier: "ELITE",
    title: "Dow Jones Scalping",
    thumbnailUrl: undefined,
    viewerCount: 445,
    copierCount: 189,
    isLive: false,
    category: "Futures",
    instruments: ["YM"],
    winRate: 70,
    todayPnl: 1560,
  },
];

const categories = [
  { id: "all", name: "All", icon: Flame },
  { id: "futures", name: "Futures", icon: TrendingUp },
  { id: "forex", name: "Forex", icon: TrendingUp },
  { id: "crypto", name: "Crypto", icon: TrendingUp },
  { id: "stocks", name: "Stocks", icon: TrendingUp },
];

const sortOptions = [
  { id: "viewers", name: "Most Viewers", icon: Users },
  { id: "trending", name: "Trending", icon: Flame },
  { id: "recent", name: "Recently Started", icon: Clock },
];

// Calculate time until midnight Pacific Time
function getTimeUntilReset(): string {
  const now = new Date();
  // Get midnight PT (Pacific Time)
  const pt = new Date(now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
  const midnight = new Date(pt);
  midnight.setHours(24, 0, 0, 0);

  const diffMs = midnight.getTime() - pt.getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

interface StreamGridProps {
  title?: string;
  showFilters?: boolean;
  maxStreams?: number;
  featuredFirst?: boolean;
  useRealData?: boolean;
  searchQuery?: string;
}

// Helper to convert YouTube videos to StreamData format
function youtubeToStreamData(video: YouTubeVideo): StreamData {
  // Extract potential category from title/description
  const title = video.title.toLowerCase();
  let category = "Futures"; // Default
  if (title.includes("forex") || title.includes("fx") || title.includes("eur") || title.includes("gbp")) {
    category = "Forex";
  } else if (title.includes("crypto") || title.includes("bitcoin") || title.includes("btc") || title.includes("eth")) {
    category = "Crypto";
  } else if (title.includes("stock") || title.includes("spy") || title.includes("qqq")) {
    category = "Stocks";
  }

  // Extract potential instruments from title
  const instruments: string[] = [];
  if (title.includes("es") || title.includes("s&p") || title.includes("spx")) instruments.push("ES");
  if (title.includes("nq") || title.includes("nasdaq")) instruments.push("NQ");
  if (title.includes("ym") || title.includes("dow")) instruments.push("YM");
  if (title.includes("btc") || title.includes("bitcoin")) instruments.push("BTC");
  if (title.includes("eth") || title.includes("ethereum")) instruments.push("ETH");
  if (title.includes("eur/usd") || title.includes("eurusd")) instruments.push("EUR/USD");
  if (instruments.length === 0) instruments.push("ES"); // Default

  return {
    id: video.id,
    traderId: video.channelId,
    traderName: video.channelTitle,
    traderAvatar: undefined,
    verificationTier: "VERIFIED", // Default for YouTube streams
    title: video.title,
    thumbnailUrl: video.thumbnailUrl,
    viewerCount: video.viewCount || 0,
    copierCount: 0, // YouTube doesn't have copiers
    isLive: video.liveBroadcastContent === "live",
    category,
    instruments,
    winRate: undefined, // Not available from YouTube
    todayPnl: undefined, // Not available from YouTube
    youtubeVideoId: video.id, // Store for embed
  };
}

export function StreamGrid({
  title = "Live Now",
  showFilters = true,
  maxStreams,
  featuredFirst = true,
  useRealData = true,
  searchQuery = "",
}: StreamGridProps) {
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeSort, setActiveSort] = useState("viewers");
  const [useFallback, setUseFallback] = useState(false);
  const [copyModalOpen, setCopyModalOpen] = useState(false);
  const [selectedTrader, setSelectedTrader] = useState<{
    id: string;
    displayName: string;
    avatarUrl?: string;
    verificationTier: string;
    winRate?: number;
    monthlyPnl?: number;
  } | null>(null);

  // Fetch monitored channels (prioritized)
  const {
    channels: monitoredChannels,
    loading: monitoredLoading,
    liveCount: monitoredLiveCount,
    refresh: refreshMonitored,
  } = useMonitoredChannels();

  // Fetch real YouTube streams
  // TESTING MODE: Reduced to 5 streams, 30-min refresh
  // Quota: 100 units per search, ~48 calls/day = 4,800 units (very safe)
  const {
    streams: youtubeStreams,
    loading: youtubeLoading,
    error: youtubeError,
    refresh,
  } = useYouTubeStreams({
    query: searchQuery,
    limit: maxStreams || 5, // Reduced for testing
    autoRefresh: true,
    refreshInterval: 1800000, // 30 minutes for testing
  });

  // Decide which data source to use
  const isLoading = useRealData && !useFallback ? (youtubeLoading && monitoredLoading) : false;

  // Convert YouTube data to StreamData format
  const realStreams: StreamData[] = youtubeStreams.map(youtubeToStreamData);

  // Convert monitored channels to StreamData (only live ones)
  const monitoredStreams: StreamData[] = monitoredChannels
    .filter(ch => ch.isLive)
    .map(monitoredToStreamData);

  // Combine: monitored channels first (if live), then YouTube search results
  // Remove duplicates (if a monitored channel appears in search results)
  const monitoredIds = new Set(monitoredStreams.map(s => s.youtubeVideoId));
  const uniqueYouTubeStreams = realStreams.filter(s => !monitoredIds.has(s.youtubeVideoId));

  // Combined streams: monitored first, then others
  const combinedStreams = [...monitoredStreams, ...uniqueYouTubeStreams];

  // Use combined data if available, otherwise fallback to demo
  const sourceStreams = useRealData && !useFallback && combinedStreams.length > 0
    ? combinedStreams
    : demoStreams;

  // Filter and sort streams
  let filteredStreams = sourceStreams.filter((stream) => {
    if (activeCategory === "all") return true;
    return stream.category.toLowerCase() === activeCategory;
  });

  // Sort streams (but keep monitored at top)
  filteredStreams = [...filteredStreams].sort((a, b) => {
    // Monitored streams always come first
    const aMonitored = (a as any).isMonitored ? 1 : 0;
    const bMonitored = (b as any).isMonitored ? 1 : 0;
    if (aMonitored !== bMonitored) return bMonitored - aMonitored;

    // Then sort by selected criteria
    switch (activeSort) {
      case "viewers":
        return b.viewerCount - a.viewerCount;
      case "trending":
        return b.copierCount - a.copierCount;
      default:
        return 0;
    }
  });

  // Limit streams if specified
  if (maxStreams) {
    filteredStreams = filteredStreams.slice(0, maxStreams);
  }

  const handleCopyTrader = (traderId: string) => {
    // Find the stream data for this trader
    const stream = sourceStreams.find((s) => s.traderId === traderId);
    if (stream) {
      setSelectedTrader({
        id: stream.traderId,
        displayName: stream.traderName,
        avatarUrl: stream.traderAvatar,
        verificationTier: stream.verificationTier,
        winRate: stream.winRate,
        monthlyPnl: stream.todayPnl, // Using todayPnl as proxy
      });
      setCopyModalOpen(true);
    }
  };

  // Show whether we're using real or demo data
  const usingRealData = useRealData && !useFallback && combinedStreams.length > 0;
  const isQuotaExceeded = youtubeError?.includes("quota");

  // Combined refresh function
  const handleRefresh = () => {
    refresh();
    refreshMonitored();
  };

  return (
    <div className="space-y-4">
      {/* Quota exceeded banner */}
      {isQuotaExceeded && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 flex items-center gap-3">
          <WifiOff className="w-5 h-5 text-yellow-500 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
              YouTube API Quota Exceeded
            </p>
            <p className="text-xs text-muted-foreground">
              Showing demo data. Quota resets at midnight Pacific Time (~{getTimeUntilReset()}).
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full live-pulse" />
            {title}
          </h2>
          {/* Data source indicator */}
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            {usingRealData ? (
              <>
                <Wifi className="w-3 h-3 text-green-500" />
                Live
              </>
            ) : isQuotaExceeded ? (
              <>
                <WifiOff className="w-3 h-3 text-yellow-500" />
                Quota Exceeded
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3 text-yellow-500" />
                Demo
              </>
            )}
          </span>
        </div>

        {showFilters && (
          <div className="flex items-center gap-2">
            {/* Monitored channels indicator */}
            {monitoredLiveCount > 0 && (
              <span className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                <Star className="w-3 h-3" />
                {monitoredLiveCount} tracked live
              </span>
            )}
            {/* Refresh button */}
            {useRealData && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleRefresh}
                disabled={youtubeLoading || monitoredLoading}
              >
                <RefreshCw className={`w-4 h-4 ${(youtubeLoading || monitoredLoading) ? "animate-spin" : ""}`} />
              </Button>
            )}
            {/* Sort Dropdown */}
            <Tabs value={activeSort} onValueChange={setActiveSort}>
              <TabsList className="h-8">
                {sortOptions.map((option) => (
                  <TabsTrigger
                    key={option.id}
                    value={option.id}
                    className="text-xs px-2 h-6"
                  >
                    <option.icon className="w-3 h-3 mr-1" />
                    {option.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        )}
      </div>

      {/* Category Filters */}
      {showFilters && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={activeCategory === category.id ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory(category.id)}
              className="shrink-0"
            >
              {category.name}
            </Button>
          ))}
        </div>
      )}

      {/* Stream Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-xl overflow-hidden bg-card">
              <Skeleton className="aspect-video w-full" />
              <div className="p-3 space-y-2">
                <div className="flex gap-3">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredStreams.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No live streams in this category</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredStreams.map((stream, index) => (
            <StreamCard
              key={stream.id}
              stream={stream}
              variant={featuredFirst && index === 0 ? "featured" : "default"}
              onCopy={handleCopyTrader}
            />
          ))}
        </div>
      )}

      {/* Load More */}
      {!maxStreams && filteredStreams.length > 0 && (
        <div className="flex justify-center pt-4">
          <Button variant="outline">Load More</Button>
        </div>
      )}

      {/* Copy Trader Modal */}
      {selectedTrader && (
        <CopyTraderModal
          trader={selectedTrader}
          open={copyModalOpen}
          onOpenChange={setCopyModalOpen}
        />
      )}
    </div>
  );
}
