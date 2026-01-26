import { generateSlug as generateRandomSlug } from "random-word-slugs";

export function generateSlug(): string {
  return generateRandomSlug(3, {
    format: "kebab",
    categories: {
      adjective: ["personality", "appearance"],
      noun: ["animals"],
    },
  });
}
