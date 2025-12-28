"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bot,
  CheckCircle,
  Loader2,
  Radio,
  Search,
  Settings,
  TrendingUp,
  UserMinus,
  Users,
  XCircle,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useFollow, FollowedUser } from "@/hooks/useFollow";
import { useBot, useBotTraders } from "@/hooks/useBot";
import { useRequireAuth } from "@/hooks/useAuth";

function TraderCard({
  followData,
  onUnfollow,
  isInBot,
  onAddToBot,
  addingToBot,
}: {
  followData: FollowedUser;
  onUnfollow: (id: string) => void;
  isInBot: boolean;
  onAddToBot: (traderId: string) => void;
  addingToBot: boolean;
}) {
  const trader = followData.followed.trader;
  const [unfollowing, setUnfollowing] = useState(false);

  if (!trader) {
    return null;
  }

  const handleUnfollow = async () => {
    setUnfollowing(true);
    await onUnfollow(followData.followedId);
    setUnfollowing(false);
  };

  const tierColors: Record<string, string> = {
    ELITE: "bg-gradient-to-r from-yellow-500 to-amber-500 text-white",
    PRO: "bg-gradient-to-r from-purple-500 to-indigo-500 text-white",
    VERIFIED: "bg-gradient-to-r from-blue-500 to-cyan-500 text-white",
    UNVERIFIED: "bg-gray-500 text-white",
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          {/* Avatar with live indicator */}
          <div className="relative">
            <Avatar className="w-16 h-16">
              <AvatarImage src={trader.avatarUrl} />
              <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                {trader.displayName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {trader.isLive && (
              <span className="absolute -bottom-1 -right-1 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-medium">
                <Radio className="w-2 h-2 animate-pulse" />
                LIVE
              </span>
            )}
          </div>

          {/* Trader Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Link
                href={`/trader/${trader.id}`}
                className="font-semibold text-lg hover:text-primary truncate"
              >
                {trader.displayName}
              </Link>
              <Badge className={`text-xs ${tierColors[trader.verificationTier] || tierColors.UNVERIFIED}`}>
                {trader.verificationTier}
              </Badge>
            </div>

            {/* Stats Row */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mb-3">
              {trader.winRate !== undefined && trader.winRate !== null && (
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  {trader.winRate.toFixed(0)}% Win Rate
                </span>
              )}
              {trader.profitFactor !== undefined && trader.profitFactor !== null && (
                <span>
                  PF: {trader.profitFactor.toFixed(1)}
                </span>
              )}
              {trader.monthlyPnl !== undefined && trader.monthlyPnl !== null && (
                <span className={trader.monthlyPnl >= 0 ? "text-green-500" : "text-red-500"}>
                  {trader.monthlyPnl >= 0 ? "+" : ""}${trader.monthlyPnl.toLocaleString()}/mo
                </span>
              )}
            </div>

            {/* Bot Status */}
            <div className="flex items-center gap-2">
              {isInBot ? (
                <div className="flex items-center gap-1.5 text-sm text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span>Added to bot</span>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onAddToBot(trader.id)}
                  disabled={addingToBot}
                  className="gap-1.5"
                >
                  {addingToBot ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Bot className="w-3.5 h-3.5" />
                  )}
                  Add to Bot
                </Button>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/trader/${trader.id}`}>View Profile</Link>
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-destructive"
                  disabled={unfollowing}
                >
                  {unfollowing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <UserMinus className="w-4 h-4 mr-1" />
                      Unfollow
                    </>
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Unfollow {trader.displayName}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    You will no longer see their streams in your feed. If they're in your bot,
                    you'll need to remove them separately.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleUnfollow}>Unfollow</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function FollowingPage() {
  const { userId } = useRequireAuth();
  const { following, loading, error, unfollow, refetch } = useFollow(userId);
  const { bot } = useBot(userId);
  const { traders: botTraders, addTrader } = useBotTraders(bot?.id || null);

  const [searchQuery, setSearchQuery] = useState("");
  const [addingTrader, setAddingTrader] = useState<string | null>(null);

  // Filter following based on search
  const filteredFollowing = following.filter((f) => {
    if (!searchQuery) return true;
    const name = f.followed.trader?.displayName || f.followed.name || "";
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Separate into categories
  const liveTraders = filteredFollowing.filter((f) => f.followed.trader?.isLive);
  const offlineTraders = filteredFollowing.filter((f) => !f.followed.trader?.isLive);

  // Check if a trader is in the bot
  const isTraderInBot = (traderId: string) => {
    return botTraders.some((bt) => bt.traderId === traderId);
  };

  const handleAddToBot = async (traderId: string) => {
    if (!bot) {
      // Could redirect to bot setup or show a message
      return;
    }
    setAddingTrader(traderId);
    await addTrader(traderId);
    setAddingTrader(null);
  };

  const handleUnfollow = async (followedId: string) => {
    await unfollow(followedId);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading followed traders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Users className="w-8 h-8" />
            Following
          </h1>
          <p className="text-muted-foreground mt-1">
            {following.length} trader{following.length !== 1 ? "s" : ""} you follow
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search traders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
          <Button variant="outline" asChild>
            <Link href="/browse">
              Find Traders
            </Link>
          </Button>
        </div>
      </div>

      {error && (
        <Card className="mb-6 border-destructive">
          <CardContent className="py-4 flex items-center gap-3 text-destructive">
            <XCircle className="w-5 h-5" />
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={refetch} className="ml-auto">
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {following.length === 0 ? (
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <CardTitle>No Traders Followed</CardTitle>
            <CardDescription>
              Start following traders to see their live streams and copy their trades.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild>
              <Link href="/browse">Browse Traders</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList>
            <TabsTrigger value="all">
              All ({filteredFollowing.length})
            </TabsTrigger>
            <TabsTrigger value="live" className="gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              Live ({liveTraders.length})
            </TabsTrigger>
            <TabsTrigger value="in-bot">
              In Bot ({botTraders.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {filteredFollowing.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No traders match your search.
              </p>
            ) : (
              <div className="grid gap-4">
                {filteredFollowing.map((f) => (
                  <TraderCard
                    key={f.id}
                    followData={f}
                    onUnfollow={handleUnfollow}
                    isInBot={f.followed.trader ? isTraderInBot(f.followed.trader.id) : false}
                    onAddToBot={handleAddToBot}
                    addingToBot={addingTrader === f.followed.trader?.id}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="live" className="space-y-4">
            {liveTraders.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Radio className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-medium mb-2">No Live Traders</h3>
                  <p className="text-sm text-muted-foreground">
                    None of the traders you follow are currently streaming.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {liveTraders.map((f) => (
                  <TraderCard
                    key={f.id}
                    followData={f}
                    onUnfollow={handleUnfollow}
                    isInBot={f.followed.trader ? isTraderInBot(f.followed.trader.id) : false}
                    onAddToBot={handleAddToBot}
                    addingToBot={addingTrader === f.followed.trader?.id}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="in-bot" className="space-y-4">
            {botTraders.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Bot className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-medium mb-2">No Traders in Bot</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add traders to your bot to automatically copy their trades.
                  </p>
                  <Button variant="outline" asChild>
                    <Link href="/bot/settings">
                      <Settings className="w-4 h-4 mr-2" />
                      Configure Bot
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredFollowing
                  .filter((f) => f.followed.trader && isTraderInBot(f.followed.trader.id))
                  .map((f) => (
                    <TraderCard
                      key={f.id}
                      followData={f}
                      onUnfollow={handleUnfollow}
                      isInBot={true}
                      onAddToBot={handleAddToBot}
                      addingToBot={false}
                    />
                  ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Quick Stats */}
      {following.length > 0 && (
        <div className="mt-8 grid sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold">{following.length}</p>
                <p className="text-sm text-muted-foreground">Total Following</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-red-500">{liveTraders.length}</p>
                <p className="text-sm text-muted-foreground">Currently Live</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-green-500">{botTraders.length}</p>
                <p className="text-sm text-muted-foreground">In Your Bot</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
