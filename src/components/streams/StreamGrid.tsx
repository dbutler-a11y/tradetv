"use client";

import { useState } from "react";
import { StreamCard, StreamData } from "./StreamCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Clock, Users, Flame, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { useYouTubeStreams } from "@/hooks/useYouTubeStreams";
import { CopyTraderModal } from "@/components/modals/CopyTraderModal";
import type { YouTubeVideo } from "@/lib/youtube/client";

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

  // Fetch real YouTube streams
  const {
    streams: youtubeStreams,
    loading: youtubeLoading,
    error: youtubeError,
    refresh,
  } = useYouTubeStreams({
    query: searchQuery,
    limit: maxStreams || 20,
    autoRefresh: true,
    refreshInterval: 120000, // 2 minutes
  });

  // Decide which data source to use
  const isLoading = useRealData && !useFallback ? youtubeLoading : false;

  // Convert YouTube data to StreamData format
  const realStreams: StreamData[] = youtubeStreams.map(youtubeToStreamData);

  // Use real data if available, otherwise fallback to demo
  const sourceStreams = useRealData && !useFallback && realStreams.length > 0
    ? realStreams
    : demoStreams;

  // Filter and sort streams
  let filteredStreams = sourceStreams.filter((stream) => {
    if (activeCategory === "all") return true;
    return stream.category.toLowerCase() === activeCategory;
  });

  // Sort streams
  filteredStreams = [...filteredStreams].sort((a, b) => {
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
  const usingRealData = useRealData && !useFallback && realStreams.length > 0;

  return (
    <div className="space-y-4">
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
            {/* Refresh button */}
            {useRealData && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => refresh()}
                disabled={youtubeLoading}
              >
                <RefreshCw className={`w-4 h-4 ${youtubeLoading ? "animate-spin" : ""}`} />
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
