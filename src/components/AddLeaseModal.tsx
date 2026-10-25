import React, { useState, useRef } from 'react';
import { 
  X, 
  Camera, 
  Image as ImageIcon, 
  FolderOpen, 
  Sparkles, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Edit3, 
  Trash2, 
  Plus, 
  ShieldCheck, 
  ChevronRight 
} from 'lucide-react';
import { RentalLease, ContractFilePage, ExtractedContractData } from '../types';
import { Language, TRANSLATIONS } from '../i18n/translations';
import { api } from '../api/client';

interface AddLeaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddLease: (lease: RentalLease) => void;
  language: Language;
}

const COUNTRIES = [
  { name: 'España', code: 'ES', flag: '🇪🇸', currency: '€' },
  { name: 'France', code: 'FR', flag: '🇫🇷', currency: '€' },
  { name: 'الإمارات / العالم العربي', code: 'AR', flag: '🇦🇪', currency: '$' },
  { name: 'United Kingdom', code: 'UK', flag: '🇬🇧', currency: '£' },
  { name: 'Deutschland', code: 'DE', flag: '🇩🇪', currency: '€' },
  { name: 'Italia', code: 'IT', flag: '🇮🇹', currency: '€' },
  { name: 'Portugal', code: 'PT', flag: '🇵🇹', currency: '€' },
];

