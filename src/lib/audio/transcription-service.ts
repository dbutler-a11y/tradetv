/**
 * Audio Transcription Service
 *
 * Transcribes audio from trading streams to detect verbal trade signals.
 * Supports Deepgram (real-time) and OpenAI Whisper (batch).
 */

export interface TranscriptionSegment {
  text: string;
  start: number; // seconds
  end: number; // seconds
  confidence: number;
  speaker?: string;
}

export interface TranscriptionResult {
  streamId: string;
  segments: TranscriptionSegment[];
  fullText: string;
  duration: number;
  detectedSignals: DetectedSignal[];
}

export interface DetectedSignal {
  type: "entry" | "exit" | "stop" | "target" | "alert";
  symbol?: string;
  direction?: "LONG" | "SHORT" | "BUY" | "SELL";
  price?: number;
  size?: number;
  timestamp: number; // seconds into stream
  rawText: string;
  confidence: number;
}

// Trading keywords and patterns for signal detection
const TRADING_PATTERNS = {
  entry: [
    /\b(going|went|entering|entered|buying|bought|taking|took)\s+(long|short|a position)/i,
    /\b(long|short)\s+(here|now|at)\b/i,
    /\b(filled|got filled|in at)\s*\$?(\d+\.?\d*)/i,
    /\b(entry|entered)\s*(at|price)?\s*\$?(\d+\.?\d*)/i,
  ],
  exit: [
    /\b(closing|closed|exiting|exited|out of|getting out|flattening|flat)/i,
    /\b(took profits?|taking profits?|profit target hit)/i,
    /\b(stopped out|hit (my )?stop|stop loss hit)/i,
    /\b(out at|closed at|exited at)\s*\$?(\d+\.?\d*)/i,
  ],
  stop: [
    /\b(stop loss|stop)\s*(at|is|set to)?\s*\$?(\d+\.?\d*)/i,
    /\b(protect(ing|ed)?|risk(ing)?)\s*(at)?\s*\$?(\d+\.?\d*)/i,
  ],
  target: [
    /\b(target|tp|take profit)\s*(at|is)?\s*\$?(\d+\.?\d*)/i,
    /\b(looking for|expecting)\s*\$?(\d+\.?\d*)/i,
  ],
  alert: [
    /\b(watch(ing)?|alert|heads up|pay attention)\b/i,
    /\b(breaking|broke)\s+(above|below|through)/i,
    /\b(resistance|support)\s+(at|near|around)/i,
  ],
};

// Symbol patterns (futures, stocks, forex)
const SYMBOL_PATTERNS = [
  /\b(ES|NQ|CL|GC|SI|ZB|RTY|YM|MES|MNQ|MCL)\b/i, // Futures
  /\b(SPY|QQQ|IWM|DIA|AAPL|TSLA|NVDA|AMZN|GOOGL|META)\b/i, // Popular stocks
  /\b(EUR\/USD|GBP\/USD|USD\/JPY|EURUSD|GBPUSD|USDJPY)\b/i, // Forex
];

// Price patterns
const PRICE_PATTERNS = [
  /\$(\d+(?:,\d{3})*(?:\.\d{1,4})?)/g, // $5,890.50
  /(\d+(?:,\d{3})*(?:\.\d{1,4})?)\s*dollars?/gi, // 5890.50 dollars
  /(\d{4,5}(?:\.\d{1,4})?)/g, // 5890.50 (futures prices typically 4-5 digits)
];

/**
 * Analyze transcription text for trading signals
 */
