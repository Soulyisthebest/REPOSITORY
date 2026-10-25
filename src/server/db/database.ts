import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { getSupabaseAdmin, isSupabaseConfigured } from '../supabase';
import { SEED_LISTINGS } from '../../data/seedListings';
import { SEED_TENANTS } from '../../data/seedTenants';

const PROPERTY_TYPE_MAP: Record<string, string> = {
  piso: '6008fdcd-3a50-4f0f-8975-ba72dbfafe52',
  apartment: '6008fdcd-3a50-4f0f-8975-ba72dbfafe52',
  apartamento: '6008fdcd-3a50-4f0f-8975-ba72dbfafe52',
  estudio: '9635c953-25dc-4f12-b1bc-e592b6c80b86',
  studio: '9635c953-25dc-4f12-b1bc-e592b6c80b86',
  casa: 'e88fb132-2ad5-4db3-9915-8cbd4e03fb5b',
  house: 'e88fb132-2ad5-4db3-9915-8cbd4e03fb5b',
  chalet: 'e88fb132-2ad5-4db3-9915-8cbd4e03fb5b',
  villa: 'e88fb132-2ad5-4db3-9915-8cbd4e03fb5b',
  habitacion: '0d2e9a58-cbf9-4239-901c-700ab0d75de8',
  room: '0d2e9a58-cbf9-4239-901c-700ab0d75de8',
};

export interface LoginRecord {
  id: string;
  user_id: string;
  email: string;
  role: string;
  status: 'success' | 'failed' | 'blocked';
  ip_address: string;
  user_agent: string;
  device_type: string; // 'Móvil' | 'Tablet' | 'Escritorio' | 'Desconocido'
  browser: string;
  os: string;
  login_method: string;
  failure_reason?: string;
  session_id?: string;
  country?: string;
  created_at: string;
}

export interface SessionRecord {
  id: string; // sessionId
  user_id: string;
  email: string;
  role: string;
  started_at: string;
  last_heartbeat_at: string;
  ended_at?: string;
  duration_seconds: number;
  active_duration_seconds: number;
  idle_duration_seconds: number;
  pages_viewed_count: number;
  current_page: string;
  device_type: string;
  browser: string;
  os: string;
  ip_address: string;
  is_active: boolean;
}

export interface ActivityRecord {
  id: string;
  session_id?: string;
  user_id: string;
  email: string;
  action: string;
  category: 'auth' | 'navigation' | 'contract' | 'matching' | 'payment' | 'admin' | 'general';
  path?: string;
  details?: Record<string, any>;
  created_at: string;
}

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  role: 'tenant' | 'landlord' | 'agency' | 'admin';
  phone?: string;
  password_hash?: string;
  is_active: boolean;
  is_verified: boolean;
  verification_status?: 'unverified' | 'pending_admin' | 'verified' | 'rejected';
  dni_url?: string;
  selfie_url?: string;
  id_document_number?: string;
  preferred_lang?: string;
  avatar_url?: string;
  trust_score?: number;
  created_at: string;
  updated_at?: string;
}

export interface TenantProfileRecord {
  id: string;
  user_id: string;
  email: string;
  name: string;
  full_name?: string;
  phone?: string;
  birth_date?: string;
  age?: number;
  nationality?: string;
  id_document?: string;
  id_number?: string;
  monthly_income: number;
  employment_type: string;
  contract_type?: string;
  employer_name?: string;
  seniority_years?: number;
  current_city: string;
  target_city?: string;
  max_budget: number;
  has_guarantor: boolean;
  guarantor_name?: string;
  guarantor_income?: number;
  pets: boolean;
  has_pets?: boolean;
  smokers: boolean;
  is_smoker?: boolean;
  bio?: string;
  trust_score: number;
  verified_docs_count?: number;
  has_payslips?: boolean;
  occupants_count?: number;
  has_children?: boolean;
  pet_details?: string;
  desired_move_in_date?: string;
  desired_contract_duration?: string;
  previous_landlord_reference?: string;
  income_to_rent_ratio?: number;
  locations?: string[];
  is_active?: boolean;
  is_verified?: boolean;
  verification_status?: 'unverified' | 'pending_admin' | 'verified' | 'rejected';
  dni_url?: string;
  selfie_url?: string;
  avatar_url?: string;
  photos?: string[];
  household_type?: string;
  has_minors?: boolean;
  pet_type?: string;
  pets_count?: number;
  property_types?: string[];
  search_purpose?: string;
  desired_rooms?: string;
  desired_bathrooms?: string;
  min_budget?: number;
  stretch_budget?: number;
  utilities_included?: { community?: boolean; water?: boolean; electricity?: boolean; internet?: boolean };
  target_neighborhoods?: string[];
  search_radius_km?: number;
  max_commute_minutes?: number;
  transport_mode?: string;
  essential_amenities?: string[];
  amenity_priorities?: Record<string, string>;
  smoking?: string;
  remote_work?: string;
  lifestyle_vibe?: string;
  wants_roommates?: string;
  room_preferences?: any;
  income_range?: string;
  can_provide_docs?: string;
  move_in_date?: string;
  rental_duration?: string;
  onboarding_completed?: boolean;
  created_at: string;
  updated_at?: string;
}

export interface ListingRecord {
  id: string;
  landlord_id: string;
  landlord_name?: string;
  landlord_email?: string;
  landlord_phone?: string;
  title: string;
  description?: string;
  address: string;
  city: string;
  postal_code?: string;
  rent: number;
  deposit: number;
  min_income?: number;
  property_type: string;
  rental_duration_type?: 'long_term' | 'short_stay';
  duration_unit?: 'months' | 'years' | 'indefinite';
  duration_value?: number;
  available_from?: string;
  available_until?: string | null;
  is_indefinite?: boolean;
  is_scheduled?: boolean;
  scheduled_publish_at?: string | null;
  publishing_status?: 'published' | 'scheduled' | 'draft';
  bedrooms?: number;
  bathrooms?: number;
  square_meters?: number;
  photos: string[];
  amenities?: string[];
  is_active: boolean;
  status?: 'available' | 'rented' | 'inactive' | string;
  rented_at?: string;
  is_verified: boolean;
  created_at: string;
  updated_at?: string;
}

export interface LeaseRecord {
  id: string;
  user_id: string;
  code: string;
  address: string;
  city: string;
  postal_code?: string;
  country: string;
  currency: string;
  property_type: string;
  rent: number;
  deposit: number;
  start_date: string;
  end_date: string;
  owner_name_guess: string;
  owner_contact?: string;
  tenant_photo_url?: string;
  tenant_contact_phone?: string;
  tenant_contact_email?: string;
  contract_file_url?: string;
  location_details?: {
    street?: string;
    city?: string;
    postal_code?: string;
    province?: string;
    country?: string;
    coordinates?: [number, number];
  };
  status: 'pending' | 'verified' | 'rejected';
  crypto_hash?: string;
  confirmed_at?: string;
  verifications?: any[];
  created_at: string;
  updated_at?: string;
}

export interface OwnershipVerificationRecord {
  id: string;
  landlord_id: string;
  landlord_email: string;
  landlord_name?: string;
  listing_id?: string;
  property_address: string;
  city: string;
  reference_cadastral?: string;
  verification_type: string;
  status: 'pending' | 'verified' | 'rejected';
  document_url?: string;
  notes?: string;
  rejection_reason?: string;
  created_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
}

export interface SwipeRecord {
  id: string;
  actor_id: string;
  actor_role: 'tenant' | 'landlord';
  target_id?: string; // listing_id or tenant_user_id
  target_user_id?: string;
  listing_id?: string;
  action: 'like' | 'pass';
  created_at: string;
}

export interface MatchRecord {
  id: string;
  tenant_id: string;
  landlord_id: string;
  listing_id: string;
  status: 'active' | 'archived' | 'closed' | 'open';
  tenant_name?: string;
  landlord_name?: string;
  listing_title?: string;
  listing_city?: string;
  listing_rent?: number;
  landlord_first_message_sent?: boolean;
  score?: number;
  created_at: string;
  updated_at?: string;
}

export interface ChatMessageRecord {
  id: string;
  match_id: string;
  sender_id: string;
  sender_role?: 'tenant' | 'landlord' | 'admin';
  recipient_id?: string;
  content: string;
  read: boolean;
  created_at: string;
}

export interface BlockedEmailRecord {
  id: string;
  email: string;
  reason?: string;
  blocked_by?: string;
  blocked_at: string;
}

export interface ReportRecord {
  id: string;
  reporter_id: string;
  reporter_name?: string;
  reporter_email?: string;
  reporter_role?: string;
  target_type: 'listing' | 'tenant_profile' | 'user';
  target_id: string;
  target_title?: string;
  target_user_id?: string;
  target_user_email?: string;
  target_user_name?: string;
  reason: 'fake_content' | 'suspected_scam' | 'wrong_photos' | 'inappropriate_behavior' | 'price_fraud' | 'other';
  reason_label?: string;
  details: string;
  evidence_url?: string;
  status: 'pending' | 'reviewed' | 'action_taken' | 'dismissed';
  action_taken?: 'user_blocked' | 'listing_removed' | 'dismissed' | 'none';
  action_notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
}

export interface KycVerificationRecord {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  user_role: 'tenant' | 'landlord';
  id_document_number?: string;
  id_document_type?: 'DNI' | 'NIE' | 'Pasaporte';
  dni_front_url: string;
  dni_back_url?: string;
  selfie_url: string;
  selfie_with_id_url?: string;
  status: 'pending' | 'verified' | 'rejected';
  rejection_reason?: string;
  submitted_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
}

export interface RentiaNotificationRecord {
  id: string;
  user_id: string;
  type: 'property_like' | 'match_opened' | 'chat_message' | 'verification' | 'system';
  title: string;
  body: string;
  listing_id?: string;
  sender_name?: string;
  sender_email?: string;
  sender_avatar?: string;
  read: boolean;
  email_sent: boolean;
  email_recipient?: string;
  created_at: string;
}

interface DatabaseSchema {
  users: UserRecord[];
  tenant_profiles: TenantProfileRecord[];
  listings: ListingRecord[];
  leases: LeaseRecord[];
  ownership_verifications: OwnershipVerificationRecord[];
  swipes: SwipeRecord[];
  matches: MatchRecord[];
  chat_messages: ChatMessageRecord[];
  user_logins: LoginRecord[];
  user_sessions: SessionRecord[];
  user_activity_logs: ActivityRecord[];
  blocked_emails: BlockedEmailRecord[];
  notifications: RentiaNotificationRecord[];
  reports: ReportRecord[];
  kyc_verifications: KycVerificationRecord[];
  pending_sync_writes?: PendingSyncWriteRecord[];
  closed_accounts?: { email: string; phone?: string; closed_at: string }[];
}