export const AddLeaseModal: React.FC<AddLeaseModalProps> = ({
  isOpen,
  onClose,
  onAddLease,
  language,
}) => {
  const t = TRANSLATIONS[language];

  // Hidden native file input references for iPhone triggers
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const photosInputRef = useRef<HTMLInputElement>(null);
  const filesInputRef = useRef<HTMLInputElement>(null);

  // Workflow states: 'select_mode' | 'analyzing' | 'review_extracted' | 'manual_edit'
  const [step, setStep] = useState<'select_mode' | 'analyzing' | 'review_extracted'>('select_mode');

  // Staged multi-page document pages
  const [pages, setPages] = useState<ContractFilePage[]>([]);

  // Extracted data & editable form fields
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('29001');
  const [province, setProvince] = useState('Málaga');
  const [country, setCountry] = useState(COUNTRIES[0]);
  const [monthlyRent, setMonthlyRent] = useState<number>(1100);
  const [deposit, setDeposit] = useState<number>(2200);
  const [landlordName, setLandlordName] = useState('');
  const [landlordEmail, setLandlordEmail] = useState('');
  const [startDate, setStartDate] = useState('2023-09');
  const [endDate, setEndDate] = useState('Actual');
  const [confidenceScore, setConfidenceScore] = useState<number>(0.98);

  // Requisitos específicos: Foto suya, contacto del inquilino y ubicación detallada
  const [tenantPhoto, setTenantPhoto] = useState<string | null>(null);
  const [tenantPhone, setTenantPhone] = useState<string>('');
  const [tenantContactEmail, setTenantContactEmail] = useState<string>('');

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Process incoming files from iPhone (Camera, Photo library, or Files PDF)
  const handleFilesAdded = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setError(null);

    const newPages: ContractFilePage[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      // Size limit: 25MB
      if (file.size > 25 * 1024 * 1024) {
        setError(language === 'fr' ? `Le fichier ${file.name} dépasse la limite de 25 Mo.` : `File exceeds 25MB limit.`);
        continue;
      }

      const dataUrl = await readFileAsDataUrl(file);
      newPages.push({
        id: `page_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        dataUrl,
        file,
        name: file.name,
        size: file.size,
        type: file.type || (file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
      });
    }

    if (newPages.length > 0) {
      setPages((prev) => [...prev, ...newPages]);
    }
  };

  const readFileAsDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleRemovePage = (id: string) => {
    setPages((prev) => prev.filter((p) => p.id !== id));
  };

  // Launch Gemini AI multi-page contract extraction
  const handleLaunchGeminiExtraction = async () => {
    if (pages.length === 0) {
      setError(
        language === 'fr'
          ? 'Veuillez ajouter au moins une page ou photo de votre contrat.'
          : language === 'es'
          ? 'Por favor, añade al menos una página o foto de tu contrato.'
          : 'Please add at least one page or photo of your contract.'
      );
      return;
    }

    setIsAnalyzing(true);
    setStep('analyzing');
    setError(null);

    try {
      const result = await api.leases.extractContract({
        pages: pages.map((p) => ({
          dataUrl: p.dataUrl,
          mimeType: p.type,
          name: p.name,
        })),
      });

      if (result?.extracted) {
        populateFieldsFromExtraction(result.extracted);
        setStep('review_extracted');
      } else {
        throw new Error(
          language === 'fr'
            ? 'Aucune information n’a pu être extraite du document.'
            : language === 'es'
            ? 'No se pudieron extraer los datos del documento.'
            : 'No information could be extracted from document.'
        );
      }
    } catch (err: any) {
      console.error('Erreur extraction Gemini:', err);
      setStep('select_mode');
      const errorMsg = err?.message || (
        language === 'fr' 
          ? 'Impossible d’extraire automatiquement les informations du document. Vous pouvez vérifier le fichier ou saisir les détails manuellement.' 
          : language === 'es'
          ? 'No se pudo analizar el documento con Gemini. Puedes comprobar el archivo o introducir los datos manualmente.'
          : 'Could not automatically extract document details. You can check the file or enter details manually.'
      );
      setError(errorMsg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const populateFieldsFromExtraction = (data: ExtractedContractData) => {
    if (data.address) {
      const parts = data.address.split(',');
      setAddress(parts[0]?.trim() || data.address);
      if (parts[1] && !data.city) setCity(parts[1].trim());
    }
    if (data.city) setCity(data.city);
    if (data.landlordName) setLandlordName(data.landlordName);
    if (data.landlordContact) setLandlordEmail(data.landlordContact);
    if (data.rent) setMonthlyRent(Number(data.rent));
    if (data.deposit) setDeposit(Number(data.deposit));
    if (data.startDate) setStartDate(data.startDate);
    if (data.endDate) setEndDate(data.endDate);
    if (data.confidence?.overall) setConfidenceScore(data.confidence.overall);

    if (data.country) {
      const matched = COUNTRIES.find(
        (c) => c.name.toLowerCase() === data.country?.toLowerCase() || c.code.toLowerCase() === data.country?.toLowerCase()
      );
      if (matched) setCountry(matched);
    }
  };

  // Confirm extracted and verified lease data to create the real record
  const handleConfirmAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address || !city || !landlordName) {
      setError(language === 'fr' ? 'Veuillez renseigner l’adresse, la ville et le propriétaire.' : 'Please fill address, city and landlord.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await api.leases.createLease({
        address: address.trim(),
        city: city.trim(),
        postal_code: postalCode.trim() || '29001',
        country: country.name,
        owner_name_guess: landlordName.trim(),
        owner_contact: landlordEmail.trim() || 'contact@bailleur.rentia.app',
        start_date: startDate || '2023-09',
        end_date: endDate || 'Actual',
        rent: Number(monthlyRent),
        deposit: Number(deposit),
        property_type: 'Apartment',
        pages: pages.map((p) => ({
          dataUrl: p.dataUrl,
          mimeType: p.type,
          name: p.name,
        })),
        confidence_score: confidenceScore,
        tenant_photo_url: tenantPhoto || undefined,
        tenant_contact_phone: tenantPhone.trim() || undefined,
        tenant_contact_email: tenantContactEmail.trim() || undefined,
        location_details: {
          street: address.trim(),
          city: city.trim(),
          postalCode: postalCode.trim(),
          province: province.trim(),
          country: country.name,
        },
      });

      const newLease: RentalLease = {
        id: res.lease.id,
        code: res.lease.code,
        address: res.lease.address || address.trim(),
        city: res.lease.city || city.trim(),
        postalCode: postalCode.trim() || '29001',
        country: country.name,
        countryCode: country.code,
        flag: country.flag,
        propertyType: 'Apartment',
        isFurnished: true,
        monthlyRent: Number(monthlyRent),
        deposit: Number(deposit),
        currency: country.currency,
        startDate: res.lease.startDate || res.lease.start_date || startDate,
        endDate: res.lease.endDate || res.lease.end_date || endDate,
        isCurrent: endDate === 'Actual' || endDate === 'En cours',
        monthsCount: 12,
        status: 'pending',
        verificationToken: res.lease.code,
        landlordName: landlordName.trim(),
        landlordEmail: landlordEmail.trim() || 'contact@bailleur.rentia.app',
        contractPagesCount: pages.length > 0 ? pages.length : 1,
        confidenceScore,
        tenantPhotoUrl: tenantPhoto || undefined,
        tenantContactPhone: tenantPhone.trim() || undefined,
        tenantContactEmail: tenantContactEmail.trim() || undefined,
        locationDetails: {
          street: address.trim(),
          city: city.trim(),
          postalCode: postalCode.trim(),
          province: province.trim(),
          country: country.name,
        },
      };

      onAddLease(newLease);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création de la location.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-[#0FA3A3]/20 relative max-h-[92vh] overflow-y-auto">
        
        {/* Hidden inputs for 3 iPhone triggers */}
        <input
          type="file"
          ref={cameraInputRef}
          accept="image/*"
          capture="environment"
          onChange={(e) => handleFilesAdded(e.target.files)}
          className="hidden"
          id="iphone-camera-input"
        />
        <input
          type="file"
          ref={photosInputRef}
          accept="image/*"
          multiple
          onChange={(e) => handleFilesAdded(e.target.files)}
          className="hidden"
          id="iphone-photos-input"
        />
        <input
          type="file"
          ref={filesInputRef}
          accept=".pdf,application/pdf,.png,.jpg,.jpeg,.doc,.docx"
          multiple
          onChange={(e) => handleFilesAdded(e.target.files)}
          className="hidden"
          id="iphone-files-input"
        />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
          id="btn-close-add-modal"
          aria-label="Fermer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* ========================================================================= */}
        {/* STEP 1: IPHONE SELECTION (Camera, Photos, Files) & MULTI-PAGES STAGING */}
        {/* ========================================================================= */}
        {step === 'select_mode' && (
          <div>
            <div className="mb-4">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0FA3A3]/10 text-[#0FA3A3] text-xs font-bold mb-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Rentia AI Vision</span>
              </div>
              <h2 className="text-lg font-bold text-[#1C3B3A]">
                {language === 'fr' ? 'Importer votre contrat de location' : t.modalAddTitle}
              </h2>
              <p className="text-xs text-[#5C7B79]">
                {language === 'fr' 
                  ? 'Importez votre contrat (PDF ou photos). Gemini extraira automatiquement les informations pour certifier votre bail.'
                  : t.quickVerifyDesc}
              </p>
            </div>

            {error && (
              <div className="mb-3 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* 3 Dedicated iPhone / Mobile Action Buttons */}
            <div className="grid grid-cols-3 gap-2.5 mb-4">
              {/* Trigger 1: Camera */}
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="flex flex-col items-center justify-center p-3 rounded-xl border border-gray-200 bg-[#F7FBFA] hover:bg-[#E6F7F6] hover:border-[#0FA3A3] text-[#1C3B3A] transition-all group active:scale-95"
                id="btn-trigger-camera"
              >
                <div className="w-9 h-9 rounded-full bg-[#0FA3A3]/10 text-[#0FA3A3] flex items-center justify-center mb-1.5 group-hover:bg-[#0FA3A3] group-hover:text-white transition-colors">
                  <Camera className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold text-center leading-tight">
                  {t.cameraTriggerLabel}
                </span>
                <span className="text-[9px] text-[#5C7B79]">{t.scannerSubtext}</span>
              </button>

              {/* Trigger 2: Photos Gallery */}
              <button
                type="button"
                onClick={() => photosInputRef.current?.click()}
                className="flex flex-col items-center justify-center p-3 rounded-xl border border-gray-200 bg-[#F7FBFA] hover:bg-[#E6F7F6] hover:border-[#0FA3A3] text-[#1C3B3A] transition-all group active:scale-95"
                id="btn-trigger-photos"
              >
                <div className="w-9 h-9 rounded-full bg-[#2EC4A6]/10 text-[#2EC4A6] flex items-center justify-center mb-1.5 group-hover:bg-[#2EC4A6] group-hover:text-white transition-colors">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold text-center leading-tight">
                  {t.photosTriggerLabel}
                </span>
                <span className="text-[9px] text-[#5C7B79]">{t.multiImagesSubtext}</span>
              </button>

              {/* Trigger 3: Files / PDF */}
              <button
                type="button"
                onClick={() => filesInputRef.current?.click()}
                className="flex flex-col items-center justify-center p-3 rounded-xl border border-gray-200 bg-[#F7FBFA] hover:bg-[#E6F7F6] hover:border-[#0FA3A3] text-[#1C3B3A] transition-all group active:scale-95"
                id="btn-trigger-files"
              >
                <div className="w-9 h-9 rounded-full bg-[#F2C94C]/20 text-[#1C3B3A] flex items-center justify-center mb-1.5 group-hover:bg-[#F2C94C] group-hover:text-[#1C3B3A] transition-colors">
                  <FolderOpen className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold text-center leading-tight">
                  {t.filesTriggerLabel}
                </span>
                <span className="text-[9px] text-[#5C7B79]">{t.pdfDocsSubtext}</span>
              </button>
            </div>

            {/* Staged Multi-Pages Preview */}
            {pages.length > 0 ? (
              <div className="mb-4 p-3 rounded-xl bg-[#F7FBFA] border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#1C3B3A]">
                    {t.pagesSelectedCount} ({pages.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => photosInputRef.current?.click()}
                    className="text-[11px] font-semibold text-[#0FA3A3] flex items-center gap-1 hover:underline"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{t.addAnotherPageBtn}</span>
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {pages.map((page, idx) => (
                    <div key={page.id} className="relative rounded-lg border border-gray-200 bg-white p-1.5 flex flex-col items-center text-center shadow-xs">
                      {page.type.startsWith('image/') ? (
                        <img 
                          src={page.dataUrl} 
                          alt={`Page ${idx + 1}`} 
                          className="w-full h-16 object-cover rounded mb-1" 
                        />
                      ) : (
                        <div className="w-full h-16 bg-[#E6F7F6] text-[#0FA3A3] flex flex-col items-center justify-center rounded mb-1">
                          <FolderOpen className="w-6 h-6" />
                          <span className="text-[9px] font-bold mt-0.5">PDF</span>
                        </div>
                      )}
                      <span className="text-[10px] font-bold text-[#1C3B3A] truncate w-full">
                        Page {idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemovePage(page.id)}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center shadow-xs hover:bg-red-600"
                        title="Delete"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Localized in-context error right above the action button */}
                {error && (
                  <div className="mt-2.5 p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <span>{error}</span>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleLaunchGeminiExtraction}
                  disabled={isAnalyzing}
                  className="w-full mt-3 py-2.5 px-4 rounded-xl bg-[#0FA3A3] text-white font-bold text-xs flex items-center justify-center gap-2 hover:bg-[#0C8282] transition-colors shadow-sm disabled:opacity-70 cursor-pointer disabled:cursor-not-allowed"
                  id="btn-analyze-pages-gemini"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>
                        {language === 'fr'
                          ? 'Analyse en cours avec Gemini...'
                          : language === 'es'
                          ? 'Analizando con Gemini...'
                          : 'Analyzing with Gemini...'}
                      </span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>
                        {t.analyzePagesWithGemini} ({pages.length})
                      </span>
                    </>
                  )}
                </button>

                {/* Manual entry fallback */}
                <button
                  type="button"
                  onClick={() => setStep('review_extracted')}
                  className="w-full mt-2 py-2 px-3 rounded-xl border border-gray-200 bg-white text-[#5C7B79] font-semibold text-xs hover:bg-gray-50 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>
                    {language === 'fr'
                      ? 'Saisir les informations manuellement'
                      : language === 'es'
                      ? 'Introducir los datos manualmente'
                      : 'Enter details manually'}
                  </span>
                </button>
              </div>
            ) : (
              <div className="mt-4 pt-3 border-t border-gray-100 text-center">
                <button
                  type="button"
                  onClick={() => setStep('review_extracted')}
                  className="text-xs font-semibold text-[#0FA3A3] hover:underline inline-flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>
                    {language === 'fr'
                      ? 'Ou saisir les données du bail manuellement'
                      : language === 'es'
                      ? 'O introducir los datos del alquiler manualmente'
                      : 'Or enter lease details manually'}
                  </span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: GEMINI ANALYZING ANIMATION */}
        {/* ========================================================================= */}
        {step === 'analyzing' && (
          <div className="py-8 px-4 flex flex-col items-center justify-center text-center space-y-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-[#0FA3A3]/10 flex items-center justify-center text-[#0FA3A3]">
                <Loader2 className="w-8 h-8 animate-spin text-[#0FA3A3]" />
              </div>
              <Sparkles className="w-5 h-5 text-[#F2C94C] absolute -top-1 -right-1 animate-bounce" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1C3B3A]">
                {t.analyzingWithGemini}
              </h3>
              <p className="text-xs text-[#5C7B79] mt-1 max-w-xs">
                {t.analyzingSubtext}
              </p>
            </div>

            {/* Visual breakdown of AI steps */}
            <div className="w-full max-w-xs bg-[#F7FBFA] border border-gray-200 rounded-xl p-3 text-left space-y-2 text-xs">
              <div className="flex items-center gap-2 text-[#0FA3A3] font-medium">
                <div className="w-2 h-2 rounded-full bg-[#0FA3A3] animate-pulse" />
                <span>
                  {language === 'fr'
                    ? 'Lecture du document PDF / photos'
                    : language === 'es'
                    ? 'Lectura del documento PDF / fotos'
                    : 'Reading PDF / photos'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[#1C3B3A] font-medium">
                <div className="w-2 h-2 rounded-full bg-[#2EC4A6] animate-pulse" />
                <span>
                  {language === 'fr'
                    ? 'Extraction de l’adresse, loyer, dates et bailleur'
                    : language === 'es'
                    ? 'Extracción de dirección, renta, fechas y propietario'
                    : 'Extracting address, rent, dates & landlord'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[#5C7B79]">
                <div className="w-2 h-2 rounded-full bg-gray-300" />
                <span>
                  {language === 'fr'
                    ? 'Vérification de cohérence juridique'
                    : language === 'es'
                    ? 'Verificación de coherencia legal'
                    : 'Legal consistency check'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsAnalyzing(false);
                setStep('select_mode');
              }}
              className="mt-2 text-xs font-semibold text-[#5C7B79] hover:text-[#1C3B3A] px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {language === 'fr' ? 'Annuler' : language === 'es' ? 'Cancelar' : 'Cancel'}
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 3: DEDICATED REVIEW & CORRECTION SCREEN BEFORE CREATING LEASE */}
        {/* ========================================================================= */}
        {step === 'review_extracted' && (
          <form onSubmit={handleConfirmAndSave} className="space-y-3.5">
            {/* Header banner */}
            <div className="p-3 rounded-xl bg-[#EBF9F6] border border-[#2EC4A6]/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#2EC4A6] shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-[#1C3B3A]">
                    {t.extractedReviewTitle}
                  </h4>
                  <p className="text-[10px] text-[#5C7B79]">
                    {t.extractedReviewSubtitle}
                  </p>
                </div>
              </div>
              <div className="px-2 py-1 rounded-md bg-white border border-[#2EC4A6]/40 text-[#2EC4A6] text-[10px] font-bold">
                {Math.round(confidenceScore * 100)}% {t.confidenceScoreLabel}
              </div>
            </div>

            {error && (
              <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Country Selector */}
            <div>
              <label className="block text-[11px] font-bold text-[#1C3B3A] mb-1">Pais / Devise</label>
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {COUNTRIES.map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => setCountry(c)}
                    className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold shrink-0 flex items-center gap-1 transition-all ${
                      country.code === c.code 
                        ? 'bg-[#0FA3A3] text-white border-[#0FA3A3]' 
                        : 'bg-[#F7FBFA] text-[#1C3B3A] border-gray-200'
                    }`}
                  >
                    <span>{c.flag}</span>
                    <span>{c.code}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Address & City & Province & Postal Code */}
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block text-[11px] font-bold text-[#1C3B3A] mb-1">
                    Dirección de la casa / piso (calle y número)
                  </label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Ej. Calle Marqués de Larios 12, 3ºA"
                    className="w-full p-2.5 rounded-xl border border-gray-200 bg-[#F7FBFA] text-xs font-medium text-[#1C3B3A] focus:outline-none focus:ring-1 focus:ring-[#0FA3A3]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#1C3B3A] mb-1">
                    Ciudad / Municipio
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Ej. Málaga"
                    className="w-full p-2.5 rounded-xl border border-gray-200 bg-[#F7FBFA] text-xs font-medium text-[#1C3B3A] focus:outline-none focus:ring-1 focus:ring-[#0FA3A3]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-[#1C3B3A] mb-1">
                    Código Postal
                  </label>
                  <input
                    type="text"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="Ej. 29015"
                    className="w-full p-2.5 rounded-xl border border-gray-200 bg-[#F7FBFA] text-xs font-medium text-[#1C3B3A] focus:outline-none focus:ring-1 focus:ring-[#0FA3A3]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#1C3B3A] mb-1">
                    Provincia
                  </label>
                  <input
                    type="text"
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    placeholder="Ej. Málaga"
                    className="w-full p-2.5 rounded-xl border border-gray-200 bg-[#F7FBFA] text-xs font-medium text-[#1C3B3A] focus:outline-none focus:ring-1 focus:ring-[#0FA3A3]"
                  />
                </div>
              </div>
            </div>

            {/* Foto tuya (Inquilino) y Contacto */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
              <span className="text-[11px] font-bold text-slate-900 block">
                Datos del Inquilino (Foto y Contacto)
              </span>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-700 mb-1">
                    Foto tuya (inquilino)
                  </label>
                  {tenantPhoto ? (
                    <div className="flex items-center gap-2 p-1.5 bg-white border border-slate-200 rounded-lg">
                      <img src={tenantPhoto} alt="Tu foto" className="w-10 h-10 object-cover rounded-md" />
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-semibold text-slate-800 block truncate">Foto subida</span>
                        <button
                          type="button"
                          onClick={() => setTenantPhoto(null)}
                          className="text-[9px] text-rose-600 hover:underline font-medium"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="flex items-center gap-2 p-2 border border-dashed border-slate-300 hover:border-teal-500 rounded-lg cursor-pointer bg-white transition-colors">
                      <Camera className="w-4 h-4 text-teal-600" />
                      <span className="text-[10px] text-slate-600 font-medium">Subir foto tuya</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = () => {
                              if (typeof reader.result === 'string') setTenantPhoto(reader.result);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-700 mb-1">
                    Tu teléfono de contacto
                  </label>
                  <input
                    type="tel"
                    value={tenantPhone}
                    onChange={(e) => setTenantPhone(e.target.value)}
                    placeholder="+34 600 000 000"
                    className="w-full p-2 bg-white rounded-lg border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0FA3A3]"
                  />
                </div>
              </div>
            </div>

            {/* Landlord Name & Contact */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-[#1C3B3A] mb-1">{t.landlordNameLabel}</label>
                <input
                  type="text"
                  required
                  value={landlordName}
                  onChange={(e) => setLandlordName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-200 bg-[#F7FBFA] text-xs font-medium text-[#1C3B3A] focus:outline-none focus:ring-1 focus:ring-[#0FA3A3]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#1C3B3A] mb-1">{t.landlordContactLabel}</label>
                <input
                  type="text"
                  value={landlordEmail}
                  onChange={(e) => setLandlordEmail(e.target.value)}
                  placeholder="contact@bailleur.es"
                  className="w-full p-2.5 rounded-xl border border-gray-200 bg-[#F7FBFA] text-xs font-medium text-[#1C3B3A] focus:outline-none focus:ring-1 focus:ring-[#0FA3A3]"
                />
              </div>
            </div>

            {/* Rent & Deposit */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-[#1C3B3A] mb-1">
                  {t.rentLabel} ({country.currency})
                </label>
                <input
                  type="number"
                  required
                  min={100}
                  max={20000}
                  value={monthlyRent}
                  onChange={(e) => setMonthlyRent(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-gray-200 bg-[#F7FBFA] text-xs font-medium text-[#1C3B3A] focus:outline-none focus:ring-1 focus:ring-[#0FA3A3]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#1C3B3A] mb-1">
                  {t.depositFieldLabel} ({country.currency})
                </label>
                <input
                  type="number"
                  min={0}
                  max={40000}
                  value={deposit}
                  onChange={(e) => setDeposit(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-gray-200 bg-[#F7FBFA] text-xs font-medium text-[#1C3B3A] focus:outline-none focus:ring-1 focus:ring-[#0FA3A3]"
                />
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-[#1C3B3A] mb-1">{t.startDateLabel}</label>
                <input
                  type="text"
                  required
                  placeholder="2023-09"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-200 bg-[#F7FBFA] text-xs font-medium text-[#1C3B3A] focus:outline-none focus:ring-1 focus:ring-[#0FA3A3]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#1C3B3A] mb-1">{t.endDateLabel}</label>
                <input
                  type="text"
                  placeholder="Actual"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-200 bg-[#F7FBFA] text-xs font-medium text-[#1C3B3A] focus:outline-none focus:ring-1 focus:ring-[#0FA3A3]"
                />
              </div>
            </div>

            {/* Action Buttons: Edit or Confirm & Create */}
            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setStep('select_mode')}
                className="py-2.5 px-3 rounded-xl border border-gray-200 bg-white text-[#5C7B79] font-bold text-xs hover:bg-gray-50 flex items-center justify-center gap-1"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{t.restartBtn}</span>
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#0FA3A3] text-white font-bold text-xs flex items-center justify-center gap-2 hover:bg-[#0C8282] transition-colors shadow-sm disabled:opacity-50"
                id="btn-confirm-create-lease"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t.creatingLeaseLoading}</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>{t.confirmCreateLeaseBtn}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