export function analyzeTranscriptionForSignals(
  segments: TranscriptionSegment[]
): DetectedSignal[] {
  const signals: DetectedSignal[] = [];

  for (const segment of segments) {
    const text = segment.text;

    // Check for entry signals
    for (const pattern of TRADING_PATTERNS.entry) {
      if (pattern.test(text)) {
        signals.push({
          type: "entry",
          direction: extractDirection(text),
          symbol: extractSymbol(text),
          price: extractPrice(text),
          timestamp: segment.start,
          rawText: text,
          confidence: segment.confidence,
        });
        break;
      }
    }

    // Check for exit signals
    for (const pattern of TRADING_PATTERNS.exit) {
      if (pattern.test(text)) {
        signals.push({
          type: "exit",
          symbol: extractSymbol(text),
          price: extractPrice(text),
          timestamp: segment.start,
          rawText: text,
          confidence: segment.confidence,
        });
        break;
      }
    }

    // Check for stop loss mentions
    for (const pattern of TRADING_PATTERNS.stop) {
      if (pattern.test(text)) {
        signals.push({
          type: "stop",
          price: extractPrice(text),
          timestamp: segment.start,
          rawText: text,
          confidence: segment.confidence,
        });
        break;
      }
    }

    // Check for target mentions
    for (const pattern of TRADING_PATTERNS.target) {
      if (pattern.test(text)) {
        signals.push({
          type: "target",
          price: extractPrice(text),
          timestamp: segment.start,
          rawText: text,
          confidence: segment.confidence,
        });
        break;
      }
    }
  }

  return signals;
}

/**
 * Extract trading direction from text
 */
function extractDirection(text: string): "LONG" | "SHORT" | undefined {
  const lowerText = text.toLowerCase();
  if (/\b(long|buy|buying|bought)\b/.test(lowerText)) {
    return "LONG";
  }
  if (/\b(short|sell|selling|sold)\b/.test(lowerText)) {
    return "SHORT";
  }
  return undefined;
}

/**
 * Extract trading symbol from text
 */
function extractSymbol(text: string): string | undefined {
  for (const pattern of SYMBOL_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      return match[1].toUpperCase();
    }
  }
  return undefined;
}

/**
 * Extract price from text
 */
function extractPrice(text: string): number | undefined {
  for (const pattern of PRICE_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      const priceStr = match[1].replace(/,/g, "");
      const price = parseFloat(priceStr);
      if (!isNaN(price) && price > 0) {
        return price;
      }
    }
  }
  return undefined;
}

/**
 * Transcribe audio using OpenAI Whisper API
 */
export async function transcribeWithWhisper(
  audioBuffer: Buffer,
  streamId: string
): Promise<TranscriptionResult> {
  const OpenAI = (await import("openai")).default;
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  if (!process.env.OPENAI_API_KEY) {
    return {
      streamId,
      segments: [],
      fullText: "",
      duration: 0,
      detectedSignals: [],
    };
  }

  try {
    // Create a Blob from the buffer, then convert to File
    const blob = new Blob([new Uint8Array(audioBuffer)], { type: "audio/wav" });
    const audioFile = new File([blob], "audio.wav", {
      type: "audio/wav",
    });

    const response = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
      response_format: "verbose_json",
      timestamp_granularities: ["segment"],
    });

    const segments: TranscriptionSegment[] = (response.segments || []).map(
      (seg) => ({
        text: seg.text,
        start: seg.start,
        end: seg.end,
        confidence: seg.avg_logprob ? Math.exp(seg.avg_logprob) : 0.8,
      })
    );

    const detectedSignals = analyzeTranscriptionForSignals(segments);

    return {
      streamId,
      segments,
      fullText: response.text,
      duration: response.duration || 0,
      detectedSignals,
    };
  } catch (error) {
    console.error("Whisper transcription error:", error);
    return {
      streamId,
      segments: [],
      fullText: "",
      duration: 0,
      detectedSignals: [],
    };
  }
}

/**
 * Deepgram real-time transcription configuration
 */
export interface DeepgramConfig {
  apiKey: string;
  model?: "nova-2" | "nova" | "enhanced" | "base";
  language?: string;
  punctuate?: boolean;
  diarize?: boolean;
  smart_format?: boolean;
  keywords?: string[];
}

/**
 * Create Deepgram WebSocket URL for real-time transcription
 */
