import type { Realtime } from "@bunworks/inngest-realtime";

/**
 * Создает mock токен для тестирования компонентов с Inngest Realtime
 */
export function createMockToken(
  channelName: string,
  topics: string[],
): Realtime.Subscribe.Token<
  Realtime.Channel<string, Record<string, Realtime.Topic.Definition>>,
  string[]
> {
  return {
    channel: {
      name: channelName,
      topics: {},
    } as Realtime.Channel<string, Record<string, Realtime.Topic.Definition>>,
    topics,
    key: "test-token",
  };
}