export interface PendingSyncWriteRecord {
  id: string;
  route: string;
  operation: string;
  target_table: string;
  payload?: any;
  error: string;
  created_at: string;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'rentia_database.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-memory cache synced with disk
let databaseCache: DatabaseSchema = {
  users: [],
  tenant_profiles: [],
  listings: [],
  leases: [],
  ownership_verifications: [],
  swipes: [],
  matches: [],
  chat_messages: [],
  user_logins: [],
  user_sessions: [],
  user_activity_logs: [],
  blocked_emails: [],
  notifications: [],
  reports: [],
  kyc_verifications: [],
  pending_sync_writes: [],
  closed_accounts: [],
};

// Load initial data from disk
function loadDatabase(): void {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      databaseCache = {
        closed_accounts: Array.isArray(parsed.closed_accounts) ? parsed.closed_accounts : [],
        users: Array.isArray(parsed.users) ? parsed.users : [],
        tenant_profiles: Array.isArray(parsed.tenant_profiles) ? parsed.tenant_profiles : [],
        listings: Array.isArray(parsed.listings) ? parsed.listings : [],
        leases: Array.isArray(parsed.leases) ? parsed.leases : [],
        ownership_verifications: Array.isArray(parsed.ownership_verifications) ? parsed.ownership_verifications : [],
        swipes: (() => {
          const rawSwipes = Array.isArray(parsed.swipes) ? parsed.swipes : [];
          const seen = new Set<string>();
          return rawSwipes.filter((s: any) => {
            const key = `${s.actor_id}_${s.listing_id || s.target_id || s.target_user_id}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
        })(),
        matches: Array.isArray(parsed.matches) ? parsed.matches : [],
        chat_messages: Array.isArray(parsed.chat_messages) ? parsed.chat_messages : [],
        user_logins: Array.isArray(parsed.user_logins) ? parsed.user_logins : [],
        user_sessions: Array.isArray(parsed.user_sessions) ? parsed.user_sessions : [],
        user_activity_logs: Array.isArray(parsed.user_activity_logs) ? parsed.user_activity_logs : [],
        blocked_emails: Array.isArray(parsed.blocked_emails) ? parsed.blocked_emails : [],
        notifications: Array.isArray(parsed.notifications) ? parsed.notifications : [],
        reports: Array.isArray(parsed.reports) ? parsed.reports : [],
        kyc_verifications: Array.isArray(parsed.kyc_verifications) ? parsed.kyc_verifications : [],
        pending_sync_writes: Array.isArray(parsed.pending_sync_writes) ? parsed.pending_sync_writes : [],
      };
      // Ensure no passwords are held in memory
      databaseCache.users = databaseCache.users.map((u: any) => {
        const { password, ...clean } = u;
        return clean;
      });
      // Ensure at least the 100 Spanish seed properties are loaded
      if (databaseCache.listings.length < 100) {
        databaseCache.listings = SEED_LISTINGS.map((l) => ({
          id: l.id,
          landlord_id: l.landlord_id,
          landlord_name: l.landlord_name || 'Propietario Rentia',
          landlord_email: `${l.landlord_id}@rentia.com`,
          title: l.title,
          description: l.description || '',
          address: l.address || '',
          city: l.city,
          postal_code: '28001',
          rent: l.rent,
          deposit: l.deposit || l.rent,
          min_income: l.min_income_required || Math.round(l.rent * 2.5),
          property_type: l.property_type === 'house' ? 'Casa' : l.property_type === 'studio' ? 'Estudio' : 'Piso',
          bedrooms: l.rooms_count,
          bathrooms: l.bathrooms_count || 1,
          square_meters: l.surface_sqm || 75,
          photos: l.images,
          amenities: ['Ascensor', 'Amueblado', 'Calefacción', 'Aire acondicionado', 'WiFi'],
          is_active: true,
          is_verified: true,
          latitude: l.latitude,
          longitude: l.longitude,
          created_at: l.created_at,
          updated_at: l.created_at,
        }));
      }

      // Ensure tenant profiles from SEED_TENANTS are loaded if empty
      if (!databaseCache.tenant_profiles || databaseCache.tenant_profiles.length === 0) {
        databaseCache.tenant_profiles = SEED_TENANTS.map((st) => ({
          id: st.id,
          user_id: st.tenant_id,
          email: `${st.id}@rentia.com`,
          name: st.fullName,
          full_name: st.fullName,
          age: st.age,
          monthly_income: st.monthly_income,
          employment_type: st.employment_type,
          contract_type: st.employment_type === 'indefinido' ? 'Indefinido' : 'Temporal',
          employer_name: st.profession,
          current_city: st.target_city || 'Málaga',
          target_city: st.target_city || 'Málaga',
          max_budget: st.maxBudget,
          has_guarantor: st.has_guarantor,
          guarantor_income: st.has_guarantor ? 2800 : 0,
          pets: st.has_pets,
          has_pets: st.has_pets,
          smokers: false,
          is_smoker: false,
          bio: st.bio,
          trust_score: st.trustScore,
          has_payslips: st.has_payslips,
          occupants_count: st.occupants_count,
          has_children: st.has_children,
          desired_move_in_date: st.desired_move_in_date,
          photos: st.photos,
          avatar_url: st.avatar_url,
          is_active: true,
          is_verified: true,
          verification_status: 'verified',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));

        // Also ensure they exist in databaseCache.users
        SEED_TENANTS.forEach((st) => {
          if (!databaseCache.users.some((u) => u.id === st.tenant_id)) {
            databaseCache.users.push({
              id: st.tenant_id,
              email: `${st.id}@rentia.com`,
              name: st.fullName,
              role: 'tenant',
              is_active: true,
              is_verified: true,
              trust_score: st.trustScore,
              avatar_url: st.avatar_url,
              created_at: new Date().toISOString(),
            });
          }
        });
      }

      saveDatabase();
    } else {
      // Initialize with seed listings
      databaseCache.listings = SEED_LISTINGS.map((l) => ({
        id: l.id,
        landlord_id: l.landlord_id,
        landlord_name: l.landlord_name || 'Propietario Rentia',
        landlord_email: `${l.landlord_id}@rentia.com`,
        title: l.title,
        description: l.description || '',
        address: l.address || '',
        city: l.city,
        postal_code: '28001',
        rent: l.rent,
        deposit: l.deposit || l.rent,
        min_income: l.min_income_required || Math.round(l.rent * 2.5),
        property_type: l.property_type === 'house' ? 'Casa' : l.property_type === 'studio' ? 'Estudio' : 'Piso',
        bedrooms: l.rooms_count,
        bathrooms: l.bathrooms_count || 1,
        square_meters: l.surface_sqm || 75,
        photos: l.images,
        amenities: ['Ascensor', 'Amueblado', 'Calefacción', 'Aire acondicionado', 'WiFi'],
        is_active: true,
        is_verified: true,
        latitude: l.latitude,
        longitude: l.longitude,
        created_at: l.created_at,
        updated_at: l.created_at,
      }));

      // Initialize with seed tenants
      databaseCache.tenant_profiles = SEED_TENANTS.map((st) => ({
        id: st.id,
        user_id: st.tenant_id,
        email: `${st.id}@rentia.com`,
        name: st.fullName,
        full_name: st.fullName,
        age: st.age,
        monthly_income: st.monthly_income,
        employment_type: st.employment_type,
        contract_type: st.employment_type === 'indefinido' ? 'Indefinido' : 'Temporal',
        employer_name: st.profession,
        current_city: st.target_city || 'Málaga',
        target_city: st.target_city || 'Málaga',
        max_budget: st.maxBudget,
        has_guarantor: st.has_guarantor,
        guarantor_income: st.has_guarantor ? 2800 : 0,
        pets: st.has_pets,
        has_pets: st.has_pets,
        smokers: false,
        is_smoker: false,
        bio: st.bio,
        trust_score: st.trustScore,
        has_payslips: st.has_payslips,
        occupants_count: st.occupants_count,
        has_children: st.has_children,
        desired_move_in_date: st.desired_move_in_date,
        photos: st.photos,
        avatar_url: st.avatar_url,
        is_active: true,
        is_verified: true,
        verification_status: 'verified',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      SEED_TENANTS.forEach((st) => {
        if (!databaseCache.users.some((u) => u.id === st.tenant_id)) {
          databaseCache.users.push({
            id: st.tenant_id,
            email: `${st.id}@rentia.com`,
            name: st.fullName,
            role: 'tenant',
            is_active: true,
            is_verified: true,
            trust_score: st.trustScore,
            avatar_url: st.avatar_url,
            created_at: new Date().toISOString(),
          });
        }
      });

      saveDatabase();
    }
  } catch (err) {
    console.error('[DB] Error cargando base de datos local:', err);
  }
}

// Atomic save to disk
function saveDatabase(): void {
  try {
    const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(databaseCache, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.error('[DB] Error guardando base de datos local:', err);
  }
}

loadDatabase();

// Device / Browser parsing utility
export function parseUserAgent(uaString?: string): { device_type: string; browser: string; os: string } {
  const ua = uaString || '';
  let device_type = 'Escritorio';
  let browser = 'Navegador Web';
  let os = 'Sistema Operativo';

  if (/mobile/i.test(ua)) device_type = 'Móvil';
  else if (/tablet|ipad/i.test(ua)) device_type = 'Tablet';

  if (/chrome|crios/i.test(ua) && !/edg|opr/i.test(ua)) browser = 'Google Chrome';
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = 'Apple Safari';
  else if (/firefox|fxios/i.test(ua)) browser = 'Mozilla Firefox';
  else if (/edg/i.test(ua)) browser = 'Microsoft Edge';
  else if (/opera|opr/i.test(ua)) browser = 'Opera';

  if (/windows/i.test(ua)) os = 'Windows';
  else if (/macintosh|mac os x/i.test(ua)) os = 'macOS';
  else if (/android/i.test(ua)) os = 'Android';
  else if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS';
  else if (/linux/i.test(ua)) os = 'Linux';

  return { device_type, browser, os };
}

export const RentiaDB = {
  /**
   * Registrar inicio de sesión (éxito o fallo)
   */
  recordLogin(data: Omit<LoginRecord, 'id' | 'created_at'>): LoginRecord {
    const id = `login_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const record: LoginRecord = {
      ...data,
      id,
      created_at: new Date().toISOString(),
    };

    databaseCache.user_logins.unshift(record);
    // Keep last 2000 logins
    if (databaseCache.user_logins.length > 2000) {
      databaseCache.user_logins = databaseCache.user_logins.slice(0, 2000);
    }
    saveDatabase();

    // Sync to Supabase if available (fire-and-forget)
    if (isSupabaseConfigured()) {
      (async () => {
        try {
          const { error } = await getSupabaseAdmin()
            .from('user_logins')
            .insert({
              user_id: record.user_id && record.user_id.includes('-') ? record.user_id : null,
              email: record.email,
              role: record.role,
              status: record.status,
              ip_address: record.ip_address,
              user_agent: record.user_agent,
              device_type: record.device_type,
              browser: record.browser,
              os: record.os,
              login_method: record.login_method,
              failure_reason: record.failure_reason,
              session_id: record.session_id,
              created_at: record.created_at,
            });
          if (error && error.code !== 'PGRST205') {
            console.warn('[DB SYNC] Supabase user_logins error:', error.message);
          }
        } catch {
          // Ignore offline/table non-existence
        }
      })();
    }

    return record;
  },

  /**
   * Iniciar nueva sesión
   */
  startSession(data: {
    sessionId: string;
    userId: string;
    email: string;
    role: string;
    device_type: string;
    browser: string;
    os: string;
    ip_address: string;
    currentPage?: string;
  }): SessionRecord {
    const now = new Date().toISOString();
    const session: SessionRecord = {
      id: data.sessionId,
      user_id: data.userId,
      email: data.email,
      role: data.role,
      started_at: now,
      last_heartbeat_at: now,
      duration_seconds: 0,
      active_duration_seconds: 0,
      idle_duration_seconds: 0,
      pages_viewed_count: 1,
      current_page: data.currentPage || '/',
      device_type: data.device_type,
      browser: data.browser,
      os: data.os,
      ip_address: data.ip_address,
      is_active: true,
    };

    databaseCache.user_sessions.unshift(session);
    if (databaseCache.user_sessions.length > 2000) {
      databaseCache.user_sessions = databaseCache.user_sessions.slice(0, 2000);
    }
    saveDatabase();

    // Async sync to Supabase
    if (isSupabaseConfigured()) {
      (async () => {
        try {
          const { error } = await getSupabaseAdmin()
            .from('user_sessions')
            .insert({
              id: session.id,
              user_id: session.user_id && session.user_id.includes('-') ? session.user_id : null,
              email: session.email,
              role: session.role,
              started_at: session.started_at,
              last_heartbeat_at: session.last_heartbeat_at,
              duration_seconds: 0,
              active_duration_seconds: 0,
              idle_duration_seconds: 0,
              pages_viewed_count: 1,
              current_page: session.current_page,
              device_type: session.device_type,
              browser: session.browser,
              os: session.os,
              ip_address: session.ip_address,
              is_active: true,
            });
          if (error && error.code !== 'PGRST205') {
            console.warn('[DB SYNC] Supabase user_sessions error:', error.message);
          }
        } catch {
          // Ignore sync failure
        }
      })();
    }

    return session;
  },

  /**
   * Actualizar tiempo en la app mediante Heartbeat
   */
  heartbeatSession(
    sessionId: string,
    activeDeltaSeconds: number,
    idleDeltaSeconds: number = 0,
    currentPage?: string
  ): SessionRecord | null {
    const session = databaseCache.user_sessions.find((s) => s.id === sessionId);
    if (!session) return null;

    const now = new Date().toISOString();
    session.last_heartbeat_at = now;
    session.active_duration_seconds += Math.max(0, activeDeltaSeconds);
    session.idle_duration_seconds += Math.max(0, idleDeltaSeconds);
    session.duration_seconds = session.active_duration_seconds + session.idle_duration_seconds;
    session.is_active = true;

    if (currentPage && currentPage !== session.current_page) {
      session.current_page = currentPage;
      session.pages_viewed_count += 1;
    }

    saveDatabase();

    // Async sync update to Supabase
    if (isSupabaseConfigured()) {
      (async () => {
        try {
          await getSupabaseAdmin()
            .from('user_sessions')
            .update({
              last_heartbeat_at: session.last_heartbeat_at,
              duration_seconds: session.duration_seconds,
              active_duration_seconds: session.active_duration_seconds,
              idle_duration_seconds: session.idle_duration_seconds,
              pages_viewed_count: session.pages_viewed_count,
              current_page: session.current_page,
              is_active: true,
              updated_at: now,
            })
            .eq('id', sessionId);
        } catch {
          // Ignore
        }
      })();
    }

    return session;
  },

  /**
   * Finalizar sesión
   */
  endSession(sessionId: string): SessionRecord | null {
    const session = databaseCache.user_sessions.find((s) => s.id === sessionId);
    if (!session) return null;

    const now = new Date().toISOString();
    session.ended_at = now;
    session.is_active = false;
    saveDatabase();

    if (isSupabaseConfigured()) {
      (async () => {
        try {
          await getSupabaseAdmin()
            .from('user_sessions')
            .update({
              ended_at: now,
              is_active: false,
              updated_at: now,
            })
            .eq('id', sessionId);
        } catch {
          // Ignore
        }
      })();
    }

    return session;
  },

  /**
   * Registrar evento o actividad
   */
  recordActivity(data: Omit<ActivityRecord, 'id' | 'created_at'>): ActivityRecord {
    const id = `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const record: ActivityRecord = {
      ...data,
      id,
      created_at: new Date().toISOString(),
    };

    databaseCache.user_activity_logs.unshift(record);
    if (databaseCache.user_activity_logs.length > 3000) {
      databaseCache.user_activity_logs = databaseCache.user_activity_logs.slice(0, 3000);
    }
    saveDatabase();

    if (isSupabaseConfigured()) {
      (async () => {
        try {
          await getSupabaseAdmin()
            .from('user_activity_logs')
            .insert({
              session_id: record.session_id,
              user_id: record.user_id && record.user_id.includes('-') ? record.user_id : null,
              email: record.email,
              action: record.action,
              category: record.category,
              path: record.path,
              details: record.details,
              created_at: record.created_at,
            });
        } catch {
          // Ignore
        }
      })();
    }

    return record;
  },

  /**
   * Consultar logins con filtros
   */
  getLogins(filter?: { email?: string; userId?: string; limit?: number; status?: string }): LoginRecord[] {
    let list = databaseCache.user_logins;
    if (filter?.email) {
      list = list.filter((l) => l.email.toLowerCase() === filter.email!.toLowerCase());
    }
    if (filter?.userId) {
      list = list.filter((l) => l.user_id === filter.userId);
    }
    if (filter?.status) {
      list = list.filter((l) => l.status === filter.status);
    }
    return list.slice(0, filter?.limit || 100);
  },

  /**
   * Consultar sesiones con filtros
   */
  getSessions(filter?: { email?: string; userId?: string; limit?: number; activeOnly?: boolean }): SessionRecord[] {
    let list = databaseCache.user_sessions;
    if (filter?.email) {
      list = list.filter((s) => s.email.toLowerCase() === filter.email!.toLowerCase());
    }
    if (filter?.userId) {
      list = list.filter((s) => s.user_id === filter.userId);
    }
    if (filter?.activeOnly) {
      list = list.filter((s) => s.is_active);
    }
    return list.slice(0, filter?.limit || 100);
  },

  /**
   * Resumen analítico por usuario (tiempo total pasado en la app, etc.)
   */
  getUserSummary(userIdOrEmail: string): {
    total_time_seconds: number;
    active_time_seconds: number;
    total_sessions: number;
    total_logins: number;
    last_login?: LoginRecord;
    active_session?: SessionRecord;
  } {
    const term = userIdOrEmail.toLowerCase();
    const sessions = databaseCache.user_sessions.filter(
      (s) => s.email.toLowerCase() === term || s.user_id === term
    );
    const logins = databaseCache.user_logins.filter(
      (l) => l.email.toLowerCase() === term || l.user_id === term
    );

    const total_time_seconds = sessions.reduce((acc, s) => acc + (s.duration_seconds || 0), 0);
    const active_time_seconds = sessions.reduce((acc, s) => acc + (s.active_duration_seconds || 0), 0);
    const active_session = sessions.find((s) => s.is_active);
    const last_login = logins[0];

    return {
      total_time_seconds,
      active_time_seconds,
      total_sessions: sessions.length,
      total_logins: logins.length,
      last_login,
      active_session,
    };
  },

  /**
   * Analíticas globales para Administradores
   */
  getGlobalAnalytics(): {
    total_users_logged: number;
    total_logins: number;
    successful_logins: number;
    failed_logins: number;
    active_sessions_now: number;
    total_time_spent_seconds: number;
    avg_session_seconds: number;
    devices_breakdown: Record<string, number>;
  } {
    const logins = databaseCache.user_logins;
    const sessions = databaseCache.user_sessions;

    const uniqueUsers = new Set(logins.map((l) => l.email.toLowerCase())).size;
    const successfulLogins = logins.filter((l) => l.status === 'success').length;
    const failedLogins = logins.filter((l) => l.status === 'failed').length;
    const activeNow = sessions.filter((s) => s.is_active).length;

    const totalSeconds = sessions.reduce((acc, s) => acc + (s.duration_seconds || 0), 0);
    const avgSeconds = sessions.length > 0 ? Math.round(totalSeconds / sessions.length) : 0;

    const devices: Record<string, number> = {
      Escritorio: 0,
      Móvil: 0,
      Tablet: 0,
    };

    sessions.forEach((s) => {
      const d = s.device_type || 'Escritorio';
      devices[d] = (devices[d] || 0) + 1;
    });

    return {
      total_users_logged: uniqueUsers,
      total_logins: logins.length,
      successful_logins: successfulLogins,
      failed_logins: failedLogins,
      active_sessions_now: activeNow,
      total_time_spent_seconds: totalSeconds,
      avg_session_seconds: avgSeconds,
      devices_breakdown: devices,
    };
  },

  // ==========================================
  // USUARIOS (USERS)
  // ==========================================
  getUsers(filter?: { role?: string; search?: string }): UserRecord[] {
    let list = databaseCache.users;
    if (filter?.role) {
      list = list.filter((u) => u.role === filter.role);
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      list = list.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }
    return list;
  },

  getUserById(id: string): UserRecord | undefined {
    return databaseCache.users.find((u) => u.id === id);
  },

  getUserByEmail(email: string): UserRecord | undefined {
    const clean = email.trim().toLowerCase();
    return databaseCache.users.find((u) => u.email.toLowerCase() === clean);
  },

  getUserByPhone(phone: string): UserRecord | undefined {
    if (!phone) return undefined;
    const cleanPhone = String(phone).replace(/[\s\-\(\)\.]/g, '').trim();
    if (!cleanPhone) return undefined;
    const rawPhoneDigits = cleanPhone.replace(/\+/g, '');

    return databaseCache.users.find((u) => {
      if (!u.phone) return false;
      const uClean = String(u.phone).replace(/[\s\-\(\)\.]/g, '').trim();
      const uDigits = uClean.replace(/\+/g, '');
      return (
        uClean === cleanPhone ||
        uDigits === rawPhoneDigits ||
        (uDigits.length >= 9 && rawPhoneDigits.length >= 9 && (uDigits.endsWith(rawPhoneDigits) || rawPhoneDigits.endsWith(uDigits)))
      );
    });
  },

  checkEmailOrPhoneAvailability(email: string, phone: string, excludeUserId?: string): {
    emailTaken: boolean;
    phoneTaken: boolean;
    existingEmailUser?: UserRecord;
    existingPhoneUser?: UserRecord;
    conflictRole?: string;
  } {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = String(phone).replace(/[\s\-\(\)\.]/g, '').trim();
    const rawPhoneDigits = cleanPhone.replace(/\+/g, '');

    const existingEmailUser = databaseCache.users.find(
      (u) => (!excludeUserId || u.id !== excludeUserId) && u.email.toLowerCase() === cleanEmail
    );

    const existingPhoneUser = cleanPhone
      ? databaseCache.users.find((u) => {
          if (excludeUserId && u.id === excludeUserId) return false;
          if (!u.phone) return false;
          const uClean = String(u.phone).replace(/[\s\-\(\)\.]/g, '').trim();
          const uDigits = uClean.replace(/\+/g, '');
          return (
            uClean === cleanPhone ||
            uDigits === rawPhoneDigits ||
            (uDigits.length >= 9 && rawPhoneDigits.length >= 9 && (uDigits.endsWith(rawPhoneDigits) || rawPhoneDigits.endsWith(uDigits)))
          );
        })
      : undefined;

    return {
      emailTaken: Boolean(existingEmailUser),
      phoneTaken: Boolean(existingPhoneUser),
      existingEmailUser,
      existingPhoneUser,
      conflictRole: existingEmailUser?.role || existingPhoneUser?.role,
    };
  },

  saveUser(userData: Omit<UserRecord, 'created_at'> & { created_at?: string }): UserRecord {
    const cleanEmail = userData.email.trim().toLowerCase();
    const cleanPhone = userData.phone ? String(userData.phone).replace(/[\s\-\(\)\.]/g, '').trim() : '';

    // Enforce email uniqueness: never allow another account to share this email
    const duplicateEmailUser = databaseCache.users.find(
      (u) => u.id !== userData.id && u.email.toLowerCase() === cleanEmail
    );
    if (duplicateEmailUser) {
      const roleLabel = duplicateEmailUser.role === 'tenant' ? 'Inquilino' : duplicateEmailUser.role === 'agency' ? 'Agencia Inmobiliaria' : duplicateEmailUser.role === 'landlord' ? 'Propietario' : 'Administrador';
      throw new Error(`EMAIL_ALREADY_EXISTS: Este correo ya pertenece a una cuenta de ${roleLabel}. Un único correo por cuenta.`);
    }

    // Enforce phone uniqueness: never allow another account to share this phone
    if (cleanPhone) {
      const rawPhoneDigits = cleanPhone.replace(/\+/g, '');
      const duplicatePhoneUser = databaseCache.users.find((u) => {
        if (u.id === userData.id || !u.phone) return false;
        const uClean = String(u.phone).replace(/[\s\-\(\)\.]/g, '').trim();
        const uDigits = uClean.replace(/\+/g, '');
        return (
          uClean === cleanPhone ||
          uDigits === rawPhoneDigits ||
          (uDigits.length >= 9 && rawPhoneDigits.length >= 9 && (uDigits.endsWith(rawPhoneDigits) || rawPhoneDigits.endsWith(uDigits)))
        );
      });
      if (duplicatePhoneUser) {
        const roleLabel = duplicatePhoneUser.role === 'tenant' ? 'Inquilino' : duplicatePhoneUser.role === 'agency' ? 'Agencia Inmobiliaria' : duplicatePhoneUser.role === 'landlord' ? 'Propietario' : 'Administrador';
        throw new Error(`PHONE_ALREADY_EXISTS: Este teléfono ya está registrado en una cuenta de ${roleLabel}. Un único teléfono por cuenta.`);
      }
    }

    const existingIndex = databaseCache.users.findIndex(
      (u) => u.id === userData.id || u.email.toLowerCase() === cleanEmail
    );

    const now = new Date().toISOString();
    const record: UserRecord = {
      ...userData,
      email: cleanEmail,
      phone: userData.phone ? String(userData.phone).trim() : undefined,
      created_at: userData.created_at || (existingIndex >= 0 ? databaseCache.users[existingIndex].created_at : now),
      updated_at: now,
    };

    if (existingIndex >= 0) {
      databaseCache.users[existingIndex] = record;
    } else {
      databaseCache.users.unshift(record);
    }
    saveDatabase();

    // Replicate to Supabase
    if (isSupabaseConfigured()) {
      (async () => {
        try {
          await getSupabaseAdmin()
            .from('profiles')
            .upsert({
              id: record.id,
              email: record.email,
              name: record.name,
              role: record.role,
              phone: record.phone || null,
              is_active: record.is_active,
              is_verified: record.is_verified,
              trust_score: record.trust_score || 85,
              updated_at: now,
            }, { onConflict: 'id' });
        } catch {
          // Ignore
        }
      })();
    }

    return record;
  },

  toggleUserStatus(id: string, isActive: boolean): UserRecord | null {
    const user = databaseCache.users.find((u) => u.id === id);
    if (!user) return null;
    user.is_active = isActive;
    user.updated_at = new Date().toISOString();
    saveDatabase();

    if (isSupabaseConfigured()) {
      (async () => {
        try {
          await getSupabaseAdmin()
            .from('profiles')
            .update({ is_active: isActive, updated_at: user.updated_at })
            .eq('id', id);
        } catch {
          // Ignore
        }
      })();
    }
    return user;
  },

  deleteUserPermanently(userIdOrEmail: string): boolean {
    const clean = userIdOrEmail.trim().toLowerCase();
    const targetUser = databaseCache.users.find(
      (u) => u.id === userIdOrEmail || u.email.toLowerCase() === clean
    );
    const userId = targetUser?.id || userIdOrEmail;
    const userEmail = (targetUser?.email || clean).toLowerCase();

    // 1. Purga total de users
    databaseCache.users = databaseCache.users.filter(
      (u) => u.id !== userId && u.email.toLowerCase() !== userEmail
    );

    // 2. Purga total de perfiles de inquilino
    databaseCache.tenant_profiles = databaseCache.tenant_profiles.filter(
      (t) => t.user_id !== userId && (!t.email || t.email.toLowerCase() !== userEmail)
    );

    // 3. Purga de inmuebles si es propietario
    databaseCache.listings = databaseCache.listings.filter(
      (l) => l.landlord_id !== userId && (!l.landlord_email || l.landlord_email.toLowerCase() !== userEmail)
    );

    // 4. Purga de baux y contratos
    databaseCache.leases = databaseCache.leases.filter(
      (l) => l.user_id !== userId
    );

    // 5. Purga de verificaciones KYC
    if (databaseCache.kyc_verifications) {
      databaseCache.kyc_verifications = databaseCache.kyc_verifications.filter(
        (k) => k.user_id !== userId && (!k.user_email || k.user_email.toLowerCase() !== userEmail)
      );
    }

    // 6. Purga de swipes y likes
    databaseCache.swipes = databaseCache.swipes.filter(
      (s) => s.actor_id !== userId && s.target_id !== userId && s.target_user_id !== userId
    );

    // 7. Purga de matches y chats
    databaseCache.matches = databaseCache.matches.filter(
      (m) => m.tenant_id !== userId && m.landlord_id !== userId
    );
    databaseCache.chat_messages = databaseCache.chat_messages.filter(
      (c) => c.sender_id !== userId && c.recipient_id !== userId
    );

    // 8. Purga de notificaciones y reportes
    if (databaseCache.notifications) {
      databaseCache.notifications = databaseCache.notifications.filter(
        (n) => n.user_id !== userId
      );
    }
    if (databaseCache.reports) {
      databaseCache.reports = databaseCache.reports.filter(
        (r) => r.reporter_id !== userId && r.target_user_id !== userId
      );
    }

    // 9. Purga de verificaciones de propiedad (landlords/agencies)
    if (databaseCache.ownership_verifications) {
      databaseCache.ownership_verifications = databaseCache.ownership_verifications.filter(
        (o) => o.landlord_id !== userId && o.landlord_email?.toLowerCase() !== userEmail
      );
    }

    // 10. Purga de sesiones, inicios de sesión y logs de actividad
    if (databaseCache.user_logins) {
      databaseCache.user_logins = databaseCache.user_logins.filter(
        (l) => l.user_id !== userId && l.email?.toLowerCase() !== userEmail
      );
    }
    if (databaseCache.user_sessions) {
      databaseCache.user_sessions = databaseCache.user_sessions.filter(
        (s) => s.user_id !== userId && s.email?.toLowerCase() !== userEmail
      );
    }
    if (databaseCache.user_activity_logs) {
      databaseCache.user_activity_logs = databaseCache.user_activity_logs.filter(
        (a) => a.user_id !== userId && a.email?.toLowerCase() !== userEmail
      );
    }

    // Registrar en closed_accounts para evitar acceso posterior mostrando "cuenta suprimida/cerrada"
    this.markAccountClosed(userEmail, targetUser?.phone);

    saveDatabase();

    if (isSupabaseConfigured()) {
      (async () => {
        try {
          const admin = getSupabaseAdmin();
          await admin.from('tenant_profiles').delete().eq('user_id', userId);
          await admin.from('listings').delete().eq('landlord_id', userId);
          await admin.from('leases').delete().eq('user_id', userId);
          await admin.from('matches').delete().or(`tenant_id.eq.${userId},landlord_id.eq.${userId}`);
          await admin.from('chat_messages').delete().or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);
          await admin.from('profiles').delete().eq('id', userId);
          try {
            await admin.auth.admin.deleteUser(userId);
          } catch {
            // Ignore if auth user not found
          }
        } catch {
          // Ignore
        }
      })();
    }
    return true;
  },

  markAccountClosed(email: string, phone?: string): void {
    if (!databaseCache.closed_accounts) databaseCache.closed_accounts = [];
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone ? String(phone).replace(/[\s\-\(\)\.]/g, '').trim() : undefined;
    if (!databaseCache.closed_accounts.some((c) => c.email.toLowerCase() === cleanEmail)) {
      databaseCache.closed_accounts.push({
        email: cleanEmail,
        phone: cleanPhone,
        closed_at: new Date().toISOString(),
      });
      saveDatabase();
    }
  },

  isAccountClosed(email: string): boolean {
    if (!databaseCache.closed_accounts) return false;
    const cleanEmail = email.trim().toLowerCase();
    return databaseCache.closed_accounts.some((c) => c.email.toLowerCase() === cleanEmail);
  },

  clearClosedAccount(email: string, phone?: string): void {
    if (!databaseCache.closed_accounts) return;
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone ? String(phone).replace(/[\s\-\(\)\.]/g, '').trim() : undefined;
    databaseCache.closed_accounts = databaseCache.closed_accounts.filter((c) => {
      if (c.email.toLowerCase() === cleanEmail) return false;
      if (cleanPhone && c.phone && c.phone === cleanPhone) return false;
      return true;
    });
    saveDatabase();
  },

  getUserDetailedProfile(userId: string) {
    const user = databaseCache.users.find((u) => u.id === userId);
    if (!user) return null;
    const userEmail = (user.email || '').toLowerCase();
    const tenantProfile = databaseCache.tenant_profiles.find(
      (t) => t.user_id === userId || (t.email && t.email.toLowerCase() === userEmail)
    );
    const listings = databaseCache.listings.filter(
      (l) => l.landlord_id === userId || (l.landlord_email && l.landlord_email.toLowerCase() === userEmail)
    );
    const leases = databaseCache.leases.filter((l) => l.user_id === userId);
    const verifications = databaseCache.ownership_verifications.filter(
      (v) => v.landlord_id === userId || (v.landlord_email && v.landlord_email.toLowerCase() === userEmail)
    );
    const logins = (databaseCache.user_logins || []).filter(
      (l) => l.user_id === userId || (l.email && l.email.toLowerCase() === userEmail)
    );
    const sessions = (databaseCache.user_sessions || []).filter(
      (s) => s.user_id === userId || (s.email && s.email.toLowerCase() === userEmail)
    );

    return {
      user,
      tenantProfile: tenantProfile || null,
      listings,
      leases,
      verifications,
      recentLogins: logins.slice(0, 10),
      recentSessions: sessions.slice(0, 10),
      isEmailBlocked: this.isEmailBlocked(userEmail),
    };
  },

  // ==========================================
  // LISTA NEGRA DE CORREOS (BLOCKED EMAILS)
  // ==========================================
  getBlockedEmails(): BlockedEmailRecord[] {
    return databaseCache.blocked_emails || [];
  },

  isEmailBlocked(email?: string): boolean {
    if (!email) return false;
    const clean = String(email).trim().toLowerCase();
    return (databaseCache.blocked_emails || []).some((b) => b.email.toLowerCase() === clean);
  },

  addBlockedEmail(email: string, reason?: string, blockedBy = 'admin'): BlockedEmailRecord {
    const clean = String(email).trim().toLowerCase();
    databaseCache.blocked_emails = databaseCache.blocked_emails || [];
    const existing = databaseCache.blocked_emails.find((b) => b.email.toLowerCase() === clean);
    if (existing) {
      existing.reason = reason || existing.reason;
      existing.blocked_at = new Date().toISOString();
      saveDatabase();
      return existing;
    }
    const record: BlockedEmailRecord = {
      id: randomUUID(),
      email: clean,
      reason: reason || 'Bloqueado por política de seguridad / fraude',
      blocked_by: blockedBy,
      blocked_at: new Date().toISOString(),
    };
    databaseCache.blocked_emails.unshift(record);
    saveDatabase();
    return record;
  },

  removeBlockedEmail(email: string): boolean {
    if (!email) return false;
    const clean = String(email).trim().toLowerCase();
    databaseCache.blocked_emails = databaseCache.blocked_emails || [];
    const idx = databaseCache.blocked_emails.findIndex((b) => b.email.toLowerCase() === clean);
    if (idx === -1) return false;
    databaseCache.blocked_emails.splice(idx, 1);
    saveDatabase();
    return true;
  },

  // ==========================================
  // PERFILES DE INQUILINO (TENANT PROFILES)
  // ==========================================
  getTenantProfiles(filter?: { city?: string; search?: string }): TenantProfileRecord[] {
    let list = databaseCache.tenant_profiles;
    if (filter?.city && filter.city !== 'all') {
      list = list.filter((p) => p.current_city.toLowerCase() === filter.city!.toLowerCase());
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.email.toLowerCase().includes(q) ||
          p.employment_type.toLowerCase().includes(q) ||
          (p.employer_name && p.employer_name.toLowerCase().includes(q))
      );
    }
    return list;
  },

  getTenantProfileByUserId(userId: string): TenantProfileRecord | undefined {
    return databaseCache.tenant_profiles.find((p) => p.user_id === userId);
  },

  getTenantProfileById(id: string): TenantProfileRecord | undefined {
    return databaseCache.tenant_profiles.find((p) => p.id === id || p.user_id === id);
  },

  saveTenantProfile(
    profileData: Partial<TenantProfileRecord> & { user_id: string; email?: string; name?: string; full_name?: string }
  ): TenantProfileRecord {
    const existingIndex = databaseCache.tenant_profiles.findIndex((p) => p.user_id === profileData.user_id);
    const now = new Date().toISOString();

    const existing = existingIndex >= 0 ? databaseCache.tenant_profiles[existingIndex] : null;
    const id = existing?.id || randomUUID();

    const record: TenantProfileRecord = {
      id,
      user_id: profileData.user_id,
      email: (profileData.email || existing?.email || '').trim().toLowerCase(),
      name: profileData.name || profileData.full_name || existing?.name || 'Locataire',
      phone: profileData.phone || existing?.phone,
      birth_date: profileData.birth_date || existing?.birth_date,
      nationality: profileData.nationality || existing?.nationality || 'Española',
      id_document: profileData.id_document || existing?.id_document || 'DNI',
      id_number: profileData.id_number || existing?.id_number,
      monthly_income: profileData.monthly_income !== undefined ? Number(profileData.monthly_income) : (existing?.monthly_income || 2200),
      employment_type: profileData.employment_type || existing?.employment_type || 'indefinido',
      contract_type: profileData.contract_type || existing?.contract_type || 'Indefinido tiempo completo',
      employer_name: profileData.employer_name || existing?.employer_name,
      seniority_years: profileData.seniority_years !== undefined ? Number(profileData.seniority_years) : (existing?.seniority_years || 2),
      current_city: profileData.current_city || existing?.current_city || 'Málaga',
      max_budget: profileData.max_budget !== undefined ? Number(profileData.max_budget) : (existing?.max_budget || 900),
      has_guarantor: profileData.has_guarantor !== undefined ? Boolean(profileData.has_guarantor) : (existing?.has_guarantor || false),
      guarantor_name: profileData.guarantor_name || existing?.guarantor_name,
      guarantor_income: profileData.guarantor_income !== undefined ? Number(profileData.guarantor_income) : existing?.guarantor_income,
      pets: profileData.pets !== undefined ? Boolean(profileData.pets) : (existing?.pets || false),
      smokers: profileData.smokers !== undefined ? Boolean(profileData.smokers) : (existing?.smokers || false),
      bio: profileData.bio || existing?.bio,
      trust_score: profileData.trust_score !== undefined ? Number(profileData.trust_score) : (existing?.trust_score || 88),
      verified_docs_count: profileData.verified_docs_count !== undefined ? Number(profileData.verified_docs_count) : (existing?.verified_docs_count || 1),
      created_at: existing?.created_at || now,
      updated_at: now,
    };

    if (existingIndex >= 0) {
      databaseCache.tenant_profiles[existingIndex] = record;
    } else {
      databaseCache.tenant_profiles.unshift(record);
    }
    saveDatabase();

    // Replicate to Supabase
    if (isSupabaseConfigured()) {
      (async () => {
        try {
          await getSupabaseAdmin()
            .from('tenant_profiles')
            .upsert({
              user_id: record.user_id,
              full_name: record.name,
              monthly_income: record.monthly_income,
              employment_type: record.employment_type || 'indefinido',
              occupants_count: 1,
              has_children: false,
              has_pets: Boolean(record.pets),
              is_smoker: Boolean(record.smokers),
              max_budget: record.max_budget,
              has_guarantor: Boolean(record.has_guarantor),
              bio: record.bio || null,
              is_active: true,
              updated_at: now,
            }, { onConflict: 'user_id' });

          await getSupabaseAdmin()
            .from('tenant_preferences')
            .upsert({
              tenant_id: record.user_id,
              max_budget: record.max_budget,
              occupants_count: 1,
              has_pets: Boolean(record.pets),
            }, { onConflict: 'tenant_id' });
        } catch (syncErr) {
          console.warn('Supabase tenant_profile sync warning:', syncErr);
        }
      })();
    }

    return record;
  },

  // ==========================================
  // INMUEBLES & VIVIENDAS (LISTINGS)
  // ==========================================
  getListings(filter?: { city?: string; activeOnly?: boolean; search?: string; landlordId?: string }): ListingRecord[] {
    let list = databaseCache.listings;
    if (filter?.landlordId) {
      list = list.filter((l) => l.landlord_id === filter.landlordId);
    }
    if (filter?.activeOnly) {
      list = list.filter((l) => l.is_active);
    }
    if (filter?.city && filter.city !== 'all') {
      list = list.filter((l) => l.city.toLowerCase() === filter.city!.toLowerCase());
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      list = list.filter(
        (l) =>
          l.title.toLowerCase().includes(q) ||
          l.address.toLowerCase().includes(q) ||
          (l.landlord_name && l.landlord_name.toLowerCase().includes(q))
      );
    }
    return list;
  },

  getListingById(id: string): ListingRecord | undefined {
    return databaseCache.listings.find((l) => l.id === id);
  },

  saveListing(
    listingData: Partial<ListingRecord> & {
      landlord_id: string;
      title: string;
      address: string;
      city: string;
      rent: number;
    }
  ): ListingRecord {
    const now = new Date().toISOString();
    const existingIndex = listingData.id
      ? databaseCache.listings.findIndex((l) => l.id === listingData.id)
      : -1;

    const existing = existingIndex >= 0 ? databaseCache.listings[existingIndex] : null;
    const id = listingData.id || existing?.id || randomUUID();

    const record: ListingRecord = {
      id,
      landlord_id: listingData.landlord_id,
      landlord_name: listingData.landlord_name || existing?.landlord_name,
      landlord_email: listingData.landlord_email || existing?.landlord_email,
      landlord_phone: listingData.landlord_phone || existing?.landlord_phone,
      title: listingData.title,
      description: listingData.description || existing?.description || '',
      address: listingData.address,
      city: listingData.city,
      postal_code: listingData.postal_code || existing?.postal_code || '',
      rent: Number(listingData.rent) || 0,
      deposit: listingData.deposit !== undefined ? Number(listingData.deposit) : (existing?.deposit || Number(listingData.rent) * 2),
      min_income: listingData.min_income !== undefined ? Number(listingData.min_income) : (existing?.min_income || Math.round(Number(listingData.rent) * 2.5)),
      property_type: listingData.property_type || existing?.property_type || 'Piso',
      rental_duration_type: listingData.rental_duration_type || existing?.rental_duration_type || 'long_term',
      duration_unit: listingData.duration_unit || existing?.duration_unit || (listingData.is_indefinite ? 'indefinite' : 'months'),
      duration_value: listingData.duration_value !== undefined ? Number(listingData.duration_value) : (existing?.duration_value || 12),
      available_from: listingData.available_from || existing?.available_from || now.split('T')[0],
      available_until: listingData.available_until !== undefined ? listingData.available_until : (existing?.available_until || null),
      is_indefinite: listingData.is_indefinite !== undefined ? Boolean(listingData.is_indefinite) : (existing?.is_indefinite || false),
      is_scheduled: listingData.is_scheduled !== undefined ? Boolean(listingData.is_scheduled) : (existing?.is_scheduled || false),
      scheduled_publish_at: listingData.scheduled_publish_at || existing?.scheduled_publish_at || null,
      publishing_status: listingData.publishing_status || (listingData.is_scheduled ? 'scheduled' : (existing?.publishing_status || 'published')),
      bedrooms: listingData.bedrooms !== undefined ? Number(listingData.bedrooms) : (existing?.bedrooms || 2),
      bathrooms: listingData.bathrooms !== undefined ? Number(listingData.bathrooms) : (existing?.bathrooms || 1),
      square_meters: listingData.square_meters !== undefined ? Number(listingData.square_meters) : (existing?.square_meters || 75),
      photos: Array.isArray(listingData.photos) && listingData.photos.length > 0 ? listingData.photos : (existing?.photos || ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop&q=80']),
      amenities: Array.isArray(listingData.amenities) ? listingData.amenities : (existing?.amenities || ['Ascensor', 'Amueblado', 'Calefacción', 'Aire acondicionado']),
      is_active: listingData.is_active !== undefined ? Boolean(listingData.is_active) : (existing?.is_active !== undefined ? existing.is_active : true),
      is_verified: listingData.is_verified !== undefined ? Boolean(listingData.is_verified) : (existing?.is_verified !== undefined ? existing.is_verified : true),
      created_at: existing?.created_at || now,
      updated_at: now,
    };

    if (existingIndex >= 0) {
      databaseCache.listings[existingIndex] = record;
    } else {
      databaseCache.listings.unshift(record);
    }
    saveDatabase();

    // Replicate to Supabase
    if (isSupabaseConfigured()) {
      (async () => {
        try {
          const propTypeKey = (record.property_type || 'piso').toLowerCase().trim();
          const propertyTypeId = PROPERTY_TYPE_MAP[propTypeKey] || '6008fdcd-3a50-4f0f-8975-ba72dbfafe52';
          await getSupabaseAdmin()
            .from('listings')
            .upsert({
              id: record.id,
              landlord_id: record.landlord_id,
              title: record.title,
              description: record.description || null,
              price: record.rent,
              bedrooms: record.bedrooms || 1,
              is_furnished: true,
              pets_allowed: false,
              available_from: record.created_at.split('T')[0],
              min_income_required: record.min_income || null,
              images: Array.isArray(record.photos) ? record.photos : [],
              is_active: record.is_active !== undefined ? record.is_active : true,
              latitude: 36.7213,
              longitude: -4.4214,
              address_exact: record.address + (record.city ? `, ${record.city}` : ''),
              property_type_id: propertyTypeId,
              verification_status: record.is_verified ? 'verified' : 'pending',
              updated_at: now,
            }, { onConflict: 'id' });
        } catch (syncErr) {
          console.warn('Supabase listing sync warning:', syncErr);
        }
      })();
    }

    return record;
  },

  toggleListingActive(id: string, isActive?: boolean, newStatus?: string): ListingRecord | null {
    let listing = databaseCache.listings.find((l) => l.id === id);
    if (!listing) {
      const seed = SEED_LISTINGS.find((s) => s.id === id);
      if (seed) {
        listing = RentiaDB.saveListing({
          id: seed.id,
          landlord_id: seed.landlord_id || 'landlord_seed',
          landlord_name: seed.landlord_name || 'Propietario',
          title: seed.title,
          address: seed.address || seed.city,
          city: seed.city,
          rent: seed.rent,
          photos: seed.images || [],
          is_active: seed.is_active !== undefined ? seed.is_active : true,
        });
      }
    }
    if (!listing) return null;

    if (isActive !== undefined) {
      listing.is_active = isActive;
    } else if (newStatus === 'inactive') {
      listing.is_active = false;
    } else {
      listing.is_active = !listing.is_active;
    }

    if (newStatus) {
      listing.status = newStatus;
      if (newStatus === 'inactive') {
        listing.is_active = false;
      } else if (newStatus === 'rented') {
        listing.rented_at = listing.rented_at || new Date().toISOString();
      }
    } else if (listing.is_active === false) {
      listing.status = 'inactive';
    } else if (!listing.status || listing.status === 'inactive') {
      listing.status = 'available';
    }

    listing.updated_at = new Date().toISOString();
    saveDatabase();

    if (isSupabaseConfigured()) {
      (async () => {
        try {
          await getSupabaseAdmin()
            .from('listings')
            .update({ 
              is_active: listing.is_active, 
              status: listing.status, 
              updated_at: listing.updated_at 
            })
            .eq('id', id);
        } catch {
          // Ignore
        }
      })();
    }
    return listing;
  },

  updateListing(id: string, updates: Partial<ListingRecord>): ListingRecord | null {
    const idx = databaseCache.listings.findIndex((l) => l.id === id);
    if (idx === -1) return null;
    const existing = databaseCache.listings[idx];
    const now = new Date().toISOString();
    const updated: ListingRecord = {
      ...existing,
      ...updates,
      id: existing.id,
      rent: updates.rent !== undefined ? Number(updates.rent) : existing.rent,
      deposit: updates.deposit !== undefined ? Number(updates.deposit) : existing.deposit,
      bedrooms: updates.bedrooms !== undefined ? Number(updates.bedrooms) : existing.bedrooms,
      updated_at: now,
    };
    databaseCache.listings[idx] = updated;
    saveDatabase();

    if (isSupabaseConfigured()) {
      (async () => {
        try {
          await getSupabaseAdmin()
            .from('listings')
            .update({
              title: updated.title,
              description: updated.description,
              price: updated.rent,
              address_exact: updated.address + (updated.city ? `, ${updated.city}` : ''),
              is_active: updated.is_active,
              bedrooms: updated.bedrooms,
              updated_at: now,
            })
            .eq('id', id);
        } catch {
          // Ignore
        }
      })();
    }
    return updated;
  },

  deleteListing(id: string): boolean {
    const idx = databaseCache.listings.findIndex((l) => l.id === id);
    if (idx === -1) return false;
    databaseCache.listings.splice(idx, 1);
    saveDatabase();

    if (isSupabaseConfigured()) {
      (async () => {
        try {
          await getSupabaseAdmin().from('listings').delete().eq('id', id);
        } catch {
          // Ignore
        }
      })();
    }
    return true;
  },

  // ==========================================
  // ALQUILERES & CONTRATOS (LEASES)
  // ==========================================
  getLeases(filter?: { userId?: string; status?: string }): LeaseRecord[] {
    let list = databaseCache.leases;
    if (filter?.userId) {
      list = list.filter((l) => l.user_id === filter.userId);
    }
    if (filter?.status) {
      list = list.filter((l) => l.status === filter.status);
    }
    return list;
  },

  getLeaseById(id: string): LeaseRecord | undefined {
    return databaseCache.leases.find((l) => l.id === id);
  },

  getLeaseByCode(code: string): LeaseRecord | undefined {
    const clean = code.trim().toUpperCase();
    return databaseCache.leases.find((l) => l.code.toUpperCase() === clean);
  },

  saveLease(
    leaseData: Partial<LeaseRecord> & {
      user_id: string;
      address: string;
      rent: number;
      owner_name_guess: string;
    }
  ): LeaseRecord {
    const now = new Date().toISOString();
    const existingIndex = leaseData.id
      ? databaseCache.leases.findIndex((l) => l.id === leaseData.id)
      : -1;

    const existing = existingIndex >= 0 ? databaseCache.leases[existingIndex] : null;
    const id = leaseData.id || existing?.id || randomUUID();
    const code = leaseData.code || existing?.code || `RENTIA-${(leaseData.city || 'AND').substring(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const record: LeaseRecord = {
      id,
      user_id: leaseData.user_id,
      code,
      address: leaseData.address,
      city: leaseData.city || existing?.city || 'Málaga',
      postal_code: leaseData.postal_code || existing?.postal_code || '',
      country: leaseData.country || existing?.country || 'España',
      currency: leaseData.currency || existing?.currency || '€',
      property_type: leaseData.property_type || existing?.property_type || 'Piso',
      rent: Number(leaseData.rent) || 0,
      deposit: leaseData.deposit !== undefined ? Number(leaseData.deposit) : (existing?.deposit || Number(leaseData.rent) * 2),
      start_date: leaseData.start_date || existing?.start_date || '2024-01-01',
      end_date: leaseData.end_date || existing?.end_date || 'Actual',
      owner_name_guess: leaseData.owner_name_guess,
      owner_contact: leaseData.owner_contact || existing?.owner_contact || '',
      status: leaseData.status || existing?.status || 'pending',
      crypto_hash: leaseData.crypto_hash || existing?.crypto_hash,
      confirmed_at: leaseData.confirmed_at || existing?.confirmed_at,
      verifications: leaseData.verifications || existing?.verifications || [],
      created_at: existing?.created_at || now,
      updated_at: now,
    };

    if (existingIndex >= 0) {
      databaseCache.leases[existingIndex] = record;
    } else {
      databaseCache.leases.unshift(record);
    }
    saveDatabase();

    // Replicate to Supabase
    if (isSupabaseConfigured()) {
      (async () => {
        try {
          const normalizedStatus = record.status === 'verified' ? 'verified' : record.status === 'rejected' ? 'rejected' : 'pending';
          await getSupabaseAdmin()
            .from('leases')
            .upsert({
              id: record.id,
              tenant_id: record.user_id,
              landlord_name: record.owner_name_guess || 'Propietario',
              address: record.address + (record.city ? `, ${record.city}` : ''),
              monthly_rent: record.rent,
              start_date: record.start_date.split('T')[0],
              end_date: (record.end_date && record.end_date !== 'Actual') ? record.end_date.split('T')[0] : null,
              status: normalizedStatus,
              is_locked: false,
            }, { onConflict: 'id' });
        } catch (syncErr) {
          console.warn('Supabase lease sync warning:', syncErr);
        }
      })();
    }

    return record;
  },

  confirmLease(code: string, verificationData: any): LeaseRecord | null {
    const lease = this.getLeaseByCode(code);
    if (!lease) return null;

    const now = new Date().toISOString();
    lease.status = 'verified';
    lease.confirmed_at = now;
    lease.crypto_hash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
    lease.verifications = [
      {
        id: `verif_${Date.now()}`,
        tenancy_confirmed: verificationData.tenancy_confirmed === 'yes',
        rent_paid_ok: verificationData.rent_paid_ok || 'yes',
        property_maintained: verificationData.property_maintained || 'yes',
        would_recommend: verificationData.would_recommend || 'yes',
        comment: verificationData.comment || 'Certificado confirmado por el arrendador.',
        crypto_hash: lease.crypto_hash,
        confirmed_at: now,
      },
    ];
    lease.updated_at = now;
    saveDatabase();

    if (isSupabaseConfigured()) {
      (async () => {
        try {
          await getSupabaseAdmin()
            .from('leases')
            .update({ status: 'verified', updated_at: now })
            .eq('id', lease.id);
        } catch {
          // Ignore
        }
      })();
    }

    return lease;
  },

  deleteLease(id: string): boolean {
    const idx = databaseCache.leases.findIndex((l) => l.id === id);
    if (idx === -1) return false;
    databaseCache.leases.splice(idx, 1);
    saveDatabase();

    if (isSupabaseConfigured()) {
      (async () => {
        try {
          await getSupabaseAdmin().from('leases').delete().eq('id', id);
        } catch {
          // Ignore
        }
      })();
    }
    return true;
  },

  // ==========================================
  // VERIFICACIONES DE TITULARIDAD (OWNERSHIP VERIFICATIONS)
  // ==========================================
  getOwnershipVerifications(status?: string): OwnershipVerificationRecord[] {
    let list = databaseCache.ownership_verifications;
    if (status && status !== 'all') {
      list = list.filter((v) => v.status === status);
    }
    return list;
  },

  getOwnershipVerificationById(id: string): OwnershipVerificationRecord | undefined {
    return databaseCache.ownership_verifications.find((v) => v.id === id);
  },

  saveOwnershipVerification(
    verifData: Partial<OwnershipVerificationRecord> & {
      landlord_id: string;
      landlord_email: string;
      property_address: string;
      city: string;
    }
  ): OwnershipVerificationRecord {
    const now = new Date().toISOString();
    const id = verifData.id || randomUUID();

    const record: OwnershipVerificationRecord = {
      id,
      landlord_id: verifData.landlord_id,
      landlord_email: verifData.landlord_email.trim().toLowerCase(),
      landlord_name: verifData.landlord_name,
      listing_id: verifData.listing_id,
      property_address: verifData.property_address,
      city: verifData.city,
      reference_cadastral: verifData.reference_cadastral,
      verification_type: verifData.verification_type || 'Nota Simple Registral',
      status: verifData.status || 'pending',
      document_url: verifData.document_url,
      notes: verifData.notes,
      rejection_reason: verifData.rejection_reason,
      created_at: now,
    };

    const existingIdx = databaseCache.ownership_verifications.findIndex((v) => v.id === id);
    if (existingIdx >= 0) {
      databaseCache.ownership_verifications[existingIdx] = record;
    } else {
      databaseCache.ownership_verifications.unshift(record);
    }
    saveDatabase();

    // Replicate to Supabase
    if (isSupabaseConfigured() && record.listing_id) {
      (async () => {
        try {
          await getSupabaseAdmin()
            .from('ownership_verifications')
            .upsert({
              id: record.id,
              listing_id: record.listing_id,
              document_url: record.document_url || 'https://rentia.app/documents/nota_simple.pdf',
              status: record.status || 'pending',
              rejection_reason: record.rejection_reason || null,
            }, { onConflict: 'id' });
        } catch (syncErr) {
          console.warn('Supabase ownership_verification sync warning:', syncErr);
        }
      })();
    }

    return record;
  },

  createOwnershipVerification(
    verifData: any
  ): OwnershipVerificationRecord {
    return this.saveOwnershipVerification({
      landlord_id: verifData.landlord_id || '',
      landlord_email: verifData.landlord_email || '',
      property_address: verifData.property_address || '',
      city: verifData.city || 'Málaga',
      ...verifData,
    });
  },

  reviewOwnershipVerification(
    id: string,
    decision: 'verified' | 'rejected',
    reviewerId?: string,
    reason?: string
  ): OwnershipVerificationRecord | null {
    const verif = databaseCache.ownership_verifications.find((v) => v.id === id);
    if (!verif) return null;

    const now = new Date().toISOString();
    verif.status = decision;
    verif.reviewed_at = now;
    verif.reviewed_by = reviewerId || 'admin';
    if (decision === 'rejected') {
      verif.rejection_reason = reason;
    }
    saveDatabase();

    // Si tiene listing asociado, actualizar el listing
    if (verif.listing_id) {
      const listing = databaseCache.listings.find((l) => l.id === verif.listing_id);
      if (listing) {
        listing.is_verified = decision === 'verified';
        saveDatabase();
      }
    }

    // Replicate review to Supabase
    if (isSupabaseConfigured()) {
      (async () => {
        try {
          await getSupabaseAdmin()
            .from('ownership_verifications')
            .update({
              status: decision,
              rejection_reason: decision === 'rejected' ? reason : null,
            })
            .eq('id', id);

          if (verif.listing_id) {
            await getSupabaseAdmin()
              .from('listings')
              .update({
                verification_status: decision === 'verified' ? 'verified' : 'rejected',
              })
              .eq('id', verif.listing_id);
          }
        } catch (syncErr) {
          console.warn('Supabase review sync warning:', syncErr);
        }
      })();
    }

    return verif;
  },

  // ==========================================
  // SWIPES & MATCHES
  // ==========================================
  getSwipes(filter?: { actorId?: string; targetId?: string; actorRole?: string; action?: string }): SwipeRecord[] {
    let list = databaseCache.swipes;
    if (filter?.actorId) {
      list = list.filter((s) => s.actor_id === filter.actorId);
    }
    if (filter?.targetId) {
      list = list.filter((s) => s.target_id === filter.targetId || s.target_user_id === filter.targetId);
    }
    if (filter?.actorRole) {
      list = list.filter((s) => s.actor_role === filter.actorRole);
    }
    if (filter?.action) {
      list = list.filter((s) => s.action === filter.action);
    }
    return list;
  },

  deleteSwipe(actorId: string, targetId: string): boolean {
    const idx = databaseCache.swipes.findIndex(
      (s) => s.actor_id === actorId && (s.target_id === targetId || s.target_user_id === targetId || s.listing_id === targetId)
    );
    if (idx >= 0) {
      databaseCache.swipes.splice(idx, 1);
      saveDatabase();
      return true;
    }
    return false;
  },

  saveSwipe(swipeData: Omit<SwipeRecord, 'id' | 'created_at'>): SwipeRecord {
    const existingIndex = databaseCache.swipes.findIndex(
      (s) =>
        s.actor_id === swipeData.actor_id &&
        ((swipeData.listing_id && s.listing_id === swipeData.listing_id) ||
          (swipeData.target_id && s.target_id === swipeData.target_id) ||
          (swipeData.target_user_id && s.target_user_id === swipeData.target_user_id))
    );

    const id = existingIndex >= 0 ? databaseCache.swipes[existingIndex].id : randomUUID();
    const record: SwipeRecord = {
      ...swipeData,
      id,
      created_at: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      databaseCache.swipes[existingIndex] = record;
    } else {
      databaseCache.swipes.unshift(record);
    }
    saveDatabase();

    // Replicate to Supabase
    if (isSupabaseConfigured() && (record.target_id || record.listing_id)) {
      (async () => {
        try {
          await getSupabaseAdmin()
            .from('swipes')
            .insert({
              id: record.id,
              swiper_user_id: record.actor_id,
              swiper_role: record.actor_role === 'landlord' ? 'landlord' : 'tenant',
              target_type: 'listing',
              target_id: record.target_id || record.listing_id,
              action: record.action === 'like' ? 'like' : 'pass',
            });
        } catch (syncErr) {
          console.warn('Supabase swipe sync warning:', syncErr);
        }
      })();
    }

    return record;
  },

  recordSwipe(swipeData: Omit<SwipeRecord, 'id' | 'created_at'>): SwipeRecord {
    return this.saveSwipe(swipeData);
  },

  removeSwipe(actorId: string, listingId: string): boolean {
    const beforeCount = databaseCache.swipes.length;
    databaseCache.swipes = databaseCache.swipes.filter(
      (s) => !(s.actor_id === actorId && (s.listing_id === listingId || s.target_id === listingId || s.target_user_id === listingId))
    );
    // Also remove any pending match associated with this swipe
    databaseCache.matches = databaseCache.matches.filter(
      (m) => !(m.tenant_id === actorId && m.listing_id === listingId && ((m.status as string) === 'pending' || m.status === 'open'))
    );
    saveDatabase();
    return databaseCache.swipes.length < beforeCount;
  },

  getSwipedListingIds(actorId: string): { liked: string[]; passed: string[]; all: string[] } {
    const userSwipes = databaseCache.swipes.filter((s) => s.actor_id === actorId);
    const liked: string[] = [];
    const passed: string[] = [];
    userSwipes.forEach((s) => {
      const lid = s.listing_id || s.target_id || s.target_user_id;
      if (lid) {
        if (s.action === 'like') {
          liked.push(lid);
        } else {
          passed.push(lid);
        }
      }
    });
    return {
      liked: Array.from(new Set(liked)),
      passed: Array.from(new Set(passed)),
      all: Array.from(new Set([...liked, ...passed])),
    };
  },

  getMatches(filter?: string | { tenantId?: string; landlordId?: string }): MatchRecord[] {
    let list = databaseCache.matches;
    if (typeof filter === 'string') {
      return list.filter((m) => m.tenant_id === filter || m.landlord_id === filter);
    }
    if (filter?.tenantId) {
      list = list.filter((m) => m.tenant_id === filter.tenantId);
    }
    if (filter?.landlordId) {
      list = list.filter((m) => m.landlord_id === filter.landlordId);
    }
    return list;
  },

  getMatchById(id: string): MatchRecord | undefined {
    return databaseCache.matches.find((m) => m.id === id);
  },

  saveMatch(
    matchData: Partial<MatchRecord> & {
      tenant_id: string;
      landlord_id: string;
      listing_id: string;
    }
  ): MatchRecord {
    const now = new Date().toISOString();
    const existing = databaseCache.matches.find(
      (m) =>
        m.tenant_id === matchData.tenant_id &&
        m.landlord_id === matchData.landlord_id &&
        m.listing_id === matchData.listing_id
    );

    if (existing) {
      Object.assign(existing, matchData, { updated_at: now });
      saveDatabase();
      return existing;
    }

    const id = matchData.id || randomUUID();
    const record: MatchRecord = {
      id,
      tenant_id: matchData.tenant_id,
      landlord_id: matchData.landlord_id,
      listing_id: matchData.listing_id,
      status: matchData.status || 'active',
      tenant_name: matchData.tenant_name,
      landlord_name: matchData.landlord_name,
      listing_title: matchData.listing_title,
      listing_city: matchData.listing_city,
      listing_rent: matchData.listing_rent,
      landlord_first_message_sent: matchData.landlord_first_message_sent || false,
      score: matchData.score || 92,
      created_at: now,
      updated_at: now,
    };

    databaseCache.matches.unshift(record);
    saveDatabase();

    // Replicate to Supabase
    if (isSupabaseConfigured()) {
      (async () => {
        try {
          await getSupabaseAdmin()
            .from('matches')
            .upsert({
              id: record.id,
              landlord_id: record.landlord_id,
              tenant_id: record.tenant_id,
              listing_id: record.listing_id,
              opened_by: record.tenant_id,
              status: record.status === 'closed' ? 'closed' : 'open',
            }, { onConflict: 'id' });
        } catch (syncErr) {
          console.warn('Supabase match sync warning:', syncErr);
        }
      })();
    }

    return record;
  },

  updateMatch(id: string, updates: Partial<MatchRecord>): MatchRecord | null {
    const match = databaseCache.matches.find((m) => m.id === id);
    if (!match) return null;
    Object.assign(match, updates, { updated_at: new Date().toISOString() });
    saveDatabase();

    // Replicate update to Supabase
    if (isSupabaseConfigured()) {
      (async () => {
        try {
          const status = updates.status === 'closed' ? 'closed' : 'open';
          await getSupabaseAdmin()
            .from('matches')
            .update({ status })
            .eq('id', id);
        } catch (syncErr) {
          console.warn('Supabase match update warning:', syncErr);
        }
      })();
    }

    return match;
  },

  // ==========================================
  // MENSAJERÍA (CHATS)
  // ==========================================
  getChatMessages(matchId: string): ChatMessageRecord[] {
    return databaseCache.chat_messages
      .filter((m) => m.match_id === matchId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  },

  saveChatMessage(msgData: Omit<ChatMessageRecord, 'id' | 'created_at' | 'read'>): ChatMessageRecord {
    const id = randomUUID();
    const record: ChatMessageRecord = {
      ...msgData,
      id,
      read: false,
      created_at: new Date().toISOString(),
    };
    databaseCache.chat_messages.push(record);
    saveDatabase();

    // Replicate to Supabase
    if (isSupabaseConfigured()) {
      (async () => {
        try {
          await getSupabaseAdmin()
            .from('messages')
            .insert({
              id: record.id,
              match_id: record.match_id,
              sender_id: record.sender_id,
              content: record.content,
            });
        } catch (syncErr) {
          console.warn('Supabase message sync warning:', syncErr);
        }
      })();
    }

    return record;
  },

  markChatMessagesAsRead(matchId: string, readerId: string): number {
    let count = 0;
    databaseCache.chat_messages.forEach((m) => {
      if (m.match_id === matchId && m.sender_id !== readerId && !m.read) {
        m.read = true;
        count++;
      }
    });

    if (count > 0) {
      saveDatabase();
      if (isSupabaseConfigured()) {
        (async () => {
          try {
            await getSupabaseAdmin()
              .from('messages')
              .update({ read_at: new Date().toISOString() })
              .eq('match_id', matchId)
              .neq('sender_id', readerId);
          } catch (syncErr) {
            console.warn('Supabase mark read warning:', syncErr);
          }
        })();
      }
    }
    return count;
  },

  // ==========================================
  // ESTADÍSTICAS GLOBALES EXACTAS DE LA BASE DE DATOS
  // ==========================================
  getExactDatabaseStats(): {
    totalUsers: number;
    totalListings: number;
    totalTenants: number;
    totalMatches: number;
    totalLeases: number;
    pendingOwnerships: number;
    pendingLeases: number;
    totalLogins: number;
    totalSessions: number;
    activeSessionsNow: number;
    totalTimeSpentMinutes: number;
  } {
    const users = databaseCache.users;
    const listings = databaseCache.listings;
    const tenantProfiles = databaseCache.tenant_profiles;
    const matches = databaseCache.matches;
    const leases = databaseCache.leases;
    const verifs = databaseCache.ownership_verifications;
    const logins = databaseCache.user_logins;
    const sessions = databaseCache.user_sessions;

    const totalTimeSpentSeconds = sessions.reduce((acc, s) => acc + (s.duration_seconds || 0), 0);

    return {
      totalUsers: users.length,
      totalListings: listings.length,
      totalTenants: tenantProfiles.length,
      totalMatches: matches.length,
      totalLeases: leases.length,
      pendingOwnerships: verifs.filter((v) => v.status === 'pending').length,
      pendingLeases: leases.filter((l) => l.status === 'pending').length,
      totalLogins: logins.length,
      totalSessions: sessions.length,
      activeSessionsNow: sessions.filter((s) => s.is_active).length,
      totalTimeSpentMinutes: Math.round(totalTimeSpentSeconds / 60),
    };
  },

  getRealAdminAnalytics() {
    const users = databaseCache.users;
    const listings = databaseCache.listings;
    const tenantProfiles = databaseCache.tenant_profiles;
    const matches = databaseCache.matches;
    const leases = databaseCache.leases;
    const verifs = databaseCache.ownership_verifications;
    const logins = databaseCache.user_logins;
    const sessions = databaseCache.user_sessions;
    const swipes = databaseCache.swipes;

    const tenants = users.filter((u) => u.role === 'tenant');
    const landlords = users.filter((u) => u.role === 'landlord');
    const admins = users.filter((u) => u.role === 'admin');
    const activeUsers = users.filter((u) => u.is_active !== false);

    // Trust Scores
    const trustScores = users.map((u) => u.trust_score || 85);
    const avgTrustScore = trustScores.length > 0 ? Math.round(trustScores.reduce((a, b) => a + b, 0) / trustScores.length) : 0;

    // Listings breakdown
    const activeListings = listings.filter((l) => l.is_active !== false && l.status !== 'rented');
    const rentedListings = listings.filter((l) => l.status === 'rented');
    const cityListingsCount: Record<string, number> = {};
    const bedroomsCount: Record<string, number> = { '1': 0, '2': 0, '3': 0, '4+': 0 };
    let sumRent = 0;
    listings.forEach((l) => {
      const city = l.city || 'Desconocida';
      cityListingsCount[city] = (cityListingsCount[city] || 0) + 1;
      const beds = Number(l.bedrooms) || 1;
      if (beds <= 1) bedroomsCount['1'] = (bedroomsCount['1'] || 0) + 1;
      else if (beds === 2) bedroomsCount['2'] = (bedroomsCount['2'] || 0) + 1;
      else if (beds === 3) bedroomsCount['3'] = (bedroomsCount['3'] || 0) + 1;
      else bedroomsCount['4+'] = (bedroomsCount['4+'] || 0) + 1;

      if (l.rent) sumRent += Number(l.rent);
    });
    const avgRent = listings.length > 0 ? Math.round(sumRent / listings.length) : 0;

    // Tenant profiles breakdown
    let sumBudget = 0;
    let sumIncome = 0;
    let payslipsCount = 0;
    tenantProfiles.forEach((tp) => {
      if (tp.max_budget) sumBudget += Number(tp.max_budget);
      if (tp.monthly_income) sumIncome += Number(tp.monthly_income);
      if (tp.has_payslips) payslipsCount += 1;
    });
    const avgBudget = tenantProfiles.length > 0 ? Math.round(sumBudget / tenantProfiles.length) : 0;
    const avgIncome = tenantProfiles.length > 0 ? Math.round(sumIncome / tenantProfiles.length) : 0;

    // Leases
    const verifiedLeases = leases.filter((l) => l.status === 'verified');
    const pendingLeases = leases.filter((l) => l.status === 'pending');
    let totalRentVolume = 0;
    let totalDepositSecured = 0;
    leases.forEach((l) => {
      if (l.rent) totalRentVolume += Number(l.rent);
      if (l.deposit) totalDepositSecured += Number(l.deposit);
    });

    // Swipes & Matches
    const likesCount = swipes.filter((s) => s.action === 'like').length;
    const passesCount = swipes.filter((s) => s.action === 'pass').length;
    const activeMatches = matches.filter((m) => m.status === 'active');
    const pendingMatches = matches.filter((m) => (m.status as string) === 'pending' || m.status === 'open');

    // Sessions & Traffic
    const totalTimeSpentSeconds = sessions.reduce((acc, s) => acc + (s.duration_seconds || 0), 0);
    const avgSessionSeconds = sessions.length > 0 ? Math.round(totalTimeSpentSeconds / sessions.length) : 0;
    const successfulLogins = logins.filter((l) => l.status === 'success').length;
    const failedLogins = logins.filter((l) => l.status === 'failed').length;
    const devicesBreakdown: Record<string, number> = { Escritorio: 0, Móvil: 0, Tablet: 0 };
    sessions.forEach((s) => {
      const d = s.device_type || 'Escritorio';
      devicesBreakdown[d] = (devicesBreakdown[d] || 0) + 1;
    });

    return {
      users: {
        total: users.length,
        tenantsCount: tenants.length,
        landlordsCount: landlords.length,
        adminsCount: admins.length,
        activeCount: activeUsers.length,
        avgTrustScore,
      },
      tenants: {
        totalProfiles: tenantProfiles.length,
        avgBudget,
        avgIncome,
        payslipsCount,
        payslipsPercentage: tenantProfiles.length > 0 ? Math.round((payslipsCount / tenantProfiles.length) * 100) : 0,
      },
      listings: {
        total: listings.length,
        activeCount: activeListings.length,
        rentedCount: rentedListings.length,
        avgRent,
        cityDistribution: cityListingsCount,
        bedroomsDistribution: bedroomsCount,
      },
      leases: {
        total: leases.length,
        verifiedCount: verifiedLeases.length,
        pendingCount: pendingLeases.length,
        totalRentVolume,
        totalDepositSecured,
      },
      matches: {
        totalSwipes: swipes.length,
        likesCount,
        passesCount,
        totalMatches: matches.length,
        activeMatches: activeMatches.length,
        pendingMatches: pendingMatches.length,
      },
      traffic: {
        totalLogins: logins.length,
        successfulLogins,
        failedLogins,
        activeSessionsNow: sessions.filter((s) => s.is_active).length,
        totalSessions: sessions.length,
        totalTimeSpentMinutes: Math.round(totalTimeSpentSeconds / 60),
        avgSessionSeconds,
        devicesBreakdown,
      },
      verifications: {
        totalOwnershipRequests: verifs.length,
        pendingOwnerships: verifs.filter((v) => v.status === 'pending').length,
        approvedOwnerships: verifs.filter((v) => v.status === 'verified').length,
        rejectedOwnerships: verifs.filter((v) => v.status === 'rejected').length,
      },
    };
  },

  // ==========================================
  // NOTIFICACIONES Y ALERTAS POR EMAIL
  // ==========================================
  createNotification(
    data: Omit<RentiaNotificationRecord, 'id' | 'created_at'>
  ): RentiaNotificationRecord {
    const record: RentiaNotificationRecord = {
      ...data,
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      created_at: new Date().toISOString(),
    };

    if (!databaseCache.notifications) {
      databaseCache.notifications = [];
    }
    databaseCache.notifications.unshift(record);
    if (databaseCache.notifications.length > 500) {
      databaseCache.notifications = databaseCache.notifications.slice(0, 500);
    }
    saveDatabase();

    // Simulación del servicio de envío de email / push para App y Web
    if (record.email_sent && record.email_recipient) {
      console.log(`\n======================================================`);
      console.log(`📨 [RENTIA EMAIL SERVICE DISPATCH]`);
      console.log(`Para: ${record.email_recipient}`);
      console.log(`Asunto: ${record.title}`);
      console.log(`Cuerpo: ${record.body}`);
      console.log(`Fecha: ${record.created_at}`);
      console.log(`======================================================\n`);
    }

    return record;
  },

  getNotifications(userId: string): RentiaNotificationRecord[] {
    if (!databaseCache.notifications) return [];
    return databaseCache.notifications.filter(
      (n) => n.user_id === userId || n.user_id === 'all'
    );
  },

  markNotificationAsRead(id: string): boolean {
    if (!databaseCache.notifications) return false;
    const notif = databaseCache.notifications.find((n) => n.id === id);
    if (!notif) return false;
    notif.read = true;
    saveDatabase();
    return true;
  },

  markAllNotificationsAsRead(userId: string): boolean {
    if (!databaseCache.notifications) return false;
    databaseCache.notifications.forEach((n) => {
      if (n.user_id === userId || n.user_id === 'all') {
        n.read = true;
      }
    });
    saveDatabase();
    return true;
  },

  // ==========================================
  // DENUNCIAS Y MODERACIÓN (REPORTS)
  // ==========================================
  createReport(data: {
    reporter_id: string;
    reporter_name?: string;
    reporter_email?: string;
    reporter_role?: string;
    target_type: 'listing' | 'tenant_profile' | 'user';
    target_id: string;
    target_title?: string;
    target_user_id?: string;
    target_user_email?: string;
    target_user_name?: string;
    reason: 'fake_content' | 'suspected_scam' | 'wrong_photos' | 'inappropriate_behavior' | 'price_fraud' | 'other';
    reason_label?: string;
    details: string;
    evidence_url?: string;
  }): ReportRecord {
    if (!databaseCache.reports) databaseCache.reports = [];

    const record: ReportRecord = {
      id: `rep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      ...data,
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    databaseCache.reports.unshift(record);
    saveDatabase();

    // Notificar al admin por logs/notificación interna
    this.createNotification({
      user_id: 'admin',
      type: 'system',
      title: `🚨 Nueva denuncia recibida (${data.reason})`,
      body: `Se ha denunciado el elemento ${data.target_type} #${data.target_id.substring(0, 8)}: "${data.details.substring(0, 60)}..."`,
      read: false,
      email_sent: true,
      email_recipient: 'admin@rentia.app',
    });

    return record;
  },

  getReports(status?: string): ReportRecord[] {
    if (!databaseCache.reports) databaseCache.reports = [];
    if (status && status !== 'all') {
      return databaseCache.reports.filter((r) => r.status === status);
    }
    return databaseCache.reports;
  },

  updateReportStatus(
    reportId: string,
    action: 'user_blocked' | 'listing_removed' | 'dismissed' | 'none',
    actionNotes?: string,
    reviewedBy?: string
  ): ReportRecord | null {
    if (!databaseCache.reports) return null;
    const rep = databaseCache.reports.find((r) => r.id === reportId);
    if (!rep) return null;

    rep.action_taken = action;
    rep.status = action === 'dismissed' ? 'dismissed' : 'action_taken';
    rep.action_notes = actionNotes || '';
    rep.reviewed_by = reviewedBy || 'admin';
    rep.reviewed_at = new Date().toISOString();

    // Si la acción es user_blocked, bloquear la cuenta y añadir a lista negra
    if (action === 'user_blocked') {
      const targetUserId = rep.target_user_id || (rep.target_type === 'user' ? rep.target_id : undefined);
      const targetEmail = rep.target_user_email;
      if (targetUserId) {
        this.blockUser(targetUserId, `Bloqueado por moderación de denuncia #${rep.id}: ${rep.reason}`);
      } else if (targetEmail) {
        this.blockEmail(targetEmail, `Bloqueado por denuncia #${rep.id}: ${rep.reason}`, reviewedBy);
      }
    }

    // Si la acción es listing_removed, desactivar el anuncio
    if (action === 'listing_removed') {
      const listingId = rep.target_type === 'listing' ? rep.target_id : undefined;
      if (listingId) {
        this.blockListing(listingId, `Retirado por moderación de denuncia #${rep.id}`);
      }
    }

    saveDatabase();
    return rep;
  },

  blockUser(userId: string, reason?: string): boolean {
    const user = databaseCache.users.find((u) => u.id === userId);
    if (user) {
      user.is_active = false;
      user.updated_at = new Date().toISOString();
      if (user.email) {
        this.blockEmail(user.email, reason || 'Usuario bloqueado por administración', 'admin');
      }
    }

    // Inactivar sesiones
    databaseCache.user_sessions.forEach((s) => {
      if (s.user_id === userId) s.is_active = false;
    });

    saveDatabase();
    return true;
  },

  blockListing(listingId: string, reason?: string): boolean {
    const listing = databaseCache.listings.find((l) => l.id === listingId);
    if (listing) {
      listing.is_active = false;
      listing.updated_at = new Date().toISOString();
      saveDatabase();
      return true;
    }
    return false;
  },

  // ==========================================
  // VERIFICACIÓN DE IDENTIDAD KYC (DNI + SELFIE)
  // ==========================================
  submitKycVerification(data: {
    user_id: string;
    user_name: string;
    user_email: string;
    user_role: 'tenant' | 'landlord';
    id_document_number?: string;
    id_document_type?: 'DNI' | 'NIE' | 'Pasaporte';
    dni_front_url: string;
    dni_back_url?: string;
    selfie_url: string;
    selfie_with_id_url?: string;
  }): KycVerificationRecord {
    if (!databaseCache.kyc_verifications) databaseCache.kyc_verifications = [];

    const existingIndex = databaseCache.kyc_verifications.findIndex((k) => k.user_id === data.user_id);
    
    const record: KycVerificationRecord = {
      id: `kyc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      ...data,
      status: 'pending',
      submitted_at: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      databaseCache.kyc_verifications[existingIndex] = record;
    } else {
      databaseCache.kyc_verifications.unshift(record);
    }

    // Marcar usuario como pendiente de revisión admin
    const user = databaseCache.users.find((u) => u.id === data.user_id || u.email === data.user_email);
    if (user) {
      user.verification_status = 'pending_admin';
      user.dni_url = data.dni_front_url;
      user.selfie_url = data.selfie_url;
      user.id_document_number = data.id_document_number;
    }

    const tProfile = databaseCache.tenant_profiles.find((p) => p.user_id === data.user_id || p.email === data.user_email);
    if (tProfile) {
      tProfile.verification_status = 'pending_admin';
      tProfile.dni_url = data.dni_front_url;
      tProfile.selfie_url = data.selfie_url;
    }

    saveDatabase();
    return record;
  },

  getKycVerifications(status?: string): KycVerificationRecord[] {
    if (!databaseCache.kyc_verifications) databaseCache.kyc_verifications = [];
    if (status && status !== 'all') {
      return databaseCache.kyc_verifications.filter((k) => k.status === status);
    }
    return databaseCache.kyc_verifications;
  },

  reviewKycVerification(
    kycId: string,
    status: 'verified' | 'rejected',
    rejectionReason?: string,
    reviewedBy?: string
  ): KycVerificationRecord | null {
    if (!databaseCache.kyc_verifications) return null;
    const kyc = databaseCache.kyc_verifications.find((k) => k.id === kycId);
    if (!kyc) return null;

    kyc.status = status;
    kyc.rejection_reason = status === 'rejected' ? (rejectionReason || 'Documento no válido o selfie poco legible') : undefined;
    kyc.reviewed_at = new Date().toISOString();
    kyc.reviewed_by = reviewedBy || 'admin';

    // Actualizar usuario
    const user = databaseCache.users.find((u) => u.id === kyc.user_id || u.email === kyc.user_email);
    if (user) {
      user.is_verified = status === 'verified';
      user.verification_status = status;
      if (status === 'verified') {
        user.trust_score = Math.max(user.trust_score || 50, 85);
      }
    }

    // Si es perfil de inquilino, otorgar o denegar el check verde
    const tProfile = databaseCache.tenant_profiles.find((p) => p.user_id === kyc.user_id || p.email === kyc.user_email);
    if (tProfile) {
      tProfile.is_verified = status === 'verified';
      tProfile.verification_status = status;
      if (status === 'verified') {
        tProfile.trust_score = Math.max(tProfile.trust_score || 50, 92);
      }
    }

    saveDatabase();
    return kyc;
  },

  // ==========================================
  // PERFIL FINANCIERO Y PERSONAL DEL INQUILINO
  // ==========================================
  updateTenantFinancialProfile(
    userIdOrEmail: string,
    updates: Partial<TenantProfileRecord>
  ): TenantProfileRecord | null {
    let tProfile = databaseCache.tenant_profiles.find(
      (p) => p.user_id === userIdOrEmail || p.email === userIdOrEmail
    );

    if (!tProfile) {
      const user = databaseCache.users.find(
        (u) => u.id === userIdOrEmail || u.email === userIdOrEmail
      );
      if (user) {
        tProfile = {
          id: `tp_${Date.now()}`,
          user_id: user.id,
          email: user.email,
          name: user.name,
          monthly_income: updates.monthly_income || 1800,
          employment_type: updates.employment_type || 'indefinido',
          current_city: updates.target_city || 'Málaga',
          max_budget: updates.max_budget || 900,
          has_guarantor: updates.has_guarantor ?? false,
          guarantor_income: updates.guarantor_income,
          pets: updates.has_pets ?? false,
          has_pets: updates.has_pets ?? false,
          pet_details: updates.pet_details,
          smokers: updates.smoking === 'yes',
          trust_score: 80,
          is_verified: user.is_verified,
          verification_status: user.verification_status || 'unverified',
          created_at: new Date().toISOString(),
        };
        databaseCache.tenant_profiles.push(tProfile);
      } else {
        return null;
      }
    }

    Object.assign(tProfile, updates);
    if (updates.has_pets !== undefined) {
      tProfile.pets = updates.has_pets;
    }
    if (updates.photos && Array.isArray(updates.photos) && updates.photos.length > 0) {
      tProfile.photos = updates.photos;
      if (!tProfile.avatar_url && updates.photos[0]) {
        tProfile.avatar_url = updates.photos[0];
      }
    }

    tProfile.updated_at = new Date().toISOString();
    saveDatabase();
    return tProfile;
  },

  /**
   * Guarda un fallo de sincronización con Supabase para reintentos posteriores (P10.1)
   */
  recordPendingSyncWrite(data: {
    route: string;
    operation: string;
    target_table: string;
    payload?: any;
    error: string;
  }): PendingSyncWriteRecord {
    const item: PendingSyncWriteRecord = {
      id: `sync_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      route: data.route,
      operation: data.operation,
      target_table: data.target_table,
      payload: data.payload,
      error: data.error,
      created_at: new Date().toISOString(),
    };
    if (!databaseCache.pending_sync_writes) {
      databaseCache.pending_sync_writes = [];
    }
    databaseCache.pending_sync_writes.push(item);
    // Keep last 1000 failed sync writes
    if (databaseCache.pending_sync_writes.length > 1000) {
      databaseCache.pending_sync_writes = databaseCache.pending_sync_writes.slice(-1000);
    }
    saveDatabase();
    return item;
  },

  getPendingSyncWrites(): PendingSyncWriteRecord[] {
    return databaseCache.pending_sync_writes || [];
  },
};

/**
 * Función unificada para registrar errores de escritura a Supabase de forma visible,
 * estructurada y registrable en pending_sync_writes (Prioridad 10.1).
 */
export function logSupabaseWriteFailure(context: {
  route: string;
  operation: string;
  target_table: string;
  payload?: any;
  error: any;
}) {
  const errMsg = context.error?.message || (typeof context.error === 'string' ? context.error : JSON.stringify(context.error));
  console.error('[SUPABASE_WRITE_FAILED]', {
    route: context.route,
    operation: context.operation,
    target_table: context.target_table,
    error: errMsg,
  });
  try {
    RentiaDB.recordPendingSyncWrite({
      route: context.route,
      operation: context.operation,
      target_table: context.target_table,
      payload: context.payload,
      error: errMsg,
    });
  } catch {
    // Non-blocking
  }
}