export function createDeepgramStreamUrl(config: DeepgramConfig): string {
  const params = new URLSearchParams({
    model: config.model || "nova-2",
    language: config.language || "en-US",
    punctuate: String(config.punctuate ?? true),
    diarize: String(config.diarize ?? false),
    smart_format: String(config.smart_format ?? true),
    interim_results: "false",
    endpointing: "300",
  });

  // Add trading-specific keywords for better recognition
  const tradingKeywords = [
    "ES",
    "NQ",
    "long",
    "short",
    "entry",
    "exit",
    "stop loss",
    "take profit",
    "filled",
    "position",
    ...(config.keywords || []),
  ];

  tradingKeywords.forEach((kw) => {
    params.append("keywords", kw);
  });

  return `wss://api.deepgram.com/v1/listen?${params.toString()}`;
}

/**
 * Real-time transcription handler using Deepgram
 * This would be used in a WebSocket connection to process live audio
 */
export interface RealtimeTranscriptionHandler {
  onTranscript: (segment: TranscriptionSegment) => void;
  onSignal: (signal: DetectedSignal) => void;
  onError: (error: Error) => void;
}

/**
 * Process a Deepgram response and extract signals
 */
export function processDeepgramResponse(
  response: {
    channel?: {
      alternatives?: Array<{
        transcript?: string;
        confidence?: number;
        words?: Array<{
          word: string;
          start: number;
          end: number;
          confidence: number;
        }>;
      }>;
    };
    start?: number;
    duration?: number;
  },
  handler: RealtimeTranscriptionHandler
): void {
  const alternative = response.channel?.alternatives?.[0];
  if (!alternative || !alternative.transcript) return;

  const segment: TranscriptionSegment = {
    text: alternative.transcript,
    start: response.start || 0,
    end: (response.start || 0) + (response.duration || 0),
    confidence: alternative.confidence || 0.8,
  };

  handler.onTranscript(segment);

  // Analyze for trading signals
  const signals = analyzeTranscriptionForSignals([segment]);
  signals.forEach((signal) => handler.onSignal(signal));
}

/**
 * Batch transcription for recorded audio chunks
 */
export async function transcribeAudioChunk(
  audioUrl: string,
  streamId: string
): Promise<TranscriptionResult> {
  const deepgramKey = process.env.DEEPGRAM_API_KEY;

  if (deepgramKey) {
    // Use Deepgram for batch transcription
    try {
      const response = await fetch(
        "https://api.deepgram.com/v1/listen?model=nova-2&punctuate=true&smart_format=true",
        {
          method: "POST",
          headers: {
            Authorization: `Token ${deepgramKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ url: audioUrl }),
        }
      );

      if (!response.ok) {
        throw new Error(`Deepgram error: ${response.statusText}`);
      }

      const data = await response.json();
      const result = data.results?.channels?.[0]?.alternatives?.[0];

      if (!result) {
        throw new Error("No transcription result");
      }

      const segments: TranscriptionSegment[] = (result.words || []).reduce(
        (
          acc: TranscriptionSegment[],
          word: { word: string; start: number; end: number; confidence: number },
          index: number,
          words: Array<{
            word: string;
            start: number;
            end: number;
            confidence: number;
          }>
        ) => {
          // Group words into ~5 second segments
          const lastSegment = acc[acc.length - 1];
          if (!lastSegment || word.start - lastSegment.start > 5) {
            acc.push({
              text: word.word,
              start: word.start,
              end: word.end,
              confidence: word.confidence,
            });
          } else {
            lastSegment.text += " " + word.word;
            lastSegment.end = word.end;
            lastSegment.confidence =
              (lastSegment.confidence + word.confidence) / 2;
          }
          return acc;
        },
        []
      );

      const detectedSignals = analyzeTranscriptionForSignals(segments);

      return {
        streamId,
        segments,
        fullText: result.transcript || "",
        duration: data.metadata?.duration || 0,
        detectedSignals,
      };
    } catch (error) {
      console.error("Deepgram transcription error:", error);
    }
  }

  // Fallback to Whisper if Deepgram not available
  // Would need to fetch audio and convert to buffer
  return {
    streamId,
    segments: [],
    fullText: "",
    duration: 0,
    detectedSignals: [],
  };
}
