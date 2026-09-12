import React, { useState, useEffect, useCallback } from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  Copy, 
  Check, 
  Printer, 
  Calendar, 
  TrendingUp, 
  CheckCircle2, 
  RefreshCw,
  Sparkles
} from 'lucide-react';

export const AdminReports: React.FC = () => {
  const [report, setReport] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const fetchWeeklyReport = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/admin/reports/weekly', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('toolbox_token') || ''}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setReport(data.report);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWeeklyReport();
  }, [fetchWeeklyReport]);

  const handleCopySummary = () => {
    if (!report) return;
    const text = `📊 RESUMEN SEMANAL DE TOOLBOX WORD (${report.period})
--------------------------------------------------
• Visitas Registradas: ${report.visits} (${report.uniqueVisitors} únicas)
• Nuevas Cuentas: ${report.newUsers}
• Conversiones Totales: ${report.conversions}
• Tasa de Éxito Global: ${report.successRate}%
• Incidencias / Errores: ${report.errors}
• Top Herramientas:
${report.topTools.map((t: any, i: number) => `  ${i + 1}. ${t.name} (${t.count} ejecuciones)`).join('\n')}
• Fiabilidad del Sistema: ${report.reliabilityScore}%
--------------------------------------------------
Generado de forma automática por el Motor de Telemetría Toolbox Word.`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            <span>Informes Ejecutivos y Métricas Semanales</span>
          </h2>
          <p className="text-xs text-slate-500">
            Resumen consolidado de operaciones, fiabilidad y adopción de herramientas sin datos ficticios
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchWeeklyReport}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>

          <button
            onClick={handleCopySummary}
            disabled={!report}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copiado' : 'Copiar Texto'}</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-xs text-slate-400">
          Generando informe con datos del servidor...
        </div>
      ) : report ? (
        <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-8">
          {/* Header of the Report */}
          <div className="border-b border-slate-100 dark:border-slate-800 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 bg-blue-50 dark:bg-blue-950 px-2.5 py-1 rounded-full">
                Informe Oficial de Rendimiento
              </span>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-2">
                Resumen Semanal de Operaciones
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>Período evaluado: {report.period}</span>
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-right">
              <span className="text-[10px] uppercase font-extrabold text-emerald-700 dark:text-emerald-400">
                Índice de Fiabilidad
              </span>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {report.reliabilityScore}%
              </p>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
              <span className="text-[10px] uppercase font-bold text-slate-400">Visitas Totales</span>
              <p className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">{report.visits}</p>
              <span className="text-[11px] text-slate-500">{report.uniqueVisitors} visitantes únicos</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
              <span className="text-[10px] uppercase font-bold text-slate-400">Nuevos Usuarios</span>
              <p className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">+{report.newUsers}</p>
              <span className="text-[11px] text-slate-500">Cuentas creadas</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
              <span className="text-[10px] uppercase font-bold text-slate-400">Conversiones</span>
              <p className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">{report.conversions}</p>
              <span className="text-[11px] text-emerald-600 font-bold">{report.successRate}% exitosas</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
              <span className="text-[10px] uppercase font-bold text-slate-400">Errores / Fallos</span>
              <p className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">{report.errors}</p>
              <span className="text-[11px] text-slate-500">Incidentes reportados</span>
            </div>
          </div>

          {/* Top Tools */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Top Herramientas con Mayor Demanda en la Semana
            </h4>
            <div className="space-y-2">
              {report.topTools && report.topTools.length > 0 ? (
                report.topTools.map((t: any, i: number) => (
                  <div key={t.slug} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-3">
                      <span className="font-extrabold text-xs text-blue-600">0{i + 1}</span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">{t.name}</span>
                    </div>
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      {t.count} ejecuciones
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 py-3">No hay suficiente actividad registrada en el período.</p>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
