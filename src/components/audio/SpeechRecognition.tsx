"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Mic, MicOff, Volume2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DetectedSignal {
  type: "entry" | "exit" | "stop" | "target" | "alert";
  direction?: "LONG" | "SHORT";
  symbol?: string;
  price?: number;
  timestamp: number;
  rawText: string;
  confidence: number;
}

interface SpeechRecognitionProps {
  onSignalDetected?: (signal: DetectedSignal) => void;
  onTranscript?: (text: string) => void;
  className?: string;
}

// Trade signal detection patterns
const SIGNAL_PATTERNS = {
  entry: [
    /\b(going|went|entering|entered|buying|bought|taking|took)\s+(long|short)/i,
    /\b(long|short)\s+(here|now|at)\b/i,
    /\b(filled|got filled|in at)\s*\$?(\d+\.?\d*)/i,
    /\b(entry|entered?)\s*(at|price)?\s*[@:]?\s*\$?(\d+\.?\d*)/i,
  ],
  exit: [
    /\b(closing|closed|exiting|exited|out of|getting out|flattening|flat)\b/i,
    /\b(took profits?|taking profits?|profit target hit)/i,
    /\b(stopped out|hit (my )?stop|stop loss hit)/i,
  ],
  stop: [
    /\b(stop loss|stop)\s*(at|is|set to)?\s*\$?(\d+\.?\d*)/i,
  ],
  target: [
    /\b(target|tp|take profit)\s*(at|is)?\s*\$?(\d+\.?\d*)/i,
  ],
  alert: [
    /\b(watch|watching|alert|heads up|pay attention)\b/i,
    /\b(breaking|broke)\s+(above|below|through)/i,
  ],
};

function detectSignalFromText(text: string): DetectedSignal | null {
  for (const [type, patterns] of Object.entries(SIGNAL_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(text)) {
        const isLong = /\b(long|buy|buying|bought)\b/i.test(text);
        const isShort = /\b(short|sell|selling|sold)\b/i.test(text);
        const priceMatch = text.match(/\$?(\d{4,5}(?:\.\d{1,4})?)/);
        const symbolMatch = text.match(/\b(ES|NQ|CL|GC|MES|MNQ|RTY|YM)\b/i);

        return {
          type: type as DetectedSignal["type"],
          direction: isLong ? "LONG" : isShort ? "SHORT" : undefined,
          symbol: symbolMatch?.[1]?.toUpperCase(),
          price: priceMatch ? parseFloat(priceMatch[1]) : undefined,
          timestamp: Date.now() / 1000,
          rawText: text,
          confidence: 0.8,
        };
      }
    }
  }
  return null;
}

