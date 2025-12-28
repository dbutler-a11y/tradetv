import { NextRequest, NextResponse } from "next/server";
import { TradovateClient } from "@/lib/tradovate/client";

/**
 * GET /api/tradovate/accounts
 * Get all accounts for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    // In a real app, get credentials from session/database
    const environment = request.nextUrl.searchParams.get("environment") || "demo";

    // For demo purposes, this would need proper authentication handling
    // You'd typically retrieve stored credentials from the user's session

    return NextResponse.json({
      error: "Please connect your Tradovate account first",
      accounts: [],
    });
  } catch (error: any) {
    console.error("Tradovate accounts error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch accounts" },
      { status: 500 }
    );
  }
}
