/**
 * Stream Capture Service
 *
 * Captures frames and audio from YouTube live streams for analysis.
 * Uses yt-dlp for stream access and ffmpeg for processing.
 *
 * Note: This service is designed to run on a server with yt-dlp and ffmpeg installed.
 * For Vercel deployment, this would need to be a separate microservice or use
 * a cloud function with these dependencies.
 */

export interface CaptureConfig {
  streamId: string;
  channelName: string;
  captureVideo: boolean;
  captureAudio: boolean;
  frameInterval: number; // seconds between frame captures
  outputDir: string;
}

export interface CapturedFrame {
  streamId: string;
  timestamp: Date;
  frameNumber: number;
  imagePath: string;
  imageBase64?: string;
}

export interface CapturedAudio {
  streamId: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  audioPath: string;
}

/**
 * Generate yt-dlp command for stream capture
 */
export function generateYtDlpCommand(streamId: string, outputPath: string): string {
  const streamUrl = `https://www.youtube.com/watch?v=${streamId}`;

  // This command captures the stream to a file
  // -f best: Get best quality
  // --no-part: Don't use .part files
  // --live-from-start: Start from beginning if possible
  return `yt-dlp -f best --no-part -o "${outputPath}" "${streamUrl}"`;
}

/**
 * Generate ffmpeg command for frame extraction
 */
export function generateFrameExtractionCommand(
  inputPath: string,
  outputPattern: string,
  frameRate: number = 0.5 // 1 frame every 2 seconds
): string {
  // -vf fps=0.5: Extract 1 frame every 2 seconds
  // -frame_pts 1: Use presentation timestamp for frame numbering
  return `ffmpeg -i "${inputPath}" -vf fps=${frameRate} -frame_pts 1 "${outputPattern}"`;
}

/**
 * Generate ffmpeg command for audio extraction
 */
export function generateAudioExtractionCommand(
  inputPath: string,
  outputPath: string
): string {
  // -vn: No video
  // -acodec pcm_s16le: WAV format for transcription
  // -ar 16000: 16kHz sample rate (good for speech)
  // -ac 1: Mono
  return `ffmpeg -i "${inputPath}" -vn -acodec pcm_s16le -ar 16000 -ac 1 "${outputPath}"`;
}

/**
 * Stream capture job configuration
 */
export interface StreamCaptureJob {
  id: string;
  streamId: string;
  channelId: string;
  channelName: string;
  status: "pending" | "capturing" | "processing" | "completed" | "error";
  startedAt?: Date;
  endedAt?: Date;
  framesCaptures: number;
  audioChunksCaptures: number;
  error?: string;
}

/**
 * In-memory job tracker (would be Redis/DB in production)
 */
const activeJobs = new Map<string, StreamCaptureJob>();

export function createCaptureJob(
  streamId: string,
  channelId: string,
  channelName: string
): StreamCaptureJob {
  const job: StreamCaptureJob = {
    id: `capture-${streamId}-${Date.now()}`,
    streamId,
    channelId,
    channelName,
    status: "pending",
    framesCaptures: 0,
    audioChunksCaptures: 0,
  };

  activeJobs.set(job.id, job);
  return job;
}

export function getActiveJobs(): StreamCaptureJob[] {
  return Array.from(activeJobs.values());
}

export function getJob(jobId: string): StreamCaptureJob | undefined {
  return activeJobs.get(jobId);
}

/**
 * Cloud-based frame capture using external service
 *
 * For Vercel deployment, we'll use an external API approach:
 * 1. Send stream URL to a cloud function/microservice
 * 2. Service captures frames and uploads to storage
 * 3. Returns URLs for analysis
 */
export async function captureFrameFromStream(
  streamId: string,
  timestamp?: number
): Promise<{ imageUrl: string; capturedAt: Date } | null> {
  // This would call an external service like:
  // - AWS Lambda with yt-dlp layer
  // - Google Cloud Run
  // - Self-hosted microservice
  // - Screenshot API service

  const captureServiceUrl = process.env.CAPTURE_SERVICE_URL;
  if (!captureServiceUrl) {
    console.warn("CAPTURE_SERVICE_URL not configured");
    return null;
  }

  try {
    const response = await fetch(captureServiceUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.CAPTURE_SERVICE_KEY}`,
      },
      body: JSON.stringify({
        streamId,
        timestamp,
        format: "jpeg",
        quality: 80,
      }),
    });

    if (!response.ok) {
      throw new Error(`Capture service error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      imageUrl: data.imageUrl,
      capturedAt: new Date(data.capturedAt),
    };
  } catch (error) {
    console.error("Frame capture error:", error);
    return null;
  }
}

/**
 * Alternative: Use YouTube thumbnail as a proxy for current frame
 * This is less accurate but works without external services
 */
export function getLiveThumbnailUrl(streamId: string): string {
  // YouTube provides live thumbnails that update periodically
  // maxresdefault updates roughly every 30 seconds during live streams
  return `https://i.ytimg.com/vi/${streamId}/maxresdefault_live.jpg`;
}

/**
 * Get multiple thumbnail qualities
 */
export function getAllThumbnailUrls(streamId: string): Record<string, string> {
  return {
    maxres: `https://i.ytimg.com/vi/${streamId}/maxresdefault.jpg`,
    maxresLive: `https://i.ytimg.com/vi/${streamId}/maxresdefault_live.jpg`,
    sd: `https://i.ytimg.com/vi/${streamId}/sddefault.jpg`,
    sdLive: `https://i.ytimg.com/vi/${streamId}/sddefault_live.jpg`,
    hq: `https://i.ytimg.com/vi/${streamId}/hqdefault.jpg`,
    hqLive: `https://i.ytimg.com/vi/${streamId}/hqdefault_live.jpg`,
  };
}
