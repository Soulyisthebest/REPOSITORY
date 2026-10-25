import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  ShieldCheck, 
  ShieldAlert,
  Star, 
  ArrowLeft, 
  ThumbsUp, 
  Check,
  Search,
  AlertCircle,
  Loader2,
  Lock,
  Smartphone,
  Sparkles,
  LogOut
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { RentalLease, TenantProfile } from '../types';
import { Language, TRANSLATIONS } from '../i18n/translations';
import { api } from '../api/client';

interface LandlordFastVerificationProps {
  lease?: RentalLease | null;
  tenant?: TenantProfile;
  currentUser?: { id?: string; email: string; name?: string } | null;
  onVerifyComplete: (leaseId: string, ratingData: any) => void;
  onBackToPassport: () => void;
  onLogout?: () => void;
  language: Language;
}

export const LandlordFastVerification: React.FC<LandlordFastVerificationProps> = ({
  lease: initialLease,
  tenant,
  currentUser,
  onVerifyComplete,
  onBackToPassport,
  onLogout,
  language,
}) => {
  const t = TRANSLATIONS[language];
  const [inputCode, setInputCode] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlCode = params.get('code') || params.get('validate');
      if (urlCode) return urlCode.trim().toUpperCase();
    }
    return initialLease?.code || initialLease?.verificationToken || '';
  });
  const [activeLease, setActiveLease] = useState<any>(initialLease || null);
  const [isLookingUp, setIsLookingUp] = useState<boolean>(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  // 4 landlord evaluation answers
  const [tenancyConfirmed, setTenancyConfirmed] = useState<'yes' | 'no'>('yes');
  const [onTimePayment, setOnTimePayment] = useState<'yes' | 'sometimes' | 'no'>('yes');
  const [propertyMaintained, setPropertyMaintained] = useState<'yes' | 'no'>('yes');
  const [wouldRecommend, setWouldRecommend] = useState<'yes' | 'no'>('yes');
  const [comment, setComment] = useState<string>('');
  
  // Mandatory SMS Verification state
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [smsOtpCode, setSmsOtpCode] = useState<string>('');
  const [isSendingOtp, setIsSendingOtp] = useState<boolean>(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState<boolean>(false);
  const [isOtpSent, setIsOtpSent] = useState<boolean>(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState<boolean>(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpSuccessMessage, setOtpSuccessMessage] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isVerifiedDone, setIsVerifiedDone] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlCode = params.get('code') || params.get('validate');
      if (urlCode && !activeLease) {
        handleLookupCode(urlCode.trim().toUpperCase());
        return;
      }
    }
    if (initialLease?.code) {
      handleLookupCode(initialLease.code);
    }
  }, [initialLease?.code]);

  const handleLookupCode = async (codeToLookup?: string) => {
    const code = (codeToLookup || inputCode).trim().toUpperCase();
    if (!code) return;

    setIsLookingUp(true);
    setLookupError(null);
    setSubmitError(null);

    try {
      const res = await api.public.lookupLeaseByCode(code);
      setActiveLease({
        id: initialLease?.id || `lease_${code}`,
        code: res.lease.code,
        tenantName: res.lease.tenantName,
        address: res.lease.address,
        startDate: res.lease.startDate,
        endDate: res.lease.endDate,
        rent: res.lease.rent,
        status: res.lease.status,
        isAlreadyConfirmed: res.lease.isAlreadyConfirmed,
      });

      if (res.lease.isAlreadyConfirmed) {
        setSubmitError(t.alreadyConfirmedError);
      }
    } catch (err: any) {
      setLookupError(err.message || t.leaseNotFoundOrExpired);
      setActiveLease(null);
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleSendOtp = async () => {
    const code = (activeLease?.code || inputCode).trim().toUpperCase();
    if (!phoneNumber.trim()) {
      setOtpError(language === 'es' ? 'Introduce tu número de teléfono' : language === 'fr' ? 'Veuillez renseigner votre numéro' : 'Please enter your phone number');
      return;
    }

    setIsSendingOtp(true);
    setOtpError(null);
    setOtpSuccessMessage(null);

    try {
      const res = await api.public.requestOtp(code, phoneNumber.trim());
      setIsOtpSent(true);
      if (res.demoCode) {
        setSmsOtpCode(res.demoCode);
      }
      setOtpSuccessMessage(t.smsCodeSentToast);
    } catch (err: any) {
      setOtpError(err.message || 'Erreur d\'envoi SMS');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    const code = (activeLease?.code || inputCode).trim().toUpperCase();
    if (!smsOtpCode.trim()) {
      setOtpError(language === 'es' ? 'Introduce el código SMS' : language === 'fr' ? 'Veuillez saisir le code' : 'Please enter SMS code');
      return;
    }

    setIsVerifyingOtp(true);
    setOtpError(null);

    try {
      const res = await api.public.verifyOtp(code, phoneNumber.trim(), smsOtpCode.trim());
      if (res.verified) {
        setIsPhoneVerified(true);
        setOtpSuccessMessage(t.smsVerifiedSuccess);
      }
    } catch (err: any) {
      setOtpError(err.message || 'Code invalide');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = (activeLease?.code || inputCode).trim().toUpperCase();
    if (!code) {
      setSubmitError(t.codeRequiredToCertify);
      return;
    }

    if (!isPhoneVerified) {
      setSubmitError(t.smsMustVerifyFirst);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await api.public.confirmLease(code, {
        tenancy_confirmed: tenancyConfirmed,
        rent_paid_ok: onTimePayment,
        property_maintained: propertyMaintained,
        would_recommend: wouldRecommend,
        comment: comment.trim() || undefined,
        phone: phoneNumber.trim(),
      });

      setIsVerifiedDone(true);

      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#0FA3A3', '#2EC4A6', '#F2C94C'],
        });
      } catch (err) {
        console.error(err);
      }

      onVerifyComplete(activeLease?.id || `lease_${code}`, {
        onTimePayment: onTimePayment === 'yes',
        paymentScore: onTimePayment === 'yes' ? 100 : onTimePayment === 'sometimes' ? 80 : 50,
        propertyCareScore: propertyMaintained === 'yes' ? 5 : 3,
        neighbourhoodRelationsScore: 5,
        depositReturnedFull: propertyMaintained === 'yes',
        wouldRentAgain: wouldRecommend === 'yes',
        comment: comment.trim() || (language === 'es' ? 'Inquilino excelente y de confianza.' : language === 'fr' ? 'Locataire exemplaire et de confiance.' : 'Excellent and trustworthy tenant.'),
        verifiedAt: new Date().toLocaleDateString(language === 'es' ? 'es-ES' : language === 'fr' ? 'fr-FR' : 'en-US'),
        landlordName: activeLease?.ownerNameGuess || (language === 'es' ? 'Casero verificado' : language === 'fr' ? 'Bailleur certifié' : 'Verified landlord'),
        landlordType: 'particulier',
        verificationMethod: 'sms_otp_verified',
      });
    } catch (err: any) {
      setSubmitError(err.message || 'Error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-4" id="landlord-verification-portal">
      
      {/* Back button */}
      <button
        onClick={onBackToPassport}
        className="inline-flex items-center gap-1 text-xs font-semibold text-[#5C7B79] hover:text-[#1C3B3A]"
        id="btn-back-to-passport"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>{t.backBtn}</span>
      </button>

      {/* Main Container */}
      <div className="bg-white rounded-2xl border border-[#0FA3A3]/20 shadow-xs p-5 space-y-4">
        
        {/* Header */}
        <div className="text-center pb-3 border-b border-gray-100">
          <div className="w-10 h-10 rounded-xl bg-[#E6F7F6] text-[#0FA3A3] flex items-center justify-center mx-auto mb-2">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-[#1C3B3A]">
            {t.quickVerifyTitle}
          </h2>
          <p className="text-xs text-[#5C7B79] mt-0.5">
            {t.quickVerifyDesc}
          </p>
        </div>

        {/* 6-character Code lookup bar */}
        <div className="bg-[#F7FBFA] p-3.5 rounded-xl border border-[#0FA3A3]/20 space-y-2.5">
          <label className="text-xs font-bold text-[#1C3B3A] block">
            {t.searchCodePlaceholder} :
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              maxLength={8}
              value={inputCode}
              onChange={(e) => {
                const val = e.target.value.toUpperCase().trim();
                setInputCode(val);
                if (val.length === 6 && (!activeLease || activeLease.code !== val)) {
                  handleLookupCode(val);
                }
              }}
              placeholder={t.searchCodePlaceholder}
              className="flex-1 px-3 py-2 rounded-xl bg-white border border-gray-200 text-[#1C3B3A] font-mono font-bold tracking-widest text-center text-sm focus:outline-none focus:ring-1 focus:ring-[#0FA3A3]"
              id="input-landlord-verification-code"
            />
            <button
              type="button"
              onClick={() => handleLookupCode()}
              disabled={isLookingUp || !inputCode.trim()}
              className="px-4 py-2 rounded-xl bg-[#0FA3A3] hover:bg-[#0D8C8C] text-white font-bold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-60 shrink-0"
              id="btn-lookup-code"
            >
              {isLookingUp ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Search className="w-3.5 h-3.5" />
                  <span>{t.searchCodeBtn}</span>
                </>
              )}
            </button>
          </div>

          {lookupError && (
            <p className="text-xs text-red-600 font-semibold flex items-center gap-1 pt-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {lookupError}
            </p>
          )}

          {activeLease && (
            <div className="mt-2 p-2.5 rounded-lg bg-white border border-[#2EC4A6]/30 text-xs space-y-1">
              <div className="flex items-center justify-between font-bold text-[#1C3B3A]">
                <span>{activeLease.tenantName}</span>
                <span className="px-2 py-0.5 rounded bg-[#EBF9F6] text-[#2EC4A6] font-mono">{activeLease.code}</span>
              </div>
              <p className="text-[#5C7B79]">{activeLease.address}</p>
              <p className="text-[#5C7B79]">{activeLease.startDate} → {activeLease.endDate} • {activeLease.rent}€</p>
            </div>
          )}
        </div>

        {submitError && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>{submitError}</span>
          </div>
        )}

        {isVerifiedDone ? (
          /* Confirmation State */
          <div className="text-center py-6 space-y-4">
            <div className="w-14 h-14 rounded-full bg-[#EBF9F6] text-[#2EC4A6] flex items-center justify-center mx-auto border-2 border-[#2EC4A6]">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#1C3B3A]">{t.certifiedSuccessTitle}</h3>
              <p className="text-xs text-[#5C7B79] mt-1">{t.certifiedSuccessDesc}</p>
            </div>
            
            <button
              onClick={onBackToPassport}
              className="w-full py-3 px-4 rounded-xl bg-[#0FA3A3] text-white font-bold text-sm shadow-xs"
              id="btn-see-updated-passport"
            >
              {t.seePassportBtn}
            </button>
          </div>
        ) : (
          /* 4-Tap Form */
          <form onSubmit={handleSubmit} className="space-y-4" id="landlord-evaluation-form">
            
            {/* Question 1: Tenancy confirmation */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-[#1C3B3A] block">
                1. {t.quickVerifyTitle}
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTenancyConfirmed('yes')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    tenancyConfirmed === 'yes'
                      ? 'bg-[#2EC4A6] text-white border-[#2EC4A6]' 
                      : 'bg-[#F7FBFA] text-[#1C3B3A] border-gray-200'
                  }`}
                  id="btn-tenancy-confirmed-yes"
                >
                  <Check className="w-3.5 h-3.5" />
                  {t.q4Yes}
                </button>

                <button
                  type="button"
                  onClick={() => setTenancyConfirmed('no')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    tenancyConfirmed === 'no'
                      ? 'bg-red-600 text-white border-red-600' 
                      : 'bg-[#F7FBFA] text-[#1C3B3A] border-gray-200'
                  }`}
                  id="btn-tenancy-confirmed-no"
                >
                  {t.q4No}
                </button>
              </div>
            </div>

            {/* Question 2: Payment */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-[#1C3B3A] block">
                2. {t.q1Payment}
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setOnTimePayment('yes')}
                  className={`p-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                    onTimePayment === 'yes'
                      ? 'bg-[#2EC4A6] text-white border-[#2EC4A6]' 
                      : 'bg-[#F7FBFA] text-[#1C3B3A] border-gray-200'
                  }`}
                  id="btn-rent-ontime-yes"
                >
                  <Check className="w-3.5 h-3.5" />
                  {t.q1Yes}
                </button>

                <button
                  type="button"
                  onClick={() => setOnTimePayment('sometimes')}
                  className={`p-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                    onTimePayment === 'sometimes'
                      ? 'bg-amber-600 text-white border-amber-600' 
                      : 'bg-[#F7FBFA] text-[#1C3B3A] border-gray-200'
                  }`}
                  id="btn-rent-ontime-sometimes"
                >
                  {t.q1No}
                </button>

                <button
                  type="button"
                  onClick={() => setOnTimePayment('no')}
                  className={`p-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                    onTimePayment === 'no'
                      ? 'bg-red-600 text-white border-red-600' 
                      : 'bg-[#F7FBFA] text-[#1C3B3A] border-gray-200'
                  }`}
                  id="btn-rent-ontime-no"
                >
                  {t.q4No}
                </button>
              </div>
            </div>

            {/* Question 3: Property Maintenance */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-[#1C3B3A] block">
                3. {t.q2Care}
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPropertyMaintained('yes')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    propertyMaintained === 'yes'
                      ? 'bg-[#2EC4A6] text-white border-[#2EC4A6]' 
                      : 'bg-[#F7FBFA] text-[#1C3B3A] border-gray-200'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  {t.q3Full}
                </button>

                <button
                  type="button"
                  onClick={() => setPropertyMaintained('no')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    propertyMaintained === 'no'
                      ? 'bg-amber-600 text-white border-amber-600' 
                      : 'bg-[#F7FBFA] text-[#1C3B3A] border-gray-200'
                  }`}
                >
                  {t.q3Partial}
                </button>
              </div>
            </div>

            {/* Question 4: Would Recommend */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-[#1C3B3A] block">
                4. {t.q4Recommend}
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setWouldRecommend('yes')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    wouldRecommend === 'yes'
                      ? 'bg-[#0FA3A3] text-white border-[#0FA3A3]' 
                      : 'bg-[#F7FBFA] text-[#1C3B3A] border-gray-200'
                  }`}
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  {t.q4Yes}
                </button>

                <button
                  type="button"
                  onClick={() => setWouldRecommend('no')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    wouldRecommend === 'no'
                      ? 'bg-gray-700 text-white border-gray-700' 
                      : 'bg-[#F7FBFA] text-[#1C3B3A] border-gray-200'
                  }`}
                >
                  {t.q4No}
                </button>
              </div>
            </div>

            {/* Optional Comment */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#5C7B79]">
                {t.commentOptional} :
              </label>
              <textarea
                rows={2}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-gray-200 bg-[#F7FBFA] text-[#1C3B3A] focus:outline-none focus:ring-1 focus:ring-[#0FA3A3]"
                placeholder={t.commentOptional}
              />
            </div>

            {/* Mandatory Step 5: SMS Verification of Landlord */}
            <div className={`rounded-xl border ${isPhoneVerified ? 'border-[#2EC4A6] bg-[#F4FCF9]' : 'border-amber-200 bg-[#FFFDF7]'} p-3.5 sm:p-4 transition-all`} id="mandatory-sms-container">
              <div className="flex items-start justify-between gap-3 mb-2.5">
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isPhoneVerified ? 'bg-[#2EC4A6] text-white' : 'bg-amber-100 text-amber-800'}`}>
                    {isPhoneVerified ? <Check className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#1C3B3A]">
                        {t.mandatorySmsTitle}
                      </span>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${isPhoneVerified ? 'bg-[#2EC4A6]/20 text-[#17856F]' : 'bg-amber-200/80 text-amber-900'}`}>
                        {isPhoneVerified ? t.smsVerifiedLandlordBadge : t.mandatorySmsBadge}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#5C7B79] mt-0.5 leading-snug">
                      {isPhoneVerified ? `${t.smsVerifiedSuccess} (${phoneNumber})` : t.mandatorySmsDesc}
                    </p>
                  </div>
                </div>
              </div>

              {!isPhoneVerified ? (
                <div className="space-y-3 pt-1">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#1C3B3A] block">
                      {t.phoneLabel} <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="+34 600 000 000"
                        className="flex-1 text-xs px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-[#1C3B3A] focus:outline-none focus:ring-2 focus:ring-[#0FA3A3]"
                        id="input-mandatory-phone"
                      />
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={isSendingOtp || !phoneNumber.trim()}
                        className="px-3.5 py-2.5 rounded-xl bg-[#0FA3A3] hover:bg-[#0c8282] text-white text-xs font-bold transition-colors disabled:opacity-50 shrink-0 shadow-xs flex items-center gap-1.5"
                        id="btn-send-mandatory-otp"
                      >
                        {isSendingOtp ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : t.sendSmsCodeBtn}
                      </button>
                    </div>
                  </div>

                  {isOtpSent && (
                    <div className="space-y-2 pt-1 border-t border-amber-100">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-[#1C3B3A]">
                          {t.smsCodePlaceholder} <span className="text-red-500">*</span>
                        </label>
                        {smsOtpCode && (
                          <div className="flex items-center gap-1 text-[11px] text-[#0FA3A3] font-mono font-bold bg-[#EBF9F6] px-2 py-0.5 rounded-md">
                            <span>{t.enterTestCodeHelper} <strong>{smsOtpCode}</strong></span>
                            <button
                              type="button"
                              onClick={() => setSmsOtpCode(smsOtpCode)}
                              className="underline text-[10px] text-[#0FA3A3] hover:text-[#0c8282] ml-1"
                            >
                              {t.fillTestCode}
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          maxLength={6}
                          value={smsOtpCode}
                          onChange={(e) => setSmsOtpCode(e.target.value)}
                          placeholder="123456"
                          className="flex-1 text-xs px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-[#1C3B3A] font-mono tracking-widest text-center font-bold focus:outline-none focus:ring-2 focus:ring-[#0FA3A3]"
                          id="input-mandatory-otp-code"
                        />
                        <button
                          type="button"
                          onClick={handleVerifyOtp}
                          disabled={isVerifyingOtp || !smsOtpCode.trim()}
                          className="px-3.5 py-2.5 rounded-xl bg-[#2EC4A6] hover:bg-[#25A98F] text-white text-xs font-bold transition-colors disabled:opacity-50 shrink-0 flex items-center gap-1.5 shadow-xs"
                          id="btn-verify-mandatory-otp"
                        >
                          {isVerifyingOtp ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Check className="w-3.5 h-3.5" /> {t.verifySmsCodeBtn}</>}
                        </button>
                      </div>
                    </div>
                  )}

                  {otpError && (
                    <p className="text-xs text-red-600 font-semibold flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {otpError}
                    </p>
                  )}

                  {otpSuccessMessage && (
                    <p className="text-xs text-[#2EC4A6] font-semibold flex items-center gap-1 mt-1">
                      <Sparkles className="w-3.5 h-3.5 shrink-0" /> {otpSuccessMessage}
                    </p>
                  )}
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-[#EBF9F6] border border-[#2EC4A6]/30 text-[#17856F] text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-[#2EC4A6]" />
                  <span>{t.smsVerifiedSuccess} : {phoneNumber}</span>
                </div>
              )}
            </div>

            {/* Immutability Notice */}
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
              <Lock className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
              <span>
                <strong>{t.immutableNoticeWormTitle}</strong> {t.immutableNoticeWormDesc}
              </span>
            </div>

            {/* If already confirmed warning */}
            {activeLease?.isAlreadyConfirmed && (
              <div className="p-3 rounded-xl bg-[#EBF9F6] border border-[#2EC4A6] text-xs text-[#17856F] flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-[#2EC4A6]" />
                <span>{t.alreadyCertifiedSealedNotice}</span>
              </div>
            )}

            {/* Phone Not Verified Hint */}
            {!isPhoneVerified && !activeLease?.isAlreadyConfirmed && (
              <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-800 flex items-center justify-center gap-1.5 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                <span>{t.smsMustVerifyFirst}</span>
              </div>
            )}

            {/* Single Prominent Action Button */}
            <button
              type="submit"
              disabled={isSubmitting || !isPhoneVerified || (activeLease && activeLease.isAlreadyConfirmed)}
              className="w-full py-3 px-4 rounded-xl bg-[#0FA3A3] hover:bg-[#0D8C8C] text-white font-bold text-sm shadow-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              id="btn-landlord-certify-submit"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>{activeLease?.isAlreadyConfirmed ? t.alreadyCertifiedSealedNotice : t.certifyBtn}</span>
                </>
              )}
            </button>

          </form>
        )}

      </div>
    </div>
  );
};
