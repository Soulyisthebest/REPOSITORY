import React, { useState, useEffect } from 'react';
import { 
  Home, 
  Search, 
  Edit3, 
  Trash2, 
  Ban, 
  CheckCircle, 
  XCircle, 
  MapPin, 
  Euro, 
  Bed, 
  Square, 
  Filter, 
  Plus, 
  RefreshCw, 
  AlertTriangle,
  User,
  ExternalLink,
  Save,
  X,
  Eye,
  LayoutGrid,
  List,
  Sparkles,
  Building2,
  CheckCircle2,
  Phone,
  Mail
} from 'lucide-react';
import { api } from '../../api/client';
import { SEED_LISTINGS } from '../../data/seedListings';

interface AdminListingsManagerProps {
  onInspectLandlord?: (landlordId: string) => void;
}

export const AdminListingsManager: React.FC<AdminListingsManagerProps> = ({
  onInspectLandlord,
}) => {
  const [listings, setListings] = useState<any[]>(SEED_LISTINGS);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'blocked'>('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [inspectingListing, setInspectingListing] = useState<any | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Edit Listing Modal state
  const [editingListing, setEditingListing] = useState<any | null>(null);
  const [editFormData, setEditFormData] = useState({
    title: '',
    rent: 0,
    deposit: 0,
    address: '',
    city: '',
    bedrooms: 1,
    square_meters: 60,
    description: '',
    is_active: true,
  });

  const fetchListings = async () => {
    setLoading(true);
    try {
      const data = await api.admin.getListings();
      if (Array.isArray(data) && data.length > 0) {
        setListings(data);
      } else {
        setListings(SEED_LISTINGS);
      }
    } catch (err) {
      console.error('Error fetching admin listings:', err);
      setListings(SEED_LISTINGS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const handleOpenEdit = (listing: any) => {
    setEditingListing(listing);
    setEditFormData({
      title: listing.title || '',
      rent: listing.rent || 0,
      deposit: listing.deposit || 0,
      address: listing.address || '',
      city: listing.city || '',
      bedrooms: listing.bedrooms || 1,
      square_meters: listing.square_meters || 60,
      description: listing.description || '',
      is_active: listing.is_active !== undefined ? listing.is_active : true,
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingListing) return;

    setActionLoading(editingListing.id);
    try {
      await api.admin.updateListing(editingListing.id, editFormData);
      setEditingListing(null);
      await fetchListings();
    } catch (err: any) {
      alert(`Error al modificar anuncio: ${err.message || 'Error desconocido'}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleActive = async (listing: any) => {
    const nextActive = !listing.is_active;
    const confirmMsg = nextActive 
      ? `¿Reactivar el anuncio "${listing.title}" para que sea visible por inquilinos?`
      : `¿Bloquear / Pausar el anuncio "${listing.title}"? Dejará de mostrarse inmediatamente en la app.`;
    
    if (!window.confirm(confirmMsg)) return;

    setActionLoading(listing.id);
    try {
      await api.admin.toggleListingStatus(listing.id, nextActive);
      await fetchListings();
    } catch (err: any) {
      alert(`Error: ${err.message || 'No se pudo alternar el estado del anuncio'}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteListing = async (listing: any) => {
    if (!window.confirm(`¿Estás seguro de que deseas ELIMINAR definitivamente el anuncio "${listing.title}" de la base de datos? Esta acción no se puede deshacer.`)) {
      return;
    }

    setActionLoading(listing.id);
    try {
      await api.admin.deleteListing(listing.id);
      await fetchListings();
    } catch (err: any) {
      alert(`Error al eliminar anuncio: ${err.message || 'Error desconocido'}`);
    } finally {
      setActionLoading(null);
    }
  };

  // Filter listings
  const filteredListings = listings.filter((item) => {
    const matchesSearch = 
      item.title?.toLowerCase().includes(search.toLowerCase()) ||
      item.address?.toLowerCase().includes(search.toLowerCase()) ||
      item.city?.toLowerCase().includes(search.toLowerCase()) ||
      item.landlord_name?.toLowerCase().includes(search.toLowerCase()) ||
      item.landlord_email?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = 
      statusFilter === 'all' 
        ? true 
        : statusFilter === 'active' 
        ? item.is_active === true 
        : item.is_active === false;

    const matchesCity = 
      cityFilter === 'all' 
        ? true 
        : item.city?.toLowerCase() === cityFilter.toLowerCase();

    return matchesSearch && matchesStatus && matchesCity;
  });

  const cities = Array.from(new Set(listings.map(l => l.city).filter(Boolean)));

  return (
    <div className="space-y-6">
      {/* Top Banner and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-md">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <Home className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              Gestión Integral de Anuncios y Propiedades
            </h3>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Modera, modifica, bloquea o retira cualquier inmueble publicado en la base de datos de Rentia.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono text-slate-300">
            Total: <span className="text-amber-400 font-bold">{listings.length}</span> inmuebles
          </div>
          {/* Switcher vista Cuadrícula / Tabla */}
          <div className="flex items-center bg-slate-800 p-0.5 rounded-xl border border-slate-700">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                viewMode === 'grid' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
              title="Vista Explorador / Cuadrícula con fotos"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Explorar</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                viewMode === 'table' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
              title="Vista Tabla Administrativa"
            >
              <List className="w-3.5 h-3.5" />
              <span>Tabla</span>
            </button>
          </div>
          <button
            onClick={fetchListings}
            disabled={loading}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Recargar anuncios"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título, dirección, ciudad o propietario..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Status filter */}
          <div className="flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-lg transition-all ${
                statusFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Todos ({listings.length})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1 rounded-lg transition-all ${
                statusFilter === 'active' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Activos ({listings.filter(l => l.is_active).length})
            </button>
            <button
              onClick={() => setStatusFilter('blocked')}
              className={`px-3 py-1 rounded-lg transition-all ${
                statusFilter === 'blocked' ? 'bg-rose-600 text-white shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Bloqueados ({listings.filter(l => !l.is_active).length})
            </button>
          </div>

          {/* City filter */}
          {cities.length > 0 && (
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
            >
              <option value="all">Todas las ciudades ({cities.length})</option>
              {cities.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Listings Table / Cards */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold text-slate-600">Cargando catálogo completo de inmuebles...</p>
        </div>
      ) : filteredListings.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
          <Home className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm font-bold text-slate-700">No se encontraron inmuebles con los filtros aplicados</p>
          <p className="text-xs text-slate-500">Prueba a limpiar la búsqueda o cambiar de estado.</p>
        </div>
      ) : viewMode === 'grid' ? (
        /* VISTA EXPLORADOR CUADRÍCULA (Catálogo visual para moderadores y administradores) */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredListings.map((item, idx) => {
            const photos = Array.isArray(item.photos) && item.photos.length > 0 ? item.photos : ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop&q=80'];
            return (
              <div
                key={`${item.id}-${idx}`}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col group"
              >
                {/* Photo & badges */}
                <div className="relative h-44 bg-slate-100 overflow-hidden">
                  <img
                    src={photos[0]}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-slate-900/90 text-amber-400 backdrop-blur-xs shadow-xs">
                      {item.rent} €<span className="text-[10px] text-slate-300 font-normal">/mes</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-white/90 text-slate-700 backdrop-blur-xs">
                      📸 {photos.length}
                    </span>
                  </div>

                  <div className="absolute top-2.5 right-2.5">
                    {item.is_active ? (
                      <span className="px-2.5 py-1 rounded-xl text-[10px] font-black bg-emerald-600 text-white shadow-xs flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Activo
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-xl text-[10px] font-black bg-rose-600 text-white shadow-xs flex items-center gap-1">
                        <Ban className="w-3 h-3" /> Bloqueado
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => setInspectingListing(item)}
                    className="absolute bottom-2.5 right-2.5 px-3 py-1.5 rounded-xl bg-white/95 text-slate-900 text-xs font-bold shadow-md hover:bg-amber-400 transition-colors flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Ver ficha</span>
                  </button>
                </div>

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm line-clamp-1 group-hover:text-indigo-600 transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-1 truncate">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{item.city || 'Málaga'}, {item.address}</span>
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-slate-100">
                    <span className="flex items-center gap-1 font-semibold">
                      <Bed className="w-3.5 h-3.5 text-slate-400" /> {item.bedrooms || 1} hab.
                    </span>
                    <span className="flex items-center gap-1 font-semibold">
                      <Square className="w-3.5 h-3.5 text-slate-400" /> {item.square_meters || 70} m²
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Fianza: {item.deposit || item.rent}€
                    </span>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-xl flex items-center justify-between text-xs">
                    <div className="min-w-0 pr-2">
                      <p className="font-bold text-slate-800 text-[11px] truncate flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400 shrink-0" />
                        {item.landlord_name || 'Propietario Rentia'}
                      </p>
                      <p className="text-[10px] text-slate-500 font-mono truncate">{item.landlord_email || 'correo@rentia.es'}</p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-colors"
                        title="Modificar datos del anuncio"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleToggleActive(item)}
                        disabled={actionLoading === item.id}
                        className={`p-1.5 rounded-lg transition-colors ${
                          item.is_active
                            ? 'bg-amber-100 hover:bg-amber-200 text-amber-800'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        }`}
                        title={item.is_active ? 'Bloquear / Pausar' : 'Activar anuncio'}
                      >
                        {item.is_active ? <Ban className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        onClick={() => handleDeleteListing(item)}
                        disabled={actionLoading === item.id}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Eliminar anuncio definitivamente"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* VISTA TABLA ADMINISTRATIVA */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-bold tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Inmueble / Título</th>
                  <th className="py-3.5 px-4">Ubicación</th>
                  <th className="py-3.5 px-4">Precio & Espacio</th>
                  <th className="py-3.5 px-4">Propietario</th>
                  <th className="py-3.5 px-4">Estado</th>
                  <th className="py-3.5 px-4 text-right">Acciones de Moderación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredListings.map((item, idx) => (
                  <tr key={`${item.id}-${idx}`} className="hover:bg-slate-50/70 transition-colors">
                    {/* Title & Photo */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-11 rounded-lg overflow-hidden bg-slate-200 shrink-0 border border-slate-200 relative">
                          <img
                            src={Array.isArray(item.photos) && item.photos.length > 0 ? item.photos[0] : 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop&q=80'}
                            alt={item.title}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 truncate max-w-xs">{item.title}</p>
                          <p className="text-[10px] text-slate-400 font-mono">ID: {item.id.slice(0, 8)}...</p>
                        </div>
                      </div>
                    </td>

                    {/* Location */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-start gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-slate-800">{item.city || 'Málaga'}</p>
                          <p className="text-[11px] text-slate-500 truncate max-w-[180px]">{item.address}</p>
                        </div>
                      </div>
                    </td>

                    {/* Rent & Space */}
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900 text-sm">{item.rent} €<span className="text-[10px] text-slate-400 font-normal">/mes</span></p>
                      <p className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                        <span className="flex items-center gap-0.5"><Bed className="w-3 h-3" /> {item.bedrooms || 1} hab.</span>
                        <span className="flex items-center gap-0.5"><Square className="w-3 h-3" /> {item.square_meters || 75} m²</span>
                      </p>
                    </td>

                    {/* Landlord */}
                    <td className="py-3.5 px-4">
                      <div>
                        <p className="font-semibold text-slate-800 flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-400" />
                          {item.landlord_name || 'Propietario Rentia'}
                        </p>
                        <p className="text-[11px] text-slate-500 font-mono truncate max-w-[160px]">{item.landlord_email || 'correo@rentia.es'}</p>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      {item.is_active ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle className="w-3 h-3 text-emerald-600" /> Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                          <Ban className="w-3 h-3 text-rose-600" /> Bloqueado / Pausado
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Inspect details */}
                        <button
                          onClick={() => setInspectingListing(item)}
                          className="px-2 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors flex items-center gap-1"
                          title="Explorar ficha completa"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ver</span>
                        </button>

                        {/* Edit listing */}
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs transition-colors flex items-center gap-1"
                          title="Modificar datos del anuncio"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Modificar</span>
                        </button>

                        {/* Toggle active / block */}
                        <button
                          onClick={() => handleToggleActive(item)}
                          disabled={actionLoading === item.id}
                          className={`px-2.5 py-1.5 rounded-lg font-semibold text-xs transition-colors flex items-center gap-1 ${
                            item.is_active
                              ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-2xs'
                          }`}
                          title={item.is_active ? 'Bloquear / Ocultar anuncio' : 'Desbloquear anuncio'}
                        >
                          {item.is_active ? <Ban className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                          <span>{item.is_active ? 'Bloquear' : 'Activar'}</span>
                        </button>

                        {/* Delete listing */}
                        <button
                          onClick={() => handleDeleteListing(item)}
                          disabled={actionLoading === item.id}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Quitar / Eliminar anuncio definitivamente"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EDIT LISTING MODAL */}
      {editingListing && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 flex flex-col my-auto">
            <div className="bg-slate-900 text-white p-5 rounded-t-2xl flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-2.5">
                <Edit3 className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Modificar Anuncio (Modo Administrador)</h3>
              </div>
              <button
                onClick={() => setEditingListing(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Título del Anuncio</label>
                <input
                  type="text"
                  required
                  value={editFormData.title}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Precio de Alquiler (€ / mes)</label>
                  <input
                    type="number"
                    required
                    min={100}
                    value={editFormData.rent}
                    onChange={(e) => setEditFormData({ ...editFormData, rent: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Fianza (€)</label>
                  <input
                    type="number"
                    min={0}
                    value={editFormData.deposit}
                    onChange={(e) => setEditFormData({ ...editFormData, deposit: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Dirección</label>
                  <input
                    type="text"
                    required
                    value={editFormData.address}
                    onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Ciudad</label>
                  <input
                    type="text"
                    required
                    value={editFormData.city}
                    onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Habitaciones</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={editFormData.bedrooms}
                    onChange={(e) => setEditFormData({ ...editFormData, bedrooms: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Superficie (m²)</label>
                  <input
                    type="number"
                    min={10}
                    max={1000}
                    value={editFormData.square_meters}
                    onChange={(e) => setEditFormData({ ...editFormData, square_meters: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Descripción del Inmueble</label>
                <textarea
                  rows={3}
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-800">Estado de Publicación</p>
                  <p className="text-[11px] text-slate-500">Si está inactivo o bloqueado, ningún inquilino podrá verlo ni contactar.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editFormData.is_active}
                    onChange={(e) => setEditFormData({ ...editFormData, is_active: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingListing(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === editingListing.id}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-2 shadow-md"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar Cambios</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FULL INSPECTION MODAL (Ficha detallada del inmueble) */}
      {inspectingListing && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 flex flex-col my-auto">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 rounded-t-3xl flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white leading-tight">{inspectingListing.title}</h3>
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-400" />
                    <span>{inspectingListing.city || 'Málaga'}, {inspectingListing.address}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectingListing(null)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 text-slate-800 text-xs">
              {/* Photo Gallery Grid */}
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Galería Fotográfica ({Array.isArray(inspectingListing.photos) ? inspectingListing.photos.length : 1} fotos)
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 rounded-2xl overflow-hidden">
                  {(Array.isArray(inspectingListing.photos) && inspectingListing.photos.length > 0
                    ? inspectingListing.photos
                    : ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop&q=80']
                  ).map((pic: string, pIdx: number) => (
                    <div key={pIdx} className="relative h-32 sm:h-40 bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
                      <img
                        src={pic}
                        alt={`Foto ${pIdx + 1}`}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300 cursor-pointer"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Key Metrics Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Alquiler mensual</span>
                  <span className="text-lg font-black text-slate-900">{inspectingListing.rent} €/mes</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Fianza requerida</span>
                  <span className="text-lg font-black text-slate-900">{inspectingListing.deposit || inspectingListing.rent} €</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Habitaciones</span>
                  <span className="text-lg font-black text-slate-900">{inspectingListing.bedrooms || 1} hab.</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Superficie</span>
                  <span className="text-lg font-black text-slate-900">{inspectingListing.square_meters || 75} m²</span>
                </div>
              </div>

              {/* Description */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                <p className="font-bold text-slate-800 text-xs">Descripción Oficial</p>
                <p className="text-slate-600 leading-relaxed text-xs">
                  {inspectingListing.description || 'Vivienda totalmente equipada en alquiler, verificada para garantizar una experiencia óptima entre inquilino y propietario.'}
                </p>
              </div>

              {/* Landlord information */}
              <div className="p-4 rounded-2xl border border-indigo-100 bg-indigo-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                    {(inspectingListing.landlord_name || 'P').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{inspectingListing.landlord_name || 'Propietario Verificado'}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        ✓ Verificado
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">{inspectingListing.landlord_email || 'correo@rentia.es'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-indigo-700 font-semibold bg-white px-3 py-1.5 rounded-xl border border-indigo-200 shadow-2xs">
                    ID Propietario: {inspectingListing.landlord_id ? inspectingListing.landlord_id.slice(0, 8) : 'demo'}
                  </span>
                </div>
              </div>

              {/* Actions toolbar in modal */}
              <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const target = inspectingListing;
                      setInspectingListing(null);
                      handleOpenEdit(target);
                    }}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Modificar este anuncio</span>
                  </button>

                  <button
                    onClick={() => {
                      handleToggleActive(inspectingListing);
                      setInspectingListing(prev => prev ? { ...prev, is_active: !prev.is_active } : null);
                    }}
                    className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
                      inspectingListing.is_active
                        ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    }`}
                  >
                    {inspectingListing.is_active ? <Ban className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                    <span>{inspectingListing.is_active ? 'Pausar / Bloquear Anuncio' : 'Activar Anuncio'}</span>
                  </button>
                </div>

                <button
                  onClick={() => setInspectingListing(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
