import React, { useState } from 'react';
import { 
  Briefcase, 
  Euro, 
  Users, 
  PawPrint, 
  CheckCircle2, 
  X, 
  Sparkles, 
  Loader2, 
  ShieldCheck,
  FileCheck2,
  Info
} from 'lucide-react';
import { api } from '../api/client';

interface TenantOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: {
    id: string;
    email?: string;
    name?: string;
  };
  initialData?: {
    monthly_income?: number;
    employment_type?: string;
    has_guarantor?: boolean;
    guarantor_income?: number;
    has_pets?: boolean;
    pet_details?: string;
    max_budget?: number;
  };
  onSaved?: (updated: any) => void;
}

export const TenantOnboardingModal: React.FC<TenantOnboardingModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  initialData,
  onSaved,
}) => {
  const [monthlyIncome, setMonthlyIncome] = useState<number | string>(
    initialData?.monthly_income || 1850
  );
  const [employmentType, setEmploymentType] = useState<string>(
    initialData?.employment_type || 'indefinido'
  );
  const [hasGuarantor, setHasGuarantor] = useState<boolean>(
    initialData?.has_guarantor ?? false
  );
  const [guarantorIncome, setGuarantorIncome] = useState<number | string>(
    initialData?.guarantor_income || 2200
  );
  const [hasPets, setHasPets] = useState<boolean>(
    initialData?.has_pets ?? false
  );
  const [petDetails, setPetDetails] = useState<string>(
    initialData?.pet_details || ''
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!monthlyIncome || Number(monthlyIncome) <= 0) {
      setError('Por favor indica tu nómina mensual neta aproximada.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.tenant.updateFinancialProfile({
        userId: currentUser.id,
        email: currentUser.email,
        monthly_income: Number(monthlyIncome),
        employment_type: employmentType,
        has_guarantor: hasGuarantor,
        guarantor_income: hasGuarantor ? Number(guarantorIncome) || undefined : undefined,
        has_pets: hasPets,
        pet_details: hasPets ? petDetails.trim() || 'Mascota doméstica educada' : undefined,
      });

      if (onSaved) {
        onSaved(res.profile);
      }
      onClose();
    } catch (err: any) {
      console.error('Error saving financial profile:', err);
      setError(err.message || 'No se pudo guardar la información de perfil.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Configuración Inicial de tu Perfil</h3>
              <p className="text-xs text-indigo-100">
                Información laboral, solvencia y preferencias de alquiler
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-2xl flex items-start gap-2.5">
            <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-900 leading-relaxed">
              Al iniciar tu primera sesión como inquilino, debes indicar estos datos para que los propietarios puedan evaluar tu solvencia. 
              <strong> Podrás modificarlos en cualquier momento desde tu perfil.</strong>
            </p>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
              {error}
            </div>
          )}

          {/* Monthly Income */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
              <Euro className="w-4 h-4 text-emerald-600" />
              <span>Nómina mensual neta (€/mes) <span className="text-rose-500">*</span></span>
            </label>
            <div className="relative">
              <input
                type="number"
                required
                min="0"
                step="50"
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(e.target.value)}
                placeholder="Ej. 1850"
                className="w-full text-sm font-semibold text-slate-900 pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-600">
                € / mes
              </span>
            </div>
          </div>

          {/* Job / Contract Type */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
              <Briefcase className="w-4 h-4 text-indigo-600" />
              <span>Trabajo / Tipo de contrato <span className="text-rose-500">*</span></span>
            </label>
            <select
              value={employmentType}
              onChange={(e) => setEmploymentType(e.target.value)}
              className="w-full text-xs font-medium text-slate-800 px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none"
            >
              <option value="indefinido">Contrato Indefinido / Fijo</option>
              <option value="funcionario">Funcionario público</option>
              <option value="autonomo">Autónomo / Emprendedor</option>
              <option value="temporal">Contrato Temporal</option>
              <option value="estudiante">Estudiante con ingresos</option>
              <option value="jubilado">Pensionista / Jubilado</option>
              <option value="otro">Otro tipo de empleo</option>
            </select>
          </div>

          {/* Guarantor toggle */}
          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                <div>
                  <span className="text-xs font-bold text-slate-900 block">¿Cuentas con avalista o fiador?</span>
                  <span className="text-[11px] text-slate-600 block">Aumenta tu ratio de aceptación entre propietarios</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setHasGuarantor(!hasGuarantor)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  hasGuarantor ? 'bg-indigo-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    hasGuarantor ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {hasGuarantor && (
              <div className="pt-2 border-t border-slate-200/60 animate-in fade-in duration-150">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  ¿Cuánto gana el avalista aproximadamente? (€/mes)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={guarantorIncome}
                    onChange={(e) => setGuarantorIncome(e.target.value)}
                    placeholder="Ej. 2200"
                    className="w-full text-xs font-semibold text-slate-900 pl-3 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-600">
                    € / mes
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Pets toggle */}
          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PawPrint className="w-4 h-4 text-amber-600" />
                <div>
                  <span className="text-xs font-bold text-slate-900 block">¿Tienes mascotas?</span>
                  <span className="text-[11px] text-slate-600 block">Perros, gatos o animales de compañía</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setHasPets(!hasPets)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  hasPets ? 'bg-amber-500' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    hasPets ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {hasPets && (
              <div className="pt-2 border-t border-slate-200/60 animate-in fade-in duration-150">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Detalles sobre tus mascotas (tipo, raza, peso...)
                </label>
                <input
                  type="text"
                  value={petDetails}
                  onChange={(e) => setPetDetails(e.target.value)}
                  placeholder="Ej. Perro pequeño educado (7kg), vacunado y con seguro"
                  className="w-full text-xs text-slate-800 px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-slate-600 hover:text-slate-800 font-medium"
            >
              Completar más tarde
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-xl transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Guardando perfil...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Guardar y Continuar</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
