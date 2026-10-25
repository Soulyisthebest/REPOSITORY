import crypto from 'crypto';

// Alphabet without ambiguous characters (0, O, 1, I)
const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateLeaseCode(): string {
  let code = '';
  const randomBytes = crypto.randomBytes(6);
  for (let i = 0; i < 6; i++) {
    const randomIndex = randomBytes[i] % CHARSET.length;
    code += CHARSET[randomIndex];
  }
  return code;
}

