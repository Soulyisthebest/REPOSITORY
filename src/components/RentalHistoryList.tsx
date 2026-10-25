import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Star, 
  ChevronDown, 
  ChevronUp, 
  ShieldCheck, 
  Plus, 
  Link as LinkIcon,
  Copy,
  Trash2,
  Lock,
  MessageCircle,
  Mail
} from 'lucide-react';
import { RentalLease } from '../types';
import { Language, TRANSLATIONS } from '../i18n/translations';
import { CryptoProofModal } from './CryptoProofModal';

interface RentalHistoryListProps {
  leases: RentalLease[];
  onOpenAddModal: () => void;
  onOpenScanContract: () => void;
  onDeleteLease?: (leaseId: string) => void;
  tenantName?: string;
  language: Language;
}

export const RentalHistoryList: React.FC<RentalHistoryListProps> = ({
  leases,
  onOpenAddModal,
  onOpenScanContract,
  onDeleteLease,
  tenantName = '',
  language,
}) => {
  const t = TRANSLATIONS[language];
  const [expandedId, setExpandedId] = useState<string | null>(leases[0]?.id || null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [selectedProofLease, setSelectedProofLease] = useState<RentalLease | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  const copyToClipboard = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const copyLinkToClipboard = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${getOrigin()}/?code=${code}`;
    navigator.clipboard?.writeText(url);
    setCopiedLink(code);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const getOrigin = () => typeof window !== 'undefined' ? window.location.origin : 'https://rentia.app';

  const sendLandlordWhatsApp = (lease: RentalLease, code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${getOrigin()}/?code=${code}`;
    const text = `${t.inviteLandlordMessage} ${url} (${t.codeLabel}: ${code})`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const sendLandlordEmail = (lease: RentalLease, code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${getOrigin()}/?code=${code}`;
    const subject = `${t.inviteLandlordEmailSubject} - ${lease.address}`;
    const body = `${t.inviteLandlordMessage}\n\n${url}\n${t.codeLabel}: ${code}`;
    window.open(`mailto:${lease.landlordEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
  };

  return (
    <div className="space-y-3" id="rental-history-section">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold text-[#1C3B3A]">
            {t.leasesHistory}
          </h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-[#E6F7F6] text-[#0FA3A3] font-bold">
            {leases.length}
          </span>
        </div>

        {/* Add button */}
        <button
          onClick={onOpenAddModal}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#F2C94C] hover:bg-[#e6be3f] text-[#1C3B3A] text-xs font-bold shadow-xs transition-colors"
          id="btn-add-lease-inline"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{t.addLeaseBtn}</span>
        </button>
      </div>

      {/* Leases Cards */}
      <div className="space-y-2.5">
        {leases.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 text-center border border-gray-100 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-xl bg-[#E6F7F6] text-[#0FA3A3] flex items-center justify-center mx-auto">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1C3B3A]">{t.noLeasesRegisteredTitle}</h3>
              <p className="text-xs text-[#5C7B79] max-w-sm mx-auto mt-1">
                {t.noLeasesRegisteredDesc}
              </p>
            </div>
            <button
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0FA3A3] hover:bg-[#0D8C8C] text-white text-xs font-bold transition-all shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t.addLeaseBtn}</span>
            </button>
          </div>
        ) : (
          leases.map((lease, idx) => {
          const isExpanded = expandedId === lease.id;
          const isVerified = lease.status === 'verified';
          const leaseCode = lease.code || (lease.verificationToken ? lease.verificationToken.replace('tok_', '').toUpperCase() : 'VAL784');

          return (
            <div
              key={`${lease.id}-${idx}`}
              className={`bg-white rounded-xl border transition-all overflow-hidden ${
                isVerified 
                  ? 'border-[#0FA3A3]/20 shadow-xs hover:border-[#2EC4A6]' 
                  : 'border-amber-300 bg-amber-50/20'
              }`}
              id={`lease-card-${lease.id}`}
            >
              {/* Header Summary */}
              <div
                onClick={() => toggleExpand(lease.id)}
                className="p-3.5 cursor-pointer flex items-center justify-between gap-3 select-none"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-base shrink-0 border ${
                    isVerified 
                      ? 'bg-[#EBF9F6] border-[#2EC4A6]/30 text-[#2EC4A6]' 
                      : 'bg-amber-100 border-amber-300 text-amber-800'
                  }`}>
                    {lease.flag || '🏠'}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 truncate">
                      <h3 className="font-bold text-sm text-[#1C3B3A] truncate">
                        {lease.address}
                      </h3>
                      {lease.isCurrent && (
                        <span className="text-[10px] bg-[#0FA3A3] text-white px-1.5 py-0.5 rounded font-bold uppercase shrink-0">
                          {t.currentHome}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-[#5C7B79] mt-0.5">
                      <span className="truncate">{lease.city}</span>
                      <span>•</span>
                      <span>{lease.monthsCount || 12} {t.monthsCount}</span>
                      <span>•</span>
                      <span className="font-semibold text-[#1C3B3A]">{lease.monthlyRent}{lease.currency || '€'}</span>
                    </div>
                  </div>
                </div>

                {/* Status Stamp & Toggle */}
                <div className="flex items-center gap-2 shrink-0">
                  {isVerified ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#EBF9F6] text-[#1C3B3A] text-xs font-bold border border-[#2EC4A6]/40">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#2EC4A6]" />
                      <span className="hidden sm:inline">{t.verifiedBadge}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold border border-amber-300">
                      <Clock className="w-3 h-3 text-amber-600" />
                      <span>{t.pendingValidation}</span>
                    </span>
                  )}

                  <div className="text-gray-400">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>
              </div>

              {/* Expanded Detail Panel */}
              {isExpanded && (
                <div className="px-3.5 pb-3.5 pt-2 border-t border-gray-100 bg-[#F7FBFA]">
                  
                  {isVerified && lease.landlordRating && (
                    <div className="space-y-2.5">
                      {/* 3-pill confirmation */}
                      <div className="grid grid-cols-3 gap-2">
                        <div className="p-2 rounded-lg bg-white border border-[#0FA3A3]/10 text-center">
                          <span className="text-[10px] text-[#5C7B79] block">{t.q1Payment}</span>
                          <span className="text-xs font-bold text-[#2EC4A6] flex items-center justify-center gap-1 mt-0.5">
                            <CheckCircle2 className="w-3 h-3" /> 100%
                          </span>
                        </div>

                        <div className="p-2 rounded-lg bg-white border border-[#0FA3A3]/10 text-center">
                          <span className="text-[10px] text-[#5C7B79] block">{t.q2Care}</span>
                          <span className="text-xs font-bold text-[#1C3B3A] flex items-center justify-center gap-1 mt-0.5">
                            <Star className="w-3 h-3 fill-[#F2C94C] text-[#F2C94C]" /> 5/5
                          </span>
                        </div>

                        <div className="p-2 rounded-lg bg-white border border-[#0FA3A3]/10 text-center">
                          <span className="text-[10px] text-[#5C7B79] block">{t.q3Deposit}</span>
                          <span className="text-xs font-bold text-[#2EC4A6] flex items-center justify-center gap-1 mt-0.5">
                            <ShieldCheck className="w-3 h-3" /> 100%
                          </span>
                        </div>
                      </div>

                      {/* Landlord Comment */}
                      {lease.landlordRating.comment && (
                        <p className="p-2.5 rounded-lg bg-white border border-[#0FA3A3]/15 text-xs text-[#1C3B3A] italic">
                          "{lease.landlordRating.comment}"
                        </p>
                      )}

                      {/* Landlord Name & Signature & Cryptographic Seal */}
                      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#5C7B79] pt-1">
                        <span className="font-semibold">{lease.landlordRating.landlordName}</span>
                        
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedProofLease(lease);
                            }}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#EBF9F6] text-[#0FA3A3] hover:bg-[#0FA3A3] hover:text-white font-bold text-[10.5px] border border-[#0FA3A3]/30 transition-colors shadow-2xs"
                            title={t.verifyCryptoProofTitle}
                          >
                            <Lock className="w-3 h-3 text-[#2EC4A6]" />
                            <span>{t.certifiedProofLock}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* If Pending: Display 6-char landlord code + validation actions */}
                  {!isVerified && (
                    <div className="p-3 rounded-lg bg-white border border-amber-200 text-xs space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-bold text-[#1C3B3A] block">{lease.landlordName}</span>
                          <span className="text-[11px] text-[#5C7B79]">{lease.landlordEmail}</span>
                        </div>

                        {/* 6-char code box */}
                        <button
                          onClick={(e) => copyToClipboard(leaseCode, e)}
                          className="px-2.5 py-1 rounded-lg bg-[#E6F7F6] border border-[#0FA3A3]/30 text-[#0FA3A3] font-mono font-bold flex items-center gap-1 hover:bg-[#0FA3A3] hover:text-white transition-colors"
                          title={t.copy}
                        >
                          <Copy className="w-3 h-3" />
                          <span>{t.codeLabel}: {leaseCode}</span>
                          {copiedCode === leaseCode && <span className="text-[9px] text-green-700 font-sans">{t.copied}</span>}
                        </button>
                      </div>

                      {/* 1-Click WhatsApp & Email invites to landlord */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          onClick={(e) => sendLandlordWhatsApp(lease, leaseCode, e)}
                          className="py-1.5 px-2 rounded-lg bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#128C7E] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors border border-[#25D366]/30"
                          title={t.inviteLandlordWhatsapp}
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
                          <span>{t.inviteLandlordWhatsapp}</span>
                        </button>

                        <button
                          onClick={(e) => sendLandlordEmail(lease, leaseCode, e)}
                          className="py-1.5 px-2 rounded-lg bg-[#0FA3A3]/10 hover:bg-[#0FA3A3]/20 text-[#0FA3A3] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors border border-[#0FA3A3]/20"
                          title={t.inviteLandlordEmail}
                        >
                          <Mail className="w-3.5 h-3.5 text-[#0FA3A3]" />
                          <span>{t.inviteLandlordEmail}</span>
                        </button>
                      </div>
                      
                      <div className="flex gap-2 pt-1 border-t border-gray-100">
                        <button
                          type="button"
                          onClick={(e) => copyLinkToClipboard(leaseCode, e)}
                          className="flex-1 py-2 px-3 rounded-lg bg-[#E6F7F6] hover:bg-[#d6f2f0] text-[#0FA3A3] font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] border border-[#0FA3A3]/25 shadow-2xs"
                          id={`btn-copy-link-${lease.id}`}
                          title={t.copyVerificationLink}
                        >
                          <LinkIcon className="w-3.5 h-3.5" />
                          <span>{copiedLink === leaseCode ? t.linkCopied : t.copyVerificationLink}</span>
                        </button>

                        {onDeleteLease && (
                          <button
                            type="button"
                            onClick={() => onDeleteLease(lease.id)}
                            className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                            title={t.leaseDeletedToast}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <p className="text-[11px] text-[#5C7B79] bg-stone-50 p-2 rounded-lg border border-stone-100 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#0FA3A3] shrink-0" />
                        <span>{t.shareCodeOrLinkNotice}</span>
                      </p>
                    </div>
                  )}

                </div>
              )}
            </div>
          );
        }))}
      </div>

      {/* Cryptographic Proof Modal */}
      <CryptoProofModal
        isOpen={!!selectedProofLease}
        onClose={() => setSelectedProofLease(null)}
        lease={selectedProofLease}
        tenantName={tenantName}
        language={language}
      />
    </div>
  );
};
