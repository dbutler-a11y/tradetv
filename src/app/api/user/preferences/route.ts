import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// For now, store preferences in user record
// In production, you might want a separate UserPreferences model

/**
 * GET /api/user/preferences
 * Get user preferences
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

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        subscriptionTier: true,
        tradovateLinked: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Default preferences (could be stored in a separate table)
    const preferences = {
      notifications: {
        onEntry: true,
        onExit: true,
        onProfit: false,
        onLoss: true,
        method: "push",
      },
      display: {
        theme: "dark",
        compactView: false,
        showPnl: true,
      },
    };

    return NextResponse.json({ user, preferences });
  } catch (error: any) {
    console.error("Get preferences error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get preferences" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/user/preferences
 * Update user preferences
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, name, image } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID required" },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (image !== undefined) updateData.image = image;

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        subscriptionTier: true,
      },
    });

    return NextResponse.json({ user });
  } catch (error: any) {
    console.error("Update preferences error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update preferences" },
      { status: 500 }
    );
  }
}
