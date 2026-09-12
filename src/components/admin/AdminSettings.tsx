import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Sliders, 
  DollarSign, 
  Megaphone, 
  ShieldCheck, 
  Save, 
  Check, 
  Key, 
  AlertTriangle,
  Lock
} from 'lucide-react';
import { CriticalActionModal } from './CriticalActionModal';
import { SudoModal } from './SudoModal';

export const AdminSettings: React.FC = () => {
  const { isSuperAdmin } = useAuth();
  const [adsEnabled, setAdsEnabled] = useState(true);
  const [globalBanner, setGlobalBanner] = useState(false);
  const [bannerText, setBannerText] = useState('Nueva actualización: herramientas disponibles con privacidad total.');
  const [authToken, setAuthToken] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals
  const [isCriticalModalOpen, setIsCriticalModalOpen] = useState(false);
  const [isSudoModalOpen, setIsSudoModalOpen] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('toolbox_token') || ''}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          setAdsEnabled(data.settings.adsEnabled ?? true);
          setGlobalBanner(data.settings.bannerEnabled ?? data.settings.globalBanner ?? false);
          setBannerText(data.settings.globalBannerText ?? data.settings.bannerText ?? '');
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // If Admin without token -> prompt critical authorization modal
    if (!isSuperAdmin && !authToken.trim()) {
      setIsCriticalModalOpen(true);
      return;
    }

    // If Super Admin without active sudo ticket in session -> open Sudo modal
    if (isSuperAdmin) {
      const sudo = sessionStorage.getItem('sudo_ticket');
      if (!sudo) {
        setIsSudoModalOpen(true);
        return;
      }
    }

    await executeSave();
  };

  const executeSave = async (sudoTicket?: string) => {
    setIsSaving(true);
    setErrorMessage(null);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('toolbox_token') || ''}`
      };

      if (authToken.trim()) {
        headers['x-change-authorization-token'] = authToken.trim();
      }

      const activeSudo = sudoTicket || sessionStorage.getItem('sudo_ticket');
      if (activeSudo) {
        headers['x-sudo-ticket'] = activeSudo;
      }

      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          adsEnabled,
          bannerEnabled: globalBanner,
          globalBannerText: bannerText
        })
      });

      const data = await res.json();

      if (res.status === 202 && data.authorizationRequired) {
        setIsCriticalModalOpen(true);
        return;
      }

      if (!res.ok) {
        if (data.error === 'SudoRequired') {
          setIsSudoModalOpen(true);
          return;
        }
        throw new Error(data.message || data.error || 'Error al guardar la configuración');
      }

      setSavedSuccess(true);
      setAuthToken('');
      setTimeout(() => setSavedSuccess(false), 3000);
      fetchSettings();
    } catch (err: any) {
      setErrorMessage(err.message || 'No se pudo guardar la configuración.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Sliders className="w-5 h-5 text-blue-600" />
          <span>Configuración Global de la Plataforma</span>
        </h2>
        <p className="text-xs text-slate-500">
          Ajustes de monetización, comunicación con usuarios y parámetros de seguridad
        </p>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {!isSuperAdmin && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-3">
          <Lock className="w-4 h-4 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div>
            <strong className="block font-bold">Modificaciones en Producción Protegidas</strong>
            <span>
              Los cambios en configuración global son considerados acciones críticas. Como Administrador, al guardar se generará una solicitud formal para autorización del Super Admin, o puedes aplicar un token previamente autorizado.
            </span>
          </div>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Monetization & Advertising */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Monetización y Publicidad (Google AdSense)
                </h3>
                <p className="text-xs text-slate-500">
                  Activa o pausa globalmente los bloques publicitarios en toda la aplicación
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={adsEnabled}
                onChange={(e) => setAdsEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>
        </div>

        {/* Global Banner */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                <Megaphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Banner Informativo Global
                </h3>
                <p className="text-xs text-slate-500">
                  Muestra un aviso visible en la parte superior del catálogo para todos los usuarios
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={globalBanner}
                onChange={(e) => setGlobalBanner(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {globalBanner && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Texto del Mensaje
              </label>
              <input
                type="text"
                value={bannerText}
                onChange={(e) => setBannerText(e.target.value)}
                maxLength={150}
                placeholder="Ejemplo: Próximo mantenimiento preventivo este domingo..."
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </div>

        {/* Token Authorization Input for Admin (if available) */}
        {!isSuperAdmin && (
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
            <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Key className="w-4 h-4 text-indigo-600" />
              Token de Autorización de Un Solo Uso (Opcional):
            </label>
            <input
              type="text"
              placeholder="Pega aquí el token emitido por el Super Admin (ej: act_...)"
              value={authToken}
              onChange={(e) => setAuthToken(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-[11px] text-slate-500">
              Si el Super Admin ya autorizó tu cambio, introduce aquí el token para aplicarlo inmediatamente. Si no tienes token, pulsa "Guardar Cambios" y solicita autorización.
            </p>
          </div>
        )}

        {/* Security Parameters Summary */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-xs">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span>Políticas de Seguridad Activas</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
              <span className="font-bold block text-slate-700 dark:text-slate-200">Expiración Sesión</span>
              <span className="text-slate-500">30 minutos inactividad</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
              <span className="font-bold block text-slate-700 dark:text-slate-200">Bloqueo Temporal</span>
              <span className="text-slate-500">15 minutos por IP / cuenta</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
              <span className="font-bold block text-slate-700 dark:text-slate-200">Segundo Factor Super Admin</span>
              <span className="text-emerald-600 font-bold">100% Obligatorio (TOTP)</span>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {savedSuccess && (
            <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
              <Check className="w-4 h-4" />
              Configuración guardada en el servidor
            </span>
          )}
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs shadow-sm transition-colors cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Guardando...' : 'Guardar Cambios'}</span>
          </button>
        </div>
      </form>

      {/* Critical Action Request Modal for Admins */}
      <CriticalActionModal
        isOpen={isCriticalModalOpen}
        onClose={() => setIsCriticalModalOpen(false)}
        title="Modificación de Configuración de Producción"
        actionName="update_system_settings"
        targetResource="system/settings"
        consequences="Afecta el despliegue global de anuncios, banners y directivas de seguridad en tiempo real para todos los visitantes."
        paramsToChange={{
          adsEnabled,
          bannerEnabled: globalBanner,
          globalBannerText: bannerText
        }}
        onRequestCreated={() => {
          fetchSettings();
        }}
      />

      {/* Sudo Modal for Super Admin */}
      <SudoModal
        isOpen={isSudoModalOpen}
        onClose={() => setIsSudoModalOpen(false)}
        actionTitle="Guardar Configuración Crítica del Sistema"
        onSuccess={(ticket) => {
          setIsSudoModalOpen(false);
          executeSave(ticket);
        }}
      />
    </div>
  );
};
