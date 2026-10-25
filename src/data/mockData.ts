import { TenantProfile, RentalLease } from '../types';
export { SEED_LISTINGS } from './seedListings';
export { SEED_TENANTS, type SeedTenant } from './seedTenants';

/**
 * Profil initial vierge (sans fausses données de démonstration)
 * L'application charge dynamiquement les vraies données depuis Supabase
 */
export const INITIAL_TENANT: TenantProfile = {
  id: '',
  passportId: '',
  passportNumber: '',
  mrzCode: '',
  fullName: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  birthDate: '',
  nationality: '',
  countryFlag: '',
  profession: '',
  avatarUrl: '',
  memberSince: '',
  trustScore: 0,
  trustGrade: '',
  verifiedLeasesCount: 0,
  totalMonthsVerified: 0,
  onTimePaymentRate: 0,
  fullDepositReturnRate: 0,
  zeroDisputeBadge: false,
  internationalPortable: true,
  stats: {
    trustScore: 0,
    onTimePaymentRate: 0,
    depositReturnedRate: 0,
    verifiedLandlordsCount: 0,
    totalMonths: 0,
    zeroDisputes: true,
  }
};

/**
 * Liste initiale vide : les vraies locations sont extraites directement de Supabase
 */
export const INITIAL_LEASES: RentalLease[] = [];
