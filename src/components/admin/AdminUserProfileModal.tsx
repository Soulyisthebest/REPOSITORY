import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  ShieldCheck, 
  ShieldAlert, 
  Home, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  Ban, 
  Unlock, 
  Building, 
  Calendar,
  Euro,
  Award,
  Laptop
} from 'lucide-react';
import { api } from '../../api/client';

interface AdminUserProfileModalProps {
  userId: string;
  onClose: () => void;
  onStatusChanged?: () => void;
}

export const AdminUserProfileModal: React.FC<AdminUserProfileModalProps> = ({
  userId,
  onClose,
  onStatusChanged,
}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [blockReason, setBlockReason] = useState('Incumplimiento de términos y condiciones de Rentia');
  const [showEmailBlockPrompt, setShowEmailBlockPrompt] = useState(false);

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.admin.getUserDetailedProfile(userId);
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Error al cargar perfil del usuario');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchProfile();
    }
  }, [userId]);

  const handleToggleUserStatus = async () => {
    if (!data?.user) return;
    const nextStatus = !data.user.is_active;
    const confirmMsg = nextStatus
      ? `¿Reactivar la cuenta de ${data.user.name}?`
      : `¿Suspender la cuenta de ${data.user.name}? El usuario no podrá iniciar sesión.`;
    if (!window.confirm(confirmMsg)) return;

    setActionLoading(true);
    try {
      await api.admin.toggleUserStatus(data.user.id, nextStatus);
      await fetchProfile();
      if (onStatusChanged) onStatusChanged();
    } catch (err: any) {
      alert(`Error: ${err.message || 'No se pudo cambiar el estado del usuario'}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleEmailBlock = async () => {
    if (!data?.user?.email) return;
    const email = data.user.email;
    const isBlocked = Boolean(data.isEmailBlocked);

    setActionLoading(true);
    try {
      if (isBlocked) {
        if (!window.confirm(`¿Desbloquear la dirección ${email}? Podrá registrarse o acceder de nuevo.`)) {
          setActionLoading(false);
          return;
        }
        await api.admin.removeBlockedEmail(email);
      } else {
        await api.admin.addBlockedEmail(email, blockReason);
        setShowEmailBlockPrompt(false);
      }
      await fetchProfile();
      if (onStatusChanged) onStatusChanged();
    } catch (err: any) {
      alert(`Error: ${err.message || 'No se pudo actualizar el bloqueo de email'}`);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl flex flex-col items-center text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm font-semibold text-slate-700">Cargando perfil integral del usuario...</p>
        </div>
      </div>
    );
  }

  if (error || !data?.user) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl text-center space-y-4">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
          <h3 className="text-lg font-bold text-slate-900">No se pudo cargar el perfil</h3>
          <p className="text-xs text-slate-600">{error || 'Usuario no encontrado'}</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-700"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  const { user, tenantProfile, listings = [], leases = [], verifications = [], recentLogins = [], isEmailBlocked } = data;
  const isTenant = user.role === 'tenant';
  const isLandlord = user.role === 'landlord';

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 flex flex-col my-auto">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 rounded-t-2xl flex items-center justify-between border-b border-slate-800 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-lg text-white shadow-md">
              {user.name ? user.name[0].toUpperCase() : 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-tight text-white">{user.name || 'Usuario'}</h2>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  user.role === 'landlord'
                    ? 'bg-amber-400 text-slate-950'
                    : user.role === 'admin'
                    ? 'bg-purple-400 text-slate-950'
                    : 'bg-emerald-400 text-slate-950'
                }`}>
                  {user.role === 'landlord' ? 'Propietario' : user.role === 'admin' ? 'Administrador' : 'Inquilino'}
                </span>
                {user.is_active ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-[10px] font-semibold flex items-center gap-1">
                    <CheckCircle className="w-2.5 h-2.5" /> Activo
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-rose-950/80 border border-rose-500/50 text-rose-300 text-[10px] font-semibold flex items-center gap-1">
                    <XCircle className="w-2.5 h-2.5" /> Suspendido
                  </span>
                )}
                {isEmailBlocked && (
                  <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center gap-1 animate-pulse">
                    <Ban className="w-2.5 h-2.5" /> Email en Blacklist
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">{user.email} • ID: {user.id}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 space-y-6 text-slate-800">
          {/* Quick Moderation Bar */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-slate-700">Acciones de Moderación Administrativa</p>
              <p className="text-[11px] text-slate-500">Aplica restricciones inmediatas sobre el acceso o las comunicaciones del usuario.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={actionLoading}
                onClick={handleToggleUserStatus}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  user.is_active
                    ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs'
                }`}
                id="btn-admin-toggle-user-status"
              >
                {user.is_active ? <Ban className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                <span>{user.is_active ? 'Suspender Cuenta' : 'Reactivar Cuenta'}</span>
              </button>

              {isEmailBlocked ? (
                <button
                  disabled={actionLoading}
                  onClick={handleToggleEmailBlock}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1.5"
                  id="btn-admin-unblock-email"
                >
                  <Unlock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Desbloquear Email</span>
                </button>
              ) : (
                <button
                  disabled={actionLoading}
                  onClick={() => setShowEmailBlockPrompt(!showEmailBlockPrompt)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white flex items-center gap-1.5 shadow-xs"
                  id="btn-admin-block-email"
                >
                  <Mail className="w-3.5 h-3.5 text-rose-400" />
                  <span>Bloquear Dirección de Correo</span>
                </button>
              )}
            </div>
          </div>

          {/* Email Block Prompt Form */}
          {showEmailBlockPrompt && !isEmailBlocked && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-xs text-rose-900 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  Bloquear permanentemente correo {user.email}
                </span>
                <button 
                  onClick={() => setShowEmailBlockPrompt(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs"
                >
                  Cancelar
                </button>
              </div>
              <p className="text-[11px] text-rose-700">
                Al añadir este correo a la lista negra, el usuario no podrá volver a registrarse ni autenticarse con esta dirección en ninguna parte del sistema.
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="Motivo del bloqueo (ej. Suplantación, impago, spam)..."
                  className="flex-1 bg-white border border-rose-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
                <button
                  onClick={handleToggleEmailBlock}
                  disabled={actionLoading}
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg transition-colors whitespace-nowrap"
                >
                  Confirmar Bloqueo
                </button>
              </div>
            </div>
          )}

          {/* User Core Data Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Mail className="w-3 h-3 text-slate-400" /> Correo Electrónico
              </span>
              <p className="text-xs font-semibold text-slate-900 break-all">{user.email}</p>
            </div>
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Phone className="w-3 h-3 text-slate-400" /> Teléfono
              </span>
              <p className="text-xs font-semibold text-slate-900">{user.phone || tenantProfile?.phone || 'No registrado'}</p>
            </div>
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" /> Fecha de Registro
              </span>
              <p className="text-xs font-semibold text-slate-900">
                {user.created_at ? new Date(user.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Reciente'}
              </p>
            </div>
          </div>

          {/* SPECIFIC TENANT PROFILE DETAILS */}
          {isTenant && tenantProfile && (
            <div className="border border-indigo-100 bg-indigo-50/40 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-indigo-100 pb-3">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-indigo-600" />
                  <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider">
                    Pasaporte y Solvencia del Inquilino
                  </h4>
                </div>
                <div className="flex items-center gap-1 bg-indigo-600 text-white px-2.5 py-0.5 rounded-full text-xs font-black">
                  <span>Trust Score:</span>
                  <span>{tenantProfile.trust_score || 85}/100</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-white p-2.5 rounded-lg border border-indigo-100">
                  <span className="text-[10px] text-slate-500 block">Ingresos Mensuales</span>
                  <span className="font-bold text-slate-900 text-sm">{tenantProfile.monthly_income ? `${tenantProfile.monthly_income} €/mes` : 'No especificado'}</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-indigo-100">
                  <span className="text-[10px] text-slate-500 block">Presupuesto Máximo</span>
                  <span className="font-bold text-slate-900 text-sm">{tenantProfile.max_budget ? `${tenantProfile.max_budget} €/mes` : 'No especificado'}</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-indigo-100">
                  <span className="text-[10px] text-slate-500 block">Situación Laboral</span>
                  <span className="font-semibold text-slate-900 capitalize">{tenantProfile.employment_type || 'Indefinido'}</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-indigo-100">
                  <span className="text-[10px] text-slate-500 block">Ciudad Actual / Destino</span>
                  <span className="font-semibold text-slate-900">{tenantProfile.current_city || 'Málaga'}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-white p-2.5 rounded-lg border border-indigo-100">
                  <span className="text-[10px] text-slate-500 block">Empresa / Empleador</span>
                  <span className="font-medium text-slate-800">{tenantProfile.employer_name || 'Autónomo / Tecnológica'}</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-indigo-100">
                  <span className="text-[10px] text-slate-500 block">Antigüedad Laboral</span>
                  <span className="font-medium text-slate-800">{tenantProfile.seniority_years ? `${tenantProfile.seniority_years} años` : 'Más de 2 años'}</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-indigo-100">
                  <span className="text-[10px] text-slate-500 block">Avalista / Mascotas</span>
                  <span className="font-medium text-slate-800">
                    {tenantProfile.has_guarantor ? 'Con Avalista' : 'Sin avalista'} • {tenantProfile.pets || tenantProfile.has_pets ? 'Tiene mascotas' : 'Sin mascotas'}
                  </span>
                </div>
              </div>

              {tenantProfile.bio && (
                <div className="bg-white p-3 rounded-lg border border-indigo-100 text-xs">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Presentación Personal</span>
                  <p className="text-slate-700 italic">"{tenantProfile.bio}"</p>
                </div>
              )}
            </div>
          )}

          {/* SPECIFIC LANDLORD PROFILE DETAILS */}
          {isLandlord && (
            <div className="border border-amber-200 bg-amber-50/40 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-amber-200 pb-3">
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-amber-700" />
                  <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                    Cartera y Verificaciones del Propietario
                  </h4>
                </div>
                <span className="bg-amber-600 text-white px-2.5 py-0.5 rounded-full text-xs font-bold">
                  {listings.length} Inmueble(s) Registrados
                </span>
              </div>

              {/* Listings by this landlord */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-700">Anuncios de Propiedades Publicados:</p>
                {listings.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No tiene propiedades registradas actualmente en la base de datos.</p>
                ) : (
                  <div className="divide-y divide-amber-200/60 bg-white border border-amber-200 rounded-xl overflow-hidden">
                    {listings.map((l: any, idx: number) => (
                      <div key={`${l.id}-${idx}`} className="p-3 flex items-center justify-between text-xs hover:bg-amber-50/50 transition-colors">
                        <div>
                          <p className="font-bold text-slate-900">{l.title}</p>
                          <p className="text-slate-500 text-[11px] flex items-center gap-1.5 mt-0.5">
                            <MapPin className="w-3 h-3 text-slate-400" /> {l.address}, {l.city}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-slate-900">{l.rent} €/mes</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            l.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {l.is_active ? 'Activo' : 'Pausado'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Cadastral Ownership Verifications */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-700">Titularidades Catastrales Enviadas:</p>
                {verifications.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No hay solicitudes de verificación catastral asociadas.</p>
                ) : (
                  <div className="divide-y divide-amber-200/60 bg-white border border-amber-200 rounded-xl overflow-hidden">
                    {verifications.map((v: any, idx: number) => (
                      <div key={`${v.id}-${idx}`} className="p-2.5 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-semibold text-slate-800">{v.property_address} ({v.city})</span>
                          <p className="text-[10px] text-slate-500 font-mono">Ref: {v.reference_cadastral || 'N/A'}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          v.status === 'verified'
                            ? 'bg-emerald-100 text-emerald-800'
                            : v.status === 'rejected'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {v.status === 'verified' ? 'Verificado' : v.status === 'rejected' ? 'Rechazado' : 'Pendiente'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Activity & Login Logs */}
          <div className="border border-slate-200 bg-slate-50 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                Historial de Inicios de Sesión y Actividad Reciente
              </span>
              <span className="text-[10px] text-slate-500">{recentLogins.length} registros auditados</span>
            </div>

            {recentLogins.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No se registran eventos de autenticación recientes para este usuario.</p>
            ) : (
              <div className="divide-y divide-slate-200 bg-white border border-slate-200 rounded-lg overflow-hidden text-xs">
                {recentLogins.slice(0, 5).map((log: any, idx: number) => (
                  <div key={`${log.id}-${idx}`} className="p-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${
                        log.status === 'success' ? 'bg-emerald-500' : log.status === 'blocked' ? 'bg-rose-500' : 'bg-amber-500'
                      }`} />
                      <div>
                        <span className="font-semibold text-slate-800 capitalize">{log.status}</span>
                        <span className="text-slate-400 text-[10px] ml-2 font-mono">{log.ip_address} • {log.browser} ({log.os})</span>
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-500">
                      {new Date(log.created_at).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 rounded-b-2xl flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors"
          >
            Cerrar Ficha de Usuario
          </button>
        </div>
      </div>
    </div>
  );
};
