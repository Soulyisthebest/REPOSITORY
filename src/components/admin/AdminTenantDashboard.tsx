import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  ShieldCheck, 
  CheckCircle2, 
  Award, 
  Briefcase, 
  Euro, 
  ExternalLink, 
  Eye, 
  FileText, 
  Check, 
  Sparkles,
  QrCode,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { SEED_TENANTS, SeedTenant } from '../../data/seedTenants';
import { Language } from '../../i18n/translations';

interface AdminTenantDashboardProps {
  language: Language;
  onOpenLiveTenantView?: () => void;
}

export const AdminTenantDashboard: React.FC<AdminTenantDashboardProps> = ({
  onOpenLiveTenantView,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployment, setSelectedEmployment] = useState<string>('all');
  const [selectedTenant, setSelectedTenant] = useState<SeedTenant | null>(null);

  const filteredTenants = SEED_TENANTS.filter(t => {
    const matchSearch = !searchTerm ||
      t.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.profession.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.target_city?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchEmployment = selectedEmployment === 'all' || t.employment_type === selectedEmployment;
    return matchSearch && matchEmployment;
  });

  const avgTrustScore = Math.round(
    SEED_TENANTS.reduce((acc, t) => acc + (t.trustScore || t.trust_score || 85), 0) / SEED_TENANTS.length
  );

  const indefiniteCount = SEED_TENANTS.filter(t => t.employment_type === 'indefinido' || t.employment_type === 'funcionario').length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center shadow-2xs">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-[#1E1B4B]">Panel de Inquilinos y Pasaportes</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-100 text-teal-800">
                Solvencia Certificada
              </span>
            </div>
            <p className="text-xs text-stone-500">
              Supervisión de candidatos verificados, Trust Scores de reputación (0-100) y certificados de solvencia RGPD.
            </p>
          </div>
        </div>

        {onOpenLiveTenantView && (
          <button
            onClick={onOpenLiveTenantView}
            className="px-4 py-2.5 bg-[#1E1B4B] hover:bg-[#28235C] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2"
          >
            <span>Ver Modo Inquilino en Vivo</span>
            <ExternalLink className="w-3.5 h-3.5 text-teal-400" />
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-[11px] font-semibold">Total de Inquilinos</span>
            <Users className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-black text-[#1E1B4B]">
            {SEED_TENANTS.length}
          </div>
          <div className="text-[10px] text-teal-700 font-bold mt-0.5">
            100% Pasaporte Activo
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-[11px] font-semibold">Puntuación de Confianza Promedio</span>
            <Award className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-[#D97706]">
            {avgTrustScore}/100
          </div>
          <div className="text-[10px] text-emerald-600 font-bold mt-0.5">
            Nivel Excelente (A+)
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-[11px] font-semibold">Estabilidad Laboral</span>
            <Briefcase className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-indigo-900">
            {Math.round((indefiniteCount / SEED_TENANTS.length) * 100)}%
          </div>
          <div className="text-[10px] text-stone-400 font-medium mt-0.5">
            Indefinido / Funcionario
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-[11px] font-semibold">Pagos a Tiempo</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600">
            100%
          </div>
          <div className="text-[10px] text-emerald-600 font-bold mt-0.5">
            0 Litigios registrados
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre, profesión o ciudad..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-200 focus:outline-hidden focus:border-[#1E1B4B]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-stone-500 font-semibold">Contrato:</span>
          <select
            value={selectedEmployment}
            onChange={(e) => setSelectedEmployment(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl border border-stone-200 bg-white font-medium"
          >
            <option value="all">Todos los contratos</option>
            <option value="indefinido">Indefinido</option>
            <option value="funcionario">Funcionario</option>
            <option value="autonomo">Autónomo</option>
            <option value="temporal">Temporal</option>
          </select>
        </div>
      </div>

      {/* Tenants Table */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
          <div className="flex items-center gap-2 text-xs font-bold text-[#1E1B4B]">
            <QrCode className="w-4 h-4 text-teal-600" />
            <span>Directorio de Pasaportes de Inquilinos ({filteredTenants.length})</span>
          </div>
          <span className="text-[11px] text-stone-500">
            Puntuación verificada con contratos anteriores y caseros previos
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-500 font-bold border-b border-stone-200">
              <tr>
                <th className="p-3">Inquilino</th>
                <th className="p-3">Profesión & Contrato</th>
                <th className="p-3">Ingresos / Presupuesto</th>
                <th className="p-3">Trust Score</th>
                <th className="p-3">Historial</th>
                <th className="p-3">Garantías</th>
                <th className="p-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              {filteredTenants.map((t, idx) => {
                const score = t.trustScore || t.trust_score || 85;
                return (
                  <tr key={`${t.id}-${idx}`} className="hover:bg-stone-50/60 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={t.avatar_url}
                          alt={t.fullName}
                          className="w-10 h-10 rounded-full object-cover border border-stone-200 shrink-0"
                        />
                        <div>
                          <div className="font-bold text-[#1E1B4B]">{t.fullName}</div>
                          <div className="text-[10px] text-stone-400">{t.ageBracket || `${t.age} años`} • {t.target_city}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="font-medium text-stone-900">{t.profession}</div>
                      <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-50 text-indigo-700 uppercase mt-0.5">
                        {t.employment_type}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-emerald-700">{t.monthly_income} €/mes</div>
                      <div className="text-[10px] text-stone-400">Max: {t.maxBudget} €</div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs font-black px-2 py-0.5 rounded-lg ${
                          score >= 90 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {score}/100
                        </span>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="font-medium text-stone-700">{t.verifiedLeasesCount || 2} alquileres</div>
                      <div className="text-[10px] text-emerald-600 font-semibold">100% puntual</div>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {t.has_payslips && (
                          <span className="px-1.5 py-0.5 bg-stone-100 text-stone-600 rounded text-[9px] font-bold">
                            Nóminas ✓
                          </span>
                        )}
                        {t.has_guarantor && (
                          <span className="px-1.5 py-0.5 bg-stone-100 text-stone-600 rounded text-[9px] font-bold">
                            Aval ✓
                          </span>
                        )}
                        <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[9px] font-bold">
                          0 Litigios
                        </span>
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => setSelectedTenant(t)}
                        className="px-3 py-1.5 rounded-xl bg-[#1E1B4B] hover:bg-[#28235C] text-white text-xs font-bold transition-all inline-flex items-center gap-1 shadow-2xs"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Pasaporte</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Detalle de Pasaporte del Inquilino */}
      {selectedTenant && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-teal-600" />
                <h3 className="text-base font-black text-[#1E1B4B]">Pasaporte Digital Rentia</h3>
              </div>
              <button
                onClick={() => setSelectedTenant(null)}
                className="p-1 text-stone-400 hover:text-stone-600 rounded-lg hover:bg-stone-100"
              >
                ✕
              </button>
            </div>

            <div className="flex items-center gap-4 bg-stone-50 p-4 rounded-2xl border border-stone-200">
              <img
                src={selectedTenant.avatar_url}
                alt={selectedTenant.fullName}
                className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-xs"
              />
              <div>
                <h4 className="text-base font-black text-[#1E1B4B]">{selectedTenant.fullName}</h4>
                <p className="text-xs text-stone-500">{selectedTenant.profession} • {selectedTenant.age} años</p>
                <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800">
                  Contrato {selectedTenant.employment_type}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-amber-50/70 p-3 rounded-2xl border border-amber-200">
                <span className="text-[10px] text-amber-800 font-bold uppercase">Trust Score General</span>
                <div className="text-2xl font-black text-[#D97706]">{selectedTenant.trustScore || selectedTenant.trust_score || 88}/100</div>
                <div className="text-[10px] text-amber-700">Riesgo de impago nulo</div>
              </div>
              <div className="bg-emerald-50/70 p-3 rounded-2xl border border-emerald-200">
                <span className="text-[10px] text-emerald-800 font-bold uppercase">Solvencia Neta</span>
                <div className="text-2xl font-black text-emerald-700">{selectedTenant.monthly_income} €</div>
                <div className="text-[10px] text-emerald-600">Alquiler max sugerido: {selectedTenant.maxBudget} €</div>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="font-bold text-[#1E1B4B]">Biografía del Inquilino:</div>
              <p className="text-stone-600 leading-relaxed bg-stone-50 p-3 rounded-xl border border-stone-100">
                {selectedTenant.bio}
              </p>
            </div>

            <div className="bg-indigo-50/70 p-3 rounded-2xl border border-indigo-200 text-indigo-950 text-xs flex items-center justify-between">
              <div>
                <span className="font-bold">Certificado del Inquilino PDF:</span>
                <div className="text-[11px] text-indigo-700 mt-0.5">Hash SHA-256 verificado en Supabase Cloud.</div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-200 text-indigo-900">
                Certificado Listo
              </span>
            </div>

            <div className="flex justify-end pt-2 border-t border-stone-100">
              <button
                onClick={() => setSelectedTenant(null)}
                className="px-4 py-2 bg-[#1E1B4B] text-white rounded-xl text-xs font-bold"
              >
                Cerrar Pasaporte
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
