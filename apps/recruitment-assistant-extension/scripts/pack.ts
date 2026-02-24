/**
 * Собирает расширение и создаёт ZIP-архив для распространения.
 * Использование: bun run scripts/pack.ts
 *
 * Production переменные задаются перед сборкой.
 * Переопределение: EXTENSION_API_URL=... EXTENSION_API_BASE=... bun run pack
 */

import { existsSync, readFileSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { $ } from "bun";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");
const distDir = join(rootDir, "dist");

const PRODUCTION_API_URL = "https://app.avtonaim.qbsoft.ru";
const PRODUCTION_EXTENSION_API_BASE = "https://ext-api.avtonaim.qbsoft.ru";

async function main(): Promise<void> {
  const bumpType = process.env.BUMP_VERSION || "patch";

  if (bumpType !== "skip") {
    console.log(`Bumping version (${bumpType})...`);
    await $`bun run ${join(__dirname, "bump-version.ts")} ${bumpType}`.cwd(
      rootDir,
    );
  } else {
    console.log("Пропуск обновления версии");
  }

  const pkg = JSON.parse(
    readFileSync(join(rootDir, "package.json"), "utf-8"),
  ) as { version: string };
  const archiveName = `recruitment-assistant-extension-${pkg.version}.zip`;
  const archivePath = join(rootDir, archiveName);

  const apiUrl = process.env.EXTENSION_API_URL ?? PRODUCTION_API_URL;
  const apiBase =
    process.env.EXTENSION_API_BASE ?? PRODUCTION_EXTENSION_API_BASE;

  console.log("\nBuilding extension (production)...");
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
    // PowerShell Compress-Archive с правильным путём к содержимому
    const distContent = `${distDir}\\*`;
    await $`powershell -NoProfile -ExecutionPolicy Bypass -Command "Compress-Archive -Path '${distContent}' -DestinationPath '${archivePath}' -CompressionLevel Optimal -Force"`;
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
