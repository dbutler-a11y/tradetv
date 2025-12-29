import { NextRequest, NextResponse } from "next/server";
import {
  analyzePlatformScreen,
  detectPositionChanges,
  type DetectedPosition,
} from "@/lib/vision/platform-analyzer";
import { analyzeWithFreeOCR } from "@/lib/vision/free-ocr-analyzer";
import { getLiveThumbnailUrl } from "@/lib/stream/capture-service";
import {
  processPositionChanges,
  recordTrade,
  getChannelStats,
} from "@/lib/signals/signal-correlator";
import { MONITORED_CHANNELS } from "@/lib/youtube/channel-monitor";

/**
 * In-memory cache for previous positions per stream
 * In production, this would be Redis or a database
 */
const positionCache = new Map<
  string,
  {
    positions: DetectedPosition[];
    lastAnalysis: Date;
    analysisCount: number;
  }
>();

/**
 * POST /api/monitor/analyze
 *
 * Analyze a stream frame for trading positions
 *
 * COST OPTIONS:
 * - useFreeOCR: true (default) - Uses Tesseract.js, completely free but less accurate
 * - useFreeOCR: false - Uses GPT-4 Vision, more accurate but $0.01-0.03 per image
 *
 * Body:
 * - streamId: YouTube stream ID
 * - channelId: Internal channel ID
 * - imageUrl?: URL to image (optional, will use YouTube thumbnail if not provided)
 * - imageBase64?: Base64 encoded image (optional)
 * - useFreeOCR?: boolean (default: true)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      streamId,
      channelId,
      imageUrl,
      imageBase64,
      useFreeOCR = true, // Default to free OCR
    } = body;

    if (!streamId || !channelId) {
      return NextResponse.json(
        { error: "streamId and channelId are required" },
        { status: 400 }
      );
    }

    // Get channel info - allow "manual" for ad-hoc analysis
    let channel = MONITORED_CHANNELS.find((c) => c.id === channelId);
    if (!channel && channelId === "manual") {
      // Create a temporary channel for manual analysis
      channel = {
        id: "manual",
        name: "Manual Analysis",
        youtubeHandle: "@manual",
        platform: "unknown" as const,
        isLive: true,
      };
    }
    if (!channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    // Get cached positions for change detection
    const cached = positionCache.get(streamId);
    const previousPositions = cached?.positions || [];

    // Determine image source
    let analysisImageUrl = imageUrl;
    const analysisImageBase64 = imageBase64;

    if (!analysisImageUrl && !analysisImageBase64) {
      // Use YouTube live thumbnail as fallback
      analysisImageUrl = getLiveThumbnailUrl(streamId);
    }

    // Choose analysis method based on cost preference
    let analysis;
    let method: "free-ocr" | "gpt4-vision";

    if (useFreeOCR) {
      // FREE: Use Tesseract.js OCR
      method = "free-ocr";
      const imageSource = analysisImageBase64
        ? Buffer.from(analysisImageBase64, "base64")
        : analysisImageUrl;

      if (imageSource) {
        analysis = await analyzeWithFreeOCR(imageSource, {
          platformHint: channel.platform as
            | "tradovate"
            | "ninjatrader"
            | "tradingview"
            | "thinkorswim"
            | undefined,
        });
      } else {
        analysis = {
          platform: "unknown" as const,
          confidence: 0,
          timestamp: new Date(),
          positions: [],
          error: "No image source provided",
        };
      }
    } else {
      // PAID: Use GPT-4 Vision (more accurate)
      method = "gpt4-vision";
      analysis = await analyzePlatformScreen({
        imageUrl: analysisImageUrl,
        imageBase64: analysisImageBase64,
        streamId,
        channelName: channel.name,
        previousPositions,
      });
    }

    // Detect position changes
    const changes = detectPositionChanges(
      previousPositions,
      analysis.positions
    );

    // Process changes and create trade records
    const trades = processPositionChanges(
      streamId,
      channelId,
      channel.name,
      changes.opened,
      changes.closed,
      changes.modified
    );

    // Record any new trades
    trades.forEach(recordTrade);

    // Update cache
    positionCache.set(streamId, {
      positions: analysis.positions,
      lastAnalysis: new Date(),
      analysisCount: (cached?.analysisCount || 0) + 1,
    });

    // Get updated stats
    const stats = getChannelStats(channelId);

    return NextResponse.json({
      success: true,
      method, // Show which method was used
      cost: method === "free-ocr" ? "$0.00" : "~$0.01-0.03",
      analysis: {
        platform: analysis.platform,
        confidence: analysis.confidence,
        timestamp: analysis.timestamp,
        positionCount: analysis.positions.length,
        accountBalance: analysis.accountBalance,
        dailyPnl: analysis.dailyPnl,
      },
      positions: analysis.positions,
      changes: {
        opened: changes.opened.length,
        closed: changes.closed.length,
        modified: changes.modified.length,
        details: {
          opened: changes.opened,
          closed: changes.closed,
          modified: changes.modified.map((m) => ({
            symbol: m.current.symbol,
            previousSize: m.previous.size,
            currentSize: m.current.size,
          })),
        },
      },
      trades: trades.map((t) => ({
        id: t.id,
        symbol: t.symbol,
        direction: t.direction,
        entryPrice: t.entryPrice,
        exitPrice: t.exitPrice,
        size: t.size,
        pnl: t.pnl,
        result: t.result,
      })),
      stats,
      error: analysis.error,
    });
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      { error: "Failed to analyze frame" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/monitor/analyze
 *
 * Get current positions and stats for a stream
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const streamId = searchParams.get("streamId");
  const channelId = searchParams.get("channelId");

  if (streamId) {
    const cached = positionCache.get(streamId);
    return NextResponse.json({
      streamId,
      positions: cached?.positions || [],
      lastAnalysis: cached?.lastAnalysis,
      analysisCount: cached?.analysisCount || 0,
    });
  }

  if (channelId) {
    const stats = getChannelStats(channelId);
    return NextResponse.json({
      channelId,
      stats,
    });
  }

  // Return all cached streams
  const streams: Record<
    string,
    { positionCount: number; lastAnalysis: Date | null }
  > = {};
  positionCache.forEach((value, key) => {
    streams[key] = {
      positionCount: value.positions.length,
      lastAnalysis: value.lastAnalysis,
    };
  });

  return NextResponse.json({ streams });
}
