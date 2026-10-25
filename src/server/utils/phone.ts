/**
 * Phone number normalization utility for Spain and International formats.
 * Ensures consistent comparison and prevents duplicate phone accounts created with different formatting.
 */
export function normalizePhone(rawPhone?: string | null): string {
  if (!rawPhone || typeof rawPhone !== 'string') return '';
  
  // Strip whitespace, dashes, parentheses, dots
  let cleaned = rawPhone.trim().replace(/[\s\-\(\)\.]/g, '');

  if (cleaned.startsWith('00')) {
    cleaned = '+' + cleaned.substring(2);
  }

  // If a 9-digit Spanish mobile or landline number without country code
  if (/^[6789]\d{8}$/.test(cleaned)) {
    cleaned = '+34' + cleaned;
  }

  return cleaned;
}

/**
 * Checks whether two phone numbers refer to the same telephone line.
 */
export function arePhonesEqual(phoneA?: string | null, phoneB?: string | null): boolean {
  if (!phoneA || !phoneB) return false;
  
  const normA = normalizePhone(phoneA);
  const normB = normalizePhone(phoneB);
  if (normA && normB && normA === normB) return true;

  const rawCleanA = phoneA.replace(/\D/g, '');
  const rawCleanB = phoneB.replace(/\D/g, '');
  if (rawCleanA && rawCleanB) {
    if (rawCleanA === rawCleanB) return true;
    // Check if one has Spanish country code 34 and other does not
    if (rawCleanA.length === 11 && rawCleanA.startsWith('34') && rawCleanA.substring(2) === rawCleanB) return true;
    if (rawCleanB.length === 11 && rawCleanB.startsWith('34') && rawCleanB.substring(2) === rawCleanA) return true;
  }

  return false;
}
