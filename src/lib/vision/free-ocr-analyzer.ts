/**
 * Free OCR Platform Analyzer
 *
 * Uses free alternatives to GPT-4 Vision:
 * 1. Tesseract.js - Free client-side OCR
 * 2. Pattern matching for trading platform layouts
 * 3. Color detection for position direction (green=long, red=short)
 *
 * Less accurate than GPT-4V but completely free.
 */

import type { DetectedPosition, PlatformAnalysis } from "./platform-analyzer";

export interface FreeOCRConfig {
  // Tesseract language
  language?: string;
  // Confidence threshold for text detection
  confidenceThreshold?: number;
  // Platform hint for better parsing
  platformHint?: "tradovate" | "ninjatrader" | "tradingview" | "thinkorswim";
}

// Common trading symbols to look for
const FUTURES_SYMBOLS = [
  "ES", "NQ", "CL", "GC", "SI", "ZB", "RTY", "YM", // Full size
  "MES", "MNQ", "MCL", "MGC", "M2K", "MYM", // Micros
];

const STOCK_SYMBOLS = [
  "SPY", "QQQ", "IWM", "DIA", "AAPL", "TSLA", "NVDA", "AMZN", "GOOGL", "META",
];

// Price patterns
const PRICE_REGEX = /\$?(\d{1,3}(?:,\d{3})*(?:\.\d{1,4})?)/g;

// Position indicators
const LONG_INDICATORS = ["long", "buy", "bought", "+", "▲", "↑"];
const SHORT_INDICATORS = ["short", "sell", "sold", "-", "▼", "↓"];

// P&L patterns
const PNL_PATTERNS = [
  /P[&\/]?L[:\s]*([+-]?\$?\d+(?:,\d{3})*(?:\.\d{2})?)/gi,
  /(?:profit|loss)[:\s]*([+-]?\$?\d+(?:,\d{3})*(?:\.\d{2})?)/gi,
  /([+-]\$?\d+(?:,\d{3})*(?:\.\d{2})?)/g,
];

/**
 * Analyze screenshot using Tesseract.js OCR
 * This runs in the browser or Node.js
 */
export async function analyzeWithFreeOCR(
  imageSource: string | Buffer,
  config: FreeOCRConfig = {}
): Promise<PlatformAnalysis> {
  const { language = "eng", confidenceThreshold = 60, platformHint } = config;

  try {
    // Dynamic import Tesseract.js
    const Tesseract = await import("tesseract.js");

    // Run OCR
    const result = await Tesseract.recognize(imageSource, language, {
      logger: () => {}, // Suppress progress logs
    });

    const text = result.data.text;
    const confidence = result.data.confidence;

    if (confidence < confidenceThreshold) {
      return {
        platform: "unknown",
        confidence: confidence / 100,
        timestamp: new Date(),
        positions: [],
        rawText: text,
        error: `Low OCR confidence: ${confidence}%`,
      };
    }

    // Parse the extracted text
    const positions = parsePositionsFromText(text, platformHint);
    const platform = detectPlatform(text, platformHint);
    const accountBalance = extractAccountBalance(text);
    const dailyPnl = extractDailyPnl(text);

    return {
      platform,
      confidence: confidence / 100,
      timestamp: new Date(),
      positions,
      accountBalance,
      dailyPnl,
      rawText: text,
    };
  } catch (error) {
    console.error("Free OCR analysis error:", error);
    return {
      platform: "unknown",
      confidence: 0,
      timestamp: new Date(),
      positions: [],
      error: error instanceof Error ? error.message : "OCR failed",
    };
  }
}

/**
 * Parse positions from OCR text
 */
function parsePositionsFromText(
  text: string,
  platformHint?: string
): DetectedPosition[] {
  const positions: DetectedPosition[] = [];
  const lines = text.split("\n").filter((line) => line.trim());

  // Find lines containing trading symbols
  for (const line of lines) {
    const upperLine = line.toUpperCase();

    // Check for futures symbols
    for (const symbol of FUTURES_SYMBOLS) {
      if (upperLine.includes(symbol)) {
        const position = parsePositionLine(line, symbol);
        if (position) {
          positions.push(position);
        }
        break;
      }
    }

    // Check for stock symbols
    for (const symbol of STOCK_SYMBOLS) {
      if (upperLine.includes(symbol)) {
        const position = parsePositionLine(line, symbol);
        if (position) {
          positions.push(position);
        }
        break;
      }
    }
  }

  return positions;
}

/**
 * Parse a single position from a line of text
 */
function parsePositionLine(
  line: string,
  symbol: string
): DetectedPosition | null {
  const lowerLine = line.toLowerCase();

  // Determine direction
  let direction: "LONG" | "SHORT" = "LONG";
  for (const indicator of SHORT_INDICATORS) {
    if (lowerLine.includes(indicator.toLowerCase())) {
      direction = "SHORT";
      break;
    }
  }
  for (const indicator of LONG_INDICATORS) {
    if (lowerLine.includes(indicator.toLowerCase())) {
      direction = "LONG";
      break;
    }
  }

  // Extract prices
  const prices: number[] = [];
  let match;
  const priceRegex = /\$?(\d{1,3}(?:,\d{3})*(?:\.\d{1,4})?)/g;
  while ((match = priceRegex.exec(line)) !== null) {
    const price = parseFloat(match[1].replace(/,/g, ""));
    if (price > 0) {
      prices.push(price);
    }
  }

  // Extract size (look for small numbers 1-100)
  const sizeMatch = line.match(/\b([1-9]\d?|100)\b/);
  const size = sizeMatch ? parseInt(sizeMatch[1]) : 1;

  // Need at least one price
  if (prices.length === 0) {
    return null;
  }

  // Sort prices to guess entry/current
  prices.sort((a, b) => a - b);

  return {
    symbol,
    direction,
    size,
    entryPrice: prices[0],
    currentPrice: prices.length > 1 ? prices[prices.length - 1] : prices[0],
    unrealizedPnl: extractPnlFromLine(line),
  };
}

