/**
 * Platform Vision Analyzer
 *
 * Uses GPT-4 Vision to analyze trading platform screenshots
 * and extract position data, P&L, and trade signals.
 */

import OpenAI from "openai";

export interface DetectedPosition {
  symbol: string;
  direction: "LONG" | "SHORT";
  size: number;
  entryPrice: number;
  currentPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  unrealizedPnl?: number;
  realizedPnl?: number;
}

export interface PlatformAnalysis {
  platform: "tradovate" | "ninjatrader" | "tradingview" | "thinkorswim" | "unknown";
  confidence: number;
  timestamp: Date;
  positions: DetectedPosition[];
  accountBalance?: number;
  dailyPnl?: number;
  rawText?: string;
  error?: string;
}

export interface AnalysisRequest {
  imageUrl?: string;
  imageBase64?: string;
  streamId: string;
  channelName: string;
  previousPositions?: DetectedPosition[];
}

const ANALYSIS_PROMPT = `You are a trading platform screen analyzer. Analyze this screenshot from a live trading stream and extract all visible trading data.

Look for:
1. **Trading Platform**: Identify if this is Tradovate, NinjaTrader, TradingView, ThinkorSwim, or another platform
2. **Open Positions**: Look for position panels showing:
   - Symbol (ES, NQ, CL, GC, etc.)
   - Direction (Long/Short, Buy/Sell, or color-coded green/red)
   - Position size (number of contracts)
   - Entry price
   - Current price
   - P&L (unrealized profit/loss)
3. **Account Info**: Balance, daily P&L, buying power
4. **Orders**: Pending orders, stop losses, take profits

Return a JSON object with this exact structure:
{
  "platform": "tradovate|ninjatrader|tradingview|thinkorswim|unknown",
  "confidence": 0.0-1.0,
  "positions": [
    {
      "symbol": "ES",
      "direction": "LONG|SHORT",
      "size": 1,
      "entryPrice": 5890.50,
      "currentPrice": 5892.00,
      "stopLoss": 5885.00,
      "takeProfit": 5900.00,
      "unrealizedPnl": 75.00
    }
  ],
  "accountBalance": 50000.00,
  "dailyPnl": 250.00,
  "notes": "Any relevant observations"
}

If you cannot detect any trading platform or positions, return:
{
  "platform": "unknown",
  "confidence": 0,
  "positions": [],
  "notes": "Description of what you see instead"
}

IMPORTANT: Only return valid JSON, no additional text.`;

/**
 * Analyze a trading platform screenshot using GPT-4 Vision
 */
export async function analyzePlatformScreen(
  request: AnalysisRequest
): Promise<PlatformAnalysis> {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  if (!process.env.OPENAI_API_KEY) {
    return {
      platform: "unknown",
      confidence: 0,
      timestamp: new Date(),
      positions: [],
      error: "OPENAI_API_KEY not configured",
    };
  }

  try {
    // Prepare image content
    let imageContent: OpenAI.Chat.Completions.ChatCompletionContentPartImage;

    if (request.imageBase64) {
      imageContent = {
        type: "image_url",
        image_url: {
          url: `data:image/jpeg;base64,${request.imageBase64}`,
          detail: "high",
        },
      };
    } else if (request.imageUrl) {
      imageContent = {
        type: "image_url",
        image_url: {
          url: request.imageUrl,
          detail: "high",
        },
      };
    } else {
      return {
        platform: "unknown",
        confidence: 0,
        timestamp: new Date(),
        positions: [],
        error: "No image provided",
      };
    }

    // Add context about previous positions for change detection
    let contextPrompt = ANALYSIS_PROMPT;
    if (request.previousPositions && request.previousPositions.length > 0) {
      contextPrompt += `\n\nPrevious positions detected:
${JSON.stringify(request.previousPositions, null, 2)}

Please note any changes from the previous state (new positions, closed positions, P&L changes).`;
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // or "gpt-4-vision-preview"
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: contextPrompt },
            imageContent,
          ],
        },
      ],
      max_tokens: 1000,
      temperature: 0.1, // Low temperature for consistent extraction
    });

    const content = response.choices[0]?.message?.content;

    if (!content) {
      return {
        platform: "unknown",
        confidence: 0,
        timestamp: new Date(),
        positions: [],
        error: "No response from vision model",
      };
    }

    // Parse JSON response
    try {
      // Extract JSON from response (in case there's extra text)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        platform: parsed.platform || "unknown",
        confidence: parsed.confidence || 0,
        timestamp: new Date(),
        positions: parsed.positions || [],
        accountBalance: parsed.accountBalance,
        dailyPnl: parsed.dailyPnl,
        rawText: content,
      };
    } catch (parseError) {
      return {
        platform: "unknown",
        confidence: 0,
        timestamp: new Date(),
        positions: [],
        rawText: content,
        error: `Failed to parse response: ${parseError}`,
      };
    }
  } catch (error) {
    console.error("Vision analysis error:", error);
    return {
      platform: "unknown",
      confidence: 0,
      timestamp: new Date(),
      positions: [],
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Compare two position states to detect changes
 */
export function detectPositionChanges(
  previous: DetectedPosition[],
  current: DetectedPosition[]
): {
  opened: DetectedPosition[];
  closed: DetectedPosition[];
  modified: { previous: DetectedPosition; current: DetectedPosition }[];
} {
  const opened: DetectedPosition[] = [];
  const closed: DetectedPosition[] = [];
  const modified: { previous: DetectedPosition; current: DetectedPosition }[] = [];

  // Find new positions (in current but not in previous)
  for (const pos of current) {
    const prev = previous.find(
      (p) => p.symbol === pos.symbol && p.direction === pos.direction
    );
    if (!prev) {
      opened.push(pos);
    } else if (
      prev.size !== pos.size ||
      prev.entryPrice !== pos.entryPrice ||
      prev.stopLoss !== pos.stopLoss ||
      prev.takeProfit !== pos.takeProfit
    ) {
      modified.push({ previous: prev, current: pos });
    }
  }

  // Find closed positions (in previous but not in current)
  for (const pos of previous) {
    const curr = current.find(
      (p) => p.symbol === pos.symbol && p.direction === pos.direction
    );
    if (!curr) {
      closed.push(pos);
    }
  }

  return { opened, closed, modified };
}

/**
 * Calculate P&L for a closed position
 */
export function calculateClosedPnl(
  position: DetectedPosition,
  exitPrice: number,
  tickValue: number = 12.5 // Default ES tick value
): number {
  const priceDiff =
    position.direction === "LONG"
      ? exitPrice - position.entryPrice
      : position.entryPrice - exitPrice;

  // Convert price difference to ticks (assuming 0.25 tick size for ES)
  const ticks = priceDiff / 0.25;

  return ticks * tickValue * position.size;
}
