import { createConnection } from "node:net";

/**
 * Отправляет контент на termbin.com и возвращает URL для просмотра.
 * Используется для отладки — сохраняет верстку страниц для последующего анализа.
 *
 * @see https://termbin.com/
 */
export async function uploadToTermbin(content: string): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const client = createConnection(9999, "termbin.com", () => {
      client.write(content, "utf8", () => {
        client.end();
      });
    });

    let result = "";
    client.on("data", (data: Buffer) => {
      result += data.toString("utf8");
    });
    client.on("end", () => {
      const url = result.trim();
      resolve(url || null);
    });
    client.on("error", (err) => {
      reject(err);
    });
  });
}
