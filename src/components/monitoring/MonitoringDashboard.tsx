"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Eye,
  EyeOff,
  Activity,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Radio,
  BarChart3,
  ArrowUp,
  ArrowDown,
  Plus,
  Loader2,
  ExternalLink,
} from "lucide-react";

interface MonitoredChannel {
  id: string;
  name: string;
  youtubeHandle: string;
  platform: string;
  isLive: boolean;
  currentStreamId?: string;
}

interface LiveStream {
  channel: string;
  streamId: string;
  title: string;
  viewers: number;
  watchUrl: string;
}

interface Position {
  symbol: string;
  direction: "LONG" | "SHORT";
  size: number;
  entryPrice: number;
  currentPrice?: number;
  unrealizedPnl?: number;
}

interface Trade {
  id: string;
  channelName: string;
  symbol: string;
  direction: "LONG" | "SHORT";
  entryPrice: number;
  exitPrice?: number;
  pnl?: number;
  result?: string;
}

interface ChannelStats {
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  totalPnl: number;
}

export function MonitoringDashboard() {
  const [channels, setChannels] = useState<MonitoredChannel[]>([]);
  const [liveStreams, setLiveStreams] = useState<LiveStream[]>([]);
  const [positions, setPositions] = useState<Record<string, Position[]>>({});
  const [recentTrades, setRecentTrades] = useState<Trade[]>([]);
  const [stats, setStats] = useState<ChannelStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastPoll, setLastPoll] = useState<Date | null>(null);

  // Quick analyze state
  const [quickUrl, setQuickUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [quickResult, setQuickResult] = useState<{
    success: boolean;
    message: string;
    positions?: Position[];
    streamId?: string;
  } | null>(null);

  const fetchChannels = async () => {
    try {
      const res = await fetch("/api/monitor/channels?checkLive=true");
      const data = await res.json();
      setChannels(data.channels || []);
      setLiveStreams(
        data.liveStreams?.map((s: LiveStream & { channelName?: string }) => ({
          ...s,
          channel: s.channel || s.channelName,
        })) || []
      );
    } catch (error) {
      console.error("Failed to fetch channels:", error);
    }
  };

  const fetchTrades = async () => {
    try {
      const res = await fetch("/api/monitor/trades?limit=20");
      const data = await res.json();
      setRecentTrades(data.trades || []);
      setStats(data.stats || null);
    } catch (error) {
      console.error("Failed to fetch trades:", error);
    }
  };

  const pollNow = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/monitor/poll");
      const data = await res.json();
      setLiveStreams(data.liveStreams || []);
      setLastPoll(new Date());
      await fetchChannels();
      await fetchTrades();
    } catch (error) {
      console.error("Poll failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeStream = async (streamId: string, channelId: string) => {
    try {
      const res = await fetch("/api/monitor/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ streamId, channelId }),
      });
      const data = await res.json();

      if (data.positions) {
        setPositions((prev) => ({
          ...prev,
          [streamId]: data.positions,
        }));
      }

      // Refresh trades if any new ones detected
      if (data.trades?.length > 0) {
        await fetchTrades();
      }
    } catch (error) {
      console.error("Analysis failed:", error);
    }
  };

  // Extract video ID from YouTube URL
  const extractVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/,
      /^([a-zA-Z0-9_-]{11})$/, // Just the ID
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  // Quick analyze any YouTube stream
  const analyzeQuickStream = async () => {
    const videoId = extractVideoId(quickUrl.trim());
    if (!videoId) {
      setQuickResult({
        success: false,
        message: "Invalid YouTube URL. Paste a link like: youtube.com/watch?v=abc123",
      });
      return;
    }

    setIsAnalyzing(true);
    setQuickResult(null);

    try {
      const res = await fetch("/api/monitor/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ streamId: videoId, channelId: "manual" }),
      });
      const data = await res.json();

      if (data.success) {
        setQuickResult({
          success: true,
          message: `Analyzed! Found ${data.positions?.length || 0} positions.`,
          positions: data.positions,
          streamId: videoId,
        });

        // Add to positions state
        if (data.positions?.length > 0) {
          setPositions((prev) => ({
            ...prev,
            [videoId]: data.positions,
          }));
        }

        // Refresh trades
        await fetchTrades();
      } else {
        setQuickResult({
          success: false,
          message: data.error || "Analysis failed",
        });
      }
    } catch (error) {
      setQuickResult({
        success: false,
        message: "Failed to analyze stream",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    fetchChannels();
    fetchTrades();
  }, []);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Stream Monitoring</h1>
          <p className="text-muted-foreground">
            Real-time trade detection from live trading streams
          </p>
        </div>
        <div className="flex items-center gap-4">
          {lastPoll && (
            <span className="text-sm text-muted-foreground">
              Last poll: {lastPoll.toLocaleTimeString()}
            </span>
          )}
          <Button onClick={pollNow} disabled={isLoading}>
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
            Poll Now
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Live Streams
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Radio className="h-5 w-5 text-red-500" />
              <span className="text-2xl font-bold">{liveStreams.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Trades
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-500" />
              <span className="text-2xl font-bold">
                {stats?.totalTrades || 0}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Win Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold">
                {stats ? `${(stats.winRate * 100).toFixed(1)}%` : "N/A"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total P&L
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {(stats?.totalPnl || 0) >= 0 ? (
                <TrendingUp className="h-5 w-5 text-green-500" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-500" />
              )}
              <span
                className={`text-2xl font-bold ${
                  (stats?.totalPnl || 0) >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                ${stats?.totalPnl?.toFixed(2) || "0.00"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Analyze */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Analyze Any Live Stream
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Paste YouTube URL (e.g., youtube.com/watch?v=abc123)"
              value={quickUrl}
              onChange={(e) => setQuickUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && analyzeQuickStream()}
              className="flex-1"
            />
            <Button onClick={analyzeQuickStream} disabled={isAnalyzing || !quickUrl.trim()}>
              {isAnalyzing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Analyze"
              )}
            </Button>
          </div>

          {quickResult && (
            <div
              className={`mt-4 p-4 rounded-lg ${
                quickResult.success
                  ? "bg-green-50 border border-green-200"
                  : "bg-red-50 border border-red-200"
              }`}
            >
              <p
                className={`font-medium ${
                  quickResult.success ? "text-green-800" : "text-red-800"
                }`}
              >
                {quickResult.message}
              </p>

              {quickResult.success && quickResult.streamId && (
                <div className="mt-2 flex items-center gap-4">
                  <a
                    href={`https://youtube.com/watch?v=${quickResult.streamId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                  >
                    Watch Stream <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}

              {quickResult.positions && quickResult.positions.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-sm font-medium">Detected Positions:</p>
                  {quickResult.positions.map((pos, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-sm bg-white p-2 rounded border"
                    >
                      <span className="flex items-center gap-2">
                        {pos.direction === "LONG" ? (
                          <ArrowUp className="h-4 w-4 text-green-500" />
                        ) : (
                          <ArrowDown className="h-4 w-4 text-red-500" />
                        )}
                        <span className="font-mono font-medium">
                          {pos.size} {pos.symbol}
                        </span>
                        <span className="text-muted-foreground">
                          @ ${pos.entryPrice?.toFixed(2)}
                        </span>
                      </span>
                      {pos.unrealizedPnl !== undefined && (
                        <span
                          className={`font-mono ${
                            pos.unrealizedPnl >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          ${pos.unrealizedPnl.toFixed(2)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Monitored Channels */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Monitored Channels
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {channels.map((channel) => {
              const liveStream = liveStreams.find(
                (s) => s.channel === channel.name
              );
              const streamPositions = liveStream
                ? positions[liveStream.streamId] || []
                : [];

              return (
                <Card
                  key={channel.id}
                  className={liveStream ? "border-red-500" : ""}
                >
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="font-semibold">{channel.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {channel.youtubeHandle}
                        </p>
                      </div>
                      {liveStream ? (
                        <Badge variant="destructive" className="animate-pulse">
                          <Radio className="h-3 w-3 mr-1" />
                          LIVE
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <EyeOff className="h-3 w-3 mr-1" />
                          Offline
                        </Badge>
                      )}
                    </div>

                    <Badge variant="outline" className="mb-2">
                      {channel.platform}
                    </Badge>

                    {liveStream && (
                      <div className="mt-3 space-y-2">
                        <p className="text-sm truncate">{liveStream.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {liveStream.viewers.toLocaleString()} viewers
                        </p>

                        <Button
                          size="sm"
                          className="w-full"
                          onClick={() =>
                            analyzeStream(liveStream.streamId, channel.id)
                          }
                        >
                          Analyze Now
                        </Button>

                        {streamPositions.length > 0 && (
                          <div className="mt-2 space-y-1">
                            <p className="text-xs font-medium">
                              Open Positions:
                            </p>
                            {streamPositions.map((pos, i) => (
                              <div
                                key={i}
                                className="flex items-center justify-between text-xs bg-muted p-1 rounded"
                              >
                                <span className="flex items-center gap-1">
                                  {pos.direction === "LONG" ? (
                                    <ArrowUp className="h-3 w-3 text-green-500" />
                                  ) : (
                                    <ArrowDown className="h-3 w-3 text-red-500" />
                                  )}
                                  {pos.size} {pos.symbol}
                                </span>
                                <span
                                  className={
                                    (pos.unrealizedPnl || 0) >= 0
                                      ? "text-green-600"
                                      : "text-red-600"
                                  }
                                >
                                  ${pos.unrealizedPnl?.toFixed(2) || "0.00"}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Trades */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Trades
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentTrades.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No trades detected yet. Trades will appear here when positions are
              opened or closed in monitored streams.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm text-muted-foreground">
                    <th className="pb-2">Channel</th>
                    <th className="pb-2">Symbol</th>
                    <th className="pb-2">Direction</th>
                    <th className="pb-2">Entry</th>
                    <th className="pb-2">Exit</th>
                    <th className="pb-2">P&L</th>
                    <th className="pb-2">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTrades.map((trade) => (
                    <tr key={trade.id} className="border-b">
                      <td className="py-2">{trade.channelName}</td>
                      <td className="py-2 font-mono">{trade.symbol}</td>
                      <td className="py-2">
                        <Badge
                          variant={
                            trade.direction === "LONG"
                              ? "default"
                              : "destructive"
                          }
                        >
                          {trade.direction}
                        </Badge>
                      </td>
                      <td className="py-2 font-mono">
                        ${trade.entryPrice.toFixed(2)}
                      </td>
                      <td className="py-2 font-mono">
                        {trade.exitPrice
                          ? `$${trade.exitPrice.toFixed(2)}`
                          : "-"}
                      </td>
                      <td
                        className={`py-2 font-mono ${
                          (trade.pnl || 0) >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {trade.pnl ? `$${trade.pnl.toFixed(2)}` : "-"}
                      </td>
                      <td className="py-2">
                        {trade.result && (
                          <Badge
                            variant={
                              trade.result === "WIN"
                                ? "default"
                                : trade.result === "LOSS"
                                  ? "destructive"
                                  : "secondary"
                            }
                          >
                            {trade.result}
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
