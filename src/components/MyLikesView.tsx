import React, { useState, useEffect } from 'react';
import { Heart, Building2, MapPin, Euro, ArrowLeft, MessageSquare, Eye, Images, HeartOff, Check } from 'lucide-react';
import { api } from '../api/client';
import { Language } from '../i18n/translations';
import { PropertyDetailsModal } from './PropertyDetailsModal';

interface MyLikesViewProps {
  language: Language;
  onBack: () => void;
  onOpenDiscovery: () => void;
  onOpenChat?: (matchId?: string) => void;
}

export const MyLikesView: React.FC<MyLikesViewProps> = ({
  language,
  onBack,
  onOpenDiscovery,
  onOpenChat,
}) => {
  const [likes, setLikes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedListingItem, setSelectedListingItem] = useState<any | null>(null);
  const [unlikingId, setUnlikingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchLikes = async () => {
      setLoading(true);
      try {
        const data = await api.matching.getMyLikes();
        const rawLikes = Array.isArray(data) ? data : [];
        const seen = new Set<string>();
        const unique = rawLikes.filter((item) => {
          const lid = item?.listing_id || item?.listing?.id;
          if (!lid || seen.has(lid)) return false;
          seen.add(lid);
          return true;
        });
        setLikes(unique);
      } catch (err) {
        console.error('Error fetching likes:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLikes();
  }, []);

  const handleUnlike = async (e: React.MouseEvent, listingId: string) => {
    e.stopPropagation();
    if (!listingId) return;

    setUnlikingId(listingId);
    try {
      await api.matching.unlike(listingId);
      setLikes((prev) => prev.filter((item) => (item.listing_id || item.listing?.id) !== listingId));
      setToastMessage('Has quitado el like de este piso correctamente.');
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      console.error('Error unliking listing:', err);
    } finally {
      setUnlikingId(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-[#1E1B4B] text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold animate-fade-in border border-emerald-400">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between bg-white p-5 rounded-3xl border border-stone-200 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-[#1E1B4B]">Mis Likes</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700 flex items-center gap-1">
                <Heart className="w-3 h-3 fill-rose-600" />
                {likes.length} inmuebles guardados
              </span>
            </div>
            <p className="text-xs text-stone-500">
              Viviendas donde has expresado interés. Si el propietario te da like, se activará el chat de inmediato.
            </p>
          </div>
        </div>

        <button
          onClick={onOpenDiscovery}
          className="px-4 py-2 bg-[#1E1B4B] hover:bg-[#28235C] text-white rounded-xl text-xs font-bold transition-all shadow-xs"
        >
          Explorar más pisos
        </button>
      </div>

      {/* Grid de Likes */}
      {loading ? (
        <div className="bg-white p-12 text-center rounded-3xl border border-stone-200 text-stone-400 text-xs">
          Cargando tus likes...
        </div>
      ) : likes.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-3xl border border-stone-200 space-y-3">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
            <Heart className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-[#1E1B4B]">Aún no has dado like a ningún piso</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            Desliza o da like en los anuncios que te gusten para que los propietarios reciban tu perfil y puedan contactarte.
          </p>
          <button
            onClick={onOpenDiscovery}
            className="mt-2 px-5 py-2.5 bg-[#1E1B4B] text-white text-xs font-bold rounded-xl hover:bg-[#28235C] transition-all"
          >
            Descubrir Viviendas
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {likes.map((item, idx) => {
            const listing = item.listing;
            const status = item.status || 'pending';
            const isMatched = status === 'matched' || item.chat_open;
            const isPassed = status === 'passed';
            const firstImage = listing.images && listing.images.length > 0
              ? listing.images[0]
              : 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800';

            const photoCount = Array.isArray(listing.images) ? listing.images.length : (Array.isArray(listing.photos) ? listing.photos.length : 10);

            return (
              <div
                key={`${item.listing_id || item.id || 'like'}-${idx}`}
                onClick={() => setSelectedListingItem(item)}
                className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs flex flex-col hover:shadow-md transition-all cursor-pointer hover:border-indigo-200 group"
              >
                <div className="relative h-48 w-full bg-stone-100 overflow-hidden">
                  <img
                    src={firstImage}
                    alt={listing.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-full text-rose-600 flex items-center gap-1 text-xs font-bold shadow-xs">
                    <Heart className="w-3.5 h-3.5 fill-rose-600" />
                    Like enviado
                  </div>
                  <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-xs text-white px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1">
                    <Images className="w-3 h-3 text-amber-400" />
                    <span>{Math.max(photoCount, 10)} fotos</span>
                  </div>
                  <div className="absolute bottom-3 left-3 bg-[#1E1B4B]/80 backdrop-blur-xs text-white px-2.5 py-1 rounded-lg text-xs font-bold">
                    {listing.rent} €/mes
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="text-sm font-bold text-[#1E1B4B] line-clamp-1 group-hover:text-indigo-600 transition-colors">
                      {listing.title}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-stone-500 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-stone-400" />
                      <span>{listing.neighborhood ? `${listing.neighborhood}, ` : ''}{listing.city}</span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-stone-100">
                    <div className="flex items-center justify-between text-xs text-stone-500">
                      <span className="text-[11px]">
                        Propietario: <strong>{listing.landlord_name || 'Verificado'}</strong>
                      </span>
                      {isMatched ? (
                        <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold border border-emerald-200">
                          ✓ Match mutuo
                        </span>
                      ) : isPassed ? (
                        <span className="text-[10px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full font-semibold">
                          Descartado
                        </span>
                      ) : (
                        <span className="text-[10px] bg-amber-50 text-amber-800 px-2 py-0.5 rounded-full font-semibold border border-amber-200">
                          Pendiente de respuesta
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedListingItem(item);
                        }}
                        className="flex-1 py-1.5 px-3 bg-stone-100 hover:bg-indigo-50 hover:text-indigo-700 text-stone-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Ver fotos
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleUnlike(e, listing.id)}
                        disabled={unlikingId === listing.id}
                        className="py-1.5 px-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-colors border border-rose-200"
                        title="Quitar de mis likes"
                      >
                        <HeartOff className="w-3.5 h-3.5" />
                        <span>{unlikingId === listing.id ? '...' : 'Quitar like'}</span>
                      </button>

                      {isMatched && onOpenChat && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenChat(item.match_id);
                          }}
                          className="flex-1 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          Chat
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Property Details & 10+ Photos Modal */}
      {selectedListingItem && (
        <PropertyDetailsModal
          listing={selectedListingItem.listing}
          isOpen={Boolean(selectedListingItem)}
          onClose={() => setSelectedListingItem(null)}
          isLiked={true}
          isMatched={selectedListingItem.status === 'matched' || selectedListingItem.chat_open}
          matchId={selectedListingItem.match_id}
          onOpenChat={onOpenChat}
          language={language}
        />
      )}
    </div>
  );
};
