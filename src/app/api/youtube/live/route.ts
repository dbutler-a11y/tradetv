import { NextRequest, NextResponse } from "next/server";
import { youtube } from "@/lib/youtube/client";

/**
 * GET /api/youtube/live
 * Search for live trading streams
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q") || "";
    const maxResults = parseInt(searchParams.get("limit") || "20");

    // If no query, search for trading streams
    if (!query) {
      const streams = await youtube.searchTradingStreams(maxResults);
      return NextResponse.json({ streams });
    }

    // Search with specific query
    const streams = await youtube.searchLiveStreams(query, maxResults);
    return NextResponse.json({ streams });
  } catch (error: any) {
    console.error("YouTube live search error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to search live streams" },
      { status: 500 }
    );
  }
}
