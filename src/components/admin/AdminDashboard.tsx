import React from 'react';
import { 
  Users, 
  Activity, 
  FileCheck2, 
  AlertTriangle, 
  TrendingUp, 
  RefreshCw, 
  Clock, 
  ShieldCheck, 
  ArrowUpRight, 
  ArrowDownRight,
  Zap,
  BarChart3,
  Server
} from 'lucide-react';

interface TelemetryData {
  usersNow: number;
  users5m: number;
  users15m: number;
  ongoingConversions: number;
  recentErrors24h: number;
  totalConversions24h: number;
  successRate24h: number;
}

interface AnalyticsOverview {
  totalVisits: number;
  uniqueVisitors: number;
  totalUsers: number;
  newRegistrationsToday: number;
  totalConversions: number;
  successfulConversions: number;
  failedConversions: number;
  successRate: number;
  totalErrors: number;
  mostUsedTools: { slug: string; name: string; count: number }[];
  conversionsByTool: Record<string, { total: number; success: number; failed: number }>;
  dailyTrends: { date: string; visits: number; conversions: number; errors: number }[];
  todayVsYesterday: {
    visitsChangePct: number;
    conversionsChangePct: number;
  };
}

interface AdminDashboardProps {
  telemetry: TelemetryData;
  overview: AnalyticsOverview | null;
  isLoading: boolean;
  onRefresh: () => void;
  onNavigateTab: (tabId: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  telemetry,
  overview,
  isLoading,
  onRefresh,
  onNavigateTab
}) => {
  const dailyTrends = overview?.dailyTrends || [];
  const maxTrendVisits = Math.max(...dailyTrends.map((d) => d.visits), 1);
  const maxTrendConv = Math.max(...dailyTrends.map((d) => d.conversions), 1);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Real-time Telemetry Bar */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-md border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Telemetría en Vivo
              </span>
              <span className="text-[10px] text-slate-400">• Actualización continua</span>
            </div>
            <p className="text-sm font-semibold text-slate-200">
              {telemetry.usersNow} {telemetry.usersNow === 1 ? 'usuario activo ahora mismo' : 'usuarios activos ahora mismo'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400">Últimos 5 min</span>
            <p className="text-sm font-bold text-white">{telemetry.users5m} usuarios</p>
          </div>
          <div className="h-6 w-px bg-slate-800" />
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400">Últimos 15 min</span>
            <p className="text-sm font-bold text-white">{telemetry.users15m} usuarios</p>
          </div>
          <div className="h-6 w-px bg-slate-800" />
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400">Conversiones 24h</span>
            <p className="text-sm font-bold text-emerald-400">{telemetry.totalConversions24h}</p>
          </div>
          <div className="h-6 w-px bg-slate-800" />
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            title="Refrescar métricas ahora"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Visits */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Visitas Registradas</span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {overview?.totalVisits ?? 0}
            </span>
            <span className="text-xs text-slate-400">
              ({overview?.uniqueVisitors ?? 0} únicas)
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-slate-500">
            {overview?.todayVsYesterday && overview.todayVsYesterday.visitsChangePct >= 0 ? (
              <span className="text-emerald-600 flex items-center">
                <ArrowUpRight className="w-3.5 h-3.5" />
                +{overview.todayVsYesterday.visitsChangePct}%
              </span>
            ) : (
              <span className="text-rose-600 flex items-center">
                <ArrowDownRight className="w-3.5 h-3.5" />
                {overview?.todayVsYesterday?.visitsChangePct}%
              </span>
            )}
            <span>vs período anterior</span>
          </div>
        </div>

        {/* Conversions Total */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Conversiones Totales</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
              <FileCheck2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {overview?.totalConversions ?? 0}
            </span>
            <span className="text-xs text-emerald-600 font-bold">
              {overview?.successRate ?? 100}% éxito
            </span>
          </div>
          <p className="mt-2 text-[11px] text-slate-400">
            {overview?.successfulConversions ?? 0} exitosas • {overview?.failedConversions ?? 0} fallidas
          </p>
        </div>

        {/* Registered Users */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Cuentas Registradas</span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {overview?.totalUsers ?? 0}
            </span>
            {overview && overview.newRegistrationsToday > 0 && (
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded">
                +{overview.newRegistrationsToday} hoy
              </span>
            )}
          </div>
          <p className="mt-2 text-[11px] text-slate-400">
            Control centralizado en backend
          </p>
        </div>

        {/* System Error Rate */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Errores Registrados</span>
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {overview?.totalErrors ?? 0}
            </span>
            <span className="text-xs text-slate-400">
              ({telemetry.recentErrors24h} en 24h)
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <button
              onClick={() => onNavigateTab('errors')}
              className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer"
            >
              Ver registro de errores →
            </button>
          </div>
        </div>
      </div>

      {/* 7-Day Trend Chart & Leaderboard Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Visual Trend Chart */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Tendencia de Actividad (Últimos 7 días)
              </h3>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                <span className="text-slate-500">Visitas</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-slate-500">Conversiones</span>
              </div>
            </div>
          </div>

          {/* Bar Chart Bars */}
          <div className="pt-6 pb-2">
            {dailyTrends.length === 0 ? (
              <div className="h-44 flex items-center justify-center text-xs text-slate-400">
                Aún no hay suficiente historial acumulado para mostrar tendencias.
              </div>
            ) : (
              <div className="h-44 flex items-end justify-between gap-3">
                {dailyTrends.map((day, idx) => {
                  const visitHeightPct = Math.max((day.visits / maxTrendVisits) * 100, 6);
                  const convHeightPct = Math.max((day.conversions / maxTrendConv) * 100, 6);

                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                      <div className="w-full flex items-end justify-center gap-1 h-36">
                        {/* Visit Bar */}
                        <div
                          style={{ height: `${visitHeightPct}%` }}
                          className="w-1/2 max-w-[18px] bg-blue-500 hover:bg-blue-600 rounded-t-sm transition-all duration-300 relative group/bar"
                        >
                          <span className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover/bar:opacity-100 bg-slate-900 text-white text-[10px] px-1.5 py-0.5 rounded shadow whitespace-nowrap transition-opacity pointer-events-none z-10">
                            {day.visits} visitas
                          </span>
                        </div>
                        {/* Conversion Bar */}
                        <div
                          style={{ height: `${convHeightPct}%` }}
                          className="w-1/2 max-w-[18px] bg-emerald-500 hover:bg-emerald-600 rounded-t-sm transition-all duration-300 relative group/bar"
                        >
                          <span className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover/bar:opacity-100 bg-slate-900 text-white text-[10px] px-1.5 py-0.5 rounded shadow whitespace-nowrap transition-opacity pointer-events-none z-10">
                            {day.conversions} conv.
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-medium text-slate-400 truncate max-w-full">
                        {day.date.slice(5)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Top Tools Leaderboard */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Herramientas Más Usadas
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab('tools')}
              className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
            >
              Ver todas
            </button>
          </div>

          <div className="space-y-3">
            {(!overview?.mostUsedTools || overview.mostUsedTools.length === 0) ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                Sin ejecuciones registradas todavía.
              </p>
            ) : (
              overview.mostUsedTools.slice(0, 5).map((tool, i) => (
                <div key={tool.slug} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-5 h-5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[10px] flex items-center justify-center">
                      #{i + 1}
                    </span>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {tool.name}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    {tool.count} usos
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
