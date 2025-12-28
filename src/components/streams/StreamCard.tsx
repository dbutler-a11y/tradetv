"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, Users, CheckCircle, Star, Copy } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface StreamData {
  id: string;
  traderId: string;
  traderName: string;
  traderAvatar?: string;
  verificationTier: "UNVERIFIED" | "VERIFIED" | "PRO" | "ELITE";
  title: string;
  thumbnailUrl?: string;
  viewerCount: number;
  copierCount: number;
  isLive: boolean;
  category: string;
  instruments: string[];
  winRate?: number;
  todayPnl?: number;
  youtubeVideoId?: string;
}

interface StreamCardProps {
  stream: StreamData;
  variant?: "default" | "featured";
  onCopy?: (traderId: string) => void;
}

const verificationBadges = {
  UNVERIFIED: null,
  VERIFIED: { icon: CheckCircle, color: "text-blue-500", label: "Verified" },
  PRO: { icon: Star, color: "text-yellow-500", label: "Pro Trader" },
  ELITE: { icon: Star, color: "text-purple-500", label: "Elite Trader" },
};

export function StreamCard({ stream, variant = "default", onCopy }: StreamCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const verification = verificationBadges[stream.verificationTier];

  const isFeatured = variant === "featured";

  return (
    <div
      className={`group relative rounded-xl overflow-hidden bg-card border border-border stream-card ${
        isFeatured ? "col-span-2 row-span-2" : ""
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Thumbnail / Video Preview */}
      <Link href={`/watch/${stream.id}`}>
        <div className={`relative ${isFeatured ? "aspect-video" : "aspect-video"}`}>
          {stream.thumbnailUrl ? (
            <img
              src={stream.thumbnailUrl}
              alt={stream.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary flex items-center justify-center">
              <span className="text-4xl">📈</span>
            </div>
          )}

          {/* Live Badge */}
          {stream.isLive && (
            <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-1 bg-red-600 rounded text-xs font-semibold text-white">
              <span className="w-2 h-2 bg-white rounded-full live-pulse" />
              LIVE
            </div>
          )}

          {/* Viewer Count */}
          <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-1 bg-black/70 rounded text-xs text-white">
            <Eye className="w-3 h-3" />
            {stream.viewerCount.toLocaleString()}
          </div>

          {/* Today's P&L Badge - only show if available */}
          {stream.todayPnl !== undefined && (
            <div
              className={`absolute bottom-2 right-2 flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                stream.todayPnl >= 0
                  ? "bg-green-500/90 text-white"
                  : "bg-red-500/90 text-white"
              }`}
            >
              {stream.todayPnl >= 0 ? "+" : ""}${Math.abs(stream.todayPnl).toLocaleString()}
            </div>
          )}

          {/* Hover Overlay */}
          {isHovered && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity">
              <Button variant="secondary" size="sm" className="gap-2">
                Watch Now
              </Button>
            </div>
          )}
        </div>
      </Link>

      {/* Stream Info */}
      <div className="p-3">
        <div className="flex gap-3">
          {/* Trader Avatar */}
          <Link href={`/trader/${stream.traderId}`}>
            <Avatar className="w-10 h-10 border-2 border-background">
              <AvatarImage src={stream.traderAvatar} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {stream.traderName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Link>

          <div className="flex-1 min-w-0">
            {/* Title */}
            <Link href={`/watch/${stream.id}`}>
              <h3 className="font-medium text-sm truncate hover:text-primary transition-colors">
                {stream.title}
              </h3>
            </Link>

            {/* Trader Name + Verification */}
            <Link href={`/trader/${stream.traderId}`}>
              <div className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <span className="truncate">{stream.traderName}</span>
                {verification && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <verification.icon className={`w-3.5 h-3.5 ${verification.color}`} />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{verification.label}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </Link>

            {/* Stats Row */}
            <div className="flex items-center gap-3 mt-1">
              {stream.winRate !== undefined && (
                <span className="text-xs text-muted-foreground">
                  {stream.winRate}% WR
                </span>
              )}
              {stream.copierCount > 0 && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {stream.copierCount} copying
                </span>
              )}
              {stream.youtubeVideoId && (
                <span className="text-xs text-muted-foreground">
                  YouTube
                </span>
              )}
            </div>
          </div>

          {/* Copy Button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={(e) => {
                    e.preventDefault();
                    onCopy?.(stream.traderId);
                  }}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Copy this trader</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Tags */}
        <div className="flex items-center gap-1.5 mt-2 overflow-hidden">
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            {stream.category}
          </Badge>
          {stream.instruments.slice(0, 2).map((instrument) => (
            <Badge
              key={instrument}
              variant="outline"
              className="text-[10px] px-1.5 py-0"
            >
              {instrument}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
