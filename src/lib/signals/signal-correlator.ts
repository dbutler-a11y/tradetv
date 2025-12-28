/**
 * Signal Correlator
 *
 * Merges and correlates trade signals from multiple sources:
 * - Vision (screen OCR from trading platform)
 * - Audio (verbal announcements from trader)
 *
 * Uses a sliding window approach to match signals within a time threshold.
 */

import type { DetectedPosition } from "../vision/platform-analyzer";
import type { DetectedSignal } from "../audio/transcription-service";

export interface CorrelatedSignal {
  id: string;
  streamId: string;
  channelId: string;
  timestamp: Date;

  // Trade details
  symbol: string;
  direction: "LONG" | "SHORT";
  type: "ENTRY" | "EXIT" | "ADJUSTMENT";

  // Price information
  entryPrice?: number;
  exitPrice?: number;
  currentPrice?: number;
  stopLoss?: number;
  takeProfit?: number;

  // Size
  size: number;

  // P&L
  realizedPnl?: number;
  unrealizedPnl?: number;

  // Source confidence
  visionConfidence?: number;
  audioConfidence?: number;
  overallConfidence: number;

  // Raw data
  visionData?: DetectedPosition;
  audioData?: DetectedSignal;

  // Metadata
  notes?: string;
}

export interface TradeRecord {
  id: string;
  streamId: string;
  channelId: string;
  channelName: string;

  // Trade identification
  symbol: string;
  direction: "LONG" | "SHORT";

  // Timing
  entryTime: Date;
  exitTime?: Date;
  duration?: number; // seconds

  // Prices
  entryPrice: number;
  exitPrice?: number;
  stopLoss?: number;
  takeProfit?: number;

  // Size
  size: number;

  // P&L
  pnl?: number;
  pnlPercent?: number;
  maxDrawdown?: number;
  maxProfit?: number;

  // Result
  result?: "WIN" | "LOSS" | "BREAKEVEN" | "OPEN";

  // Signals that created this trade
  signals: CorrelatedSignal[];
}

// Configuration
const CORRELATION_WINDOW_MS = 10000; // 10 seconds
const MIN_CONFIDENCE_THRESHOLD = 0.5;

/**
 * In-memory store for active positions and trades
 * In production, this would be backed by a database
 */
const activePositions = new Map<string, DetectedPosition[]>();
const tradeHistory = new Map<string, TradeRecord[]>();
const pendingSignals: CorrelatedSignal[] = [];

/**
 * Generate unique ID for signals and trades
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Create a position key for matching
 */
function positionKey(symbol: string, direction: "LONG" | "SHORT"): string {
  return `${symbol}-${direction}`;
}

/**
 * Correlate a vision detection with pending audio signals
 */
export function correlateVisionSignal(
  streamId: string,
  channelId: string,
  position: DetectedPosition,
  isNew: boolean // true if position just opened, false if it closed
): CorrelatedSignal | null {
  const now = new Date();
  const windowStart = new Date(now.getTime() - CORRELATION_WINDOW_MS);

  // Look for matching audio signals within the time window
  const matchingAudioSignals = pendingSignals.filter(
    (s) =>
      s.streamId === streamId &&
      s.timestamp >= windowStart &&
      (!s.symbol || s.symbol === position.symbol) &&
      (!s.direction || s.direction === position.direction)
  );

  const signal: CorrelatedSignal = {
    id: generateId(),
    streamId,
    channelId,
    timestamp: now,
    symbol: position.symbol,
    direction: position.direction,
    type: isNew ? "ENTRY" : "EXIT",
    entryPrice: isNew ? position.entryPrice : undefined,
    exitPrice: !isNew ? position.currentPrice : undefined,
    currentPrice: position.currentPrice,
    stopLoss: position.stopLoss,
    takeProfit: position.takeProfit,
    size: position.size,
    unrealizedPnl: position.unrealizedPnl,
    realizedPnl: position.realizedPnl,
    visionConfidence: 0.9, // Vision is generally reliable
    visionData: position,
    overallConfidence: 0.9,
  };

  // If we found matching audio, boost confidence
  if (matchingAudioSignals.length > 0) {
    const bestMatch = matchingAudioSignals[0];
    signal.audioConfidence = bestMatch.audioConfidence;
    signal.audioData = bestMatch.audioData;
    signal.overallConfidence = Math.min(
      1,
      (signal.visionConfidence || 0) * 0.6 +
        (signal.audioConfidence || 0) * 0.4 +
        0.1
    );

    // Remove matched audio signal from pending
    const idx = pendingSignals.indexOf(bestMatch);
    if (idx >= 0) pendingSignals.splice(idx, 1);
  }

  return signal;
}

