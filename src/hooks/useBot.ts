"use client";

import { useState, useEffect, useCallback } from "react";

export interface BotConfig {
  id: string;
  userId: string;
  name: string;
  isActive: boolean;
  maxDailyLoss: number;
  maxPositionSize: number;
  maxDailyTrades: number;
  maxConcurrentTrades: number;
  allowedSymbols: string[];
  tradingHoursStart?: string;
  tradingHoursEnd?: string;
  tradingTimezone: string;
  stopLossMode: string;
  stopLossValue?: number;
  takeProfitMode: string;
  takeProfitValue?: number;
  scaleMultiplier: number;
  minTraderWinRate?: number;
  requireConfirmation: boolean;
  totalPnl: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  traders: BotTraderConfig[];
}

export interface BotTraderConfig {
  id: string;
  traderId: string;
  weight: number;
  delay: number;
  copyLongs: boolean;
  copyShorts: boolean;
  copyScales: boolean;
  isActive: boolean;
  trader: {
    id: string;
    displayName: string;
    avatarUrl?: string;
    verificationTier: string;
    winRate?: number;
    profitFactor?: number;
    monthlyPnl?: number;
  };
}

interface UseBotResult {
  bot: BotConfig | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  saveSettings: (settings: Partial<BotConfig>) => Promise<boolean>;
  toggleActive: (isActive: boolean) => Promise<boolean>;
}

export function useBot(userId: string | null): UseBotResult {
  const [bot, setBot] = useState<BotConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBot = useCallback(async () => {
    if (!userId) {
      setBot(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/bot?userId=${userId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch bot");
      }

      setBot(data.bot);
    } catch (err: any) {
      setError(err.message);
      console.error("Error fetching bot:", err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchBot();
  }, [fetchBot]);

  const saveSettings = useCallback(
    async (settings: Partial<BotConfig>): Promise<boolean> => {
      if (!userId) return false;

      try {
        const response = await fetch("/api/bot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, ...settings }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to save settings");
        }

        setBot(data.bot);
        return true;
      } catch (err: any) {
        setError(err.message);
        console.error("Error saving bot settings:", err);
        return false;
      }
    },
    [userId]
  );

  const toggleActive = useCallback(
    async (isActive: boolean): Promise<boolean> => {
      if (!bot?.id) return false;

      try {
        const response = await fetch("/api/bot", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ botId: bot.id, isActive }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to toggle bot");
        }

        setBot(data.bot);
        return true;
      } catch (err: any) {
        setError(err.message);
        console.error("Error toggling bot:", err);
        return false;
      }
    },
    [bot?.id]
  );

  return {
    bot,
    loading,
    error,
    refetch: fetchBot,
    saveSettings,
    toggleActive,
  };
}

// Hook for managing traders in a bot
interface UseBotTradersResult {
  traders: BotTraderConfig[];
  loading: boolean;
  error: string | null;
  addTrader: (traderId: string, settings?: Partial<BotTraderConfig>) => Promise<boolean>;
  updateTrader: (id: string, settings: Partial<BotTraderConfig>) => Promise<boolean>;
  removeTrader: (id: string) => Promise<boolean>;
  refetch: () => Promise<void>;
}

export function useBotTraders(botId: string | null): UseBotTradersResult {
  const [traders, setTraders] = useState<BotTraderConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTraders = useCallback(async () => {
    if (!botId) {
      setTraders([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/bot/traders?botId=${botId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch traders");
      }

      setTraders(data.traders || []);
    } catch (err: any) {
      setError(err.message);
      console.error("Error fetching bot traders:", err);
    } finally {
      setLoading(false);
    }
  }, [botId]);

  useEffect(() => {
    fetchTraders();
  }, [fetchTraders]);

  const addTrader = useCallback(
    async (traderId: string, settings?: Partial<BotTraderConfig>): Promise<boolean> => {
      if (!botId) return false;

      try {
        const response = await fetch("/api/bot/traders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ botId, traderId, ...settings }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to add trader");
        }

        await fetchTraders();
        return true;
      } catch (err: any) {
        setError(err.message);
        console.error("Error adding trader:", err);
        return false;
      }
    },
    [botId, fetchTraders]
  );

  const updateTrader = useCallback(
    async (id: string, settings: Partial<BotTraderConfig>): Promise<boolean> => {
      try {
        const response = await fetch("/api/bot/traders", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, ...settings }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to update trader");
        }

        setTraders((prev) =>
          prev.map((t) => (t.id === id ? data.botTrader : t))
        );
        return true;
      } catch (err: any) {
        setError(err.message);
        console.error("Error updating trader:", err);
        return false;
      }
    },
    []
  );

  const removeTrader = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await fetch("/api/bot/traders", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to remove trader");
      }

      setTraders((prev) => prev.filter((t) => t.id !== id));
      return true;
    } catch (err: any) {
      setError(err.message);
      console.error("Error removing trader:", err);
      return false;
    }
  }, []);

  return {
    traders,
    loading,
    error,
    addTrader,
    updateTrader,
    removeTrader,
    refetch: fetchTraders,
  };
}
