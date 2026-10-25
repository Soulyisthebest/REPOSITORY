import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  UserX, 
  Building, 
  FileText, 
  ExternalLink, 
  Eye, 
  Loader2, 
  RefreshCw, 
  Search, 
  Filter,
  Check,
  Ban,
  UserCheck,
  Camera
} from 'lucide-react';
import { api } from '../../api/client';
import { ReportItem, KycVerificationItem } from '../../types';

interface AdminReportsAndKycProps {
  initialSubTab?: 'reports' | 'kyc';
}

export const AdminReportsAndKyc: React.FC<AdminReportsAndKycProps> = ({
  initialSubTab = 'reports',
}) => {
  const [subTab, setSubTab] = useState<'reports' | 'kyc'>(initialSubTab);
  
  // Reports state
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [reportsFilter, setReportsFilter] = useState<'all' | 'pending' | 'resolved' | 'dismissed'>('all');
  const [reportsLoading, setReportsLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);

  // KYC state
  const [kycList, setKycList] = useState<KycVerificationItem[]>([]);
  const [kycFilter, setKycFilter] = useState<'all' | 'pending_admin' | 'verified' | 'rejected'>('all');
  const [kycLoading, setKycLoading] = useState(false);
  const [selectedKyc, setSelectedKyc] = useState<KycVerificationItem | null>(null);
  const [rejectionNotes, setRejectionNotes] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  // General state
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const fetchReports = async () => {
    setReportsLoading(true);
    try {
      const res = await api.reports.getReports(reportsFilter === 'all' ? undefined : reportsFilter);
      setReports(res.reports || []);
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setReportsLoading(false);
    }
  };

  const fetchKycList = async () => {
    setKycLoading(true);
    try {
      const res = await api.kyc.getAdminList(kycFilter === 'all' ? undefined : kycFilter);
      setKycList(res.list || []);
    } catch (err) {
      console.error('Error fetching KYC list:', err);
    } finally {
      setKycLoading(false);
    }
  };

  useEffect(() => {
    if (subTab === 'reports') {
      fetchReports();
    } else {
      fetchKycList();
    }
  }, [subTab, reportsFilter, kycFilter]);

  const handleResolveReport = async (
    reportId: string,
    action: 'listing_removed' | 'user_blocked' | 'warning_issued' | 'dismissed',
    notes?: string
  ) => {
    setActionLoading(`report-${reportId}`);
    try {
      const apiAction = action === 'warning_issued' ? 'dismissed' : action;
      await api.reports.takeAction(reportId, apiAction, notes, 'Admin');
      setSuccessMsg(
        action === 'user_blocked' 
          ? 'Cuenta de usuario bloqueada con éxito.' 
          : action === 'listing_removed'
          ? 'Anuncio retirado y bloqueado.'
          : 'Denuncia actualizada.'
      );
      setTimeout(() => setSuccessMsg(null), 4000);
      await fetchReports();
      setSelectedReport(null);
    } catch (err: any) {
      alert(`Error al procesar denuncia: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReviewKyc = async (
    kycId: string,
    decision: 'approved' | 'rejected',
    notes?: string
  ) => {
    setActionLoading(`kyc-${kycId}`);
    try {
      await api.kyc.review(
        kycId,
        decision === 'approved' ? 'verified' : 'rejected',
        notes,
        'Admin'
      );
      setSuccessMsg(
        decision === 'approved'
          ? '¡Cuenta validada! Se ha otorgado el Check Verde verificado.'
          : 'Verificación rechazada.'
      );
      setTimeout(() => setSuccessMsg(null), 4000);
      setShowRejectModal(false);
      setRejectionNotes('');
      await fetchKycList();
      setSelectedKyc(null);
    } catch (err: any) {
      alert(`Error al revisar KYC: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub Tabs Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSubTab('reports')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              subTab === 'reports'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-stone-50 text-stone-700 hover:bg-stone-100 border border-stone-200'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Denuncias y Seguridad ({reports.filter(r => r.status === 'pending').length} pendientes)</span>
          </button>

          <button
            onClick={() => setSubTab('kyc')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              subTab === 'kyc'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-stone-50 text-stone-700 hover:bg-stone-100 border border-stone-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Verificaciones DNI & Check Verde ({kycList.filter(k => (k.status as string) === 'pending' || (k.status as string) === 'pending_admin').length} pendientes)</span>
          </button>
        </div>

        <button
          onClick={() => subTab === 'reports' ? fetchReports() : fetchKycList()}
          className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold flex items-center gap-1.5 self-end sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Actualizar</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-3 text-xs font-bold animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 1: REPORTS / DENUNCIAS */}
      {/* ========================================================================= */}
      {subTab === 'reports' && (
        <div className="space-y-4">
          {/* Filters row */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-stone-200">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-stone-500">Filtrar por estado:</span>
              {(['all', 'pending', 'resolved', 'dismissed'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setReportsFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                    reportsFilter === st
                      ? 'bg-rose-100 text-rose-800 font-bold border border-rose-200'
                      : 'text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  {st === 'all' ? 'Todas' : st === 'pending' ? 'Pendientes' : st === 'resolved' ? 'Resueltas' : 'Desestimadas'}
                </button>
              ))}
            </div>
            <div className="text-xs text-stone-600 font-medium">
              Total denuncias: <strong>{reports.length}</strong>
            </div>
          </div>

          {reportsLoading ? (
            <div className="py-12 text-center bg-white rounded-2xl border border-stone-200">
              <Loader2 className="w-8 h-8 animate-spin text-rose-600 mx-auto mb-2" />
              <p className="text-xs text-stone-600">Cargando denuncias de usuarios...</p>
            </div>
          ) : reports.length === 0 ? (
            <div className="py-12 text-center bg-white rounded-2xl border border-stone-200 space-y-2">
              <ShieldCheck className="w-12 h-12 text-emerald-600 mx-auto" />
              <h4 className="text-base font-bold text-stone-900">No hay denuncias activas</h4>
              <p className="text-xs text-stone-600">
                La plataforma está limpia. Cuando un usuario reporte una estafa o perfil falso, aparecerá aquí.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className={`p-4 bg-white rounded-2xl border transition-all ${
                    report.status === 'pending'
                      ? 'border-rose-200 shadow-xs hover:border-rose-300'
                      : 'border-stone-200 opacity-90'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          report.status === 'pending'
                            ? 'bg-rose-100 text-rose-800'
                            : (report.status === 'action_taken' || (report.status as string) === 'resolved')
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-stone-100 text-stone-700'
                        }`}>
                          {report.status === 'pending' ? '⚠️ Pendiente de revisión' : (report.status === 'action_taken' || (report.status as string) === 'resolved') ? '✓ Resuelta' : 'Desestimada'}
                        </span>

                        <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 text-[11px] font-semibold">
                          {report.target_type === 'listing' ? 'Anuncio Inmueble' : 'Perfil de Usuario'}
                        </span>

                        <span className="text-[11px] text-stone-600">
                          {new Date(report.created_at).toLocaleString('es-ES')}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-stone-900 truncate">
                        {report.target_title || `Elemento denunciado #${report.target_id.substring(0, 8)}`}
                      </h4>

                      <div className="p-2.5 bg-stone-50 rounded-xl text-xs text-stone-700 border border-stone-200/60">
                        <div className="font-semibold text-rose-800 mb-0.5">
                          Motivo: {report.reason_label || report.reason}
                        </div>
                        <p className="text-stone-600 leading-relaxed italic">
                          "{report.details}"
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-4 text-[11px] text-stone-600 pt-1">
                        {report.reporter_name && (
                          <span>Denunciante: <strong>{report.reporter_name}</strong> ({report.reporter_email || 'Sin email'})</span>
                        )}
                        {report.target_user_name && (
                          <span className="text-rose-700">Usuario señalado: <strong>{report.target_user_name}</strong></span>
                        )}
                        {report.evidence_url && (
                          <a
                            href={report.evidence_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:underline flex items-center gap-1 font-semibold"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Ver prueba adjunta</span>
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Action buttons for admin */}
                    {report.status === 'pending' && (
                      <div className="flex flex-row md:flex-col items-stretch gap-1.5 shrink-0 pt-2 md:pt-0">
                        <button
                          onClick={() => handleResolveReport(report.id, 'user_blocked')}
                          disabled={actionLoading === `report-${report.id}`}
                          className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
                          title="Bloquear la cuenta del usuario señalado"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          <span>Bloquear Cuenta</span>
                        </button>

                        {report.target_type === 'listing' && (
                          <button
                            onClick={() => handleResolveReport(report.id, 'listing_removed')}
                            disabled={actionLoading === `report-${report.id}`}
                            className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
                            title="Retirar y bloquear este anuncio fraudulento"
                          >
                            <Building className="w-3.5 h-3.5" />
                            <span>Retirar Anuncio</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleResolveReport(report.id, 'dismissed')}
                          disabled={actionLoading === `report-${report.id}`}
                          className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-xl text-xs font-medium transition-all"
                        >
                          Desestimar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 2: KYC VERIFICATIONS (DNI + SELFIE) */}
      {/* ========================================================================= */}
      {subTab === 'kyc' && (
        <div className="space-y-4">
          {/* Filters row */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-stone-200">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-stone-500">Filtrar por estado:</span>
              {(['all', 'pending_admin', 'verified', 'rejected'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setKycFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                    kycFilter === st
                      ? 'bg-emerald-100 text-emerald-800 font-bold border border-emerald-200'
                      : 'text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  {st === 'all' ? 'Todos' : st === 'pending_admin' ? 'Pendientes Admin' : st === 'verified' ? 'Verificados (Check Verde)' : 'Rechazados'}
                </button>
              ))}
            </div>
            <div className="text-xs text-stone-600 font-medium">
              Total solicitudes KYC: <strong>{kycList.length}</strong>
            </div>
          </div>

          {kycLoading ? (
            <div className="py-12 text-center bg-white rounded-2xl border border-stone-200">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-2" />
              <p className="text-xs text-stone-600">Cargando solicitudes de verificación KYC...</p>
            </div>
          ) : kycList.length === 0 ? (
            <div className="py-12 text-center bg-white rounded-2xl border border-stone-200 space-y-2">
              <ShieldCheck className="w-12 h-12 text-stone-300 mx-auto" />
              <h4 className="text-base font-bold text-stone-900">No hay verificaciones pendientes</h4>
              <p className="text-xs text-stone-600">
                Cuando los inquilinos o propietarios suban su DNI y fotografía para obtener el Check Verde, aparecerán aquí para tu aprobación.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {kycList.map((item) => (
                <div
                  key={item.id}
                  className={`p-5 bg-white rounded-2xl border transition-all space-y-3.5 ${
                    (item.status as string) === 'pending' || (item.status as string) === 'pending_admin'
                      ? 'border-emerald-200 shadow-xs ring-1 ring-emerald-500/20'
                      : 'border-stone-200'
                  }`}
                >
                  {/* Top user row */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-stone-900">{item.user_name}</h4>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.status === 'verified'
                            ? 'bg-emerald-100 text-emerald-800'
                            : (item.status as string) === 'pending' || (item.status as string) === 'pending_admin'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {item.status === 'verified' ? '✓ Check Verde Activo' : ((item.status as string) === 'pending' || (item.status as string) === 'pending_admin') ? '⏳ Esperando Admin' : '✕ Rechazado'}
                        </span>
                      </div>
                      <p className="text-xs text-stone-500">{item.user_email} • Rol: <strong className="capitalize">{item.user_role}</strong></p>
                      <p className="text-[11px] text-stone-400 mt-0.5">
                        Documento: {item.id_document_type} {item.id_document_number || 'N/A'} • Enviado: {new Date(item.submitted_at).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                  </div>

                  {/* Images preview (DNI & Selfie) */}
                  <div className="grid grid-cols-2 gap-2 bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                    <div>
                      <span className="text-[10px] font-bold text-stone-600 block mb-1">
                        DNI / Documento:
                      </span>
                      {item.dni_front_url ? (
                        <div 
                          onClick={() => setPreviewImage(item.dni_front_url)}
                          className="relative h-24 bg-white rounded-lg border border-stone-200 overflow-hidden cursor-pointer group shadow-2xs"
                        >
                          <img
                            src={item.dni_front_url}
                            alt="DNI Frontal"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold gap-1">
                            <Eye className="w-3.5 h-3.5" />
                            <span>Ampliar</span>
                          </div>
                        </div>
                      ) : (
                        <div className="h-24 bg-stone-100 rounded-lg flex items-center justify-center text-[11px] text-stone-400">
                          Sin imagen
                        </div>
                      )}
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-stone-600 block mb-1">
                        Foto / Selfie cotejada:
                      </span>
                      {item.selfie_url ? (
                        <div 
                          onClick={() => setPreviewImage(item.selfie_url)}
                          className="relative h-24 bg-white rounded-lg border border-stone-200 overflow-hidden cursor-pointer group shadow-2xs"
                        >
                          <img
                            src={item.selfie_url}
                            alt="Selfie"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold gap-1">
                            <Eye className="w-3.5 h-3.5" />
                            <span>Ampliar</span>
                          </div>
                        </div>
                      ) : (
                        <div className="h-24 bg-stone-100 rounded-lg flex items-center justify-center text-[11px] text-stone-400">
                          Sin foto
                        </div>
                      )}
                    </div>
                  </div>

                  {item.rejection_reason && (
                    <div className="p-2 bg-stone-100 rounded-lg text-xs text-stone-700 italic">
                      Nota admin: {item.rejection_reason}
                    </div>
                  )}

                  {/* Admin decision buttons */}
                  {((item.status as string) === 'pending' || (item.status as string) === 'pending_admin') && (
                    <div className="flex items-center gap-2 pt-1 border-t border-stone-100">
                      <button
                        onClick={() => handleReviewKyc(item.id, 'approved')}
                        disabled={actionLoading === `kyc-${item.id}`}
                        className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Aprobar y Dar Check Verde</span>
                      </button>

                      <button
                        onClick={() => {
                          setSelectedKyc(item);
                          setShowRejectModal(true);
                        }}
                        disabled={actionLoading === `kyc-${item.id}`}
                        className="py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl transition-all"
                      >
                        Rechazar
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedKyc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl space-y-4">
            <h4 className="text-base font-bold text-stone-900">Motivo del rechazo de verificación</h4>
            <p className="text-xs text-stone-600">
              Indica por qué no se puede validar este DNI o fotografía (ej. foto borrosa, documento caducado, etc.).
            </p>
            <textarea
              rows={3}
              value={rejectionNotes}
              onChange={(e) => setRejectionNotes(e.target.value)}
              placeholder="Ej. El documento no es legible o la foto no coincide con el rostro."
              className="w-full text-xs p-3 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-rose-500"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedKyc(null);
                  setRejectionNotes('');
                }}
                className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleReviewKyc(selectedKyc.id, 'rejected', rejectionNotes)}
                disabled={actionLoading === `kyc-${selectedKyc.id}`}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl"
              >
                Confirmar Rechazo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div 
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm cursor-zoom-out"
        >
          <div className="max-w-3xl max-h-[90vh] bg-white rounded-2xl overflow-hidden p-2 shadow-2xl">
            <img src={previewImage} alt="Documento ampliado" className="max-h-[85vh] w-auto object-contain mx-auto" />
          </div>
        </div>
      )}
    </div>
  );
};
