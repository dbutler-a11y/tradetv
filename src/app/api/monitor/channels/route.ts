import { NextRequest, NextResponse } from "next/server";
import {
  MONITORED_CHANNELS,
  pollAllChannels,
  resolveChannelId,
  type MonitoredChannel,
} from "@/lib/youtube/channel-monitor";

/**
 * GET /api/monitor/channels
 * Get all monitored channels and their current status
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const checkLive = searchParams.get("checkLive") === "true";

  if (checkLive) {
    // Poll all channels for live status
    const { liveStreams, errors } = await pollAllChannels();

    return NextResponse.json({
      channels: MONITORED_CHANNELS,
      liveStreams,
      errors,
      checkedAt: new Date().toISOString(),
    });
  }

  // Just return cached channel data
  return NextResponse.json({
    channels: MONITORED_CHANNELS,
    checkedAt: new Date().toISOString(),
  });
}

/**
 * POST /api/monitor/channels
 * Add a new channel to monitor
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { youtubeHandle, name, platform = "unknown" } = body;

    if (!youtubeHandle) {
      return NextResponse.json(
        { error: "youtubeHandle is required" },
        { status: 400 }
      );
    }

    // Check if already monitoring
    const existing = MONITORED_CHANNELS.find(
      (c) => c.youtubeHandle.toLowerCase() === youtubeHandle.toLowerCase()
    );

    if (existing) {
      return NextResponse.json(
        { error: "Channel already being monitored", channel: existing },
        { status: 409 }
      );
    }

    // Resolve channel ID
    const channelId = await resolveChannelId(youtubeHandle);

    const newChannel: MonitoredChannel = {
      id: youtubeHandle.replace("@", "").toLowerCase(),
      name: name || youtubeHandle.replace("@", ""),
      youtubeHandle,
      youtubeChannelId: channelId || undefined,
      platform,
      isLive: false,
    };

    // In production, save to database
    MONITORED_CHANNELS.push(newChannel);

    return NextResponse.json({
      message: "Channel added to monitoring",
      channel: newChannel,
    });
  } catch (error) {
    console.error("Error adding channel:", error);
    return NextResponse.json(
      { error: "Failed to add channel" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/monitor/channels
 * Remove a channel from monitoring
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const channelId = searchParams.get("id");

    if (!channelId) {
      return NextResponse.json(
        { error: "Channel ID is required" },
        { status: 400 }
      );
    }

    const index = MONITORED_CHANNELS.findIndex((c) => c.id === channelId);

    if (index === -1) {
      return NextResponse.json(
        { error: "Channel not found" },
        { status: 404 }
      );
    }

    const removed = MONITORED_CHANNELS.splice(index, 1)[0];

    return NextResponse.json({
      message: "Channel removed from monitoring",
      channel: removed,
    });
  } catch (error) {
    console.error("Error removing channel:", error);
    return NextResponse.json(
      { error: "Failed to remove channel" },
      { status: 500 }
    );
  }
}
