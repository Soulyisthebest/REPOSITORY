// Client-side API client connecting to Rentia backend + Supabase
import { PaymentRecord, ExtractedContractData } from '../types';
import { supabase, isClientSupabaseConfigured } from '../lib/supabase';

const API_BASE = '/api';

export async function getAuthToken(): Promise<string | null> {
  // 1. Check localStorage token first (especially demo/local tokens)
  const storedToken = localStorage.getItem('rentia_jwt_token');
  if (storedToken) {
    if (storedToken.startsWith('rentia_local_')) {
      try {
        const raw = storedToken.replace('rentia_local_', '');
        const decoded = JSON.parse(atob(raw));
        if (decoded.exp && decoded.exp <= Date.now()) {
          localStorage.removeItem('rentia_jwt_token');
          return null;
        }
        return storedToken;
      } catch {
        localStorage.removeItem('rentia_jwt_token');
        return null;
      }
    }
  }

  // 2. Only check Supabase session if Supabase is actually configured
  if (isClientSupabaseConfigured()) {
    try {
      const { data } = await supabase.auth.getSession();
      const session = data?.session;
      if (session?.access_token) {
        const nowSec = Math.floor(Date.now() / 1000);
        // If token is expired or within 60 seconds of expiring, refresh session proactively
        if (session.expires_at && session.expires_at <= nowSec + 60) {
          try {
            const { data: refreshed, error: refreshErr } = await supabase.auth.refreshSession();
            if (!refreshErr && refreshed?.session?.access_token) {
              setAuthToken(refreshed.session.access_token);
              return refreshed.session.access_token;
            }
          } catch {
            // Refresh attempt failed
          }
          // If expired and refresh failed, clear dead token
          if (session.expires_at <= nowSec) {
            setAuthToken(null);
          }
        } else {
          return session.access_token;
        }
      }
    } catch {
      // Ignore session get errors
    }
  }

  // Fallback to non-expired stored JWT token
  if (storedToken) {
    if (storedToken.includes('.')) {
      try {
        const parts = storedToken.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          if (payload.exp && payload.exp * 1000 <= Date.now()) {
            localStorage.removeItem('rentia_jwt_token');
            return null;
          }
        }
      } catch {}
    }
    return storedToken;
  }

  return null;
}

export function setAuthToken(token: string | null) {
  if (token) {
    localStorage.setItem('rentia_jwt_token', token);
  } else {
    localStorage.removeItem('rentia_jwt_token');
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = await getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 401) {
      const errMsg = String(data.error || '').toLowerCase();
      if (data.code === 'INVALID_TOKEN' || errMsg.includes('expirada') || errMsg.includes('invalide') || errMsg.includes('expired')) {
        setAuthToken(null);
        localStorage.removeItem('rentia_jwt_token');
        localStorage.removeItem('rentia_session_id');
      }
    }
    throw new Error(data.error || `Error (${res.status})`);
  }

  return data as T;
}

