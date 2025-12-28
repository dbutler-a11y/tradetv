import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * GET /api/traders
 * Get list of traders with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");
    const search = searchParams.get("search") || "";
    const tier = searchParams.get("tier") || "";
    const isLive = searchParams.get("isLive");
    const sortBy = searchParams.get("sortBy") || "monthlyPnl";

    // Build filter conditions
    const where: any = {};

    if (search) {
      where.displayName = {
        contains: search,
        mode: "insensitive",
      };
    }

    if (tier) {
      where.verificationTier = tier;
    }

    if (isLive === "true") {
      where.isActive = true;
    }

    // Build sort order
    let orderBy: any = { monthlyPnl: "desc" };
    switch (sortBy) {
      case "winRate":
        orderBy = { winRate: "desc" };
        break;
      case "profitFactor":
        orderBy = { profitFactor: "desc" };
        break;
      case "followers":
        orderBy = { user: { followers: { _count: "desc" } } };
        break;
      default:
        orderBy = { monthlyPnl: "desc" };
    }

    const [traders, total] = await Promise.all([
      prisma.trader.findMany({
        where,
        select: {
          id: true,
          userId: true,
          displayName: true,
          bio: true,
          avatarUrl: true,
          streamUrl: true,
          verificationTier: true,
          winRate: true,
          profitFactor: true,
          avgTrade: true,
          monthlyPnl: true,
          maxDrawdown: true,
          totalTrades: true,
          instruments: true,
          style: true,
          isActive: true,
          user: {
            select: {
              _count: {
                select: { followers: true },
              },
            },
          },
        },
        orderBy,
        take: limit,
        skip: offset,
      }),
      prisma.trader.count({ where }),
    ]);

    // Transform to include follower count
    const transformedTraders = traders.map((trader) => ({
      ...trader,
      followerCount: trader.user._count.followers,
      user: undefined,
    }));

    return NextResponse.json({
      traders: transformedTraders,
      total,
      limit,
      offset,
    });
  } catch (error: any) {
    console.error("Get traders error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get traders" },
      { status: 500 }
    );
  }
}
