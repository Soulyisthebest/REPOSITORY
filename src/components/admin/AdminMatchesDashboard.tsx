import React, { useState } from 'react';
import { 
  MessageSquare, 
  Sparkles, 
  Heart, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  ExternalLink, 
  Home, 
  Users, 
  ArrowRight,
  Send,
  Eye
} from 'lucide-react';
import { SEED_TENANTS } from '../../data/seedTenants';
import { SEED_LISTINGS } from '../../data/seedListings';
import { Language } from '../../i18n/translations';

interface AdminMatchesDashboardProps {
  language: Language;
  onOpenLiveChatView?: () => void;
}

export const AdminMatchesDashboard: React.FC<AdminMatchesDashboardProps> = ({
  onOpenLiveChatView,
}) => {
  // Generate sample bilateral matches from seeded data
  const sampleMatches = [
    {
      id: 'match_01',
      tenant: SEED_TENANTS[0],
      listing: SEED_LISTINGS[0],
      compatibility: 94,
      status: 'active',
      statusText: 'Visita Concertada',
      statusColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      lastMessage: 'Perfecto, os espero el jueves a las 18:00h en el chalet para ver el jardín y la piscina.',
      lastMessageTime: 'Hace 15 min',
      messagesCount: 6,
      messages: [
        { sender: 'landlord', text: '¡Hola Lucía! He visto tu Pasaporte Rentia con 92/100 de Trust Score. Tu perfil como Ingeniera encaja genial con el chalet.', time: '10:30' },
        { sender: 'tenant', text: '¡Muchas gracias Elena! Me encanta la zona de Pedregalejo. ¿Sería posible coordinar una visita presencial esta semana?', time: '10:45' },
        { sender: 'landlord', text: 'Perfecto, os espero el jueves a las 18:00h en el chalet para ver el jardín y la piscina.', time: '11:15' }
      ]
    },
    {
      id: 'match_02',
      tenant: SEED_TENANTS[1] || SEED_TENANTS[0],
      listing: SEED_LISTINGS[1] || SEED_LISTINGS[0],
      compatibility: 91,
      status: 'pending_first_reply',
      statusText: 'Propuesta Enviada',
      statusColor: 'bg-amber-100 text-amber-800 border-amber-200',
      lastMessage: 'Hola, tengo nómina indefinida y aval bancario disponible. ¿Admitís contrato de larga estancia?',
      lastMessageTime: 'Hace 2 horas',
      messagesCount: 2,
      messages: [
        { sender: 'tenant', text: 'Hola, tengo nómina indefinida y aval bancario disponible. ¿Admitís contrato de larga estancia?', time: '09:12' }
      ]
    },
    {
      id: 'match_03',
      tenant: SEED_TENANTS[2] || SEED_TENANTS[0],
      listing: SEED_LISTINGS[2] || SEED_LISTINGS[0],
      compatibility: 88,
      status: 'contract_draft',
      statusText: 'Borrador Contrato',
      statusColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      lastMessage: 'He revisado el borrador digital y los certificados criptográficos. Todo conforme.',
      lastMessageTime: 'Ayer',
      messagesCount: 14,
      messages: [
        { sender: 'landlord', text: 'Te he subido el contrato con el código de verificación único.', time: 'Ayer 16:30' },
        { sender: 'tenant', text: 'He revisado el borrador digital y los certificados criptográficos. Todo conforme.', time: 'Ayer 17:10' }
      ]
    },
  ];

  const [selectedMatch, setSelectedMatch] = useState(sampleMatches[0]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center shadow-2xs">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-[#1E1B4B]">Panel de Emparejamientos y Mensajería</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800">
                Conexiones Bilaterales
              </span>
            </div>
            <p className="text-xs text-stone-500">
              Supervisión de afinidad entre inquilinos y propietarios, citas presenciales concertadas y flujos de chat en tiempo real.
            </p>
          </div>
        </div>

        {onOpenLiveChatView && (
          <button
            onClick={onOpenLiveChatView}
            className="px-4 py-2.5 bg-[#1E1B4B] hover:bg-[#28235C] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2"
          >
            <span>Abrir Chat en Vivo</span>
            <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-[11px] font-semibold">Total Emparejamientos</span>
            <Sparkles className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-[#1E1B4B]">
            {sampleMatches.length * 8}
          </div>
          <div className="text-[10px] text-emerald-600 font-bold mt-0.5">
            +12 esta semana
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-[11px] font-semibold">Afinidad Media</span>
            <Heart className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-600">
            91%
          </div>
          <div className="text-[10px] text-stone-400 font-medium mt-0.5">
            Algoritmo de Solvencia
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-[11px] font-semibold">Tiempo de Respuesta</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-[#D97706]">
            &lt; 1.5h
          </div>
          <div className="text-[10px] text-emerald-600 font-bold mt-0.5">
            Excelente dinamismo
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-[11px] font-semibold">Tasa de Cierre</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600">
            68%
          </div>
          <div className="text-[10px] text-stone-400 font-medium mt-0.5">
            Conversión a contrato
          </div>
        </div>
      </div>

      {/* Interactive Match & Chat Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Match List Column */}
        <div className="lg:col-span-5 space-y-3">
          <div className="text-xs font-bold text-stone-500 uppercase tracking-wider px-1">
            Conexiones Activas Supervisadas ({sampleMatches.length})
          </div>

          <div className="space-y-3">
            {sampleMatches.map((m, idx) => {
              const isSelected = selectedMatch.id === m.id;
              return (
                <div
                  key={`${m.id}-${idx}`}
                  onClick={() => setSelectedMatch(m)}
                  className={`p-4 rounded-3xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white border-[#1E1B4B] shadow-md ring-2 ring-indigo-100'
                      : 'bg-white border-stone-200 hover:border-stone-300 shadow-2xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${m.statusColor}`}>
                      {m.statusText}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-50 text-indigo-700">
                      {m.compatibility}% Afinidad
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mb-3">
                    <img
                      src={m.tenant.avatar_url}
                      alt={m.tenant.fullName}
                      className="w-10 h-10 rounded-full object-cover border border-stone-200"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-xs text-[#1E1B4B] truncate">
                        {m.tenant.fullName}
                      </div>
                      <div className="text-[11px] text-stone-400 truncate">
                        Índice de Confianza {m.tenant.trustScore || m.tenant.trust_score || 88}/100 • {m.tenant.profession}
                      </div>
                    </div>
                  </div>

                  <div className="bg-stone-50 p-2.5 rounded-2xl border border-stone-100 mb-2">
                    <div className="text-[11px] font-bold text-stone-800 line-clamp-1">
                      🏠 {m.listing.title}
                    </div>
                    <div className="text-[10px] text-stone-500">
                      {m.listing.city} • {m.listing.rent} €/mes
                    </div>
                  </div>

                  <div className="text-[11px] text-stone-500 line-clamp-1 italic">
                    "{m.lastMessage}"
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-stone-400 mt-2 pt-2 border-t border-stone-100">
                    <span>{m.messagesCount} mensajes intercambiados</span>
                    <span>{m.lastMessageTime}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chat Inspector Column */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-stone-200 shadow-xs flex flex-col h-[520px]">
          {/* Chat Header */}
          <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50 rounded-t-3xl">
            <div className="flex items-center gap-3">
              <img
                src={selectedMatch.tenant.avatar_url}
                alt={selectedMatch.tenant.fullName}
                className="w-10 h-10 rounded-full object-cover border border-stone-200"
              />
              <div>
                <div className="text-xs font-black text-[#1E1B4B]">
                  {selectedMatch.tenant.fullName} ↔ {(selectedMatch.listing as any).landlord_name || 'Elena Gómez'}
                </div>
                <div className="text-[10px] text-stone-500">
                  {selectedMatch.listing.title} • {selectedMatch.listing.city}
                </div>
              </div>
            </div>

            <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
              {selectedMatch.compatibility}% Match
            </span>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#FAF9F6]/40 text-xs">
            <div className="text-center my-2">
              <span className="px-3 py-1 bg-stone-100 text-stone-500 rounded-full text-[10px] font-bold">
                Conexión generada con Pasaporte de Alquiler Verificado
              </span>
            </div>

            {selectedMatch.messages.map((msg, i) => {
              const isLandlord = msg.sender === 'landlord';
              return (
                <div
                  key={i}
                  className={`flex flex-col ${isLandlord ? 'items-start' : 'items-end'}`}
                >
                  <span className="text-[9px] text-stone-400 mb-0.5 px-1">
                    {isLandlord ? 'Arrendador' : 'Inquilino'} • {msg.time}
                  </span>
                  <div
                    className={`max-w-md p-3 rounded-2xl text-xs leading-relaxed ${
                      isLandlord
                        ? 'bg-stone-100 text-stone-800 rounded-tl-xs'
                        : 'bg-[#1E1B4B] text-white rounded-tr-xs shadow-xs'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Chat Footer Audit Notice */}
          <div className="p-3 border-t border-stone-100 bg-stone-50/70 rounded-b-3xl flex items-center justify-between text-[11px] text-stone-500">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Canal cifrado y auditado según RGPD (UE 2016/679)</span>
            </div>
            {onOpenLiveChatView && (
              <button
                onClick={onOpenLiveChatView}
                className="font-bold text-indigo-700 hover:underline inline-flex items-center gap-1"
              >
                <span>Responder como usuario</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