// Web Speech API types (not included in TypeScript by default)
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onstart: ((this: ISpeechRecognition, ev: Event) => void) | null;
  onresult: ((this: ISpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((this: ISpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null;
  onend: ((this: ISpeechRecognition, ev: Event) => void) | null;
}

type SpeechRecognitionConstructor = new () => ISpeechRecognition;

// Check for Web Speech API support
function getSpeechRecognition(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  return (
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition ||
    null
  );
}

export function SpeechRecognitionPanel({
  onSignalDetected,
  onTranscript,
  className = "",
}: SpeechRecognitionProps) {
  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [signals, setSignals] = useState<DetectedSignal[]>([]);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);

  // Check for browser support
  useEffect(() => {
    const SpeechRecognitionAPI = getSpeechRecognition();
    setIsSupported(!!SpeechRecognitionAPI);
  }, []);

  // Initialize speech recognition
  const startListening = useCallback(() => {
    const SpeechRecognitionAPI = getSpeechRecognition();
    if (!SpeechRecognitionAPI) {
      setError("Speech recognition not supported in this browser");
      return;
    }

    try {
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interim = "";
        let final = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            final += result[0].transcript;
          } else {
            interim += result[0].transcript;
          }
        }

        setInterimTranscript(interim);

        if (final) {
          setTranscript((prev) => prev + " " + final);
          onTranscript?.(final);

          // Check for trade signals
          const signal = detectSignalFromText(final);
          if (signal) {
            setSignals((prev) => [...prev.slice(-10), signal]);
            onSignalDetected?.(signal);
          }
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error("Speech recognition error:", event.error);
        if (event.error === "not-allowed") {
          setError("Microphone access denied. Please allow microphone access.");
        } else if (event.error === "no-speech") {
          // Ignore no-speech errors, just restart
        } else {
          setError(`Error: ${event.error}`);
        }
      };

      recognition.onend = () => {
        // Auto-restart if still supposed to be listening
        if (isListening && recognitionRef.current) {
          try {
            recognition.start();
          } catch (e) {
            // Ignore errors on restart
          }
        } else {
          setIsListening(false);
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (err) {
      console.error("Failed to start speech recognition:", err);
      setError("Failed to start speech recognition");
    }
  }, [isListening, onSignalDetected, onTranscript]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
    setInterimTranscript("");
  }, []);

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const clearTranscript = () => {
    setTranscript("");
    setSignals([]);
  };

  if (!isSupported) {
    return (
      <Card className={className}>
        <CardContent className="py-6">
          <div className="flex items-center gap-2 text-yellow-500">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm">
              Speech recognition not supported in this browser. Try Chrome or Edge.
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Volume2 className="w-5 h-5" />
            <span>Voice Recognition</span>
            {isListening && (
              <Badge variant="destructive" className="animate-pulse">
                LIVE
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={isListening ? "destructive" : "default"}
              size="sm"
              onClick={toggleListening}
              className="gap-2"
            >
              {isListening ? (
                <>
                  <MicOff className="w-4 h-4" />
                  Stop
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4" />
                  Start
                </>
              )}
            </Button>
            {transcript && (
              <Button variant="outline" size="sm" onClick={clearTranscript}>
                Clear
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 text-red-500 text-sm p-2 bg-red-500/10 rounded">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {/* Detected Signals */}
        {signals.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Detected Signals</h4>
            <div className="flex flex-wrap gap-2">
              {signals.slice(-5).map((signal, i) => (
                <Badge
                  key={i}
                  variant={
                    signal.type === "entry"
                      ? signal.direction === "LONG"
                        ? "default"
                        : "destructive"
                      : "secondary"
                  }
                  className="text-xs"
                >
                  {signal.type.toUpperCase()}
                  {signal.direction && ` ${signal.direction}`}
                  {signal.symbol && ` ${signal.symbol}`}
                  {signal.price && ` @${signal.price}`}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Transcript */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Transcript</h4>
          <ScrollArea className="h-[150px] w-full rounded border p-3 bg-muted/30">
            <p className="text-sm">
              {transcript || (
                <span className="text-muted-foreground italic">
                  {isListening
                    ? "Listening for speech..."
                    : "Click Start to begin voice recognition"}
                </span>
              )}
              {interimTranscript && (
                <span className="text-muted-foreground"> {interimTranscript}</span>
              )}
            </p>
          </ScrollArea>
        </div>

        {/* Instructions */}
        <div className="text-xs text-muted-foreground">
          <p>
            <strong>Tip:</strong> Say things like "Going long ES at 5890" or
            "Taking profit" to detect trade signals.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Hook for using speech recognition in custom components
 */
export function useSpeechRecognition({
  onSignal,
  onTranscript,
  autoStart = false,
}: {
  onSignal?: (signal: DetectedSignal) => void;
  onTranscript?: (text: string) => void;
  autoStart?: boolean;
} = {}) {
  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<ISpeechRecognition | null>(null);

  useEffect(() => {
    setIsSupported(!!getSpeechRecognition());
  }, []);

  const start = useCallback(() => {
    const SpeechRecognitionAPI = getSpeechRecognition();
    if (!SpeechRecognitionAPI) return;

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const result = event.results[event.results.length - 1];
      if (result.isFinal) {
        const text = result[0].transcript;
        setTranscript((prev) => prev + " " + text);
        onTranscript?.(text);

        const signal = detectSignalFromText(text);
        if (signal) onSignal?.(signal);
      }
    };

    recognition.onend = () => {
      if (isListening) {
        try {
          recognition.start();
        } catch {}
      }
    };

    recognition.start();
    recognitionRef.current = recognition;
    setIsListening(true);
  }, [isListening, onSignal, onTranscript]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsListening(false);
  }, []);

  useEffect(() => {
    if (autoStart && isSupported) start();
    return () => stop();
  }, [autoStart, isSupported, start, stop]);

  return {
    isSupported,
    isListening,
    transcript,
    start,
    stop,
    toggle: isListening ? stop : start,
    clear: () => setTranscript(""),
  };
}
