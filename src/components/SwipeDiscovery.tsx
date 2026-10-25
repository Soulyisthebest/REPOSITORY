import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'motion/react';
import { 
  Heart, 
  X, 
  Sparkles, 
  MapPin, 
  Home, 
  ShieldCheck, 
  ChevronUp, 
  ChevronDown, 
  Calendar, 
  PawPrint, 
  BedDouble, 
  CheckCircle2, 
  Navigation as NavigationIcon, 
  Loader2, 
  RotateCcw,
  SlidersHorizontal,
  Filter,
  HeartOff,
  Euro,
  Check,
  Pencil,
  ZoomIn,
  ZoomOut,
  AlertCircle,
  Eye,
  Compass,
  Building2,
  Images
} from 'lucide-react';
import L from 'leaflet';
import { TenantProfile } from '../types';
import { Language, TRANSLATIONS } from '../i18n/translations';
import { api } from '../api/client';
import { ANDALUSIA_CITIES } from './CreateListingModal';
import { TenantPhotoGate } from './TenantPhotoGate';
import { SEED_LISTINGS } from '../data/seedListings';
import { detectOrActivateLocation, SPANISH_CITIES_CATALOG, SpanishCity, isPointInPolygon } from '../lib/locationService';
import { LocationPickerModal } from './LocationPickerModal';
import { PropertyDetailsModal } from './PropertyDetailsModal';

// Coordenadas aproximadas de las 8 capitales provinciales de Andalucía
const ANDALUSIA_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'Málaga': { lat: 36.7213, lng: -4.4214 },
  'Sevilla': { lat: 37.3891, lng: -5.9845 },
  'Granada': { lat: 37.1773, lng: -3.5986 },
  'Córdoba': { lat: 37.8882, lng: -4.7794 },
  'Cádiz': { lat: 36.5298, lng: -6.2924 },
  'Almería': { lat: 36.8381, lng: -2.4597 },
  'Huelva': { lat: 37.2614, lng: -6.9447 },
  'Jaén': { lat: 37.7796, lng: -3.7849 },
};

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ============================================================================
// MAPA INTERACTIVO PARA ESTADOS SIN VIVIENDAS DISPONIBLES (NUNCA PANTALLA EN BLANCO)
// ============================================================================
interface EmptyListingsMapProps {
  rawListings: any[];
  selectedCity: string;
  customZone: [number, number][] | null;
  customZoneCityName?: string;
  userCoords: { lat: number; lng: number } | null;
  reason: 'no_matches' | 'all_swiped';
  swipedCount: number;
  onResetFilters: () => void;
  onShowAllSpain: () => void;
  onOpenDrawZone: () => void;
  onSelectListingForDetail: (listing: any) => void;
  onStartSwipingListing: (listing: any) => void;
  onResetSwipes?: () => void;
}

