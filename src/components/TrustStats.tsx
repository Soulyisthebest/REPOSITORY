import React from 'react';
import { 
  CreditCard, 
  KeyRound, 
  Users2, 
  ShieldCheck
} from 'lucide-react';
import { TenantProfile } from '../types';
import { Language, TRANSLATIONS } from '../i18n/translations';

interface TrustStatsProps {
  tenant: TenantProfile;
  language: Language;
}

export const TrustStats: React.FC<TrustStatsProps> = ({ tenant, language }) => {
  const t = TRANSLATIONS[language];

  return (
    <div className="grid grid-cols-3 gap-3" id="trust-stats-section">
      {/* Stat 1: Punctuality */}
      <div className="bg-white p-3.5 rounded-xl border border-[#0FA3A3]/15 shadow-xs flex flex-col items-center text-center">
        <div className="w-8 h-8 rounded-lg bg-[#EBF9F6] text-[#2EC4A6] flex items-center justify-center mb-1.5">
          <CreditCard className="w-4 h-4" />
        </div>
        <span className="text-lg font-black text-[#1C3B3A]">
          {tenant.stats?.onTimePaymentRate ?? tenant.onTimePaymentRate ?? 0}%
        </span>
        <span className="text-[11px] font-medium text-[#5C7B79]">{t.onTimePunctuality}</span>
      </div>

      {/* Stat 2: Deposit return */}
      <div className="bg-white p-3.5 rounded-xl border border-[#0FA3A3]/15 shadow-xs flex flex-col items-center text-center">
        <div className="w-8 h-8 rounded-lg bg-[#EBF9F6] text-[#2EC4A6] flex items-center justify-center mb-1.5">
          <KeyRound className="w-4 h-4" />
        </div>
        <span className="text-lg font-black text-[#1C3B3A]">
          {tenant.stats?.depositReturnedRate ?? tenant.fullDepositReturnRate ?? 0}%
        </span>
        <span className="text-[11px] font-medium text-[#5C7B79]">{t.depositReturn}</span>
      </div>

      {/* Stat 3: Verified count */}
      <div className="bg-white p-3.5 rounded-xl border border-[#0FA3A3]/15 shadow-xs flex flex-col items-center text-center">
        <div className="w-8 h-8 rounded-lg bg-[#E6F7F6] text-[#0FA3A3] flex items-center justify-center mb-1.5">
          <Users2 className="w-4 h-4" />
        </div>
        <span className="text-lg font-black text-[#1C3B3A]">
          {tenant.stats?.verifiedLandlordsCount ?? tenant.verifiedLeasesCount ?? 0}
        </span>
        <span className="text-[11px] font-medium text-[#5C7B79]">{t.verifiedLandlords}</span>
      </div>
    </div>
  );
};
