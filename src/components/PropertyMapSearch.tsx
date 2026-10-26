import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  MapPin, 
  Navigation, 
  Pencil, 
  Trash2, 
  ZoomIn, 
  ZoomOut, 
  Building2, 
  SlidersHorizontal, 
  X, 
  Heart, 
  Eye, 
  Check, 
  Layers, 
  Images,
  BedDouble,
  Home,
  ShieldCheck,
  RotateCcw,
  Flag,
  Power,
  Lock,
  Unlock,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  List,
  KeyRound,
  EyeOff,
  Sparkles,
  Globe
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Language } from '../i18n/translations';
import { PropertyDetailsModal } from './PropertyDetailsModal';
import { detectOrActivateLocation } from '../lib/locationService';
import { ReportModal } from './ReportModal';
import { TenantPhotoGate } from './TenantPhotoGate';
import { SEED_LISTINGS } from '../data/seedListings';
import { api } from '../api/client';
import { TenantProfile, UserRole } from '../types';

// Fix Leaflet's default marker icons in modern bundlers
try {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
} catch {}

// Reliable basemap layers with OpenStreetMap as zero-fail primary
const BASEMAP_LAYERS: Record<
  'osm' | 'carto' | 'esri',
  { name: string; icon: string; url: string; options: L.TileLayerOptions }
> = {
  osm: {
    name: 'Callejero OSM',
    icon: '🗺️',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    options: {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
      subdomains: ['a', 'b', 'c'],
    },
  },
  carto: {
    name: 'Moderno Voyager',
    icon: '🏙️',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    options: {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      maxZoom: 19,
      subdomains: 'abcd',
    },
  },
  esri: {
    name: 'Satélite / Aéreo',
    icon: '🛰️',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    options: {
      attribution: '&copy; Esri, Earthstar Geographics',
      maxZoom: 19,
    },
  },
};

interface PropertyMapSearchProps {
  language: Language;
  onLikeListing?: (listingId: string) => void;
  likedListingIds?: string[];
  isLandlord?: boolean;
  currentUser?: { id: string; email: string; name?: string; role?: UserRole } | null;
  tenant?: TenantProfile;
  onPhotosUpdated?: (photos: string[]) => void;
  onOpenQuiz?: () => void;
}

// Provincias y regiones de España con coordenadas y zoom óptimo
const SPANISH_PROVINCES: { name: string; matchCities: string[]; lat: number; lng: number; zoom: number }[] = [
  { name: 'Toda España (100 Viviendas)', matchCities: ['all'], lat: 40.0, lng: -3.7, zoom: 6 },
  { name: 'Madrid', matchCities: ['Madrid'], lat: 40.4168, lng: -3.7038, zoom: 12 },
  { name: 'Barcelona', matchCities: ['Barcelona'], lat: 41.3879, lng: 2.1699, zoom: 12 },
  { name: 'Valencia', matchCities: ['Valencia'], lat: 39.4699, lng: -0.3763, zoom: 13 },
  { name: 'Sevilla', matchCities: ['Sevilla'], lat: 37.3891, lng: -5.9845, zoom: 13 },
  { name: 'Málaga', matchCities: ['Málaga'], lat: 36.7213, lng: -4.4214, zoom: 13 },
  { name: 'Bilbao (Bizkaia)', matchCities: ['Bilbao'], lat: 43.2630, lng: -2.9350, zoom: 13 },
  { name: 'San Sebastián (Gipuzkoa)', matchCities: ['San Sebastián'], lat: 43.3183, lng: -1.9812, zoom: 13 },
  { name: 'Alicante', matchCities: ['Alicante'], lat: 38.3452, lng: -0.4810, zoom: 13 },
  { name: 'Zaragoza', matchCities: ['Zaragoza'], lat: 41.6488, lng: -0.8891, zoom: 13 },
  { name: 'Palma de Mallorca (Baleares)', matchCities: ['Palma de Mallorca', 'Mallorca'], lat: 39.5696, lng: 2.6502, zoom: 12 },
  { name: 'Granada', matchCities: ['Granada'], lat: 37.1773, lng: -3.5986, zoom: 13 },
  { name: 'Córdoba', matchCities: ['Córdoba'], lat: 37.8882, lng: -4.7794, zoom: 13 },
  { name: 'Cádiz', matchCities: ['Cádiz'], lat: 36.5271, lng: -6.2886, zoom: 13 },
  { name: 'Canarias (Las Palmas / Tenerife)', matchCities: ['Las Palmas', 'Santa Cruz de Tenerife'], lat: 28.2915, lng: -15.8, zoom: 9 },
  { name: 'Cantabria (Santander)', matchCities: ['Santander'], lat: 43.4689, lng: -3.7845, zoom: 13 },
  { name: 'Asturias (Gijón)', matchCities: ['Gijón', 'Oviedo'], lat: 43.5389, lng: -5.6545, zoom: 12 },
  { name: 'Galicia (A Coruña / Vigo)', matchCities: ['A Coruña', 'Vigo'], lat: 42.8, lng: -8.5, zoom: 8 },
  { name: 'Castilla y León (Salamanca)', matchCities: ['Salamanca'], lat: 40.9654, lng: -5.6645, zoom: 13 },
  { name: 'Castilla-La Mancha (Toledo)', matchCities: ['Toledo'], lat: 39.8567, lng: -4.0256, zoom: 14 }
];

