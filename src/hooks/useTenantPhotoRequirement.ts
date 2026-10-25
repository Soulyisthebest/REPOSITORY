import React, { useState, useCallback, useMemo } from 'react';

export const MIN_TENANT_PHOTOS = 3;

export const SAMPLE_TENANT_PHOTOS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=600&q=80',
];

export interface UseTenantPhotoRequirementOptions {
  initialPhotos?: string[];
  minRequired?: number;
  onPhotosChange?: (photos: string[]) => void;
}

export interface TenantPhotoRequirementState {
  photos: string[];
  photoCount: number;
  minRequired: number;
  isSatisfied: boolean;
  remainingNeeded: number;
  statusMessage: string;
  requirementMessage: string;
  validationErrorMessage: string;
  addPhoto: (url: string) => void;
  addPhotos: (urls: string[]) => void;
  removePhoto: (index: number) => void;
  addSamplePhotos: (count?: number) => void;
  setPhotos: React.Dispatch<React.SetStateAction<string[]>>;
  resetPhotos: (newPhotos?: string[]) => void;
}

/**
 * Hook centralizado para el requisito de 3 fotos mínimas del inquilino (Prioridad 10.2).
 * Unifica el conteo, validación, cálculo de fotos restantes y mensajes de estado.
 */
export function useTenantPhotoRequirement(
  optionsOrInitialPhotos: UseTenantPhotoRequirementOptions | string[] = {}
): TenantPhotoRequirementState {
  const options: UseTenantPhotoRequirementOptions = Array.isArray(optionsOrInitialPhotos)
    ? { initialPhotos: optionsOrInitialPhotos }
    : optionsOrInitialPhotos;

  const minRequired = options.minRequired ?? MIN_TENANT_PHOTOS;
  const [photos, setPhotosState] = useState<string[]>(options.initialPhotos || []);

  const setPhotos = useCallback(
    (action: React.SetStateAction<string[]>) => {
      setPhotosState((prev) => {
        const next = typeof action === 'function' ? action(prev) : action;
        options.onPhotosChange?.(next);
        return next;
      });
    },
    [options]
  );

  const photoCount = photos.length;
  const isSatisfied = photoCount >= minRequired;
  const remainingNeeded = Math.max(0, minRequired - photoCount);

  const statusMessage = useMemo(() => {
    if (isSatisfied) {
      return `✓ ${photoCount} fotos listas`;
    }
    return `Faltan ${remainingNeeded} ${remainingNeeded === 1 ? 'foto más' : 'fotos más'}`;
  }, [isSatisfied, photoCount, remainingNeeded]);

  const requirementMessage =
    'Como inquilino, es estrictamente obligatorio subir un mínimo de 3 fotos tuyas para garantizar máxima confianza con los propietarios antes de poder mirar o solicitar viviendas.';

  const validationErrorMessage = `Es obligatorio subir al menos ${minRequired} fotografías tuyas para verificar tu identidad y generar confianza ante los propietarios (actualmente tienes ${photoCount}/${minRequired}).`;

  const addPhoto = useCallback(
    (url: string) => {
      const cleanUrl = url.trim();
      if (!cleanUrl) return;
      setPhotos((prev) => [...prev, cleanUrl]);
    },
    [setPhotos]
  );

  const addPhotos = useCallback(
    (urls: string[]) => {
      const cleanUrls = urls.map((u) => u.trim()).filter(Boolean);
      if (cleanUrls.length === 0) return;
      setPhotos((prev) => [...prev, ...cleanUrls]);
    },
    [setPhotos]
  );

  const removePhoto = useCallback(
    (index: number) => {
      setPhotos((prev) => prev.filter((_, i) => i !== index));
    },
    [setPhotos]
  );

  const addSamplePhotos = useCallback(
    (count?: number) => {
      setPhotos((prev) => {
        const needed = count !== undefined ? count : Math.max(1, minRequired - prev.length);
        const available = SAMPLE_TENANT_PHOTOS.filter((p) => !prev.includes(p));
        const toAdd = available.slice(0, needed);
        if (toAdd.length > 0) {
          return [...prev, ...toAdd];
        }
        const fallback = SAMPLE_TENANT_PHOTOS[Math.floor(Math.random() * SAMPLE_TENANT_PHOTOS.length)];
        return [...prev, fallback];
      });
    },
    [minRequired, setPhotos]
  );

  const resetPhotos = useCallback(
    (newPhotos: string[] = []) => {
      setPhotos(newPhotos);
    },
    [setPhotos]
  );

  return {
    photos,
    photoCount,
    minRequired,
    isSatisfied,
    remainingNeeded,
    statusMessage,
    requirementMessage,
    validationErrorMessage,
    addPhoto,
    addPhotos,
    removePhoto,
    addSamplePhotos,
    setPhotos,
    resetPhotos,
  };
}
