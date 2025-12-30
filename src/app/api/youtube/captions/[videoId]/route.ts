import { NextRequest, NextResponse } from "next/server";
import {
  extractYouTubeCaptions,
  analyzeChatForSignals,
  type ChatMessage,
} from "@/lib/audio/free-transcription";
import { analyzeTranscriptionForSignals } from "@/lib/audio/transcription-service";

/**
 * GET /api/youtube/captions/[videoId]
 *
 * Extracts YouTube auto-captions and analyzes for trade signals
 * This is FREE - no API quota used
 *
 * Query params:
 * - analyze: boolean (default: true) - Whether to analyze for trade signals
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const { videoId } = await params;
    const { searchParams } = new URL(request.url);
    const shouldAnalyze = searchParams.get("analyze") !== "false";

    if (!videoId || videoId.length !== 11) {
      return NextResponse.json(
        { error: "Invalid video ID" },
        { status: 400 }
      );
    }

    console.log(`[Captions] Extracting captions for video: ${videoId}`);

    // Extract captions (FREE)
    const segments = await extractYouTubeCaptions(videoId);

    if (segments.length === 0) {
      return NextResponse.json({
        videoId,
        segments: [],
        signals: [],
        fullText: "",
        message: "No captions available for this video. Captions may be disabled or the video is too new.",
      });
    }

    // Combine segments into full text
    const fullText = segments.map((s) => s.text).join(" ");

    // Analyze for trade signals if requested
    let signals: ReturnType<typeof analyzeTranscriptionForSignals> = [];
    if (shouldAnalyze) {
      signals = analyzeTranscriptionForSignals(segments);
      console.log(`[Captions] Found ${signals.length} trade signals`);
    }

    return NextResponse.json({
      videoId,
      segments,
      signals,
      fullText,
      segmentCount: segments.length,
      signalCount: signals.length,
    });
  } catch (error) {
    console.error("Caption extraction error:", error);
    return NextResponse.json(
      { error: "Failed to extract captions" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/youtube/captions/[videoId]
 *
 * Analyze provided chat messages for trade signals
 * Useful for real-time chat analysis
 *
 * Body:
 * - messages: ChatMessage[] - Array of chat messages to analyze
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const { videoId } = await params;
    const body = await request.json();
    const { messages } = body as { messages: ChatMessage[] };

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "messages array is required" },
        { status: 400 }
      );
    }

    // Convert string timestamps to Date objects
    const parsedMessages: ChatMessage[] = messages.map((m) => ({
      ...m,
      timestamp: new Date(m.timestamp),
    }));

    // Analyze chat for trade signals
    const signals = analyzeChatForSignals(parsedMessages);

    return NextResponse.json({
      videoId,
      messagesAnalyzed: messages.length,
      signals,
      signalCount: signals.length,
    });
  } catch (error) {
    console.error("Chat analysis error:", error);
    return NextResponse.json(
      { error: "Failed to analyze chat" },
      { status: 500 }
    );
  }
}
