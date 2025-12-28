"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Award,
  Bot,
  Calendar,
  ChevronRight,
  Copy,
  Edit,
  ExternalLink,
  Heart,
  Settings,
  Shield,
  Star,
  TrendingDown,
  TrendingUp,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRequireAuth } from "@/hooks/useAuth";
import { useBot } from "@/hooks/useBot";
import { useFollow } from "@/hooks/useFollow";

// Demo user data - would come from auth in production
const demoUserData = {
  name: "Demo User",
  email: "demo@tradetv.com",
  image: undefined,
  memberSince: "December 2024",
  subscriptionTier: "PRO",
  tradovateLinked: false,
  isTrader: false,
};

// Demo stats
const demoStats = {
  totalPnl: 4280,
  totalTrades: 156,
  winRate: 62,
  avgTrade: 27.4,
  bestTrade: 480,
  worstTrade: -180,
  streak: 5,
  streakType: "win",
};

// Demo achievements
const achievements = [
  { id: "1", name: "First Trade", description: "Executed your first copy trade", icon: Zap, unlocked: true },
  { id: "2", name: "Profitable Week", description: "End a week in profit", icon: TrendingUp, unlocked: true },
  { id: "3", name: "5 Win Streak", description: "Win 5 trades in a row", icon: Trophy, unlocked: true },
  { id: "4", name: "10 Traders", description: "Follow 10 different traders", icon: Users, unlocked: false },
  { id: "5", name: "Elite Copier", description: "Copy an Elite verified trader", icon: Star, unlocked: true },
  { id: "6", name: "Risk Manager", description: "Set up all risk controls", icon: Shield, unlocked: false },
];

// Demo activity
const recentActivity = [
  { id: "1", type: "trade", message: "Copied LONG ES from TopTrader_Mike", pnl: 120, time: "2 hours ago" },
  { id: "2", type: "follow", message: "Started following NQ_Pro_Sarah", time: "5 hours ago" },
  { id: "3", type: "trade", message: "Copied SHORT NQ from ScalpKing", pnl: -45, time: "1 day ago" },
  { id: "4", type: "trade", message: "Copied LONG ES from TopTrader_Mike", pnl: 85, time: "1 day ago" },
  { id: "5", type: "subscription", message: "Upgraded to Pro subscription", time: "3 days ago" },
];

