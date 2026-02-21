/**
 * Собирает расширение и создаёт ZIP-архив для распространения.
 * Использование: bun run scripts/pack.ts
 *
 * Production переменные задаются перед сборкой.
 * Переопределение: EXTENSION_API_URL=... EXTENSION_API_BASE=... bun run pack
 */

import { existsSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { $ } from "bun";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");
const distDir = join(rootDir, "dist");
const archiveName = "recruitment-assistant-extension.zip";
const archivePath = join(rootDir, archiveName);
const crxName = "recruitment-assistant-extension.crx";
const crxPath = join(rootDir, crxName);
const keyPath = join(rootDir, "extension-key.pem");

const PRODUCTION_API_URL = "https://app.avtonaim.qbsoft.ru";
const PRODUCTION_EXTENSION_API_BASE =
  "https://hooks.avtonaim.qbsoft.ru/ext-api";

async function main(): Promise<void> {
  const apiUrl = process.env.EXTENSION_API_URL ?? PRODUCTION_API_URL;
  const apiBase =
    process.env.EXTENSION_API_BASE ?? PRODUCTION_EXTENSION_API_BASE;

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

  // Создаём .crx файл
  await createCrxFile();
}

/**
 * Создаёт .crx файл из директории dist используя chrome CLI
 */
async function createCrxFile(): Promise<void> {
  console.log("\nCreating .crx file...");

  // Генерируем ключ, если его нет
  if (!existsSync(keyPath)) {
    console.log("Generating private key...");
    await $`openssl genrsa 2048`.text().then((key) => Bun.write(keyPath, key));
    console.log(`✓ Private key created: ${keyPath}`);
    console.log("  ⚠️  Keep this file secure and don't commit it to git!");
  }

  if (existsSync(crxPath)) {
    rmSync(crxPath);
  }

  // Используем chrome/chromium для создания CRX
  const chromePaths = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`,
  ];

  const chromePath = chromePaths.find((p) => existsSync(p));

  if (!chromePath) {
    console.error(
      "\n❌ Chrome not found. Please install Chrome or use the ZIP file for manual installation.",
    );
    console.log("\nAlternative: Install the extension from the ZIP file:");
    console.log("  1. Extract the ZIP file");
    console.log("  2. Open chrome://extensions/");
    console.log("  3. Enable Developer mode");
    console.log("  4. Click 'Load unpacked' and select the extracted folder");
    return;
  }

  try {
    await $`"${chromePath}" --pack-extension="${distDir}" --pack-extension-key="${keyPath}"`;

    // Chrome создаёт .crx в родительской директории с именем папки
    const generatedCrxPath = `${distDir}.crx`;
    if (existsSync(generatedCrxPath)) {
      await Bun.write(crxPath, await Bun.file(generatedCrxPath).arrayBuffer());
      rmSync(generatedCrxPath);
    }

    console.log(`✓ CRX file created: ${crxName}`);
    console.log(`  Path: ${crxPath}`);
    console.log("\n📦 Installation:");
    console.log("  1. Drag and drop .crx file into chrome://extensions/");
    console.log("  2. Or use Chrome policy for enterprise deployment");
  } catch (err) {
    console.error("\n❌ Failed to create CRX file:", err);
    console.log("\nUse the ZIP file for manual installation instead.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
