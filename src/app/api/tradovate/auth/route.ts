import { NextRequest, NextResponse } from "next/server";
import { TradovateClient } from "@/lib/tradovate/client";

/**
 * POST /api/tradovate/auth
 * Authenticate with Tradovate and store the session
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password, clientId, clientSecret, deviceId, environment } = body;

    if (!username || !password || !clientId) {
      return NextResponse.json(
        { error: "Missing required credentials" },
        { status: 400 }
      );
    }

    const client = new TradovateClient(environment || "demo");

    const authResult = await client.authenticate({
      username,
      password,
      clientId,
      clientSecret: clientSecret || "",
      deviceId,
    });

    // In a real app, you'd store the tokens securely (e.g., in a session or encrypted in DB)
    // For now, return success with user info
    return NextResponse.json({
      success: true,
      userId: authResult.userId,
      name: authResult.name,
      expiresAt: authResult.expirationTime,
      environment,
    });
  } catch (error: any) {
    console.error("Tradovate auth error:", error);
    return NextResponse.json(
      { error: error.message || "Authentication failed" },
      { status: 401 }
    );
  }
}