export default function ProfilePage() {
  const { userId, user, isAuthenticated, isLoading: authLoading } = useRequireAuth();
  const { bot, loading: botLoading } = useBot(userId);
  const { following, loading: followLoading } = useFollow(userId);

  // Use real user data if authenticated, otherwise use demo data
  const userData = isAuthenticated && user
    ? {
        name: user.name || "User",
        email: user.email || "",
        image: user.image || undefined,
        memberSince: "December 2024", // Would calculate from user.createdAt
        subscriptionTier: user.subscriptionTier || "FREE",
        tradovateLinked: user.tradovateLinked || false,
        isTrader: !!user.trader,
      }
    : demoUserData;

  // Calculate stats from bot data
  const stats = bot
    ? {
        totalPnl: bot.totalPnl,
        totalTrades: bot.totalTrades,
        winRate: bot.totalTrades > 0 ? Math.round((bot.winningTrades / bot.totalTrades) * 100) : 0,
        avgTrade: bot.totalTrades > 0 ? bot.totalPnl / bot.totalTrades : 0,
        bestTrade: demoStats.bestTrade, // Would need trade history
        worstTrade: demoStats.worstTrade,
        streak: demoStats.streak,
        streakType: demoStats.streakType,
      }
    : demoStats;

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "PRO":
        return "bg-primary text-primary-foreground";
      case "ELITE":
        return "bg-yellow-500 text-black";
      default:
        return "bg-secondary text-secondary-foreground";
    }
  };

  return (
    <div className="min-h-screen">
      {/* Profile Header */}
      <div className="bg-gradient-to-b from-primary/10 to-background border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Avatar */}
            <Avatar className="w-24 h-24 border-4 border-background shadow-xl">
              <AvatarImage src={userData.image} />
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                {userData.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold">{userData.name}</h1>
                <Badge className={getTierColor(userData.subscriptionTier)}>
                  {userData.subscriptionTier}
                </Badge>
                {userData.isTrader && (
                  <Badge variant="outline" className="gap-1">
                    <Star className="w-3 h-3" />
                    Trader
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground">{userData.email}</p>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Member since {userData.memberSince}
                </span>
                <span className="flex items-center gap-1">
                  <Heart className="w-4 h-4" />
                  {following.length} following
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href="/settings">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Link>
              </Button>
              <Button variant="outline" size="icon">
                <Edit className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Stats */}
            <div className="grid sm:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className={`text-2xl font-bold ${stats.totalPnl >= 0 ? "text-profit" : "text-loss"}`}>
                    {stats.totalPnl >= 0 ? "+" : ""}${stats.totalPnl.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">Total P&L</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold">{stats.totalTrades}</div>
                  <p className="text-xs text-muted-foreground">Total Trades</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold">{stats.winRate}%</div>
                  <p className="text-xs text-muted-foreground">Win Rate</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <div className="text-2xl font-bold">{stats.streak}</div>
                    {stats.streakType === "win" ? (
                      <TrendingUp className="w-5 h-5 text-profit" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-loss" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {stats.streakType === "win" ? "Win" : "Loss"} Streak
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="activity" className="space-y-4">
              <TabsList>
                <TabsTrigger value="activity">Activity</TabsTrigger>
                <TabsTrigger value="achievements">Achievements</TabsTrigger>
                <TabsTrigger value="following">Following</TabsTrigger>
              </TabsList>

              <TabsContent value="activity" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentActivity.map((activity) => (
                        <div key={activity.id} className="flex items-center gap-4">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              activity.type === "trade"
                                ? activity.pnl && activity.pnl >= 0
                                  ? "bg-green-500/10"
                                  : "bg-red-500/10"
                                : activity.type === "follow"
                                ? "bg-blue-500/10"
                                : "bg-primary/10"
                            }`}
                          >
                            {activity.type === "trade" ? (
                              activity.pnl && activity.pnl >= 0 ? (
                                <TrendingUp className="w-5 h-5 text-green-500" />
                              ) : (
                                <TrendingDown className="w-5 h-5 text-red-500" />
                              )
                            ) : activity.type === "follow" ? (
                              <Heart className="w-5 h-5 text-blue-500" />
                            ) : (
                              <Zap className="w-5 h-5 text-primary" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm">{activity.message}</p>
                            <p className="text-xs text-muted-foreground">{activity.time}</p>
                          </div>
                          {activity.pnl !== undefined && (
                            <span
                              className={`font-medium ${
                                activity.pnl >= 0 ? "text-profit" : "text-loss"
                              }`}
                            >
                              {activity.pnl >= 0 ? "+" : ""}${activity.pnl}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="achievements" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Achievements</CardTitle>
                    <CardDescription>
                      {achievements.filter((a) => a.unlocked).length} of {achievements.length} unlocked
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {achievements.map((achievement) => (
                        <div
                          key={achievement.id}
                          className={`flex items-center gap-4 p-4 rounded-lg border ${
                            achievement.unlocked
                              ? "bg-primary/5 border-primary/20"
                              : "bg-secondary/50 opacity-50"
                          }`}
                        >
                          <div
                            className={`w-12 h-12 rounded-full flex items-center justify-center ${
                              achievement.unlocked ? "bg-primary/10" : "bg-secondary"
                            }`}
                          >
                            <achievement.icon
                              className={`w-6 h-6 ${
                                achievement.unlocked ? "text-primary" : "text-muted-foreground"
                              }`}
                            />
                          </div>
                          <div>
                            <h4 className="font-medium">{achievement.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {achievement.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="following" className="space-y-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Traders You Follow</CardTitle>
                      <CardDescription>{following.length} traders</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/following">View All</Link>
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {following.length === 0 ? (
                      <div className="text-center py-8">
                        <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="font-medium mb-2">Not Following Anyone</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Start following traders to copy their signals.
                        </p>
                        <Button asChild>
                          <Link href="/browse">Browse Traders</Link>
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {following.slice(0, 5).map((f) => (
                          <Link
                            key={f.id}
                            href={`/trader/${f.followed.trader?.id || f.followedId}`}
                            className="flex items-center gap-4 p-3 rounded-lg hover:bg-secondary/50 transition-colors"
                          >
                            <Avatar>
                              <AvatarImage src={f.followed.image || undefined} />
                              <AvatarFallback className="bg-primary text-primary-foreground">
                                {(f.followed.trader?.displayName || f.followed.name || "U")
                                  .slice(0, 2)
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">
                                  {f.followed.trader?.displayName || f.followed.name}
                                </span>
                                {f.followed.trader?.verificationTier && (
                                  <Badge variant="secondary" className="text-xs">
                                    {f.followed.trader.verificationTier}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                Following since{" "}
                                {new Date(f.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          </Link>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Bot Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Bot className="w-4 h-4" />
                  Trading Bot
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {bot ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Status</span>
                      <Badge variant={bot.isActive ? "default" : "secondary"}>
                        {bot.isActive ? "Running" : "Paused"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">P&L Today</span>
                      <span className={`font-medium ${bot.totalPnl >= 0 ? "text-profit" : "text-loss"}`}>
                        {bot.totalPnl >= 0 ? "+" : ""}${bot.totalPnl}
                      </span>
                    </div>
                    <Separator />
                    <Button className="w-full" asChild>
                      <Link href="/bot">
                        View Bot
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">
                      Set up your trading bot to start copying traders automatically.
                    </p>
                    <Button className="w-full" asChild>
                      <Link href="/bot/settings">
                        Set Up Bot
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Broker Connection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Broker Connection
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Tradovate</span>
                  <Badge variant={userData.tradovateLinked ? "default" : "outline"}>
                    {userData.tradovateLinked ? "Connected" : "Not Connected"}
                  </Badge>
                </div>
                {!userData.tradovateLinked && (
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/bot/connect">
                      Connect Broker
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Subscription */}
            <Card className="border-primary">
              <CardHeader>
                <CardTitle className="text-sm">Your Plan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{userData.subscriptionTier}</span>
                  {userData.subscriptionTier !== "ELITE" && (
                    <Button size="sm">Upgrade</Button>
                  )}
                </div>
                {userData.subscriptionTier === "FREE" && (
                  <div className="text-sm text-muted-foreground">
                    <p>Upgrade to Pro to:</p>
                    <ul className="mt-2 space-y-1">
                      <li className="flex items-center gap-2">
                        <Copy className="w-3 h-3" />
                        Copy up to 5 traders
                      </li>
                      <li className="flex items-center gap-2">
                        <Shield className="w-3 h-3" />
                        Advanced risk controls
                      </li>
                      <li className="flex items-center gap-2">
                        <Award className="w-3 h-3" />
                        Access all courses
                      </li>
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Become a Trader CTA */}
            {!userData.isTrader && (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Star className="w-8 h-8 mx-auto text-primary mb-2" />
                    <h3 className="font-medium mb-1">Become a Trader</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Share your trades and earn from copiers.
                    </p>
                    <Button variant="outline" className="w-full">
                      Apply Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
