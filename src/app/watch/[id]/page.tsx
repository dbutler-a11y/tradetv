"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Copy,
  Eye,
  Heart,
  MoreVertical,
  Share2,
  TrendingUp,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { StreamChat } from "@/components/chat/StreamChat";

// Demo signals for the sidebar
const demoSignals = [
  { id: "1", action: "LONG", symbol: "ES", price: 5892, time: "2 min ago", pnl: 180 },
  { id: "2", action: "EXIT", symbol: "ES", price: 5896, time: "5 min ago", pnl: 320 },
  { id: "3", action: "SHORT", symbol: "NQ", price: 21420, time: "12 min ago", pnl: -120 },
  { id: "4", action: "LONG", symbol: "ES", price: 5880, time: "18 min ago", pnl: 240 },
  { id: "5", action: "EXIT", symbol: "NQ", price: 21380, time: "25 min ago", pnl: 180 },
];


interface WatchPageProps {
  params: { id: string };
}

export default function WatchPage({ params }: WatchPageProps) {
  const { id } = params;
  const [isMuted, setIsMuted] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [viewerCount, setViewerCount] = useState(2847);

  // Check if it's a YouTube video ID (11 characters)
  const isYouTubeId = id.length === 11 && /^[a-zA-Z0-9_-]+$/.test(id);

  // Simulate viewer count changes
  useEffect(() => {
    const interval = setInterval(() => {
      setViewerCount((prev) => prev + Math.floor(Math.random() * 10) - 4);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Calculate today's P&L from signals
  const todayPnl = demoSignals.reduce((sum, signal) => sum + (signal.pnl || 0), 0);

  return (
    <div className="min-h-screen">
      {/* Top Navigation */}
      <div className="border-b bg-card/50 backdrop-blur">
        <div className="container mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/browse">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            </Link>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full live-pulse" />
              <span className="text-sm font-medium">LIVE</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Share2 className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-4">
        <div className="grid lg:grid-cols-[1fr,380px] gap-4">
          {/* Video Player */}
          <div className="space-y-4">
            <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
              {isYouTubeId ? (
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube.com/embed/${id}?autoplay=1&mute=${isMuted ? 1 : 0}&rel=0`}
                  title="YouTube live stream"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary">
                  <div className="text-center">
                    <span className="text-6xl">📈</span>
                    <p className="mt-4 text-muted-foreground">Demo Stream</p>
                  </div>
                </div>
              )}

              {/* Video Controls Overlay */}
              <div className="absolute bottom-4 right-4 flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="icon"
                  className="bg-black/50 hover:bg-black/70"
                  onClick={() => setIsMuted(!isMuted)}
                >
                  {isMuted ? (
                    <VolumeX className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </Button>
              </div>

              {/* Live Indicator */}
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-2 py-1 bg-red-600 rounded text-xs font-semibold text-white">
                  <span className="w-2 h-2 bg-white rounded-full live-pulse" />
                  LIVE
                </div>
                <div className="flex items-center gap-1 px-2 py-1 bg-black/70 rounded text-xs text-white">
                  <Eye className="w-3 h-3" />
                  {viewerCount.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Stream Info */}
            <div className="flex items-start gap-4">
              <Avatar className="w-12 h-12 border-2 border-background">
                <AvatarImage src={undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  TM
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <h1 className="text-xl font-bold">
                  ES Scalping - NY Session Live
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <Link href="/trader/trader-1" className="text-muted-foreground hover:text-foreground">
                    TopTrader_Mike
                  </Link>
                  <Badge variant="secondary" className="text-xs">Elite</Badge>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant={isFollowing ? "secondary" : "default"}
                  onClick={() => setIsFollowing(!isFollowing)}
                  className="gap-2"
                >
                  <Heart className={`w-4 h-4 ${isFollowing ? "fill-current" : ""}`} />
                  {isFollowing ? "Following" : "Follow"}
                </Button>
                <Button variant="outline" className="gap-2">
                  <Copy className="w-4 h-4" />
                  Copy Trader
                </Button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold text-profit">+${todayPnl}</div>
                  <p className="text-xs text-muted-foreground">Today's P&L</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold">68%</div>
                  <p className="text-xs text-muted-foreground">Win Rate</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold">2.3</div>
                  <p className="text-xs text-muted-foreground">Profit Factor</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold">1,243</div>
                  <p className="text-xs text-muted-foreground">Copiers</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Live Signals */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Live Signals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2">
                    {demoSignals.map((signal) => (
                      <div
                        key={signal.id}
                        className={`p-2 rounded border ${
                          signal.action === "LONG"
                            ? "bg-green-500/10 border-green-500/20"
                            : signal.action === "SHORT"
                            ? "bg-red-500/10 border-red-500/20"
                            : "bg-secondary/50 border-border"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                signal.action === "LONG"
                                  ? "default"
                                  : signal.action === "SHORT"
                                  ? "destructive"
                                  : "secondary"
                              }
                              className="text-xs"
                            >
                              {signal.action}
                            </Badge>
                            <span className="text-sm font-medium">{signal.symbol}</span>
                            <span className="text-xs text-muted-foreground">
                              @ {signal.price}
                            </span>
                          </div>
                          <span
                            className={`text-xs font-medium ${
                              signal.pnl >= 0 ? "text-profit" : "text-loss"
                            }`}
                          >
                            {signal.pnl >= 0 ? "+" : ""}${signal.pnl}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {signal.time}
                        </p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Chat */}
            <div className="h-[450px]">
              <StreamChat
                streamId={id}
                viewerCount={viewerCount}
                traderName="TopTrader_Mike"
              />
            </div>

            {/* Copy CTA */}
            <Card className="border-primary">
              <CardContent className="pt-4">
                <p className="text-sm mb-3">
                  Copy TopTrader_Mike's trades automatically to your account.
                </p>
                <Button className="w-full gap-2">
                  <Copy className="w-4 h-4" />
                  Add to My Bot
                </Button>
                <p className="text-xs text-center text-muted-foreground mt-2">
                  Requires Pro subscription
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
