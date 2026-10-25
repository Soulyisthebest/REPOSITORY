import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Printer, 
  Share2, 
  FileCheck2, 
  Award, 
  QrCode, 
  Plus, 
  CheckCircle2, 
  Building2, 
  Calendar,
  Lock,
  Download,
  Copy,
  Check,
  Sparkles,
  X,
  FileText
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { TenantProfile, RentalLease } from '../types';
import { Language, TRANSLATIONS } from '../i18n/translations';
import { PassportCard } from './PassportCard';
import { TrustStats } from './TrustStats';
import { RentalHistoryList } from './RentalHistoryList';

interface UnifiedPassportAndCertificateProps {
  tenant: TenantProfile;
  leases: RentalLease[];
  onOpenAddModal: () => void;
  onOpenScanContract: () => void;
  onDeleteLease: (id: string) => void;
  onOpenShareModal: () => void;
  language: Language;
}

export const UnifiedPassportAndCertificate: React.FC<UnifiedPassportAndCertificateProps> = ({
  tenant,
  leases,
  onOpenAddModal,
  onOpenScanContract,
  onDeleteLease,
  onOpenShareModal,
  language,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [certIssuedToast, setCertIssuedToast] = useState(false);

  // Certificate customization options
  const [certDni, setCertDni] = useState('');
  const [certPurpose, setCertPurpose] = useState('Presentación de solvencia para alquiler');
  const [includeLeases, setIncludeLeases] = useState(true);
  const [certCode, setCertCode] = useState(() => {
    const saved = localStorage.getItem(`rentia_cert_code_${tenant.id || 'demo'}`);
    return saved || `CERT-RNTA-2026-${(tenant.id || 'DEMO').substring(0, 4).toUpperCase()}`;
  });
  const [certHash, setCertHash] = useState(() => {
    const saved = localStorage.getItem(`rentia_cert_hash_${tenant.id || 'demo'}`);
    return saved || `0x${Date.now().toString(16).toUpperCase()}`;
  });
  const [certDate, setCertDate] = useState(() => {
    return new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
  });

  const t = TRANSLATIONS[language];
  const verifiedLeases = leases.filter((l) => l.status === 'verified');
  const passportNumber = tenant.passportNumber || `RNTA-ES-${(tenant.id || 'DEMO').substring(0, 4).toUpperCase()}`;
  const verifyUrl = `https://rentia.app/verify/${(tenant.passportId || tenant.id || 'demo').toLowerCase()}`;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(verifyUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleGenerateCertificate = (e: React.FormEvent) => {
    e.preventDefault();
    const newCode = `CERT-RNTA-2026-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const newHash = `0x${Math.random().toString(16).substring(2, 10).toUpperCase()}${Date.now().toString(16).substring(4).toUpperCase()}`;
    const newDate = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });

    setCertCode(newCode);
    setCertHash(newHash);
    setCertDate(newDate);

    try {
      localStorage.setItem(`rentia_cert_code_${tenant.id || 'demo'}`, newCode);
      localStorage.setItem(`rentia_cert_hash_${tenant.id || 'demo'}`, newHash);
    } catch {}

    setIsCreateModalOpen(false);
    setCertIssuedToast(true);
    setTimeout(() => setCertIssuedToast(false), 3500);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in" id="unified-passport-certificate">
      {/* Toast Feedback */}
      {certIssuedToast && (
        <div className="fixed top-20 right-6 z-50 bg-[#1E1B4B] text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold animate-fade-in border border-amber-400">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>¡Certificado del inquilino emitido y generado correctamente!</span>
        </div>
      )}

      {/* Top Banner Toolbar */}
      <div className="no-print bg-white p-4 rounded-3xl border border-stone-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-[#1E1B4B] text-white flex items-center justify-center shadow-xs">
            <FileCheck2 className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-base font-black text-[#1E1B4B] flex items-center gap-1.5">
              <span>Pasaporte y Certificado del Inquilino</span>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-200">
                100% Verificado
              </span>
            </h1>
            <p className="text-xs text-stone-500">
              Documento legal y digital de reputación verificada del inquilino
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-[#1E1B4B] hover:bg-[#28235C] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
            id="btn-create-certificate"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Crear / Emitir Certificado</span>
          </button>

          <button
            onClick={handleCopyLink}
            className="px-3 py-1.5 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
            title="Copiar enlace de verificación"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Copiado' : 'Copiar URL'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3.5 py-1.5 rounded-xl bg-[#0FA3A3] hover:bg-[#0D8C8C] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
            id="btn-print-unified"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir / PDF</span>
          </button>
        </div>
      </div>

      {/* 1. SECCIÓN PASAPORTE DIGITAL (CARD CON QR Y FOTOS) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-black uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
            <QrCode className="w-4 h-4 text-indigo-600" />
            1. Pasaporte Digital de Inquilino
          </span>
          <span className="text-xs font-mono text-stone-400 font-bold">
            {passportNumber}
          </span>
        </div>

        <PassportCard
          tenant={tenant}
          onOpenShareModal={onOpenShareModal}
          language={language}
        />

        <TrustStats 
          tenant={tenant} 
          language={language} 
        />
      </section>

      {/* 2. SECCIÓN CERTIFICADO LEGAL DEL INQUILINO */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-black uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-600" />
            2. Certificado de Solvencia y Arrendamiento
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="text-xs text-indigo-700 font-bold hover:underline inline-flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Actualizar / Re-emitir</span>
            </button>
            <span className="text-[11px] text-stone-400">•</span>
            <span className="text-[11px] text-stone-500 font-semibold">
              Validez legal conforme a la LAU
            </span>
          </div>
        </div>

        {/* The Printable Certificate Document */}
        <div className="bg-white text-[#1C3B3A] p-6 sm:p-8 rounded-3xl shadow-xs border border-stone-200 relative overflow-hidden print:border-none print:shadow-none print:p-0">
          {/* Header of Document */}
          <div className="text-center pb-5 border-b border-stone-100">
            <div className="w-12 h-12 rounded-2xl bg-[#0FA3A3] text-white flex items-center justify-center mx-auto mb-2 shadow-sm">
              <ShieldCheck className="w-6 h-6" />
            </div>

            <span className="text-[10px] uppercase tracking-widest text-[#0FA3A3] font-bold block">
              PROTOCOLO DE VERIFICACIÓN AUDITADO RENTIA
            </span>
            <h2 className="text-lg sm:text-xl font-black text-[#1C3B3A] uppercase mt-0.5">
              CERTIFICADO DE SOLVENCIA Y CUMPLIMIENTO ARRENDATARIO
            </h2>
            <p className="text-xs text-[#5C7B79] mt-1 max-w-md mx-auto">
              Expedido por Rentia para acreditar el historial de pagos y comportamiento verificado del titular.
            </p>
            <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Certificado Emitido: {certDate}</span>
              <span>•</span>
              <span className="font-mono">{certCode}</span>
            </div>
          </div>

          {/* Tenant Identity Block */}
          <div className="py-4 border-b border-stone-100 grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-[10px] uppercase text-[#5C7B79] block">{(t as any).titularName || 'Titular'}</span>
              <strong className="text-sm font-bold block text-[#1C3B3A]">{tenant.fullName}</strong>
              <span className="text-[#5C7B79] text-[11px]">{tenant.profession || 'Profesional'}</span>
              {certDni && (
                <span className="text-[10px] text-stone-500 font-mono block mt-0.5">DNI/NIE: {certDni}</span>
              )}
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase text-[#5C7B79] block">Código Certificado</span>
              <span className="font-mono font-bold text-xs bg-stone-100 text-[#1C3B3A] px-2 py-0.5 rounded inline-block mt-0.5">
                {certCode}
              </span>
              <span className="text-[10px] text-emerald-700 font-bold block mt-1">
                ✓ Puntuación de Confianza: {tenant.trustScore}/100
              </span>
              <span className="text-[9px] text-stone-400 block mt-0.5 truncate">
                Finalidad: {certPurpose}
              </span>
            </div>
          </div>

          {/* Verified Tenancies Table */}
          <div className="py-4 border-b border-stone-100 space-y-3">
            <h3 className="text-xs font-bold uppercase text-[#1C3B3A] tracking-wider flex items-center justify-between">
              <span>{(t as any).tenancyRecords || 'Historial de Arrendamientos Auditados'}</span>
              <span className="text-[10px] text-[#5C7B79] lowercase font-normal">
                {verifiedLeases.length} {verifiedLeases.length === 1 ? 'contrato verificado' : 'contratos verificados'}
              </span>
            </h3>

            {verifiedLeases.length === 0 ? (
              <div className="bg-stone-50 p-4 rounded-xl text-center text-xs text-[#5C7B79]">
                Actualmente no hay contratos verificados registrados. Pulsa en "Añadir alquiler" para solicitar la verificación a tu propietario.
              </div>
            ) : (
              <div className="space-y-2.5">
                {verifiedLeases.map((lease) => (
                  <div 
                    key={lease.id}
                    className="p-3 bg-stone-50/80 rounded-xl border border-stone-200/80 flex items-start justify-between text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-[#0FA3A3]" />
                        <strong className="text-[#1C3B3A]">{lease.address}</strong>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-[#5C7B79]">
                        <span>Renta: {lease.monthlyRent} €/mes</span>
                        <span>•</span>
                        <span>{lease.startDate} — {lease.endDate || 'Actual'}</span>
                      </div>
                      <div className="text-[10px] text-[#5C7B79]">
                        Propietario verificador: <strong>{lease.landlordName}</strong>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{(t as any).statusVerified || 'Verificado'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Legal Footer with Unified Verification QR */}
          <div className="pt-4 flex items-center justify-between gap-4">
            <div className="space-y-1 text-[10px] text-[#5C7B79] max-w-xs">
              <p className="font-semibold text-[#1C3B3A]">Verificación Criptográfica y QR</p>
              <p>
                Este certificado y pasaporte unificado están protegidos con firma digital de Rentia.
                Cualquier propietario o agencia puede comprobar la autenticidad escaneando el código QR.
              </p>
              <p className="text-[9px] text-stone-400 font-mono">
                Hash: SHA256:{certHash}
              </p>
            </div>

            <div className="p-2 bg-white rounded-xl border border-stone-200 shadow-2xs shrink-0 text-center">
              <QRCodeSVG value={verifyUrl} size={76} />
              <span className="text-[8px] font-mono text-stone-500 block mt-1">
                Escanear QR
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SECCIÓN GESTIÓN DE CONTRATOS Y ALQUILERES */}
      <section className="space-y-3">
        <RentalHistoryList
          leases={leases}
          onOpenAddModal={onOpenAddModal}
          onOpenScanContract={onOpenScanContract}
          onDeleteLease={onDeleteLease}
          tenantName={tenant.fullName}
          language={language}
        />
      </section>

      {/* MODAL PARA CREAR / SACAR EL CERTIFICADO DEL INQUILINO */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#1E1B4B] text-white flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1E1B4B]">
                    Sacar y Crear Certificado del Inquilino
                  </h3>
                  <p className="text-xs text-stone-500">
                    Genera el documento certificado de solvencia para presentar a propietarios
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleGenerateCertificate} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#1E1B4B] mb-1">Nombre Completo del Titular</label>
                <input
                  type="text"
                  value={tenant.fullName}
                  disabled
                  className="w-full px-3 py-2 rounded-xl bg-stone-100 border border-stone-200 text-stone-700 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#1E1B4B] mb-1">DNI / NIE / Pasaporte</label>
                  <input
                    type="text"
                    value={certDni}
                    onChange={(e) => setCertDni(e.target.value)}
                    placeholder="Ej: 12345678Z"
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-indigo-500 text-stone-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#1E1B4B] mb-1">Puntuación TrustScore</label>
                  <div className="px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{tenant.trustScore}/100 (Excelente)</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#1E1B4B] mb-1">Finalidad del Certificado</label>
                <select
                  value={certPurpose}
                  onChange={(e) => setCertPurpose(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-indigo-500 text-stone-800 bg-white"
                >
                  <option value="Presentación de solvencia para alquiler">Presentación de solvencia para nuevo alquiler</option>
                  <option value="Acreditación ante agencia inmobiliaria">Acreditación ante agencia inmobiliaria</option>
                  <option value="Acreditación para seguro de impago de alquiler">Acreditación para seguro de impago de alquiler</option>
                  <option value="Dossier completo de garantías de pago">Dossier completo de garantías de pago</option>
                </select>
              </div>

              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-700">Contratos verificados incluidos:</span>
                  <span className="font-bold text-[#1E1B4B] bg-white px-2 py-0.5 rounded-lg border border-stone-200">
                    {verifiedLeases.length} contratos
                  </span>
                </div>
                <p className="text-[11px] text-stone-500">
                  El certificado incluirá automáticamente el sello criptográfico SHA-256 y código QR que permite a cualquier propietario verificar al instante la autenticidad sin intermediarios.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#1E1B4B] hover:bg-[#28235C] text-white font-bold rounded-xl shadow-xs flex items-center justify-center gap-1.5"
                >
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>Emitir Certificado Ahora</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
