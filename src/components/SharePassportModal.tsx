import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  X, 
  Copy, 
  Check, 
  Share2, 
  MessageCircle, 
  Mail, 
  FileText,
  ExternalLink
} from 'lucide-react';
import { TenantProfile } from '../types';
import { Language, TRANSLATIONS } from '../i18n/translations';

interface SharePassportModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenant: TenantProfile;
  onOpenCertificate: () => void;
  onOpenLandlordView: () => void;
  language: Language;
}

export const SharePassportModal: React.FC<SharePassportModalProps> = ({
  isOpen,
  onClose,
  tenant,
  onOpenCertificate,
  onOpenLandlordView,
  language,
}) => {
  const t = TRANSLATIONS[language];
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Real app URL with deep link to public view
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://rentia.app';
  const shareUrl = `${currentOrigin}/?inspect=1`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getShareText = () => {
    return `${t.shareWhatsappMessage} ${shareUrl}`;
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(getShareText());
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent(`${t.shareEmailSubject} - ${tenant.fullName}`);
    const body = encodeURIComponent(getShareText());
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl border border-[#0FA3A3]/20 relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
          id="btn-close-share-modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="text-center mb-4">
          <div className="w-10 h-10 rounded-xl bg-[#E6F7F6] text-[#0FA3A3] flex items-center justify-center mx-auto mb-2">
            <Share2 className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold text-[#1C3B3A]">
            {t.shareBtn}
          </h2>
          <p className="text-xs text-[#5C7B79]">
            {tenant.fullName} • {t.scoreLabel} {tenant.trustScore}/100
          </p>
        </div>

        {/* QR Code Container */}
        <div className="bg-[#F7FBFA] p-4 rounded-xl border border-[#0FA3A3]/15 flex flex-col items-center justify-center space-y-2">
          <div className="p-2 bg-white rounded-xl border border-gray-100 shadow-xs">
            <QRCodeSVG
              value={shareUrl}
              size={140}
              level="M"
              bgColor="#FFFFFF"
              fgColor="#1C3B3A"
            />
          </div>
          <p className="text-[11px] text-[#5C7B79]">{t.scanQr}</p>
        </div>

        {/* 1-Click WhatsApp & Email share buttons */}
        <div className="grid grid-cols-2 gap-2 mt-3">
          <button
            onClick={handleWhatsAppShare}
            className="py-2.5 px-3 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#128C7E] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors border border-[#25D366]/30"
            id="btn-share-whatsapp"
          >
            <MessageCircle className="w-4 h-4 text-[#25D366]" />
            <span>{t.shareWhatsapp}</span>
          </button>

          <button
            onClick={handleEmailShare}
            className="py-2.5 px-3 rounded-xl bg-[#0FA3A3]/10 hover:bg-[#0FA3A3]/20 text-[#0FA3A3] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors border border-[#0FA3A3]/20"
            id="btn-share-email"
          >
            <Mail className="w-4 h-4 text-[#0FA3A3]" />
            <span>{t.shareEmail}</span>
          </button>
        </div>

        {/* Share Link Copy */}
        <div className="mt-2.5 flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={shareUrl}
            className="w-full text-xs font-mono p-2 rounded-xl border border-gray-200 bg-[#F7FBFA] text-[#1C3B3A]"
          />
          <button
            onClick={handleCopyLink}
            className="px-3 py-2 rounded-xl bg-[#0FA3A3] text-white font-bold text-xs shrink-0 flex items-center gap-1 hover:bg-[#0D8C8C] transition-colors"
            id="btn-copy-share-url"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? t.copied : t.copy}</span>
          </button>
        </div>

        {/* Secondary options: PDF or Landlord View */}
        <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2 text-center text-xs">
          <button
            onClick={onOpenCertificate}
            className="py-1.5 px-2 rounded-lg bg-[#F7FBFA] text-[#1C3B3A] font-semibold flex items-center justify-center gap-1 hover:bg-gray-100 transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-[#0FA3A3]" />
            <span>{t.viewCert}</span>
          </button>
          <button
            onClick={onOpenLandlordView}
            className="py-1.5 px-2 rounded-lg bg-[#F7FBFA] text-[#1C3B3A] font-semibold flex items-center justify-center gap-1 hover:bg-gray-100 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5 text-[#0FA3A3]" />
            <span>{t.viewLandlord}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
