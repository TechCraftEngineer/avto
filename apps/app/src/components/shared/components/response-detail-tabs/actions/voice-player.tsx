"use client";

import { Button } from "@qbs-autonaim/ui";
import { Pause, Play } from "lucide-react";
import { useRef, useState } from "react";

interface VoicePlayerProps {
  url: string;
  duration: string;
}

export function VoicePlayer({ url, duration }: VoicePlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setAudioDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(() => false);
    setCurrentTime(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={togglePlay}
        aria-label={
          isPlaying
            ? "Приостановить голосовое сообщение"
            : "Воспроизвести голосовое сообщение"
        }
        aria-pressed={isPlaying}
        className="h-8 w-8 shrink-0 p-0"
      >
        {isPlaying ? (
          <Pause className="h-3.5 w-3.5" />
        ) : (
          <Play className="h-3.5 w-3.5" />
        )}
      </Button>
      <div className="flex-1">
        <div className="text-xs text-muted-foreground">
          🎤 Голосовое сообщение
          {audioDuration > 0 && (
            <span className="ml-2">
              {formatTime(currentTime)} / {formatTime(audioDuration)}
            </span>
          )}
          {!audioDuration && duration && (
            <span className="ml-2">{duration}</span>
          )}
        </div>
      </div>
      <audio
        ref={audioRef}
        src={url}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        preload="metadata"
        aria-label="Аудио голосового сообщения"
      >
        <track kind="captions" />
      </audio>
    </div>
  );
}