// Algoritmo Ray-Casting para determinar si un punto está dentro del polígono dibujado
function isPointInPolygon(point: [number, number], vs: [number, number][]): boolean {
  const x = point[0];
  const y = point[1];
  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const xi = vs[i][0];
    const yi = vs[i][1];
    const xj = vs[j][0];
    const yj = vs[j][1];

    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export const PropertyMapSearch: React.FC<PropertyMapSearchProps> = ({
  language,
  onLikeListing,
  likedListingIds = [],
  isLandlord = false,
  currentUser,
  tenant,
  onPhotosUpdated,
  onOpenQuiz,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const drawLayerRef = useRef<L.Polygon | null>(null);

  const [selectedProvince, setSelectedProvince] = useState<string>('Toda España (100 Viviendas)');
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [drawnPoints, setDrawnPoints] = useState<[number, number][]>([]);
  const [selectedListing, setSelectedListing] = useState<any | null>(null);
  const [modalListing, setModalListing] = useState<any | null>(null);
  const [reportingListing, setReportingListing] = useState<any | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [priceMax, setPriceMax] = useState<number>(5000);
  const [propertyTypeFilter, setPropertyTypeFilter] = useState<string>('all');
  const [isProximityActive, setIsProximityActive] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'rented' | 'inactive'>('all');
  const [statusToast, setStatusToast] = useState<string | null>(null);
  const [isSelectedDrawerOpen, setIsSelectedDrawerOpen] = useState<boolean>(false);
  const [selectedSortBy, setSelectedSortBy] = useState<'price_asc' | 'price_desc' | 'rooms'>('price_asc');
  const [selectedTabFilter, setSelectedTabFilter] = useState<'all' | 'liked'>('all');

  // Basemap Provider state ('osm' by default - zero configuration, highly reliable)
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const [mapProvider, setMapProvider] = useState<'osm' | 'carto' | 'esri'>(() => {
    try {
      const saved = localStorage.getItem('rentia_map_provider');
      if (saved === 'carto' || saved === 'esri') return saved;
      // Sanitize legacy or broken 'google' choice from localStorage
      localStorage.setItem('rentia_map_provider', 'osm');
    } catch {}
    return 'osm';
  });
  const [isLayerMenuOpen, setIsLayerMenuOpen] = useState<boolean>(false);

  // Dynamic listings state with status persistence
  const [listings, setListings] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('rentia_listings_cache');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return SEED_LISTINGS.map((item, idx) => {
      const isRented = idx % 5 === 3;
      const isInactive = idx % 10 === 5;
      const status = isInactive ? 'inactive' : isRented ? 'rented' : 'available';
      const is_active = !isInactive;
      return {
        ...item,
        status,
        is_active,
        rented_at: isRented ? '2026-03-01' : undefined,
      };
    });
  });

  // Fetch real listings from backend API and combine with verified seed dataset
  useEffect(() => {
    let isMounted = true;
    api.matching.getListings({ include_inactive: true })
      .then((data) => {
        if (!isMounted || !Array.isArray(data) || data.length === 0) return;
        setListings((prev) => {
          const mapById = new Map<string, any>();
          // Put current / seed items first
          prev.forEach((item) => {
            if (item?.id) mapById.set(item.id, item);
          });
          // Merge in API items (giving priority to updated DB fields)
          data.forEach((apiItem) => {
            if (!apiItem?.id) return;
            const existing = mapById.get(apiItem.id) || {};
            mapById.set(apiItem.id, {
              ...existing,
              ...apiItem,
              // ensure coordinates exist
              latitude: apiItem.latitude || existing.latitude || 40.4168,
              longitude: apiItem.longitude || existing.longitude || -3.7038,
            });
          });
          const merged = Array.from(mapById.values());
          try {
            localStorage.setItem('rentia_listings_cache', JSON.stringify(merged));
          } catch {}
          return merged;
        });
      })
      .catch((err) => {
        console.warn('Could not sync backend listings to map, using seed dataset:', err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleToggleActive = (listingId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setListings((prev) => {
      const updated = prev.map((item) => {
        if (item.id === listingId) {
          const willBeActive = item.is_active === false;
          const nextStatus = willBeActive ? (item.status === 'rented' ? 'rented' : 'available') : 'inactive';
          return {
            ...item,
            is_active: willBeActive,
            status: nextStatus,
          };
        }
        return item;
      });
      try {
        localStorage.setItem('rentia_listings_cache', JSON.stringify(updated));
      } catch {}
      const target = updated.find((l) => l.id === listingId);
      if (target) {
        setSelectedListing(target);
        if (modalListing?.id === listingId) setModalListing(target);
        api.matching.toggleListingStatus(listingId, target.is_active, target.status).catch(() => {});
        setStatusToast(
          target.is_active
            ? '🟢 Anuncio activado correctamente con 1 clic'
            : '⏸️ Anuncio desactivado / pausado correctamente con 1 clic'
        );
        setTimeout(() => setStatusToast(null), 3500);
      }
      return updated;
    });
  };

  const handleToggleRented = (listingId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setListings((prev) => {
      const updated = prev.map((item) => {
        if (item.id === listingId) {
          const isCurrentlyRented = item.status === 'rented';
          const nextStatus = isCurrentlyRented ? 'available' : 'rented';
          return {
            ...item,
            status: nextStatus,
            is_active: true,
            rented_at: !isCurrentlyRented ? new Date().toISOString().split('T')[0] : undefined,
          };
        }
        return item;
      });
      try {
        localStorage.setItem('rentia_listings_cache', JSON.stringify(updated));
      } catch {}
      const target = updated.find((l) => l.id === listingId);
      if (target) {
        setSelectedListing(target);
        if (modalListing?.id === listingId) setModalListing(target);
        api.matching.toggleListingStatus(listingId, true, target.status).catch(() => {});
        setStatusToast(
          target.status === 'rented'
            ? '🔒 Anuncio marcado como ALQUILADO con 1 clic'
            : '🟢 Anuncio marcado como DISPONIBLE con 1 clic'
        );
        setTimeout(() => setStatusToast(null), 3500);
      }
      return updated;
    });
  };

  // Safe tile layer applier with instant fallback on tile error
  const applyTileLayer = (provider: 'osm' | 'carto' | 'esri') => {
    if (!mapInstanceRef.current) return;
    if (tileLayerRef.current) {
      try {
        mapInstanceRef.current.removeLayer(tileLayerRef.current);
      } catch {}
    }

    const layerConfig = BASEMAP_LAYERS[provider] || BASEMAP_LAYERS.osm;
    const newLayer = L.tileLayer(layerConfig.url, layerConfig.options);

    // Fail-safe: if tiles ever fail to load, automatically fallback to OpenStreetMap
    newLayer.on('tileerror', () => {
      if (provider !== 'osm') {
        console.warn(`Tile error on basemap '${provider}'. Auto-switching to standard OpenStreetMap.`);
        setMapProvider('osm');
        try {
          localStorage.setItem('rentia_map_provider', 'osm');
        } catch {}
        if (mapInstanceRef.current) {
          try {
            mapInstanceRef.current.removeLayer(newLayer);
          } catch {}
          const fallbackLayer = L.tileLayer(BASEMAP_LAYERS.osm.url, BASEMAP_LAYERS.osm.options);
          fallbackLayer.addTo(mapInstanceRef.current);
          tileLayerRef.current = fallbackLayer;
        }
      }
    });

    newLayer.addTo(mapInstanceRef.current);
    tileLayerRef.current = newLayer;
  };

  const handleSelectProvider = (chosen: 'osm' | 'carto' | 'esri') => {
    setMapProvider(chosen);
    try {
      localStorage.setItem('rentia_map_provider', chosen);
    } catch {}
    applyTileLayer(chosen);
    setIsLayerMenuOpen(false);
  };

  // Inicializar Leaflet Map con protección contra pantalla en blanco
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Protección crítica: eliminar _leaflet_id huérfano si el nodo DOM fue reciclado
    if ((mapContainerRef.current as any)._leaflet_id && !mapInstanceRef.current) {
      delete (mapContainerRef.current as any)._leaflet_id;
    }

    if (mapInstanceRef.current) {
      mapInstanceRef.current.invalidateSize();
      return;
    }

    const initial = SPANISH_PROVINCES[0];
    const map = L.map(mapContainerRef.current, {
      center: [initial.lat, initial.lng],
      zoom: initial.zoom,
      zoomControl: false, // Usaremos controles de zoom personalizados
      preferCanvas: true,
    });

    mapInstanceRef.current = map;
    applyTileLayer(mapProvider);

    const markersGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = markersGroup;

    // Forzar redibujado de teselas para evitar mapa blanco en montado y render
    const forceInvalidate = () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    };
    forceInvalidate();
    const t0 = requestAnimationFrame(forceInvalidate);
    const t1 = setTimeout(forceInvalidate, 80);
    const t2 = setTimeout(forceInvalidate, 250);
    const t3 = setTimeout(forceInvalidate, 600);
    const t4 = setTimeout(forceInvalidate, 1200);

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && mapContainerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      });
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      cancelAnimationFrame(t0);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (mapContainerRef.current) {
        delete (mapContainerRef.current as any)._leaflet_id;
      }
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Filtrado de inmuebles
  const filteredListings = listings.filter((item) => {
    // REGLA FUNDAMENTAL DE PRIVACIDAD:
    // Propietario o Agencia: ÚNICAMENTE aparecen sus propias propiedades privadas en su mapa
    if (isLandlord) {
      const isMine =
        Boolean(currentUser?.id && (item.landlord_id === currentUser.id || item.user_id === currentUser.id)) ||
        Boolean(currentUser?.email && (
          (item.landlord_email && item.landlord_email.toLowerCase() === currentUser.email.toLowerCase()) ||
          (item.landlord_id && item.landlord_id.toLowerCase() === currentUser.email.toLowerCase())
        ));
      if (!isMine) {
        return false;
      }

      // Filtro por estado para Propietario en modo administración
      if (statusFilter === 'available' && (item.is_active === false || item.status === 'rented' || item.status === 'inactive')) return false;
      if (statusFilter === 'rented' && item.status !== 'rented') return false;
      if (statusFilter === 'inactive' && item.is_active !== false && item.status !== 'inactive') return false;
    } else {
      // Inquilino: Ve todas las propiedades activas y disponibles
      if (item.is_active === false || item.status === 'rented' || item.status === 'inactive') {
        return false;
      }
    }

    // Filtro por precio
    if (item.rent > priceMax) return false;

    // Filtro por tipo
    if (propertyTypeFilter !== 'all' && item.property_type !== propertyTypeFilter) return false;

    // Si hay zona dibujada, verificar si las coordenadas caen dentro del polígono
    if (drawnPoints.length >= 3 && item.latitude && item.longitude) {
      return isPointInPolygon([item.latitude, item.longitude], drawnPoints);
    }

    // Si está activa la búsqueda por proximidad con ubicación del usuario
    if (isProximityActive && userLocation && item.latitude && item.longitude) {
      // Distancia euclidiana aproximada (~25 km)
      const dist = Math.sqrt(
        Math.pow(item.latitude - userLocation.lat, 2) + Math.pow(item.longitude - userLocation.lng, 2)
      );
      return dist <= 0.25; // ~25 km
    }

    // Filtro por provincia / ciudad
    if (selectedProvince && selectedProvince !== 'Toda España (100 Viviendas)') {
      const provObj = SPANISH_PROVINCES.find((p) => p.name === selectedProvince);
      if (provObj && !provObj.matchCities.includes('all')) {
        const matches = provObj.matchCities.some((c) =>
          item.city?.toLowerCase().includes(c.toLowerCase())
        );
        if (!matches) return false;
      }
    }

    return true;
  });

  const totalCount = listings.length;
  const availableCount = listings.filter(l => l.is_active !== false && l.status !== 'rented' && l.status !== 'inactive').length;
  const rentedCount = listings.filter(l => l.status === 'rented').length;
  const inactiveCount = listings.filter(l => l.is_active === false || l.status === 'inactive').length;

  // Listado ordenado y filtrado para el apartado "Ver propiedades seleccionadas"
  const displayedSelectedListings = useMemo(() => {
    let list = [...filteredListings];
    if (selectedTabFilter === 'liked') {
      list = list.filter((item) => likedListingIds.includes(item.id));
    }
    if (selectedSortBy === 'price_asc') {
      list.sort((a, b) => (Number(a.rent) || 0) - (Number(b.rent) || 0));
    } else if (selectedSortBy === 'price_desc') {
      list.sort((a, b) => (Number(b.rent) || 0) - (Number(a.rent) || 0));
    } else if (selectedSortBy === 'rooms') {
      list.sort((a, b) => (Number(b.rooms_count || b.bedrooms) || 0) - (Number(a.rooms_count || a.bedrooms) || 0));
    }
    return list;
  }, [filteredListings, selectedTabFilter, selectedSortBy, likedListingIds]);

  // Renderizar marcadores con etiqueta de precio tipo Idealista
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    filteredListings.forEach((listing) => {
      if (!listing.latitude || !listing.longitude) return;

      const isSelected = selectedListing?.id === listing.id;
      const isLiked = likedListingIds.includes(listing.id);
      const isInactive = listing.is_active === false || listing.status === 'inactive';
      const isRented = listing.status === 'rented';

      // Estilo de color: para inquilino siempre diseño limpio de Idealista; para propietario muestra estados
      const bg = isSelected 
        ? '#1E1B4B' 
        : isLiked 
        ? '#E11D48' 
        : (isLandlord && isInactive) 
        ? '#475569' 
        : (isLandlord && isRented) 
        ? '#92400E' 
        : '#ffffff';

      const textColor = isSelected || isLiked || (isLandlord && (isInactive || isRented)) ? '#ffffff' : '#064E3B';

      const border = isSelected 
        ? '2px solid #F59E0B' 
        : isLiked 
        ? '2px solid #BE123C' 
        : (isLandlord && isInactive) 
        ? '2px solid #94A3B8' 
        : (isLandlord && isRented) 
        ? '2px solid #FBBF24' 
        : '2px solid #10B981';

      const iconLabel = isLiked 
        ? '❤️ ' 
        : (isLandlord && isInactive) 
        ? '⏸️ ' 
        : (isLandlord && isRented) 
        ? '🔒 ' 
        : '🟢 ';

      const statusTag = isLandlord ? (isInactive ? ' (Pausa)' : isRented ? ' (Alquilada)' : '') : '';

      // Marcador tipo píldora de Rentia
      const iconHtml = `
        <div class="rentia-marker-pin ${isSelected ? 'is-active' : ''} ${isLiked ? 'is-liked' : ''}" style="
          background-color: ${bg};
          color: ${textColor};
          border: ${border};
          padding: 3px 8px;
          border-radius: 9999px;
          font-weight: 800;
          font-size: 11px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          cursor: pointer;
          white-space: nowrap;
          display: flex;
          align-items: center;
          gap: 3px;
          transition: transform 0.15s ease;
        ">
          <span>${iconLabel}${listing.rent} €${statusTag}</span>
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-leaflet-price-pin',
        iconSize: [isLandlord && (isInactive || isRented) ? 100 : 70, 26],
        iconAnchor: [isLandlord && (isInactive || isRented) ? 50 : 35, 13],
      });

      const marker = L.marker([listing.latitude, listing.longitude], { icon: customIcon });

      marker.on('click', () => {
        setSelectedListing(listing);
        map.panTo([listing.latitude, listing.longitude], { animate: true });
      });

      markersGroup.addLayer(marker);
    });
  }, [filteredListings, selectedListing, likedListingIds, isLandlord]);

  // Manejo del dibujo de zona (Idealista Draw Area: clic por clic y trazo continuo libre con soporte táctil)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (!isDrawing) {
      map.dragging.enable();
      return;
    }

    // Mientras se dibuja, deshabilitamos el drag del mapa para permitir trazar libremente
    map.dragging.disable();

    let isPointerDown = false;
    let lastAddTimestamp = 0;
    let didMove = false;

    const addMapPoint = (lat: number, lng: number) => {
      setDrawnPoints((prev) => {
        if (prev.length > 0) {
          const last = prev[prev.length - 1];
          const dist = Math.hypot(last[0] - lat, last[1] - lng);
          if (dist < 0.0001) return prev;
        }
        const updated = [...prev, [lat, lng] as [number, number]];
        if (drawLayerRef.current) {
          drawLayerRef.current.setLatLngs(updated);
        } else if (updated.length >= 2) {
          const poly = L.polygon(updated, {
            color: '#4F46E5',
            fillColor: '#4F46E5',
            fillOpacity: 0.22,
            weight: 3,
            dashArray: updated.length >= 3 ? undefined : '4, 4',
          }).addTo(map);
          drawLayerRef.current = poly;
        }
        return updated;
      });
    };

    const handleMouseDown = (e: L.LeafletMouseEvent) => {
      isPointerDown = true;
      didMove = false;
      addMapPoint(e.latlng.lat, e.latlng.lng);
    };

    const handleMouseUp = () => {
      isPointerDown = false;
    };

    const handleMouseMove = (e: L.LeafletMouseEvent) => {
      if (!isPointerDown) return;
      const now = Date.now();
      if (now - lastAddTimestamp < 50) return; // throttle 50ms
      lastAddTimestamp = now;
      didMove = true;
      addMapPoint(e.latlng.lat, e.latlng.lng);
    };

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      if (didMove) return;
      addMapPoint(e.latlng.lat, e.latlng.lng);
    };

    // Soporte táctil para móviles y tabletas
    const container = map.getContainer();
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      isPointerDown = true;
      didMove = false;
      const touch = e.touches[0];
      const rect = container.getBoundingClientRect();
      const point = L.point(touch.clientX - rect.left, touch.clientY - rect.top);
      const latlng = map.containerPointToLatLng(point);
      addMapPoint(latlng.lat, latlng.lng);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPointerDown || e.touches.length !== 1) return;
      const now = Date.now();
      if (now - lastAddTimestamp < 50) return;
      lastAddTimestamp = now;
      didMove = true;
      const touch = e.touches[0];
      const rect = container.getBoundingClientRect();
      const point = L.point(touch.clientX - rect.left, touch.clientY - rect.top);
      const latlng = map.containerPointToLatLng(point);
      addMapPoint(latlng.lat, latlng.lng);
    };

    const handleTouchEnd = () => {
      isPointerDown = false;
    };

    map.on('click', handleMapClick);
    map.on('mousedown', handleMouseDown);
    map.on('mousemove', handleMouseMove);
    map.on('mouseup', handleMouseUp);

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      map.off('click', handleMapClick);
      map.off('mousedown', handleMouseDown);
      map.off('mousemove', handleMouseMove);
      map.off('mouseup', handleMouseUp);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      map.dragging.enable();
    };
  }, [isDrawing]);

  // Cambiar de provincia seleccionada
  const handleProvinceChange = (provName: string) => {
    setSelectedProvince(provName);
    setIsProximityActive(false);
    clearDrawnZone();

    const prov = SPANISH_PROVINCES.find((p) => p.name === provName);
    if (prov && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([prov.lat, prov.lng], prov.zoom, { duration: 1 });
    }
  };

  // Activar búsqueda por proximidad (Geolocalización GPS / IP fallback)
  const handleProximitySearch = async () => {
    try {
      const res = await detectOrActivateLocation();
      const coords = { lat: res.lat, lng: res.lng };
      setUserLocation(coords);
      setIsProximityActive(true);
      clearDrawnZone();

      if (mapInstanceRef.current) {
        mapInstanceRef.current.flyTo([coords.lat, coords.lng], 14, { duration: 1.2 });
        // Marcador de ubicación del usuario
        L.circle([coords.lat, coords.lng], {
          color: '#3B82F6',
          fillColor: '#60A5FA',
          fillOpacity: 0.15,
          radius: 3000,
        }).addTo(mapInstanceRef.current);
      }
    } catch {
      handleProvinceChange('Málaga');
    }
  };

  // Limpiar zona dibujada
  const clearDrawnZone = () => {
    setDrawnPoints([]);
    setIsDrawing(false);
    if (drawLayerRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(drawLayerRef.current);
      drawLayerRef.current = null;
    }
    if (mapInstanceRef.current) {
      mapInstanceRef.current.dragging.enable();
    }
  };

  // Deshacer último punto trazado
  const undoLastDrawnPoint = () => {
    setDrawnPoints((prev) => {
      if (prev.length <= 1) {
        clearDrawnZone();
        return [];
      }
      const updated = prev.slice(0, prev.length - 1);
      if (drawLayerRef.current) {
        if (updated.length >= 2) {
          drawLayerRef.current.setLatLngs(updated);
        } else if (mapInstanceRef.current) {
          mapInstanceRef.current.removeLayer(drawLayerRef.current);
          drawLayerRef.current = null;
        }
      }
      return updated;
    });
  };

  // Controles de zoom
  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] w-full relative bg-stone-100 overflow-hidden" id="property-map-search-view">
      {/* TOP CONTROL BAR */}
      <div className="bg-white/95 backdrop-blur-md border-b border-stone-200 z-20 px-3 py-2.5 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2.5">
          {/* Province selector & Proximity */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 bg-stone-100 rounded-2xl p-1 border border-stone-200">
              <MapPin className="w-4 h-4 text-rose-500 ml-1.5" />
              <select
                value={selectedProvince}
                onChange={(e) => handleProvinceChange(e.target.value)}
                className="bg-transparent text-xs font-bold text-[#1E1B4B] pr-3 py-1 focus:outline-hidden cursor-pointer"
                id="select-province-map"
              >
                {SPANISH_PROVINCES.map((prov) => (
                  <option key={prov.name} value={prov.name}>
                    {prov.name.startsWith('Toda') ? prov.name : `Provincia: ${prov.name}`}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleProximitySearch}
              className={`px-3 py-1.5 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs ${
                isProximityActive
                  ? 'bg-blue-600 text-white shadow-blue-200'
                  : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
              }`}
              id="btn-proximity-search"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Por proximidad</span>
            </button>

            {/* DRAW ZONE BUTTON (Idealista signature feature) */}
            <button
              onClick={() => {
                if (isDrawing) {
                  setIsDrawing(false);
                  mapInstanceRef.current?.dragging.enable();
                } else {
                  setIsDrawing(true);
                }
              }}
              className={`px-3 py-1.5 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs ${
                isDrawing
                  ? 'bg-amber-500 text-white animate-pulse'
                  : drawnPoints.length >= 3
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
              }`}
              id="btn-draw-zone-map"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>
                {isDrawing
                  ? 'Haz clic en el mapa para trazar zona'
                  : drawnPoints.length >= 3
                  ? 'Zona delimitada activa'
                  : 'Dibujar zona'}
              </span>
            </button>

            {drawnPoints.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={undoLastDrawnPoint}
                  className="p-1.5 rounded-xl text-stone-700 bg-white hover:bg-stone-50 border border-stone-200 text-xs font-bold flex items-center gap-1 transition-colors"
                  title="Deshacer último punto trazado"
                  id="btn-undo-draw-point"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-stone-600" />
                  <span className="hidden sm:inline">Deshacer</span>
                </button>

                <button
                  onClick={clearDrawnZone}
                  className="p-1.5 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200 text-xs font-bold flex items-center gap-1"
                  title="Borrar zona dibujada"
                  id="btn-clear-draw-zone"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Borrar zona</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* FILTROS DE ESTADO (Solo visible para Propietarios) O CONTADOR DE DISPONIBLES (Para Inquilinos) */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-stone-100">
          {isLandlord ? (
            /* Los selectores de estado solo los ve el propietario */
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider mr-1">
                Estado:
              </span>
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-2xl text-xs font-bold transition-all ${
                  statusFilter === 'all'
                    ? 'bg-[#1E1B4B] text-white shadow-xs'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                Todos ({totalCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('available')}
                className={`px-3 py-1.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-1 ${
                  statusFilter === 'available'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Disponibles ({availableCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('rented')}
                className={`px-3 py-1.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-1 ${
                  statusFilter === 'rented'
                    ? 'bg-amber-700 text-white shadow-xs'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Alquiladas ({rentedCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('inactive')}
                className={`px-3 py-1.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-1 ${
                  statusFilter === 'inactive'
                    ? 'bg-stone-700 text-white shadow-xs'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200 border border-stone-200'
                }`}
              >
                <Power className="w-3.5 h-3.5" />
                <span>Desactivadas ({inactiveCount})</span>
              </button>
            </div>
          ) : (
            /* El inquilino NO puede ver cuántos están alquilados ni desactivados; ve SOLO los disponibles */
            <div className="flex items-center gap-2 flex-wrap">
              <div className="text-xs font-black text-[#1E1B4B] bg-stone-100 px-3.5 py-1.5 rounded-full border border-stone-200 flex items-center gap-2 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>
                  <strong>{filteredListings.length}</strong> viviendas disponibles en el mapa
                </span>
              </div>

              {/* APARTADO: VER PROPIEDADES SELECCIONADAS */}
              <button
                type="button"
                onClick={() => setIsSelectedDrawerOpen((prev) => !prev)}
                className={`px-3 py-1.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs active:scale-98 ${
                  isSelectedDrawerOpen
                    ? 'bg-[#1E1B4B] text-white shadow-xs ring-2 ring-amber-400'
                    : 'bg-white hover:bg-stone-50 text-[#1E1B4B] border border-stone-300'
                }`}
                id="btn-ver-propiedades-seleccionadas"
                title="Abrir apartado de propiedades seleccionadas en el mapa"
              >
                <List className="w-3.5 h-3.5 text-amber-500" />
                <span>Ver propiedades seleccionadas ({filteredListings.length})</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isSelectedDrawerOpen ? 'rotate-180' : ''}`} />
              </button>

              <span className="text-[11px] text-stone-500 hidden md:inline">
                • Mostrando exclusivamente inmuebles activos para alquilar
              </span>
            </div>
          )}

          {isLandlord && (
            <div className="flex items-center gap-2 flex-wrap">
              <div className="text-xs font-bold text-[#1E1B4B] bg-stone-100 px-3 py-1.5 rounded-full border border-stone-200">
                <strong>{filteredListings.length}</strong> inmuebles en el mapa
              </div>
              <button
                type="button"
                onClick={() => setIsSelectedDrawerOpen((prev) => !prev)}
                className={`px-3 py-1.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs active:scale-98 ${
                  isSelectedDrawerOpen
                    ? 'bg-[#1E1B4B] text-white shadow-xs ring-2 ring-amber-400'
                    : 'bg-white hover:bg-stone-50 text-[#1E1B4B] border border-stone-300'
                }`}
                id="btn-ver-propiedades-seleccionadas-landlord"
                title="Abrir apartado de propiedades seleccionadas en el mapa"
              >
                <List className="w-3.5 h-3.5 text-amber-500" />
                <span>Ver propiedades seleccionadas ({filteredListings.length})</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isSelectedDrawerOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>
          )}
        </div>

        {/* Drawing hint banner */}
        {isDrawing && (
          <div className="mt-2 text-center text-xs bg-amber-50 border border-amber-200 text-amber-900 py-1.5 px-3 rounded-xl flex items-center justify-center gap-2">
            <Pencil className="w-3.5 h-3.5 text-amber-600" />
            <span>
              Haz clic en 3 o más puntos del mapa para delimitar tu zona de búsqueda personalizada.
            </span>
            <button
              onClick={() => {
                setIsDrawing(false);
                mapInstanceRef.current?.dragging.enable();
              }}
              className="font-bold underline ml-2"
            >
              Finalizar trazado
            </button>
          </div>
        )}
      </div>

      {/* MAP CANVAS */}
      <div className="flex-1 relative w-full h-full min-h-[500px]">
        {statusToast && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-stone-900/90 backdrop-blur-md text-white px-4 py-2 rounded-2xl text-xs font-bold shadow-xl border border-stone-700 flex items-center gap-2">
            <span>{statusToast}</span>
            <button 
              type="button" 
              onClick={() => setStatusToast(null)} 
              className="ml-2 text-stone-400 hover:text-white font-bold"
            >
              ✕
            </button>
          </div>
        )}

        <div 
          ref={mapContainerRef} 
          className="w-full h-full min-h-[500px] z-10 bg-stone-100" 
          style={{ width: '100%', height: '100%', minHeight: '500px' }} 
        />

        {/* CUSTOM CONTROLS (+ / -, Centrar, Capas de mapa) */}
        <div className="absolute right-4 top-4 z-20 flex flex-col gap-1.5 bg-white/95 backdrop-blur-xs p-1 rounded-2xl shadow-lg border border-stone-200">
          <button
            onClick={handleZoomIn}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-stone-700 hover:bg-stone-100 transition-colors font-black text-base"
            title="Acercar zoom"
            aria-label="Acercar zoom"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
          <div className="h-px bg-stone-200 mx-1" />
          <button
            onClick={handleZoomOut}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-stone-700 hover:bg-stone-100 transition-colors font-black text-base"
            title="Alejar zoom"
            aria-label="Alejar zoom"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          <div className="h-px bg-stone-200 mx-1" />
          <button
            onClick={() => {
              if (mapInstanceRef.current) {
                mapInstanceRef.current.setView([40.0, -3.7], 6);
                mapInstanceRef.current.invalidateSize();
              }
            }}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-amber-600 hover:bg-amber-50 transition-colors"
            title="Centrar en Toda España"
            aria-label="Centrar en Toda España"
          >
            <Globe className="w-4 h-4" />
          </button>
          <div className="h-px bg-stone-200 mx-1" />
          {/* Basemap Switcher */}
          <div className="relative">
            <button
              onClick={() => setIsLayerMenuOpen((prev) => !prev)}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                isLayerMenuOpen
                  ? 'bg-[#1E1B4B] text-white shadow-xs'
                  : 'text-stone-700 hover:bg-stone-100'
              }`}
              title="Cambiar capa de mapa (Callejero, Moderno, Satélite)"
              aria-label="Cambiar capa de mapa"
            >
              <Layers className="w-4 h-4" />
            </button>

            {isLayerMenuOpen && (
              <div className="absolute right-12 top-0 bg-white/98 backdrop-blur-md rounded-2xl shadow-2xl border border-stone-200 p-2 w-48 z-40 animate-scale-up space-y-1">
                <p className="text-[10px] font-black uppercase tracking-wider text-stone-400 px-2 py-1">
                  Estilo de Mapa
                </p>
                {(['osm', 'carto', 'esri'] as const).map((key) => {
                  const cfg = BASEMAP_LAYERS[key];
                  const isCur = mapProvider === key;
                  return (
                    <button
                      key={key}
                      onClick={() => handleSelectProvider(key)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center justify-between transition-colors ${
                        isCur
                          ? 'bg-[#1E1B4B] text-white shadow-xs'
                          : 'text-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{cfg.icon}</span>
                        <span>{cfg.name}</span>
                      </div>
                      {isCur && <Check className="w-3.5 h-3.5 text-amber-400" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* FLOATING BANNER WHEN 0 LISTINGS MATCH CURRENT FILTERS / DRAWN AREA */}
        {filteredListings.length === 0 && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 max-w-md w-[92%] bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-2xl border border-stone-200 text-center animate-fade-in">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-2 border border-amber-200">
              <AlertCircle className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-black text-[#1E1B4B] mb-1">
              No hay viviendas disponibles con los filtros actuales
            </h4>
            <p className="text-[11px] text-stone-500 mb-3 leading-relaxed">
              El mapa sigue activo. Puedes ampliar tu zona de búsqueda, borrar el dibujo o restablecer los filtros para ver las {listings.length} viviendas disponibles en España.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={() => {
                  setSelectedProvince('Toda España (100 Viviendas)');
                  clearDrawnZone();
                  setPriceMax(5000);
                  setPropertyTypeFilter('all');
                  setStatusFilter('all');
                }}
                className="px-3 py-1.5 rounded-xl bg-[#1E1B4B] text-white text-xs font-bold hover:bg-[#28235C] transition-colors shadow-xs"
              >
                Ver toda España ({listings.length})
              </button>
              {drawnPoints.length > 0 && (
                <button
                  onClick={clearDrawnZone}
                  className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-colors"
                >
                  Borrar zona dibujada
                </button>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* APARTADO DESPLEGABLE: VER PROPIEDADES SELECCIONADAS EN EL MAPA */}
        {/* ========================================================================= */}
        {isSelectedDrawerOpen && (
          <div
            className="absolute top-0 right-0 bottom-0 z-35 w-full sm:w-[420px] md:w-[460px] bg-white/95 backdrop-blur-md border-l border-stone-200 shadow-2xl flex flex-col animate-slide-left"
            id="panel-propiedades-seleccionadas"
          >
            {/* Header del apartado */}
            <div className="p-3.5 sm:p-4 border-b border-stone-200 bg-white/90 backdrop-blur-md flex items-center justify-between gap-2.5">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-black text-[#1E1B4B] truncate">
                    Propiedades seleccionadas ({displayedSelectedListings.length})
                  </h3>
                </div>
                <p className="text-[11px] text-stone-500 mt-0.5 truncate">
                  {selectedProvince === 'Toda España (100 Viviendas)' ? 'Toda España' : selectedProvince}
                  {drawnPoints.length >= 3 ? ' • Zona dibujada activa' : ''}
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {/* Selector de ordenación */}
                <select
                  value={selectedSortBy}
                  onChange={(e) => setSelectedSortBy(e.target.value as any)}
                  className="text-[11px] font-bold bg-stone-100 border border-stone-200 rounded-xl px-2 py-1 text-stone-700 focus:outline-hidden"
                  title="Ordenar listado"
                >
                  <option value="price_asc">Precio: Menor</option>
                  <option value="price_desc">Precio: Mayor</option>
                  <option value="rooms">Más hab.</option>
                </select>

                <button
                  type="button"
                  onClick={() => setIsSelectedDrawerOpen(false)}
                  className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
                  title="Cerrar apartado de propiedades seleccionadas"
                  id="btn-close-selected-drawer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Pestañas de filtrado rápido en el apartado */}
            <div className="px-3.5 py-2 border-b border-stone-100 bg-stone-50/80 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedTabFilter('all')}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all ${
                    selectedTabFilter === 'all'
                      ? 'bg-[#1E1B4B] text-white shadow-2xs'
                      : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  Todas ({filteredListings.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTabFilter('liked')}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1 ${
                    selectedTabFilter === 'liked'
                      ? 'bg-rose-600 text-white shadow-2xs'
                      : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
                  <span>Favoritas ({filteredListings.filter((l) => likedListingIds.includes(l.id)).length})</span>
                </button>
              </div>

              <span className="text-[10px] text-stone-400 font-semibold hidden sm:inline">
                Toca para centrar en mapa
              </span>
            </div>

            {/* Listado con scroll de propiedades seleccionadas */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5 scrollbar-thin">
              {displayedSelectedListings.length === 0 ? (
                <div className="py-12 px-4 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <h4 className="text-xs font-bold text-stone-800">
                    {isLandlord
                      ? 'Aún no tienes propiedades en tu cartera'
                      : selectedTabFilter === 'liked'
                      ? 'No tienes propiedades favoritas guardadas en esta zona'
                      : 'No hay propiedades que coincidan con estos filtros'}
                  </h4>
                  <p className="text-[11px] text-stone-500 max-w-xs mx-auto">
                    {isLandlord
                      ? 'Publica tus inmuebles para gestionarlos, controlar su estado y recibir candidatos en tu mapa privado.'
                      : selectedTabFilter === 'liked'
                      ? 'Pulsa en el corazón de cualquier vivienda para guardarla aquí.'
                      : 'Amplía tu búsqueda o restablece los filtros para ver las viviendas en España.'}
                  </p>
                  {isLandlord ? (
                    <button
                      type="button"
                      onClick={() => {
                        window.location.hash = '#publish';
                        window.dispatchEvent(new CustomEvent('rentia:navigate', { detail: 'landlord_publish' }));
                      }}
                      className="px-4 py-2 bg-[#1E1B4B] hover:bg-[#28235C] text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                      id="btn-empty-create-listing"
                    >
                      Crear anuncio
                    </button>
                  ) : selectedTabFilter === 'liked' ? (
                    <button
                      type="button"
                      onClick={() => setSelectedTabFilter('all')}
                      className="px-3.5 py-1.5 bg-[#1E1B4B] text-white rounded-xl text-xs font-bold"
                    >
                      Ver todas las seleccionadas
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedProvince('Toda España (100 Viviendas)');
                        clearDrawnZone();
                        setPriceMax(5000);
                        setPropertyTypeFilter('all');
                      }}
                      className="px-3.5 py-1.5 bg-[#1E1B4B] text-white rounded-xl text-xs font-bold"
                    >
                      Ver toda España ({listings.length})
                    </button>
                  )}
                </div>
              ) : (
                displayedSelectedListings.map((item) => {
                  const isLiked = likedListingIds.includes(item.id);
                  const isCurrentSelected = selectedListing?.id === item.id;

                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        setSelectedListing(item);
                        if (mapInstanceRef.current && item.latitude && item.longitude) {
                          mapInstanceRef.current.flyTo([item.latitude, item.longitude], 15, { duration: 0.8 });
                        }
                      }}
                      className={`p-2.5 rounded-2xl transition-all cursor-pointer border ${
                        isCurrentSelected
                          ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-400 shadow-sm'
                          : 'bg-white hover:bg-stone-50 border-stone-200/90 shadow-2xs'
                      }`}
                    >
                      <div className="flex gap-3">
                        {/* Foto */}
                        <div className="relative w-24 h-24 sm:w-28 sm:h-24 rounded-xl overflow-hidden bg-stone-100 shrink-0">
                          <img
                            src={
                              item.images?.[0] ||
                              item.photos?.[0] ||
                              'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=500'
                            }
                            alt={item.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          <div className="absolute bottom-1 right-1 bg-black/75 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1">
                            <Images className="w-2.5 h-2.5 text-amber-400" />
                            <span>10 fotos</span>
                          </div>
                          {item.status === 'rented' && isLandlord && (
                            <div className="absolute top-1 left-1 bg-amber-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded">
                              Alquilada
                            </div>
                          )}
                        </div>

                        {/* Detalles */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-sm font-black text-[#1E1B4B]">
                                {item.rent} €<span className="text-[10px] font-normal text-stone-500">/mes</span>
                              </span>
                              {onLikeListing && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onLikeListing(item.id);
                                  }}
                                  className={`p-1.5 rounded-xl transition-all ${
                                    isLiked
                                      ? 'bg-rose-50 text-rose-600'
                                      : 'text-stone-400 hover:text-rose-600 hover:bg-stone-100'
                                  }`}
                                  title={isLiked ? 'Quitar de favoritos' : 'Guardar en favoritos'}
                                >
                                  <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-rose-600 text-rose-600' : ''}`} />
                                </button>
                              )}
                            </div>

                            <h4 className="text-xs font-bold text-[#1E1B4B] truncate leading-tight mt-0.5" title={item.title}>
                              {item.title}
                            </h4>

                            <p className="text-[10px] text-stone-500 truncate mt-0.5">
                              {item.neighborhood ? `${item.neighborhood}, ` : ''}{item.city}
                            </p>
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-stone-500 pt-1 border-t border-stone-100 mt-1">
                            <span>
                              {item.rooms_count || item.bedrooms || 2} hab. • {item.surface_sqm || 70} m²
                            </span>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedListing(item);
                                  if (mapInstanceRef.current && item.latitude && item.longitude) {
                                    mapInstanceRef.current.flyTo([item.latitude, item.longitude], 15, { duration: 0.8 });
                                  }
                                }}
                                className="font-bold text-[#1E1B4B] hover:text-amber-600 text-[10px]"
                                title="Ver en el mapa"
                              >
                                Mapa
                              </button>
                              <span>•</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setModalListing(item);
                                }}
                                className="font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 text-[10px]"
                              >
                                <span>Ficha</span>
                                <Eye className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Pie del apartado */}
            <div className="p-3 bg-stone-50 border-t border-stone-200 text-[11px] text-stone-500 flex items-center justify-between">
              <span>
                <strong>{displayedSelectedListings.length}</strong> de {filteredListings.length} en el mapa
              </span>
              <button
                type="button"
                onClick={() => {
                  if (displayedSelectedListings.length > 0 && mapInstanceRef.current) {
                    const first = displayedSelectedListings[0];
                    if (first.latitude && first.longitude) {
                      mapInstanceRef.current.flyTo([first.latitude, first.longitude], 14, { duration: 0.8 });
                      setSelectedListing(first);
                    }
                  }
                }}
                className="font-bold text-[#1E1B4B] hover:underline"
              >
                Centrar primera vivienda →
              </button>
            </div>
          </div>
        )}

        {/* POPUP / FLOATING CARD FOR SELECTED PROPERTY PIN */}
        {selectedListing && (
          <div className="absolute bottom-4 left-4 right-4 sm:left-6 sm:right-auto sm:w-96 z-30 bg-white rounded-3xl p-3.5 shadow-2xl border border-stone-200 animate-slide-up">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                {isLandlord && (selectedListing.is_active === false || selectedListing.status === 'inactive') ? (
                  <span className="bg-stone-200 text-stone-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Power className="w-3 h-3 text-stone-600" />
                    Desactivado / Pausado
                  </span>
                ) : isLandlord && selectedListing.status === 'rented' ? (
                  <span className="bg-amber-100 text-amber-900 text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Lock className="w-3 h-3 text-amber-700" />
                    Alquilada
                  </span>
                ) : (
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Disponible
                  </span>
                )}
                <span className="text-[11px] text-stone-500 font-mono">
                  {selectedListing.neighborhood ? `${selectedListing.neighborhood}, ` : ''}{selectedListing.city}
                </span>
              </div>
              <button
                onClick={() => setSelectedListing(null)}
                className="p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex gap-3">
              <div className="relative w-28 h-24 rounded-2xl overflow-hidden bg-stone-100 shrink-0">
                <img
                  src={
                    selectedListing.images?.[0] ||
                    selectedListing.photos?.[0] ||
                    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600'
                  }
                  alt={selectedListing.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-1 right-1 bg-black/70 text-[9px] text-white px-1.5 py-0.5 rounded font-bold flex items-center gap-1">
                  <Images className="w-2.5 h-2.5 text-amber-400" />
                  <span>10 fotos</span>
                </div>
              </div>

              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-black text-[#1E1B4B] line-clamp-2 leading-snug">
                    {selectedListing.title}
                  </h3>
                  <div className="text-sm font-black text-[#1E1B4B] mt-1">
                    {selectedListing.rent} €<span className="text-[10px] font-normal text-stone-500">/mes</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[10px] text-stone-500">
                  <span>{selectedListing.rooms_count || 2} hab.</span>
                  <span>•</span>
                  <span>{selectedListing.surface_sqm || 70} m²</span>
                </div>
              </div>
            </div>

            {/* 1-CLICK STATUS TOGGLE ACTIONS (Solo visible para Propietarios) */}
            {isLandlord && (
              <div className="mt-2.5 pt-2 border-t border-stone-100 flex items-center justify-between gap-2 bg-stone-50/80 p-2 rounded-xl">
                <span className="text-[10px] font-bold text-stone-600 flex items-center gap-1">
                  <SlidersHorizontal className="w-3 h-3 text-[#1E1B4B]" />
                  <span>1 Clic:</span>
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={(e) => handleToggleActive(selectedListing.id, e)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold flex items-center gap-1 transition-all ${
                      selectedListing.is_active === false || selectedListing.status === 'inactive'
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                        : 'bg-stone-200 hover:bg-stone-300 text-stone-800'
                    }`}
                    title={selectedListing.is_active === false ? 'Activar anuncio con 1 clic' : 'Desactivar anuncio con 1 clic'}
                  >
                    <Power className="w-3 h-3" />
                    <span>{selectedListing.is_active === false || selectedListing.status === 'inactive' ? 'Activar' : 'Desactivar'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => handleToggleRented(selectedListing.id, e)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold flex items-center gap-1 transition-all ${
                      selectedListing.status === 'rented'
                        ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300'
                        : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
                    }`}
                    title={selectedListing.status === 'rented' ? 'Marcar como disponible con 1 clic' : 'Marcar como alquilada con 1 clic'}
                  >
                    {selectedListing.status === 'rented' ? (
                      <>
                        <Unlock className="w-3 h-3 text-emerald-700" />
                        <span>Hacer disponible</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3 h-3 text-amber-700" />
                        <span>Alquilada</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            <div className="mt-2 pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setModalListing(selectedListing)}
                className="flex-1 py-2 px-3 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Ver detalles y 10 fotos</span>
              </button>

              <button
                type="button"
                onClick={() => setReportingListing(selectedListing)}
                className="p-2 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors border border-stone-200"
                title="Denunciar este anuncio"
              >
                <Flag className="w-4 h-4" />
              </button>

              {onLikeListing && (
                <button
                  type="button"
                  onClick={() => onLikeListing(selectedListing.id)}
                  className={`p-2 rounded-xl transition-colors ${
                    likedListingIds.includes(selectedListing.id)
                      ? 'bg-rose-50 text-rose-600 border border-rose-200'
                      : 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs'
                  }`}
                  title="Dar Like y notificar propietario"
                >
                  <Heart
                    className={`w-4 h-4 ${likedListingIds.includes(selectedListing.id) ? 'fill-rose-600' : 'fill-white'}`}
                  />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* FULL PROPERTY DETAILS & 10+ PHOTOS MODAL */}
      {modalListing && (
        <PropertyDetailsModal
          listing={modalListing}
          isOpen={Boolean(modalListing)}
          onClose={() => setModalListing(null)}
          onToggleActive={isLandlord ? ((id) => handleToggleActive(id)) : undefined}
          onToggleRented={isLandlord ? ((id) => handleToggleRented(id)) : undefined}
          isLiked={likedListingIds.includes(modalListing.id)}
          onLike={onLikeListing}
          language={language}
        />
      )}

      {/* REPORT MODAL */}
      {reportingListing && (
        <ReportModal
          isOpen={Boolean(reportingListing)}
          onClose={() => setReportingListing(null)}
          targetType="listing"
          targetId={reportingListing.id}
          targetTitle={reportingListing.title}
          targetUserId={reportingListing.landlord_id || reportingListing.owner_id}
          targetUserName={reportingListing.landlord_name}
        />
      )}
    </div>
  );
};
