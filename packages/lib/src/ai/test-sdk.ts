import { generateText } from "ai";
import { z } from "zod";

async function test() {
  const result = await generateText({
    model: {} as any,
    output: "object" as any,
    schema: z.object({
      foo: z.string(),
    }) as any,
    prompt: "test",
  });
  // @ts-ignore
  console.log(result.object.foo);
}
