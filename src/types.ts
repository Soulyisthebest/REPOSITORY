export interface LandlordRating {
  onTimePayment: boolean;
  paymentScore: number; // 100%
  propertyCareScore: number; // 1-5
  neighbourhoodRelationsScore: number; // 1-5
  depositReturnedFull: boolean;
  wouldRentAgain: boolean;
  comment?: string;
  verifiedAt: string;
  landlordName: string;
  landlordType: 'particulier' | 'agence' | 'gestionnaire';
  verificationMethod: 'email_token' | 'phone_code' | 'digital_signature';
}

export type LeaseStatus = 
  | 'draft' 
  | 'uploading' 
  | 'extracted' 
  | 'needs_review' 
  | 'pending' 
  | 'verified' 
  | 'rejected' 
  | 'disputed';

export interface RentalLease {
  id: string;
  code?: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  countryCode: string;
  flag: string;
  propertyType: 'Studio' | 'Appartement T2' | 'Appartement T3' | 'Maison' | 'Colocation' | string;
  isFurnished: boolean;
  monthlyRent: number;
  deposit?: number;
  currency: string;
  startDate: string; // YYYY-MM
  endDate: string; // YYYY-MM or 'En cours' / 'Actual'
  isCurrent: boolean;
  monthsCount: number;
  status: LeaseStatus;
  verificationToken?: string;
  landlordEmail: string;
  landlordPhone?: string;
  landlordName: string;
  landlordRating?: LandlordRating;
  certificateHash?: string;
  contractPhotoUrl?: string;
  contractPagesCount?: number;
  confidenceScore?: number;
  tenantPhotoUrl?: string;
  tenantContactPhone?: string;
  tenantContactEmail?: string;
  locationDetails?: {
    street?: string;
    city?: string;
    postalCode?: string;
    province?: string;
    country?: string;
  };
}

export interface ExtractedContractData {
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  rent?: number;
  deposit?: number;
  currency?: string;
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
  landlordName?: string;
  landlordContact?: string;
  tenantName?: string;
  propertyType?: string;
  confidence?: {
    address?: number;
    rent?: number;
    dates?: number;
    landlord?: number;
    overall?: number;
  };
  rawSummary?: string;
}

export interface ContractFilePage {
  id: string;
  dataUrl: string;
  file?: File;
  name: string;
  size: number;
  type: string;
}

export interface PaymentRecord {
  id: string;
  leaseId: string;
  leaseAddress?: string;
  amount: number;
  currency: string;
  dueDate: string;
  paidDate?: string;
  status: 'paid_on_time' | 'paid_late' | 'pending' | 'unpaid';
  receiptUrl?: string;
}

export type UserRole = 'tenant' | 'landlord' | 'agency' | 'admin';

export interface TenantProfile {
  id: string;
  role?: UserRole;
  passportId: string;
  passportNumber: string;
  mrzCode: string;
  fullName: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  birthDate: string;
  nationality: string;
  countryFlag: string;
  profession: string;
  avatarUrl: string;
  memberSince: string;
  trustScore: number;
  trustGrade: string;
  verifiedLeasesCount: number;
  totalMonthsVerified: number;
  onTimePaymentRate: number;
  fullDepositReturnRate: number;
  zeroDisputeBadge: boolean;
  internationalPortable: boolean;
  rentiaPoints?: number;
  monthlyIncome?: number;
  monthlySalary?: number;
  employmentType?: string;
  hasGuarantor?: boolean;
  guarantorIncome?: number;
  hasPets?: boolean;
  petDetails?: string;
  photos?: string[];
  age?: number;
  householdType?: 'solo' | 'couple' | 'family' | 'flatmates';
  occupantsCount?: number;
  hasMinors?: boolean;
  petType?: string;
  petsCount?: number;
  propertyTypes?: string[];
  searchPurpose?: string;
  desiredRooms?: string;
  desiredBathrooms?: string;
  minBudget?: number;
  maxBudget?: number;
  stretchBudget?: number;
  utilitiesIncluded?: {
    community?: boolean;
    water?: boolean;
    electricity?: boolean;
    internet?: boolean;
  };
  targetCity?: string;
  targetNeighborhoods?: string[];
  searchRadiusKm?: number;
  customPolygon?: [number, number][];
  maxCommuteMinutes?: number;
  transportMode?: 'walking' | 'bike' | 'public' | 'car' | 'moto';
  essentialAmenities?: string[];
  amenityPriorities?: Record<string, 'essential' | 'like' | 'neutral' | 'dislike'>;
  smoking?: 'no' | 'yes' | 'outside';
  remoteWork?: 'never' | 'sometimes' | 'mostly';
  lifestyleVibe?: 'tranquil' | 'normal' | 'social';
  wantsRoommates?: 'yes' | 'no' | 'any';
  roomPreferences?: {
    quietVibe?: boolean;
    likesGuests?: boolean;
    prefersStudents?: boolean;
    prefersProfessionals?: boolean;
    sharesBathroom?: boolean;
    privateRoom?: boolean;
  };
  incomeRange?: string;
  canProvideDocs?: 'yes' | 'no' | 'later';
  moveInDate?: string;
  rentalDuration?: '1-3m' | '3-6m' | '6-12m' | '1-2y' | 'long_term' | 'flexible';
  onboardingCompleted?: boolean;
  isVerified?: boolean;
  verificationStatus?: 'unverified' | 'pending_admin' | 'verified' | 'rejected';
  dniUrl?: string;
  selfieUrl?: string;
  stats: {
    trustScore: number;
    onTimePaymentRate: number;
    depositReturnedRate: number;
    verifiedLandlordsCount: number;
    totalMonths: number;
    zeroDisputes: boolean;
  };
}

