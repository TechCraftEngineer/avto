import { useCallback } from "react";
import { toast } from "sonner";

interface UseVoiceUploadOptions {
  sessionId: string;
  onSuccess: (audioUrl: string, duration: number) => void;
}

export function useVoiceUpload({
  sessionId,
  onSuccess,
}: UseVoiceUploadOptions) {
  const uploadVoice = useCallback(
    async (audioFile: File) => {
      let audioObjectUrl: string | null = null;
      let messageObjectUrl: string | null = null;

      try {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(audioFile);
        });

        const base64Audio = await base64Promise;

        audioObjectUrl = URL.createObjectURL(audioFile);
        const audio = new Audio(audioObjectUrl);

        const duration = await new Promise<number>((resolve, reject) => {
          const timeout = setTimeout(() => {
            cleanup();
            reject(new Error("Audio metadata loading timeout"));
          }, 10000);

          const onLoadedMetadata = () => {
            cleanup();
            resolve(audio.duration);
          };

          const onError = () => {
            cleanup();
            reject(new Error("Failed to load audio metadata"));
          };

          const cleanup = () => {
            clearTimeout(timeout);
            audio.removeEventListener("loadedmetadata", onLoadedMetadata);
            audio.removeEventListener("error", onError);
          };

          audio.addEventListener("loadedmetadata", onLoadedMetadata);
          audio.addEventListener("error", onError);
        });

        URL.revokeObjectURL(audioObjectUrl);
        audioObjectUrl = null;

        const response = await fetch("/api/interview/upload-voice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            audioFile: base64Audio,
            fileName: audioFile.name,
            mimeType: audioFile.type,
            duration,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message || "Failed to upload voice message",
          );
        }

        messageObjectUrl = URL.createObjectURL(audioFile);
        onSuccess(messageObjectUrl, duration);

        setTimeout(() => {
          if (messageObjectUrl) {
            URL.revokeObjectURL(messageObjectUrl);
          }
        }, 1000);
      } catch (error) {
        if (audioObjectUrl) {
          URL.revokeObjectURL(audioObjectUrl);
        }
        if (messageObjectUrl) {
          URL.revokeObjectURL(messageObjectUrl);
        }

        const errorMessage =
          error instanceof Error
            ? error.message
            : "Не удалось отправить голосовое сообщение";

        toast.error(errorMessage);
        throw error;
      }
    },
    [sessionId, onSuccess],
  );

  return { uploadVoice };
}
