import { env } from "@qbs-autonaim/config";
import {
  openaiProvider,
  transcribe,
  type TranscriptionResult,
} from "@qbs-autonaim/lib/ai";
import { createLogger, ok, type Result, tryCatch } from "../base";

const logger = createLogger("Transcription");

/**
 * Transcribes audio buffer to text using OpenAI Whisper
 */
export async function transcribeAudio(
  audioBuffer: Buffer,
): Promise<Result<string | null>> {
  if (!openaiProvider) {
    logger.info("Transcription skipped: OpenAI provider not available (OPENAI_API_KEY not set)");
    return ok(null);
  }

  return tryCatch(async () => {
    const result: TranscriptionResult = await transcribe({
      model: openaiProvider.transcription("whisper-1"),
      audio: audioBuffer,
      providerOptions: { openai: { language: "ru" } },
      generationName: "audio-transcription",
    });

    logger.info("Audio transcribed successfully");
    return result.text;
  }, "Failed to transcribe audio");
}
