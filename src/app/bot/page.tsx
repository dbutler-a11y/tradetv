"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Bot,
  CheckCircle,
  ChevronRight,
  Loader2,
  Pause,
  Play,
  Plus,
  Settings,
  Shield,
  Sliders,
  Trash2,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useBot, useBotTraders } from "@/hooks/useBot";
import { useRequireAuth } from "@/hooks/useAuth";

interface Trade {
  id: string;
  symbol: string;
  direction: string;
  entryPrice: number;
  exitPrice?: number;
  pnl?: number;
  enteredAt: string;
  exitedAt?: string;
  status: string;
  signal?: {
    trader?: {
      displayName: string;
    };
  };
}

export default function BotPage() {
  const { userId } = useRequireAuth();
  const { bot, loading: botLoading, error: botError, toggleActive, saveSettings } = useBot(userId);
  const { traders, loading: tradersLoading, updateTrader, removeTrader } = useBotTraders(bot?.id || null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [tradesLoading, setTradesLoading] = useState(false);
  const [togglingBot, setTogglingBot] = useState(false);

  // Fetch recent trades
  useEffect(() => {
    if (!bot?.id) return;

    const fetchTrades = async () => {
      setTradesLoading(true);
      try {
        const response = await fetch(`/api/trades?botId=${bot.id}&limit=10`);
        const data = await response.json();
        if (response.ok) {
          setTrades(data.trades || []);
        }
      } catch (err) {
        console.error("Error fetching trades:", err);
      } finally {
        setTradesLoading(false);
      }
    };

    fetchTrades();
  }, [bot?.id]);

  const handleToggleBot = async () => {
    if (!bot) return;
    setTogglingBot(true);
    await toggleActive(!bot.isActive);
    setTogglingBot(false);
  };

  const handleToggleTrader = async (botTraderId: string, currentState: boolean) => {
    await updateTrader(botTraderId, { isActive: !currentState });
  };

  // Calculate stats from bot data
  const winRate = bot && bot.totalTrades > 0
    ? Math.round((bot.winningTrades / bot.totalTrades) * 100)
    : 0;

  const profitFactor = bot && bot.losingTrades > 0 && bot.winningTrades > 0
    ? (bot.totalPnl > 0 ? 2.0 : 0.5) // Simplified - would need actual gross profit/loss
    : 0;

  if (botLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading bot configuration...</p>
        </div>
      </div>
    );
  }

  // If no bot exists yet, show setup prompt
  if (!bot) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <Bot className="w-16 h-16 mx-auto mb-4 text-primary" />
            <CardTitle className="text-2xl">Set Up Your Trading Bot</CardTitle>
            <CardDescription>
              Create your copy trading bot to automatically execute trades from your favorite traders.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium">Follow Top Traders</p>
                  <p className="text-sm text-muted-foreground">
                    Choose from verified traders with proven track records
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium">Automatic Execution</p>
                  <p className="text-sm text-muted-foreground">
                    Trades are copied to your broker account in real-time
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium">Full Risk Control</p>
                  <p className="text-sm text-muted-foreground">
                    Set daily limits, position sizes, and more
                  </p>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <Button className="flex-1" asChild>
                <Link href="/bot/settings">
                  <Settings className="w-4 h-4 mr-2" />
                  Configure Bot
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/browse">
                  <Users className="w-4 h-4 mr-2" />
                  Browse Traders
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Bot className="w-8 h-8" />
            {bot.name || "My Trading Bot"}
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure your copy trading settings and manage followed traders.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary">
            <span
              className={`w-2 h-2 rounded-full ${
                bot.isActive ? "bg-green-500 live-pulse" : "bg-yellow-500"
              }`}
            />
            <span className="text-sm font-medium">
              {bot.isActive ? "Running" : "Paused"}
            </span>
          </div>
          <Button
            variant={bot.isActive ? "outline" : "default"}
            onClick={handleToggleBot}
            disabled={togglingBot}
            className="gap-2"
          >
            {togglingBot ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : bot.isActive ? (
              <>
                <Pause className="w-4 h-4" />
                Pause Bot
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Start Bot
              </>
            )}
          </Button>
          <Button variant="outline" size="icon" asChild>
            <Link href="/bot/settings">
              <Settings className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total P&L
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${bot.totalPnl >= 0 ? "text-profit" : "text-loss"}`}>
              {bot.totalPnl >= 0 ? "+" : ""}${bot.totalPnl.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {bot.totalTrades} trades executed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Trades
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bot.totalTrades}</div>
            <p className="text-xs text-muted-foreground">
              {bot.winningTrades}W / {bot.losingTrades}L
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Win Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{winRate}%</div>
            <Progress value={winRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Traders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {traders.filter(t => t.isActive).length}
            </div>
            <p className="text-xs text-muted-foreground">
              of {traders.length} configured
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Followed Traders */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Users className="w-5 h-5" />
              Followed Traders
            </h2>
            <Button variant="outline" size="sm" className="gap-2" asChild>
              <Link href="/browse">
                <Plus className="w-4 h-4" />
                Add Trader
              </Link>
            </Button>
          </div>

          {tradersLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : traders.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-medium mb-2">No Traders Added</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Start following traders to copy their trades automatically.
                </p>
                <Button asChild>
                  <Link href="/browse">Browse Traders</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {traders.map((botTrader) => (
                <Card
                  key={botTrader.id}
                  className={!botTrader.isActive ? "opacity-60" : ""}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={botTrader.trader.avatarUrl} />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {botTrader.trader.displayName.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/trader/${botTrader.trader.id}`}
                            className="font-medium hover:text-primary"
                          >
                            {botTrader.trader.displayName}
                          </Link>
                          <Badge
                            variant={
                              botTrader.trader.verificationTier === "ELITE"
                                ? "default"
                                : botTrader.trader.verificationTier === "PRO"
                                ? "secondary"
                                : "outline"
                            }
                            className="text-xs"
                          >
                            {botTrader.trader.verificationTier}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span>{botTrader.weight}% weight</span>
                          <span>{botTrader.delay}s delay</span>
                          {botTrader.trader.winRate && (
                            <span>{botTrader.trader.winRate.toFixed(0)}% win rate</span>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        {botTrader.trader.monthlyPnl && (
                          <>
                            <div
                              className={`font-bold ${
                                botTrader.trader.monthlyPnl >= 0 ? "text-profit" : "text-loss"
                              }`}
                            >
                              {botTrader.trader.monthlyPnl >= 0 ? "+" : ""}$
                              {Math.abs(botTrader.trader.monthlyPnl).toLocaleString()}
                            </div>
                            <p className="text-xs text-muted-foreground">Monthly P&L</p>
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Switch
                          checked={botTrader.isActive}
                          onCheckedChange={() => handleToggleTrader(botTrader.id, botTrader.isActive)}
                        />
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/bot/trader/${botTrader.trader.id}`}>
                            <Sliders className="w-4 h-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>

                    {/* Settings Summary */}
                    <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                      {botTrader.copyLongs && <span className="px-2 py-0.5 rounded bg-green-500/10 text-green-600">Longs</span>}
                      {botTrader.copyShorts && <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-600">Shorts</span>}
                      {botTrader.copyScales && <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-600">Scales</span>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Recent Trades */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Recent Trades
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tradesLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : trades.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No trades yet. Trades will appear here when your bot executes signals.
                </div>
              ) : (
                <div className="space-y-3">
                  {trades.map((trade) => (
                    <div
                      key={trade.id}
                      className={`p-3 rounded-lg border ${
                        trade.status === "FILLED"
                          ? "bg-blue-500/10 border-blue-500/20"
                          : (trade.pnl ?? 0) >= 0
                          ? "bg-green-500/5 border-green-500/10"
                          : "bg-red-500/5 border-red-500/10"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge
                            variant={
                              trade.direction === "LONG" ? "default" : "destructive"
                            }
                          >
                            {trade.direction}
                          </Badge>
                          <span className="font-medium">{trade.symbol}</span>
                          {trade.signal?.trader && (
                            <span className="text-sm text-muted-foreground">
                              from {trade.signal.trader.displayName}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          {trade.pnl !== undefined && trade.pnl !== null && (
                            <span
                              className={`font-medium ${
                                trade.pnl >= 0 ? "text-profit" : "text-loss"
                              }`}
                            >
                              {trade.pnl >= 0 ? "+" : ""}${trade.pnl.toFixed(2)}
                            </span>
                          )}
                          {trade.status === "FILLED" ? (
                            <Badge variant="secondary">Open</Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              {new Date(trade.exitedAt || trade.enteredAt).toLocaleTimeString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span>Entry: ${trade.entryPrice.toFixed(2)}</span>
                        {trade.exitPrice && <span>Exit: ${trade.exitPrice.toFixed(2)}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Risk Settings Quick View */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Risk Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Max Daily Loss</span>
                <span className="font-medium">${bot.maxDailyLoss}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Max Position Size</span>
                <span className="font-medium">{bot.maxPositionSize} contracts</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Max Concurrent Trades</span>
                <span className="font-medium">{bot.maxConcurrentTrades}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm">Max Daily Trades</span>
                <span className="font-medium">{bot.maxDailyTrades}</span>
              </div>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/bot/settings">
                  <Settings className="w-4 h-4 mr-2" />
                  Edit Risk Settings
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Connection Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Connections
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-2 rounded bg-secondary/50">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm">TradeTV Signals</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  Connected
                </Badge>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-secondary/50">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm">Tradovate</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  Not Connected
                </Badge>
              </div>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/bot/connect">
                  Connect Broker
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Subscription CTA */}
          <Card className="border-primary">
            <CardHeader>
              <CardTitle className="text-sm">Upgrade Your Plan</CardTitle>
              <CardDescription>
                Get access to more traders and advanced bot features.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  Copy up to 10 traders
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  Advanced risk controls
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  Priority signal execution
                </div>
              </div>
              <Button className="w-full">
                Upgrade to Pro
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
