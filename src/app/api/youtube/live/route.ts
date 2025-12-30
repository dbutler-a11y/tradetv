import { NextRequest, NextResponse } from "next/server";
import { youtube } from "@/lib/youtube/client";

/**
 * GET /api/youtube/live
 * Search for live trading streams
 *
 * Quota usage: 100 units per request (search.list)
 * Daily quota: 10,000 units (resets at midnight PT)
 */
export async function GET(request: NextRequest) {
  try {
    // Check if API is configured
    if (!youtube.isConfigured()) {
      return NextResponse.json(
        {
          streams: [],
          error: "YouTube API key not configured",
          status: "not_configured",
        },
        { status: 200 } // Return 200 so frontend can handle gracefully
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q") || "";
    const maxResults = parseInt(searchParams.get("limit") || "20");

    // If no query, search for trading streams
    if (!query) {
      const streams = await youtube.searchTradingStreams(maxResults);
      return NextResponse.json({
        streams,
        status: "ok",
        quotaUsed: 100,
      });
    }

    // Search with specific query
    const streams = await youtube.searchLiveStreams(query, maxResults);
    return NextResponse.json({
      streams,
      status: "ok",
      quotaUsed: 100,
    });
  } catch (error: any) {
    console.error("YouTube live search error:", error);

    // Check for quota exceeded
    if (error.message?.includes("quota")) {
      return NextResponse.json(
        {
          streams: [],
          error: "YouTube API quota exceeded. Quota resets at midnight Pacific Time.",
          status: "quota_exceeded",
        },
        { status: 200 } // Return 200 so frontend can show demo data
      );
    }

    return NextResponse.json(
      {
        streams: [],
        error: error.message || "Failed to search live streams",
        status: "error",
      },
      { status: 500 }
    );
  }
}
