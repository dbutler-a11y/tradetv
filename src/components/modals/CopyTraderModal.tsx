"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  CheckCircle,
  Copy,
  DollarSign,
  Info,
  Loader2,
  Settings,
  Shield,
  Sliders,
  TrendingUp,
  Zap,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useBot, useBotTraders } from "@/hooks/useBot";
import { useRequireAuth } from "@/hooks/useAuth";

interface Trader {
  id: string;
  displayName: string;
  avatarUrl?: string;
  verificationTier: string;
  winRate?: number;
  profitFactor?: number;
  monthlyPnl?: number;
  copiers?: number;
}

interface CopyTraderModalProps {
  trader: Trader;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

type Step = "settings" | "confirm" | "success";

export function CopyTraderModal({
  trader,
  open,
  onOpenChange,
  onSuccess,
}: CopyTraderModalProps) {
  const { userId } = useRequireAuth();
  const { bot, loading: botLoading } = useBot(userId);
  const { traders: botTraders, addTrader, loading: tradersLoading } = useBotTraders(bot?.id || null);

  const [step, setStep] = useState<Step>("settings");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Copy settings
  const [weight, setWeight] = useState(100);
  const [delay, setDelay] = useState(0);
  const [copyLongs, setCopyLongs] = useState(true);
  const [copyShorts, setCopyShorts] = useState(true);
  const [copyScales, setCopyScales] = useState(true);

  // Check if already copying this trader
  const isAlreadyCopying = botTraders.some((bt) => bt.trader.id === trader.id);

  const handleAddTrader = async () => {
    if (!bot?.id) return;

    setAdding(true);
    setError(null);

    try {
      await addTrader(trader.id, {
        weight,
        delay,
        copyLongs,
        copyShorts,
        copyScales,
      });
      setStep("success");
      onSuccess?.();
    } catch (err) {
      setError("Failed to add trader. Please try again.");
    } finally {
      setAdding(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset state after close animation
    setTimeout(() => {
      setStep("settings");
      setError(null);
    }, 200);
  };

  const renderSettings = () => (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-3">
          <Copy className="w-5 h-5" />
          Copy {trader.displayName}
        </DialogTitle>
        <DialogDescription>
          Configure how you want to copy this trader's signals to your bot.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-6 py-4">
        {/* Trader Preview */}
        <div className="flex items-center gap-4 p-4 rounded-lg bg-secondary/50">
          <Avatar className="w-12 h-12">
            <AvatarImage src={trader.avatarUrl} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {trader.displayName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">{trader.displayName}</span>
              <Badge variant="secondary">{trader.verificationTier}</Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
              {trader.winRate && <span>{trader.winRate.toFixed(0)}% win rate</span>}
              {trader.profitFactor && <span>{trader.profitFactor.toFixed(1)} PF</span>}
              {trader.copiers && <span>{trader.copiers.toLocaleString()} copiers</span>}
            </div>
          </div>
          {trader.monthlyPnl && (
            <div className="text-right">
              <div className={`font-bold ${trader.monthlyPnl >= 0 ? "text-profit" : "text-loss"}`}>
                {trader.monthlyPnl >= 0 ? "+" : ""}${trader.monthlyPnl.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">Monthly P&L</p>
            </div>
          )}
        </div>

        {/* No Bot Warning */}
        {!bot && !botLoading && (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-600">Bot Not Configured</p>
              <p className="text-sm text-muted-foreground mt-1">
                You need to set up your trading bot first before copying traders.
              </p>
              <Button variant="outline" size="sm" className="mt-2" asChild>
                <Link href="/bot/settings">
                  <Settings className="w-4 h-4 mr-2" />
                  Configure Bot
                </Link>
              </Button>
            </div>
          </div>
        )}

        {/* Already Copying Warning */}
        {isAlreadyCopying && (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-blue-600">Already Copying</p>
              <p className="text-sm text-muted-foreground mt-1">
                You're already copying this trader. You can update settings in your bot configuration.
              </p>
              <Button variant="outline" size="sm" className="mt-2" asChild>
                <Link href={`/bot/trader/${trader.id}`}>
                  <Sliders className="w-4 h-4 mr-2" />
                  Edit Settings
                </Link>
              </Button>
            </div>
          </div>
        )}

        {bot && !isAlreadyCopying && (
          <>
            <Separator />

            {/* Weight (Allocation) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Label className="flex items-center gap-2 cursor-help">
                        <DollarSign className="w-4 h-4" />
                        Allocation Weight
                        <Info className="w-3 h-3 text-muted-foreground" />
                      </Label>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        Percentage of your position size to use when copying this trader.
                        100% = full position, 50% = half position.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <span className="font-medium">{weight}%</span>
              </div>
              <Slider
                value={[weight]}
                onValueChange={([v]) => setWeight(v)}
                min={10}
                max={200}
                step={10}
              />
              <p className="text-xs text-muted-foreground">
                A weight of 100% uses your standard position size. Increase for more aggressive copying.
              </p>
            </div>

            {/* Execution Delay */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Label className="flex items-center gap-2 cursor-help">
                        <Zap className="w-4 h-4" />
                        Execution Delay
                        <Info className="w-3 h-3 text-muted-foreground" />
                      </Label>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        Wait time before executing a signal. Use 0 for instant execution.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <span className="font-medium">{delay}s</span>
              </div>
              <Slider
                value={[delay]}
                onValueChange={([v]) => setDelay(v)}
                min={0}
                max={30}
                step={1}
              />
            </div>

            {/* Trade Types */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Trade Types to Copy
              </Label>
              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <span className="text-sm">Longs</span>
                  <Switch checked={copyLongs} onCheckedChange={setCopyLongs} />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <span className="text-sm">Shorts</span>
                  <Switch checked={copyShorts} onCheckedChange={setCopyShorts} />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <span className="text-sm">Scales</span>
                  <Switch checked={copyScales} onCheckedChange={setCopyScales} />
                </div>
              </div>
            </div>

          </>
        )}

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={handleClose}>
          Cancel
        </Button>
        <Button
          onClick={() => setStep("confirm")}
          disabled={!bot || isAlreadyCopying || (!copyLongs && !copyShorts)}
        >
          Continue
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </DialogFooter>
    </>
  );

  const renderConfirm = () => (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-3">
          <CheckCircle className="w-5 h-5" />
          Confirm Copy Settings
        </DialogTitle>
        <DialogDescription>
          Review your settings before adding this trader to your bot.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-4">
        <div className="space-y-3 p-4 rounded-lg bg-secondary/50">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Trader</span>
            <span className="font-medium">{trader.displayName}</span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="text-muted-foreground">Allocation</span>
            <span className="font-medium">{weight}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Execution Delay</span>
            <span className="font-medium">{delay}s</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Trade Types</span>
            <span className="font-medium">
              {[copyLongs && "Longs", copyShorts && "Shorts", copyScales && "Scales"]
                .filter(Boolean)
                .join(", ")}
            </span>
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
          <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-yellow-600">Risk Warning</p>
            <p className="text-muted-foreground mt-1">
              Copy trading involves risk. Past performance does not guarantee future results.
              Only trade with capital you can afford to lose.
            </p>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={() => setStep("settings")}>
          Back
        </Button>
        <Button onClick={handleAddTrader} disabled={adding}>
          {adding ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Adding...
            </>
          ) : (
            <>
              <Bot className="w-4 h-4 mr-2" />
              Add to My Bot
            </>
          )}
        </Button>
      </DialogFooter>
    </>
  );

  const renderSuccess = () => (
    <>
      <DialogHeader>
        <div className="flex flex-col items-center text-center pt-4">
          <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <DialogTitle>Trader Added Successfully!</DialogTitle>
          <DialogDescription className="mt-2">
            {trader.displayName} has been added to your trading bot. You'll start
            receiving their signals automatically.
          </DialogDescription>
        </div>
      </DialogHeader>

      <div className="py-6">
        <div className="grid grid-cols-2 gap-4">
          <Button variant="outline" asChild>
            <Link href="/bot">
              <Bot className="w-4 h-4 mr-2" />
              View My Bot
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/bot/trader/${trader.id}`}>
              <Sliders className="w-4 h-4 mr-2" />
              Edit Settings
            </Link>
          </Button>
        </div>
      </div>

      <DialogFooter>
        <Button variant="ghost" onClick={handleClose} className="w-full">
          Close
        </Button>
      </DialogFooter>
    </>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {step === "settings" && renderSettings()}
        {step === "confirm" && renderConfirm()}
        {step === "success" && renderSuccess()}
      </DialogContent>
    </Dialog>
  );
}
