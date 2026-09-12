import React, { useState, useEffect, useCallback } from 'react';
import { 
  FileText, 
  Search, 
  RefreshCw, 
  ShieldCheck, 
  ShieldAlert, 
  Clock, 
  User, 
  Lock,
  Globe
} from 'lucide-react';

interface AuditLogItem {
  id: string;
  timestamp: number;
  userId?: string;
  userEmail?: string;
  role?: string;
  action: string;
  target?: string;
  ip?: string;
  status: 'success' | 'failure';
  details?: any;
}

export const AdminAuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchLogs = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/admin/audit-logs', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('toolbox_token') || ''}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const filteredLogs = logs.filter((l) => {
    const q = search.toLowerCase();
    return (
      (l.action && l.action.toLowerCase().includes(q)) ||
      (l.userEmail && l.userEmail.toLowerCase().includes(q)) ||
      (l.target && l.target.toLowerCase().includes(q)) ||
      (l.ip && l.ip.includes(q))
    );
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            <span>Registro de Auditoría y Seguridad</span>
          </h2>
          <p className="text-xs text-slate-500">
            Pista de auditoría inmutable de accesos privilegiados, inicios de sesión y cambios de configuración
          </p>
        </div>

        <button
          onClick={fetchLogs}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Actualizar Registro</span>
        </button>
      </div>

      {/* Search */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filtrar por acción, correo de actor, objetivo o dirección IP..."
            className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Fecha y Hora</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Acción</th>
                <th className="py-3 px-4">Objetivo</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4">IP</th>
                <th className="py-3 px-4">Detalles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No hay registros de auditoría que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap text-[11px]">
                      {new Date(l.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {l.userEmail || 'Sistema/Invitado'}
                        </span>
                        {l.role && (
                          <span className="ml-1 text-[10px] uppercase font-bold text-slate-400">
                            ({l.role})
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      {l.action}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      {l.target || '-'}
                    </td>
                    <td className="py-3 px-4">
                      {l.status === 'success' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Éxito
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          Fallo
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                      {l.ip || '-'}
                    </td>
                    <td className="py-3 px-4 text-[11px] text-slate-500 max-w-[200px] truncate">
                      {l.details ? JSON.stringify(l.details) : '-'}
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