/**
 * Correlate an audio signal with current vision state
 */
export function correlateAudioSignal(
  streamId: string,
  channelId: string,
  audioSignal: DetectedSignal,
  currentPositions: DetectedPosition[]
): CorrelatedSignal | null {
  const now = new Date();

  // Check if audio signal matches a current position
  const matchingPosition = currentPositions.find(
    (p) =>
      (!audioSignal.symbol || p.symbol === audioSignal.symbol) &&
      (!audioSignal.direction ||
        p.direction === audioSignal.direction ||
        (audioSignal.direction === "BUY" && p.direction === "LONG") ||
        (audioSignal.direction === "SELL" && p.direction === "SHORT"))
  );

  if (matchingPosition && audioSignal.type === "entry") {
    // Audio confirms existing position
    return {
      id: generateId(),
      streamId,
      channelId,
      timestamp: now,
      symbol: matchingPosition.symbol,
      direction: matchingPosition.direction,
      type: "ENTRY",
      entryPrice: matchingPosition.entryPrice,
      currentPrice: matchingPosition.currentPrice,
      stopLoss: audioSignal.price || matchingPosition.stopLoss,
      size: matchingPosition.size,
      unrealizedPnl: matchingPosition.unrealizedPnl,
      visionConfidence: 0.9,
      audioConfidence: audioSignal.confidence,
      overallConfidence: 0.95,
      visionData: matchingPosition,
      audioData: audioSignal,
    };
  }

  // No immediate match - store for later correlation
  const pendingSignal: CorrelatedSignal = {
    id: generateId(),
    streamId,
    channelId,
    timestamp: now,
    symbol: audioSignal.symbol || "UNKNOWN",
    direction:
      audioSignal.direction === "BUY" || audioSignal.direction === "LONG"
        ? "LONG"
        : audioSignal.direction === "SELL" || audioSignal.direction === "SHORT"
          ? "SHORT"
          : "LONG",
    type:
      audioSignal.type === "entry"
        ? "ENTRY"
        : audioSignal.type === "exit"
          ? "EXIT"
          : "ADJUSTMENT",
    entryPrice: audioSignal.type === "entry" ? audioSignal.price : undefined,
    exitPrice: audioSignal.type === "exit" ? audioSignal.price : undefined,
    stopLoss: audioSignal.type === "stop" ? audioSignal.price : undefined,
    takeProfit: audioSignal.type === "target" ? audioSignal.price : undefined,
    size: audioSignal.size || 1,
    audioConfidence: audioSignal.confidence,
    overallConfidence: audioSignal.confidence * 0.7, // Lower confidence without vision
    audioData: audioSignal,
  };

  pendingSignals.push(pendingSignal);

  // Clean up old pending signals
  const cutoff = new Date(now.getTime() - CORRELATION_WINDOW_MS * 2);
  while (pendingSignals.length > 0 && pendingSignals[0].timestamp < cutoff) {
    pendingSignals.shift();
  }

  return pendingSignal.overallConfidence >= MIN_CONFIDENCE_THRESHOLD
    ? pendingSignal
    : null;
}

/**
 * Process position changes and create/update trade records
 */
