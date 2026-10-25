import React from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  Star, 
  ArrowLeft, 
  FileDown, 
  Mail, 
  Check,
  Lock
} from 'lucide-react';
import { TenantProfile, RentalLease } from '../types';
import { Language, TRANSLATIONS } from '../i18n/translations';

interface PublicLandlordInspectionProps {
  tenant: TenantProfile;
  leases: RentalLease[];
  onBackToPassport: () => void;
  onOpenCertificate: () => void;
  language: Language;
}

export const PublicLandlordInspection: React.FC<PublicLandlordInspectionProps> = ({
  tenant,
  leases,
  onBackToPassport,
  onOpenCertificate,
  language,
}) => {
  const t = TRANSLATIONS[language];
  const verifiedLeases = leases.filter(l => l.status === 'verified');

  return (
    <div className="max-w-2xl mx-auto space-y-4" id="public-landlord-inspection-view">
      
      {/* Return button */}
      <button
        onClick={onBackToPassport}
        className="inline-flex items-center gap-1 text-xs font-semibold text-[#5C7B79] hover:text-[#1C3B3A]"
        id="btn-back-from-inspection"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>{t.backBtn}</span>
      </button>

      {/* Main Inspection Card */}
      <div className="bg-white rounded-2xl border border-[#0FA3A3]/20 shadow-xs p-5 space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between gap-3 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <img
              src={tenant.avatarUrl}
              alt={tenant.fullName}
              className="w-12 h-12 rounded-full object-cover border-2 border-[#0FA3A3]/30"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-lg font-bold text-[#1C3B3A]">{tenant.fullName}</h2>
                <span>{tenant.countryFlag}</span>
              </div>
              <p className="text-xs text-[#5C7B79]">{tenant.profession}</p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-2xl font-black text-[#0FA3A3] leading-none">
              {tenant.trustScore}<span className="text-xs text-[#5C7B79] font-normal">/100</span>
            </span>
            <span className="block text-[11px] font-semibold text-[#2EC4A6]">{t.verifiedBadge}</span>
          </div>
        </div>

        {/* 3 Key Trust Pillars */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2.5 rounded-xl bg-[#F7FBFA] border border-[#0FA3A3]/10 text-center">
            <span className="text-base font-black text-[#2EC4A6]">
              {tenant.stats?.onTimePaymentRate ?? tenant.onTimePaymentRate ?? 100}%
            </span>
            <span className="text-[10px] font-semibold text-[#1C3B3A] block truncate">{t.onTimePunctuality}</span>
          </div>

          <div className="p-2.5 rounded-xl bg-[#F7FBFA] border border-[#0FA3A3]/10 text-center">
            <span className="text-base font-black text-[#2EC4A6]">
              {tenant.stats?.depositReturnedRate ?? tenant.fullDepositReturnRate ?? 100}%
            </span>
            <span className="text-[10px] font-semibold text-[#1C3B3A] block truncate">{t.depositReturn}</span>
          </div>

          <div className="p-2.5 rounded-xl bg-[#F7FBFA] border border-[#0FA3A3]/10 text-center">
            <span className="text-base font-black text-[#0FA3A3]">{verifiedLeases.length}</span>
            <span className="text-[10px] font-semibold text-[#1C3B3A] block truncate">{t.verifiedLandlords}</span>
          </div>
        </div>

        {/* Verified references */}
        <div className="space-y-2.5 pt-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#5C7B79]">
            {t.leasesHistory}
          </h3>

          <div className="space-y-3">
            {verifiedLeases.map((lease, idx) => (
              <div
                key={`${lease.id}-${idx}`}
                className="p-3.5 rounded-xl border border-[#0FA3A3]/20 bg-[#F7FBFA] space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{lease.flag || '🏠'}</span>
                    <span className="font-bold text-xs text-[#1C3B3A]">{lease.address}, {lease.city}</span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#2EC4A6]">
                    <CheckCircle2 className="w-3 h-3" /> {t.verifiedBadge}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-[#5C7B79]">
                  <span>{lease.startDate} → {lease.endDate}</span>
                  <span>•</span>
                  <span>{lease.monthlyRent}{lease.currency}{t.perMonth}</span>
                  <span>•</span>
                  <span className="font-semibold text-[#1C3B3A]">{lease.landlordRating?.landlordName}</span>
                </div>

                {lease.landlordRating?.comment && (
                  <p className="text-xs italic text-[#1C3B3A] bg-white p-2.5 rounded-lg border border-gray-100">
                    "{lease.landlordRating.comment}"
                  </p>
                )}

                <div className="flex items-center justify-between text-[10px] text-[#5C7B79] pt-1">
                  <span>Hash: {lease.certificateHash || '0x4F92A7C1'}</span>
                  <div className="flex items-center gap-1 text-[#2EC4A6] font-semibold">
                    <Lock className="w-3 h-3" />
                    <span>{t.certifiedProofLock}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action button */}
        <div className="pt-2">
          <button
            onClick={onOpenCertificate}
            className="w-full py-3 rounded-xl bg-[#0FA3A3] hover:bg-[#0D8C8C] text-white font-bold text-xs shadow-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            id="btn-view-official-cert"
          >
            <FileDown className="w-4 h-4" />
            <span>{t.certPdfBtn}</span>
          </button>
        </div>

      </div>

    </div>
  );
};