const EmptyListingsMap: React.FC<EmptyListingsMapProps> = ({
  rawListings,
  selectedCity,
  customZone,
  customZoneCityName = '',
  userCoords,
  reason,
  swipedCount,
  onResetFilters,
  onShowAllSpain,
  onOpenDrawZone,
  onSelectListingForDetail,
  onStartSwipingListing,
  onResetSwipes,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const polygonLayerRef = useRef<L.Polygon | null>(null);
  const [selectedPinListing, setSelectedPinListing] = useState<any | null>(null);

  // Garantizar que siempre haya viviendas para mostrar en el mapa (NUNCA MAPA VACÍO)
  const displayListings = useMemo(() => {
    if (Array.isArray(rawListings) && rawListings.length > 0) {
      return rawListings;
    }
    return SEED_LISTINGS;
  }, [rawListings]);

  // Contar cuántas viviendas de la lista caen dentro del polígono trazado (si existe)
  const listingsInsidePolygonCount = useMemo(() => {
    if (!customZone || customZone.length < 3) return displayListings.length;
    return displayListings.filter((item) => {
      if (!item.latitude || !item.longitude) return false;
      return isPointInPolygon([item.latitude, item.longitude], customZone);
    }).length;
  }, [displayListings, customZone]);

  // Inicialización y actualización de marcadores en el mapa Leaflet
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Protección crítica: eliminar _leaflet_id huérfano si el nodo DOM fue reciclado
    if ((mapContainerRef.current as any)._leaflet_id && !mapInstanceRef.current) {
      delete (mapContainerRef.current as any)._leaflet_id;
    }

    const timer = setTimeout(() => {
      if (!mapContainerRef.current) return;

      let initialLat = 40.4168;
      let initialLng = -3.7038;
      let initialZoom = 6;

      if (userCoords) {
        initialLat = userCoords.lat;
        initialLng = userCoords.lng;
        initialZoom = 12;
      } else if (selectedCity && selectedCity !== 'all') {
        const found = SPANISH_CITIES_CATALOG.find(
          (c) => c.name.toLowerCase() === selectedCity.toLowerCase()
        );
        if (found) {
          initialLat = found.lat;
          initialLng = found.lng;
          initialZoom = 12;
        }
      }

      if (!mapInstanceRef.current) {
        if ((mapContainerRef.current as any)._leaflet_id) {
          delete (mapContainerRef.current as any)._leaflet_id;
        }

        const map = L.map(mapContainerRef.current, {
          center: [initialLat, initialLng],
          zoom: initialZoom,
          zoomControl: false,
        });

        const tileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
          maxZoom: 19,
          subdomains: 'abcd',
        });
        tileLayer.addTo(map);

        tileLayer.on('tileerror', () => {
          try {
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '&copy; OpenStreetMap contributors',
              maxZoom: 19,
            }).addTo(map);
          } catch {}
        });

        markersLayerRef.current = L.layerGroup().addTo(map);
        mapInstanceRef.current = map;
      }

      const map = mapInstanceRef.current;
      if (!map) return;

      // Forzar recálculo del tamaño de teselas en múltiples frames
      map.invalidateSize();
      setTimeout(() => map.invalidateSize(), 150);
      setTimeout(() => map.invalidateSize(), 400);

      // Dibujar polígono si el usuario trazó una zona personalizada
      if (polygonLayerRef.current) {
        map.removeLayer(polygonLayerRef.current);
        polygonLayerRef.current = null;
      }

      if (customZone && customZone.length >= 2) {
        const poly = L.polygon(customZone, {
          color: '#4F46E5',
          fillColor: '#6366F1',
          fillOpacity: 0.22,
          weight: 3,
          dashArray: '5, 5',
        }).addTo(map);
        polygonLayerRef.current = poly;

        const bounds = L.latLngBounds(customZone.map((p) => [p[0], p[1]]));
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
      } else if (selectedCity && selectedCity !== 'all') {
        const found = SPANISH_CITIES_CATALOG.find(
          (c) => c.name.toLowerCase() === selectedCity.toLowerCase()
        );
        if (found) {
          map.setView([found.lat, found.lng], 12);
        }
      } else {
        // Toda España: centrar vista en España
        map.setView([40.4168, -3.7038], 6);
      }

      // Dibujar pines con precios de las viviendas en España (NUNCA VACÍO)
      if (markersLayerRef.current) {
        markersLayerRef.current.clearLayers();

        displayListings.forEach((item) => {
          if (!item.latitude || !item.longitude) return;

          const isInsideZone = customZone && customZone.length >= 3
            ? isPointInPolygon([item.latitude, item.longitude], customZone)
            : true;

          const markerHtml = `
            <div style="
              background: ${isInsideZone ? '#1E1B4B' : '#334155'};
              color: white;
              padding: 3px 8px;
              border-radius: 9999px;
              font-size: 11px;
              font-weight: 800;
              box-shadow: 0 4px 10px rgba(0,0,0,0.3);
              border: 1.5px solid ${isInsideZone ? '#F59E0B' : '#94A3B8'};
              white-space: nowrap;
              cursor: pointer;
              transform: translate(-50%, -50%);
              display: flex;
              align-items: center;
              gap: 3px;
              transition: transform 0.15s ease;
            ">
              <span>${isInsideZone ? '🟢' : '📍'} ${item.rent}€</span>
            </div>
          `;

          const customIcon = L.divIcon({
            className: 'empty-map-price-marker',
            html: markerHtml,
            iconSize: [60, 24],
            iconAnchor: [30, 12],
          });

          const marker = L.marker([item.latitude, item.longitude], { icon: customIcon });
          marker.on('click', () => {
            setSelectedPinListing(item);
            map.panTo([item.latitude, item.longitude], { animate: true });
          });

          markersLayerRef.current?.addLayer(marker);
        });
      }
    }, 80);

    // Escuchar redimensionamiento de ventana
    const handleResize = () => {
      mapInstanceRef.current?.invalidateSize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, [displayListings, selectedCity, customZone, userCoords]);

  // Cleanup Leaflet on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      if (mapContainerRef.current) {
        delete (mapContainerRef.current as any)._leaflet_id;
      }
    };
  }, []);

  return (
    <div className="w-full flex flex-col space-y-4 animate-fade-in" id="empty-state-map-wrapper">
      {/* MAP CONTAINER */}
      <div className="relative w-full h-[360px] sm:h-[420px] rounded-3xl overflow-hidden border border-stone-300 shadow-md bg-stone-100">
        <div 
          ref={mapContainerRef} 
          className="w-full h-full min-h-[360px] z-10" 
          style={{ height: '100%', minHeight: '360px', width: '100%' }}
        />

        {/* Floating Header Banner */}
        <div className="absolute top-3 left-3 right-3 sm:left-4 sm:right-auto z-20 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-lg border border-stone-200 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="font-extrabold text-[#1E1B4B]">
              {customZone && customZone.length >= 3 && listingsInsidePolygonCount === 0
                ? `0 pisos en zona trazada • Mostrando ${displayListings.length} en España`
                : `Mapa activo • ${displayListings.length} viviendas disponibles`}
            </span>
          </div>
          <span className="text-[10px] text-stone-500 font-bold bg-stone-100 px-2 py-0.5 rounded-full shrink-0">
            Toca un precio
          </span>
        </div>

        {/* Floating Zoom & Center Controls */}
        <div className="absolute right-3 bottom-3 z-20 flex flex-col gap-1 bg-white/95 backdrop-blur-md p-1 rounded-2xl shadow-lg border border-stone-200">
          <button
            type="button"
            onClick={() => mapInstanceRef.current?.zoomIn()}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-stone-700 hover:bg-stone-100 font-black text-sm"
            title="Acercar zoom"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <div className="h-px bg-stone-200 mx-1" />
          <button
            type="button"
            onClick={() => mapInstanceRef.current?.zoomOut()}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-stone-700 hover:bg-stone-100 font-black text-sm"
            title="Alejar zoom"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <div className="h-px bg-stone-200 mx-1" />
          <button
            type="button"
            onClick={() => {
              if (mapInstanceRef.current) {
                mapInstanceRef.current.setView([40.4168, -3.7038], 6);
                mapInstanceRef.current.invalidateSize();
              }
            }}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-stone-700 hover:bg-stone-100 font-black text-xs"
            title="Centrar en España"
          >
            <Compass className="w-4 h-4 text-amber-600" />
          </button>
        </div>

        {/* Floating Card for Selected Pin */}
        {selectedPinListing && (
          <div className="absolute bottom-3 left-3 right-12 sm:right-auto sm:w-80 z-20 bg-white rounded-2xl p-3 shadow-2xl border border-stone-200 animate-slide-up flex gap-3 items-center">
            <img
              src={selectedPinListing.photos?.[0] || selectedPinListing.images?.[0] || 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400'}
              alt={selectedPinListing.title}
              className="w-16 h-16 rounded-xl object-cover shrink-0 border border-stone-200"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-[#1E1B4B]">
                  {selectedPinListing.rent} €/mes
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedPinListing(null)}
                  className="text-stone-400 hover:text-stone-600 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-[11px] text-stone-600 truncate font-semibold">
                {selectedPinListing.title || selectedPinListing.city}
              </p>
              <p className="text-[10px] text-stone-400">
                {selectedPinListing.city} • {selectedPinListing.rooms_count || selectedPinListing.bedrooms || 2} hab.
              </p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <button
                  type="button"
                  onClick={() => onSelectListingForDetail(selectedPinListing)}
                  className="px-2 py-0.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-[#1E1B4B] text-[10px] font-bold"
                >
                  Ver detalles
                </button>
                <button
                  type="button"
                  onClick={() => onStartSwipingListing(selectedPinListing)}
                  className="px-2 py-0.5 rounded-lg bg-[#1E1B4B] text-white text-[10px] font-bold hover:bg-[#28235C]"
                >
                  Explorar piso
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* EXPLANATORY ACTION CARD (NO DEJAR EN BLANCO) */}
      <div className="w-full bg-white p-5 rounded-3xl border border-stone-200 shadow-xs space-y-3.5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="inline-block px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-900 font-bold text-[11px] mb-1 border border-amber-200">
              {reason === 'all_swiped' 
                ? 'Has explorado todas las viviendas de esta zona'
                : `0 viviendas con estos filtros en ${selectedCity === 'all' ? 'esta búsqueda' : selectedCity}`}
            </div>
            <h3 className="text-sm font-black text-[#1E1B4B]">
              No te quedes en blanco: explora alternativas en el mapa
            </h3>
            <p className="text-xs text-stone-500 leading-relaxed mt-0.5">
              {customZone && customZone.length >= 3
                ? `La zona trazada en ${customZoneCityName || 'el mapa'} no tiene pisos con tus filtros. Mostramos las ${rawListings.length} viviendas activas en el mapa para que amplíes o elijas otra zona.`
                : `No hay pisos disponibles con los filtros actuales en ${selectedCity}. Hemos activado el mapa interactivo con ${rawListings.length} viviendas disponibles en otras zonas de España.`}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
          <button
            type="button"
            onClick={onShowAllSpain}
            className="py-2.5 px-3 bg-[#1E1B4B] hover:bg-[#28235C] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
            id="btn-empty-show-all-spain"
          >
            <MapPin className="w-3.5 h-3.5 text-amber-400" />
            <span>Ver toda España ({rawListings.length})</span>
          </button>

          <button
            type="button"
            onClick={onOpenDrawZone}
            className="py-2.5 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-950 border border-indigo-200 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
            id="btn-empty-draw-zone"
          >
            <Pencil className="w-3.5 h-3.5 text-indigo-600" />
            <span>Dibujar otra zona</span>
          </button>

          <button
            type="button"
            onClick={onResetFilters}
            className="py-2.5 px-3 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
            id="btn-empty-reset-filters"
          >
            <RotateCcw className="w-3.5 h-3.5 text-stone-500" />
            <span>Restablecer filtros</span>
          </button>
        </div>

        {swipedCount > 0 && onResetSwipes && (
          <button
            type="button"
            onClick={onResetSwipes}
            className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 border border-rose-200"
          >
            <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
            <span>Revisar pisos ya explorados ({swipedCount} viviendas)</span>
          </button>
        )}
      </div>

      {/* SUGGESTED LISTINGS ROW (VIVIENDAS DISPONIBLES EN OTRAS CIUDADES) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-black text-[#1E1B4B] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Viviendas disponibles en España</span>
          </span>
          <span className="text-[11px] text-stone-400 font-semibold">
            {rawListings.length} opciones
          </span>
        </div>

        <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-thin">
          {rawListings.slice(0, 6).map((item) => (
            <div
              key={item.id}
              onClick={() => {
                if (mapInstanceRef.current && item.latitude && item.longitude) {
                  mapInstanceRef.current.flyTo([item.latitude, item.longitude], 13, { duration: 0.8 });
                  setSelectedPinListing(item);
                }
              }}
              className="shrink-0 w-52 bg-white rounded-2xl p-2.5 border border-stone-200/80 shadow-2xs hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="relative h-28 rounded-xl overflow-hidden bg-stone-100 mb-2">
                <img
                  src={item.photos?.[0] || item.images?.[0] || 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400'}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute bottom-1.5 left-1.5 bg-[#1E1B4B]/90 backdrop-blur-xs text-white text-[10px] font-black px-2 py-0.5 rounded-md">
                  {item.rent} €/mes
                </span>
                <span className="absolute top-1.5 right-1.5 bg-white/90 backdrop-blur-xs text-stone-800 text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                  {item.city}
                </span>
              </div>
              <p className="text-xs font-bold text-[#1E1B4B] truncate leading-tight mb-1">
                {item.title}
              </p>
              <div className="flex items-center justify-between text-[10px] text-stone-500">
                <span>{item.rooms_count || item.bedrooms || 2} hab. • {item.surface_sqm || 65} m²</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectListingForDetail(item);
                  }}
                  className="font-bold text-[#1E1B4B] hover:underline"
                >
                  Detalles →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

interface SwipeDiscoveryProps {
  tenant: TenantProfile;
  language: Language;
  onOpenPassportTab?: () => void;
  onNavigateToChat?: () => void;
  onOpenQuiz?: () => void;
  onPhotosUpdated?: (photos: string[]) => void;
  currentUserEmail?: string;
}

export const SwipeDiscovery: React.FC<SwipeDiscoveryProps> = ({
  tenant,
  language,
  onOpenPassportTab,
  onNavigateToChat,
  onOpenQuiz,
  onPhotosUpdated,
  currentUserEmail,
}) => {
  const t = TRANSLATIONS[language];
  const [rawListings, setRawListings] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('rentia_listings_cache');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return SEED_LISTINGS;
  });
  const [swipedListingIds, setSwipedListingIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(`rentia_swiped_${tenant.id || 'demo'}`);
      if (saved) {
        return new Set(JSON.parse(saved));
      }
    } catch {}
    return new Set();
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [matchedListing, setMatchedListing] = useState<any | null>(null);
  const [compatibility, setCompatibility] = useState<any | null>(null);
  const [showDetailsSheet, setShowDetailsSheet] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [modalListing, setModalListing] = useState<any | null>(null);

  // Andalusia City Filter and Geolocation State
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [radiusKm, setRadiusKm] = useState<number>(30);
  const [isLocating, setIsLocating] = useState(false);
  const [geoToast, setGeoToast] = useState<string | null>(null);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [locationModalInitialTab, setLocationModalInitialTab] = useState<'draw' | 'list'>('draw');
  const [customZone, setCustomZone] = useState<[number, number][] | null>(() => {
    if (tenant.customPolygon && Array.isArray(tenant.customPolygon) && tenant.customPolygon.length >= 3) {
      return tenant.customPolygon;
    }
    return null;
  });
  const [customZoneCityName, setCustomZoneCityName] = useState<string>(tenant.targetCity || '');

  // Deterministic Filters State
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [minPrice, setMinPrice] = useState<number | null>(null);
  const [minBedrooms, setMinBedrooms] = useState<number | null>(null);
  const [propertyType, setPropertyType] = useState<string>('all');
  const [petsAllowed, setPetsAllowed] = useState<boolean>(false);
  const [furnishedOnly, setFurnishedOnly] = useState<boolean>(false);
  const [elevatorOnly, setElevatorOnly] = useState<boolean>(false);

  // Exclusión de propiedades ya vistas por inquilinos en explorar
  const [hideInteracted, setHideInteracted] = useState<boolean>(true);

  // Motion values for swipe drag
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-12, 12]);
  const opacityLike = useTransform(x, [30, 150], [0, 1]);
  const opacityPass = useTransform(x, [-30, -150], [0, 1]);

  // Load existing swiped IDs for this tenant
  useEffect(() => {
    const loadSwiped = async () => {
      if (tenant.id) {
        try {
          const res = await api.matching.getSwipedIds(tenant.id);
          if (res?.all && Array.isArray(res.all)) {
            setSwipedListingIds(prev => {
              const merged = new Set([...prev, ...res.all]);
              try {
                localStorage.setItem(`rentia_swiped_${tenant.id}`, JSON.stringify(Array.from(merged)));
              } catch {}
              return merged;
            });
          }
        } catch (err) {
          console.warn('Error fetching swiped IDs:', err);
        }
      }
    };
    loadSwiped();
  }, [tenant.id]);

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const data = await api.matching.getListings({
        include_inactive: false,
        status: 'available',
      });
      if (Array.isArray(data) && data.length > 0) {
        const seen = new Set<string>();
        const uniqueData = data.filter((l) => {
          if (!l?.id || seen.has(l.id)) return false;
          if (l.is_active === false || l.status === 'rented' || l.status === 'inactive') return false;
          seen.add(l.id);
          return true;
        });
        setRawListings(uniqueData);
      } else {
        const seen = new Set<string>();
        const uniqueFallback = SEED_LISTINGS.filter((l) => {
          if (!l?.id || seen.has(l.id)) return false;
          seen.add(l.id);
          return true;
        });
        setRawListings(uniqueFallback);
      }
    } catch (err) {
      console.error('Error fetching listings:', err);
      const seen = new Set<string>();
      const uniqueFallback = SEED_LISTINGS.filter((l) => {
        if (!l?.id || seen.has(l.id)) return false;
        seen.add(l.id);
        return true;
      });
      setRawListings(uniqueFallback);
    } finally {
      setCurrentIndex(0);
      setLoading(false);
    }
  };

  // Deterministic Filtering Algorithm
  const filteredListings = useMemo(() => {
    const filtered = rawListings.filter((l) => {
      if (!l || l.is_active === false || l.status === 'rented' || l.status === 'inactive') {
        return false;
      }

      // Hide properties with like or quit unless the user specifically disabled hideInteracted
      if (hideInteracted && swipedListingIds.has(l.id)) {
        return false;
      }

      // Custom Drawn Zone Polygon filter (Idealista style)
      if (customZone && customZone.length >= 3) {
        if (!l.latitude || !l.longitude || !isPointInPolygon([l.latitude, l.longitude], customZone)) {
          return false;
        }
      }

      // City & Proximity filter (only when customZone is not active)
      if ((!customZone || customZone.length < 3) && selectedCity && selectedCity !== 'all') {
        const lCity = (l.city || '').toLowerCase();
        const targetCityLower = selectedCity.toLowerCase();
        const isCityMatch = lCity.includes(targetCityLower) || targetCityLower.includes(lCity);

        let isDistanceMatch = false;
        if (userCoords && l.latitude && l.longitude) {
          const dist = calculateDistance(userCoords.lat, userCoords.lng, l.latitude, l.longitude);
          if (dist <= (radiusKm || 50)) {
            isDistanceMatch = true;
          }
        }

        if (!isCityMatch && !isDistanceMatch) {
          return false;
        }
      }

      // Price filter
      const rent = Number(l.rent) || 0;
      if (minPrice !== null && rent < minPrice) return false;
      if (maxPrice !== null && rent > maxPrice) return false;

      // Bedrooms filter
      const beds = Number(l.bedrooms || l.rooms_count) || 1;
      if (minBedrooms !== null && beds < minBedrooms) return false;

      // Property type filter
      if (propertyType && propertyType !== 'all') {
        const pt = (l.property_type || '').toLowerCase();
        const targetPt = propertyType.toLowerCase();
        if (!pt.includes(targetPt) && !targetPt.includes(pt)) {
          return false;
        }
      }

      // Pets allowed filter
      if (petsAllowed && !l.pets_allowed) return false;

      // Furnished filter
      if (furnishedOnly && !l.is_furnished && !l.furnished) return false;

      // Elevator filter
      if (elevatorOnly && !l.elevator) return false;

      return true;
    });

    // If user coordinates are known, sort listings by proximity (closest first)
    if (userCoords) {
      return [...filtered].sort((a, b) => {
        if (!a.latitude || !a.longitude) return 1;
        if (!b.latitude || !b.longitude) return -1;
        const distA = calculateDistance(userCoords.lat, userCoords.lng, a.latitude, a.longitude);
        const distB = calculateDistance(userCoords.lat, userCoords.lng, b.latitude, b.longitude);
        return distA - distB;
      });
    }

    return filtered;
  }, [
    rawListings,
    swipedListingIds,
    hideInteracted,
    selectedCity,
    customZone,
    minPrice,
    maxPrice,
    minBedrooms,
    propertyType,
    petsAllowed,
    furnishedOnly,
    elevatorOnly,
    userCoords,
    radiusKm,
  ]);

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedCity !== 'all') count++;
    if (customZone && customZone.length >= 3) count++;
    if (minPrice !== null) count++;
    if (maxPrice !== null) count++;
    if (minBedrooms !== null) count++;
    if (propertyType !== 'all') count++;
    if (petsAllowed) count++;
    if (furnishedOnly) count++;
    if (elevatorOnly) count++;
    if (!hideInteracted) count++;
    return count;
  }, [
    selectedCity,
    customZone,
    minPrice,
    maxPrice,
    minBedrooms,
    propertyType,
    petsAllowed,
    furnishedOnly,
    elevatorOnly,
    hideInteracted,
  ]);

  // Reset index when filters change
  useEffect(() => {
    setCurrentIndex(0);
  }, [
    selectedCity,
    customZone,
    minPrice,
    maxPrice,
    minBedrooms,
    propertyType,
    petsAllowed,
    furnishedOnly,
    elevatorOnly,
    hideInteracted,
  ]);

  const handleResetFilters = () => {
    setSelectedCity('all');
    setCustomZone(null);
    setCustomZoneCityName('');
    setMinPrice(null);
    setMaxPrice(null);
    setMinBedrooms(null);
    setPropertyType('all');
    setPetsAllowed(false);
    setFurnishedOnly(false);
    setElevatorOnly(false);
    setHideInteracted(true);
    setCurrentIndex(0);
    setGeoToast('Filtros restablecidos');
    setTimeout(() => setGeoToast(null), 2500);
  };

  const handleActivateGeolocation = async () => {
    setIsLocating(true);
    try {
      const res = await detectOrActivateLocation();
      setUserCoords({ lat: res.lat, lng: res.lng });

      const cityMatches = rawListings.filter((l) =>
        (l.city || '').toLowerCase().includes(res.city.toLowerCase()) ||
        res.city.toLowerCase().includes((l.city || '').toLowerCase())
      );

      if (cityMatches.length > 0) {
        setSelectedCity(res.city);
        setGeoToast(`📍 Ubicación activada: ${res.city} (${cityMatches.length} pisos)`);
      } else {
        setSelectedCity('all');
        setGeoToast(`📍 Ubicación activada: ${res.city}. Mostrando inmuebles ordenados por cercanía.`);
      }
      setCurrentIndex(0);
      setTimeout(() => setGeoToast(null), 3500);
    } catch {
      setIsLocationModalOpen(true);
    } finally {
      setIsLocating(false);
    }
  };

  const currentListing = filteredListings[currentIndex];

  useEffect(() => {
    if (currentListing && tenant.id) {
      api.matching.getCompatibility(currentListing.id, tenant.id)
        .then(res => setCompatibility(res))
        .catch(() => setCompatibility(null));
      setActiveImageIndex(0);
      setShowDetailsSheet(false);
    }
  }, [currentIndex, currentListing?.id, tenant.id]);

  const handleSwipe = async (direction: 'left' | 'right') => {
    if (!currentListing) return;
    const listingIdToSwipe = currentListing.id;
    setSwipeDirection(direction);
    setShowDetailsSheet(false);

    // Save swiped id immediately so it is excluded from future explore views
    setSwipedListingIds((prev) => {
      const updated = new Set(prev);
      updated.add(listingIdToSwipe);
      try {
        localStorage.setItem(`rentia_swiped_${tenant.id || 'demo'}`, JSON.stringify(Array.from(updated)));
      } catch {}
      return updated;
    });

    try {
      const res = await api.matching.swipe({
        actorId: tenant.id || 'anonymous_tenant',
        actorRole: 'tenant',
        listingId: listingIdToSwipe,
        targetUserId: currentListing.landlord_id || 'landlord_01',
        action: direction === 'right' ? 'like' : 'pass',
      });

      if (direction === 'right' && res.isMatch) {
        setMatchedListing(currentListing);
      }
    } catch (err) {
      console.error('Error swipe:', err);
    }

    setTimeout(() => {
      setSwipeDirection(null);
      setCurrentIndex(prev => prev + 1);
      x.set(0);
    }, 220);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-6">
        <div className="w-10 h-10 border-3 border-[#1E1B4B] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs font-semibold text-[#1E1B4B]/70 tracking-wide uppercase">
          {t.searchingListings}
        </p>
      </div>
    );
  }

  // TOP TOOLBAR CON FILTROS Y CONTADOR EN TIEMPO REAL
  const renderFilterAndCityBar = () => (
    <div className="w-full bg-white p-2.5 rounded-2xl border border-stone-200 shadow-2xs mb-2.5 flex items-center justify-between gap-2">
      {/* City Selector & Location Picker Trigger */}
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        {customZone && customZone.length >= 3 ? (
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-indigo-50 border border-indigo-200 text-[#1E1B4B] max-w-full truncate">
            <Pencil className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <button
              type="button"
              onClick={() => {
                setLocationModalInitialTab('draw');
                setIsLocationModalOpen(true);
              }}
              className="text-xs font-bold text-indigo-900 truncate hover:underline"
              title="Ver o editar zona dibujada"
            >
              Zona dibujada ({filteredListings.length} pisos)
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setCustomZone(null);
                setCustomZoneCityName('');
                setGeoToast('Zona eliminada');
                setTimeout(() => setGeoToast(null), 2500);
              }}
              className="text-stone-400 hover:text-rose-600 font-black text-xs px-1"
              title="Eliminar zona dibujada"
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              setLocationModalInitialTab('list');
              setIsLocationModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl hover:bg-stone-100 transition-colors max-w-full truncate text-left"
            id="btn-open-city-picker"
            title="Buscar o cambiar ubicación en España"
          >
            <MapPin className="w-3.5 h-3.5 text-[#D97706] shrink-0" />
            <span className="text-xs font-bold text-[#1E1B4B] truncate">
              {selectedCity === 'all' ? t.allCitiesAndalusia : selectedCity}
            </span>
            <span className="text-[10px] text-stone-400 font-medium">▼</span>
          </button>
        )}

        {/* 1-Click Dibujar Zona Shortcut */}
        {(!customZone || customZone.length < 3) && (
          <button
            type="button"
            onClick={() => {
              setLocationModalInitialTab('draw');
              setIsLocationModalOpen(true);
            }}
            className="px-2 py-1.5 rounded-xl bg-indigo-50/80 hover:bg-indigo-100 text-indigo-900 text-[11px] font-bold transition-colors flex items-center gap-1 shrink-0 border border-indigo-200"
            id="btn-draw-zone-shortcut"
            title="Dibujar zona de búsqueda personalizada en el mapa"
          >
            <Pencil className="w-3 h-3 text-indigo-600" />
            <span className="hidden sm:inline">Dibujar zona</span>
          </button>
        )}
      </div>

      {/* Geolocation Button */}
      <button
        type="button"
        onClick={handleActivateGeolocation}
        disabled={isLocating}
        className="px-2 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-[#1E1B4B] text-[11px] font-bold transition-colors flex items-center gap-1 shrink-0 disabled:opacity-50"
        id="btn-activate-geolocation"
        title={t.geolocationBtn}
      >
        {isLocating ? (
          <Loader2 className="w-3 h-3 animate-spin text-[#0FA3A3]" />
        ) : (
          <NavigationIcon className="w-3 h-3 text-[#0FA3A3]" />
        )}
        <span className="hidden sm:inline">{isLocating ? t.locatingUser : t.geolocationBtn}</span>
      </button>

      {/* Open Filters Modal Button */}
      <button
        type="button"
        onClick={() => setShowFilterModal(true)}
        className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
          activeFiltersCount > 0
            ? 'bg-[#1E1B4B] text-white shadow-xs'
            : 'bg-stone-100 hover:bg-stone-200 text-[#1E1B4B]'
        }`}
        id="btn-open-filters"
      >
        <SlidersHorizontal className="w-3.5 h-3.5" />
        <span>Filtros</span>
        <span
          className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
            filteredListings.length === 0
              ? 'bg-rose-500 text-white'
              : activeFiltersCount > 0
              ? 'bg-amber-400 text-stone-900'
              : 'bg-stone-200 text-stone-700'
          }`}
          title={`${filteredListings.length} propiedades con los filtros seleccionados`}
        >
          {filteredListings.length}
        </span>
      </button>
    </div>
  );

  // ÉTAT VIDE EXACTO SI 0 PROPIEDADES COINCIDEN CON LOS FILTROS (MAPA SIEMPRE PRESENTE)
  if (filteredListings.length === 0) {
    return (
      <div className="max-w-2xl mx-auto relative px-2 sm:px-4 flex flex-col items-center select-none min-h-[75vh] space-y-3 pb-8">
        {/* Toast */}
        {geoToast && (
          <div className="fixed top-20 z-50 bg-[#1E1B4B] text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold animate-fade-in border border-[#D97706]">
            <MapPin className="w-4 h-4 text-[#D97706]" />
            <span>{geoToast}</span>
          </div>
        )}

        {/* City and Filter bar always accessible */}
        {renderFilterAndCityBar()}

        {/* MAPA INTERACTIVO INTEGRADO CON VIVIENDAS EN ESPAÑA */}
        <EmptyListingsMap
          rawListings={rawListings}
          selectedCity={selectedCity}
          customZone={customZone}
          customZoneCityName={customZoneCityName}
          userCoords={userCoords}
          reason="no_matches"
          swipedCount={swipedListingIds.size}
          onResetFilters={handleResetFilters}
          onShowAllSpain={() => {
            setSelectedCity('all');
            setCustomZone(null);
            setCustomZoneCityName('');
            setCurrentIndex(0);
            setGeoToast('📍 Mostrando viviendas en toda España');
            setTimeout(() => setGeoToast(null), 3000);
          }}
          onOpenDrawZone={() => {
            setLocationModalInitialTab('draw');
            setIsLocationModalOpen(true);
          }}
          onSelectListingForDetail={(l) => setModalListing(l)}
          onStartSwipingListing={(l) => {
            if (l.city) {
              setSelectedCity(l.city);
              setCustomZone(null);
              setCustomZoneCityName('');
            }
            setCurrentIndex(0);
          }}
          onResetSwipes={() => {
            setHideInteracted(false);
            setCurrentIndex(0);
          }}
        />

        {/* Filter Drawer / Modal */}
        {renderFilterModal()}

        {/* Location Picker & Activation Modal with Interactive Zone Drawing */}
        <LocationPickerModal
          isOpen={isLocationModalOpen}
          onClose={() => setIsLocationModalOpen(false)}
          selectedCity={selectedCity}
          initialTab={locationModalInitialTab}
          customPolygon={customZone}
          listings={rawListings}
          onSelectCity={(city: SpanishCity) => {
            setCustomZone(null);
            setCustomZoneCityName('');
            if (city.name === 'all' || city.name.toLowerCase() === 'toda españa') {
              setSelectedCity('all');
              setGeoToast('📍 Mostrando toda España');
            } else {
              setSelectedCity(city.name);
              setGeoToast(`📍 Ubicación seleccionada: ${city.name}`);
            }
            setUserCoords({ lat: city.lat, lng: city.lng });
            setCurrentIndex(0);
            setTimeout(() => setGeoToast(null), 3000);
          }}
          onSelectCustomZone={(polygon, approxCity) => {
            setCustomZone(polygon);
            setCustomZoneCityName(approxCity);
            setSelectedCity('all');
            const avgLat = polygon.reduce((acc, p) => acc + p[0], 0) / polygon.length;
            const avgLng = polygon.reduce((acc, p) => acc + p[1], 0) / polygon.length;
            setUserCoords({ lat: avgLat, lng: avgLng });
            setCurrentIndex(0);
            setGeoToast(`✏️ Zona de alquiler dibujada aplicada (${approxCity})`);
            setTimeout(() => setGeoToast(null), 3500);
          }}
        />

        {/* Property Details Modal */}
        {modalListing && (
          <PropertyDetailsModal
            listing={modalListing}
            isOpen={!!modalListing}
            onClose={() => setModalListing(null)}
            onLike={() => {
              handleSwipe('right');
              setModalListing(null);
            }}
            language={language}
          />
        )}
      </div>
    );
  }

  // Écran quand tous les logements filtrés ont été vus (MAPA SIEMPRE PRESENTE)
  if (currentIndex >= filteredListings.length || !currentListing) {
    return (
      <div className="max-w-2xl mx-auto relative px-2 sm:px-4 flex flex-col items-center select-none min-h-[75vh] space-y-3 pb-8">
        {/* Toast */}
        {geoToast && (
          <div className="fixed top-20 z-50 bg-[#1E1B4B] text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold animate-fade-in border border-[#D97706]">
            <MapPin className="w-4 h-4 text-[#D97706]" />
            <span>{geoToast}</span>
          </div>
        )}

        {/* City and Filter bar always accessible */}
        {renderFilterAndCityBar()}

        {/* MAPA INTERACTIVO INTEGRADO CON VIVIENDAS EN ESPAÑA */}
        <EmptyListingsMap
          rawListings={rawListings}
          selectedCity={selectedCity}
          customZone={customZone}
          customZoneCityName={customZoneCityName}
          userCoords={userCoords}
          reason="all_swiped"
          swipedCount={swipedListingIds.size}
          onResetFilters={handleResetFilters}
          onShowAllSpain={() => {
            setSelectedCity('all');
            setCustomZone(null);
            setCustomZoneCityName('');
            setCurrentIndex(0);
            setGeoToast('📍 Mostrando viviendas en toda España');
            setTimeout(() => setGeoToast(null), 3000);
          }}
          onOpenDrawZone={() => {
            setLocationModalInitialTab('draw');
            setIsLocationModalOpen(true);
          }}
          onSelectListingForDetail={(l) => setModalListing(l)}
          onStartSwipingListing={(l) => {
            if (l.city) {
              setSelectedCity(l.city);
              setCustomZone(null);
              setCustomZoneCityName('');
            }
            setCurrentIndex(0);
          }}
          onResetSwipes={() => {
            setHideInteracted(false);
            setCurrentIndex(0);
          }}
        />

        {/* Filter Drawer / Modal */}
        {renderFilterModal()}

        {/* Location Picker & Activation Modal with Interactive Zone Drawing */}
        <LocationPickerModal
          isOpen={isLocationModalOpen}
          onClose={() => setIsLocationModalOpen(false)}
          selectedCity={selectedCity}
          initialTab={locationModalInitialTab}
          customPolygon={customZone}
          listings={rawListings}
          onSelectCity={(city: SpanishCity) => {
            setCustomZone(null);
            setCustomZoneCityName('');
            if (city.name === 'all' || city.name.toLowerCase() === 'toda españa') {
              setSelectedCity('all');
              setGeoToast('📍 Mostrando toda España');
            } else {
              setSelectedCity(city.name);
              setGeoToast(`📍 Ubicación seleccionada: ${city.name}`);
            }
            setUserCoords({ lat: city.lat, lng: city.lng });
            setCurrentIndex(0);
            setTimeout(() => setGeoToast(null), 3000);
          }}
          onSelectCustomZone={(polygon, approxCity) => {
            setCustomZone(polygon);
            setCustomZoneCityName(approxCity);
            setSelectedCity('all');
            const avgLat = polygon.reduce((acc, p) => acc + p[0], 0) / polygon.length;
            const avgLng = polygon.reduce((acc, p) => acc + p[1], 0) / polygon.length;
            setUserCoords({ lat: avgLat, lng: avgLng });
            setCurrentIndex(0);
            setGeoToast(`✏️ Zona de alquiler dibujada aplicada (${approxCity})`);
            setTimeout(() => setGeoToast(null), 3500);
          }}
        />

        {/* Property Details Modal */}
        {modalListing && (
          <PropertyDetailsModal
            listing={modalListing}
            isOpen={!!modalListing}
            onClose={() => setModalListing(null)}
            onLike={() => {
              handleSwipe('right');
              setModalListing(null);
            }}
            language={language}
          />
        )}
      </div>
    );
  }

  // Sin bloqueos: el inquilino puede explorar viviendas y consultar el mapa libremente
  const tenantPhotos = tenant?.photos || [];

  function renderFilterModal() {
    if (!showFilterModal) return null;

    return (
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
        <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4 max-h-[90vh] overflow-y-auto">
          {/* Modal Header */}
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#1E1B4B] text-white flex items-center justify-center">
                <SlidersHorizontal className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <h3 className="text-sm font-black text-[#1E1B4B]">Filtros de Búsqueda</h3>
                <p className="text-[11px] text-stone-400">Personaliza exactamente los inmuebles que deseas ver</p>
              </div>
            </div>
            <button
              onClick={() => setShowFilterModal(false)}
              className="w-7 h-7 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 flex items-center justify-center"
            >
              ✕
            </button>
          </div>

          {/* Ocultar pisos con like o descarte (Requisito clave) */}
          <div className="bg-rose-50/70 p-3.5 rounded-2xl border border-rose-200/80 space-y-1.5">
            <label className="flex items-center justify-between cursor-pointer select-none">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 font-bold text-xs text-rose-950">
                  <HeartOff className="w-3.5 h-3.5 text-rose-600" />
                  <span>Ocultar pisos con like o quitados</span>
                </div>
                <p className="text-[10px] text-rose-700 leading-snug">
                  {hideInteracted 
                    ? 'Activado: Solo se muestran pisos nuevos no explorados ni descartados.' 
                    : 'Desactivado: Mostrando todos los pisos incluidos los ya vistos.'}
                </p>
              </div>
              <input
                type="checkbox"
                checked={hideInteracted}
                onChange={(e) => setHideInteracted(e.target.checked)}
                className="w-4 h-4 accent-[#1E1B4B] rounded cursor-pointer ml-3 shrink-0"
              />
            </label>
          </div>

          {/* Ciudad */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-stone-700">Ciudad de Andalucía</label>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full text-xs font-bold text-[#1E1B4B] p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">Todas las capitales de Andalucía</option>
              {ANDALUSIA_CITIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Rango de Precio */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-stone-700">Precio Máximo de Renta (€/mes)</label>
            <div className="grid grid-cols-3 gap-1.5">
              {[null, 700, 900, 1100, 1300, 1600].map((val) => (
                <button
                  key={val === null ? 'any' : val}
                  type="button"
                  onClick={() => setMaxPrice(val)}
                  className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all border ${
                    maxPrice === val
                      ? 'bg-[#1E1B4B] text-white border-[#1E1B4B]'
                      : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                  }`}
                >
                  {val === null ? 'Sin tope' : `Hasta ${val}€`}
                </button>
              ))}
            </div>
          </div>

          {/* Dormitorios Mínimos */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-stone-700">Habitaciones mínimas</label>
            <div className="grid grid-cols-5 gap-1.5">
              {[null, 1, 2, 3, 4].map((num) => (
                <button
                  key={num === null ? 'any' : num}
                  type="button"
                  onClick={() => setMinBedrooms(num)}
                  className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all border ${
                    minBedrooms === num
                      ? 'bg-[#1E1B4B] text-white border-[#1E1B4B]'
                      : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                  }`}
                >
                  {num === null ? 'Todas' : `${num}+`}
                </button>
              ))}
            </div>
          </div>

          {/* Tipo de Inmueble */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-stone-700">Tipo de Propiedad</label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { label: 'Todos', val: 'all' },
                { label: 'Piso', val: 'piso' },
                { label: 'Apartamento', val: 'apartamento' },
                { label: 'Ático', val: 'ático' },
                { label: 'Estudio', val: 'estudio' },
                { label: 'Casa', val: 'casa' },
              ].map((item) => (
                <button
                  key={item.val}
                  type="button"
                  onClick={() => setPropertyType(item.val)}
                  className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all border ${
                    propertyType === item.val
                      ? 'bg-[#1E1B4B] text-white border-[#1E1B4B]'
                      : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Características Adicionales */}
          <div className="space-y-2 pt-1 border-t border-stone-100">
            <label className="block text-xs font-bold text-stone-700">Equipamiento</label>
            <div className="space-y-1.5 text-xs">
              <label className="flex items-center justify-between p-2 rounded-xl bg-stone-50 border border-stone-200 cursor-pointer">
                <span className="font-semibold text-stone-700">Admite mascotas</span>
                <input
                  type="checkbox"
                  checked={petsAllowed}
                  onChange={(e) => setPetsAllowed(e.target.checked)}
                  className="w-4 h-4 accent-[#1E1B4B] rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-xl bg-stone-50 border border-stone-200 cursor-pointer">
                <span className="font-semibold text-stone-700">Solo totalmente amueblados</span>
                <input
                  type="checkbox"
                  checked={furnishedOnly}
                  onChange={(e) => setFurnishedOnly(e.target.checked)}
                  className="w-4 h-4 accent-[#1E1B4B] rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-xl bg-stone-50 border border-stone-200 cursor-pointer">
                <span className="font-semibold text-stone-700">Con ascensor</span>
                <input
                  type="checkbox"
                  checked={elevatorOnly}
                  onChange={(e) => setElevatorOnly(e.target.checked)}
                  className="w-4 h-4 accent-[#1E1B4B] rounded cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Actions with Live Exact Count */}
          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetFilters}
              className="py-2.5 px-3 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl transition-colors"
            >
              Restablecer
            </button>

            <button
              type="button"
              onClick={() => setShowFilterModal(false)}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 ${
                filteredListings.length > 0
                  ? 'bg-[#1E1B4B] hover:bg-[#28235C] text-white'
                  : 'bg-stone-300 text-stone-600'
              }`}
            >
              {filteredListings.length > 0 ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Ver {filteredListings.length} {filteredListings.length === 1 ? 'propiedad' : 'propiedades'}</span>
                </>
              ) : (
                <span>0 propiedades con estos filtros</span>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto relative px-2 flex flex-col items-center select-none min-h-[82vh] justify-between">
      
      {/* Geolocation & Filter Feedback Toast */}
      {geoToast && (
        <div className="fixed top-20 z-50 bg-[#1E1B4B] text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold animate-fade-in border border-[#D97706]">
          <MapPin className="w-4 h-4 text-[#D97706]" />
          <span>{geoToast}</span>
        </div>
      )}

      {/* Andalusia Filter & Geolocation Bar */}
      {renderFilterAndCityBar()}

      {/* Top quick action bar with Matching Quiz trigger & Active Filter summary */}
      <div className="w-full flex items-center justify-between pb-2 px-1 gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
            {filteredListings.length} {filteredListings.length === 1 ? 'propiedad' : 'propiedades'}
          </span>
          {hideInteracted && (
            <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
              No exploradas
            </span>
          )}
          {activeFiltersCount > 0 && (
            <button
              onClick={handleResetFilters}
              className="text-[10px] font-bold text-indigo-700 hover:underline"
            >
              (Limpiar filtros)
            </button>
          )}
        </div>

        {onOpenQuiz && (
          <button
            onClick={onOpenQuiz}
            className="text-xs font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-2.5 py-1 rounded-xl flex items-center gap-1 transition-all shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Mi Matching</span>
          </button>
        )}
      </div>

      {/* IMMERSIVE TINDER CARD CONTAINER */}
      <div className="relative w-full h-[600px] max-h-[78vh] rounded-3xl overflow-hidden shadow-xl border border-stone-200/60 bg-stone-900">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${currentListing.id}-${currentIndex}`}
            style={{ x, rotate }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={(_, info) => {
              if (info.offset.x > 90) {
                handleSwipe('right');
              } else if (info.offset.x < -90) {
                handleSwipe('left');
              }
            }}
            animate={
              swipeDirection === 'right'
                ? { x: 500, opacity: 0 }
                : swipeDirection === 'left'
                ? { x: -500, opacity: 0 }
                : { x: 0, opacity: 1 }
            }
            transition={{ duration: 0.2 }}
            className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing bg-stone-900 flex flex-col justify-between"
          >
            {/* Background Fullscreen Image */}
            <div className="absolute inset-0 z-0">
              <img
                src={currentListing.images?.[activeImageIndex] || currentListing.images?.[0] || 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop&q=80'}
                alt={currentListing.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/40" />
            </div>

            {/* Top Carousel Navigation Indicators */}
            {currentListing.images && currentListing.images.length > 1 && (
              <div className="relative z-10 pt-3 px-4 flex gap-1.5">
                {currentListing.images.map((_: any, i: number) => (
                  <div
                    key={i}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveImageIndex(i);
                    }}
                    className={`h-1 flex-1 rounded-full cursor-pointer transition-all ${
                      i === activeImageIndex ? 'bg-white shadow-sm' : 'bg-white/30'
                    }`}
                  />
                ))}
              </div>
            )}

            {/* LIKE BADGE ON SWIPE RIGHT */}
            <motion.div
              style={{ opacity: opacityLike }}
              className="absolute top-10 left-6 z-20 bg-[#D97706] text-white px-4 py-1 rounded-xl font-black text-sm tracking-wider uppercase border-2 border-white shadow-lg pointer-events-none rotate-[-12deg]"
            >
              {t.likeAction}
            </motion.div>

            {/* PASS BADGE ON SWIPE LEFT */}
            <motion.div
              style={{ opacity: opacityPass }}
              className="absolute top-10 right-6 z-20 bg-stone-700 text-white px-4 py-1 rounded-xl font-black text-sm tracking-wider uppercase border-2 border-white shadow-lg pointer-events-none rotate-[12deg]"
            >
              {t.passAction}
            </motion.div>

            {/* Top Bar Badges */}
            <div className="relative z-10 px-4 pt-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs font-semibold">
                <MapPin className="w-3.5 h-3.5 text-stone-200" />
                <span>{currentListing.neighborhood || currentListing.city}</span>
                {currentListing.distance_km !== undefined && currentListing.distance_km !== null && (
                  <span className="text-[10px] text-amber-300 font-bold ml-1">
                    • a {currentListing.distance_km} km
                  </span>
                )}
              </div>

              {compatibility && (
                <div className="flex items-center gap-1 bg-[#1E1B4B]/80 backdrop-blur-md text-white border border-white/20 px-2.5 py-1 rounded-full text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-[#D97706]" />
                  <span>{compatibility.matchScore || 92}%</span>
                </div>
              )}
            </div>

            {/* Bottom Minimalist Card Overlay */}
            <div 
              onClick={() => setShowDetailsSheet(true)}
              className="relative z-10 p-5 text-white cursor-pointer bg-gradient-to-t from-black via-black/80 to-transparent"
            >
              <div className="flex items-baseline justify-between gap-2 mb-1">
                <h2 className="text-xl font-black tracking-tight text-white line-clamp-1">
                  {currentListing.title}
                </h2>
                <div className="text-xl font-black text-white shrink-0">
                  {currentListing.rent} <span className="text-xs font-normal opacity-80">{currentListing.currency || '€'}/{t.perMonth}</span>
                </div>
              </div>

              <p className="text-xs text-stone-300 line-clamp-1 mb-2.5">
                {currentListing.surface_sqm || 65} m² • {currentListing.rooms_count || currentListing.bedrooms || 2} hab. • {currentListing.furnished || currentListing.is_furnished ? t.furnished : t.unfurnished}
              </p>

              {/* Tap for more details hint */}
              <div className="flex items-center justify-center gap-1 py-1 text-[11px] font-semibold text-stone-300 hover:text-white transition-colors bg-white/10 rounded-xl backdrop-blur-xs">
                <span>{t.seeDetailsHint}</span>
                <ChevronUp className="w-3.5 h-3.5 animate-bounce" />
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* BOTTOM SHEET: DETAILED SPECIFICATIONS (Revealed upon tap) */}
        <AnimatePresence>
          {showDetailsSheet && (
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="absolute inset-x-0 bottom-0 top-16 z-30 bg-[#FAF9F6] rounded-t-3xl p-5 overflow-y-auto text-[#1E1B4B] shadow-2xl border-t border-stone-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-stone-200/80 mb-3">
                  <div className="w-10 h-1 bg-stone-300 rounded-full mx-auto" />
                  <button
                    onClick={() => setShowDetailsSheet(false)}
                    className="p-1 text-stone-400 hover:text-[#1E1B4B] transition-colors rounded-full"
                  >
                    <ChevronDown className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex items-baseline justify-between mb-2">
                  <h3 className="text-lg font-black text-[#1E1B4B]">{currentListing.title}</h3>
                  <span className="text-base font-extrabold text-[#1E1B4B]">
                    {currentListing.rent} {currentListing.currency || '€'}/{t.perMonth}
                  </span>
                </div>

                <p className="text-xs text-stone-600 leading-relaxed mb-4">
                  {currentListing.description || ''}
                </p>

                {/* Key Characteristics Chips */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="p-2.5 bg-white rounded-xl border border-stone-200/80 text-center">
                    <BedDouble className="w-4 h-4 text-[#1E1B4B] mx-auto mb-1" />
                    <span className="text-xs font-bold block">{currentListing.rooms_count || currentListing.bedrooms || 2} hab.</span>
                    <span className="text-[10px] text-stone-400">{currentListing.surface_sqm || 65} m²</span>
                  </div>

                  <div className="p-2.5 bg-white rounded-xl border border-stone-200/80 text-center">
                    <Calendar className="w-4 h-4 text-[#1E1B4B] mx-auto mb-1" />
                    <span className="text-xs font-bold block">{t.availability}</span>
                    <span className="text-[10px] text-stone-400 truncate block">{currentListing.available_from || t.immediate}</span>
                  </div>

                  <div className="p-2.5 bg-white rounded-xl border border-stone-200/80 text-center">
                    <PawPrint className="w-4 h-4 text-[#1E1B4B] mx-auto mb-1" />
                    <span className="text-xs font-bold block">Mascotas</span>
                    <span className="text-[10px] text-stone-400 block">{currentListing.pets_allowed ? t.petsAllowed : t.petsForbidden}</span>
                  </div>
                </div>
              </div>

              {/* Action buttons inside sheet */}
              <div className="flex items-center justify-between gap-4 pt-4 border-t border-stone-200">
                <button
                  onClick={() => handleSwipe('left')}
                  className="flex-1 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" />
                  <span>Descartar</span>
                </button>
                <button
                  onClick={() => handleSwipe('right')}
                  className="flex-1 py-3 bg-[#1E1B4B] hover:bg-[#28235C] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2"
                >
                  <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                  <span>Dar Like</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* BOTTOM FLOATING CONTROLS */}
      <div className="w-full flex items-center justify-center gap-6 py-4">
        {/* Pass Button */}
        <button
          onClick={() => handleSwipe('left')}
          className="w-14 h-14 rounded-full bg-white border border-stone-200 text-stone-500 hover:text-stone-800 hover:bg-stone-100 flex items-center justify-center shadow-md transition-all hover:scale-105 active:scale-95"
          id="btn-swipe-pass"
          title="Descartar propiedad"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Info/Details Button */}
        <button
          onClick={() => setShowDetailsSheet(!showDetailsSheet)}
          className="w-11 h-11 rounded-full bg-white border border-stone-200 text-[#1E1B4B] hover:bg-stone-100 flex items-center justify-center shadow-sm transition-all hover:scale-105 active:scale-95"
          id="btn-swipe-info"
          title="Ver detalles del inmueble"
        >
          <ChevronUp className="w-5 h-5" />
        </button>

        {/* Like Button */}
        <button
          onClick={() => handleSwipe('right')}
          className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#1E1B4B] to-[#28235C] text-white hover:from-[#28235C] hover:to-[#3730A3] flex items-center justify-center shadow-lg transition-all hover:scale-105 active:scale-95 border border-white/20"
          id="btn-swipe-like"
          title="Dar like al piso"
        >
          <Heart className="w-7 h-7 fill-rose-400 text-rose-400" />
        </button>
      </div>

      {/* Filter Modal */}
      {renderFilterModal()}

      {/* Location Picker & Activation Modal with Interactive Zone Drawing */}
      <LocationPickerModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        selectedCity={selectedCity}
        initialTab={locationModalInitialTab}
        customPolygon={customZone}
        listings={rawListings}
        onSelectCity={(city: SpanishCity) => {
          setCustomZone(null);
          setCustomZoneCityName('');
          if (city.name === 'all' || city.name.toLowerCase() === 'toda españa') {
            setSelectedCity('all');
            setGeoToast('📍 Mostrando toda España');
          } else {
            setSelectedCity(city.name);
            setGeoToast(`📍 Ubicación seleccionada: ${city.name}`);
          }
          setUserCoords({ lat: city.lat, lng: city.lng });
          setCurrentIndex(0);
          setTimeout(() => setGeoToast(null), 3000);
        }}
        onSelectCustomZone={(polygon, approxCity) => {
          setCustomZone(polygon);
          setCustomZoneCityName(approxCity);
          setSelectedCity('all');
          const avgLat = polygon.reduce((acc, p) => acc + p[0], 0) / polygon.length;
          const avgLng = polygon.reduce((acc, p) => acc + p[1], 0) / polygon.length;
          setUserCoords({ lat: avgLat, lng: avgLng });
          setCurrentIndex(0);
          setGeoToast(`✏️ Zona de alquiler dibujada aplicada (${approxCity})`);
          setTimeout(() => setGeoToast(null), 3500);
        }}
      />

      {/* Modal de detalles de propiedad */}
      {modalListing && (
        <PropertyDetailsModal
          listing={modalListing}
          isOpen={!!modalListing}
          onClose={() => setModalListing(null)}
          onLike={() => {
            handleSwipe('right');
            setModalListing(null);
          }}
          language={language}
        />
      )}
    </div>
  );
};
