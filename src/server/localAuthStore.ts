import bcrypt from 'bcryptjs';
import { RentiaDB, UserRecord } from './db/database';

export interface LocalUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  password_hash?: string;
  role: 'tenant' | 'landlord' | 'agency' | 'admin';
  is_active: boolean;
  is_verified: boolean;
  preferred_lang: string;
  avatar_url?: string;
  trust_score?: number;
  created_at: string;
}

// Initial demo users available out-of-the-box
const localUsers = new Map<string, LocalUser>();

// Preload standard demo accounts
const defaultDemoAccounts: LocalUser[] = [
  {
    id: 'demo-tenant-01',
    name: 'Lucía Fernández',
    email: 'inquilino@rentia.com',
    phone: '+34 612 345 678',
    role: 'tenant',
    is_active: true,
    is_verified: true,
    preferred_lang: 'es',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    trust_score: 94,
    created_at: new Date().toISOString(),
  },
  {
    id: 'demo-landlord-01',
    name: 'Carlos Mendoza',
    email: 'propietario@rentia.com',
    phone: '+34 622 987 654',
    role: 'landlord',
    is_active: true,
    is_verified: true,
    preferred_lang: 'es',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    trust_score: 96,
    created_at: new Date().toISOString(),
  },
  {
    id: 'demo-agency-01',
    name: 'Inmobiliaria Premier España',
    email: 'agencia@rentia.com',
    phone: '+34 633 456 789',
    role: 'agency',
    is_active: true,
    is_verified: true,
    preferred_lang: 'es',
    avatar_url: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&auto=format&fit=crop&q=80',
    trust_score: 98,
    created_at: new Date().toISOString(),
  },
  {
    id: 'super-admin-soullis',
    name: 'Administrador Principal',
    email: 'soullis10@gmail.com',
    phone: '+34 600 000 010',
    role: 'admin',
    is_active: true,
    is_verified: true,
    preferred_lang: 'es',
    avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=80',
    trust_score: 100,
    created_at: new Date().toISOString(),
  },
  {
    id: 'super-admin-soullis8',
    name: 'Administrador Rentia',
    email: 'soullis8@gmail.com',
    phone: '+34 600 000 008',
    role: 'admin',
    is_active: true,
    is_verified: true,
    preferred_lang: 'es',
    avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=80',
    trust_score: 100,
    created_at: new Date().toISOString(),
  },
  {
    id: 'super-admin-direct',
    name: 'Administrador Principal Rentia',
    email: 'admin@rentia.es',
    phone: '+34 600 000 001',
    role: 'admin',
    is_active: true,
    is_verified: true,
    preferred_lang: 'es',
    avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=80',
    trust_score: 100,
    created_at: new Date().toISOString(),
  }
];

defaultDemoAccounts.forEach(u => {
  localUsers.set(u.email.toLowerCase(), u);
});

export function findLocalUserByEmail(email: string): LocalUser | undefined {
  const cleanEmail = email.trim().toLowerCase();
  const dbUser = RentiaDB.getUserByEmail(cleanEmail);
  if (!dbUser) {
    localUsers.delete(cleanEmail);
    return undefined;
  }

  const memoryUser = localUsers.get(cleanEmail);
  const converted: LocalUser = {
    id: dbUser.id,
    name: dbUser.name,
    email: dbUser.email,
    phone: dbUser.phone,
    password_hash: dbUser.password_hash || memoryUser?.password_hash,
    role: dbUser.role,
    is_active: dbUser.is_active,
    is_verified: dbUser.is_verified,
    preferred_lang: dbUser.preferred_lang || 'es',
    avatar_url: dbUser.avatar_url,
    trust_score: dbUser.trust_score,
    created_at: dbUser.created_at,
  };
  localUsers.set(cleanEmail, converted);
  return converted;
}

export function findLocalUserByPhone(phone: string): LocalUser | undefined {
  if (!phone) return undefined;
  const clean = phone.replace(/[\s\-\(\)\.]/g, '').trim();
  const rawDigits = clean.replace(/\+/g, '');

  for (const user of localUsers.values()) {
    if (!user.phone) continue;
    const uClean = user.phone.replace(/[\s\-\(\)\.]/g, '').trim();
    const uDigits = uClean.replace(/\+/g, '');
    if (uClean === clean || uDigits === rawDigits || (uDigits.length >= 9 && rawDigits.length >= 9 && (uDigits.endsWith(rawDigits) || rawDigits.endsWith(uDigits)))) {
      return user;
    }
  }

  // Fallback to persistent RentiaDB
  const dbUser = RentiaDB.getUserByPhone(clean);
  if (dbUser) {
    const converted: LocalUser = {
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      phone: dbUser.phone,
      password_hash: dbUser.password_hash,
      role: dbUser.role,
      is_active: dbUser.is_active,
      is_verified: dbUser.is_verified,
      preferred_lang: dbUser.preferred_lang || 'es',
      avatar_url: dbUser.avatar_url,
      trust_score: dbUser.trust_score,
      created_at: dbUser.created_at,
    };
    localUsers.set(converted.email.toLowerCase(), converted);
    return converted;
  }

  return undefined;
}

