import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * GET /api/trades
 * Get trades for a user's bot
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const botId = searchParams.get("botId");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");
    const status = searchParams.get("status"); // PENDING, SUBMITTED, FILLED, PARTIAL, CLOSED

    if (!botId) {
      return NextResponse.json(
        { error: "Bot ID required" },
        { status: 400 }
      );
    }

    const where: any = { botId };
    if (status) {
      where.status = status;
    }

    const [trades, total] = await Promise.all([
      prisma.trade.findMany({
        where,
        include: {
          signal: {
            select: {
              id: true,
              action: true,
              symbol: true,
              trader: {
                select: {
                  id: true,
                  displayName: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
        orderBy: { enteredAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.trade.count({ where }),
    ]);

    return NextResponse.json({
      trades,
      total,
      limit,
      offset,
    });
  } catch (error: any) {
    console.error("Get trades error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get trades" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/trades
 * Record a new trade (called by signal executor)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      botId,
      signalId,
      symbol,
      action,
      quantity,
      entryPrice,
      stopLoss,
      takeProfit,
      brokerOrderId,
    } = body;

    if (!botId || !symbol || !action || !quantity || !entryPrice) {
      return NextResponse.json(
        { error: "Missing required trade fields" },
        { status: 400 }
      );
    }

    const trade = await prisma.trade.create({
      data: {
        botId,
        signalId,
        symbol,
        direction: action === "Buy" ? "LONG" : "SHORT",
        quantity,
        entryPrice,
        brokerOrderId,
        status: "FILLED",
        enteredAt: new Date(),
      },
    });

    // Update bot statistics
    await prisma.bot.update({
      where: { id: botId },
      data: {
        totalTrades: { increment: 1 },
      },
    });

    return NextResponse.json({ trade });
  } catch (error: any) {
    console.error("Create trade error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create trade" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/trades
 * Update a trade (close it, update P&L)
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, exitPrice, status, pnl, notes } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Trade ID required" },
        { status: 400 }
      );
    }

    const existingTrade = await prisma.trade.findUnique({
      where: { id },
      include: { bot: true },
    });

    if (!existingTrade) {
      return NextResponse.json(
        { error: "Trade not found" },
        { status: 404 }
      );
    }

    const updateData: any = {};

    if (exitPrice !== undefined) updateData.exitPrice = exitPrice;
    if (status !== undefined) updateData.status = status;
    if (pnl !== undefined) updateData.pnl = pnl;
    if (notes !== undefined) updateData.notes = notes;

    // If closing the trade
    if (status === "CLOSED" && !existingTrade.exitedAt) {
      updateData.exitedAt = new Date();

      // Update bot statistics
      const botUpdate: any = {
        totalPnl: { increment: pnl || 0 },
      };

      if (pnl !== undefined) {
        if (pnl >= 0) {
          botUpdate.winningTrades = { increment: 1 };
        } else {
          botUpdate.losingTrades = { increment: 1 };
        }
      }

      await prisma.bot.update({
        where: { id: existingTrade.botId },
        data: botUpdate,
      });
    }

    const trade = await prisma.trade.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ trade });
  } catch (error: any) {
    console.error("Update trade error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update trade" },
      { status: 500 }
    );
  }
}
