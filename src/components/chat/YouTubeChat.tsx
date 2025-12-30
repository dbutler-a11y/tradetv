"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MoreVertical, Users, ChevronDown, TrendingUp, TrendingDown, Target, AlertTriangle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import type { YouTubeChatMessage } from "@/lib/youtube/live-chat";

interface DetectedSignal {
  type: "entry" | "exit" | "stop" | "target" | "alert";
  direction?: "LONG" | "SHORT";
  symbol?: string;
  price?: number;
  rawText: string;
  confidence: number;
}

interface YouTubeChatProps {
  videoId: string;
  className?: string;
  onSignalDetected?: (signal: DetectedSignal) => void;
}

// Simulated messages for when real chat isn't available
const simulatedMessages: Omit<YouTubeChatMessage, "id" | "publishedAt">[] = [
  { authorChannelId: "1", authorDisplayName: "TraderJoe", authorProfileImageUrl: "", message: "Great call on that ES long!", isChatOwner: false, isChatModerator: false, isChatSponsor: false },
  { authorChannelId: "2", authorDisplayName: "NewbieTrader", authorProfileImageUrl: "", message: "What's your stop loss?", isChatOwner: false, isChatModerator: false, isChatSponsor: false },
  { authorChannelId: "3", authorDisplayName: "MarketWatcher", authorProfileImageUrl: "", message: "NQ looking strong here", isChatOwner: false, isChatModerator: false, isChatSponsor: false },
  { authorChannelId: "4", authorDisplayName: "ScalpMaster", authorProfileImageUrl: "", message: "Nice scalp!", isChatOwner: false, isChatModerator: false, isChatSponsor: false },
  { authorChannelId: "5", authorDisplayName: "FuturesKing", authorProfileImageUrl: "", message: "Thanks for the heads up", isChatOwner: false, isChatModerator: false, isChatSponsor: false },
];

const simulatedNewMessages = [
  "Good entry!",
  "What's the target?",
  "ES breaking out",
  "Thanks for the stream",
  "Great analysis",
  "I'm copying this one",
  "NQ moving up",
  "Nice risk management",
  "How long holding?",
  "Good call!",
];

const simulatedUsers = [
  "TradingPro", "IndexTrader", "BullRunner", "TechTrader",
  "AlgoTrader", "ChartReader", "PatternHunter", "DayTrader99",
];

// Trade signal detection patterns (client-side for real-time)
const SIGNAL_PATTERNS = {
  entry: [
    /\b(going|went|entering|entered|buying|bought|taking|took)\s+(long|short)/i,
    /\b(long|short)\s+(here|now|at)\b/i,
    /\b(filled|got filled|in at)\s*\$?(\d+\.?\d*)/i,
    /\b(entry|entered?)\s*(at|price)?\s*[@:]?\s*\$?(\d+\.?\d*)/i,
  ],
  exit: [
    /\b(closing|closed|exiting|exited|out of|getting out|flattening|flat)\b/i,
    /\b(took profits?|taking profits?|profit target hit)/i,
    /\b(stopped out|hit (my )?stop|stop loss hit)/i,
  ],
  stop: [
    /\b(stop loss|stop)\s*(at|is|set to)?\s*\$?(\d+\.?\d*)/i,
  ],
  target: [
    /\b(target|tp|take profit)\s*(at|is)?\s*\$?(\d+\.?\d*)/i,
  ],
};

function detectSignalInMessage(message: string, isOwnerOrMod: boolean): DetectedSignal | null {
  const text = message.toUpperCase();

  for (const [type, patterns] of Object.entries(SIGNAL_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(message)) {
        const isLong = /\b(long|buy|buying|bought)\b/i.test(message);
        const isShort = /\b(short|sell|selling|sold)\b/i.test(message);
        const priceMatch = message.match(/\$?(\d{4,5}(?:\.\d{1,4})?)/);
        const symbolMatch = message.match(/\b(ES|NQ|CL|GC|MES|MNQ|RTY|YM)\b/i);

        return {
          type: type as DetectedSignal["type"],
          direction: isLong ? "LONG" : isShort ? "SHORT" : undefined,
          symbol: symbolMatch?.[1]?.toUpperCase(),
          price: priceMatch ? parseFloat(priceMatch[1]) : undefined,
          rawText: message,
          confidence: isOwnerOrMod ? 0.9 : 0.6,
        };
      }
    }
  }
  return null;
}

