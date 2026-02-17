/**
 * Генерирует иконки для расширения (16x16, 48x48, 128x128)
 * Цвет #2563eb — синий, как кнопка в расширении
 */
import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");
// Передайте "dist" как аргумент для вывода в папку сборки
const outDir = process.argv[2] ?? process.env.OUT_DIR ?? "public";
const iconsDir = join(rootDir, outDir, "icons");

async function createIcon(size: number): Promise<Buffer> {
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" rx="${Math.max(2, size / 8)}" fill="#2563eb"/>
    </svg>
  `;
  return sharp(Buffer.from(svg))
    .png()
    .toBuffer();
}

async function main(): Promise<void> {
  await mkdir(iconsDir, { recursive: true });

  for (const size of [16, 48, 128]) {
    const png = await createIcon(size);
    await writeFile(join(iconsDir, `icon${size}.png`), png);
    console.log(`Created icon${size}.png in ${outDir}/icons/`);
  }
}

main().catch(console.error);
