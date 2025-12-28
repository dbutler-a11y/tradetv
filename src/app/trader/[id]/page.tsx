import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  Copy,
  MessageSquare,
  Share2,
  Star,
  TrendingUp,
  Users,
  Play,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EquityCurve } from "@/components/charts/EquityCurve";
import { PastStreams } from "@/components/trader/PastStreams";
import { TraderReviews } from "@/components/trader/TraderReviews";

// Demo trader data
const demoTrader = {
  id: "trader-1",
  displayName: "TopTrader_Mike",
  bio: "Full-time futures trader specializing in ES and NQ scalping. 10+ years experience. Prop firm funded. Teaching live daily during NY session.",
  avatarUrl: undefined,
  bannerUrl: undefined,
  verificationTier: "ELITE" as const,

  // Stats
  winRate: 68.4,
  profitFactor: 2.3,
  avgTrade: 127,
  monthlyPnl: 8420,
  totalTrades: 1247,
  maxDrawdown: 1240,

  // Social
  followers: 12400,
  copiers: 2100,

  // Trading style
  instruments: ["ES", "NQ"],
  timeframes: ["5m", "15m"],
  style: "Scalping",
  riskLevel: "MODERATE",

  // Schedule
  schedule: "Mon-Fri, 9:30 AM - 12:00 PM ET",

  isLive: true,
  streamViewers: 2847,
};

const recentSignals = [
  { id: "1", action: "LONG", symbol: "NQ", price: 21450, pnl: 340, time: "2 min ago" },
  { id: "2", action: "EXIT", symbol: "ES", price: 5892, pnl: 280, time: "15 min ago" },
  { id: "3", action: "LONG", symbol: "ES", price: 5880, pnl: 180, time: "32 min ago" },
  { id: "4", action: "SHORT", symbol: "NQ", price: 21380, pnl: -120, time: "1 hr ago" },
];

const performanceData = {
  thisMonth: { pnl: 8420, trades: 47, winRate: 68 },
  lastMonth: { pnl: 7890, trades: 52, winRate: 65 },
  allTime: { pnl: 124500, trades: 1247, winRate: 67 },
};

export default async function TraderProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const trader = demoTrader;

  return (
    <div className="min-h-screen">
      {/* Banner */}
      <div className="h-48 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent relative">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
      </div>

      {/* Profile Header */}
      <div className="container mx-auto px-4 -mt-20 relative z-10">
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-end">
          {/* Avatar */}
          <Avatar className="w-32 h-32 border-4 border-background shadow-xl">
            <AvatarImage src={trader.avatarUrl} />
            <AvatarFallback className="bg-primary text-primary-foreground text-3xl">
              {trader.displayName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{trader.displayName}</h1>
              <Badge variant="secondary" className="gap-1">
                <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                {trader.verificationTier}
              </Badge>
              {trader.isLive && (
                <Badge variant="destructive" className="gap-1">
                  <span className="w-2 h-2 bg-white rounded-full live-pulse" />
                  LIVE
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground max-w-2xl mb-4">{trader.bio}</p>
            <div className="flex items-center gap-6 text-sm">
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {trader.followers.toLocaleString()} followers
              </span>
              <span className="flex items-center gap-1">
                <Copy className="w-4 h-4" />
                {trader.copiers.toLocaleString()} copying
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {trader.schedule}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button variant="outline" size="icon">
              <Share2 className="w-4 h-4" />
            </Button>
            <Button variant="outline">Follow</Button>
            <Button className="gap-2">
              <Copy className="w-4 h-4" />
              Copy Trader
            </Button>
            {trader.isLive && (
              <Button variant="destructive" className="gap-2" asChild>
                <Link href={`/watch/live-${trader.id}`}>
                  <Play className="w-4 h-4" />
                  Watch Live
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Performance Cards */}
            <div className="grid sm:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Win Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{trader.winRate}%</div>
                  <Progress value={trader.winRate} className="mt-2" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Profit Factor
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{trader.profitFactor}</div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Avg trade: ${trader.avgTrade}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Monthly P&L
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-profit">
                    +${trader.monthlyPnl.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Max DD: -${trader.maxDrawdown}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="performance" className="space-y-4">
              <TabsList>
                <TabsTrigger value="performance">Performance</TabsTrigger>
                <TabsTrigger value="signals">Signals</TabsTrigger>
                <TabsTrigger value="streams">Past Streams</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
              </TabsList>

              <TabsContent value="performance" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Performance Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid sm:grid-cols-3 gap-6">
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-2">This Month</h4>
                        <div className="text-xl font-bold text-profit">+${performanceData.thisMonth.pnl.toLocaleString()}</div>
                        <p className="text-sm text-muted-foreground">{performanceData.thisMonth.trades} trades • {performanceData.thisMonth.winRate}% WR</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-2">Last Month</h4>
                        <div className="text-xl font-bold text-profit">+${performanceData.lastMonth.pnl.toLocaleString()}</div>
                        <p className="text-sm text-muted-foreground">{performanceData.lastMonth.trades} trades • {performanceData.lastMonth.winRate}% WR</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-2">All Time</h4>
                        <div className="text-xl font-bold text-profit">+${performanceData.allTime.pnl.toLocaleString()}</div>
                        <p className="text-sm text-muted-foreground">{performanceData.allTime.trades} trades • {performanceData.allTime.winRate}% WR</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Equity Curve Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Equity Curve</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <EquityCurve height={280} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="signals" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Signals</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {recentSignals.map((signal) => (
                        <div
                          key={signal.id}
                          className={`p-3 rounded-lg border ${
                            signal.action === "LONG"
                              ? "bg-green-500/10 border-green-500/20"
                              : signal.action === "SHORT"
                              ? "bg-red-500/10 border-red-500/20"
                              : "bg-secondary/50 border-border"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Badge variant={signal.action === "LONG" ? "default" : signal.action === "SHORT" ? "destructive" : "secondary"}>
                                {signal.action}
                              </Badge>
                              <span className="font-medium">{signal.symbol}</span>
                              <span className="text-sm text-muted-foreground">@ {signal.price}</span>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className={signal.pnl >= 0 ? "text-profit" : "text-loss"}>
                                {signal.pnl >= 0 ? "+" : ""}${signal.pnl}
                              </span>
                              <span className="text-sm text-muted-foreground">{signal.time}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="streams">
                <Card>
                  <CardHeader>
                    <CardTitle>Past Streams</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <PastStreams traderId={id} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reviews">
                <Card>
                  <CardHeader>
                    <CardTitle>Trader Reviews</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <TraderReviews traderId={id} />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Trading Style */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Trading Style</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Instruments</p>
                  <div className="flex gap-2">
                    {trader.instruments.map((inst) => (
                      <Badge key={inst} variant="outline">{inst}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Timeframes</p>
                  <div className="flex gap-2">
                    {trader.timeframes.map((tf) => (
                      <Badge key={tf} variant="secondary">{tf}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Style</p>
                  <Badge>{trader.style}</Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Risk Level</p>
                  <Badge variant="outline">{trader.riskLevel}</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Copy CTA */}
            <Card className="border-primary">
              <CardHeader>
                <CardTitle className="text-sm">Copy This Trader</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Add {trader.displayName} to your trading bot and automatically copy their trades.
                </p>
                <Button className="w-full gap-2">
                  <Copy className="w-4 h-4" />
                  Add to My Bot
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  Requires Pro subscription
                </p>
              </CardContent>
            </Card>

            {/* Schedule */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Stream Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  {trader.schedule}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
