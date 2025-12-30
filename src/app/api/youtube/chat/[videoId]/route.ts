import { NextRequest, NextResponse } from "next/server";
import {
  getCachedLiveChatId,
  fetchLiveChatMessages,
} from "@/lib/youtube/live-chat";

/**
 * GET /api/youtube/chat/[videoId]
 *
 * Fetch live chat messages for a YouTube video
 * Quota: 1 unit (first call to get liveChatId) + 5 units (messages)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const { videoId } = await params;
    const pageToken = request.nextUrl.searchParams.get("pageToken") || undefined;

    // Get liveChatId (cached)
    const liveChatId = await getCachedLiveChatId(videoId);

    if (!liveChatId) {
      return NextResponse.json({
        messages: [],
        error: "No active live chat for this video",
        isLive: false,
      });
    }

    // Fetch messages
    const result = await fetchLiveChatMessages(liveChatId, pageToken);

    return NextResponse.json({
      ...result,
      isLive: !result.error,
      liveChatId,
    });
  } catch (error: any) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      {
        messages: [],
        error: error.message || "Failed to fetch chat",
        isLive: false,
      },
      { status: 500 }
    );
  }
}