export function findLocalUserById(id: string): LocalUser | undefined {
  for (const user of localUsers.values()) {
    if (user.id === id) return user;
  }
  const dbUser = RentiaDB.getUserById(id);
  if (dbUser) {
    const converted: LocalUser = {
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      phone: dbUser.phone,
      password_hash: dbUser.password_hash,
      role: dbUser.role,
      is_active: dbUser.is_active,
      is_verified: dbUser.is_verified,
      preferred_lang: dbUser.preferred_lang || 'es',
      avatar_url: dbUser.avatar_url,
      trust_score: dbUser.trust_score,
      created_at: dbUser.created_at,
    };
    localUsers.set(converted.email.toLowerCase(), converted);
    return converted;
  }
  return undefined;
}

export function getAllLocalUsers(): LocalUser[] {
  return Array.from(localUsers.values());
}

export function registerLocalUser(userData: {
  name: string;
  email: string;
  password?: string;
  phone?: string;
  role?: 'tenant' | 'landlord' | 'agency' | 'admin';
  preferred_lang?: string;
  avatar_url?: string;
}): LocalUser {
  const cleanEmail = userData.email.trim().toLowerCase();
  const cleanPhone = userData.phone ? userData.phone.replace(/[\s\-\(\)\.]/g, '').trim() : '';

  // Strict Uniqueness Check
  const emailExisting = findLocalUserByEmail(cleanEmail);
  if (emailExisting) {
    const roleLabel = emailExisting.role === 'tenant' ? 'Inquilino' : emailExisting.role === 'agency' ? 'Agencia Inmobiliaria' : emailExisting.role === 'landlord' ? 'Propietario' : 'Administrador';
    throw new Error(`EMAIL_ALREADY_EXISTS: Este correo electrónico ya está registrado en Rentia (asociado a un perfil de ${roleLabel}). Un único correo por cuenta, no se puede duplicar.`);
  }

  if (cleanPhone) {
    const phoneExisting = findLocalUserByPhone(cleanPhone);
    if (phoneExisting) {
      const roleLabel = phoneExisting.role === 'tenant' ? 'Inquilino' : phoneExisting.role === 'agency' ? 'Agencia Inmobiliaria' : phoneExisting.role === 'landlord' ? 'Propietario' : 'Administrador';
      throw new Error(`PHONE_ALREADY_EXISTS: Este número de teléfono ya está asociado a otra cuenta (perfil de ${roleLabel}). Cada cuenta debe tener un teléfono único.`);
    }
  }

  const id = `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const passwordHash = userData.password ? bcrypt.hashSync(userData.password, 10) : undefined;

  const newUser: LocalUser = {
    id,
    name: userData.name || cleanEmail.split('@')[0],
    email: cleanEmail,
    phone: cleanPhone || '+34 600 000 000',
    password_hash: passwordHash,
    role: userData.role || 'tenant',
    is_active: true,
    is_verified: true,
    preferred_lang: userData.preferred_lang || 'es',
    avatar_url: userData.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    trust_score: 85,
    created_at: new Date().toISOString(),
  };

  localUsers.set(cleanEmail, newUser);

  // Persist to RentiaDB
  RentiaDB.saveUser({
    id: newUser.id,
    email: newUser.email,
    name: newUser.name,
    phone: newUser.phone,
    password_hash: passwordHash,
    role: newUser.role,
    is_active: newUser.is_active,
    is_verified: newUser.is_verified,
    preferred_lang: newUser.preferred_lang,
    avatar_url: newUser.avatar_url,
    trust_score: newUser.trust_score,
  });

  return newUser;
}

export function createLocalToken(user: LocalUser): string {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
  };
  return 'rentia_local_' + Buffer.from(JSON.stringify(payload)).toString('base64');
}

export function verifyLocalToken(token: string): LocalUser | null {
  if (!token.startsWith('rentia_local_')) {
    return findLocalUserById(token) || findLocalUserByEmail(token) || null;
  }
  try {
    const raw = token.replace('rentia_local_', '');
    const decoded = JSON.parse(Buffer.from(raw, 'base64').toString('utf-8'));
    if (decoded.exp && decoded.exp < Date.now()) {
      return null;
    }
    const user = findLocalUserById(decoded.id) || findLocalUserByEmail(decoded.email);
    if (user) return user;

    return {
      id: decoded.id,
      name: decoded.name || decoded.email.split('@')[0],
      email: decoded.email,
      role: decoded.role || 'tenant',
      is_active: true,
      is_verified: true,
      preferred_lang: 'es',
      created_at: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function deleteLocalUser(userIdOrEmail: string): boolean {
  const clean = userIdOrEmail.trim().toLowerCase();
  for (const [email, user] of localUsers.entries()) {
    if (user.id === userIdOrEmail || email.toLowerCase() === clean || user.email.toLowerCase() === clean) {
      localUsers.delete(email);
      RentiaDB.deleteUserPermanently(user.id);
      return true;
    }
  }
  RentiaDB.deleteUserPermanently(userIdOrEmail);
  return true;
}