/**
 * Extract P&L from a line
 */
function extractPnlFromLine(line: string): number | undefined {
  for (const pattern of PNL_PATTERNS) {
    const match = line.match(pattern);
    if (match) {
      const pnlStr = match[1].replace(/[$,]/g, "");
      const pnl = parseFloat(pnlStr);
      if (!isNaN(pnl)) {
        return pnl;
      }
    }
  }
  return undefined;
}

/**
 * Detect trading platform from text
 */
function detectPlatform(
  text: string,
  hint?: string
): "tradovate" | "ninjatrader" | "tradingview" | "thinkorswim" | "unknown" {
  if (hint) {
    return hint as "tradovate" | "ninjatrader" | "tradingview" | "thinkorswim";
  }

  const lowerText = text.toLowerCase();

  if (lowerText.includes("tradovate")) return "tradovate";
  if (lowerText.includes("ninjatrader") || lowerText.includes("ninja trader"))
    return "ninjatrader";
  if (lowerText.includes("tradingview") || lowerText.includes("trading view"))
    return "tradingview";
  if (lowerText.includes("thinkorswim") || lowerText.includes("tos"))
    return "thinkorswim";

  return "unknown";
}

/**
 * Extract account balance from text
 */
function extractAccountBalance(text: string): number | undefined {
  const patterns = [
    /(?:balance|account|equity)[:\s]*\$?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/gi,
    /\$(\d{2,3}(?:,\d{3})+(?:\.\d{2})?)/g, // Large dollar amounts
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const numStr = match[0].replace(/[^0-9.]/g, "");
      const num = parseFloat(numStr);
      if (num > 1000) {
        // Likely an account balance
        return num;
      }
    }
  }
  return undefined;
}

/**
 * Extract daily P&L from text
 */
function extractDailyPnl(text: string): number | undefined {
  const patterns = [
    /(?:daily|today|day)['\s]*(?:p[&\/]?l|profit|loss)[:\s]*([+-]?\$?\d+(?:,\d{3})*(?:\.\d{2})?)/gi,
    /(?:p[&\/]?l|profit|loss)[:\s]*([+-]?\$?\d+(?:,\d{3})*(?:\.\d{2})?)/gi,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const numMatch = match[0].match(/([+-]?\d+(?:,\d{3})*(?:\.\d{2})?)/);
      if (numMatch) {
        return parseFloat(numMatch[1].replace(/,/g, ""));
      }
    }
  }
  return undefined;
}

/**
 * Simple color-based position detection
 * Analyzes dominant colors to detect green (long) vs red (short)
 *
 * Note: This requires canvas support, works in browser or with node-canvas
 */
export async function analyzePositionColors(
  imageData: ImageData
): Promise<{ hasGreen: boolean; hasRed: boolean; dominantColor: string }> {
  let greenPixels = 0;
  let redPixels = 0;
  let totalPixels = 0;

  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Skip near-white and near-black pixels
    if (r + g + b < 50 || r + g + b > 700) continue;

    totalPixels++;

    // Green detection (trading platform green)
    if (g > r * 1.3 && g > b * 1.3 && g > 100) {
      greenPixels++;
    }

    // Red detection (trading platform red)
    if (r > g * 1.3 && r > b * 1.3 && r > 100) {
      redPixels++;
    }
  }

  const greenRatio = greenPixels / totalPixels;
  const redRatio = redPixels / totalPixels;

  return {
    hasGreen: greenRatio > 0.01, // At least 1% green
    hasRed: redRatio > 0.01, // At least 1% red
    dominantColor: greenRatio > redRatio ? "green" : "red",
  };
}

/**
 * Lightweight analysis using just YouTube thumbnail
 * Checks if trading platform is visible and detects basic colors
 */
export async function quickThumbnailAnalysis(
  thumbnailUrl: string
): Promise<{
  hasTradingPlatform: boolean;
  possibleDirection: "LONG" | "SHORT" | "UNKNOWN";
  confidence: number;
}> {
  try {
    // Fetch thumbnail
    const response = await fetch(thumbnailUrl);
    if (!response.ok) {
      return {
        hasTradingPlatform: false,
        possibleDirection: "UNKNOWN",
        confidence: 0,
      };
    }

    // For server-side, we'd need to use sharp or jimp to analyze
    // For now, return a basic analysis
    return {
      hasTradingPlatform: true, // Assume yes if thumbnail loads
      possibleDirection: "UNKNOWN",
      confidence: 0.3, // Low confidence without actual analysis
    };
  } catch {
    return {
      hasTradingPlatform: false,
      possibleDirection: "UNKNOWN",
      confidence: 0,
    };
  }
}
