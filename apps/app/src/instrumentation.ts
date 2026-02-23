export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { registerPostHogErrorTracking } = await import(
      "./lib/posthog-error-tracking"
    );
    registerPostHogErrorTracking();
    await import("./orpc/server");
  }
}
