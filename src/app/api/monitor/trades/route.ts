import { NextRequest, NextResponse } from "next/server";
import {
  getChannelTrades,
  getChannelStats,
  exportTrades,
  type TradeRecord,
} from "@/lib/signals/signal-correlator";
import { MONITORED_CHANNELS } from "@/lib/youtube/channel-monitor";

/**
 * GET /api/monitor/trades
 *
 * Query trade history and statistics
 *
 * Query params:
 * - channelId: Filter by channel ID
 * - symbol: Filter by symbol (ES, NQ, etc.)
 * - direction: Filter by direction (LONG, SHORT)
 * - result: Filter by result (WIN, LOSS, BREAKEVEN, OPEN)
 * - startDate: Filter trades after this date
 * - endDate: Filter trades before this date
 * - limit: Max number of trades to return
 * - format: Response format (json, csv)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const channelId = searchParams.get("channelId");
  const symbol = searchParams.get("symbol")?.toUpperCase();
  const direction = searchParams.get("direction")?.toUpperCase() as
    | "LONG"
    | "SHORT"
    | undefined;
  const result = searchParams.get("result")?.toUpperCase() as
    | "WIN"
    | "LOSS"
    | "BREAKEVEN"
    | "OPEN"
    | undefined;
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const limit = parseInt(searchParams.get("limit") || "100");
  const format = searchParams.get("format") || "json";
  const statsOnly = searchParams.get("statsOnly") === "true";

  // Get trades for all channels or specific channel
  let allTrades: TradeRecord[] = [];

  if (channelId) {
    allTrades = getChannelTrades(channelId);
  } else {
    // Get trades from all monitored channels
    for (const channel of MONITORED_CHANNELS) {
      allTrades.push(...getChannelTrades(channel.id));
    }
  }

  // Apply filters
  let filteredTrades = allTrades;

  if (symbol) {
    filteredTrades = filteredTrades.filter((t) => t.symbol === symbol);
  }

  if (direction) {
    filteredTrades = filteredTrades.filter((t) => t.direction === direction);
  }

  if (result) {
    filteredTrades = filteredTrades.filter((t) => t.result === result);
  }

  if (startDate) {
    const start = new Date(startDate);
    filteredTrades = filteredTrades.filter((t) => t.entryTime >= start);
  }

  if (endDate) {
    const end = new Date(endDate);
    filteredTrades = filteredTrades.filter((t) => t.entryTime <= end);
  }

  // Sort by entry time (newest first)
  filteredTrades.sort(
    (a, b) => b.entryTime.getTime() - a.entryTime.getTime()
  );

  // Apply limit
  const limitedTrades = filteredTrades.slice(0, limit);

  // Calculate aggregate stats
  const stats = calculateAggregateStats(filteredTrades);

  if (statsOnly) {
    return NextResponse.json({ stats });
  }

  // Format response
  if (format === "csv") {
    const csv = tradesToCsv(limitedTrades);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="trades-${Date.now()}.csv"`,
      },
    });
  }

  return NextResponse.json({
    trades: limitedTrades.map((t) => ({
      id: t.id,
      channelId: t.channelId,
      channelName: t.channelName,
      symbol: t.symbol,
      direction: t.direction,
      entryTime: t.entryTime,
      exitTime: t.exitTime,
      duration: t.duration,
      entryPrice: t.entryPrice,
      exitPrice: t.exitPrice,
      stopLoss: t.stopLoss,
      takeProfit: t.takeProfit,
      size: t.size,
      pnl: t.pnl,
      result: t.result,
    })),
    stats,
    meta: {
      total: filteredTrades.length,
      returned: limitedTrades.length,
      filters: {
        channelId,
        symbol,
        direction,
        result,
        startDate,
        endDate,
      },
    },
  });
}

/**
 * Calculate aggregate statistics
 */
