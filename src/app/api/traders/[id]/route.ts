import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * GET /api/traders/[id]
 * Get a specific trader by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Trader ID required" },
        { status: 400 }
      );
    }

    const trader = await prisma.trader.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            _count: {
              select: { followers: true },
            },
          },
        },
        signals: {
          take: 20,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            action: true,
            symbol: true,
            price: true,
            quantity: true,
            status: true,
            pnl: true,
            createdAt: true,
            closedAt: true,
          },
        },
        streams: {
          take: 10,
          orderBy: { startedAt: "desc" },
          select: {
            id: true,
            title: true,
            category: true,
            thumbnailUrl: true,
            startedAt: true,
            endedAt: true,
            viewerCount: true,
          },
        },
      },
    });

    if (!trader) {
      return NextResponse.json(
        { error: "Trader not found" },
        { status: 404 }
      );
    }

    // Transform to include follower count
    const transformedTrader = {
      ...trader,
      followerCount: trader.user._count.followers,
      user: {
        id: trader.user.id,
        name: trader.user.name,
      },
    };

    return NextResponse.json({ trader: transformedTrader });
  } catch (error: any) {
    console.error("Get trader error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get trader" },
      { status: 500 }
    );
  }
}
