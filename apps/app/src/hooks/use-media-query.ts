"use client";

import { useEffect, useState } from "react";

/**
 * Хук для проверки media query (используется для responsive диалогов)
 * @param query - CSS media query (напр. "(min-width: 768px)" для md breakpoint)
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);

    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, [query]);

  return matches;
}
