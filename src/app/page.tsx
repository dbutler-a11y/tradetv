import Link from "next/link";
import { ArrowRight, Bot, GraduationCap, TrendingUp, Users, Zap, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StreamGrid } from "@/components/streams/StreamGrid";
import { FeaturedStream } from "@/components/streams/FeaturedStream";
import { ScheduleCallButton } from "@/components/cta/ScheduleCallButton";

// Demo featured stream
const featuredStream = {
  id: "featured-1",
  traderId: "trader-1",
  traderName: "TopTrader_Mike",
  traderAvatar: undefined,
  verificationTier: "ELITE" as const,
  title: "ES Scalping - NY Session Live | +$2,340 Today",
  thumbnailUrl: undefined,
  viewerCount: 2847,
  copierCount: 1243,
  isLive: true,
  category: "Futures",
  instruments: ["ES", "NQ"],
  winRate: 68,
  todayPnl: 2340,
};

const stats = [
  { label: "Live Traders", value: "127", icon: Users },
  { label: "Active Copiers", value: "8.4k", icon: Bot },
  { label: "Total Payouts", value: "$2.4M", icon: DollarSign },
];

const features = [
  {
    icon: TrendingUp,
    title: "Watch Live Trading",
    description: "Stream top traders in real-time. See their entries, exits, and thought process.",
  },
  {
    icon: Bot,
    title: "Copy with Your Bot",
    description: "Configure your personal trading bot to mirror your favorite traders automatically.",
  },
  {
    icon: GraduationCap,
    title: "Learn & Grow",
    description: "Access courses, coaching, and live mentorship from verified professionals.",
  },
  {
    icon: Zap,
    title: "Get Funded",
    description: "Pass our prop firm challenge and trade with our capital. Keep 80% of profits.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
        <div className="container mx-auto px-4 py-8 lg:py-12">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            {/* Left - Text */}
            <div className="space-y-6">
              <Badge variant="secondary" className="gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full live-pulse" />
                127 traders live now
              </Badge>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
                Watch. Learn.{" "}
                <span className="gradient-text">Earn.</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-lg">
                Copy the traders you trust with your personal AI trading bot.
                Watch live streams, learn strategies, and let your bot execute trades automatically.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button size="lg" asChild>
                  <Link href="/browse">
                    Browse Traders
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/challenges">Get Funded</Link>
                </Button>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-8 pt-4">
                {stats.map((stat) => (
                  <div key={stat.label}>
                    <div className="flex items-center gap-2">
                      <stat.icon className="w-5 h-5 text-primary" />
                      <span className="text-2xl font-bold">{stat.value}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right - Featured Stream Preview */}
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-transparent blur-3xl opacity-50" />
              <FeaturedStream stream={featuredStream} />
            </div>
          </div>
        </div>
      </section>

      {/* Live Streams Section */}
      <section className="container mx-auto px-4 py-12">
        <StreamGrid
          title="Live Now"
          showFilters={true}
          featuredFirst={false}
        />
      </section>

      {/* Features Section */}
      <section className="border-t border-border bg-secondary/20">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How TradeTV Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              From watching to earning - we've built the complete ecosystem for aspiring traders.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={feature.title} className="relative">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
                {index < features.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-full w-full">
                    <ArrowRight className="w-6 h-6 text-muted-foreground/30 mx-auto" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Simple, Transparent Pricing</h2>
          <p className="text-muted-foreground">
            Start free, upgrade when you're ready to copy trade.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {/* Free */}
          <div className="rounded-xl border border-border p-6">
            <h3 className="font-semibold text-lg mb-1">Free</h3>
            <div className="text-3xl font-bold mb-4">$0</div>
            <ul className="space-y-2 text-sm text-muted-foreground mb-6">
              <li>• Watch all streams</li>
              <li>• Basic analytics</li>
              <li>• Community access</li>
            </ul>
            <Button variant="outline" className="w-full">Get Started</Button>
          </div>

          {/* Pro */}
          <div className="rounded-xl border-2 border-primary p-6 relative">
            <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">Popular</Badge>
            <h3 className="font-semibold text-lg mb-1">Pro</h3>
            <div className="text-3xl font-bold mb-4">$59<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
            <ul className="space-y-2 text-sm text-muted-foreground mb-6">
              <li>• Everything in Free</li>
              <li>• 3 trading bots</li>
              <li>• Copy 5 traders</li>
              <li>• Priority signals</li>
            </ul>
            <Button className="w-full">Upgrade to Pro</Button>
          </div>

          {/* Elite */}
          <div className="rounded-xl border border-border p-6">
            <h3 className="font-semibold text-lg mb-1">Elite</h3>
            <div className="text-3xl font-bold mb-4">$99<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
            <ul className="space-y-2 text-sm text-muted-foreground mb-6">
              <li>• Everything in Pro</li>
              <li>• Unlimited bots</li>
              <li>• VIP coaching</li>
              <li>• 0.5% profit share</li>
            </ul>
            <Button variant="outline" className="w-full">Go Elite</Button>
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          + 1% of funded account payouts on all tiers
        </p>
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-gradient-to-b from-background to-secondary/20">
        <div className="container mx-auto px-4 py-16 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Trading Smarter?</h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-8">
            Join thousands of traders who are already watching, learning, and earning on TradeTV.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" asChild>
              <Link href="/signup">
                Create Free Account
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
            <ScheduleCallButton size="lg" variant="outline" />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <span className="font-bold gradient-text">TradeTV</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 TradeTV. Trading involves risk. Past performance does not guarantee future results.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
