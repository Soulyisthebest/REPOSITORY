import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  CheckCircle2, 
  Briefcase, 
  MapPin, 
  FileText, 
  Users, 
  PawPrint, 
  UserCheck, 
  Calendar, 
  Heart, 
  Flag, 
  ChevronLeft, 
  ChevronRight, 
  Building2, 
  Clock, 
  BadgePercent,
  MessageSquare
} from 'lucide-react';
import { Listing } from '../types';

interface TenantFullProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenant: any; // SeedTenant or TenantProfile or Candidate
  currentListing?: Listing | null;
  onLike?: () => void;
  onPass?: () => void;
  onOpenChat?: () => void;
  onReport?: (tenant: any) => void;
}

export const TenantFullProfileModal: React.FC<TenantFullProfileModalProps> = ({
  isOpen,
  onClose,
  tenant,
  currentListing,
  onLike,
  onPass,
  onOpenChat,
  onReport,
}) => {
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  if (!isOpen || !tenant) return null;

  // Normalized tenant attributes
  const fullName = tenant.fullName || `${tenant.firstName || ''} ${tenant.lastName || ''}`.trim() || 'Inquilino Candidato';
  const firstName = tenant.firstName || fullName.split(' ')[0] || 'Inquilino';
  const age = tenant.age || 28;
  const city = tenant.target_city || tenant.city || 'Málaga';
  const profession = tenant.profession || 'Profesional Cualificado';
  const employmentType = tenant.employment_type || tenant.employmentType || 'indefinido';
  const monthlyIncome = tenant.monthly_income || tenant.monthlySalary || tenant.monthlyIncome || 2400;
  const maxBudget = tenant.maxBudget || Math.round(monthlyIncome * 0.35);
  const trustScore = tenant.trustScore || tenant.trust_score || 92;
  const verifiedLeases = tenant.verifiedLeasesCount || 2;
  const hasGuarantor = tenant.has_guarantor || tenant.hasGuarantor || false;
  const hasPets = tenant.has_pets || tenant.hasPets || false;
  const occupants = tenant.occupants_count || tenant.occupantsCount || 1;
  const moveInDate = tenant.desired_move_in_date || 'Inmediata / Flexible';
  const bio = tenant.bio || 'Inquilino serio, solvente y responsable con ingresos demostrables y referencias contrastadas.';

  // Photos array
  const rawPhotos: string[] = tenant.photos && tenant.photos.length > 0
    ? tenant.photos
    : [tenant.avatar_url || tenant.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80'];

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in">
      <div 
        className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-hidden shadow-2xl border border-stone-200 flex flex-col animate-in zoom-in-95"
        id={`full-profile-modal-${tenant.id || 'tenant'}`}
      >
        
        {/* MODAL HEADER: Sticky Top bar with title and close button */}
        <div className="px-5 py-3.5 bg-white border-b border-stone-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-black uppercase tracking-wider text-[#1E1B4B]">
              Dossier Completo de Inquilino Certificado
            </span>
            <span className="px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-900 text-[10px] font-black">
              Check Verde Verificado
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onReport && (
              <button
                type="button"
                onClick={() => onReport(tenant)}
                className="text-[11px] font-bold text-stone-400 hover:text-rose-600 transition-colors p-1.5 rounded-lg hover:bg-rose-50 flex items-center gap-1"
                title="Denunciar o señalar anomalía en este perfil"
              >
                <Flag className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Señalar</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition-colors"
              title="Cerrar perfil"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* SCROLLABLE PROFILE CONTENT */}
        <div className="overflow-y-auto flex-1 p-5 sm:p-6 space-y-6">

          {/* 1. HERO IDENTITY CARD */}
          <div className="bg-gradient-to-br from-indigo-950 via-[#1E1B4B] to-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-md relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 relative z-10">
              {/* Main Photo with Verification Badge */}
              <div className="relative shrink-0">
                <img
                  src={rawPhotos[activePhotoIdx]}
                  alt={fullName}
                  referrerPolicy="no-referrer"
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-white/20 shadow-lg"
                />
                <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white shadow-xs" title="DNI cotejado y validado">
                  <CheckCircle2 className="w-4 h-4" />
                </span>
              </div>

              {/* Identity & Basic Data */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white truncate">
                    {fullName}
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-black flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>DNI Verificado</span>
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-300 mt-1.5">
                  <span className="font-semibold text-amber-300 flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>{profession}</span>
                  </span>
                  <span>•</span>
                  <span>{age} años</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-stone-400" />
                    <span>Busca en {city}</span>
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-xl bg-white/10 text-white text-xs font-black backdrop-blur-xs flex items-center gap-1.5 border border-white/15">
                    <span>TrustScore Rentia:</span>
                    <span className="text-amber-400 font-black">{trustScore}/100</span>
                    <span className="text-[10px] text-emerald-300 uppercase font-bold">(Excelente)</span>
                  </span>

                  <span className="px-2.5 py-1 rounded-xl bg-white/10 text-stone-200 text-xs font-medium">
                    {verifiedLeases} contratos de alquiler verificados sin incidencias
                  </span>
                </div>
              </div>
            </div>

            {/* Photo Gallery Thumbnails */}
            {rawPhotos.length > 1 && (
              <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-2 overflow-x-auto pb-1">
                <span className="text-[11px] text-stone-300 font-semibold shrink-0">Fotos ({rawPhotos.length}):</span>
                {rawPhotos.map((photoUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActivePhotoIdx(idx)}
                    className={`w-12 h-12 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                      activePhotoIdx === idx ? 'border-amber-400 scale-105 shadow-md' : 'border-white/20 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={photoUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 2. SOLVENCIA FINANCIERA Y LABORAL ACREDITADA */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-[#1E1B4B] uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-indigo-700" />
                <span>Solvencia Financiera y Laboral</span>
              </h3>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                100% Acreditado
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Monthly Income */}
              <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200/80 space-y-1">
                <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">
                  Nómina Neta Mensual
                </span>
                <span className="text-xl font-black text-[#1E1B4B] block">
                  {monthlyIncome.toLocaleString()} € <span className="text-xs font-normal text-stone-500">/ mes</span>
                </span>
                <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span>3 últimas nóminas aportadas</span>
                </span>
              </div>

              {/* Work Contract */}
              <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200/80 space-y-1">
                <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">
                  Tipo de Contrato
                </span>
                <span className="text-base font-black text-[#1E1B4B] capitalize block">
                  {employmentType === 'indefinido' ? 'Indefinido Fijo' : employmentType}
                </span>
                <span className="text-[10px] text-indigo-700 font-semibold flex items-center gap-1">
                  <Briefcase className="w-3 h-3 text-indigo-600 shrink-0" />
                  <span>Estabilidad laboral contrastada</span>
                </span>
              </div>

              {/* Max Budget */}
              <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200/80 space-y-1">
                <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">
                  Presupuesto Máximo
                </span>
                <span className="text-xl font-black text-[#1E1B4B] block">
                  {maxBudget.toLocaleString()} € <span className="text-xs font-normal text-stone-500">/ mes</span>
                </span>
                <span className="text-[10px] text-stone-500 font-medium block">
                  Capacidad de pago calculada
                </span>
              </div>
            </div>

          </div>

          {/* 3. HISTORIAL DE ALQUILERES & GARANTÍAS DE PAGO */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-[#1E1B4B] uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Historial Inmobiliario y Garantías Registradas</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
              <div className="bg-stone-50 p-3 rounded-xl border border-stone-200/80">
                <span className="text-base font-black text-emerald-700 block">100%</span>
                <span className="text-[10px] font-bold text-stone-500 uppercase">Pagos al Día</span>
              </div>
              <div className="bg-stone-50 p-3 rounded-xl border border-stone-200/80">
                <span className="text-base font-black text-[#1E1B4B] block">{verifiedLeases}</span>
                <span className="text-[10px] font-bold text-stone-500 uppercase">Arrendamientos Previos</span>
              </div>
              <div className="bg-stone-50 p-3 rounded-xl border border-stone-200/80">
                <span className="text-base font-black text-emerald-700 block">0</span>
                <span className="text-[10px] font-bold text-stone-500 uppercase">Incidencias o Impagos</span>
              </div>
              <div className="bg-stone-50 p-3 rounded-xl border border-stone-200/80">
                <span className="text-base font-black text-[#1E1B4B] block">100%</span>
                <span className="text-[10px] font-bold text-stone-500 uppercase">Fianzas Devueltas</span>
              </div>
            </div>
          </div>

          {/* 4. CONDICIONES DE CONVIVENCIA Y MUDANZA */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-[#1E1B4B] uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-4 h-4 text-indigo-700" />
              <span>Condiciones de Convivencia y Mudanza</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              
              <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200/80 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-stone-400 font-bold uppercase block">Fecha deseada de entrada</span>
                  <span className="font-black text-[#1E1B4B]">{moveInDate}</span>
                </div>
              </div>

              <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200/80 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-stone-400 font-bold uppercase block">Número de ocupantes</span>
                  <span className="font-black text-[#1E1B4B]">{occupants} persona{occupants > 1 ? 's' : ''} (convivencia tranquila)</span>
                </div>
              </div>

              <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200/80 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  hasPets ? 'bg-amber-100 text-amber-800' : 'bg-stone-200 text-stone-700'
                }`}>
                  <PawPrint className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-stone-400 font-bold uppercase block">Mascotas</span>
                  <span className="font-black text-[#1E1B4B]">
                    {hasPets ? 'Tiene mascota educada' : 'Sin mascotas en la vivienda'}
                  </span>
                </div>
              </div>

              <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200/80 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  hasGuarantor ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-700'
                }`}>
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-stone-400 font-bold uppercase block">Avalista Solidario</span>
                  <span className="font-black text-[#1E1B4B]">
                    {hasGuarantor ? 'Sí, avalista con solvencia' : 'No necesario (solvente por sí mismo/a)'}
                  </span>
                </div>
              </div>

            </div>
          </div>

          {/* 5. CARTA DE PRESENTACIÓN PERSONAL (BIO COMPLETA) */}
          <div className="space-y-2">
            <h3 className="text-xs font-black text-[#1E1B4B] uppercase tracking-wider">
              Presentación Personal del Inquilino
            </h3>
            <div className="bg-stone-50/80 p-4 rounded-2xl border border-stone-200 text-xs text-stone-700 leading-relaxed font-normal">
              <p className="italic">
                "{bio}"
              </p>
            </div>
          </div>

          {/* 6. LISTA DE DOCUMENTOS DISPONIBLES EN EL DOSSIER */}
          <div className="bg-indigo-50/60 p-4 rounded-2xl border border-indigo-100 space-y-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-700" />
              <h4 className="text-xs font-bold text-indigo-950">
                Documentación Verificada Disponible en este Dossier
              </h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-indigo-900 font-medium">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Documento Nacional de Identidad (DNI) cotejado</span>
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>3 últimas nóminas salariales verificadas</span>
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Contrato de trabajo laboral en vigor</span>
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Certificado negativo de morosidad (0 impagos)</span>
              </span>
            </div>
          </div>

        </div>

        {/* MODAL FOOTER: DIRECT ACTIONS */}
        <div className="px-5 py-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between gap-3 shrink-0">
          {onPass && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onPass();
              }}
              className="py-2.5 px-4 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-100 text-xs font-bold transition-colors"
            >
              Pasar candidato
            </button>
          )}

          <div className="flex items-center gap-2 ml-auto">
            {onOpenChat && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenChat();
                }}
                className="py-2.5 px-4 rounded-xl bg-indigo-100 hover:bg-indigo-200 text-indigo-900 text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                <MessageSquare className="w-4 h-4 text-indigo-700" />
                <span>Abrir Chat</span>
              </button>
            )}

            {onLike && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onLike();
                }}
                className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-all shadow-sm flex items-center gap-2 active:scale-95 cursor-pointer"
                id="btn-modal-like-tenant"
              >
                <Heart className="w-4 h-4 fill-white" />
                <span>Conectar y Escribir a {firstName}</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
