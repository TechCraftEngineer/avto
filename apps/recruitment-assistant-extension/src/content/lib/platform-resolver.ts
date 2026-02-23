/**
 * Определение поддерживаемой платформы (LinkedIn, HeadHunter)
 */

import type { PlatformAdapter } from "../../adapters/base/platform-adapter";
import { HeadHunterAdapter } from "../../adapters/headhunter/headhunter-adapter";
import { LinkedInAdapter } from "../../adapters/linkedin/linkedin-adapter";

const ADAPTERS: PlatformAdapter[] = [
  new LinkedInAdapter(),
  new HeadHunterAdapter(),
];

/** Возвращает адаптер для текущей страницы или null, если платформа не поддерживается */
export function resolvePlatform(): PlatformAdapter | null {
  for (const adapter of ADAPTERS) {
    if (adapter.isProfilePage()) {
      return adapter;
    }
  }
  return null;
}
