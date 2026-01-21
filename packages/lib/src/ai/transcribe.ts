import {
  experimental_transcribe as aiTranscribe,
  type JSONValue,
  type TranscriptionModel,
} from "ai";
import { langfuse } from "./providers";

export interface TranscriptionResult {
  text: string;
  language?: string;
  confidence?: number;
  segments?: Array<{
    startSecond: number;
    endSecond: number;
    text: string;
    confidence?: number;
  }>;
}

type ModelIdentifier = TranscriptionModel;
type ProviderOptions = Record<string, Record<string, JSONValue>>;

export interface TranscribeOptions {
  model?: ModelIdentifier;
  audio: Uint8Array | Buffer;
  generationName?: string;
  entityId?: string;
  metadata?: Record<string, JSONValue>;
  providerOptions?: ProviderOptions;
}

export async function transcribe(
  options: TranscribeOptions,
): Promise<TranscriptionResult> {
  const {
    model,
    audio,
    generationName = "transcription",
    entityId,
    metadata = {},
    providerOptions,
  } = options;

  // Проверяем, что метаданные можно сериализовать в JSON
  try {
    JSON.stringify(metadata);
  } catch (error) {
    throw new Error(`Метаданные должны быть JSON-сериализуемыми: ${error instanceof Error ? error.message : String(error)}`);
  }

  const trace = langfuse?.trace({
    name: generationName,
    userId: entityId,
    metadata,
  });

  const generation = trace?.generation({
    name: generationName,
    input: "audio data",
    metadata,
  });

  try {
    const result = await aiTranscribe({
      model: (model as TranscriptionModel) ?? "whisper-1",
      audio,
      providerOptions: providerOptions as unknown as Record<
        string,
        Record<string, JSONValue>
      >,
    });

    generation?.end({
      output: result.text,
    });

    return result as TranscriptionResult;
  } catch (error) {
    generation?.end({
      statusMessage: error instanceof Error ? error.message : String(error),
    });
    throw error;
  } finally {
    try {
      await langfuse?.flushAsync();
    } catch (flushError) {
      console.error("Не удалось сохранить трейс Langfuse", {
        generationName,
        traceId: trace?.id,
        entityId,
        error: flushError,
      });
    }
  }
}