export const api = {
  // Auth endpoints (Supabase Auth)
  auth: {
    register: (payload: {
      name: string;
      email: string;
      password: string;
      phone: string;
      role?: 'tenant' | 'landlord' | 'agency';
      preferred_lang?: string;
      privacy_policy_accepted: boolean;
      otp?: string;
    }) =>
      request<{ message: string; token: string; tenant: any }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),

    login: (email: string, password: string, preferred_lang?: string, requested_role?: 'tenant' | 'landlord' | 'agency' | 'admin') =>
      request<{ message: string; token: string; tenant: any; sessionId?: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password, preferred_lang, requested_role }),
      }),

    adminDirectAccess: (email?: string, name?: string) =>
      request<{ success: boolean; token: string; sessionId?: string; tenant: any; user: any }>('/auth/admin-direct-access', {
        method: 'POST',
        body: JSON.stringify({ email, name }),
      }),

    requestPhoneOtp: (payload: { phone: string; lang?: string; purpose?: 'register' | 'verify' }) =>
      request<{ success: boolean; otpSent: boolean; realSmsSent?: boolean; provider?: string; message: string; demoCode?: string }>('/auth/request-phone-otp', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),

    getSmsConfigStatus: () =>
      request<{ configured: boolean; isTwilio: boolean; provider: string }>('/auth/sms-config-status'),

    verifyPhoneOtp: (payload: { phone: string; otp: string; lang?: string }) =>
      request<{ success: boolean; verified: boolean; message: string }>('/auth/verify-phone-otp', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),

    forgotPassword: (payload: { email: string; preferred_lang?: string }) =>
      request<{ success: boolean; message: string }>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),

    logout: (sessionId?: string) =>
      request<{ message: string }>('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ sessionId }),
      }),

    sendHeartbeat: (payload: {
      sessionId: string;
      activeDeltaSeconds: number;
      idleDeltaSeconds?: number;
      currentPage?: string;
    }) =>
      request<{ success: boolean; session: any }>('/auth/session/heartbeat', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),

    endSession: (sessionId: string) =>
      request<{ success: boolean }>('/auth/session/end', {
        method: 'POST',
        body: JSON.stringify({ sessionId }),
      }),

    getMySessions: () =>
      request<{ summary: any; logins: any[]; sessions: any[] }>('/auth/my-sessions'),

    recordActivity: (payload: {
      sessionId?: string;
      userId?: string;
      email?: string;
      action: string;
      category?: string;
      path?: string;
      details?: any;
    }) =>
      request<{ success: boolean; record: any }>('/auth/activity', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),

    requestEmailOtp: (payload: { email: string; lang?: string }) =>
      request<{ success: boolean; otpSent: boolean; message: string; demoCode?: string; expiresInSeconds?: number }>('/auth/request-email-otp', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),

    resendEmailOtp: (payload: { email: string; lang?: string }) =>
      request<{ success: boolean; otpSent: boolean; message: string; demoCode?: string; expiresInSeconds?: number }>('/auth/resend-email-otp', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),

    verifyEmailOtp: (payload: { email: string; otp: string; lang?: string }) =>
      request<{ success: boolean; verified: boolean; message: string; token?: string; tenant?: any }>('/auth/verify-email-otp', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
  },

  // Tenant profile endpoints
  tenant: {
    getMe: () =>
      request<{ tenant: any }>('/tenant/me'),

    updateMe: (payload: { name: string; phone?: string; preferred_lang?: string; avatar_url?: string }) =>
      request<{ message: string; tenant: any }>('/tenant/me', {
        method: 'PUT',
        body: JSON.stringify(payload),
      }),

    exportData: () =>
      request<any>('/tenant/export-data'),

    deleteAccount: () =>
      request<{ message: string; anonymized?: boolean }>('/tenant/me', {
        method: 'DELETE',
      }),

    deactivateAccount: () =>
      request<{ success: boolean; message: string; is_active: boolean }>('/tenant/deactivate', {
        method: 'PUT',
      }),

    updateFinancialProfile: (data: {
      userId?: string;
      email?: string;
      photos?: string[];
      avatar_url?: string;
      monthly_income?: number;
      employment_type?: string;
      has_guarantor?: boolean;
      guarantor_income?: number;
      has_pets?: boolean;
      pet_details?: string;
      max_budget?: number;
      target_city?: string;
      bio?: string;
      [key: string]: any;
    }) =>
      request<{ success: boolean; message: string; profile: any }>('/tenant/profile/financial', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  },

  // Lease endpoints
  leases: {
    extractContract: (payload: {
      imageBase64?: string;
      mimeType?: string;
      documentText?: string;
      pages?: Array<{ dataUrl: string; mimeType?: string; name?: string }>;
    }) =>
      request<{ extracted: ExtractedContractData }>('/leases/extract-contract', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),

    getLeases: () =>
      request<{ leases: any[] }>('/leases'),

    createLease: (payload: {
      address: string;
      city?: string;
      postal_code?: string;
      country?: string;
      owner_name_guess: string;
      owner_contact?: string;
      start_date: string;
      end_date?: string;
      rent: number;
      deposit?: number;
      property_type?: string;
      pages?: Array<{ dataUrl: string; mimeType?: string; name?: string }>;
      confidence_score?: number;
      tenant_photo_url?: string;
      tenant_contact_phone?: string;
      tenant_contact_email?: string;
      location_details?: any;
    }) =>
      request<{ message: string; lease: any }>('/leases', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),

    deleteLease: (id: string) =>
      request<{ message: string }>(`/leases/${id}`, {
        method: 'DELETE',
      }),
  },

  // Payment tracking endpoints
  payments: {
    getPayments: () =>
      request<{ payments: PaymentRecord[] }>('/payments'),

    addPayment: (payload: {
      leaseId: string;
      amount: number;
      dueDate?: string;
      paidDate?: string;
      status?: 'paid_on_time' | 'paid_late' | 'pending' | 'unpaid';
    }) =>
      request<{ message: string; payment: PaymentRecord }>('/payments', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
  },

  // Public landlord endpoints (Supabase RPCs: lookup_lease_by_code & confirm_lease_by_code)
  public: {
    lookupLeaseByCode: (code: string) =>
      request<{
        lease: {
          id: string;
          code: string;
          tenantName: string;
          address: string;
          city?: string;
          startDate: string;
          endDate: string;
          rent?: number;
          status: string;
          isAlreadyConfirmed: boolean;
        };
      }>(`/public/leases/${encodeURIComponent(code)}`),

    confirmLease: (
      code: string,
      payload: {
        tenancy_confirmed: 'yes' | 'no';
        rent_paid_ok: 'yes' | 'sometimes' | 'no';
        property_maintained: 'yes' | 'no';
        would_recommend: 'yes' | 'no';
        comment?: string;
        phone?: string;
      }
    ) =>
      request<{ message: string; status: string; cryptoHash: string; confirmedAt: string }>(
        `/public/leases/${encodeURIComponent(code)}/confirm`,
        {
          method: 'POST',
          body: JSON.stringify(payload),
        }
      ),

    requestOtp: (code: string, phone: string) => {
      const cleanCode = (code || '').trim();
      const endpoint = cleanCode
        ? `/public/leases/${encodeURIComponent(cleanCode)}/request-otp`
        : `/public/request-otp`;
      return request<{ message: string; otpSent: boolean; demoCode?: string }>(
        endpoint,
        {
          method: 'POST',
          body: JSON.stringify({ phone, code: cleanCode }),
        }
      );
    },

    verifyOtp: (code: string, phone: string, otp: string) => {
      const cleanCode = (code || '').trim();
      const endpoint = cleanCode
        ? `/public/leases/${encodeURIComponent(cleanCode)}/verify-otp`
        : `/public/verify-otp`;
      return request<{ message: string; verified: boolean }>(
        endpoint,
        {
          method: 'POST',
          body: JSON.stringify({ phone, otp, code: cleanCode }),
        }
      );
    },

    detectLocation: () =>
      request<{
        success: boolean;
        city: string;
        region: string;
        country: string;
        latitude: number;
        longitude: number;
        source: string;
      }>('/public/detect-location'),

    getPublicProfile: (code: string) =>
      request<{
        success: boolean;
        profile: any;
        visibility: Record<string, boolean>;
      }>(`/public/profile/${encodeURIComponent(code)}`),

    updateProfileVisibility: (visibility: Record<string, boolean>) =>
      request<{
        success: boolean;
        message: string;
        visibility: Record<string, boolean>;
      }>('/public/profile-visibility', {
        method: 'PUT',
        body: JSON.stringify({ visibility }),
      }),
  },

  matching: {
    getCompatibility: (listingId: string, tenantId: string) =>
      request<{
        eligible: boolean;
        matchScore: number;
        reason?: string;
        breakdown: {
          compatibility: number;
          verification: number;
          activity: number;
          pointsBonus: number;
          totalRawPoints: number;
        };
      }>(`/matching/compatibility/${encodeURIComponent(listingId)}/${encodeURIComponent(tenantId)}`),

    getPoints: (userId: string) =>
      request<{
        userId: string;
        totalPoints: number;
        eventsCount: number;
        events: Array<{
          id: string;
          action_type: string;
          points_delta: number;
          metadata?: any;
          created_at: string;
        }>;
      }>(`/matching/points/${encodeURIComponent(userId)}`),

    recordPoints: (payload: {
      userId: string;
      actionType: 'LEASE_CONFIRMED' | 'IDENTITY_VERIFIED' | 'NOMINA_VERIFIED' | 'PROFILE_COMPLETED' | 'PAYMENT_RECORDED' | 'MAINTENANCE_RECORDED' | 'MATCH_INTERACTION';
      pointsDelta: number;
      metadata?: any;
    }) =>
      request<{ message: string; eventId: string; pointsDelta: number }>(`/matching/points/record`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),

    getListings: (params?: { 
      city?: string; 
      lat?: number; 
      lng?: number; 
      radius?: number; 
      status?: string; 
      include_inactive?: boolean;
      min_price?: number;
      max_price?: number;
      bedrooms?: number;
      property_type?: string;
      duration_type?: string;
      pets_allowed?: boolean;
      is_furnished?: boolean;
      elevator?: boolean;
      actor_id?: string;
      hide_interacted?: boolean;
      unhearted_only?: boolean;
    }) => {
      const searchParams = new URLSearchParams();
      if (params?.city && params.city !== 'all') searchParams.append('city', params.city);
      if (params?.lat !== undefined && params?.lat !== null) searchParams.append('lat', String(params.lat));
      if (params?.lng !== undefined && params?.lng !== null) searchParams.append('lng', String(params.lng));
      if (params?.radius) searchParams.append('radius', String(params.radius));
      if (params?.status && params.status !== 'all') searchParams.append('status', params.status);
      if (params?.include_inactive) searchParams.append('include_inactive', 'true');
      if (params?.min_price !== undefined) searchParams.append('min_price', String(params.min_price));
      if (params?.max_price !== undefined) searchParams.append('max_price', String(params.max_price));
      if (params?.bedrooms !== undefined) searchParams.append('bedrooms', String(params.bedrooms));
      if (params?.property_type && params.property_type !== 'all') searchParams.append('property_type', params.property_type);
      if (params?.duration_type && params.duration_type !== 'all') searchParams.append('duration_type', params.duration_type);
      if (params?.pets_allowed) searchParams.append('pets_allowed', 'true');
      if (params?.is_furnished) searchParams.append('is_furnished', 'true');
      if (params?.elevator) searchParams.append('elevator', 'true');
      if (params?.actor_id) searchParams.append('actor_id', params.actor_id);
      if (params?.hide_interacted) searchParams.append('hide_interacted', 'true');
      if (params?.unhearted_only) searchParams.append('unhearted_only', 'true');
      const qs = searchParams.toString();
      return request<any[]>(`/matching/listings${qs ? `?${qs}` : ''}`);
    },

    toggleListingStatus: (id: string, isActive?: boolean, status?: 'available' | 'rented' | 'inactive' | string) =>
      request<{ success: boolean; listing: any }>(`/matching/listings/${encodeURIComponent(id)}/toggle`, {
        method: 'POST',
        body: JSON.stringify({ isActive, status }),
      }),

    getFeed: (params?: { city?: string; lat?: number; lng?: number; radius?: number }) => {
      const searchParams = new URLSearchParams();
      if (params?.city && params.city !== 'all') searchParams.append('city', params.city);
      if (params?.lat !== undefined && params?.lat !== null) searchParams.append('lat', String(params.lat));
      if (params?.lng !== undefined && params?.lng !== null) searchParams.append('lng', String(params.lng));
      if (params?.radius) searchParams.append('radius', String(params.radius));
      const qs = searchParams.toString();
      return request<{
        feedType: 'listings' | 'tenant_candidates';
        role: 'tenant' | 'landlord';
        items: any[];
      }>(`/matching/feed${qs ? `?${qs}` : ''}`);
    },

    getTenantMarketplaceProfile: (userId: string) =>
      request<{ profile: any }>(`/matching/tenant-profile/${encodeURIComponent(userId)}`),

    saveTenantMarketplaceProfile: (payload: any) =>
      request<{ success: boolean; profile: any }>(`/matching/tenant-profile`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      }),

    getCandidates: () =>
      request<any[]>(`/matching/candidates`),

    createListing: (payload: any) =>
      request<{ success: boolean; listing: any }>(`/matching/listings`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),

    swipe: (payload: {
      actorId: string;
      actorRole: 'tenant' | 'landlord';
      listingId: string;
      targetUserId: string;
      action: 'like' | 'pass';
    }) =>
      request<{
        success: boolean;
        action: 'like' | 'pass';
        isMatch: boolean;
        matchId: string | null;
      }>(`/matching/swipe`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),

    getMatches: (userId?: string) =>
      request<any[]>(`/matching/matches${userId ? `?userId=${encodeURIComponent(userId)}` : ''}`),

    getMessages: (matchId: string) =>
      request<{
        matchId: string;
        landlord_first_message_sent: boolean;
        isLandlord: boolean;
        isTenant: boolean;
        messages: any[];
      }>(`/matching/messages/${encodeURIComponent(matchId)}`),

    sendMessage: (payload: { matchId: string; content: string; senderRole?: 'tenant' | 'landlord'; senderId?: string }) =>
      request<{
        success: boolean;
        message: any;
        landlord_first_message_sent: boolean;
      }>(`/matching/messages`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),

    markMessagesRead: (matchId: string, userId?: string) =>
      request<{ success: boolean; count: number }>(`/matching/messages/${encodeURIComponent(matchId)}/read`, {
        method: 'POST',
        body: JSON.stringify({ userId }),
      }),

    getMyLikes: () =>
      request<any[]>(`/matching/my-likes`),

    getSwipedIds: (actorId?: string) => {
      const q = actorId ? `?actorId=${encodeURIComponent(actorId)}` : '';
      return request<{ liked: string[]; passed: string[]; all: string[] }>(`/matching/swiped-ids${q}`);
    },

    unlike: (listingId: string, actorId?: string) =>
      request<{ success: boolean; removed: boolean; listingId: string }>(`/matching/unlike`, {
        method: 'POST',
        body: JSON.stringify({ listingId, actorId }),
      }),

    getLandlordLikes: (params?: { landlordId?: string }) => {
      const q = params?.landlordId ? `?landlordId=${encodeURIComponent(params.landlordId)}` : '';
      return request<any[]>(`/matching/landlord/likes${q}`);
    },

    deleteLandlordLike: (tenantId: string, params?: { landlordId?: string }) => {
      const q = params?.landlordId ? `?landlordId=${encodeURIComponent(params.landlordId)}` : '';
      return request<{ success: boolean; message: string }>(`/matching/landlord/likes/${encodeURIComponent(tenantId)}${q}`, {
        method: 'DELETE',
      });
    },
  },

  // Admin endpoints (Prioridad P1.5, P1.6)
  admin: {
    getStats: () =>
      request<{
        totalUsers: number;
        totalListings: number;
        totalMatches: number;
        pendingLeases: number;
        pendingOwnerships: number;
        pendingReports: number;
      }>(`/admin/stats`),

    getDetailedRealAnalytics: () =>
      request<{
        users: {
          total: number;
          tenantsCount: number;
          landlordsCount: number;
          adminsCount: number;
          activeCount: number;
          avgTrustScore: number;
        };
        tenants: {
          totalProfiles: number;
          avgBudget: number;
          avgIncome: number;
          payslipsCount: number;
          payslipsPercentage: number;
        };
        listings: {
          total: number;
          activeCount: number;
          rentedCount: number;
          avgRent: number;
          cityDistribution: Record<string, number>;
          bedroomsDistribution: Record<string, number>;
        };
        leases: {
          total: number;
          verifiedCount: number;
          pendingCount: number;
          totalRentVolume: number;
          totalDepositSecured: number;
        };
        matches: {
          totalSwipes: number;
          likesCount: number;
          passesCount: number;
          totalMatches: number;
          activeMatches: number;
          pendingMatches: number;
        };
        traffic: {
          totalLogins: number;
          successfulLogins: number;
          failedLogins: number;
          activeSessionsNow: number;
          totalSessions: number;
          totalTimeSpentMinutes: number;
          avgSessionSeconds: number;
          devicesBreakdown: Record<string, number>;
        };
        verifications: {
          totalOwnershipRequests: number;
          pendingOwnerships: number;
          approvedOwnerships: number;
          rejectedOwnerships: number;
        };
      }>(`/admin/detailed-real-analytics`),

    getOwnershipVerifications: async (status = 'pending') => {
      try {
        const res = await request<any>(`/admin/ownership-verifications?status=${encodeURIComponent(status)}`);
        if (Array.isArray(res)) return res;
        if (res && Array.isArray(res.verifications)) return res.verifications;
        if (res && Array.isArray(res.data)) return res.data;
        return [];
      } catch {
        return [];
      }
    },

    reviewOwnershipVerification: (id: string, payload: { decision: 'verified' | 'rejected'; rejectionReason?: string }) =>
      request<{ success: boolean; decision: string; verificationId: string }>(`/admin/ownership-verifications/${encodeURIComponent(id)}/review`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),

    getUsers: async (role?: string) => {
      try {
        const res = await request<any>(`/admin/users${role ? `?role=${encodeURIComponent(role)}` : ''}`);
        if (Array.isArray(res)) return res;
        if (res && Array.isArray(res.users)) return res.users;
        if (res && Array.isArray(res.data)) return res.data;
        return [];
      } catch {
        return [];
      }
    },

    toggleUserStatus: (id: string, isActive: boolean) =>
      request<{ success: boolean; userId: string; is_active: boolean }>(`/admin/users/${encodeURIComponent(id)}/toggle-status`, {
        method: 'POST',
        body: JSON.stringify({ isActive }),
      }),

    getUserDetailedProfile: (id: string) =>
      request<any>(`/admin/users/${encodeURIComponent(id)}/profile`),

    getListings: async (params?: { city?: string; search?: string }) => {
      const sp = new URLSearchParams();
      if (params?.city) sp.append('city', params.city);
      if (params?.search) sp.append('search', params.search);
      const qs = sp.toString();
      try {
        const res = await request<any>(`/admin/listings${qs ? `?${qs}` : ''}`);
        if (Array.isArray(res)) return res;
        if (res && Array.isArray(res.listings)) return res.listings;
        return [];
      } catch {
        return [];
      }
    },

    updateListing: (id: string, updates: any) =>
      request<{ success: boolean; listing: any }>(`/admin/listings/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      }),

    toggleListingStatus: (id: string, isActive: boolean) =>
      request<{ success: boolean; listing: any }>(`/admin/listings/${encodeURIComponent(id)}/toggle`, {
        method: 'POST',
        body: JSON.stringify({ isActive }),
      }),

    deleteListing: (id: string) =>
      request<{ success: boolean }>(`/admin/listings/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      }),

    getBlockedEmails: async () => {
      try {
        const res = await request<any>(`/admin/blocked-emails`);
        if (Array.isArray(res)) return res;
        return [];
      } catch {
        return [];
      }
    },

    addBlockedEmail: (email: string, reason?: string) =>
      request<{ success: boolean; blocked: any }>(`/admin/blocked-emails`, {
        method: 'POST',
        body: JSON.stringify({ email, reason }),
      }),

    removeBlockedEmail: (email: string) =>
      request<{ success: boolean }>(`/admin/blocked-emails/${encodeURIComponent(email)}`, {
        method: 'DELETE',
      }),

    getLogins: async (params?: { email?: string; status?: string; limit?: number }) => {
      const sp = new URLSearchParams();
      if (params?.email) sp.append('email', params.email);
      if (params?.status) sp.append('status', params.status);
      if (params?.limit) sp.append('limit', String(params.limit));
      const qs = sp.toString();
      try {
        const res = await request<any>(`/admin/logins${qs ? `?${qs}` : ''}`);
        if (Array.isArray(res)) return res;
        if (res && Array.isArray(res.logins)) return res.logins;
        if (res && Array.isArray(res.data)) return res.data;
        return [];
      } catch {
        return [];
      }
    },

    getSessions: async (params?: { email?: string; activeOnly?: boolean; limit?: number }) => {
      const sp = new URLSearchParams();
      if (params?.email) sp.append('email', params.email);
      if (params?.activeOnly !== undefined) sp.append('activeOnly', String(params.activeOnly));
      if (params?.limit) sp.append('limit', String(params.limit));
      const qs = sp.toString();
      try {
        const res = await request<any>(`/admin/sessions${qs ? `?${qs}` : ''}`);
        if (Array.isArray(res)) return res;
        if (res && Array.isArray(res.sessions)) return res.sessions;
        if (res && Array.isArray(res.data)) return res.data;
        return [];
      } catch {
        return [];
      }
    },

    getSessionsSummary: () =>
      request<{
        totalLogins: number;
        successfulLogins: number;
        failedLogins: number;
        blockedLogins: number;
        totalSessions: number;
        activeSessionsNow: number;
        totalTimeSpentSeconds: number;
        totalTimeSpentMinutes: number;
        totalTimeSpentHours: number;
        averageSessionSeconds: number;
        topActiveUsers: Array<{
          email: string;
          name?: string;
          role: string;
          totalTimeSeconds: number;
          totalTimeMinutes: number;
          sessionsCount: number;
          lastSeen: string;
        }>;
      }>(`/admin/sessions/summary`),

    getSupabaseDiagnostic: () =>
      request<{
        configured: boolean;
        url: string;
        projectId: string;
        sqlEditorUrl: string;
        totalTablesChecked: number;
        totalReady: number;
        tables: Array<{
          name: string;
          exists: boolean;
          count: number;
          status: 'ready' | 'missing' | 'error' | 'unreachable';
          error: string | null;
          code: string | null;
        }>;
        sqlSchema: string;
      }>(`/admin/supabase/status`),

    runSupabaseTestInsert: () =>
      request<{
        success: boolean;
        message?: string;
        error?: string;
        code?: string;
        hint?: string;
        insertedRecord?: any;
      }>(`/admin/supabase/test-insert`, {
        method: 'POST',
      }),

    syncAllToSupabase: () =>
      request<{
        success: boolean;
        hasMissingTables: boolean;
        message: string;
        summary: Record<string, { attempted: number; success: number; status: 'ok' | 'table_missing' | 'error'; error?: string }>;
      }>(`/admin/supabase/sync-all`, {
        method: 'POST',
      }),
  },

  // Moderation & Reports
  reports: {
    createReport: (data: {
      target_type: 'listing' | 'tenant_profile' | 'user';
      target_id: string;
      target_title?: string;
      target_user_id?: string;
      target_user_email?: string;
      target_user_name?: string;
      reason: string;
      reason_label?: string;
      details: string;
      evidence_url?: string;
      reporter_id?: string;
      reporter_name?: string;
      reporter_email?: string;
    }) =>
      request<{ success: boolean; message: string; report: any }>('/reports', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    getReports: (status?: string) =>
      request<{ success: boolean; count: number; reports: any[] }>(`/reports${status ? `?status=${status}` : ''}`),

    takeAction: (
      reportId: string,
      action: 'user_blocked' | 'listing_removed' | 'dismissed',
      actionNotes?: string,
      reviewedBy?: string
    ) =>
      request<{ success: boolean; message: string; report: any }>(`/reports/${reportId}/action`, {
        method: 'PATCH',
        body: JSON.stringify({ action, action_notes: actionNotes, reviewed_by: reviewedBy }),
      }),
  },

  // KYC Verification (DNI + Selfie)
  kyc: {
    submit: (data: {
      user_id?: string;
      user_name?: string;
      user_email?: string;
      user_role?: 'tenant' | 'landlord';
      id_document_number?: string;
      id_document_type?: 'DNI' | 'NIE' | 'Pasaporte';
      dni_front_url: string;
      dni_back_url?: string;
      selfie_url: string;
      selfie_with_id_url?: string;
    }) =>
      request<{ success: boolean; message: string; kyc: any }>('/kyc/submit', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    getStatus: (userId?: string, email?: string) => {
      const sp = new URLSearchParams();
      if (userId) sp.append('userId', userId);
      if (email) sp.append('email', email);
      const qs = sp.toString();
      return request<{ success: boolean; status: string; kyc: any }>(`/kyc/status${qs ? `?${qs}` : ''}`);
    },

    getAdminList: (status?: string) =>
      request<{ success: boolean; count: number; list: any[] }>(`/kyc/admin/list${status ? `?status=${status}` : ''}`),

    review: (
      kycId: string,
      status: 'verified' | 'rejected',
      rejectionReason?: string,
      reviewedBy?: string
    ) =>
      request<{ success: boolean; message: string; kyc: any }>(`/kyc/admin/${kycId}/review`, {
        method: 'PATCH',
        body: JSON.stringify({ status, rejection_reason: rejectionReason, reviewed_by: reviewedBy }),
      }),
  },
};