export function processPositionChanges(
  streamId: string,
  channelId: string,
  channelName: string,
  opened: DetectedPosition[],
  closed: DetectedPosition[],
  modified: { previous: DetectedPosition; current: DetectedPosition }[]
): TradeRecord[] {
  const trades: TradeRecord[] = [];
  const now = new Date();

  // Process new positions (entries)
  for (const position of opened) {
    const signal = correlateVisionSignal(streamId, channelId, position, true);

    const trade: TradeRecord = {
      id: generateId(),
      streamId,
      channelId,
      channelName,
      symbol: position.symbol,
      direction: position.direction,
      entryTime: now,
      entryPrice: position.entryPrice,
      stopLoss: position.stopLoss,
      takeProfit: position.takeProfit,
      size: position.size,
      result: "OPEN",
      signals: signal ? [signal] : [],
    };

    // Store in active positions
    const key = positionKey(position.symbol, position.direction);
    if (!activePositions.has(key)) {
      activePositions.set(key, []);
    }
    activePositions.get(key)!.push(position);

    trades.push(trade);
    console.log(
      `[TRADE] New ${position.direction} ${position.size} ${position.symbol} @ ${position.entryPrice}`
    );
  }

  // Process closed positions (exits)
  for (const position of closed) {
    const signal = correlateVisionSignal(streamId, channelId, position, false);
    const key = positionKey(position.symbol, position.direction);

    // Find matching open trade
    const channelTrades = tradeHistory.get(channelId) || [];
    const openTrade = channelTrades.find(
      (t) =>
        t.symbol === position.symbol &&
        t.direction === position.direction &&
        t.result === "OPEN"
    );

    if (openTrade) {
      // Close the trade
      openTrade.exitTime = now;
      openTrade.exitPrice = position.currentPrice || position.entryPrice;
      openTrade.duration = Math.round(
        (now.getTime() - openTrade.entryTime.getTime()) / 1000
      );
      openTrade.pnl = position.realizedPnl || calculatePnl(openTrade);

      if (openTrade.pnl !== undefined) {
        openTrade.result =
          openTrade.pnl > 0 ? "WIN" : openTrade.pnl < 0 ? "LOSS" : "BREAKEVEN";
      }

      if (signal) {
        openTrade.signals.push(signal);
      }

      trades.push(openTrade);
      console.log(
        `[TRADE] Closed ${position.direction} ${position.symbol} | P&L: $${openTrade.pnl?.toFixed(2)}`
      );
    }

    // Remove from active positions
    activePositions.delete(key);
  }

  // Process modified positions
  for (const { previous, current } of modified) {
    const signal = correlateVisionSignal(streamId, channelId, current, false);

    console.log(
      `[TRADE] Modified ${current.symbol}: Size ${previous.size} → ${current.size}`
    );

    // If size changed, might be partial close
    if (previous.size !== current.size) {
      const key = positionKey(current.symbol, current.direction);
      const positions = activePositions.get(key) || [];
      const idx = positions.findIndex((p) => p.symbol === current.symbol);
      if (idx >= 0) {
        positions[idx] = current;
      }
    }
  }

  return trades;
}

/**
 * Calculate P&L for a trade
 */
function calculatePnl(trade: TradeRecord): number {
  if (!trade.exitPrice) return 0;

  const priceDiff =
    trade.direction === "LONG"
      ? trade.exitPrice - trade.entryPrice
      : trade.entryPrice - trade.exitPrice;

  // Assuming ES futures with $12.50 per tick (0.25 point)
  const tickValue = 12.5;
  const tickSize = 0.25;
  const ticks = priceDiff / tickSize;

  return ticks * tickValue * trade.size;
}

/**
 * Get all trades for a channel
 */
export function getChannelTrades(channelId: string): TradeRecord[] {
  return tradeHistory.get(channelId) || [];
}

/**
 * Get trade statistics for a channel
 */
export function getChannelStats(channelId: string): {
  totalTrades: number;
  wins: number;
  losses: number;
  breakeven: number;
  winRate: number;
  totalPnl: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  largestWin: number;
  largestLoss: number;
} {
  const trades = tradeHistory.get(channelId) || [];
  const closedTrades = trades.filter((t) => t.result !== "OPEN");

  const wins = closedTrades.filter((t) => t.result === "WIN");
  const losses = closedTrades.filter((t) => t.result === "LOSS");
  const breakeven = closedTrades.filter((t) => t.result === "BREAKEVEN");

  const totalWins = wins.reduce((sum, t) => sum + (t.pnl || 0), 0);
  const totalLosses = Math.abs(
    losses.reduce((sum, t) => sum + (t.pnl || 0), 0)
  );

  return {
    totalTrades: closedTrades.length,
    wins: wins.length,
    losses: losses.length,
    breakeven: breakeven.length,
    winRate: closedTrades.length > 0 ? wins.length / closedTrades.length : 0,
    totalPnl: closedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0),
    avgWin: wins.length > 0 ? totalWins / wins.length : 0,
    avgLoss: losses.length > 0 ? totalLosses / losses.length : 0,
    profitFactor: totalLosses > 0 ? totalWins / totalLosses : totalWins,
    largestWin: wins.length > 0 ? Math.max(...wins.map((t) => t.pnl || 0)) : 0,
    largestLoss:
      losses.length > 0 ? Math.min(...losses.map((t) => t.pnl || 0)) : 0,
  };
}

/**
 * Store a trade in history
 */
export function recordTrade(trade: TradeRecord): void {
  if (!tradeHistory.has(trade.channelId)) {
    tradeHistory.set(trade.channelId, []);
  }
  tradeHistory.get(trade.channelId)!.push(trade);
}

/**
 * Export trades to JSON
 */
export function exportTrades(channelId?: string): string {
  if (channelId) {
    return JSON.stringify(tradeHistory.get(channelId) || [], null, 2);
  }
  return JSON.stringify(Object.fromEntries(tradeHistory), null, 2);
}
