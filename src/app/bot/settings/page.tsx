"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bell,
  DollarSign,
  Info,
  Loader2,
  Save,
  Shield,
  Sliders,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useBot } from "@/hooks/useBot";
import { useRequireAuth } from "@/hooks/useAuth";

export default function BotSettingsPage() {
  const router = useRouter();
  const { userId } = useRequireAuth();
  const { bot, loading: botLoading, saveSettings } = useBot(userId);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Risk Settings
  const [botName, setBotName] = useState("My Trading Bot");
  const [maxDailyLoss, setMaxDailyLoss] = useState(500);
  const [maxPositionSize, setMaxPositionSize] = useState(2);
  const [maxConcurrentTrades, setMaxConcurrentTrades] = useState(3);
  const [maxDailyTrades, setMaxDailyTrades] = useState(10);
  const [stopLossMode, setStopLossMode] = useState("FIXED");
  const [stopLossValue, setStopLossValue] = useState(50);
  const [takeProfitMode, setTakeProfitMode] = useState("NONE");
  const [takeProfitValue, setTakeProfitValue] = useState(100);
  const [scaleMultiplier, setScaleMultiplier] = useState(1.0);

  // Trading Settings
  const [requireConfirmation, setRequireConfirmation] = useState(false);

  // Instrument Filters
  const [instrumentFilter, setInstrumentFilter] = useState("all");
  const [allowedSymbols, setAllowedSymbols] = useState<string[]>([
    "ES",
    "NQ",
    "YM",
  ]);

  // Trading Hours
  const [tradingHoursStart, setTradingHoursStart] = useState("");
  const [tradingHoursEnd, setTradingHoursEnd] = useState("");
  const [tradingTimezone, setTradingTimezone] = useState("America/New_York");

  // Min Trader Win Rate
  const [minTraderWinRate, setMinTraderWinRate] = useState<number | undefined>();

  // Load settings from bot when it's available
  useEffect(() => {
    if (bot) {
      setBotName(bot.name || "My Trading Bot");
      setMaxDailyLoss(bot.maxDailyLoss);
      setMaxPositionSize(bot.maxPositionSize);
      setMaxConcurrentTrades(bot.maxConcurrentTrades);
      setMaxDailyTrades(bot.maxDailyTrades);
      setStopLossMode(bot.stopLossMode || "FIXED");
      setStopLossValue(bot.stopLossValue || 50);
      setTakeProfitMode(bot.takeProfitMode || "NONE");
      setTakeProfitValue(bot.takeProfitValue || 100);
      setScaleMultiplier(bot.scaleMultiplier);
      setRequireConfirmation(bot.requireConfirmation);
      setAllowedSymbols(bot.allowedSymbols || []);
      setInstrumentFilter(bot.allowedSymbols?.length > 0 ? "selected" : "all");
      setTradingHoursStart(bot.tradingHoursStart || "");
      setTradingHoursEnd(bot.tradingHoursEnd || "");
      setTradingTimezone(bot.tradingTimezone || "America/New_York");
      setMinTraderWinRate(bot.minTraderWinRate);
    }
  }, [bot]);

  // Track changes
  useEffect(() => {
    if (!bot) return;

    const changed =
      botName !== (bot.name || "My Trading Bot") ||
      maxDailyLoss !== bot.maxDailyLoss ||
      maxPositionSize !== bot.maxPositionSize ||
      maxConcurrentTrades !== bot.maxConcurrentTrades ||
      maxDailyTrades !== bot.maxDailyTrades ||
      stopLossMode !== (bot.stopLossMode || "FIXED") ||
      stopLossValue !== (bot.stopLossValue || 50) ||
      takeProfitMode !== (bot.takeProfitMode || "NONE") ||
      takeProfitValue !== (bot.takeProfitValue || 100) ||
      scaleMultiplier !== bot.scaleMultiplier ||
      requireConfirmation !== bot.requireConfirmation;

    setHasChanges(changed);
  }, [
    bot, botName, maxDailyLoss, maxPositionSize, maxConcurrentTrades, maxDailyTrades,
    stopLossMode, stopLossValue, takeProfitMode, takeProfitValue, scaleMultiplier,
    requireConfirmation
  ]);

  const handleSave = async () => {
    setSaving(true);

    const success = await saveSettings({
      name: botName,
      maxDailyLoss,
      maxPositionSize,
      maxConcurrentTrades,
      maxDailyTrades,
      stopLossMode,
      stopLossValue,
      takeProfitMode,
      takeProfitValue,
      scaleMultiplier,
      requireConfirmation,
      allowedSymbols: instrumentFilter === "all" ? [] : allowedSymbols,
      tradingHoursStart: tradingHoursStart || undefined,
      tradingHoursEnd: tradingHoursEnd || undefined,
      tradingTimezone,
      minTraderWinRate,
    });

    setSaving(false);

    if (success) {
      setHasChanges(false);
      router.push("/bot");
    }
  };

  if (botLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/bot">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Bot Settings</h1>
          <p className="text-muted-foreground">
            Configure your trading bot's behavior and risk controls.
          </p>
        </div>
        {hasChanges && (
          <span className="text-sm text-amber-500">Unsaved changes</span>
        )}
      </div>

      <Tabs defaultValue="risk" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="risk" className="gap-2">
            <Shield className="w-4 h-4" />
            Risk
          </TabsTrigger>
          <TabsTrigger value="trading" className="gap-2">
            <Sliders className="w-4 h-4" />
            Trading
          </TabsTrigger>
          <TabsTrigger value="instruments" className="gap-2">
            <DollarSign className="w-4 h-4" />
            Instruments
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="w-4 h-4" />
            Notifications
          </TabsTrigger>
        </TabsList>

        {/* Risk Settings */}
        <TabsContent value="risk" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Risk Management
              </CardTitle>
              <CardDescription>
                Set your maximum risk parameters to protect your account.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Bot Name */}
              <div className="space-y-2">
                <Label>Bot Name</Label>
                <Input
                  value={botName}
                  onChange={(e) => setBotName(e.target.value)}
                  placeholder="My Trading Bot"
                />
              </div>

              <Separator />

              {/* Max Daily Loss */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    Max Daily Loss
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="w-4 h-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Bot will stop trading for the day when this loss is reached.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <span className="font-medium">${maxDailyLoss}</span>
                </div>
                <Slider
                  value={[maxDailyLoss]}
                  onValueChange={([v]) => setMaxDailyLoss(v)}
                  max={2000}
                  min={100}
                  step={50}
                />
                <p className="text-xs text-muted-foreground">
                  Recommended: 1-2% of your account size
                </p>
              </div>

              <Separator />

              {/* Max Position Size */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    Max Position Size (Contracts)
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="w-4 h-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Maximum contracts per trade, regardless of signal size.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <span className="font-medium">{maxPositionSize}</span>
                </div>
                <Slider
                  value={[maxPositionSize]}
                  onValueChange={([v]) => setMaxPositionSize(v)}
                  max={10}
                  min={1}
                  step={1}
                />
              </div>

              <Separator />

              {/* Max Concurrent Trades */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    Max Concurrent Trades
                  </Label>
                  <span className="font-medium">{maxConcurrentTrades}</span>
                </div>
                <Slider
                  value={[maxConcurrentTrades]}
                  onValueChange={([v]) => setMaxConcurrentTrades(v)}
                  max={10}
                  min={1}
                  step={1}
                />
              </div>

              <Separator />

              {/* Max Daily Trades */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    Max Daily Trades
                  </Label>
                  <span className="font-medium">{maxDailyTrades}</span>
                </div>
                <Slider
                  value={[maxDailyTrades]}
                  onValueChange={([v]) => setMaxDailyTrades(v)}
                  max={50}
                  min={1}
                  step={1}
                />
              </div>

              <Separator />

              {/* Stop Loss Mode */}
              <div className="space-y-4">
                <Label>Stop Loss Mode</Label>
                <RadioGroup
                  value={stopLossMode}
                  onValueChange={setStopLossMode}
                  className="space-y-3"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="NONE" id="sl-none" />
                    <Label htmlFor="sl-none">No stop loss (copy trader's stop)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="FIXED" id="sl-fixed" />
                    <Label htmlFor="sl-fixed">Fixed dollar amount</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="TRAILING" id="sl-trailing" />
                    <Label htmlFor="sl-trailing">Trailing stop</Label>
                  </div>
                </RadioGroup>

                {stopLossMode !== "NONE" && (
                  <div className="pl-6 border-l-2 border-primary space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Stop Loss Value ($)</Label>
                      <span className="font-medium">${stopLossValue}</span>
                    </div>
                    <Slider
                      value={[stopLossValue]}
                      onValueChange={([v]) => setStopLossValue(v)}
                      max={500}
                      min={10}
                      step={10}
                    />
                  </div>
                )}
              </div>

              <Separator />

              {/* Take Profit Mode */}
              <div className="space-y-4">
                <Label>Take Profit Mode</Label>
                <RadioGroup
                  value={takeProfitMode}
                  onValueChange={setTakeProfitMode}
                  className="space-y-3"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="NONE" id="tp-none" />
                    <Label htmlFor="tp-none">No take profit (copy trader's exit)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="FIXED" id="tp-fixed" />
                    <Label htmlFor="tp-fixed">Fixed dollar amount</Label>
                  </div>
                </RadioGroup>

                {takeProfitMode !== "NONE" && (
                  <div className="pl-6 border-l-2 border-primary space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Take Profit Value ($)</Label>
                      <span className="font-medium">${takeProfitValue}</span>
                    </div>
                    <Slider
                      value={[takeProfitValue]}
                      onValueChange={([v]) => setTakeProfitValue(v)}
                      max={1000}
                      min={25}
                      step={25}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trading Settings */}
        <TabsContent value="trading" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sliders className="w-5 h-5" />
                Trade Execution
              </CardTitle>
              <CardDescription>
                Control how trades are executed from signals.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Require Confirmation</Label>
                  <p className="text-sm text-muted-foreground">
                    Require manual confirmation before executing trades.
                  </p>
                </div>
                <Switch
                  checked={requireConfirmation}
                  onCheckedChange={setRequireConfirmation}
                />
              </div>

              <Separator />

              {/* Scale Multiplier */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    Position Scale Multiplier
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="w-4 h-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Multiply trader's position size by this amount (subject to max position limit).</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <span className="font-medium">{scaleMultiplier.toFixed(1)}x</span>
                </div>
                <Slider
                  value={[scaleMultiplier * 10]}
                  onValueChange={([v]) => setScaleMultiplier(v / 10)}
                  max={30}
                  min={1}
                  step={1}
                />
                <p className="text-xs text-muted-foreground">
                  1.0x = Same size as trader, 0.5x = Half size, 2.0x = Double size
                </p>
              </div>

              <Separator />

              {/* Min Trader Win Rate */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    Minimum Trader Win Rate
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="w-4 h-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Only copy traders with at least this win rate.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <span className="font-medium">
                    {minTraderWinRate ? `${minTraderWinRate}%` : "Any"}
                  </span>
                </div>
                <Slider
                  value={[minTraderWinRate || 0]}
                  onValueChange={([v]) => setMinTraderWinRate(v === 0 ? undefined : v)}
                  max={90}
                  min={0}
                  step={5}
                />
              </div>

              <Separator />

              {/* Trading Hours */}
              <div className="space-y-4">
                <Label>Trading Hours (Optional)</Label>
                <p className="text-sm text-muted-foreground">
                  Only execute trades during these hours. Leave empty for 24/7 trading.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Start Time</Label>
                    <Input
                      type="time"
                      value={tradingHoursStart}
                      onChange={(e) => setTradingHoursStart(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">End Time</Label>
                    <Input
                      type="time"
                      value={tradingHoursEnd}
                      onChange={(e) => setTradingHoursEnd(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Instruments */}
        <TabsContent value="instruments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Instrument Filters
              </CardTitle>
              <CardDescription>
                Choose which instruments you want to trade.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <RadioGroup
                value={instrumentFilter}
                onValueChange={setInstrumentFilter}
                className="space-y-3"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="all" />
                  <Label htmlFor="all">Trade all instruments from signals</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="selected" id="selected" />
                  <Label htmlFor="selected">Only trade selected instruments</Label>
                </div>
              </RadioGroup>

              {instrumentFilter === "selected" && (
                <div className="pl-6 border-l-2 border-primary space-y-4">
                  <Label>Select Instruments</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {["ES", "NQ", "YM", "CL", "GC", "EUR/USD", "BTC", "ETH"].map(
                      (inst) => (
                        <Button
                          key={inst}
                          variant={
                            allowedSymbols.includes(inst)
                              ? "default"
                              : "outline"
                          }
                          size="sm"
                          onClick={() => {
                            if (allowedSymbols.includes(inst)) {
                              setAllowedSymbols((prev) =>
                                prev.filter((i) => i !== inst)
                              );
                            } else {
                              setAllowedSymbols((prev) => [...prev, inst]);
                            }
                          }}
                        >
                          {inst}
                        </Button>
                      )
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Trade Notifications
              </CardTitle>
              <CardDescription>
                Choose when and how you want to be notified about bot activity.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label className="text-base">Notify me when:</Label>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium">Trade Entered</span>
                    <p className="text-xs text-muted-foreground">
                      When a signal is copied and a trade is opened
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium">Trade Exited</span>
                    <p className="text-xs text-muted-foreground">
                      When a trade is closed (profit or loss)
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium">Stop Loss Hit</span>
                    <p className="text-xs text-muted-foreground">
                      When a trade is stopped out
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium">Take Profit Hit</span>
                    <p className="text-xs text-muted-foreground">
                      When a trade reaches its profit target
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium">Daily Summary</span>
                    <p className="text-xs text-muted-foreground">
                      End of day summary of all trades and P&L
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <Label className="text-base">Risk Alerts</Label>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium">Daily Loss Limit Warning</span>
                    <p className="text-xs text-muted-foreground">
                      When you reach 80% of your daily loss limit
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium">Daily Loss Limit Reached</span>
                    <p className="text-xs text-muted-foreground">
                      When bot stops due to hitting daily loss limit
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium">Connection Issues</span>
                    <p className="text-xs text-muted-foreground">
                      When broker connection is lost or having issues
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <Label className="text-base">Notification Methods</Label>

                <RadioGroup defaultValue="push" className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="push" id="notif-push" />
                    <Label htmlFor="notif-push" className="flex items-center gap-2">
                      Push Notifications
                      <Badge variant="secondary" className="text-xs">Recommended</Badge>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="email" id="notif-email" />
                    <Label htmlFor="notif-email">Email</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="both" id="notif-both" />
                    <Label htmlFor="notif-both">Both Push and Email</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="none" id="notif-none" />
                    <Label htmlFor="notif-none">None (Not recommended)</Label>
                  </div>
                </RadioGroup>
              </div>

              <Separator />

              <div className="space-y-4">
                <Label className="text-base">Quiet Hours</Label>
                <p className="text-sm text-muted-foreground">
                  Suppress non-critical notifications during these hours.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Start Time</Label>
                    <Input type="time" defaultValue="22:00" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">End Time</Label>
                    <Input type="time" defaultValue="07:00" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="flex justify-end gap-4 mt-8">
        <Button variant="outline" asChild>
          <Link href="/bot">Cancel</Link>
        </Button>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {bot ? "Save Settings" : "Create Bot"}
        </Button>
      </div>
    </div>
  );
}
