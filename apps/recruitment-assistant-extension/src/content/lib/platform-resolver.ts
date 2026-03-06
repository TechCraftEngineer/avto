/**
 * Определение поддерживаемой платформы (LinkedIn, HeadHunter)
 */

import type { PlatformAdapter } from "../../adapters/base/platform-adapter";
import { PLATFORM_ADAPTERS } from "../../adapters/registry";

/** Возвращает адаптер для текущей страницы или null, если платформа не поддерживается */
export function resolvePlatform(): PlatformAdapter | null {
  for (const adapter of PLATFORM_ADAPTERS) {
    if (adapter.isProfilePage()) {
      return adapter;
    }
  }
  return null;
}
