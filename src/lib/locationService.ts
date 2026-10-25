export interface SpanishCity {
  name: string;
  province: string;
  region: string;
  lat: number;
  lng: number;
}

export const SPANISH_CITIES_CATALOG: SpanishCity[] = [
  // Andalucía
  { name: 'Málaga', province: 'Málaga', region: 'Andalucía', lat: 36.7213, lng: -4.4214 },
  { name: 'Sevilla', province: 'Sevilla', region: 'Andalucía', lat: 37.3891, lng: -5.9845 },
  { name: 'Granada', province: 'Granada', region: 'Andalucía', lat: 37.1773, lng: -3.5986 },
  { name: 'Córdoba', province: 'Córdoba', region: 'Andalucía', lat: 37.8882, lng: -4.7794 },
  { name: 'Cádiz', province: 'Cádiz', region: 'Andalucía', lat: 36.5271, lng: -6.2886 },
  { name: 'Almería', province: 'Almería', region: 'Andalucía', lat: 36.8381, lng: -2.4597 },
  { name: 'Jaén', province: 'Jaén', region: 'Andalucía', lat: 37.7796, lng: -3.7849 },
  { name: 'Huelva', province: 'Huelva', region: 'Andalucía', lat: 37.2614, lng: -6.9447 },
  { name: 'Marbella', province: 'Málaga', region: 'Andalucía', lat: 36.5101, lng: -4.8824 },
  { name: 'Jerez de la Frontera', province: 'Cádiz', region: 'Andalucía', lat: 36.6850, lng: -6.1264 },
  
  // Madrid y Centro
  { name: 'Madrid', province: 'Madrid', region: 'Comunidad de Madrid', lat: 40.4168, lng: -3.7038 },
  { name: 'Toledo', province: 'Toledo', region: 'Castilla-La Mancha', lat: 39.8628, lng: -4.0273 },
  { name: 'Salamanca', province: 'Salamanca', region: 'Castilla y León', lat: 40.9701, lng: -5.6635 },
  { name: 'Valladolid', province: 'Valladolid', region: 'Castilla y León', lat: 41.6523, lng: -4.7245 },
  { name: 'Burgos', province: 'Burgos', region: 'Castilla y León', lat: 42.3440, lng: -3.6969 },

  // Cataluña y Levante
  { name: 'Barcelona', province: 'Barcelona', region: 'Cataluña', lat: 41.3851, lng: 2.1734 },
  { name: 'Valencia', province: 'Valencia', region: 'Comunitat Valenciana', lat: 39.4699, lng: -0.3763 },
  { name: 'Alicante', province: 'Alicante', region: 'Comunitat Valenciana', lat: 38.3452, lng: -0.4810 },
  { name: 'Castellón', province: 'Castellón', region: 'Comunitat Valenciana', lat: 39.9864, lng: -0.0513 },
  { name: 'Murcia', province: 'Murcia', region: 'Región de Murcia', lat: 37.9922, lng: -1.1307 },

  // Norte y Noroeste
  { name: 'Bilbao', province: 'Bizkaia', region: 'País Vasco', lat: 43.2630, lng: -2.9350 },
  { name: 'San Sebastián', province: 'Gipuzkoa', region: 'País Vasco', lat: 43.3183, lng: -1.9812 },
  { name: 'Vitoria-Gasteiz', province: 'Álava', region: 'País Vasco', lat: 42.8469, lng: -2.6716 },
  { name: 'Santander', province: 'Cantabria', region: 'Cantabria', lat: 43.4623, lng: -3.8099 },
  { name: 'Zaragoza', province: 'Zaragoza', region: 'Aragón', lat: 41.6488, lng: -0.8891 },
  { name: 'Pamplona', province: 'Navarra', region: 'Navarra', lat: 42.8125, lng: -1.6458 },
  { name: 'A Coruña', province: 'A Coruña', region: 'Galicia', lat: 43.3623, lng: -8.4115 },
  { name: 'Vigo', province: 'Pontevedra', region: 'Galicia', lat: 42.2406, lng: -8.7207 },
  { name: 'Gijón', province: 'Asturias', region: 'Asturias', lat: 43.5322, lng: -5.6611 },
  { name: 'Oviedo', province: 'Asturias', region: 'Asturias', lat: 43.3619, lng: -5.8494 },

  // Islas
  { name: 'Palma de Mallorca', province: 'Illes Balears', region: 'Islas Baleares', lat: 39.5696, lng: 2.6502 },
  { name: 'Las Palmas', province: 'Las Palmas', region: 'Canarias', lat: 28.1248, lng: -15.4300 },
  { name: 'Santa Cruz de Tenerife', province: 'Santa Cruz de Tenerife', region: 'Canarias', lat: 28.4636, lng: -16.2518 },
];