export type RentiaPointsAction = 
  | 'LEASE_CONFIRMED'
  | 'IDENTITY_VERIFIED'
  | 'NOMINA_VERIFIED'
  | 'PROFILE_COMPLETED'
  | 'PAYMENT_RECORDED'
  | 'MAINTENANCE_RECORDED'
  | 'MATCH_INTERACTION';

export interface RentiaPointsEvent {
  id: string;
  user_id: string;
  action_type: RentiaPointsAction;
  points_delta: number;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface Listing {
  id: string;
  landlord_id: string;
  title: string;
  description?: string;
  city: string;
  neighborhood?: string;
  address?: string;
  address_exact?: string;
  rent: number;
  deposit?: number;
  currency: string;
  property_type: 'apartment' | 'studio' | 'house' | 'room' | 'penthouse' | string;
  rooms_count: number;
  bathrooms_count?: number;
  surface_sqm?: number;
  available_from: string;
  available_until?: string | null;
  rental_duration_type?: 'long_term' | 'short_stay';
  duration_unit?: 'months' | 'years' | 'indefinite';
  duration_value?: number;
  is_indefinite?: boolean;
  is_scheduled?: boolean;
  scheduled_publish_at?: string | null;
  publishing_status?: 'published' | 'scheduled' | 'draft';
  pets_allowed: boolean;
  furnished: boolean;
  min_income_required?: number;
  images: string[];
  photos?: { id: string; url: string; position: number; room_category?: string }[];
  latitude?: number;
  longitude?: number;
  ownership_document_url?: string;
  verification_status?: 'pending' | 'verified' | 'rejected';
  verification_reviewed_at?: string;
  verification_rejection_reason?: string;
  is_active: boolean;
  status?: 'available' | 'rented' | 'inactive';
  rented_at?: string;
  is_test?: boolean;
  is_seed_data?: boolean;
  created_at: string;
  landlord_name?: string;
  landlord_avatar?: string;
  landlord_verified?: boolean;
}

export interface TenantMarketplaceProfile {
  id: string;
  user_id: string;
  full_name: string;
  age?: number;
  monthly_income: number;
  has_payslips: boolean;
  employment_type: 'indefinido' | 'temporal' | 'autonomo' | 'estudiante' | 'funcionario' | 'jubilado' | 'otro';
  occupants_count: number;
  has_children: boolean;
  has_pets: boolean;
  pet_details?: string;
  is_smoker: boolean;
  desired_move_in_date: string;
  max_budget: number;
  desired_contract_duration: 'long_term' | 'temporal';
  has_guarantor: boolean;
  previous_landlord_reference?: string;
  income_to_rent_ratio?: number;
  bio?: string;
  photos: { id?: string; url: string; position: number }[];
  locations: TenantSearchLocation[];
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface TenantSearchLocation {
  id?: string;
  tenant_profile_id?: string;
  label: string;
  city: string;
  latitude: number;
  longitude: number;
  radius_km: number;
}

export interface TenantPreferences {
  id: string;
  tenant_id: string;
  target_city: string;
  max_budget: number;
  move_in_date: string;
  occupants_count: number;
  has_pets: boolean;
}

export interface MatchScoreBreakdown {
  compatibility: number; // 0 to 70
  verification: number; // 0 to 20
  activity: number; // 0 to 5
  pointsBonus: number; // 0 to 5 (capped)
  totalRawPoints: number;
}

export interface MatchResult {
  id: string;
  listing_id: string;
  tenant_id: string;
  landlord_id: string;
  status: 'active' | 'archived' | 'closed' | 'pending';
  landlord_first_message_sent: boolean;
  compatibility_score: number;
  created_at: string;
  listing?: Listing;
  tenant?: {
    id: string;
    name: string;
    avatar_url?: string;
    trust_score?: number;
    monthly_income?: number;
    employment_type?: string;
    occupants_count?: number;
    has_pets?: boolean;
    bio?: string;
    photos?: string[];
  };
  landlord?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
}

export interface ChatMessage {
  id: string;
  match_id: string;
  sender_id: string;
  sender_role: 'tenant' | 'landlord';
  sender_name?: string;
  content: string;
  created_at: string;
  read_at?: string;
}

export type ViewMode = 
  | 'tenant_passport' 
  | 'landlord_verify_flow' 
  | 'landlord_public_view' 
  | 'certificate_export' 
  | 'matching_discovery' 
  | 'property_map_search'
  | 'idealista_map_search'
  | 'landlord_listings' 
  | 'landlord_dashboard' 
  | 'landlord_publish'
  | 'matches_chat' 
  | 'admin_panel' 
  | 'tenant_likes'
  | 'landlord_swipe'
  | 'landlord_likes'
  | 'public_profile';

export interface ReportItem {
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

export interface KycVerificationItem {
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



