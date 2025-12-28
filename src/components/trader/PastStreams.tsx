"use client";

import Link from "next/link";
import { Calendar, Clock, Eye, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Stream {
  id: string;
  title: string;
  thumbnailUrl?: string;
  duration: string;
  viewCount: number;
  date: string;
  pnl?: number;
  tradesCount?: number;
}

interface PastStreamsProps {
  traderId: string;
  streams?: Stream[];
}

// Demo past streams data
const demoStreams: Stream[] = [
  {
    id: "stream-1",
    title: "Morning Scalps - ES & NQ Session",
    duration: "2:34:12",
    viewCount: 1240,
    date: "2 days ago",
    pnl: 1850,
    tradesCount: 12,
  },
  {
    id: "stream-2",
    title: "Live Trading: CPI Data Release",
    duration: "3:15:45",
    viewCount: 3420,
    date: "4 days ago",
    pnl: 2340,
    tradesCount: 8,
  },
  {
    id: "stream-3",
    title: "NQ Breakout Strategy Explained",
    duration: "1:45:30",
    viewCount: 890,
    date: "1 week ago",
    pnl: -420,
    tradesCount: 5,
  },
  {
    id: "stream-4",
    title: "Q&A + Live Trading Session",
    duration: "2:10:00",
    viewCount: 1580,
    date: "1 week ago",
    pnl: 920,
    tradesCount: 7,
  },
  {
    id: "stream-5",
    title: "Scalping During Fed Minutes",
    duration: "2:45:22",
    viewCount: 2100,
    date: "2 weeks ago",
    pnl: 1450,
    tradesCount: 15,
  },
];

export function PastStreams({ traderId, streams }: PastStreamsProps) {
  const streamData = streams || demoStreams;

  if (streamData.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Play className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No past streams available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {streamData.map((stream) => (
        <div
          key={stream.id}
          className="group flex gap-4 p-4 rounded-lg border hover:bg-accent/50 transition-colors"
        >
          {/* Thumbnail */}
          <div className="relative w-48 h-28 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
            {stream.thumbnailUrl ? (
              <img
                src={stream.thumbnailUrl}
                alt={stream.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <Play className="w-8 h-8 text-muted-foreground" />
              </div>
            )}
            {/* Duration badge */}
            <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 text-white text-xs font-medium">
              {stream.duration}
            </div>
            {/* Play overlay on hover */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                <Play className="w-6 h-6 text-black fill-black ml-1" />
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <Link
              href={`/watch/${stream.id}`}
              className="font-medium hover:text-primary line-clamp-1"
            >
              {stream.title}
            </Link>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                {stream.viewCount.toLocaleString()} views
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {stream.date}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {stream.duration}
              </span>
            </div>

            {/* Trading stats */}
            {(stream.pnl !== undefined || stream.tradesCount !== undefined) && (
              <div className="flex items-center gap-3 mt-2">
                {stream.pnl !== undefined && (
                  <Badge
                    variant={stream.pnl >= 0 ? "default" : "destructive"}
                    className="text-xs"
                  >
                    {stream.pnl >= 0 ? "+" : ""}${stream.pnl.toLocaleString()} P&L
                  </Badge>
                )}
                {stream.tradesCount !== undefined && (
                  <Badge variant="secondary" className="text-xs">
                    {stream.tradesCount} trades
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Watch button */}
          <div className="flex items-center">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/watch/${stream.id}`}>Watch</Link>
            </Button>
          </div>
        </div>
      ))}

      {/* Load more */}
      <div className="text-center pt-4">
        <Button variant="outline">Load More Streams</Button>
      </div>
    </div>
  );
}
