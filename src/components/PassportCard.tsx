import React, { useState } from 'react';
import { 
  ShieldCheck, 
  QrCode, 
  Share2, 
  Lock,
  CheckCircle2,
  Clock,
  Briefcase,
  Euro,
  Users,
  PawPrint,
  Edit3,
  Camera,
  Settings,
  Eye,
  EyeOff,
  Check,
  X
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../api/client';
import { TenantProfile } from '../types';
import { Language, TRANSLATIONS } from '../i18n/translations';

interface PassportCardProps {
  tenant: TenantProfile;
  language: Language;
  onOpenShareModal: () => void;
  onOpenSimulatorModal?: () => void;
  onOpenKycModal?: () => void;
  onOpenOnboardingModal?: () => void;
}

export const PassportCard: React.FC<PassportCardProps> = ({
  tenant,
  language,
  onOpenShareModal,
  onOpenKycModal,
  onOpenOnboardingModal,
}) => {
  const t = TRANSLATIONS[language];
  const [showQrFullscreen, setShowQrFullscreen] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);

  // Tenant configurable characteristics visibility
  const [visibleFields, setVisibleFields] = useState<{
    salary: boolean;
    employment: boolean;
    guarantor: boolean;
    pets: boolean;
  }>(() => {
    try {
      const saved = localStorage.getItem(`rentia_tenant_vis_${tenant.id || 'default'}`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return { salary: true, employment: true, guarantor: true, pets: true };
  });

  const handleToggleField = (field: 'salary' | 'employment' | 'guarantor' | 'pets') => {
    setVisibleFields((prev) => {
      const next = { ...prev, [field]: !prev[field] };
      try {
        localStorage.setItem(`rentia_tenant_vis_${tenant.id || 'default'}`, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const profileCode = tenant.passportNumber || (tenant.id ? `RNTA-${tenant.id.substring(0, 4).toUpperCase()}` : 'RNTA-VAL784');
  const qrVerificationUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/p/${profileCode}`
    : `https://rentia.es/p/${profileCode}`;

  const initialLetter = (tenant.fullName || tenant.firstName || t.guestUser).charAt(0).toUpperCase();

  const isVerified = tenant.isVerified || tenant.verificationStatus === 'verified';
  const isPendingKyc = tenant.verificationStatus === 'pending_admin';

  return (
    <div className="bg-white rounded-3xl p-6 border border-stone-200/80 shadow-sm space-y-6">
      
      {/* Passport Header with Rentia Indigo Identity */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-stone-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#1E1B4B] text-white flex items-center justify-center font-black text-base shadow-xs shrink-0 relative">
            {initialLetter}
            {isVerified && (
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white text-[10px]">
                ✓
              </span>
            )}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold text-[#1E1B4B]">
                {tenant.fullName || t.guestUser}
              </h2>

              {/* Check Verde verificado por admin */}
              {isVerified ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 text-[10px] font-black" title="Perfil verificado por la administración con DNI cotejado">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Check Verde Verificado</span>
                </span>
              ) : isPendingKyc ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-300 text-amber-800 text-[10px] font-bold">
                  <Clock className="w-3 h-3 text-amber-600 animate-spin" />
                  <span>DNI en revisión por Admin</span>
                </span>
              ) : (
                onOpenKycModal && (
                  <button
                    onClick={onOpenKycModal}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-stone-100 hover:bg-emerald-50 hover:text-emerald-800 border border-stone-300 hover:border-emerald-300 text-stone-600 text-[10px] font-bold transition-colors"
                    title="Sube tu DNI y fotografía para obtener el Check Verde validado por el administrador"
                  >
                    <Camera className="w-3 h-3" />
                    <span>Verificar con DNI</span>
                  </button>
                )
              )}
            </div>
            <p className="text-xs text-stone-500 font-mono mt-0.5">
              {tenant.passportNumber || tenant.id ? `N° ${tenant.passportNumber || tenant.passportId || tenant.id}` : t.noActiveSessionDesc}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {!isVerified && !isPendingKyc && onOpenKycModal && (
            <button
              onClick={onOpenKycModal}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Conseguir Check Verde</span>
            </button>
          )}

          <button
            onClick={onOpenShareModal}
            className="p-2 rounded-xl bg-stone-50 hover:bg-stone-100 text-[#1E1B4B] transition-colors"
            title={t.shareBtn}
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Score & Metrics Panel */}
      <div className="grid grid-cols-3 gap-3">
        {/* Metric 1: Trust Score */}
        <div className="bg-[#FAF9F6] rounded-2xl p-3.5 text-center border border-stone-200/60">
          <p className="text-2xl font-black text-[#1E1B4B] leading-none">
            {tenant.stats?.trustScore ?? tenant.trustScore ?? 0}
            <span className="text-xs text-stone-400 font-normal">/100</span>
          </p>
          <p className="text-[11px] font-semibold text-stone-600 mt-1 truncate">{t.scoreLabel}</p>
        </div>

        {/* Metric 2: On-time Payments */}
        <div className="bg-[#FAF9F6] rounded-2xl p-3.5 text-center border border-stone-200/60">
          <p className="text-2xl font-black text-[#1E1B4B] leading-none">
            {tenant.stats?.onTimePaymentRate ?? tenant.onTimePaymentRate ?? 0}%
          </p>
          <p className="text-[11px] font-semibold text-stone-600 mt-1 truncate">{t.onTimePayments}</p>
        </div>

        {/* Metric 3: Verified Leases */}
        <div className="bg-[#FAF9F6] rounded-2xl p-3.5 text-center border border-stone-200/60">
          <p className="text-2xl font-black text-[#1E1B4B] leading-none">
            {tenant.stats?.verifiedLandlordsCount ?? tenant.verifiedLeasesCount ?? 0}
          </p>
          <p className="text-[11px] font-semibold text-stone-600 mt-1 truncate">{t.verifiedLandlords}</p>
        </div>
      </div>

      {/* Laboral & Solvencia Panel (Editable por el inquilino con control de visibilidad) */}
      <div className="bg-[#FAF9F6] rounded-2xl p-4 border border-stone-200/80 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-[#1E1B4B]" />
            <h3 className="text-xs font-bold text-[#1E1B4B] uppercase tracking-wider">
              Características del Inquilino & Solvencia
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowConfigModal(true)}
              className="text-[11px] font-bold text-stone-600 hover:text-[#1E1B4B] flex items-center gap-1"
            >
              <Settings className="w-3 h-3" />
              <span>Privacidad</span>
            </button>
            {onOpenOnboardingModal && (
              <button
                onClick={onOpenOnboardingModal}
                className="text-[11px] font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1 hover:underline"
              >
                <Edit3 className="w-3 h-3" />
                <span>Modificar datos</span>
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          <div className="p-2.5 bg-white rounded-xl border border-stone-200/60">
            <div className="flex items-center justify-between">
              <span className="block text-[10px] text-stone-400 font-bold uppercase">Nómina mensual</span>
              {!visibleFields.salary && <span title="Oculto en perfil público"><EyeOff className="w-3 h-3 text-stone-300" /></span>}
            </div>
            <span className="font-black text-[#1E1B4B]">
              {visibleFields.salary
                ? (tenant.monthlyIncome || tenant.monthlySalary ? `${tenant.monthlyIncome || tenant.monthlySalary} €/mes` : 'Por indicar')
                : 'Oculto por el inquilino'}
            </span>
          </div>

          <div className="p-2.5 bg-white rounded-xl border border-stone-200/60">
            <div className="flex items-center justify-between">
              <span className="block text-[10px] text-stone-400 font-bold uppercase">Trabajo / Contrato</span>
              {!visibleFields.employment && <span title="Oculto en perfil público"><EyeOff className="w-3 h-3 text-stone-300" /></span>}
            </div>
            <span className="font-bold text-[#1E1B4B] truncate block capitalize">
              {visibleFields.employment
                ? (tenant.employmentType || tenant.profession || 'No especificado')
                : 'Oculto por el inquilino'}
            </span>
          </div>

          <div className="p-2.5 bg-white rounded-xl border border-stone-200/60">
            <div className="flex items-center justify-between">
              <span className="block text-[10px] text-stone-400 font-bold uppercase">Avalista</span>
              {!visibleFields.guarantor && <span title="Oculto en perfil público"><EyeOff className="w-3 h-3 text-stone-300" /></span>}
            </div>
            <span className="font-bold text-[#1E1B4B]">
              {visibleFields.guarantor
                ? (tenant.hasGuarantor ? `Sí (${tenant.guarantorIncome || 0} €)` : 'Sin avalista')
                : 'Oculto por el inquilino'}
            </span>
          </div>

          <div className="p-2.5 bg-white rounded-xl border border-stone-200/60">
            <div className="flex items-center justify-between">
              <span className="block text-[10px] text-stone-400 font-bold uppercase">Mascotas</span>
              {!visibleFields.pets && <span title="Oculto en perfil público"><EyeOff className="w-3 h-3 text-stone-300" /></span>}
            </div>
            <span className="font-bold text-[#1E1B4B] truncate block">
              {visibleFields.pets
                ? (tenant.hasPets ? (tenant.petDetails ? `Sí (${tenant.petDetails})` : 'Sí tiene') : 'Sin mascotas')
                : 'Oculto por el inquilino'}
            </span>
          </div>
        </div>
      </div>

      {/* DEDICATED QR CODE SPACE (Pure SVG - reliable local generation) */}
      <div className="bg-[#FAF9F6] rounded-2xl p-4 border border-stone-200/80 flex items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <QrCode className="w-4 h-4 text-[#1E1B4B]" />
            <h3 className="text-xs font-bold text-[#1E1B4B]">{t.qrVerifiedTitle}</h3>
          </div>
          <p className="text-[11px] text-stone-500 max-w-xs leading-relaxed">
            {t.qrVerifiedDesc}
          </p>
          <div className="pt-1 flex items-center gap-2">
            <button
              onClick={() => setShowQrFullscreen(true)}
              className="text-[11px] text-[#0FA3A3] font-bold hover:underline flex items-center gap-1"
            >
              <span>Ampliar código QR</span>
            </button>
          </div>
        </div>

        <div 
          onClick={() => setShowQrFullscreen(true)}
          className="bg-white p-2.5 rounded-2xl border border-stone-200 shadow-xs cursor-pointer hover:scale-105 transition-transform shrink-0"
          title="Haz clic para ampliar tu código QR"
        >
          <QRCodeSVG
            value={qrVerificationUrl}
            size={72}
            bgColor="#FFFFFF"
            fgColor="#1E1B4B"
            level="M"
          />
        </div>
      </div>

      {/* Fullscreen QR Modal */}
      {showQrFullscreen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-xs w-full text-center shadow-2xl border border-stone-200 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#1E1B4B]">{t.qrVerifiedTitle}</h3>
              <button 
                onClick={() => setShowQrFullscreen(false)}
                className="p-1 rounded-full text-stone-400 hover:text-stone-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="bg-[#FAF9F6] p-5 rounded-2xl border border-stone-200 inline-block shadow-inner">
              <QRCodeSVG
                value={qrVerificationUrl}
                size={200}
                bgColor="#FAF9F6"
                fgColor="#1E1B4B"
                level="Q"
              />
            </div>
            
            <p className="text-[10px] text-stone-500 font-mono break-all">{qrVerificationUrl}</p>
            <button
              onClick={() => setShowQrFullscreen(false)}
              className="w-full py-2.5 bg-[#1E1B4B] text-white rounded-xl text-xs font-bold hover:bg-[#28235C] transition-colors"
            >
              {t.closeBtn}
            </button>
          </div>
        </div>
      )}

      {/* Config Characteristics Modal (Inquilino decide qué mostrar) */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-[#1E1B4B]" />
                <h3 className="text-sm font-bold text-[#1E1B4B]">Características del Perfil</h3>
              </div>
              <button 
                onClick={() => setShowConfigModal(false)}
                className="p-1 text-stone-400 hover:text-stone-600 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-stone-500">
              Elige qué datos deseas mostrar o mantener privados en tu pasaporte y código QR público:
            </p>

            <div className="space-y-2.5">
              <label className="flex items-center justify-between p-2.5 rounded-xl bg-stone-50 border border-stone-200 cursor-pointer hover:bg-stone-100 transition-colors">
                <div className="flex items-center gap-2">
                  <Euro className="w-4 h-4 text-emerald-600" />
                  <div>
                    <span className="text-xs font-bold text-[#1E1B4B] block">Nómina / Ingresos mensuales</span>
                    <span className="text-[10px] text-stone-400">Mostrar tu rango salarial verificado</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={visibleFields.salary}
                  onChange={() => handleToggleField('salary')}
                  className="rounded text-[#1E1B4B] focus:ring-[#1E1B4B] w-4 h-4 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-xl bg-stone-50 border border-stone-200 cursor-pointer hover:bg-stone-100 transition-colors">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-indigo-600" />
                  <div>
                    <span className="text-xs font-bold text-[#1E1B4B] block">Trabajo / Tipo de contrato</span>
                    <span className="text-[10px] text-stone-400">Indefinido, funcionario, autónomo...</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={visibleFields.employment}
                  onChange={() => handleToggleField('employment')}
                  className="rounded text-[#1E1B4B] focus:ring-[#1E1B4B] w-4 h-4 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-xl bg-stone-50 border border-stone-200 cursor-pointer hover:bg-stone-100 transition-colors">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <div>
                    <span className="text-xs font-bold text-[#1E1B4B] block">Avalista de alquiler</span>
                    <span className="text-[10px] text-stone-400">Informar si cuentas con aval o garantía</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={visibleFields.guarantor}
                  onChange={() => handleToggleField('guarantor')}
                  className="rounded text-[#1E1B4B] focus:ring-[#1E1B4B] w-4 h-4 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-xl bg-stone-50 border border-stone-200 cursor-pointer hover:bg-stone-100 transition-colors">
                <div className="flex items-center gap-2">
                  <PawPrint className="w-4 h-4 text-teal-600" />
                  <div>
                    <span className="text-xs font-bold text-[#1E1B4B] block">Mascotas</span>
                    <span className="text-[10px] text-stone-400">Información sobre animales de compañía</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={visibleFields.pets}
                  onChange={() => handleToggleField('pets')}
                  className="rounded text-[#1E1B4B] focus:ring-[#1E1B4B] w-4 h-4 cursor-pointer"
                />
              </label>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={async () => {
                  try {
                    await api.public.updateProfileVisibility({
                      show_income: visibleFields.salary,
                      show_employment: visibleFields.employment,
                      show_guarantor: visibleFields.guarantor,
                      show_pets: visibleFields.pets,
                    });
                  } catch {}
                  setShowConfigModal(false);
                }}
                className="flex-1 py-2.5 bg-[#1E1B4B] hover:bg-[#28235C] text-white rounded-xl text-xs font-bold transition-all"
              >
                Guardar preferencias
              </button>
              <a
                href={qrVerificationUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-2.5 bg-stone-100 hover:bg-stone-200 text-[#1E1B4B] rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1"
                title="Abrir y probar perfil público"
              >
                Probar QR
              </a>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
