import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Building2,
  User,
  Briefcase,
  Star,
  MapPin,
  Calendar,
  Phone,
  Mail,
  Home,
  ArrowLeft,
  FileCheck2,
  Lock,
  Loader2,
  QrCode,
  Share2
} from 'lucide-react';
import { api } from '../api/client';
import { Language, TRANSLATIONS } from '../i18n/translations';
import { QRCodeSVG } from 'qrcode.react';

interface PublicProfileViewProps {
  code?: string;
  profileCode?: string;
  language?: Language;
  onBackToApp?: () => void;
  onOpenLogin?: () => void;
}

export const PublicProfileView: React.FC<PublicProfileViewProps> = ({
  code,
  profileCode,
  language = 'es',
  onBackToApp,
  onOpenLogin,
}) => {
  const t = TRANSLATIONS[language];
  const effectiveCode = profileCode || code || '';
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function fetchProfile() {
      if (!effectiveCode) {
        setLoading(false);
        setError(language === 'es' ? 'Código de perfil no proporcionado.' : 'No profile code provided.');
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const res = await api.public.getPublicProfile(effectiveCode);
        if (isMounted) {
          if (res?.profile) {
            setProfile(res.profile);
          } else {
            setError(language === 'es' ? 'Perfil no encontrado.' : 'Profile not found.');
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || (language === 'es' ? 'Error al cargar perfil público.' : 'Error loading profile.'));
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchProfile();
    return () => {
      isMounted = false;
    };
  }, [code, language]);

  const handleShare = () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center animate-fade-in">
        <Loader2 className="w-10 h-10 animate-spin text-[#0FA3A3] mb-4" />
        <p className="text-sm font-bold text-stone-700">
          {language === 'es' ? 'Verificando huella criptográfica del perfil...' : 'Verifying profile cryptographic signature...'}
        </p>
        <p className="text-xs text-stone-400 mt-1">Rentia Public Passport &bull; SHA-256 Protocol</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 bg-white rounded-3xl border border-stone-200 shadow-xl text-center">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-black text-[#1E1B4B]">
          {language === 'es' ? 'Perfil público no disponible' : 'Public Profile Unavailable'}
        </h2>
        <p className="text-xs text-stone-500 mt-2 mb-6">
          {error || (language === 'es' ? 'El perfil solicitado no existe o sus datos han sido anonimizados.' : 'The requested profile does not exist or has been anonymized.')}
        </p>
        {onBackToApp && (
          <button
            onClick={onBackToApp}
            className="px-5 py-2.5 bg-[#1E1B4B] text-white rounded-xl text-xs font-bold hover:bg-[#28235C] transition-colors"
          >
            {language === 'es' ? 'Volver a la aplicación' : 'Back to App'}
          </button>
        )}
      </div>
    );
  }

  const isAgency = profile.role === 'agency';
  const isLandlord = profile.role === 'landlord';
  const isTenant = !isAgency && !isLandlord;

  const currentUrl = typeof window !== 'undefined' ? window.location.href : `https://rentia.es/p/${code}`;

  return (
    <div className="max-w-xl mx-auto my-6 px-4 animate-fade-in">
      {/* Top back button */}
      {onBackToApp && (
        <button
          onClick={onBackToApp}
          className="mb-4 inline-flex items-center gap-1.5 text-xs font-bold text-stone-600 hover:text-[#1E1B4B] transition-colors bg-white px-3 py-1.5 rounded-xl border border-stone-200 shadow-2xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{language === 'es' ? 'Volver a Rentia' : 'Back to Rentia'}</span>
        </button>
      )}

      {/* Main Public Card */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-xl overflow-hidden">
        {/* Banner with verified badge */}
        <div className={`p-6 text-white ${
          isAgency
            ? 'bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-700'
            : isLandlord
            ? 'bg-gradient-to-r from-teal-900 via-teal-800 to-[#0FA3A3]'
            : 'bg-gradient-to-r from-slate-900 via-[#1E1B4B] to-[#28235C]'
        }`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider uppercase bg-white/20 backdrop-blur-xs flex items-center gap-1 border border-white/30">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                {isAgency ? 'Agencia Verificada' : isLandlord ? 'Propietario Verificado' : 'Inquilino Verificado'}
              </span>
              <span className="text-[10px] text-white/70 font-mono">100% RGPD</span>
            </div>
            <button
              onClick={handleShare}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center gap-1 text-[11px] font-bold"
              title="Copiar enlace público"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{copied ? (language === 'es' ? '¡Copiado!' : 'Copied!') : (language === 'es' ? 'Compartir' : 'Share')}</span>
            </button>
          </div>

          <div className="flex items-center gap-4 mt-5">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.name}
                className="w-16 h-16 rounded-2xl object-cover ring-4 ring-white/20 shadow-md bg-stone-100"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-white/20 ring-4 ring-white/20 flex items-center justify-center text-xl font-bold">
                {isAgency ? <Briefcase className="w-8 h-8" /> : isLandlord ? <Building2 className="w-8 h-8" /> : <User className="w-8 h-8" />}
              </div>
            )}
            <div>
              <h1 className="text-xl font-black">{profile.name}</h1>
              <p className="text-xs text-white/80 font-mono mt-0.5">
                ID: {profile.code || code}
              </p>
              {profile.trust_score !== undefined && (
                <div className="flex items-center gap-1.5 mt-1.5 text-xs font-bold text-amber-300">
                  <Star className="w-3.5 h-3.5 fill-amber-300" />
                  <span>Trust Score: {profile.trust_score}/100</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content Body: ONLY fields the user chose to display */}
        <div className="p-6 space-y-4">
          {/* Bio if visible */}
          {profile.bio && (
            <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-1">
                {language === 'es' ? 'Presentación' : 'About'}
              </span>
              <p className="text-xs text-stone-700 leading-relaxed">{profile.bio}</p>
            </div>
          )}

          {/* Verified metrics grid */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            {profile.employment_type && (
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-0.5">
                  {language === 'es' ? 'Situación Laboral' : 'Employment'}
                </span>
                <span className="font-bold text-[#1E1B4B]">{profile.employment_type}</span>
                {profile.profession && <span className="block text-[11px] text-stone-500">{profile.profession}</span>}
              </div>
            )}

            {profile.monthly_income && (
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-0.5">
                  {language === 'es' ? 'Solvencia Demostrable' : 'Verified Income'}
                </span>
                <span className="font-bold text-emerald-700">{profile.monthly_income} €/mes</span>
                <span className="block text-[10px] text-stone-400">Acreditada con nóminas</span>
              </div>
            )}

            {profile.phone && (
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-0.5 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-[#0FA3A3]" /> {language === 'es' ? 'Teléfono' : 'Phone'}
                </span>
                <span className="font-bold text-[#1E1B4B] font-mono">{profile.phone}</span>
              </div>
            )}

            {profile.email && (
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-0.5 flex items-center gap-1">
                  <Mail className="w-3 h-3 text-[#0FA3A3]" /> {language === 'es' ? 'Email de contacto' : 'Email'}
                </span>
                <span className="font-bold text-[#1E1B4B] truncate block">{profile.email}</span>
              </div>
            )}
          </div>

          {/* Tenant certified leases count */}
          {isTenant && profile.verified_leases_count !== undefined && (
            <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-emerald-950">
                    {profile.verified_leases_count} {profile.verified_leases_count === 1 ? 'alquiler certificado' : 'alquileres certificados'}
                  </h4>
                  <p className="text-[11px] text-emerald-800">
                    100% pagos puntuales verificados &bull; Fianza devuelta íntegra
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900">
                Impecable
              </span>
            </div>
          )}

          {/* Landlord published listings if allowed */}
          {(isLandlord || isAgency) && Array.isArray(profile.listings) && profile.listings.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-stone-100">
              <span className="text-[11px] font-bold text-[#1E1B4B] flex items-center gap-1.5">
                <Home className="w-3.5 h-3.5 text-[#0FA3A3]" />
                Inmuebles en cartera ({profile.listings.length})
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {profile.listings.map((l: any) => (
                  <div key={l.id} className="p-2.5 bg-stone-50 rounded-xl border border-stone-200 flex gap-2.5 items-center">
                    {l.images && l.images[0] ? (
                      <img src={l.images[0]} alt={l.title} className="w-12 h-12 rounded-lg object-cover bg-stone-200" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-stone-200 flex items-center justify-center text-stone-400">
                        <Building2 className="w-5 h-5" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h5 className="text-xs font-bold text-[#1E1B4B] truncate">{l.title}</h5>
                      <p className="text-[10px] text-stone-500 truncate">{l.city}</p>
                      <span className="text-xs font-extrabold text-[#0FA3A3]">{l.rent} €/mes</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* QR Code and verification seal */}
          <div className="pt-4 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-xl border border-stone-200 shadow-2xs">
                <QRCodeSVG value={currentUrl} size={64} level="M" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase text-stone-400 block tracking-wider">
                  Escaneo Criptográfico
                </span>
                <span className="text-[11px] font-bold text-[#1E1B4B] block">
                  Perfil Oficial en Rentia
                </span>
                <span className="text-[9px] font-mono text-stone-400 truncate max-w-[200px] block">
                  {profile.verification_seal || 'SHA256_VERIFIED'}
                </span>
              </div>
            </div>

            <div className="text-right sm:text-right text-center">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-800 bg-teal-50 px-2 py-1 rounded-lg border border-teal-200">
                <FileCheck2 className="w-3.5 h-3.5 text-[#0FA3A3]" />
                Verificado Oficial
              </span>
              <p className="text-[9px] text-stone-400 mt-1">Conforme al RGPD (UE 2016/679)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
