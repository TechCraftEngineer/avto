import type { posthog } from "~/lib/posthog";

declare global {
  interface Window {
    posthog?: typeof posthog;
  }
}
