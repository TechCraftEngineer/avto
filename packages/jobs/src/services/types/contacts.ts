/**
 * HH.ru contacts structure types
 */

export interface HHContactPhone {
  formatted?: string;
  raw?: string;
  country?: string;
  city?: string;
  number?: string;
  comment?: string | null;
}

export interface HHContactEmail {
  email?: string;
  preferred?: boolean;
  type?: {
    id: string;
    name: string;
  };
}

export interface HHContactType {
  id: string;
  name: string;
}

export interface HHPreferredContact {
  type: HHContactType;
  value?: string;
  preferred?: boolean;
  comment?: string | null;
}

/**
 * Full contacts structure from HH.ru API
 */
export interface HHContacts {
  phone?: HHContactPhone[];
  email?: HHContactEmail[] | string;
  preferred?: HHPreferredContact[];
  personal?: HHPreferredContact[];
}

/**
 * Extracted contact data
 */
export interface ExtractedContacts {
  phone: string | null;
  email: string | null;
  telegram: string | null;
  whatsapp: string | null;
}
