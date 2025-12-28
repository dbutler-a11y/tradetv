/**
 * Free Transcription Service
 *
 * Uses free alternatives to paid transcription APIs:
 * 1. Web Speech API (browser-based, completely free)
 * 2. Vosk (offline, open source)
 * 3. Mozilla DeepSpeech (offline, open source)
 *
 * For server-side, we'll use pattern-based detection from chat/comments
 * since running Whisper locally requires GPU resources.
 */

import type { DetectedSignal, TranscriptionSegment } from "./transcription-service";

/**
 * Free transcription alternatives
 */
export type FreeTranscriptionMethod =
  | "web-speech-api" // Browser only, real-time
  | "youtube-captions" // Extract from YouTube auto-captions
  | "chat-analysis"; // Analyze YouTube live chat for signals

/**
 * YouTube Auto-Captions Extractor
 *
 * YouTube provides free auto-generated captions for live streams.
 * We can extract these to get trader speech without paying for transcription.
 */
export async function extractYouTubeCaptions(
  videoId: string
): Promise<TranscriptionSegment[]> {
  try {
    // YouTube's timedtext API (may require API key for some videos)
    const captionUrl = `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en&fmt=json3`;

    const response = await fetch(captionUrl);
    if (!response.ok) {
      // Try alternative endpoint
      const altUrl = `https://video.google.com/timedtext?v=${videoId}&lang=en`;
      const altResponse = await fetch(altUrl);
      if (!altResponse.ok) {
        return [];
      }
      // Parse XML format
      const xml = await altResponse.text();
      return parseCaptionXml(xml);
    }

    const data = await response.json();
    return parseCaptionJson(data);
  } catch (error) {
    console.error("Failed to extract YouTube captions:", error);
    return [];
  }
}

/**
 * Parse YouTube caption JSON format
 */
function parseCaptionJson(data: {
  events?: Array<{
    tStartMs?: number;
    dDurationMs?: number;
    segs?: Array<{ utf8?: string }>;
  }>;
}): TranscriptionSegment[] {
  if (!data.events) return [];

  return data.events
    .filter((event) => event.segs)
    .map((event) => ({
      text: event.segs?.map((seg) => seg.utf8 || "").join("") || "",
      start: (event.tStartMs || 0) / 1000,
      end: ((event.tStartMs || 0) + (event.dDurationMs || 0)) / 1000,
      confidence: 0.7, // Auto-captions are ~70% accurate
    }));
}

/**
 * Parse YouTube caption XML format
 */
function parseCaptionXml(xml: string): TranscriptionSegment[] {
  const segments: TranscriptionSegment[] = [];

  // Simple regex parsing (not a full XML parser)
  const textMatches = xml.matchAll(
    /<text start="([^"]+)" dur="([^"]+)"[^>]*>([^<]*)<\/text>/g
  );

  for (const match of textMatches) {
    segments.push({
      text: decodeHtmlEntities(match[3]),
      start: parseFloat(match[1]),
      end: parseFloat(match[1]) + parseFloat(match[2]),
      confidence: 0.7,
    });
  }

  return segments;
}

/**
 * Decode HTML entities in caption text
 */
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

/**
 * YouTube Live Chat Analyzer
 *
 * Monitor live chat for trade signals from the streamer.
 * Many traders post their entries in chat or have moderators post them.
 * This is completely free and doesn't require transcription.
 */
export interface ChatMessage {
  author: string;
  message: string;
  timestamp: Date;
  isOwner: boolean;
  isModerator: boolean;
}

/**
 * Analyze chat messages for trade signals
 */
export function analyzeChatForSignals(
  messages: ChatMessage[]
): DetectedSignal[] {
  const signals: DetectedSignal[] = [];

  // Only analyze messages from owner or moderators (more likely to be real signals)
  const trustedMessages = messages.filter((m) => m.isOwner || m.isModerator);

  for (const msg of trustedMessages) {
    const signal = parseMessageForSignal(msg);
    if (signal) {
      signals.push(signal);
    }
  }

  return signals;
}

/**
 * Parse a chat message for trade signals
 */
function parseMessageForSignal(msg: ChatMessage): DetectedSignal | null {
  const text = msg.message.toUpperCase();

  // Common signal patterns traders use in chat
  const entryPatterns = [
    /\b(LONG|BOUGHT|BUYING|ENTERED?)\s+(\d+)\s*(@|AT)?\s*\$?(\d+\.?\d*)/i,
    /\b(SHORT|SOLD|SELLING|SHORTED)\s+(\d+)\s*(@|AT)?\s*\$?(\d+\.?\d*)/i,
    /\b(ES|NQ|MES|MNQ)\s+(LONG|SHORT)\s*(@|AT)?\s*\$?(\d+\.?\d*)/i,
    /\b(ENTRY|ENTERED?|IN)\s*[@:]?\s*\$?(\d+\.?\d*)/i,
  ];

  const exitPatterns = [
    /\b(OUT|EXITED?|CLOSED?|FLAT)\s*[@:]?\s*\$?(\d+\.?\d*)?/i,
    /\b(STOPPED|STOP\s*HIT)\s*[@:]?\s*\$?(\d+\.?\d*)?/i,
    /\b(TARGET|TP)\s*(HIT)?\s*[@:]?\s*\$?(\d+\.?\d*)?/i,
  ];

  // Check for entry signals
  for (const pattern of entryPatterns) {
    const match = text.match(pattern);
    if (match) {
      const isLong =
        match[1]?.includes("LONG") ||
        match[1]?.includes("BOUGHT") ||
        match[1]?.includes("BUYING") ||
        match[2]?.includes("LONG");

      return {
        type: "entry",
        direction: isLong ? "LONG" : "SHORT",
        symbol: extractSymbol(text),
        price: extractPrice(match[0]),
        size: extractSize(match[0]),
        timestamp: msg.timestamp.getTime() / 1000,
        rawText: msg.message,
        confidence: msg.isOwner ? 0.9 : 0.7,
      };
    }
  }

  // Check for exit signals
  for (const pattern of exitPatterns) {
    const match = text.match(pattern);
    if (match) {
      return {
        type: "exit",
        symbol: extractSymbol(text),
        price: extractPrice(match[0]),
        timestamp: msg.timestamp.getTime() / 1000,
        rawText: msg.message,
        confidence: msg.isOwner ? 0.9 : 0.7,
      };
    }
  }

  return null;
}

