"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  Calendar,
  Info,
  Save,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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

// Demo trader data
const traderData = {
  id: "trader-1",
  name: "TopTrader_Mike",
  avatar: undefined,
  tier: "ELITE",
  winRate: 68,
  profitFactor: 2.3,
  monthlyPnl: 8420,
  followers: 12400,
  style: "Scalping",
  instruments: ["ES", "NQ"],
};

export default function TraderBotSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Settings for this specific trader
  const [enabled, setEnabled] = useState(true);
  const [allocation, setAllocation] = useState(40);
  const [copyMultiplier, setCopyMultiplier] = useState(1.0);
  const [maxLossPerTrade, setMaxLossPerTrade] = useState(100);
  const [delayEntry, setDelayEntry] = useState(false);
  const [entryDelaySeconds, setEntryDelaySeconds] = useState(5);
  const [onlyPrimaryInstruments, setOnlyPrimaryInstruments] = useState(false);
  const [copyScaleOuts, setCopyScaleOuts] = useState(true);
  const [useTraderStops, setUseTraderStops] = useState(true);

  const handleSave = () => {
    console.log("Saving trader settings...");
  };

  const handleRemove = () => {
    console.log("Removing trader...");
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/bot">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Trader Settings</h1>
          <p className="text-muted-foreground">
            Configure how you copy trades from this trader.
          </p>
        </div>
      </div>

      {/* Trader Info */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={traderData.avatar} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                {traderData.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Link
                  href={`/trader/${traderData.id}`}
                  className="text-xl font-bold hover:text-primary"
                >
                  {traderData.name}
                </Link>
                <Badge variant="default">{traderData.tier}</Badge>
              </div>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span>{traderData.winRate}% Win Rate</span>
                <span>{traderData.profitFactor} PF</span>
                <span>{traderData.style}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-profit">
                +${traderData.monthlyPnl.toLocaleString()}
              </div>
              <p className="text-sm text-muted-foreground">This month</p>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-lg font-bold">{traderData.winRate}%</div>
              <p className="text-xs text-muted-foreground">Win Rate</p>
            </div>
            <div>
              <div className="text-lg font-bold">{traderData.profitFactor}</div>
              <p className="text-xs text-muted-foreground">Profit Factor</p>
            </div>
            <div>
              <div className="text-lg font-bold">
                {traderData.followers.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">Followers</p>
            </div>
            <div>
              <div className="text-lg font-bold">
                {traderData.instruments.join(", ")}
              </div>
              <p className="text-xs text-muted-foreground">Instruments</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings */}
      <div className="space-y-6">
        {/* Enable/Disable */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Copy Trading Enabled</Label>
                <p className="text-sm text-muted-foreground">
                  {enabled
                    ? "You are currently copying trades from this trader."
                    : "Copy trading is paused for this trader."}
                </p>
              </div>
              <Switch checked={enabled} onCheckedChange={setEnabled} />
            </div>
          </CardContent>
        </Card>

        {/* Position Sizing */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Position Sizing
            </CardTitle>
            <CardDescription>
              Control how much capital is allocated to this trader's signals.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Allocation */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  Capital Allocation
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="w-4 h-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Percentage of your total trading capital for this trader.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <span className="font-medium">{allocation}%</span>
              </div>
              <Slider
                value={[allocation]}
                onValueChange={([v]) => setAllocation(v)}
                max={100}
                min={5}
                step={5}
                disabled={!enabled}
              />
              <p className="text-xs text-muted-foreground">
                Total allocation across all traders should equal 100%.
              </p>
            </div>

            <Separator />

            {/* Copy Multiplier */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  Copy Multiplier
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="w-4 h-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          Multiply the trader's position size. 0.5x = half size, 2x =
                          double.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <span className="font-medium">{copyMultiplier}x</span>
              </div>
              <Slider
                value={[copyMultiplier * 10]}
                onValueChange={([v]) => setCopyMultiplier(v / 10)}
                max={30}
                min={1}
                step={1}
                disabled={!enabled}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0.1x</span>
                <span>1.0x</span>
                <span>2.0x</span>
                <span>3.0x</span>
              </div>
            </div>

            <Separator />

            {/* Max Loss Per Trade */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Max Loss Per Trade</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">$</span>
                  <Input
                    type="number"
                    value={maxLossPerTrade}
                    onChange={(e) => setMaxLossPerTrade(parseInt(e.target.value))}
                    className="w-24 h-8"
                    disabled={!enabled}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Maximum loss allowed per trade from this trader before auto-exit.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Execution Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Execution Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Delay Entry */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Delay Entry</Label>
                  <p className="text-sm text-muted-foreground">
                    Wait before entering after receiving signal.
                  </p>
                </div>
                <Switch
                  checked={delayEntry}
                  onCheckedChange={setDelayEntry}
                  disabled={!enabled}
                />
              </div>
              {delayEntry && (
                <div className="pl-4 border-l-2 border-primary space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Delay (seconds)</Label>
                    <span className="font-medium">{entryDelaySeconds}s</span>
                  </div>
                  <Slider
                    value={[entryDelaySeconds]}
                    onValueChange={([v]) => setEntryDelaySeconds(v)}
                    max={30}
                    min={1}
                    step={1}
                    disabled={!enabled}
                  />
                </div>
              )}
            </div>

            <Separator />

            {/* Only Primary Instruments */}
            <div className="flex items-center justify-between">
              <div>
                <Label>Only Primary Instruments</Label>
                <p className="text-sm text-muted-foreground">
                  Only copy trades in {traderData.instruments.join(", ")}.
                </p>
              </div>
              <Switch
                checked={onlyPrimaryInstruments}
                onCheckedChange={setOnlyPrimaryInstruments}
                disabled={!enabled}
              />
            </div>

            <Separator />

            {/* Copy Scale Outs */}
            <div className="flex items-center justify-between">
              <div>
                <Label>Copy Scale-Out Orders</Label>
                <p className="text-sm text-muted-foreground">
                  Exit partially when the trader scales out.
                </p>
              </div>
              <Switch
                checked={copyScaleOuts}
                onCheckedChange={setCopyScaleOuts}
                disabled={!enabled}
              />
            </div>

            <Separator />

            {/* Use Trader's Stops */}
            <div className="flex items-center justify-between">
              <div>
                <Label>Use Trader's Stop Losses</Label>
                <p className="text-sm text-muted-foreground">
                  Copy the trader's stop loss levels.
                </p>
              </div>
              <Switch
                checked={useTraderStops}
                onCheckedChange={setUseTraderStops}
                disabled={!enabled}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-between gap-4">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="gap-2">
                <Trash2 className="w-4 h-4" />
                Remove Trader
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove {traderData.name}?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will stop copying trades from this trader and remove them
                  from your bot. Any open positions will remain open.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleRemove}>
                  Remove
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/bot">Cancel</Link>
            </Button>
            <Button onClick={handleSave} className="gap-2">
              <Save className="w-4 h-4" />
              Save Settings
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
