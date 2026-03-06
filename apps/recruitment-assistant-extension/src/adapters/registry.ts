/**
 * Общие экземпляры адаптеров платформ.
 * Используются и DataExtractor, и resolvePlatform — чтобы после extraction
 * getContactsHtml/getSkillsHtml возвращали данные с того же экземпляра.
 */

import type { PlatformAdapter } from "./base/platform-adapter";
import { HeadHunterAdapter } from "./headhunter/headhunter-adapter";
import { LinkedInAdapter } from "./linkedin/linkedin-adapter";

export const PLATFORM_ADAPTERS: PlatformAdapter[] = [
  new LinkedInAdapter(),
  new HeadHunterAdapter(),
];