/**
 * Extract trading symbol from text
 */
function extractSymbol(text: string): string | undefined {
  const symbols = ["ES", "NQ", "CL", "GC", "MES", "MNQ", "RTY", "YM"];
  for (const symbol of symbols) {
    if (text.includes(symbol)) {
      return symbol;
    }
  }
  return undefined;
}

/**
 * Extract price from text
 */
function extractPrice(text: string): number | undefined {
  const match = text.match(/\$?(\d{4,5}(?:\.\d{1,4})?)/);
  if (match) {
    return parseFloat(match[1]);
  }
  return undefined;
}

/**
 * Extract position size from text
 */
function extractSize(text: string): number | undefined {
  const match = text.match(/\b([1-9]\d?)\s*(?:lot|contract|ct)?s?\b/i);
  if (match) {
    return parseInt(match[1]);
  }
  return undefined;
}

/**
 * YouTube Live Chat Fetcher
 *
 * Fetches live chat messages using YouTube Live Streaming API.
 * Uses 5 quota units per request.
 */
export async function fetchLiveChatMessages(
  liveChatId: string,
  pageToken?: string
): Promise<{
  messages: ChatMessage[];
  nextPageToken?: string;
  pollingIntervalMs: number;
}> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return { messages: [], pollingIntervalMs: 10000 };
  }

  try {
    const url = new URL(
      "https://www.googleapis.com/youtube/v3/liveChat/messages"
    );
    url.searchParams.set("liveChatId", liveChatId);
    url.searchParams.set("part", "snippet,authorDetails");
    url.searchParams.set("maxResults", "200");
    url.searchParams.set("key", apiKey);
    if (pageToken) {
      url.searchParams.set("pageToken", pageToken);
    }

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.statusText}`);
    }

    const data = await response.json();

    const messages: ChatMessage[] = (data.items || []).map(
      (item: {
        snippet?: { displayMessage?: string; publishedAt?: string };
        authorDetails?: {
          displayName?: string;
          isChatOwner?: boolean;
          isChatModerator?: boolean;
        };
      }) => ({
        author: item.authorDetails?.displayName || "Unknown",
        message: item.snippet?.displayMessage || "",
        timestamp: new Date(item.snippet?.publishedAt || Date.now()),
        isOwner: item.authorDetails?.isChatOwner || false,
        isModerator: item.authorDetails?.isChatModerator || false,
      })
    );

    return {
      messages,
      nextPageToken: data.nextPageToken,
      pollingIntervalMs: data.pollingIntervalMillis || 10000,
    };
  } catch (error) {
    console.error("Failed to fetch live chat:", error);
    return { messages: [], pollingIntervalMs: 10000 };
  }
}

/**
 * Web Speech API Configuration (Browser-side only)
 *
 * This returns config for client-side speech recognition.
 * Completely free, runs in the browser.
 */
export function getWebSpeechConfig(): {
  supported: boolean;
  languages: string[];
  continuous: boolean;
} {
  // This is for documentation - actual implementation runs client-side
  return {
    supported: true, // Assume modern browser
    languages: ["en-US", "en-GB"],
    continuous: true,
  };
}

/**
 * Client-side Web Speech API wrapper
 * Use this in a React component for real-time transcription
 *
 * Example usage:
 * ```tsx
 * const { transcript, listening, start, stop } = useWebSpeechRecognition({
 *   onSignal: (signal) => console.log('Trade signal:', signal)
 * });
 * ```
 */
export const webSpeechRecognitionCode = `
// Client-side React hook for free speech recognition
import { useState, useEffect, useCallback } from 'react';

interface UseWebSpeechOptions {
  onTranscript?: (text: string) => void;
  onSignal?: (signal: DetectedSignal) => void;
  language?: string;
  continuous?: boolean;
}

export function useWebSpeechRecognition(options: UseWebSpeechOptions = {}) {
  const [transcript, setTranscript] = useState('');
  const [listening, setListening] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recog = new SpeechRecognition();
        recog.continuous = options.continuous ?? true;
        recog.interimResults = true;
        recog.lang = options.language || 'en-US';

        recog.onresult = (event) => {
          const text = Array.from(event.results)
            .map(result => result[0].transcript)
            .join('');
          setTranscript(text);
          options.onTranscript?.(text);

          // Check for trade signals in the transcript
          const signal = detectSignalFromText(text);
          if (signal) {
            options.onSignal?.(signal);
          }
        };

        recog.onend = () => {
          if (listening) {
            recog.start(); // Auto-restart for continuous listening
          }
        };

        setRecognition(recog);
      }
    }
  }, []);

  const start = useCallback(() => {
    recognition?.start();
    setListening(true);
  }, [recognition]);

  const stop = useCallback(() => {
    recognition?.stop();
    setListening(false);
  }, [recognition]);

  return { transcript, listening, start, stop };
}

function detectSignalFromText(text: string): DetectedSignal | null {
  // Signal detection logic here
  return null;
}
`;
