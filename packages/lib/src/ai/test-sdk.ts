import { generateText, Output } from "ai";
import { z } from "zod";

async function test() {
  const result = await generateText({
    model: {} as any,
    output: Output.object({
      schema: z.object({
        foo: z.string(),
      }),
    }),
    prompt: "test",
  });
  console.log(result.output.foo);
}
