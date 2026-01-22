import { LangfuseSpanProcessor, type ShouldExportSpan } from "@langfuse/otel";
import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node";
import { env } from "@qbs-autonaim/config";

// Optional: filter out NextJS infra spans
const shouldExportSpan: ShouldExportSpan = (span) => {
  return span.otelSpan.instrumentationScope.name !== "next.js";
};

// Initialize LangfuseSpanProcessor only if Langfuse credentials are configured
let langfuseSpanProcessor: LangfuseSpanProcessor | undefined;

if (env.LANGFUSE_SECRET_KEY && env.LANGFUSE_PUBLIC_KEY) {
  langfuseSpanProcessor = new LangfuseSpanProcessor({
    publicKey: env.LANGFUSE_PUBLIC_KEY,
    secretKey: env.LANGFUSE_SECRET_KEY,
    baseUrl: env.LANGFUSE_BASE_URL,
    shouldExportSpan,
  });
}

// Initialize tracer provider only if we have a span processor
if (langfuseSpanProcessor) {
  const tracerProvider = new NodeTracerProvider({
    spanProcessors: [langfuseSpanProcessor],
  });

  tracerProvider.register();
}
