import { NextRequest, NextResponse } from "next/server";
import { youtube } from "@/lib/youtube/client";

/**
 * GET /api/youtube/stream/[id]
 * Get live stream details by video ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: videoId } = await params;

    if (!videoId) {
      return NextResponse.json(
        { error: "Video ID is required" },
        { status: 400 }
      );
    }

    const stream = await youtube.getLiveStreamDetails(videoId);

    if (!stream) {
      return NextResponse.json(
        { error: "Stream not found or not currently live" },
        { status: 404 }
      );
    }

    return NextResponse.json({ stream });
  } catch (error: any) {
    console.error("YouTube stream fetch error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch stream" },
      { status: 500 }
    );
  }
}
