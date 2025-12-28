import { NextRequest, NextResponse } from "next/server";
import { youtube } from "@/lib/youtube/client";

/**
 * GET /api/youtube/channel/[id]
 * Get channel details by ID or handle
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: identifier } = await params;

    if (!identifier) {
      return NextResponse.json(
        { error: "Channel ID or handle is required" },
        { status: 400 }
      );
    }

    let channel;

    // Check if it's a handle (@username)
    if (identifier.startsWith("@")) {
      channel = await youtube.getChannelByHandle(identifier);
    } else {
      channel = await youtube.getChannel(identifier);
    }

    if (!channel) {
      return NextResponse.json(
        { error: "Channel not found" },
        { status: 404 }
      );
    }

    // Also check if channel is currently live
    const liveStream = await youtube.getChannelLiveStream(channel.id);

    return NextResponse.json({
      channel,
      isLive: !!liveStream,
      liveStream,
    });
  } catch (error: any) {
    console.error("YouTube channel fetch error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch channel" },
      { status: 500 }
    );
  }
}
