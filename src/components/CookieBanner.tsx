import React, { useState, useEffect } from 'react';
import { CookiePreferences, Language } from '../types';
import { getTranslation } from '../i18n';
import { Shield, Settings2, X, Check } from 'lucide-react';

interface CookieBannerProps {
  lang: Language;
  onNavigate: (route: string) => void;
}

export const CookieBanner: React.FC<CookieBannerProps> = ({ lang, onNavigate }) => {
  const [visible, setVisible] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    accepted: false,
    necessary: true,
    analytics: false,
    advertising: false
  });

  useEffect(() => {
    const saved = localStorage.getItem('toolbox_cookie_consent');
    if (!saved) {
      // Delay slightly for smooth page entry
      const timer = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(timer);
    } else {
      try {
        setPreferences(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const saveAndClose = (prefs: CookiePreferences) => {
    localStorage.setItem('toolbox_cookie_consent', JSON.stringify(prefs));
    setPreferences(prefs);
    setVisible(false);
    setShowModal(false);
  };

  const handleAcceptAll = () => {
    saveAndClose({
      accepted: true,
      necessary: true,
      analytics: true,
      advertising: true
    });
  };

  const handleRejectNonEssential = () => {
    saveAndClose({
      accepted: true,
      necessary: true,
      analytics: false,
      advertising: false
    });
  };

  if (!visible) return null;

  return (
    <>
      <div 
        id="cookie-consent-bar"
        role="region"
        aria-label="Consentimiento de cookies"
        className="fixed bottom-0 inset-x-0 z-50 p-4 sm:p-6 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shadow-2xl transition-all animate-fade-in"
      >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3 max-w-3xl">
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-slate-700 dark:text-slate-300 font-normal leading-relaxed">
                {getTranslation(lang, 'cookieBannerText')}{' '}
                <button
                  onClick={() => onNavigate('#/cookies')}
                  className="font-semibold text-blue-600 dark:text-blue-400 hover:underline inline"
                >
                  {getTranslation(lang, 'cookies')}
                </button>.
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {lang === 'es' ? 'Tus archivos nunca se procesan con fines publicitarios.' : 'Your files are never processed for advertising.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto shrink-0">
            <button
              id="cookie-btn-settings"
              onClick={() => setShowModal(true)}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Settings2 className="w-3.5 h-3.5" />
              {getTranslation(lang, 'customizeCookies')}
            </button>
            <button
              id="cookie-btn-reject"
              onClick={handleRejectNonEssential}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              {getTranslation(lang, 'rejectNonEssential')}
            </button>
            <button
              id="cookie-btn-accept"
              onClick={handleAcceptAll}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              {getTranslation(lang, 'acceptAllCookies')}
            </button>
          </div>
        </div>
      </div>

      {/* Preferences Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {lang === 'es' ? 'Preferencias de Privacidad y Cookies' : 'Privacy & Cookie Preferences'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4">
              <div className="flex items-start justify-between gap-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {lang === 'es' ? 'Cookies Técnicas Necesarias' : 'Strictly Necessary Cookies'}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {lang === 'es' ? 'Requeridas para recordar tu tema (claro/oscuro), idioma y funcionamiento básico.' : 'Required to remember your theme preference, language, and core features.'}
                  </p>
                </div>
                <span className="text-xs font-semibold px-2 py-1 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded">
                  {lang === 'es' ? 'Siempre activas' : 'Always active'}
                </span>
              </div>

              <div className="flex items-start justify-between gap-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {lang === 'es' ? 'Analítica Anónima' : 'Anonymous Analytics'}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {lang === 'es' ? 'Nos ayuda a saber qué herramientas se utilizan más para mejorarlas.' : 'Helps us discover popular tools to guide future performance improvements.'}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.analytics}
                  onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 mt-1 cursor-pointer"
                />
              </div>

              <div className="flex items-start justify-between gap-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {lang === 'es' ? 'Publicidad Personalizada' : 'Personalized Advertising'}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {lang === 'es' ? 'Permite a Google AdSense mostrar anuncios más relevantes.' : 'Allows Google AdSense to serve relevant non-intrusive ads.'}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.advertising}
                  onChange={(e) => setPreferences({ ...preferences, advertising: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 mt-1 cursor-pointer"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => saveAndClose({ ...preferences, accepted: true })}
                className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                {lang === 'es' ? 'Guardar Preferencias' : 'Save Preferences'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
