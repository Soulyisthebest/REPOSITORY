import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  MapPin, 
  Navigation, 
  Search, 
  Check, 
  Loader2, 
  Sparkles, 
  Pencil, 
  Trash2, 
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Layers,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';
import L from 'leaflet';
import { 
  SPANISH_CITIES_CATALOG, 
  SpanishCity, 
  detectOrActivateLocation, 
  findClosestSpanishCity,
  isPointInPolygon 
} from '../lib/locationService';
import { SEED_LISTINGS } from '../data/seedListings';

export interface LocationPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCity: string;
  onSelectCity: (city: SpanishCity) => void;
  title?: string;
  initialTab?: 'draw' | 'list';
  onSelectCustomZone?: (polygon: [number, number][], approximateCityName: string) => void;
  customPolygon?: [number, number][] | null;
  listings?: Array<{
    id: string;
    title?: string;
    rent: number | string;
    latitude?: number;
    longitude?: number;
    city?: string;
  }>;
}

export const LocationPickerModal: React.FC<LocationPickerModalProps> = ({
  isOpen,
  onClose,
  selectedCity,
  onSelectCity,
  title = 'Seleccionar o dibujar zona de alquiler',
  initialTab = 'draw',
  onSelectCustomZone,
  customPolygon = null,
  listings = [],
}) => {
  const [activeTab, setActiveTab] = useState<'draw' | 'list'>(initialTab);
  const [search, setSearch] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Map & Drawing state
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const drawLayerRef = useRef<L.Polygon | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  const [isDrawing, setIsDrawing] = useState<boolean>(true);
  const [drawnPoints, setDrawnPoints] = useState<[number, number][]>(customPolygon || []);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setDrawnPoints(customPolygon || []);
      setFeedbackMsg(null);
    }
  }, [isOpen, initialTab, customPolygon]);

  // Leaflet map initialization when 'draw' tab is active
  useEffect(() => {
    if (!isOpen || activeTab !== 'draw' || !mapContainerRef.current) return;

    // Small delay to ensure modal DOM layout has stabilized
    const timer = setTimeout(() => {
      if (!mapContainerRef.current) return;

      if ((mapContainerRef.current as any)._leaflet_id && !mapInstanceRef.current) {
        delete (mapContainerRef.current as any)._leaflet_id;
      }

      // Find initial center coordinates based on selected city or default
      const matchedCity = SPANISH_CITIES_CATALOG.find(
        (c) => c.name.toLowerCase() === selectedCity.toLowerCase()
      ) || SPANISH_CITIES_CATALOG[0]; // Málaga by default

      const initialLat = matchedCity.lat;
      const initialLng = matchedCity.lng;

      if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current, {
          center: [initialLat, initialLng],
          zoom: 13,
          zoomControl: false,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 19,
          subdomains: ['a', 'b', 'c'],
        }).addTo(map);

        const markersGroup = L.layerGroup().addTo(map);
        markersLayerRef.current = markersGroup;
        mapInstanceRef.current = map;
      }

      const map = mapInstanceRef.current;
      if (map) {
        map.invalidateSize();
        setTimeout(() => map.invalidateSize(), 150);
        setTimeout(() => map.invalidateSize(), 350);
      }

      // If there's an existing polygon, fit map bounds to it
      if (customPolygon && customPolygon.length >= 2 && mapInstanceRef.current) {
        const bounds = L.latLngBounds(customPolygon.map((p) => [p[0], p[1]]));
        mapInstanceRef.current.fitBounds(bounds, { padding: [30, 30] });
      }

      // Re-render markers of listings
      renderMapMarkers();
      // Re-render existing polygon if any
      renderPolygon(drawnPoints);
    }, 100);

    return () => {
      clearTimeout(timer);
    };
  }, [isOpen, activeTab, selectedCity]);

  // Cleanup map on full modal unmount
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

  // Update polygon overlay
  const renderPolygon = (points: [number, number][]) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (drawLayerRef.current) {
      map.removeLayer(drawLayerRef.current);
      drawLayerRef.current = null;
    }

    if (points.length >= 2) {
      const poly = L.polygon(points, {
        color: '#4F46E5',
        fillColor: '#6366F1',
        fillOpacity: 0.25,
        weight: 3,
        dashArray: points.length >= 3 ? undefined : '5, 5',
      }).addTo(map);
      drawLayerRef.current = poly;
    }
  };

  // Render listings on the map (NUNCA VACÍO)
  const renderMapMarkers = () => {
    const markersGroup = markersLayerRef.current;
    if (!markersGroup) return;
    markersGroup.clearLayers();

    const displayListings = (listings && listings.length > 0) ? listings : SEED_LISTINGS;

    displayListings.forEach((item) => {
      if (!item.latitude || !item.longitude) return;

      const priceLabel = `${item.rent}€`;
      const isInside = drawnPoints.length >= 3 
        ? isPointInPolygon([item.latitude, item.longitude], drawnPoints)
        : true;

      const markerHtml = `
        <div style="
          background: ${isInside ? '#1E1B4B' : '#94A3B8'};
          color: white;
          padding: 2px 7px;
          border-radius: 9999px;
          font-size: 10px;
          font-weight: 800;
          box-shadow: 0 2px 6px rgba(0,0,0,0.25);
          border: 1.5px solid ${isInside ? '#F59E0B' : 'white'};
          white-space: nowrap;
          transform: translate(-50%, -50%);
          cursor: pointer;
        ">
          ${priceLabel}
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-rent-price-marker',
        html: markerHtml,
        iconSize: [40, 20],
        iconAnchor: [20, 10],
      });

      L.marker([item.latitude, item.longitude], { icon: customIcon }).addTo(markersGroup);
    });
  };

  // Handle click & freehand drag on map to add points to polygon
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || activeTab !== 'draw') return;

    // Toggle dragging: when drawing, disable map pan so user draws smoothly without moving map
    if (isDrawing) {
      map.dragging.disable();
    } else {
      map.dragging.enable();
    }

    let isPointerDown = false;
    let lastAddTimestamp = 0;
    let didMove = false;

    const addPoint = (lat: number, lng: number) => {
      setDrawnPoints((prev) => {
        // Prevent duplicate adjacent points
        if (prev.length > 0) {
          const last = prev[prev.length - 1];
          const dist = Math.hypot(last[0] - lat, last[1] - lng);
          if (dist < 0.0001) return prev;
        }
        return [...prev, [lat, lng]];
      });
    };

    const handleMouseDown = (e: L.LeafletMouseEvent) => {
      if (!isDrawing) return;
      isPointerDown = true;
      didMove = false;
      addPoint(e.latlng.lat, e.latlng.lng);
    };

    const handleMouseUp = () => {
      isPointerDown = false;
    };

    const handleMouseMove = (e: L.LeafletMouseEvent) => {
      if (!isDrawing || !isPointerDown) return;
      const now = Date.now();
      if (now - lastAddTimestamp < 50) return; // throttle 50ms for smooth curve
      lastAddTimestamp = now;
      didMove = true;
      addPoint(e.latlng.lat, e.latlng.lng);
    };

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      if (!isDrawing || didMove) return;
      addPoint(e.latlng.lat, e.latlng.lng);
    };

    // Touch support for mobile devices
    const container = map.getContainer();
    const handleTouchStart = (e: TouchEvent) => {
      if (!isDrawing || e.touches.length !== 1) return;
      isPointerDown = true;
      didMove = false;
      const touch = e.touches[0];
      const rect = container.getBoundingClientRect();
      const point = L.point(touch.clientX - rect.left, touch.clientY - rect.top);
      const latlng = map.containerPointToLatLng(point);
      addPoint(latlng.lat, latlng.lng);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDrawing || !isPointerDown || e.touches.length !== 1) return;
      const now = Date.now();
      if (now - lastAddTimestamp < 50) return;
      lastAddTimestamp = now;
      didMove = true;
      const touch = e.touches[0];
      const rect = container.getBoundingClientRect();
      const point = L.point(touch.clientX - rect.left, touch.clientY - rect.top);
      const latlng = map.containerPointToLatLng(point);
      addPoint(latlng.lat, latlng.lng);
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
  }, [activeTab, isDrawing]);

  // Sync polygon whenever drawnPoints changes
  useEffect(() => {
    renderPolygon(drawnPoints);
    renderMapMarkers();
  }, [drawnPoints]);

  if (!isOpen) return null;

  // Calculate count of listings inside drawn polygon
  const listingsInsideCount = drawnPoints.length >= 3
    ? listings.filter((l) => l.latitude && l.longitude && isPointInPolygon([l.latitude, l.longitude], drawnPoints)).length
    : listings.length;

  const handleClearZone = () => {
    setDrawnPoints([]);
    if (drawLayerRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(drawLayerRef.current);
      drawLayerRef.current = null;
    }
  };

  const handleUndoPoint = () => {
    setDrawnPoints((prev) => {
      if (prev.length <= 1) {
        if (drawLayerRef.current && mapInstanceRef.current) {
          mapInstanceRef.current.removeLayer(drawLayerRef.current);
          drawLayerRef.current = null;
        }
        return [];
      }
      return prev.slice(0, prev.length - 1);
    });
  };

  const handleApplyZone = () => {
    if (drawnPoints.length >= 3) {
      // Find closest city name to the center of the polygon
      const avgLat = drawnPoints.reduce((acc, p) => acc + p[0], 0) / drawnPoints.length;
      const avgLng = drawnPoints.reduce((acc, p) => acc + p[1], 0) / drawnPoints.length;
      const closest = findClosestSpanishCity(avgLat, avgLng);

      if (onSelectCustomZone) {
        onSelectCustomZone(drawnPoints, closest.name);
      } else {
        onSelectCity(closest);
      }
      onClose();
    }
  };

  const handleCenterGps = async () => {
    setIsLocating(true);
    try {
      const res = await detectOrActivateLocation();
      if (mapInstanceRef.current) {
        mapInstanceRef.current.flyTo([res.lat, res.lng], 14, { duration: 1 });
      }
      setFeedbackMsg(`📍 Centrado en ${res.city}`);
      setTimeout(() => setFeedbackMsg(null), 3000);
    } catch {
      setFeedbackMsg('No se pudo obtener el GPS.');
    } finally {
      setIsLocating(false);
    }
  };

  const handleAutoActivateFromList = async () => {
    setIsLocating(true);
    setFeedbackMsg(null);
    try {
      const result = await detectOrActivateLocation();
      const cityObj = SPANISH_CITIES_CATALOG.find(
        (c) => c.name.toLowerCase() === result.city.toLowerCase()
      ) || {
        name: result.city,
        province: result.province || result.city,
        region: result.region || 'España',
        lat: result.lat,
        lng: result.lng,
      };

      setFeedbackMsg(`✓ ${result.message}`);
      setTimeout(() => {
        onSelectCity(cityObj);
        onClose();
      }, 600);
    } catch {
      setFeedbackMsg('No se pudo detectar automáticamente. Elige una ciudad abajo.');
    } finally {
      setIsLocating(false);
    }
  };

  const handleCityPick = (city: SpanishCity) => {
    onSelectCity(city);
    onClose();
  };

  const filteredCities = SPANISH_CITIES_CATALOG.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.province.toLowerCase().includes(search.toLowerCase()) ||
      c.region.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div
        className="bg-white rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-stone-200 relative flex flex-col max-h-[92vh] overflow-hidden"
        id="location-picker-modal"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-colors z-20"
          id="btn-close-location-modal"
          title="Cerrar modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-[#D97706] flex items-center justify-center shadow-2xs shrink-0">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-[#1E1B4B]">{title}</h2>
            <p className="text-[11px] text-stone-500">
              Dibuja tu zona personalizada en el mapa o busca por ciudad
            </p>
          </div>
        </div>

        {/* TABS SELECTOR (Dibujar zona vs Lista de ciudades) */}
        <div className="flex bg-stone-100 p-1 rounded-2xl mb-3 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('draw')}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'draw'
                ? 'bg-white text-[#1E1B4B] shadow-xs'
                : 'text-stone-600 hover:text-[#1E1B4B]'
            }`}
            id="tab-draw-zone"
          >
            <Pencil className="w-3.5 h-3.5 text-amber-500" />
            <span>Dibujar zona en el mapa</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('list')}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'list'
                ? 'bg-white text-[#1E1B4B] shadow-xs'
                : 'text-stone-600 hover:text-[#1E1B4B]'
            }`}
            id="tab-city-list"
          >
            <Search className="w-3.5 h-3.5 text-indigo-500" />
            <span>Lista de ciudades y GPS</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: DIBUJAR ZONA EN EL MAPA (Idealista Style) */}
        {/* ========================================================================= */}
        {activeTab === 'draw' && (
          <div className="flex flex-col flex-1 min-h-0 space-y-2.5 animate-fade-in">
            {/* Drawing Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-1.5 bg-amber-50/70 border border-amber-200/80 p-2 rounded-2xl">
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setIsDrawing(!isDrawing)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                    isDrawing
                      ? 'bg-[#1E1B4B] text-white shadow-xs'
                      : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-50'
                  }`}
                  id="btn-toggle-drawing"
                  title={isDrawing ? 'Pausar modo dibujo para mover el mapa' : 'Activar lápiz para trazar tu zona'}
                >
                  <Pencil className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isDrawing ? 'Modo dibujo activo' : 'Activar lápiz'}</span>
                </button>

                {drawnPoints.length > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={handleUndoPoint}
                      className="px-2 py-1.5 rounded-xl text-xs font-bold text-stone-700 bg-white hover:bg-stone-50 border border-stone-200 transition-colors flex items-center gap-1"
                      id="btn-undo-point"
                      title="Deshacer último punto"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-stone-600" />
                      <span>Deshacer</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleClearZone}
                      className="px-2 py-1.5 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors flex items-center gap-1"
                      id="btn-clear-drawn-zone"
                      title="Borrar todos los puntos trazados"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Borrar</span>
                    </button>
                  </>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                {/* City Quick Centering Dropdown */}
                <select
                  value={SPANISH_CITIES_CATALOG.some(c => c.name.toLowerCase() === selectedCity.toLowerCase()) ? selectedCity : 'Málaga'}
                  onChange={(e) => {
                    const cityName = e.target.value;
                    const found = SPANISH_CITIES_CATALOG.find((c) => c.name.toLowerCase() === cityName.toLowerCase());
                    if (found && mapInstanceRef.current) {
                      mapInstanceRef.current.flyTo([found.lat, found.lng], 13, { duration: 0.8 });
                      setFeedbackMsg(`📍 Mapa centrado en ${found.name}`);
                      setTimeout(() => setFeedbackMsg(null), 2500);
                    }
                  }}
                  className="px-2 py-1 bg-white border border-stone-200 rounded-xl text-xs font-bold text-[#1E1B4B] focus:outline-hidden"
                  title="Centrar mapa en una ciudad española"
                >
                  {SPANISH_CITIES_CATALOG.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>

                {/* GPS button */}
                <button
                  type="button"
                  onClick={handleCenterGps}
                  disabled={isLocating}
                  className="px-2 py-1.5 rounded-xl text-xs font-bold bg-white text-[#1E1B4B] border border-stone-200 hover:bg-stone-50 transition-colors flex items-center gap-1 disabled:opacity-50"
                  id="btn-modal-map-gps"
                  title="Centrar mapa en mi ubicación actual por GPS"
                >
                  {isLocating ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />
                  ) : (
                    <Navigation className="w-3.5 h-3.5 text-[#0FA3A3]" />
                  )}
                  <span>GPS</span>
                </button>
              </div>
            </div>

            {/* Instruction Banner */}
            <div className="text-[11px] text-stone-600 bg-stone-50 px-2.5 py-1.5 rounded-xl border border-stone-200 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                <span>
                  {drawnPoints.length < 3
                    ? `Dibuja con el ratón o dedo sobre el mapa para delimitar tu zona de búsqueda (${drawnPoints.length}/3 mín)`
                    : `Zona delimitada con ${drawnPoints.length} vértices`}
                </span>
              </span>
              {drawnPoints.length >= 3 && (
                <span className="font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                  {listingsInsideCount} pisos encontrados
                </span>
              )}
            </div>

            {/* Interactive Leaflet Map Container */}
            <div className="relative w-full h-64 sm:h-72 rounded-2xl overflow-hidden border border-stone-300 shadow-inner">
              <div ref={mapContainerRef} className="w-full h-full z-10" />

              {/* Floating Map Zoom Controls */}
              <div className="absolute right-2.5 top-2.5 z-20 flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => mapInstanceRef.current?.zoomIn()}
                  className="w-7 h-7 rounded-lg bg-white/90 backdrop-blur-xs text-[#1E1B4B] flex items-center justify-center shadow-md border border-stone-200 hover:bg-white"
                  title="Acercar mapa"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => mapInstanceRef.current?.zoomOut()}
                  className="w-7 h-7 rounded-lg bg-white/90 backdrop-blur-xs text-[#1E1B4B] flex items-center justify-center shadow-md border border-stone-200 hover:bg-white"
                  title="Alejar mapa"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Toast inside map */}
              {feedbackMsg && (
                <div className="absolute top-2.5 left-1/2 -translate-x-1/2 z-20 bg-[#1E1B4B] text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-lg border border-amber-400 animate-fade-in">
                  {feedbackMsg}
                </div>
              )}
            </div>

            {/* Preview of listings inside drawn zone */}
            {drawnPoints.length >= 3 && listingsInsideCount > 0 && (
              <div className="bg-stone-50 border border-stone-200/80 rounded-2xl p-2 animate-fade-in">
                <div className="flex items-center justify-between text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1.5 px-1">
                  <span>Viviendas disponibles en tu zona</span>
                  <span className="text-[#1E1B4B]">{listingsInsideCount} resultado{listingsInsideCount !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                  {listings
                    .filter((l) => l.latitude && l.longitude && isPointInPolygon([l.latitude, l.longitude], drawnPoints))
                    .slice(0, 4)
                    .map((item) => (
                      <div
                        key={item.id}
                        className="shrink-0 bg-white border border-stone-200 rounded-xl px-2.5 py-1 text-[11px] shadow-2xs flex items-center gap-1.5"
                      >
                        <span className="font-extrabold text-[#1E1B4B]">{item.rent}€</span>
                        <span className="text-stone-500 truncate max-w-[110px]">{item.title || item.city}</span>
                      </div>
                    ))}
                  {listingsInsideCount > 4 && (
                    <span className="shrink-0 text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-xl">
                      +{listingsInsideCount - 4} más
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Apply Drawn Zone Button */}
            <div className="pt-1">
              <button
                type="button"
                onClick={handleApplyZone}
                disabled={drawnPoints.length < 3}
                className={`w-full py-3 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 ${
                  drawnPoints.length >= 3
                    ? 'bg-gradient-to-r from-[#1E1B4B] to-[#2E2870] text-white hover:opacity-95'
                    : 'bg-stone-200 text-stone-400 cursor-not-allowed shadow-none'
                }`}
                id="btn-apply-drawn-zone"
              >
                <CheckCircle2 className="w-4 h-4 text-amber-400" />
                <span>
                  {drawnPoints.length >= 3
                    ? `Buscar alquiler en esta zona (${listingsInsideCount} viviendas)`
                    : 'Traza al menos 3 puntos en el mapa para aplicar'}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: LISTA DE CIUDADES & DETECCIÓN AUTOMÁTICA GPS */}
        {/* ========================================================================= */}
        {activeTab === 'list' && (
          <div className="flex flex-col flex-1 min-h-0 animate-fade-in">
            {/* 1-Click Automatic Activation Button */}
            <div className="mb-3">
              <button
                type="button"
                onClick={handleAutoActivateFromList}
                disabled={isLocating}
                className="w-full py-2.5 px-3.5 rounded-2xl bg-gradient-to-r from-[#1E1B4B] to-[#2E2870] hover:opacity-95 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 disabled:opacity-60"
                id="btn-auto-detect-location"
              >
                {isLocating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                    <span>Detectando tu ubicación actual...</span>
                  </>
                ) : (
                  <>
                    <Navigation className="w-4 h-4 text-amber-400" />
                    <span>Activar ubicación automáticamente (GPS / IP)</span>
                  </>
                )}
              </button>

              {feedbackMsg && (
                <p className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl p-2 mt-2 text-center animate-fade-in">
                  {feedbackMsg}
                </p>
              )}
            </div>

            {/* Search input */}
            <div className="relative mb-2.5">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar ciudad o provincia en España..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200 bg-stone-50 text-xs font-semibold text-stone-900 focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#1E1B4B]"
                id="input-search-city"
              />
            </div>

            {/* Popular Spanish Cities Quick Chips */}
            {!search && (
              <div className="mb-2.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1.5 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  Ciudades más buscadas
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      handleCityPick({
                        name: 'all',
                        province: 'Toda España',
                        region: 'España',
                        lat: 40.4168,
                        lng: -3.7038,
                      });
                    }}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                      selectedCity === 'all' || selectedCity.toLowerCase() === 'toda españa'
                        ? 'bg-[#1E1B4B] text-white shadow-2xs'
                        : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                    }`}
                  >
                    🇪🇸 Toda España
                  </button>
                  {['Málaga', 'Sevilla', 'Granada', 'Córdoba', 'Madrid', 'Barcelona', 'Valencia', 'Bilbao'].map(
                    (cityName) => {
                      const isCur = selectedCity.toLowerCase() === cityName.toLowerCase();
                      return (
                        <button
                          key={cityName}
                          type="button"
                          onClick={() => {
                            const found = SPANISH_CITIES_CATALOG.find(
                              (c) => c.name.toLowerCase() === cityName.toLowerCase()
                            );
                            if (found) handleCityPick(found);
                          }}
                          className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                            isCur
                              ? 'bg-[#1E1B4B] text-white shadow-2xs'
                              : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                          }`}
                        >
                          {cityName}
                        </button>
                      );
                    }
                  )}
                </div>
              </div>
            )}

            {/* Scrollable list of cities */}
            <div className="flex-1 overflow-y-auto space-y-1 pr-1 max-h-56 divide-y divide-stone-100">
              {filteredCities.map((c) => {
                const isSelected = selectedCity.toLowerCase() === c.name.toLowerCase();
                return (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => handleCityPick(c)}
                    className={`w-full py-2 px-3 rounded-xl text-left flex items-center justify-between transition-colors ${
                      isSelected ? 'bg-indigo-50/80 text-[#1E1B4B]' : 'hover:bg-stone-50 text-stone-700'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold flex items-center gap-1.5">
                        <MapPin className={`w-3.5 h-3.5 ${isSelected ? 'text-[#D97706]' : 'text-stone-400'}`} />
                        <span>{c.name}</span>
                      </div>
                      <span className="text-[10px] text-stone-400 ml-5">
                        {c.province} • {c.region}
                      </span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-[#1E1B4B]" />}
                  </button>
                );
              })}

              {filteredCities.length === 0 && (
                <p className="text-xs text-stone-400 text-center py-4">No se encontraron ciudades con ese nombre.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