export function YouTubeChat({ videoId, className = "", onSignalDetected }: YouTubeChatProps) {
  const [messages, setMessages] = useState<YouTubeChatMessage[]>([]);
  const [detectedSignals, setDetectedSignals] = useState<Map<string, DetectedSignal>>(new Map());
  const [isLive, setIsLive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [signalCount, setSignalCount] = useState(0);
  const [viewerCount] = useState(() => Math.floor(Math.random() * 2000) + 500);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isAtBottom = useRef(true);

  // Analyze messages for trade signals
  const analyzeMessage = useCallback((msg: YouTubeChatMessage) => {
    const signal = detectSignalInMessage(
      msg.message,
      msg.isChatOwner || msg.isChatModerator
    );

    if (signal && (msg.isChatOwner || msg.isChatModerator || signal.confidence > 0.7)) {
      setDetectedSignals((prev) => new Map(prev).set(msg.id, signal));
      setSignalCount((prev) => prev + 1);
      onSignalDetected?.(signal);
    }
  }, [onSignalDetected]);

  // Fetch real chat messages
  const fetchChat = useCallback(async () => {
    try {
      const response = await fetch(`/api/youtube/chat/${videoId}`);
      const data = await response.json();

      if (data.isLive && data.messages?.length > 0) {
        setMessages((prev) => {
          // Analyze new messages for signals
          const existingIds = new Set(prev.map((m) => m.id));
          const newMessages = data.messages.filter(
            (m: YouTubeChatMessage) => !existingIds.has(m.id)
          );
          newMessages.forEach(analyzeMessage);
          return data.messages;
        });
        setIsLive(true);
        setError(null);
      } else {
        // Use simulated messages if no real chat
        setIsLive(false);
        if (data.error) {
          setError(data.error);
        }
      }
    } catch (err) {
      console.error("Failed to fetch chat:", err);
      setIsLive(false);
    } finally {
      setIsLoading(false);
    }
  }, [videoId, analyzeMessage]);

  // Initial fetch
  useEffect(() => {
    fetchChat();

    // Poll every 45 minutes (2700000ms) to save quota
    const interval = setInterval(fetchChat, 2700000);
    return () => clearInterval(interval);
  }, [fetchChat]);

  // Initialize with simulated messages if not live
  useEffect(() => {
    if (!isLive && !isLoading) {
      const initial: YouTubeChatMessage[] = simulatedMessages.map((msg, i) => ({
        ...msg,
        id: `sim-init-${i}`,
        publishedAt: new Date(Date.now() - (simulatedMessages.length - i) * 30000).toISOString(),
      }));
      setMessages(initial);
    }
  }, [isLive, isLoading]);

  // Simulate new messages when not live
  useEffect(() => {
    if (isLive) return;

    const interval = setInterval(() => {
      if (Math.random() > 0.5) {
        const user = simulatedUsers[Math.floor(Math.random() * simulatedUsers.length)];
        const msg = simulatedNewMessages[Math.floor(Math.random() * simulatedNewMessages.length)];

        const newMessage: YouTubeChatMessage = {
          id: `sim-${Date.now()}`,
          authorChannelId: `user-${Math.random()}`,
          authorDisplayName: user,
          authorProfileImageUrl: "",
          message: msg,
          publishedAt: new Date().toISOString(),
          isChatOwner: false,
          isChatModerator: Math.random() > 0.95,
          isChatSponsor: Math.random() > 0.9,
        };

        setMessages((prev) => [...prev.slice(-100), newMessage]);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isLive]);

  // Auto-scroll handling
  useEffect(() => {
    if (isAtBottom.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const atBottom = scrollHeight - scrollTop - clientHeight < 50;
    isAtBottom.current = atBottom;
    setShowScrollButton(!atBottom);
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      isAtBottom.current = true;
      setShowScrollButton(false);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  };

  const getInitials = (name: string) => {
    return name.slice(0, 2).toUpperCase();
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      "bg-red-500", "bg-blue-500", "bg-green-500", "bg-yellow-500",
      "bg-purple-500", "bg-pink-500", "bg-indigo-500", "bg-teal-500",
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div className={`flex flex-col bg-[#0f0f0f] rounded-xl overflow-hidden ${className}`}>
      {/* YouTube-style Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#272727]">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white">Live chat</span>
          {!isLive && (
            <span className="text-xs text-[#aaa] bg-[#272727] px-2 py-0.5 rounded">
              Simulated
            </span>
          )}
          {signalCount > 0 && (
            <span className="flex items-center gap-1 text-xs text-green-400 bg-green-500/20 px-2 py-0.5 rounded">
              <TrendingUp className="w-3 h-3" />
              {signalCount} signals
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs text-[#aaa]">
            <Users className="w-3.5 h-3.5" />
            <span>{viewerCount.toLocaleString()}</span>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-[#aaa] hover:text-white hover:bg-[#272727]">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="relative flex-1 min-h-0">
        <ScrollArea
          className="h-full"
          ref={scrollRef}
          onScroll={handleScroll}
        >
          <div className="px-4 py-2 space-y-1">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-[#3ea6ff] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              messages.map((msg) => {
                const signal = detectedSignals.get(msg.id);
                const hasSignal = !!signal;

                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-2 py-1 rounded px-1 -mx-1 group ${
                      hasSignal
                        ? "bg-gradient-to-r from-green-500/20 to-transparent border-l-2 border-green-500"
                        : "hover:bg-[#272727]"
                    }`}
                  >
                    {/* Avatar */}
                    <Avatar className="w-6 h-6 flex-shrink-0">
                      <AvatarImage src={msg.authorProfileImageUrl} />
                      <AvatarFallback className={`text-[10px] text-white ${getAvatarColor(msg.authorDisplayName)}`}>
                        {getInitials(msg.authorDisplayName)}
                      </AvatarFallback>
                    </Avatar>

                    {/* Message Content */}
                    <div className="flex-1 min-w-0">
                      <span className="inline-flex items-center gap-1.5 flex-wrap">
                        {/* Timestamp (shows on hover) */}
                        <span className="text-[11px] text-[#aaa] opacity-0 group-hover:opacity-100 transition-opacity">
                          {formatTime(msg.publishedAt)}
                        </span>

                        {/* Signal badge */}
                        {signal && (
                          <span className={`flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded font-bold ${
                            signal.type === "entry"
                              ? signal.direction === "LONG"
                                ? "bg-green-500 text-white"
                                : "bg-red-500 text-white"
                              : signal.type === "exit"
                              ? "bg-yellow-500 text-black"
                              : signal.type === "stop"
                              ? "bg-orange-500 text-white"
                              : "bg-blue-500 text-white"
                          }`}>
                            {signal.type === "entry" && signal.direction === "LONG" && <TrendingUp className="w-3 h-3" />}
                            {signal.type === "entry" && signal.direction === "SHORT" && <TrendingDown className="w-3 h-3" />}
                            {signal.type === "exit" && <Target className="w-3 h-3" />}
                            {signal.type === "stop" && <AlertTriangle className="w-3 h-3" />}
                            {signal.type.toUpperCase()}
                            {signal.symbol && ` ${signal.symbol}`}
                            {signal.price && ` @${signal.price}`}
                          </span>
                        )}

                        {/* Author badges */}
                        {msg.isChatOwner && (
                          <span className="bg-[#2ba640] text-white text-[10px] px-1 rounded font-medium">
                            Owner
                          </span>
                        )}
                        {msg.isChatModerator && (
                          <span className="bg-[#5e84f1] text-white text-[10px] px-1 rounded font-medium">
                            Mod
                          </span>
                        )}
                        {msg.isChatSponsor && (
                          <span className="bg-[#107516] text-white text-[10px] px-1 rounded font-medium">
                            Member
                          </span>
                        )}

                        {/* Author name */}
                        <span className={`text-[13px] font-medium ${
                          msg.isChatOwner
                            ? "text-[#2ba640]"
                            : msg.isChatModerator
                            ? "text-[#5e84f1]"
                            : msg.isChatSponsor
                            ? "text-[#107516]"
                            : "text-[#aaa]"
                        }`}>
                          {msg.authorDisplayName}
                        </span>

                        {/* Message */}
                        <span className="text-[13px] text-[#f1f1f1] break-words">
                          {msg.message}
                        </span>
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>

        {/* Scroll to bottom button */}
        {showScrollButton && (
          <button
            onClick={scrollToBottom}
            className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 px-3 py-1.5 bg-[#272727] hover:bg-[#3a3a3a] text-white text-xs rounded-full shadow-lg transition-colors"
          >
            <ChevronDown className="w-3.5 h-3.5" />
            New messages
          </button>
        )}
      </div>

      {/* YouTube-style Footer / Input disabled message */}
      <div className="px-4 py-3 border-t border-[#272727]">
        <div className="flex items-center justify-center text-[13px] text-[#aaa]">
          <span>Chat is view-only</span>
        </div>
      </div>
    </div>
  );
}
