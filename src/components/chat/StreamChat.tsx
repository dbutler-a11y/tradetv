"use client";

import { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, Smile } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  userImage?: string;
  message: string;
  timestamp: Date;
  isTrader?: boolean;
  isModerator?: boolean;
}

interface StreamChatProps {
  streamId: string;
  viewerCount: number;
  traderName?: string;
}

// Demo messages for simulation
const demoMessages: Omit<ChatMessage, "id" | "timestamp">[] = [
  { userId: "u1", userName: "TraderJoe", message: "Great call on that ES long!", isTrader: false },
  { userId: "u2", userName: "NewbieTrader", message: "What's your stop loss?", isTrader: false },
  { userId: "trader", userName: "TopTrader_Mike", message: "10 ticks below entry", isTrader: true },
  { userId: "u3", userName: "SarahK", message: "Nice scalp!", isTrader: false },
  { userId: "u4", userName: "TrendFollower", message: "Market looking bullish today", isTrader: false },
  { userId: "u5", userName: "DayTrader99", message: "Anyone else seeing this level?", isTrader: false },
  { userId: "trader", userName: "TopTrader_Mike", message: "Yes, watching 5900 closely", isTrader: true },
  { userId: "u6", userName: "FuturesKing", message: "Thanks for the heads up!", isTrader: false },
];

const simulatedResponses = [
  "Nice trade!",
  "What's your target?",
  "Great analysis",
  "I'm copying this one",
  "How long are you holding?",
  "ES looking strong",
  "NQ moving up too",
  "Thanks for the call!",
  "When are you taking profit?",
  "Good risk management",
];

const simulatedUsers = [
  "TradingPro",
  "MarketWatcher",
  "IndexTrader",
  "ScalpMaster",
  "BullRunner",
  "TechTrader",
  "FuturesGuru",
  "AlgoTrader",
  "ChartReader",
  "PatternHunter",
];

export function StreamChat({ streamId, viewerCount, traderName = "TopTrader_Mike" }: StreamChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isConnected, setIsConnected] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize with demo messages
  useEffect(() => {
    const initialMessages: ChatMessage[] = demoMessages.map((msg, i) => ({
      ...msg,
      id: `init-${i}`,
      timestamp: new Date(Date.now() - (demoMessages.length - i) * 60000),
    }));
    setMessages(initialMessages);
  }, []);

  // Simulate incoming messages
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.6) {
        const randomUser = simulatedUsers[Math.floor(Math.random() * simulatedUsers.length)];
        const randomMessage = simulatedResponses[Math.floor(Math.random() * simulatedResponses.length)];

        const newMessage: ChatMessage = {
          id: `sim-${Date.now()}`,
          userId: `user-${Math.random()}`,
          userName: randomUser,
          message: randomMessage,
          timestamp: new Date(),
          isTrader: false,
        };

        setMessages((prev) => [...prev.slice(-50), newMessage]); // Keep last 50 messages
      }
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const newMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      userId: "current-user",
      userName: "You",
      message: inputValue.trim(),
      timestamp: new Date(),
      isTrader: false,
    };

    setMessages((prev) => [...prev.slice(-50), newMessage]);
    setInputValue("");

    // Simulate occasional trader response
    if (Math.random() > 0.7) {
      setTimeout(() => {
        const traderResponse: ChatMessage = {
          id: `trader-${Date.now()}`,
          userId: "trader",
          userName: traderName,
          message: getTraderResponse(inputValue),
          timestamp: new Date(),
          isTrader: true,
        };
        setMessages((prev) => [...prev.slice(-50), traderResponse]);
      }, 2000 + Math.random() * 3000);
    }
  };

  const getTraderResponse = (userMessage: string): string => {
    const msg = userMessage.toLowerCase();
    if (msg.includes("stop") || msg.includes("sl")) {
      return "Stop is 10 ticks below entry for this one";
    }
    if (msg.includes("target") || msg.includes("tp")) {
      return "Looking for 20 ticks on this trade";
    }
    if (msg.includes("why") || msg.includes("reason")) {
      return "Price action at key level + volume confirmation";
    }
    if (msg.includes("hold") || msg.includes("how long")) {
      return "Quick scalp, probably 5-10 minutes";
    }
    return "Thanks for watching! 🙏";
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-2 flex-shrink-0">
        <CardTitle className="text-sm flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          Live Chat
          <div className="flex items-center gap-2 ml-auto">
            <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`} />
            <Badge variant="secondary" className="text-xs">
              {viewerCount.toLocaleString()} watching
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col min-h-0 pt-0">
        {/* Messages */}
        <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
          <div className="space-y-3 py-2">
            {messages.map((msg) => (
              <div key={msg.id} className="group">
                <div className="flex items-start gap-2">
                  <Avatar className="w-6 h-6 flex-shrink-0">
                    <AvatarImage src={msg.userImage} />
                    <AvatarFallback
                      className={`text-[10px] ${
                        msg.isTrader
                          ? "bg-primary text-primary-foreground"
                          : msg.userName === "You"
                          ? "bg-blue-500 text-white"
                          : "bg-secondary text-secondary-foreground"
                      }`}
                    >
                      {msg.userName.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-xs font-medium ${
                          msg.isTrader ? "text-primary" : msg.userName === "You" ? "text-blue-500" : ""
                        }`}
                      >
                        {msg.userName}
                      </span>
                      {msg.isTrader && (
                        <Badge variant="default" className="text-[10px] px-1 py-0 h-4">
                          Streamer
                        </Badge>
                      )}
                      {msg.isModerator && (
                        <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
                          Mod
                        </Badge>
                      )}
                      <span className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                        {formatTime(msg.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-foreground/90 break-words">{msg.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="mt-3 pt-3 border-t flex-shrink-0">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                ref={inputRef}
                type="text"
                placeholder="Send a message..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pr-10"
                maxLength={200}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <Smile className="w-4 h-4" />
              </button>
            </div>
            <Button size="icon" onClick={handleSendMessage} disabled={!inputValue.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1 text-center">
            Be respectful. No financial advice.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
