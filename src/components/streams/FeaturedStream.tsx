"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Eye,
  Users,
  MessageSquare,
  Copy,
  Volume2,
  VolumeX,
  Maximize2,
  Settings,
  ChevronRight,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StreamData } from "./StreamCard";

interface FeaturedStreamProps {
  stream: StreamData;
}

export function FeaturedStream({ stream }: FeaturedStreamProps) {
  const [isMuted, setIsMuted] = useState(true);

  // Extract YouTube video ID from URL (simplified for demo)
  const getYouTubeEmbedUrl = (url?: string) => {
    if (!url) return null;
    // In production, parse actual YouTube URL
    return `https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&mute=${isMuted ? 1 : 0}`;
  };

  return (
    <div className="relative rounded-xl overflow-hidden bg-card border border-border">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-0">
        {/* Main Video */}
        <div className="lg:col-span-3 relative">
          <div className="aspect-video bg-black relative">
            {/* Placeholder - Replace with actual YouTube embed */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-black flex items-center justify-center">
              <div className="text-center">
                <span className="text-6xl mb-4 block">📺</span>
                <p className="text-white/80 text-lg">{stream.title}</p>
                <p className="text-white/60 text-sm mt-2">
                  Click to start watching
                </p>
              </div>
            </div>

            {/* Live Badge */}
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 rounded-md text-sm font-semibold text-white">
                <span className="w-2 h-2 bg-white rounded-full live-pulse" />
                LIVE
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black/70 rounded-md text-sm text-white">
                <Eye className="w-4 h-4" />
                {stream.viewerCount.toLocaleString()} watching
              </div>
            </div>

            {/* Video Controls */}
            <div className="absolute bottom-4 right-4 flex items-center gap-2">
              <Button
                variant="secondary"
                size="icon"
                className="h-8 w-8 bg-black/70 hover:bg-black/90"
                onClick={() => setIsMuted(!isMuted)}
              >
                {isMuted ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="h-8 w-8 bg-black/70 hover:bg-black/90"
              >
                <Settings className="w-4 h-4" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="h-8 w-8 bg-black/70 hover:bg-black/90"
              >
                <Maximize2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Stream Info Bar */}
          <div className="p-4 border-t border-border">
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-4">
                <Link href={`/trader/${stream.traderId}`}>
                  <Avatar className="w-12 h-12 border-2 border-primary">
                    <AvatarImage src={stream.traderAvatar} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {stream.traderName.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <div>
                  <h2 className="font-bold text-lg">{stream.title}</h2>
                  <Link
                    href={`/trader/${stream.traderId}`}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {stream.traderName}
                  </Link>
                  <div className="flex items-center gap-3 mt-1">
                    <Badge variant="secondary">{stream.category}</Badge>
                    {stream.instruments.map((inst) => (
                      <Badge key={inst} variant="outline">
                        {inst}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  Follow
                </Button>
                <Button size="sm" className="gap-2">
                  <Copy className="w-4 h-4" />
                  Copy Trader
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar - Live Signals & Chat */}
        <div className="lg:col-span-1 border-l border-border flex flex-col h-[500px] lg:h-auto">
          {/* Tabs */}
          <div className="flex border-b border-border">
            <button className="flex-1 px-4 py-3 text-sm font-medium border-b-2 border-primary">
              Live Signals
            </button>
            <button className="flex-1 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground">
              Chat
            </button>
          </div>

          {/* Signals Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {/* Today's Stats */}
            <div className="bg-secondary/50 rounded-lg p-3">
              <div className="text-xs text-muted-foreground mb-2">Today's Performance</div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-lg font-bold text-profit">
                    +${(stream.todayPnl ?? 0).toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">P&L</div>
                </div>
                <div>
                  <div className="text-lg font-bold">{stream.winRate ?? 0}%</div>
                  <div className="text-xs text-muted-foreground">Win Rate</div>
                </div>
              </div>
            </div>

            {/* Recent Signals */}
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">Recent Signals</div>

              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="font-medium text-green-500">LONG</span>
                    <span className="text-sm">NQ</span>
                  </div>
                  <span className="text-xs text-muted-foreground">2 min ago</span>
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Entry @ 21,450 | Target: 21,480
                </div>
              </div>

              <div className="bg-secondary/50 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-gray-500 rounded-full" />
                    <span className="font-medium">EXIT</span>
                    <span className="text-sm">ES</span>
                  </div>
                  <span className="text-xs text-muted-foreground">15 min ago</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-sm text-muted-foreground">
                    Closed @ 5,892
                  </span>
                  <span className="text-sm text-profit">+$340</span>
                </div>
              </div>

              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 opacity-60">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="font-medium text-green-500">LONG</span>
                    <span className="text-sm">ES</span>
                  </div>
                  <span className="text-xs text-muted-foreground">32 min ago</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-sm text-muted-foreground">
                    Entry @ 5,880
                  </span>
                  <Badge variant="outline" className="text-xs">Closed</Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Copy CTA */}
          <div className="p-4 border-t border-border bg-secondary/30">
            <Button className="w-full gap-2" size="lg">
              <Copy className="w-4 h-4" />
              Copy This Trader
              <ChevronRight className="w-4 h-4 ml-auto" />
            </Button>
            <p className="text-xs text-center text-muted-foreground mt-2">
              {stream.copierCount.toLocaleString()} traders copying
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
