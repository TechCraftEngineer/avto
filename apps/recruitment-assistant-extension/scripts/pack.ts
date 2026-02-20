/**
 * Собирает расширение и создаёт ZIP-архив для распространения.
 * Использование: bun run scripts/pack.ts
 *
 * Production переменные задаются перед сборкой.
 * Переопределение: EXTENSION_API_URL=... EXTENSION_API_BASE=... bun run pack
 */
import { $ } from "bun";
import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");
const distDir = join(rootDir, "dist");
const archiveName = "recruitment-assistant-extension.zip";
const archivePath = join(rootDir, archiveName);

const PRODUCTION_API_URL = "https://app.avtonaim.qbsoft.ru";
const PRODUCTION_EXTENSION_API_BASE = "https://app.avtonaim.qbsoft.ru";

async function main(): Promise<void> {
  const apiUrl = process.env.EXTENSION_API_URL ?? PRODUCTION_API_URL;
  const apiBase = process.env.EXTENSION_API_BASE ?? PRODUCTION_EXTENSION_API_BASE;

  console.log("Building extension (production)...");
  console.log(`  EXTENSION_API_URL=${apiUrl}`);
  console.log(`  EXTENSION_API_BASE=${apiBase}`);

  await $`bun run build`.cwd(rootDir).env({
    ...process.env,
    EXTENSION_API_URL: apiUrl,
    EXTENSION_API_BASE: apiBase,
  });

  if (!existsSync(distDir)) {
    console.error("Build failed: dist/ not found");
    process.exit(1);
  }

  if (existsSync(archivePath)) {
    rmSync(archivePath);
  }

  const isWindows = process.platform === "win32";
  if (isWindows) {
    await $`powershell -NoProfile -Command "Compress-Archive -Path '${distDir}\\*' -DestinationPath '${archivePath}' -Force"`;
  } else {
    await $`cd ${distDir} && zip -r ${archivePath} .`;
  }

  console.log(`\n✓ Archive created: ${archiveName}`);
  console.log(`  Path: ${archivePath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
