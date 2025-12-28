import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * GET /api/bot/traders
 * Get all traders configured in user's bot
 */
export async function GET(request: NextRequest) {
  try {
    const botId = request.nextUrl.searchParams.get("botId");

    if (!botId) {
      return NextResponse.json(
        { error: "Bot ID required" },
        { status: 400 }
      );
    }

    const traders = await prisma.botTrader.findMany({
      where: { botId },
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
            instruments: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ traders });
  } catch (error: any) {
    console.error("Get bot traders error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get bot traders" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/bot/traders
 * Add a trader to the bot
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      botId,
      traderId,
      weight,
      delay,
      copyLongs,
      copyShorts,
      copyScales,
      isActive,
    } = body;

    if (!botId || !traderId) {
      return NextResponse.json(
        { error: "Bot ID and Trader ID required" },
        { status: 400 }
      );
    }

    // Check if trader already exists in bot
    const existing = await prisma.botTrader.findUnique({
      where: {
        botId_traderId: {
          botId,
          traderId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Trader already in bot" },
        { status: 400 }
      );
    }

    const botTrader = await prisma.botTrader.create({
      data: {
        botId,
        traderId,
        weight: weight ?? 100,
        delay: delay ?? 0,
        copyLongs: copyLongs ?? true,
        copyShorts: copyShorts ?? true,
        copyScales: copyScales ?? true,
        isActive: isActive ?? true,
      },
      include: {
        trader: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
            verificationTier: true,
          },
        },
      },
    });

    return NextResponse.json({ botTrader });
  } catch (error: any) {
    console.error("Add bot trader error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to add trader to bot" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/bot/traders
 * Update a trader's settings in the bot
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id, // BotTrader ID
      weight,
      delay,
      copyLongs,
      copyShorts,
      copyScales,
      isActive,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: "BotTrader ID required" },
        { status: 400 }
      );
    }

    const botTrader = await prisma.botTrader.update({
      where: { id },
      data: {
        weight,
        delay,
        copyLongs,
        copyShorts,
        copyScales,
        isActive,
      },
      include: {
        trader: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
            verificationTier: true,
          },
        },
      },
    });

    return NextResponse.json({ botTrader });
  } catch (error: any) {
    console.error("Update bot trader error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update trader settings" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/bot/traders
 * Remove a trader from the bot
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: "BotTrader ID required" },
        { status: 400 }
      );
    }

    await prisma.botTrader.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Remove bot trader error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to remove trader from bot" },
      { status: 500 }
    );
  }
}
