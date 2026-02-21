/**
 * Расширенные типы профиля для парсинга и UI
 */

import type { ExperienceItem, EducationItem } from "./profile";

export type ProfilePlatform =
  | "kwork"
  | "fl"
  | "freelance"
  | "headhunter"
  | "linkedin"
  | "unknown";

export interface ProfileStatistics {
  rating?: number;
  ordersCompleted?: number;
  reviewsReceived?: number;
  successRate?: number;
  onTimeRate?: number;
  repeatOrdersRate?: number;
  buyerLevel?: string;
}

export interface BaseProfileData {
  platform: ProfilePlatform;
  username: string;
  profileUrl: string;
  aboutMe?: string;
  skills?: string[];
  statistics?: ProfileStatistics;
  parsedAt: Date;
  error?: string;
}

export interface ExtendedProfileData {
  error?: string | null;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  location?: string | null;
  experience?: ExperienceItem[] | string | null;
  education?: EducationItem[] | string | null;
  skills?: string[] | null;
  summary?: string | null;
  platform?: string | null;
  username?: string | null;
  profileUrl?: string | null;
  aboutMe?: string | null;
  statistics?: ProfileStatistics | null;
}

export interface ParsedProfileData {
  isJson: boolean;
  data: ExtendedProfileData | null;
  text: string | null;
}
