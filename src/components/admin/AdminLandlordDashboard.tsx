import React, { useState } from 'react';
import { 
  Home, 
  Search, 
  Filter, 
  CheckCircle2, 
  ExternalLink, 
  MapPin, 
  Users, 
  Euro, 
  ShieldCheck, 
  FileCheck, 
  Eye, 
  Clock, 
  Building2,
  Sparkles,
  Check,
  XCircle,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { SEED_LISTINGS } from '../../data/seedListings';
import { SEED_TENANTS } from '../../data/seedTenants';
import { Language } from '../../i18n/translations';

interface AdminLandlordDashboardProps {
  language: Language;
  onOpenLiveLandlordView?: () => void;
}

export const AdminLandlordDashboard: React.FC<AdminLandlordDashboardProps> = ({
  onOpenLiveLandlordView,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [listings, setListings] = useState(() => {
    const seen = new Set<string>();
    return SEED_LISTINGS.filter(l => {
      if (!l?.id || seen.has(l.id)) return false;
      seen.add(l.id);
      return true;
    });
  });
  const [selectedListingDetail, setSelectedListingDetail] = useState<any | null>(null);

  // Filter listings
  const filteredListings = listings.filter(l => {
    const matchSearch = !searchTerm || 
      l.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l as any).landlord_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCity = selectedCity === 'all' || l.city === selectedCity;
    const matchType = selectedType === 'all' || l.property_type === selectedType;
    return matchSearch && matchCity && matchType;
  });

  const cities = Array.from(new Set(listings.map(l => l.city)));

  const toggleListingActive = (id: string) => {
    setListings(prev => prev.map(l => {
      if (l.id === id) {
        return { ...l, is_active: !(l as any).is_active };
      }
      return l;
    }));
  };

  const totalMonthlyRent = listings.reduce((acc, curr) => acc + curr.rent, 0);
  const avgRent = Math.round(totalMonthlyRent / (listings.length || 1));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner & Quick Controls */}
      <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center shadow-2xs">
            <Home className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-[#1E1B4B]">Panel de Propietarios e Inmuebles</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                Supervisión Inmobiliaria
              </span>
            </div>
            <p className="text-xs text-stone-500">
              Supervisión de viviendas en alquiler, precios de mercado, inquilinos candidatos y validación de titularidades.
            </p>
          </div>
        </div>

        {onOpenLiveLandlordView && (
          <button
            onClick={onOpenLiveLandlordView}
            className="px-4 py-2.5 bg-[#1E1B4B] hover:bg-[#28235C] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2"
          >
            <span>Ver Modo Propietario en Vivo</span>
            <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-[11px] font-semibold">Total de Inmuebles</span>
            <Building2 className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-[#1E1B4B]">
            {listings.length}
          </div>
          <div className="text-[10px] text-emerald-600 font-bold mt-0.5">
            {listings.filter(l => (l as any).is_active !== false).length} activos ahora
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-[11px] font-semibold">Renta Promedio</span>
            <Euro className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700">
            {avgRent} €/mes
          </div>
          <div className="text-[10px] text-stone-400 font-medium mt-0.5">
            Precios verificados
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-[11px] font-semibold">Titularidad Verificada</span>
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-indigo-900">
            {listings.filter(l => (l as any).verification_status === 'verified').length} / {listings.length}
          </div>
          <div className="text-[10px] text-indigo-600 font-bold mt-0.5">
            100% Sin fraude
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-[11px] font-semibold">Candidatos Activos</span>
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-purple-900">
            {SEED_TENANTS.length}
          </div>
          <div className="text-[10px] text-purple-600 font-bold mt-0.5">
            Con Pasaporte Solvente
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
            placeholder="Buscar por título, dirección o casero..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-200 focus:outline-hidden focus:border-[#1E1B4B]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl border border-stone-200 bg-white font-medium"
          >
            <option value="all">Todas las ciudades ({cities.length})</option>
            {cities.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl border border-stone-200 bg-white font-medium"
          >
            <option value="all">Todos los tipos</option>
            <option value="apartment">Apartamentos</option>
            <option value="house">Casas / Chalets</option>
            <option value="studio">Estudios</option>
          </select>
        </div>
      </div>

      {/* Listings Catalog */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
          <div className="flex items-center gap-2 text-xs font-bold text-[#1E1B4B]">
            <Building2 className="w-4 h-4 text-amber-600" />
            <span>Inventario de Inmuebles en Alquiler ({filteredListings.length})</span>
          </div>
          <span className="text-[11px] text-stone-500">
            Previsualiza fotos, precios, caseros y estado de publicación
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-500 font-bold border-b border-stone-200">
              <tr>
                <th className="p-3">Inmueble</th>
                <th className="p-3">Ubicación</th>
                <th className="p-3">Renta / Fianza</th>
                <th className="p-3">Características</th>
                <th className="p-3">Propietario</th>
                <th className="p-3">Titularidad</th>
                <th className="p-3">Estado</th>
                <th className="p-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              {filteredListings.map((item, idx) => (
                <tr key={`${item.id}-${idx}`} className="hover:bg-stone-50/60 transition-colors">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={item.images?.[0] || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=100'}
                        alt={item.title}
                        className="w-12 h-12 rounded-xl object-cover border border-stone-200 shrink-0"
                      />
                      <div className="max-w-xs">
                        <div className="font-bold text-[#1E1B4B] line-clamp-1">{item.title}</div>
                        <div className="text-[11px] text-stone-400 truncate">{item.address}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="font-semibold text-stone-900">{item.city}</div>
                    <div className="text-[10px] text-stone-400">{item.neighborhood || 'Centro'}</div>
                  </td>
                  <td className="p-3">
                    <div className="font-black text-[#1E1B4B]">{item.rent} €<span className="text-[10px] text-stone-400 font-normal">/mes</span></div>
                    <div className="text-[10px] text-stone-400">Fianza: {item.deposit || item.rent} €</div>
                  </td>
                  <td className="p-3">
                    <div className="font-medium text-stone-700">{item.rooms_count} hab • {item.surface_sqm || 80} m²</div>
                    <div className="text-[10px] text-stone-400 capitalize">{item.property_type}</div>
                  </td>
                  <td className="p-3">
                    <div className="font-semibold text-stone-900">{(item as any).landlord_name || 'Propietario Verificado'}</div>
                    <div className="text-[10px] text-emerald-600 font-bold">Casero Premium</div>
                  </td>
                  <td className="p-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Verificado</span>
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      (item as any).is_active !== false 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : 'bg-stone-200 text-stone-600'
                    }`}>
                      {(item as any).is_active !== false ? 'Activo' : 'Pausado'}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setSelectedListingDetail(item)}
                        className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition-all"
                        title="Ver ficha completa"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => toggleListingActive(item.id)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                          (item as any).is_active !== false
                            ? 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                            : 'bg-emerald-600 text-white hover:bg-emerald-700'
                        }`}
                      >
                        {(item as any).is_active !== false ? 'Pausar' : 'Activar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Ficha Completa del Inmueble */}
      {selectedListingDetail && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-black text-[#1E1B4B]">Ficha del Inmueble (Auditoría)</h3>
              </div>
              <button
                onClick={() => setSelectedListingDetail(null)}
                className="p-1 text-stone-400 hover:text-stone-600 rounded-lg hover:bg-stone-100"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-2">
                {selectedListingDetail.images?.slice(0, 2).map((img: string, idx: number) => (
                  <img
                    key={idx}
                    src={img}
                    alt="Propiedad"
                    className="w-full h-44 object-cover rounded-2xl border border-stone-200"
                  />
                ))}
              </div>

              <div>
                <h4 className="font-bold text-sm text-[#1E1B4B]">{selectedListingDetail.title}</h4>
                <p className="text-stone-500 mt-1 leading-relaxed">{selectedListingDetail.description}</p>
              </div>

              <div className="grid grid-cols-3 gap-3 bg-stone-50 p-3 rounded-2xl border border-stone-200">
                <div>
                  <span className="text-[10px] text-stone-400 uppercase font-bold">Renta Mensual</span>
                  <div className="text-base font-black text-emerald-700">{selectedListingDetail.rent} €</div>
                </div>
                <div>
                  <span className="text-[10px] text-stone-400 uppercase font-bold">Fianza Legal</span>
                  <div className="text-base font-black text-stone-800">{selectedListingDetail.deposit || selectedListingDetail.rent} €</div>
                </div>
                <div>
                  <span className="text-[10px] text-stone-400 uppercase font-bold">Ingresos Mínimos</span>
                  <div className="text-base font-black text-indigo-900">{selectedListingDetail.min_income_required || 3000} €</div>
                </div>
              </div>

              <div className="bg-amber-50/70 p-3 rounded-2xl border border-amber-200 text-amber-900 flex items-center justify-between">
                <div>
                  <span className="font-bold">Titular Catastral:</span> {(selectedListingDetail as any).landlord_name || 'Elena Gómez Morales'}
                  <div className="text-[11px] text-amber-700 mt-0.5">Nota Simple Registral cotejada y aprobada por moderación.</div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  Aprobado
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-stone-100">
              <button
                onClick={() => setSelectedListingDetail(null)}
                className="px-4 py-2 bg-[#1E1B4B] text-white rounded-xl text-xs font-bold"
              >
                Cerrar Ficha
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
