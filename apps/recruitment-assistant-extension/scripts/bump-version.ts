/**
 * Обновляет версию в package.json и manifest.json
 * Использование: bun run scripts/bump-version.ts [patch|minor|major]
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");

type BumpType = "patch" | "minor" | "major";

function bumpVersion(version: string, type: BumpType): string {
  const [major, minor, patch] = version.split(".").map(Number);

  switch (type) {
    case "major":
      return `${major + 1}.0.0`;
    case "minor":
      return `${major}.${minor + 1}.0`;
    case "patch":
      return `${major}.${minor}.${patch + 1}`;
  }
}

async function main(): Promise<void> {
  const bumpType = (process.argv[2] || "patch") as BumpType;

  if (!["patch", "minor", "major"].includes(bumpType)) {
    console.error(
      "Использование: bun run scripts/bump-version.ts [patch|minor|major]",
    );
    process.exit(1);
  }

  const packageJsonPath = join(rootDir, "package.json");
  const manifestJsonPath = join(rootDir, "manifest.json");

  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
  const manifestJson = JSON.parse(readFileSync(manifestJsonPath, "utf-8"));

  const oldVersion = packageJson.version;
  const newVersion = bumpVersion(oldVersion, bumpType);

  packageJson.version = newVersion;
  manifestJson.version = newVersion;

  writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + "\n");
  writeFileSync(manifestJsonPath, JSON.stringify(manifestJson, null, 2) + "\n");

  console.log(`✓ Версия обновлена: ${oldVersion} → ${newVersion}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
