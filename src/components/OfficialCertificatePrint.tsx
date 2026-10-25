import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  Printer, 
  ArrowLeft
} from 'lucide-react';
import { TenantProfile, RentalLease } from '../types';
import { Language, TRANSLATIONS } from '../i18n/translations';

interface OfficialCertificatePrintProps {
  tenant: TenantProfile;
  leases: RentalLease[];
  onBackToPassport: () => void;
  language: Language;
}

export const OfficialCertificatePrint: React.FC<OfficialCertificatePrintProps> = ({
  tenant,
  leases,
  onBackToPassport,
  language,
}) => {
  const t = TRANSLATIONS[language];
  const verifiedLeases = leases.filter(l => l.status === 'verified');
  const shareUrl = `https://rentia.app/verify/${tenant.passportId.toLowerCase()}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4" id="certificate-print-view">
      
      {/* Top Action Toolbar (hidden on print) */}
      <div className="no-print flex items-center justify-between bg-white p-3 rounded-xl border border-[#0FA3A3]/20 shadow-xs">
        <button
          onClick={onBackToPassport}
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#5C7B79] hover:text-[#1C3B3A]"
          id="btn-back-from-cert"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{t.backBtn}</span>
        </button>

        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0FA3A3] text-white text-xs font-bold shadow-xs hover:bg-[#0D8C8C] transition-colors"
          id="btn-print-certificate"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>{t.certPdfBtn}</span>
        </button>
      </div>

      {/* The Printable Certificate Document */}
      <div className="bg-white text-[#1C3B3A] p-6 sm:p-8 rounded-2xl shadow-xs border border-[#0FA3A3]/20 relative overflow-hidden print:border-none print:shadow-none print:p-4">
        
        {/* Top Header of Document */}
        <div className="text-center pb-5 border-b border-gray-100">
          <div className="w-10 h-10 rounded-xl bg-[#0FA3A3] text-white flex items-center justify-center mx-auto mb-2 shadow-xs">
            <ShieldCheck className="w-5 h-5" />
          </div>

          <span className="text-[10px] uppercase tracking-widest text-[#0FA3A3] font-bold block">
            {t.officialProtocol}
          </span>
          <h1 className="text-xl font-bold text-[#1C3B3A] uppercase mt-0.5">
            {t.inspectionTitle}
          </h1>
          <p className="text-xs text-[#5C7B79] font-mono mt-0.5">
            ID: #{tenant.passportId}
          </p>
        </div>

        {/* Identity of Tenant & Key Indicators */}
        <div className="grid grid-cols-3 gap-3 py-4 border-b border-gray-100 text-center">
          <div className="p-2.5 rounded-xl bg-[#F7FBFA]">
            <span className="text-xl font-black text-[#0FA3A3] block">{tenant.trustScore}/100</span>
            <span className="text-[11px] text-[#5C7B79]">{t.scoreLabel}</span>
          </div>

          <div className="p-2.5 rounded-xl bg-[#F7FBFA]">
            <span className="text-xl font-black text-[#2EC4A6] block">
              {tenant.stats?.onTimePaymentRate ?? tenant.onTimePaymentRate ?? 0}%
            </span>
            <span className="text-[11px] text-[#5C7B79]">{t.onTimePunctuality}</span>
          </div>

          <div className="p-2.5 rounded-xl bg-[#F7FBFA]">
            <span className="text-xl font-black text-[#1C3B3A] block">{verifiedLeases.length}</span>
            <span className="text-[11px] text-[#5C7B79]">{t.verifiedLandlords}</span>
          </div>
        </div>

        {/* Detailed List of Verified Tenancies */}
        <div className="py-4 space-y-2.5">
          <h2 className="text-xs font-bold text-[#5C7B79] uppercase tracking-wider">
            {t.leasesHistory}
          </h2>

          <div className="space-y-2">
            {verifiedLeases.map((lease, idx) => (
              <div 
                key={`${lease.id}-${idx}`} 
                className="p-3 rounded-xl bg-[#F7FBFA] border border-gray-100 text-xs space-y-1"
              >
                <div className="flex items-center justify-between font-bold text-[#1C3B3A]">
                  <span>{lease.address}, {lease.city}</span>
                  <span className="text-[#2EC4A6] flex items-center gap-1 font-semibold">
                    <CheckCircle2 className="w-3 h-3" /> {t.verifiedBadge}
                  </span>
                </div>

                <div className="text-[11px] text-[#5C7B79]">
                  <span>{lease.monthsCount} {t.monthsCount} • {lease.monthlyRent}{lease.currency}{t.perMonth} • {lease.landlordRating?.landlordName}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer with QR */}
        <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-4">
          <div className="text-[10px] text-[#5C7B79]">
            <p className="font-bold text-[#1C3B3A]">{t.digitalPassportLabel}</p>
            <p>{t.scanQr}</p>
          </div>

          <div className="p-1.5 bg-[#F7FBFA] rounded-lg border border-gray-200">
            <QRCodeSVG
              value={shareUrl}
              size={56}
              level="M"
              bgColor="#F7FBFA"
              fgColor="#1C3B3A"
            />
          </div>
        </div>

      </div>

    </div>
  );
};
