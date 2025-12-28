import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * GET /api/follow
 * Get list of traders the user is following
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

    const following = await prisma.follow.findMany({
      where: { followerId: userId },
      include: {
        followed: {
          select: {
            id: true,
            name: true,
            image: true,
            trader: {
              select: {
                id: true,
                displayName: true,
                avatarUrl: true,
                verificationTier: true,
                winRate: true,
                profitFactor: true,
                monthlyPnl: true,
                isActive: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ following });
  } catch (error: any) {
    console.error("Get following error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get following list" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/follow
 * Follow a user/trader
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { followerId, followedId } = body;

    if (!followerId || !followedId) {
      return NextResponse.json(
        { error: "Both follower and followed IDs required" },
        { status: 400 }
      );
    }

    if (followerId === followedId) {
      return NextResponse.json(
        { error: "Cannot follow yourself" },
        { status: 400 }
      );
    }

    // Check if already following
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followedId: {
          followerId,
          followedId,
        },
      },
    });

    if (existingFollow) {
      return NextResponse.json(
        { error: "Already following this user" },
        { status: 400 }
      );
    }

    const follow = await prisma.follow.create({
      data: {
        followerId,
        followedId,
      },
      include: {
        followed: {
          select: {
            id: true,
            name: true,
            trader: {
              select: {
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ follow });
  } catch (error: any) {
    console.error("Follow error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to follow user" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/follow
 * Unfollow a user/trader
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { followerId, followedId } = body;

    if (!followerId || !followedId) {
      return NextResponse.json(
        { error: "Both follower and followed IDs required" },
        { status: 400 }
      );
    }

    await prisma.follow.delete({
      where: {
        followerId_followedId: {
          followerId,
          followedId,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Unfollow error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to unfollow user" },
      { status: 500 }
    );
  }
}
