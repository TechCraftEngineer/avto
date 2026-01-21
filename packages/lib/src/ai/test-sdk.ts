import { generateText, output } from "ai";
import { z } from "zod";

async function test() {
  const result = await generateText({
    model: {} as any,
    output: output.object({
      schema: z.object({
        foo: z.string(),
      }),
    }),
    prompt: "test",
  });
  console.log(result.object.foo);
}
