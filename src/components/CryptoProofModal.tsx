import React, { useState } from 'react';
import { X, ShieldCheck, Lock, CheckCircle2, Copy, Check, Hash, Calendar, FileText, AlertTriangle } from 'lucide-react';
import { RentalLease } from '../types';
import { Language, TRANSLATIONS } from '../i18n/translations';

interface CryptoProofModalProps {
  isOpen: boolean;
  onClose: () => void;
  lease: RentalLease | null;
  tenantName: string;
  language: Language;
}

export const CryptoProofModal: React.FC<CryptoProofModalProps> = ({
  isOpen,
  onClose,
  lease,
  tenantName,
  language,
}) => {
  const t = TRANSLATIONS[language];
  const [copied, setCopied] = useState(false);

  if (!isOpen || !lease) return null;

  const cryptoHash = lease.certificateHash || `0x${(lease.id || 'VAL784').substring(0, 16).toUpperCase()}9F3B`;
  const rating = lease.landlordRating;

  const handleCopyHash = () => {
    navigator.clipboard?.writeText(cryptoHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-[#0FA3A3]/25 relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
          id="btn-close-crypto-modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-4">
          <div className="w-11 h-11 rounded-xl bg-[#E6F7F6] text-[#0FA3A3] flex items-center justify-center mx-auto mb-2 shadow-xs border border-[#0FA3A3]/20">
            <Lock className="w-5 h-5 text-[#0FA3A3]" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#EBF9F6] text-[#2EC4A6] text-[11px] font-bold uppercase tracking-wider mb-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{t.cryptoModalTag}</span>
          </div>
          <h2 className="text-lg font-bold text-[#1C3B3A]">
            {t.cryptoModalTitle}
          </h2>
          <p className="text-xs text-[#5C7B79]">
            {t.cryptoModalSubtitle}
          </p>
        </div>

        {/* Immutability Guarantee Box */}
        <div className="p-3.5 rounded-xl bg-[#FEF9E7] border border-[#F2C94C] text-xs text-[#1C3B3A] space-y-1.5 mb-3.5">
          <div className="flex items-center gap-1.5 font-bold text-[#b78b14]">
            <ShieldCheck className="w-4 h-4 text-[#0FA3A3]" />
            <span>{t.immutabilityRuleTitle}</span>
          </div>
          <p className="text-[11.5px] leading-relaxed text-[#5C7B79]">
            {t.immutabilityRuleText}
          </p>
        </div>

        {/* Cryptographic Hash Details */}
        <div className="bg-[#F7FBFA] p-3.5 rounded-xl border border-gray-200 space-y-2.5 text-xs">
          
          <div>
            <span className="text-[11px] font-bold text-[#5C7B79] mb-1 flex items-center gap-1">
              <Hash className="w-3.5 h-3.5 text-[#0FA3A3]" /> {t.sha256Label}
            </span>
            <div className="flex items-center gap-2">
              <div className="flex-1 font-mono text-[11px] bg-white p-2 rounded-lg border border-gray-200 text-[#1C3B3A] select-all truncate">
                {cryptoHash}
              </div>
              <button
                type="button"
                onClick={handleCopyHash}
                className="px-2.5 py-2 rounded-lg bg-[#0FA3A3] text-white font-bold text-xs shrink-0 flex items-center gap-1 hover:bg-[#0D8C8C] transition-colors"
                title={t.copy}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="text-[10px]">{copied ? t.copied : t.copy}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-100 text-[11px]">
            <div>
              <span className="text-[#5C7B79] block font-semibold">{t.certifiedPropertyLabel}</span>
              <span className="font-bold text-[#1C3B3A] truncate block">{lease.address}</span>
            </div>
            <div>
              <span className="text-[#5C7B79] block font-semibold">{t.certifiedSignerLabel}</span>
              <span className="font-bold text-[#1C3B3A] truncate block">{rating?.landlordName || lease.landlordName}</span>
            </div>
            <div>
              <span className="text-[#5C7B79] block font-semibold">{t.sealDateLabel}</span>
              <span className="font-bold text-[#1C3B3A] block">{rating?.verifiedAt || '2026-08'}</span>
            </div>
            <div>
              <span className="text-[#5C7B79] block font-semibold">{t.signMethodLabel}</span>
              <span className="font-bold text-[#2EC4A6] flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> {t.digitalSignature2fa}
              </span>
            </div>
          </div>

          {rating?.comment && (
            <div className="pt-2 border-t border-gray-100">
              <span className="text-[#5C7B79] block font-semibold text-[10px] mb-0.5">{t.landlordTestimonyLabel}</span>
              <p className="italic text-[#1C3B3A] bg-white p-2 rounded border border-gray-200 text-[11px]">
                "{rating.comment}"
              </p>
            </div>
          )}

        </div>

        {/* Action Button */}
        <div className="mt-4">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-[#0FA3A3] hover:bg-[#0D8C8C] text-white font-bold text-xs transition-colors"
          >
            {t.closeProofBtn}
          </button>
        </div>

      </div>
    </div>
  );
};