function calculateAggregateStats(trades: TradeRecord[]): {
  totalTrades: number;
  openTrades: number;
  closedTrades: number;
  wins: number;
  losses: number;
  breakeven: number;
  winRate: number;
  totalPnl: number;
  avgPnl: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  largestWin: number;
  largestLoss: number;
  avgDuration: number;
  bySymbol: Record<
    string,
    { trades: number; pnl: number; winRate: number }
  >;
  byChannel: Record<
    string,
    { name: string; trades: number; pnl: number; winRate: number }
  >;
} {
  const closedTrades = trades.filter((t) => t.result !== "OPEN");
  const openTrades = trades.filter((t) => t.result === "OPEN");

  const wins = closedTrades.filter((t) => t.result === "WIN");
  const losses = closedTrades.filter((t) => t.result === "LOSS");
  const breakeven = closedTrades.filter((t) => t.result === "BREAKEVEN");

  const totalWins = wins.reduce((sum, t) => sum + (t.pnl || 0), 0);
  const totalLosses = Math.abs(
    losses.reduce((sum, t) => sum + (t.pnl || 0), 0)
  );
  const totalPnl = closedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);

  // Group by symbol
  const bySymbol: Record<
    string,
    { trades: number; pnl: number; winRate: number }
  > = {};
  for (const trade of closedTrades) {
    if (!bySymbol[trade.symbol]) {
      bySymbol[trade.symbol] = { trades: 0, pnl: 0, winRate: 0 };
    }
    bySymbol[trade.symbol].trades++;
    bySymbol[trade.symbol].pnl += trade.pnl || 0;
  }
  // Calculate win rates per symbol
  for (const symbol of Object.keys(bySymbol)) {
    const symbolTrades = closedTrades.filter((t) => t.symbol === symbol);
    const symbolWins = symbolTrades.filter((t) => t.result === "WIN");
    bySymbol[symbol].winRate = symbolWins.length / symbolTrades.length;
  }

  // Group by channel
  const byChannel: Record<
    string,
    { name: string; trades: number; pnl: number; winRate: number }
  > = {};
  for (const trade of closedTrades) {
    if (!byChannel[trade.channelId]) {
      byChannel[trade.channelId] = {
        name: trade.channelName,
        trades: 0,
        pnl: 0,
        winRate: 0,
      };
    }
    byChannel[trade.channelId].trades++;
    byChannel[trade.channelId].pnl += trade.pnl || 0;
  }
  // Calculate win rates per channel
  for (const channelId of Object.keys(byChannel)) {
    const channelTrades = closedTrades.filter(
      (t) => t.channelId === channelId
    );
    const channelWins = channelTrades.filter((t) => t.result === "WIN");
    byChannel[channelId].winRate = channelWins.length / channelTrades.length;
  }

  return {
    totalTrades: trades.length,
    openTrades: openTrades.length,
    closedTrades: closedTrades.length,
    wins: wins.length,
    losses: losses.length,
    breakeven: breakeven.length,
    winRate:
      closedTrades.length > 0 ? wins.length / closedTrades.length : 0,
    totalPnl,
    avgPnl: closedTrades.length > 0 ? totalPnl / closedTrades.length : 0,
    avgWin: wins.length > 0 ? totalWins / wins.length : 0,
    avgLoss: losses.length > 0 ? totalLosses / losses.length : 0,
    profitFactor: totalLosses > 0 ? totalWins / totalLosses : totalWins,
    largestWin: wins.length > 0 ? Math.max(...wins.map((t) => t.pnl || 0)) : 0,
    largestLoss:
      losses.length > 0 ? Math.min(...losses.map((t) => t.pnl || 0)) : 0,
    avgDuration:
      closedTrades.length > 0
        ? closedTrades.reduce((sum, t) => sum + (t.duration || 0), 0) /
          closedTrades.length
        : 0,
    bySymbol,
    byChannel,
  };
}

/**
 * Convert trades to CSV format
 */
function tradesToCsv(trades: TradeRecord[]): string {
  const headers = [
    "ID",
    "Channel",
    "Symbol",
    "Direction",
    "Entry Time",
    "Exit Time",
    "Duration (s)",
    "Entry Price",
    "Exit Price",
    "Stop Loss",
    "Take Profit",
    "Size",
    "P&L",
    "Result",
  ];

  const rows = trades.map((t) => [
    t.id,
    t.channelName,
    t.symbol,
    t.direction,
    t.entryTime.toISOString(),
    t.exitTime?.toISOString() || "",
    t.duration?.toString() || "",
    t.entryPrice.toString(),
    t.exitPrice?.toString() || "",
    t.stopLoss?.toString() || "",
    t.takeProfit?.toString() || "",
    t.size.toString(),
    t.pnl?.toFixed(2) || "",
    t.result || "",
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

/**
 * POST /api/monitor/trades/export
 *
 * Export all trades
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { channelId } = body;

  const exportData = exportTrades(channelId);

  return new NextResponse(exportData, {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="trades-export-${Date.now()}.json"`,
    },
  });
}
