import React, { useState, useEffect } from 'react';
import { Bell, Mail, Smartphone, ShieldCheck, Check, X } from 'lucide-react';
import { Language } from '../i18n/translations';

interface NotificationPermissionModalProps {
  language: Language;
}

export const NotificationPermissionModal: React.FC<NotificationPermissionModalProps> = ({
  language,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    // Comprobar si ya se le ha preguntado al usuario previamente
    const preference = localStorage.getItem('rentia_notifications_preference');
    if (!preference) {
      // Mostrar el mensaje al principio como solicitó el usuario
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = async () => {
    localStorage.setItem('rentia_notifications_preference', 'enabled');
    setIsSaved(true);

    // Si el navegador soporta Notifications API (Web y App PWA), solicitar permiso nativo
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        await Notification.requestPermission();
      } catch (err) {
        // Ignorar si el usuario bloquea a nivel sistema
      }
    }

    setTimeout(() => {
      setIsOpen(false);
    }, 1200);
  };

  const handleDismiss = () => {
    localStorage.setItem('rentia_notifications_preference', 'dismissed');
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div 
        className="bg-white max-w-md w-full rounded-3xl p-6 shadow-2xl border border-stone-200 text-[#1E1B4B] space-y-5"
        id="notification-onboarding-modal"
      >
        <div className="flex items-start justify-between">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center shadow-xs">
            <Bell className="w-6 h-6 text-amber-700 animate-bounce" />
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2">
          <span className="text-[11px] font-extrabold text-amber-700 uppercase tracking-wider bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 inline-block">
            Versión Web y App Móvil
          </span>
          <h2 className="text-xl font-black text-[#1E1B4B]">
            ¿Deseas recibir notificaciones de Rentia?
          </h2>
          <p className="text-xs text-stone-600 leading-relaxed">
            Te avisaremos de inmediato por <strong>correo electrónico</strong> y <strong>notificación push</strong> cada vez que alguien dé <em>like</em> a tu propiedad, un propietario acepte tu perfil o recibas un mensaje nuevo.
          </p>
        </div>

        {/* Channels preview */}
        <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200/80 space-y-2.5 text-xs">
          <div className="flex items-center gap-2.5">
            <Mail className="w-4 h-4 text-indigo-600 shrink-0" />
            <span className="text-stone-700 font-medium">Alertas directas en tu correo electrónico</span>
          </div>
          <div className="flex items-center gap-2.5">
            <Smartphone className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-stone-700 font-medium">Notificaciones push en tu dispositivo (App y Web)</span>
          </div>
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="text-stone-700 font-medium">Sin spam: únicamente eventos relevantes de tus inmuebles</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleDismiss}
            className="flex-1 py-2.5 px-4 rounded-xl border border-stone-200 hover:bg-stone-100 text-stone-600 text-xs font-bold transition-colors"
          >
            Ahora no
          </button>

          <button
            type="button"
            onClick={handleAccept}
            className="flex-1 py-2.5 px-4 rounded-xl bg-[#1E1B4B] hover:bg-indigo-950 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-md"
            id="btn-accept-notifications"
          >
            {isSaved ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>¡Activadas!</span>
              </>
            ) : (
              <>
                <Bell className="w-4 h-4" />
                <span>Sí, deseo recibirlas</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
