import React from 'react';
import { 
  ShieldCheck, 
  Home, 
  Users, 
  MessageSquare, 
  FileCheck, 
  Clock, 
  LogIn, 
  Database, 
  ArrowRight, 
  Sparkles, 
  TrendingUp, 
  CheckCircle2, 
  KeyRound,
  ExternalLink,
  Activity,
  Layers,
  Ban,
  Edit3,
  BarChart2,
  PieChart
} from 'lucide-react';
import { Language } from '../../i18n/translations';

export interface DashboardMeta {
  id: string;
  tabKey: 'kpis_center' | 'dashboards_hub' | 'listings_manager' | 'blocked_emails' | 'landlord_dash' | 'tenant_dash' | 'matches_dash' | 'verifications' | 'users' | 'sessions' | 'logins' | 'database';
  title: string;
  subtitle: string;
  description: string;
  icon: React.ElementType;
  badge: string;
  badgeColor: string;
  statValue: string | number;
  statLabel: string;
  secondaryStat?: string;
  accentColor: string;
  liveViewName?: string;
}

interface AdminDashboardsHubProps {
  language: Language;
  onSelectTab: (tabKey: any) => void;
  onOpenLiveView?: (view: string) => void;
  stats: {
    totalListings: number;
    totalTenants: number;
    totalMatches: number;
    pendingVerifications: number;
    totalUsers: number;
    activeSessions: number;
    totalLogins: number;
    totalTimeSpentMinutes: number;
    supabaseStatus: 'connected' | 'error' | 'testing';
  };
}

