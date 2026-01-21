import { env } from "@qbs-autonaim/config";
import { openaiProvider, transcribe } from "@qbs-autonaim/lib/ai";
import { createLogger, ok, type Result, tryCatch } from "../base";

const logger = createLogger("Transcription");

/**
 * Transcribes audio buffer to text using OpenAI Whisper
 */
export async function transcribeAudio(
  audioBuffer: Buffer,
): Promise<Result<string | null>> {
  if (!env.OPENAI_API_KEY) {
    logger.info("Transcription skipped: OPENAI_API_KEY not set");
    return ok(null);
  }

  return tryCatch(async () => {
    const result = await transcribe({
      model: openaiProvider.transcription("whisper-1"),
      audio: audioBuffer,
      providerOptions: { openai: { language: "ru" } },
      generationName: "audio-transcription",
    });

    logger.info("Audio transcribed successfully");
    return result.text;
  }, "Failed to transcribe audio");
}
