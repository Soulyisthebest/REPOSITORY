import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Ban, 
  Unlock, 
  Search, 
  Plus, 
  RefreshCw, 
  Mail, 
  Calendar, 
  UserX, 
  AlertOctagon,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { api } from '../../api/client';

export const AdminBlockedEmails: React.FC = () => {
  const [blockedEmails, setBlockedEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // New block form
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newReason, setNewReason] = useState('Sospecha de fraude / suplantación de identidad');

  const fetchBlocked = async () => {
    setLoading(true);
    try {
      const data = await api.admin.getBlockedEmails();
      setBlockedEmails(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching blocked emails:', err);
      setBlockedEmails([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlocked();
  }, []);

  const handleAddBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;

    setActionLoading(true);
    try {
      await api.admin.addBlockedEmail(newEmail.trim().toLowerCase(), newReason);
      setNewEmail('');
      setShowAddModal(false);
      await fetchBlocked();
    } catch (err: any) {
      alert(`Error al bloquear correo: ${err.message || 'Error desconocido'}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveBlock = async (email: string) => {
    if (!window.confirm(`¿Estás seguro de que deseas desbloquear la dirección ${email}? Podrá volver a registrarse e iniciar sesión.`)) {
      return;
    }

    setActionLoading(true);
    try {
      await api.admin.removeBlockedEmail(email);
      await fetchBlocked();
    } catch (err: any) {
      alert(`Error al desbloquear correo: ${err.message || 'Error desconocido'}`);
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = blockedEmails.filter(b => 
    b.email?.toLowerCase().includes(search.toLowerCase()) ||
    b.reason?.toLowerCase().includes(search.toLowerCase()) ||
    b.blocked_by?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-md">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400">
              <Ban className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              Lista Negra de Correos Electrónicos (Email Blacklist)
            </h3>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Los correos bloqueados no pueden iniciar sesión, registrarse ni recibir tokens de autenticación en la plataforma.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all"
            id="btn-add-blocked-email"
          >
            <Plus className="w-4 h-4" />
            <span>Bloquear Nuevo Correo</span>
          </button>
          <button
            onClick={fetchBlocked}
            disabled={loading}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Protocol Banner */}
      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-900 text-xs flex items-start gap-3">
        <AlertOctagon className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <strong className="block font-bold">Protocolo de Seguridad Activo:</strong>
          <span>
            Toda petición entrante de registro o inicio de sesión con un correo listado a continuación es rechazada inmediatamente con código HTTP 403 Forbidden y auditada en la base de datos de inicios de sesión como evento "blocked".
          </span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por dirección de email, motivo o administrador responsable..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>
        <div className="text-xs font-mono text-slate-500">
          Total bloqueados: <span className="font-bold text-rose-600">{blockedEmails.length}</span>
        </div>
      </div>

      {/* Blocked Emails Table */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <div className="w-8 h-8 border-3 border-rose-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold text-slate-600">Cargando lista negra de correos...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
          <p className="text-sm font-bold text-slate-800">No hay correos en la lista negra actualmente</p>
          <p className="text-xs text-slate-500">La lista negra está limpia o la búsqueda no coincide con ningún registro.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-bold tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Correo Electrónico Bloqueado</th>
                  <th className="py-3.5 px-4">Motivo del Bloqueo</th>
                  <th className="py-3.5 px-4">Fecha de Bloqueo</th>
                  <th className="py-3.5 px-4">Bloqueado por</th>
                  <th className="py-3.5 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filtered.map((item, idx) => (
                  <tr key={`${item.id}-${idx}`} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-rose-500 shrink-0" />
                        <span className="font-bold text-slate-900 font-mono">{item.email}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-slate-700">{item.reason || 'Sin motivo especificado'}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                      {item.blocked_at ? new Date(item.blocked_at).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/D'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[10px]">
                        {item.blocked_by || 'admin'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleRemoveBlock(item.email)}
                        disabled={actionLoading}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 font-semibold text-xs transition-colors inline-flex items-center gap-1.5"
                        title="Desbloquear correo"
                      >
                        <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Desbloquear</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD BLOCK MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-2 text-rose-600">
              <Ban className="w-6 h-6" />
              <h3 className="text-base font-bold text-slate-900">Bloquear Dirección de Correo</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Introduce el correo que deseas añadir a la lista negra permanente de Rentia. El usuario perderá acceso inmediato a la plataforma.
            </p>

            <form onSubmit={handleAddBlock} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Correo Electrónico</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Motivo del Bloqueo</label>
                <textarea
                  rows={3}
                  required
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  placeholder="Indica la justificación o infracción cometida..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold transition-all shadow-md"
                >
                  Bloquear Correo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