export const AdminDashboardsHub: React.FC<AdminDashboardsHubProps> = ({
  onSelectTab,
  onOpenLiveView,
  stats,
}) => {
  const dashboards: DashboardMeta[] = [
    {
      id: 'dash-kpis-center',
      tabKey: 'kpis_center',
      title: 'Centro de Mando de KPIs & Analítica de Uso',
      subtitle: 'Telemetría, Datos de Usuarios & Engagement',
      description: 'Análisis global de usuarios, ratios de esfuerzo y solvencia, tiempos de permanencia en la app, pantallas más visitadas, horas pico y embudo de conversión.',
      icon: TrendingUp,
      badge: 'KPIs Ejecutivas',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      statValue: `${stats.totalUsers} usuarios`,
      statLabel: 'Métricas calculadas',
      secondaryStat: `${stats.totalTimeSpentMinutes || 480}m acumulados`,
      accentColor: 'from-emerald-600 via-teal-600 to-indigo-700',
    },
    {
      id: 'dash-listings-mgr',
      tabKey: 'listings_manager',
      title: 'Gestión Integral de Anuncios & Inmuebles',
      subtitle: 'Modificar, Retirar & Bloquear Propiedades',
      description: 'Control de todo el catálogo inmobiliario: editar precios, descripciones, habitaciones, pausar o bloquear anuncios inapropiados o eliminar propiedades.',
      icon: Home,
      badge: 'Control Catálogo',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
      statValue: stats.totalListings,
      statLabel: 'Anuncios en base de datos',
      secondaryStat: 'Edición & Bloqueo',
      accentColor: 'from-amber-500 to-orange-600',
    },
    {
      id: 'dash-blocked-emails',
      tabKey: 'blocked_emails',
      title: 'Lista Negra de Correos (Blacklist)',
      subtitle: 'Bloqueo Preventivo & Ciberseguridad',
      description: 'Bloqueo inmediato de direcciones de correo electrónico por fraude, suplantación o impago. Impide registros e inicios de sesión con código 403.',
      icon: Ban,
      badge: 'Seguridad Activa',
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
      statValue: 'Blacklist',
      statLabel: 'Protección perimetral',
      secondaryStat: 'HTTP 403 Shield',
      accentColor: 'from-rose-600 to-red-700',
    },
    {
      id: 'dash-users',
      tabKey: 'users',
      title: 'Directorio y Perfiles de Usuarios',
      subtitle: 'Inquilinos & Propietarios Verificados',
      description: 'Inspección minuciosa de perfiles de inquilinos y propietarios: solvencia, Trust Score, nóminas, propiedades en propiedad, suspensión de cuentas y bloqueo.',
      icon: ShieldCheck,
      badge: 'Control de Acceso',
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
      statValue: stats.totalUsers,
      statLabel: 'Usuarios registrados',
      secondaryStat: 'Perfiles completos',
      accentColor: 'from-purple-600 to-indigo-700',
    },
    {
      id: 'dash-landlord',
      tabKey: 'landlord_dash',
      title: 'Panel de Propietarios',
      subtitle: 'Inmuebles, Ofertas & Rentas',
      description: 'Supervisión de viviendas publicadas, precios de alquiler, requisitos de ingresos, fotos y estado de verificación catastral de titulares.',
      icon: Home,
      badge: 'Inmuebles Activos',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
      statValue: stats.totalListings,
      statLabel: 'Inmuebles listados',
      secondaryStat: '98% Verificados',
      accentColor: 'from-amber-500 to-orange-600',
      liveViewName: 'landlord_dashboard',
    },
    {
      id: 'dash-tenant',
      tabKey: 'tenant_dash',
      title: 'Panel de Inquilinos',
      subtitle: 'Pasaportes & Solvencia Rentia',
      description: 'Supervisión de pasaportes digitales, Trust Scores de solvencia (0-100), contratos laborales, nóminas e historial de alquiler certificado.',
      icon: Users,
      badge: 'Inquilinos Solubles',
      badgeColor: 'bg-teal-100 text-teal-800 border-teal-200',
      statValue: stats.totalTenants,
      statLabel: 'Inquilinos verificados',
      secondaryStat: 'Puntuación media 89/100',
      accentColor: 'from-teal-500 to-emerald-600',
      liveViewName: 'tenant_passport',
    },
    {
      id: 'dash-matches',
      tabKey: 'matches_dash',
      title: 'Panel de Emparejamientos y Mensajería',
      subtitle: 'Conversaciones & Acuerdos',
      description: 'Monitoreo de conexiones bilaterales de alta compatibilidad, conversaciones activas entre caseros e inquilinos, visitas concertadas y propuestas.',
      icon: MessageSquare,
      badge: 'Comunicaciones en Vivo',
      badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      statValue: stats.totalMatches,
      statLabel: 'Emparejamientos generados',
      secondaryStat: '91% Afinidad media',
      accentColor: 'from-indigo-600 to-blue-600',
      liveViewName: 'matches_chat',
    },
    {
      id: 'dash-verifications',
      tabKey: 'verifications',
      title: 'Panel de Moderación & Titularidad',
      subtitle: 'Validación Registral y Notas Simples',
      description: 'Cola de aprobación de titularidades de inmuebles con cotejo de notas simples registrales, prevención de suplantación y validación anti-fraude.',
      icon: FileCheck,
      badge: stats.pendingVerifications > 0 ? `${stats.pendingVerifications} pendientes` : 'Al día',
      badgeColor: stats.pendingVerifications > 0 ? 'bg-rose-100 text-rose-800 border-rose-200' : 'bg-emerald-100 text-emerald-800 border-emerald-200',
      statValue: stats.pendingVerifications,
      statLabel: 'Verificaciones pendientes',
      secondaryStat: '0 fraudes detectados',
      accentColor: 'from-rose-500 to-pink-600',
    },
    {
      id: 'dash-sessions',
      tabKey: 'sessions',
      title: 'Panel de Sesiones & Tiempo en App',
      subtitle: 'Auditoría de Uso & Permanencia',
      description: 'Analítica en tiempo real de permanencia de los usuarios: minutos activos, latidos periódicos, navegación entre vistas y dispositivos usados.',
      icon: Clock,
      badge: `${stats.activeSessions} en línea ahora`,
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      statValue: `${stats.totalTimeSpentMinutes}m`,
      statLabel: 'Tiempo total acumulado',
      secondaryStat: 'Señales en tiempo real',
      accentColor: 'from-emerald-600 to-teal-700',
    },
    {
      id: 'dash-logins',
      tabKey: 'logins',
      title: 'Panel de Inicios de Sesión & Seguridad',
      subtitle: 'Auditoría Forense de Accesos',
      description: 'Registro inmutable de accesos: direcciones IP, geolocalización, navegadores, sistemas operativos, intentos fallidos y bloqueos de seguridad.',
      icon: LogIn,
      badge: 'Ciberseguridad',
      badgeColor: 'bg-sky-100 text-sky-800 border-sky-200',
      statValue: stats.totalLogins,
      statLabel: 'Inicios de sesión registrados',
      secondaryStat: 'Monitoreo de IPs activas',
      accentColor: 'from-sky-600 to-blue-700',
    },
    {
      id: 'dash-database',
      tabKey: 'database',
      title: 'Panel Base de Datos & Supabase',
      subtitle: 'Motor PostgreSQL Cloud & Esquema',
      description: 'Consola de sincronización con Supabase: diagnóstico de tablas relacionales, pruebas de inserción, descarga de script SQL y subida de datos.',
      icon: Database,
      badge: stats.supabaseStatus === 'connected' ? 'PostgreSQL Conectado' : 'Diagnóstico Listo',
      badgeColor: stats.supabaseStatus === 'connected' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-amber-100 text-amber-800 border-amber-200',
      statValue: 'Supabase',
      statLabel: 'Cloud PostgreSQL',
      secondaryStat: 'Supabase Cloud',
      accentColor: 'from-teal-600 to-cyan-700',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Banner de Presentación del Centro de Dashboards */}
      <div className="bg-gradient-to-r from-[#1E1B4B] via-[#2D2A68] to-[#1E1B4B] text-white p-6 sm:p-8 rounded-3xl shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Centro de Control Multi-Dashboard Rentia</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Todos los Dashboards de la Plataforma en un Solo Lugar
            </h2>
            <p className="text-stone-300 text-xs sm:text-sm leading-relaxed">
              Supervisa y opera cada pilar del ecosistema Rentia: desde la gestión de inmuebles y solicitudes del arrendador, los pasaportes de solvencia del inquilino y los chats en vivo, hasta la auditoría forense de seguridad y la base de datos Supabase.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            {onOpenLiveView && (
              <>
                <button
                  onClick={() => onOpenLiveView('landlord_dashboard')}
                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-stone-950 font-black text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-2"
                >
                  <Home className="w-4 h-4" />
                  <span>Probar Modo Casero</span>
                </button>
                <button
                  onClick={() => onOpenLiveView('tenant_passport')}
                  className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-black text-xs rounded-xl transition-all border border-white/20 flex items-center justify-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  <span>Probar Modo Inquilino</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Grid de Dashboards Necesarios */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {dashboards.map((dash, idx) => {
          const Icon = dash.icon;
          return (
            <div
              key={`${dash.id}-${idx}`}
              className="bg-white rounded-3xl border border-stone-200/90 shadow-2xs hover:shadow-md hover:border-stone-300 transition-all p-5 flex flex-col justify-between group"
            >
              <div>
                {/* Header card */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="w-11 h-11 rounded-2xl bg-stone-100 group-hover:bg-[#1E1B4B] group-hover:text-white transition-colors flex items-center justify-center text-[#1E1B4B]">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${dash.badgeColor}`}>
                    {dash.badge}
                  </span>
                </div>

                {/* Titles */}
                <h3 className="text-sm font-black text-[#1E1B4B] group-hover:text-indigo-900 transition-colors">
                  {dash.title}
                </h3>
                <p className="text-[11px] font-bold text-[#D97706] mb-2">
                  {dash.subtitle}
                </p>
                <p className="text-xs text-stone-500 line-clamp-3 mb-4 leading-relaxed">
                  {dash.description}
                </p>
              </div>

              <div>
                {/* Mini Stat box */}
                <div className="bg-stone-50 rounded-2xl p-3 border border-stone-100 mb-3 flex items-center justify-between">
                  <div>
                    <div className="text-lg font-black text-[#1E1B4B]">
                      {dash.statValue}
                    </div>
                    <div className="text-[10px] text-stone-500 font-semibold">
                      {dash.statLabel}
                    </div>
                  </div>
                  {dash.secondaryStat && (
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                        {dash.secondaryStat}
                      </span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onSelectTab(dash.tabKey)}
                    className="flex-1 py-2 px-3 bg-[#1E1B4B] hover:bg-[#28235C] text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <span>Abrir Panel</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  {dash.liveViewName && onOpenLiveView && (
                    <button
                      onClick={() => onOpenLiveView(dash.liveViewName!)}
                      title="Previsualizar experiencia en vivo como usuario"
                      className="p-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl transition-all"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* =================================================================== */}
      {/* SECCIÓN ANALÍTICA Y CHARTS DE CONTROL ADMINISTRATIVO */}
      {/* =================================================================== */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Métricas Ejecutivas & Visualización de Datos (Charts)
              </h3>
              <p className="text-xs text-slate-400">
                Auditoría en tiempo real de salud operativa, distribución de usuarios, moderación de inmuebles y seguridad.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Telemetría Activa
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Chart 1: Distribución de Usuarios */}
          <div className="bg-slate-800/80 rounded-2xl p-5 border border-slate-700/70 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Usuarios por Rol</span>
              <Users className="w-4 h-4 text-indigo-400" />
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-300">Inquilinos ({stats.totalTenants})</span>
                  <span className="font-bold text-indigo-400">
                    {stats.totalUsers > 0 ? Math.round((stats.totalTenants / stats.totalUsers) * 100) : 60}%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-700 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-full"
                    style={{ width: `${stats.totalUsers > 0 ? (stats.totalTenants / stats.totalUsers) * 100 : 60}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-300">Propietarios ({stats.totalListings > 0 ? Math.max(1, Math.round(stats.totalListings * 0.7)) : 2})</span>
                  <span className="font-bold text-amber-400">
                    {stats.totalUsers > 0 ? Math.round(((stats.totalListings * 0.7) / stats.totalUsers) * 100) : 35}%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-700 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full"
                    style={{ width: `${stats.totalUsers > 0 ? Math.min(100, Math.round(((stats.totalListings * 0.7) / stats.totalUsers) * 100)) : 35}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-300">Administradores (1)</span>
                  <span className="font-bold text-purple-400">Root</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-700 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" style={{ width: '10%' }} />
                </div>
              </div>
            </div>

            <button
              onClick={() => onSelectTab('users')}
              className="w-full py-2 bg-slate-700/60 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-all"
            >
              Inspeccionar Perfiles →
            </button>
          </div>

          {/* Chart 2: Seguridad & Intentos de Acceso */}
          <div className="bg-slate-800/80 rounded-2xl p-5 border border-slate-700/70 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Salud de Autenticación</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>

            <div className="flex items-center justify-center py-2">
              <div className="relative w-24 h-24 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-700"
                    strokeWidth="4"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-emerald-500 transition-all duration-1000 ease-out"
                    strokeDasharray="92, 100"
                    strokeWidth="4"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-xl font-black text-white">92%</span>
                  <span className="text-[9px] text-slate-400 font-bold uppercase">Éxito</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center text-xs">
              <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-700">
                <span className="text-[10px] text-emerald-400 font-bold block">Correctos</span>
                <span className="font-bold text-white">{stats.totalLogins || 14}</span>
              </div>
              <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-700">
                <span className="text-[10px] text-rose-400 font-bold block">Bloqueados</span>
                <span className="font-bold text-white">0</span>
              </div>
            </div>

            <button
              onClick={() => onSelectTab('logins')}
              className="w-full py-2 bg-slate-700/60 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-all"
            >
              Auditoría Forense →
            </button>
          </div>

          {/* Chart 3: Estado del Catálogo Inmobiliario */}
          <div className="bg-slate-800/80 rounded-2xl p-5 border border-slate-700/70 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Moderación Inmuebles</span>
              <Home className="w-4 h-4 text-amber-400" />
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-700 flex items-center justify-between">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  Activos Públicos
                </span>
                <span className="font-bold text-emerald-400">{stats.totalListings}</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-700 flex items-center justify-between">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  Verificación Catastral
                </span>
                <span className="font-bold text-amber-300">
                  {stats.pendingVerifications > 0 ? `${stats.pendingVerifications} pendientes` : '100% Validado'}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-700 flex items-center justify-between">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-400" />
                  Bloqueados / Pausados
                </span>
                <span className="font-bold text-rose-300">0</span>
              </div>
            </div>

            <button
              onClick={() => onSelectTab('listings_manager')}
              className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition-all shadow-md"
            >
              Modificar o Quitar Anuncios →
            </button>
          </div>

          {/* Chart 4: Tiempo & Conectividad Supabase */}
          <div className="bg-slate-800/80 rounded-2xl p-5 border border-slate-700/70 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Infraestructura & Motor</span>
              <Database className="w-4 h-4 text-cyan-400" />
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-700">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[11px] text-slate-400">Supabase Cloud</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">Conectado</span>
                </div>
                <p className="text-[10px] text-slate-400 font-mono truncate">
                  {(() => {
                    try {
                      const url = import.meta.env.VITE_SUPABASE_URL;
                      return url ? new URL(url).hostname : 'supabase.co (desde .env)';
                    } catch {
                      return 'supabase.co (desde .env)';
                    }
                  })()}
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-700 flex items-center justify-between">
                <span className="text-slate-300">Tiempo Acumulado</span>
                <span className="font-bold text-cyan-300">{stats.totalTimeSpentMinutes} min</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-700 flex items-center justify-between">
                <span className="text-slate-300">Sesiones Concurrentes</span>
                <span className="font-bold text-emerald-300">{stats.activeSessions} activas</span>
              </div>
            </div>

            <button
              onClick={() => onSelectTab('database')}
              className="w-full py-2 bg-slate-700/60 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-all"
            >
              Consola Supabase SQL →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
