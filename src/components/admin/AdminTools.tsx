import React, { useState, useEffect, useCallback } from 'react';
import { 
  Wrench, 
  Search, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  Activity, 
  Power, 
  RefreshCw,
  SlidersHorizontal
} from 'lucide-react';
import { TOOLS } from '../../data/tools';

interface ToolTelemetry {
  slug: string;
  name: string;
  category: string;
  status: 'operational' | 'degraded' | 'failing';
  enabled: boolean;
  totalUses: number;
  successfulUses: number;
  failedUses: number;
  successRate: number;
  avgDurationMs: number;
  lastUsedAt: number | null;
}

export const AdminTools: React.FC = () => {
  const [tools, setTools] = useState<ToolTelemetry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const fetchTools = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/admin/tools', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('toolbox_token') || ''}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setTools(data.tools || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTools();
  }, [fetchTools]);

  const toggleToolStatus = async (slug: string, currentEnabled: boolean) => {
    try {
      const res = await fetch(`/api/admin/tools/${slug}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('toolbox_token') || ''}`
        },
        body: JSON.stringify({ enabled: !currentEnabled })
      });
      if (res.ok) {
        setTools((prev) =>
          prev.map((t) => (t.slug === slug ? { ...t, enabled: !currentEnabled } : t))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredTools = tools.filter((t) => {
    const matchesSearch = 
      t.name.toLowerCase().includes(search.toLowerCase()) || 
      t.slug.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const categories = Array.from(new Set(tools.map((t) => t.category).filter(Boolean))) as string[];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Wrench className="w-5 h-5 text-blue-600" />
            <span>Telemetría y Estado de Herramientas</span>
          </h2>
          <p className="text-xs text-slate-500">
            Monitoreo en tiempo real de rendimiento, tasa de éxito, tiempos y disponibilidad
          </p>
        </div>

        <button
          onClick={fetchTools}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Actualizar Telemetría</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar herramienta por nombre o slug..."
            className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="py-2 px-3 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none"
        >
          <option value="all">Cualquier estado</option>
          <option value="operational">🟢 Operativa (&gt;=90%)</option>
          <option value="degraded">🟡 Advertencia (70-89%)</option>
          <option value="failing">🔴 Con fallas (&lt;70%)</option>
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="py-2 px-3 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none"
        >
          <option value="all">Todas las categorías</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c.toUpperCase()}
            </option>
          ))}
        </select>
      </div>

      {/* Tools Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Herramienta</th>
                <th className="py-3 px-4">Categoría</th>
                <th className="py-3 px-4">Salud Operativa</th>
                <th className="py-3 px-4 text-center">Tasa Éxito</th>
                <th className="py-3 px-4 text-center">Usos Totales</th>
                <th className="py-3 px-4 text-center">Duración Media</th>
                <th className="py-3 px-4">Último Uso</th>
                <th className="py-3 px-4 text-right">Interruptor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredTools.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No se encontraron herramientas con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredTools.map((t) => (
                  <tr key={t.slug} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{t.name}</p>
                        <p className="text-[11px] text-slate-400 font-mono">/{t.slug}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {t.category}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {t.status === 'operational' ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          Operativa
                        </span>
                      ) : t.status === 'degraded' ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          Advertencia
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                          <XCircle className="w-3 h-3 text-rose-600" />
                          Con fallas
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`font-bold ${
                        t.successRate >= 90 ? 'text-emerald-600' : t.successRate >= 70 ? 'text-amber-600' : 'text-rose-600'
                      }`}>
                        {t.successRate}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-semibold text-slate-700 dark:text-slate-300">
                      {t.totalUses}
                      <span className="text-[10px] text-slate-400 block font-normal">
                        ({t.successfulUses}✓ / {t.failedUses}✗)
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-slate-600 dark:text-slate-400">
                      {t.avgDurationMs ? `${t.avgDurationMs} ms` : '-'}
                    </td>
                    <td className="py-3 px-4 text-[11px] text-slate-400">
                      {t.lastUsedAt ? new Date(t.lastUsedAt).toLocaleTimeString() : 'Nunca'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => toggleToolStatus(t.slug, t.enabled)}
                        className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                          t.enabled
                            ? 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950 text-emerald-600'
                            : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-400'
                        }`}
                        title={t.enabled ? 'Deshabilitar en catálogo' : 'Habilitar en catálogo'}
                      >
                        <Power className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
