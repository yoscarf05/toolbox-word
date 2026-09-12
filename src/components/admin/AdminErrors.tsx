import React, { useState, useEffect, useCallback } from 'react';
import { 
  AlertTriangle, 
  Search, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  ChevronDown, 
  ChevronRight,
  Filter,
  Monitor,
  Check
} from 'lucide-react';

interface ErrorItem {
  id: string;
  toolSlug?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'new' | 'investigating' | 'resolved' | 'ignored';
  message: string;
  stack?: string;
  userAgent?: string;
  userId?: string;
  timestamp: number;
  metadata?: any;
}

export const AdminErrors: React.FC = () => {
  const [errors, setErrors] = useState<ErrorItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchErrors = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/admin/errors', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('toolbox_token') || ''}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setErrors(data.errors || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchErrors();
  }, [fetchErrors]);

  const updateErrorStatus = async (id: string, newStatus: ErrorItem['status']) => {
    try {
      const res = await fetch(`/api/admin/errors/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('toolbox_token') || ''}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setErrors((prev) =>
          prev.map((e) => (e.id === id ? { ...e, status: newStatus } : e))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredErrors = errors.filter((e) => {
    const matchesSeverity = severityFilter === 'all' || e.severity === severityFilter;
    const matchesStatus = statusFilter === 'all' || e.status === statusFilter;
    return matchesSeverity && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            <span>Monitor de Errores e Incidencias Técnicas</span>
          </h2>
          <p className="text-xs text-slate-500">
            Registro exhaustivo de excepciones de clientes, fallos de conversión y eventos anómalos
          </p>
        </div>

        <button
          onClick={fetchErrors}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Actualizar Errores</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="py-2 px-3 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none"
        >
          <option value="all">Todas las severidades</option>
          <option value="critical">🔴 Crítico</option>
          <option value="high">🟠 Alto</option>
          <option value="medium">🟡 Medio</option>
          <option value="low">⚪ Bajo</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="py-2 px-3 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none"
        >
          <option value="all">Todos los estados</option>
          <option value="new">Nuevo</option>
          <option value="investigating">Investigando</option>
          <option value="resolved">Resuelto</option>
          <option value="ignored">Ignorado</option>
        </select>
      </div>

      {/* Errors List */}
      <div className="space-y-3">
        {filteredErrors.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="font-semibold text-slate-700 dark:text-slate-300">
              No hay errores registrados con los filtros actuales.
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">El sistema se encuentra estable y saludable.</p>
          </div>
        ) : (
          filteredErrors.map((err) => {
            const isExpanded = expandedId === err.id;

            return (
              <div
                key={err.id}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : err.id)}
                      className="mt-0.5 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>

                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        {/* Severity Badge */}
                        <span className={`text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full ${
                          err.severity === 'critical'
                            ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                            : err.severity === 'high'
                            ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                            : err.severity === 'medium'
                            ? 'bg-yellow-100 dark:bg-yellow-950 text-yellow-800 dark:text-yellow-300'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}>
                          {err.severity}
                        </span>

                        {err.toolSlug && (
                          <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                            {err.toolSlug}
                          </span>
                        )}

                        <span className="text-[11px] text-slate-400">
                          {new Date(err.timestamp).toLocaleString()}
                        </span>
                      </div>

                      <p className="text-xs font-bold text-slate-900 dark:text-white leading-relaxed">
                        {err.message}
                      </p>
                    </div>
                  </div>

                  {/* Status Dropdown */}
                  <div className="flex items-center gap-2 shrink-0">
                    <select
                      value={err.status}
                      onChange={(e) => updateErrorStatus(err.id, e.target.value as any)}
                      className="py-1 px-2.5 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none"
                    >
                      <option value="new">Nuevo</option>
                      <option value="investigating">Investigando</option>
                      <option value="resolved">Resuelto</option>
                      <option value="ignored">Ignorado</option>
                    </select>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                    {err.stack && (
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400">Stack Trace</span>
                        <pre className="p-3 mt-1 rounded-xl bg-slate-950 text-rose-300 font-mono text-[11px] overflow-x-auto whitespace-pre-wrap">
                          {err.stack}
                        </pre>
                      </div>
                    )}

                    {err.userAgent && (
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                        <Monitor className="w-3.5 h-3.5 text-slate-400" />
                        <span>{err.userAgent}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