/**
 * Calculates distance in Kilometers between 2 coordinates using Haversine formula
 */
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Returns closest Spanish city from coordinates
 */
export function findClosestSpanishCity(lat: number, lng: number): SpanishCity {
  let closest = SPANISH_CITIES_CATALOG[0];
  let minDistance = Infinity;

  for (const city of SPANISH_CITIES_CATALOG) {
    const dist = calculateDistanceKm(lat, lng, city.lat, city.lng);
    if (dist < minDistance) {
      minDistance = dist;
      closest = city;
    }
  }

  return closest;
}

/**
 * Algoritmo Ray-Casting para determinar si un punto [lat, lng] está dentro de un polígono dibujado.
 */
export function isPointInPolygon(point: [number, number], polygon: [number, number][]): boolean {
  if (!polygon || polygon.length < 3) return true;
  const x = point[0]; // latitude
  const y = point[1]; // longitude
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0];
    const yi = polygon[i][1];
    const xj = polygon[j][0];
    const yj = polygon[j][1];

    const intersect = ((yi > y) !== (yj > y)) && (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

export interface LocationActivationResult {
  success: boolean;
  city: string;
  province?: string;
  region?: string;
  lat: number;
  lng: number;
  source: 'gps' | 'ip' | 'saved' | 'default';
  message: string;
}

/**
 * Robust location activation:
 * 1. Attempts browser GPS (with 3.5s timeout)
 * 2. If GPS fails or is denied (common in iframes), automatically falls back to IP geolocation
 * 3. Returns city and coordinates
 */
export async function detectOrActivateLocation(): Promise<LocationActivationResult> {
  // Step 1: Try Browser Geolocation API (fast 2.5s timeout for snappy UI)
  if (typeof navigator !== 'undefined' && navigator.geolocation) {
    try {
      const gpsResult = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 2500,
          maximumAge: 120000,
        });
      });

      const { latitude, longitude } = gpsResult.coords;
      const closestCity = findClosestSpanishCity(latitude, longitude);

      try {
        localStorage.setItem('rentia_user_selected_city', closestCity.name);
        localStorage.setItem('rentia_user_lat', String(latitude));
        localStorage.setItem('rentia_user_lng', String(longitude));
      } catch {}

      return {
        success: true,
        city: closestCity.name,
        province: closestCity.province,
        region: closestCity.region,
        lat: latitude,
        lng: longitude,
        source: 'gps',
        message: `Ubicación GPS activada: ${closestCity.name}`,
      };
    } catch {
      // Browser GPS denied or timed out (common inside iframes). Proceed to backend IP detection.
    }
  }

  // Step 2: Try Backend IP Geolocation Detection
  try {
    const res = await fetch('/api/public/detect-location');
    if (res.ok) {
      const data = await res.json();
      if (data.city) {
        // Find if matches or closest to catalog
        const match = SPANISH_CITIES_CATALOG.find(
          (c) => c.name.toLowerCase() === data.city.toLowerCase()
        ) || findClosestSpanishCity(data.latitude || 36.7213, data.longitude || -4.4214);

        try {
          localStorage.setItem('rentia_user_selected_city', match.name);
          localStorage.setItem('rentia_user_lat', String(match.lat));
          localStorage.setItem('rentia_user_lng', String(match.lng));
        } catch {}

        return {
          success: true,
          city: match.name,
          province: match.province,
          region: match.region,
          lat: data.latitude || match.lat,
          lng: data.longitude || match.lng,
          source: 'ip',
          message: `Ubicación activada: ${match.name}`,
        };
      }
    }
  } catch {
    // IP fallback failed
  }

  // Step 3: Check previously saved city in localStorage
  try {
    const saved = localStorage.getItem('rentia_user_selected_city');
    if (saved) {
      const matched = SPANISH_CITIES_CATALOG.find((c) => c.name.toLowerCase() === saved.toLowerCase());
      if (matched) {
        return {
          success: true,
          city: matched.name,
          province: matched.province,
          region: matched.region,
          lat: matched.lat,
          lng: matched.lng,
          source: 'saved',
          message: `Ubicación seleccionada: ${matched.name}`,
        };
      }
    }
  } catch {}

  // Step 4: Default fallback to Málaga (epicentro de Rentia)
  const defaultCity = SPANISH_CITIES_CATALOG[0];
  return {
    success: true,
    city: defaultCity.name,
    province: defaultCity.province,
    region: defaultCity.region,
    lat: defaultCity.lat,
    lng: defaultCity.lng,
    source: 'default',
    message: `Ubicación activada: ${defaultCity.name}`,
  };
}
