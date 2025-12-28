import { StreamGrid } from "@/components/streams/StreamGrid";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Clock, Star, Users } from "lucide-react";

export const metadata = {
  title: "Browse Traders - TradeTV",
  description: "Discover live trading streams from top traders",
};

export default function BrowsePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Browse Live Streams</h1>
        <p className="text-muted-foreground">
          Discover traders, watch live sessions, and find your next copy trading opportunity.
        </p>
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="live" className="space-y-6">
        <TabsList>
          <TabsTrigger value="live" className="gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full live-pulse" />
            Live Now
          </TabsTrigger>
          <TabsTrigger value="trending" className="gap-2">
            <TrendingUp className="w-4 h-4" />
            Trending
          </TabsTrigger>
          <TabsTrigger value="top" className="gap-2">
            <Star className="w-4 h-4" />
            Top Traders
          </TabsTrigger>
          <TabsTrigger value="new" className="gap-2">
            <Clock className="w-4 h-4" />
            New
          </TabsTrigger>
        </TabsList>

        <TabsContent value="live">
          <StreamGrid
            title="Live Streams"
            showFilters={true}
            featuredFirst={true}
          />
        </TabsContent>

        <TabsContent value="trending">
          <StreamGrid
            title="Trending This Week"
            showFilters={true}
            featuredFirst={false}
          />
        </TabsContent>

        <TabsContent value="top">
          <StreamGrid
            title="Top Performing Traders"
            showFilters={true}
            featuredFirst={false}
          />
        </TabsContent>

        <TabsContent value="new">
          <StreamGrid
            title="Recently Started"
            showFilters={true}
            featuredFirst={false}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
