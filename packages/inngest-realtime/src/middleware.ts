import { InngestMiddleware } from "inngest";
import { getAsyncCtx } from "inngest/experimental";
import type { Realtime } from "./types";

export const realtimeMiddleware = () => {
  return new InngestMiddleware({
    name: "publish",
    init({ client }) {
      return {
        onFunctionRun({ ctx: { runId } }) {
          return {
            transformInput({ ctx: { step } }) {
              let publishIndex = 0;

              const publish: Realtime.PublishFn = async (input) => {
                const { topic, channel, data } = await input;

                const store = await getAsyncCtx();
                if (!store) {
                  throw new Error(
                    "No ALS found, but is required for running `publish()`",
                  );
                }

                const publishOpts = {
                  topics: [topic],
                  channel,
                  runId,
                };

                const action = async () => {
                  // TODO: Заменить на публичный API когда он станет доступен
                  // Временно используем приватный API через type assertion
                  const inngestApi = (client as any).inngestApi;
                  if (!inngestApi || typeof inngestApi.publish !== "function") {
                    throw new Error(
                      "Inngest API недоступен. Требуется обновление SDK.",
                    );
                  }

                  const result = await inngestApi.publish(publishOpts, data);

                  if (!result.ok) {
                    throw new Error(
                      `Не удалось опубликовать событие: ${result.error?.error}`,
                    );
                  }
                };

                // This could be a couple of different versions, but is now
                // stable in the latter format.
                const isExecutingStep =
                  (store as any).executingStep ||
                  (store as any).execution?.executingStep;

                const stepId = `publish:${publishOpts.channel}:${publishIndex++}`;

                return (
                  isExecutingStep
                    ? action()
                    : step.run(stepId, action)
                ).then(() => {
                  // Always return the data passed in to the `publish` call.

                  return data;
                });
              };

              return {
                ctx: {
                  /**
                   * TODO
                   */
                  publish,
                },
              };
            },
          };
        },
      };
    },
  });
};

// Re-export types from here, as this is used as a separate entrypoint now
export * from "./types";
