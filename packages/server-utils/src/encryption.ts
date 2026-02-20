/**
 * Encryption utilities for sensitive data
 * Uses AES-256-GCM for secure encryption
 */

import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scrypt,
} from "node:crypto";

/**
 * Encryption configuration
 */
const ENCRYPTION_CONFIG = {
  algorithm: "aes-256-gcm",
  keyLength: 32, // 256 bits
  ivLength: 16, // 128 bits
  tagLength: 16, // 128 bits
  // Параметры снижены для окружений с ограниченной памятью (Vercel, Docker).
  // N=8192 (~8MB) обеспечивает достаточную стойкость для шифрования API-ключей.
  scryptParams: {
    N: 8192, // CPU/memory cost (было 32768 — вызывало memory limit exceeded)
    r: 8, // block size
    p: 1, // parallelization
  },
} as const;

/**
 * Derives encryption key from password using scrypt
 */
async function deriveKey(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(
      password,
      salt,
      ENCRYPTION_CONFIG.keyLength,
      ENCRYPTION_CONFIG.scryptParams,
      (err, derivedKey) => {
        if (err) reject(err);
        else resolve(derivedKey);
      },
    );
  });
}

/**
 * Encrypts sensitive data
 * @param data - Data to encrypt
 * @param password - Encryption password (from env)
 * @returns Encrypted data with metadata
 */
export async function encryptSensitiveData(
  data: string,
  password: string,
): Promise<string> {
  try {
    // Generate salt and IV
    const salt = randomBytes(16);
    const iv = randomBytes(ENCRYPTION_CONFIG.ivLength);

    // Derive key
    const key = await deriveKey(password, salt);

    // Create cipher
    const cipher = createCipheriv(ENCRYPTION_CONFIG.algorithm, key, iv);

    // Encrypt data
    let encrypted = cipher.update(data, "utf8", "hex");
    encrypted += cipher.final("hex");

    // Get authentication tag
    const tag = cipher.getAuthTag();

    // Combine all components
    const combined = Buffer.concat([
      salt,
      iv,
      tag,
      Buffer.from(encrypted, "hex"),
    ]);

    return combined.toString("base64");
  } catch (error) {
    throw new Error(
      `Encryption failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Decrypts sensitive data
 * @param encryptedData - Encrypted data
 * @param password - Decryption password (from env)
 * @returns Decrypted data
 */
export async function decryptSensitiveData(
  encryptedData: string,
  password: string,
): Promise<string> {
  try {
    // Parse combined data
    const combined = Buffer.from(encryptedData, "base64");

    // Extract components
    const salt = combined.slice(0, 16);
    const iv = combined.slice(16, 16 + ENCRYPTION_CONFIG.ivLength);
    const tag = combined.slice(
      16 + ENCRYPTION_CONFIG.ivLength,
      16 + ENCRYPTION_CONFIG.ivLength + ENCRYPTION_CONFIG.tagLength,
    );
    const encrypted = combined.slice(
      16 + ENCRYPTION_CONFIG.ivLength + ENCRYPTION_CONFIG.tagLength,
    );

    // Derive key
    const key = await deriveKey(password, salt);

    // Create decipher
    const decipher = createDecipheriv(ENCRYPTION_CONFIG.algorithm, key, iv);
    decipher.setAuthTag(tag);

    // Decrypt data
    let decrypted = decipher.update(encrypted.toString("hex"), "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    throw new Error(
      `Decryption failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Encrypts API keys before storing
 */
export async function encryptApiKeys(
  apiData: {
    apiId: string;
    apiHash: string;
    sessionData?: Record<string, unknown>;
  },
  encryptionKey: string,
): Promise<{
  apiId: string;
  apiHash: string;
  sessionData?: string;
}> {
  return {
    apiId: await encryptSensitiveData(apiData.apiId, encryptionKey),
    apiHash: await encryptSensitiveData(apiData.apiHash, encryptionKey),
    sessionData: apiData.sessionData
      ? await encryptSensitiveData(
          JSON.stringify(apiData.sessionData),
          encryptionKey,
        )
      : undefined,
  };
}

/**
 * Decrypts API keys for use
 */
export async function decryptApiKeys(
  encryptedData: {
    apiId: string;
    apiHash: string;
    sessionData?: string;
  },
  encryptionKey: string,
): Promise<{
  apiId: string;
  apiHash: string;
  sessionData?: Record<string, unknown>;
}> {
  return {
    apiId: await decryptSensitiveData(encryptedData.apiId, encryptionKey),
    apiHash: await decryptSensitiveData(encryptedData.apiHash, encryptionKey),
    sessionData: encryptedData.sessionData
      ? JSON.parse(
          await decryptSensitiveData(encryptedData.sessionData, encryptionKey),
        )
      : undefined,
  };
}

/**
 * Checks if data appears to be encrypted (base64 format)
 */
export function isEncrypted(data: string): boolean {
  try {
    const decoded = Buffer.from(data, "base64");
    // Minimum size check: salt(16) + iv(16) + tag(16) + some data
    return decoded.length >= 48;
  } catch {
    return false;
  }
}

/**
 * Gets encryption key from environment
 */
export function getEncryptionKey(): string {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error("ENCRYPTION_KEY environment variable is not set");
  }
  return key;
}
