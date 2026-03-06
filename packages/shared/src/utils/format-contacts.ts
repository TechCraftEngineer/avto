import { formatPhone } from "@qbs-autonaim/validators";

export interface Contact {
  raw?: string;
  formatted?: string;
  [key: string]: unknown;
}

export interface ContactsData {
  phone?: Contact[];
  email?: Contact[];
  telegram?: Contact[];
  [key: string]: Contact[] | undefined;
}

/**
 * Извлекает primary строку из Contact[] (raw или formatted первого элемента).
 */
function contactArrayToPrimary(arr: Contact[] | undefined): string | undefined {
  if (!Array.isArray(arr) || arr.length === 0) return undefined;
  const first = arr[0];
  if (!first || typeof first !== "object") return undefined;
  const raw = first.raw;
  const formatted = first.formatted;
  if (typeof raw === "string" && raw.trim()) return raw.trim();
  if (typeof formatted === "string" && formatted.trim())
    return formatted.trim();
  return undefined;
}

/**
 * Преобразует string или Contact в Contact.
 */
function toContact(val: string | Contact): Contact {
  if (typeof val === "string") return { raw: val, formatted: val };
  if (val && typeof val === "object" && (val.raw || val.formatted))
    return val as Contact;
  return { raw: String(val) };
}

/**
 * Нормализует значение поля контактов (string | Contact | Contact[]) в Contact[].
 */
function normalizeField(val: unknown): Contact[] | undefined {
  if (val == null) return undefined;
  if (Array.isArray(val)) {
    const arr: Contact[] = [];
    for (const item of val) {
      if (typeof item === "string") arr.push(toContact(item));
      else if (item && typeof item === "object" && (item.raw || item.formatted))
        arr.push(item as Contact);
    }
    return arr.length > 0 ? arr : undefined;
  }
  if (typeof val === "string" && val.trim()) return [toContact(val.trim())];
  if (val && typeof val === "object" && "raw" in val) return [val as Contact];
  return undefined;
}

/**
 * Нормализует входящие контакты (string | array | mixed) в канонический ContactsData.
 * Валидирует типы полей и приводит строки к Contact[].
 */
export function normalizeToContactsData(input: unknown): ContactsData | null {
  if (!input || typeof input !== "object") return null;

  const obj = input as Record<string, unknown>;
  const result: ContactsData = {};

  const keys = ["email", "phone", "telegram"] as const;
  for (const key of keys) {
    const normalized = normalizeField(obj[key]);
    if (normalized && normalized.length > 0) result[key] = normalized;
  }

  return Object.keys(result).length > 0 ? result : null;
}

/**
 * Форматирует контакты, добавляя formatted поле для телефонов.
 */
export function formatContacts(
  contacts: ContactsData | unknown,
): ContactsData | null {
  const normalized = normalizeToContactsData(contacts);
  if (!normalized) return null;

  const result: ContactsData = {};

  for (const [key, items] of Object.entries(normalized)) {
    if (!Array.isArray(items) || items.length === 0) continue;

    if (key === "phone") {
      result.phone = items.map((contact) => {
        if (contact.raw) {
          try {
            const formatted = formatPhone(contact.raw);
            return { ...contact, formatted };
          } catch {
            return {
              ...contact,
              formatted: contact.formatted || contact.raw,
            };
          }
        }
        if (contact.formatted) return contact;
        return contact;
      });
    } else {
      result[key] = items;
    }
  }

  return Object.keys(result).length > 0 ? result : null;
}

/**
 * Безопасно объединяет existing и incoming контакты.
 * Не перезаписывает массивы строками — всегда нормализует к Contact[].
 */
export function mergeContacts(
  existing: unknown,
  incoming: ContactsData,
): ContactsData {
  const existingNorm = normalizeToContactsData(existing) ?? {};
  const result: ContactsData = {};

  const keys = ["email", "phone", "telegram"] as const;
  for (const key of keys) {
    const existingArr = existingNorm[key];
    const incomingArr = incoming[key];

    const merged: Contact[] = [];
    const seen = new Set<string>();

    const add = (c: Contact) => {
      const r = c.raw ?? c.formatted ?? "";
      const k = String(r).toLowerCase();
      if (k && !seen.has(k)) {
        seen.add(k);
        merged.push(c);
      }
    };

    if (incomingArr?.length) {
      for (const c of incomingArr) add(c);
    }
    if (existingArr?.length) {
      for (const c of existingArr) add(c);
    }
    if (merged.length > 0) result[key] = merged;
  }

  return result;
}

/**
 * Извлекает primary phone/telegram/email для scalar полей response.
 */
export function getPrimaryContacts(contacts: ContactsData): {
  phone?: string;
  telegram?: string;
  email?: string;
} {
  return {
    phone: contactArrayToPrimary(contacts.phone),
    telegram: contactArrayToPrimary(contacts.telegram),
    email: contactArrayToPrimary(contacts.email),
  };
}
