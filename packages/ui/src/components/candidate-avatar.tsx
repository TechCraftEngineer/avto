"use client";

import { Avatar, AvatarFallback, AvatarImage } from "./avatar";

interface CandidateAvatarProps {
  name?: string | null;
  /**
   * @deprecated Используйте photoFileId вместо photoUrl
   */
  photoUrl?: string | null;
  photoFileId?: string | null;
  className?: string;
}

function getInitials(name?: string | null): string {
  if (!name) return "?";

  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0]?.charAt(0).toUpperCase() || "?";
  }

  const first = parts[0]?.charAt(0) || "";
  const last = parts[parts.length - 1]?.charAt(0) || "";
  return (first + last).toUpperCase() || "?";
}

function getDiceBearUrl(name?: string | null): string {
  const seed = name || "anonymous";
  return `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(seed)}&scale=50`;
}

export function CandidateAvatar({
  name,
  photoUrl,
  photoFileId,
  className,
}: CandidateAvatarProps) {
  const initials = getInitials(name);
  const fallbackUrl = getDiceBearUrl(name);

  // Поддержка обратной совместимости: если передан photoUrl, используем его
  // В будущем нужно использовать только photoFileId + useAvatarUrl в родительском компоненте
  const imageUrl = photoUrl || fallbackUrl;

  return (
    <Avatar className={className}>
      <AvatarImage src={imageUrl} alt={name || "Кандидат"} />
      <AvatarFallback>{initials}</AvatarFallback>
    </Avatar>
  );
}
