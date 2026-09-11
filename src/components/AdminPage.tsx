import React, { useState } from 'react';
import { Language } from '../types';
import { TOOLS } from '../data/tools';
import { CATEGORIES } from '../data/categories';
import { 
  Shield, 
  Settings, 
  Activity, 
  Eye, 
  EyeOff, 
  Check, 
  Database, 
  Search, 
  Power, 
  DollarSign, 
  RefreshCw, 
  Sliders,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

interface AdminPageProps {
  lang: Language;
  onNavigate: (route: string) => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({ lang, onNavigate }) => {
  const [toolsList, setToolsList] = useState(
    TOOLS.map((t) => ({ ...t, active: true }))
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [adsEnabled, setAdsEnabled] = useState(true);
  const [globalBanner, setGlobalBanner] = useState(false);
  const [bannerText, setBannerText] = useState('Nueva actualización: 20 herramientas disponibles 100% privadas.');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const toggleTool = (id: string) => {
    setToolsList(
      toolsList.map((t) => (t.id === id ? { ...t, active: !t.active } : t))
    );
  };

  const handleSaveSettings = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const filtered = toolsList.filter((t) => {
    const nameStr = (t.name?.[lang] || t.name?.es || '').toLowerCase();
    const catStr = String(t.categoryId || t.category || '').toLowerCase();
    const q = searchTerm.toLowerCase();
    return nameStr.includes(q) || catStr.includes(q);
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-slate-900 text-white dark:bg-blue-600">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                Panel de Administración
              </h1>
              <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase">
                Ready Architecture
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Gestión de catálogo, estado de herramientas y configuración de monetización
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {savedSuccess && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold">
              <CheckCircle2 className="w-4 h-4" />
              Guardado
            </span>
          )}
          <button
            onClick={handleSaveSettings}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-colors cursor-pointer"
          >
            Guardar Configuración
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Herramientas Activas</span>
            <Activity className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
            {toolsList.filter((t) => t.active).length} / {toolsList.length}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">100% operativas en cliente</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Categorías</span>
            <Database className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
            {CATEGORIES.length}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">PDF, Imágenes, Texto, QR, Dev</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Estado AdSense</span>
            <DollarSign className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${adsEnabled ? 'bg-emerald-500' : 'bg-slate-400'}`} />
            <p className="text-lg font-bold text-slate-900 dark:text-white">
              {adsEnabled ? 'Activo (Google)' : 'Pausado'}
            </p>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Slots conformes y no intrusivos</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Servidores / RAM</span>
            <Shield className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-white">
            0 KB Cloud
          </p>
          <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">Zero Server Costs</span>
        </div>
      </div>

      {/* Global Toggles and AdSense Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-amber-500" />
            <span>Monetización y Publicidad</span>
          </h2>
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Mostrar anuncios Google AdSense</p>
              <p className="text-[11px] text-slate-400">Slots preparados en cabecera de herramientas y home</p>
            </div>
            <button
              onClick={() => setAdsEnabled(!adsEnabled)}
              className={`p-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                adsEnabled ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-700'
              }`}
            >
              {adsEnabled ? 'Activado' : 'Desactivado'}
            </button>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sliders className="w-4 h-4 text-blue-500" />
            <span>Avisos Globales</span>
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Mostrar barra de anuncio superior:</span>
              <input
                type="checkbox"
                checked={globalBanner}
                onChange={(e) => setGlobalBanner(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded cursor-pointer"
              />
            </div>
            <input
              type="text"
              value={bannerText}
              onChange={(e) => setBannerText(e.target.value)}
              disabled={!globalBanner}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium disabled:opacity-50"
            />
          </div>
        </div>
      </div>

      {/* Tools Catalog Management Table */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Inventario de Herramientas ({filtered.length})
          </h2>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filtrar por nombre o categoría..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold">
                <th className="py-3 px-3">Herramienta</th>
                <th className="py-3 px-3">Categoría</th>
                <th className="py-3 px-3">Insignia</th>
                <th className="py-3 px-3">Tipo Procesamiento</th>
                <th className="py-3 px-3 text-right">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filtered.map((tool) => (
                <tr key={tool.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                    {tool.name?.[lang] || tool.name?.es}
                  </td>
                  <td className="py-3 px-3 capitalize text-slate-600 dark:text-slate-400">
                    {tool.categoryId || tool.category}
                  </td>
                  <td className="py-3 px-3">
                    {tool.badge ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950 text-amber-600 border border-amber-200 dark:border-amber-800">
                        {tool.badge}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                    Navegador (RAM)
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => toggleTool(tool.id)}
                      className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                        tool.active
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {tool.active ? 'Activa' : 'Pausada'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
