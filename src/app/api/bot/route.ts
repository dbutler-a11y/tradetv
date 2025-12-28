import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * GET /api/bot
 * Get user's bot configuration
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID required" },
        { status: 400 }
      );
    }

    const bot = await prisma.bot.findFirst({
      where: { userId },
      include: {
        traders: {
          include: {
            trader: {
              select: {
                id: true,
                displayName: true,
                avatarUrl: true,
                verificationTier: true,
                winRate: true,
                profitFactor: true,
                monthlyPnl: true,
              },
            },
          },
        },
      },
    });

    if (!bot) {
      return NextResponse.json({
        bot: null,
        message: "No bot configured",
      });
    }

    return NextResponse.json({ bot });
  } catch (error: any) {
    console.error("Get bot error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get bot configuration" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/bot
 * Create or update bot configuration
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      name,
      isActive,
      // Risk settings (matching schema)
      maxDailyLoss,
      maxPositionSize,
      maxDailyTrades,
      maxConcurrentTrades,
      allowedSymbols,
      tradingHoursStart,
      tradingHoursEnd,
      tradingTimezone,
      // Trade modifiers
      stopLossMode,
      stopLossValue,
      takeProfitMode,
      takeProfitValue,
      scaleMultiplier,
      // Filters
      minTraderWinRate,
      requireConfirmation,
    } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID required" },
        { status: 400 }
      );
    }

    // Check if bot exists
    const existingBot = await prisma.bot.findFirst({
      where: { userId },
    });

    let bot;

    if (existingBot) {
      // Update existing bot
      bot = await prisma.bot.update({
        where: { id: existingBot.id },
        data: {
          name: name ?? existingBot.name,
          isActive: isActive ?? existingBot.isActive,
          maxDailyLoss: maxDailyLoss ?? existingBot.maxDailyLoss,
          maxPositionSize: maxPositionSize ?? existingBot.maxPositionSize,
          maxDailyTrades: maxDailyTrades ?? existingBot.maxDailyTrades,
          maxConcurrentTrades: maxConcurrentTrades ?? existingBot.maxConcurrentTrades,
          allowedSymbols: allowedSymbols ?? existingBot.allowedSymbols,
          tradingHoursStart: tradingHoursStart ?? existingBot.tradingHoursStart,
          tradingHoursEnd: tradingHoursEnd ?? existingBot.tradingHoursEnd,
          tradingTimezone: tradingTimezone ?? existingBot.tradingTimezone,
          stopLossMode: stopLossMode ?? existingBot.stopLossMode,
          stopLossValue: stopLossValue ?? existingBot.stopLossValue,
          takeProfitMode: takeProfitMode ?? existingBot.takeProfitMode,
          takeProfitValue: takeProfitValue ?? existingBot.takeProfitValue,
          scaleMultiplier: scaleMultiplier ?? existingBot.scaleMultiplier,
          minTraderWinRate: minTraderWinRate ?? existingBot.minTraderWinRate,
          requireConfirmation: requireConfirmation ?? existingBot.requireConfirmation,
        },
      });
    } else {
      // Create new bot
      bot = await prisma.bot.create({
        data: {
          userId,
          name: name || "My Trading Bot",
          isActive: isActive ?? false,
          maxDailyLoss: maxDailyLoss ?? 500,
          maxPositionSize: maxPositionSize ?? 2,
          maxDailyTrades: maxDailyTrades ?? 10,
          maxConcurrentTrades: maxConcurrentTrades ?? 5,
          allowedSymbols: allowedSymbols ?? ["ES", "NQ", "YM"],
          tradingTimezone: tradingTimezone ?? "America/New_York",
          scaleMultiplier: scaleMultiplier ?? 1.0,
          requireConfirmation: requireConfirmation ?? false,
        },
      });
    }

    return NextResponse.json({ bot });
  } catch (error: any) {
    console.error("Save bot error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save bot configuration" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/bot
 * Toggle bot active status
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { botId, isActive } = body;

    if (!botId) {
      return NextResponse.json(
        { error: "Bot ID required" },
        { status: 400 }
      );
    }

    const bot = await prisma.bot.update({
      where: { id: botId },
      data: { isActive },
    });

    return NextResponse.json({ bot });
  } catch (error: any) {
    console.error("Toggle bot error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to toggle bot" },
      { status: 500 }
    );
  }
}
