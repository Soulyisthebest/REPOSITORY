import React, { useState } from 'react';
import { X, User, Building2, ShieldCheck, ArrowRight, CheckCircle2, Briefcase } from 'lucide-react';
import { UserRole } from '../types';
import { Language, TRANSLATIONS } from '../i18n/translations';

interface RoleSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRole: (role: UserRole) => void;
  language: Language;
}

export const RoleSelectionModal: React.FC<RoleSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelectRole,
  language,
}) => {
  const t = TRANSLATIONS[language];
  const [selected, setSelected] = useState<UserRole | null>(null);

  if (!isOpen) return null;

  const handleContinue = (role: UserRole) => {
    setSelected(role);
    onSelectRole(role);
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-3xl max-w-2xl sm:max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-stone-200 relative animate-fade-in max-h-[92vh] overflow-y-auto"
        id="role-selection-modal"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-colors"
          id="btn-close-role-modal"
          aria-label={language === 'es' ? 'Cerrar' : language === 'en' ? 'Close' : 'Fermer'}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-[#D97706]" />
            <span>{t.selectProfileTitle}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#1E1B4B] tracking-tight">
            {t.selectProfileTitle}
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 mt-1 max-w-md mx-auto">
            {t.selectProfileSubtitle}
          </p>
        </div>

        {/* 3 Exclusive Cards: Inquilino, Propietario Privado, Agencia Inmobiliaria */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mb-6">
          
          {/* Card 1: TENANT */}
          <button
            type="button"
            onClick={() => handleContinue('tenant')}
            className={`group text-left p-4 sm:p-5 rounded-2xl border-2 transition-all flex flex-col justify-between ${
              selected === 'tenant'
                ? 'border-[#1E1B4B] bg-[#1E1B4B]/5 shadow-md ring-2 ring-[#1E1B4B]/20'
                : 'border-stone-200 bg-white hover:border-[#1E1B4B] hover:bg-stone-50/80 shadow-2xs'
            }`}
            id="btn-choose-tenant"
          >
            <div>
              <div className="w-11 h-11 rounded-2xl bg-indigo-100 text-[#1E1B4B] flex items-center justify-center mb-3.5 group-hover:scale-105 transition-transform">
                <User className="w-5 h-5" />
              </div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-sm sm:text-base text-[#1E1B4B]">
                  {t.roleTenantTitle}
                </h3>
                {selected === 'tenant' && (
                  <CheckCircle2 className="w-4 h-4 text-[#1E1B4B]" />
                )}
              </div>
              <p className="text-xs text-stone-600 leading-relaxed">
                {t.roleTenantDesc}
              </p>
            </div>
            
            <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs font-bold text-[#1E1B4B]">
              <span>{t.getStartedBtn}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Card 2: PROPIETARIO PRIVADO */}
          <button
            type="button"
            onClick={() => handleContinue('landlord')}
            className={`group text-left p-4 sm:p-5 rounded-2xl border-2 transition-all flex flex-col justify-between ${
              selected === 'landlord'
                ? 'border-[#0FA3A3] bg-[#0FA3A3]/5 shadow-md ring-2 ring-[#0FA3A3]/20'
                : 'border-stone-200 bg-white hover:border-[#0FA3A3] hover:bg-stone-50/80 shadow-2xs'
            }`}
            id="btn-choose-landlord"
          >
            <div>
              <div className="w-11 h-11 rounded-2xl bg-teal-100 text-[#0FA3A3] flex items-center justify-center mb-3.5 group-hover:scale-105 transition-transform">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-sm sm:text-base text-[#1C3B3A]">
                  {t.roleLandlordTitle}
                </h3>
                {selected === 'landlord' && (
                  <CheckCircle2 className="w-4 h-4 text-[#0FA3A3]" />
                )}
              </div>
              <p className="text-xs text-stone-600 leading-relaxed">
                {t.roleLandlordDesc}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs font-bold text-[#0FA3A3]">
              <span>{t.getStartedBtn}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Card 3: AGENCIA INMOBILIARIA */}
          <button
            type="button"
            onClick={() => handleContinue('agency')}
            className={`group text-left p-4 sm:p-5 rounded-2xl border-2 transition-all flex flex-col justify-between ${
              selected === 'agency'
                ? 'border-indigo-600 bg-indigo-50/50 shadow-md ring-2 ring-indigo-500/20'
                : 'border-stone-200 bg-white hover:border-indigo-600 hover:bg-stone-50/80 shadow-2xs'
            }`}
            id="btn-choose-agency"
          >
            <div>
              <div className="w-11 h-11 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-3.5 group-hover:scale-105 transition-transform">
                <Briefcase className="w-5 h-5" />
              </div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-sm sm:text-base text-indigo-950">
                  {t.roleAgencyTitle}
                </h3>
                {selected === 'agency' && (
                  <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                )}
              </div>
              <p className="text-xs text-stone-600 leading-relaxed">
                {t.roleAgencyDesc}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs font-bold text-indigo-700">
              <span>{t.getStartedBtn}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

        </div>

        {/* Notice of exclusivity */}
        <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-center">
          <p className="text-[11px] text-stone-500 font-medium">
            🔒 <strong className="text-stone-700">{t.roleLockedNotice}</strong>
          </p>
        </div>

        {/* Admin Access quick entry */}
        <div className="mt-3 text-center">
          <button
            type="button"
            onClick={() => {
              onClose();
              onSelectRole('admin');
            }}
            className="text-xs font-bold text-indigo-700 hover:text-indigo-900 inline-flex items-center gap-1.5 transition-colors py-1.5 px-3 rounded-xl hover:bg-indigo-50 border border-indigo-100"
            id="btn-role-admin-direct"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
            <span>¿Acceso Administrativo? Entrar directamente como Administrador</span>
          </button>
        </div>

      </div>
    </div>
  );
};
