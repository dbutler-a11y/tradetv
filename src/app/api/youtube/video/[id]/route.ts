import { NextRequest, NextResponse } from "next/server";
import { youtube } from "@/lib/youtube/client";

/**
 * GET /api/youtube/video/[id]
 * Get video details by ID
 *
 * Returns flat object with video info for watch page:
 * - title, channelTitle, channelId, isLive, viewerCount, etc.
 *
 * Quota: 1 unit (videos.list)
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

    const video = await youtube.getVideo(videoId);

    if (!video) {
      return NextResponse.json(
        { error: "Video not found" },
        { status: 404 }
      );
    }

    // Return flat object for watch page consumption
    return NextResponse.json({
      videoId: video.id,
      title: video.title,
      description: video.description,
      channelId: video.channelId,
      channelTitle: video.channelTitle,
      thumbnailUrl: video.thumbnailUrl,
      publishedAt: video.publishedAt,
      isLive: video.liveBroadcastContent === "live",
      liveBroadcastContent: video.liveBroadcastContent,
      viewerCount: video.viewCount || 0,
      likeCount: video.likeCount || 0,
    });
  } catch (error: any) {
    console.error("YouTube video fetch error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch video" },
      { status: 500 }
    );
  }
}
