import React from 'react';
import { Language, ThemeMode } from '../types';
import { getTranslation } from '../i18n';
import { CATEGORIES } from '../data/categories';
import { Wrench, Shield, Heart, ExternalLink, Globe } from 'lucide-react';

interface FooterProps {
  currentLang: Language;
  onLanguageChange: (lang: Language) => void;
  currentTheme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
  onNavigate: (route: string) => void;
}

export const Footer: React.FC<FooterProps> = ({
  currentLang,
  onLanguageChange,
  currentTheme,
  onThemeChange,
  onNavigate
}) => {
  return (
    <footer className="w-full bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800/80 text-slate-600 dark:text-slate-400 text-sm transition-colors mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          
          {/* Col 1: Brand & Mission */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm">
                <Wrench className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white">
                Toolbox <span className="text-blue-600 dark:text-blue-400">Word</span>
              </span>
            </div>
            
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400 max-w-sm">
              {getTranslation(currentLang, 'footerAboutText')}
            </p>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300 mb-1">
                <Shield className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>{getTranslation(currentLang, 'privacyBadgeTitle')}</span>
              </div>
              <span>{getTranslation(currentLang, 'privacyBadgeDesc')}</span>
            </div>
          </div>

          {/* Col 2: Popular Categories */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200 mb-4">
              {getTranslation(currentLang, 'allCategories')}
            </h4>
            <ul className="space-y-2.5 text-xs font-medium">
              {CATEGORIES.slice(0, 5).map((cat) => (
                <li key={cat.id}>
                  <button
                    onClick={() => onNavigate(`#/category/${cat.id}`)}
                    className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-left cursor-pointer"
                  >
                    {cat.name[currentLang] || cat.name.es}
                  </button>
                </li>
              ))}
              <li>
                <button
                  onClick={() => onNavigate('#/explore')}
                  className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                >
                  {getTranslation(currentLang, 'exploreAllTools')} →
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Practical Guides */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200 mb-4">
              {currentLang === 'es' ? 'Guías y Tutoriales' : 'Guides & Tutorials'}
            </h4>
            <ul className="space-y-2.5 text-xs font-medium">
              <li>
                <button
                  onClick={() => onNavigate('/guide/como-convertir-pdf-a-word-editable')}
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-left cursor-pointer"
                >
                  {currentLang === 'es' ? 'PDF a Word editable' : 'PDF to editable Word'}
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/guide/guia-completa-citas-apa-7-edicion')}
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-left cursor-pointer"
                >
                  {currentLang === 'es' ? 'Guía Citas APA 7.ª edición' : 'APA 7th Edition Guide'}
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/guide/como-reducir-tamano-pdf')}
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-left cursor-pointer"
                >
                  {currentLang === 'es' ? 'Cómo reducir tamaño de PDF' : 'How to compress PDF'}
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/guides')}
                  className="text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer flex items-center gap-1"
                >
                  <span>{currentLang === 'es' ? 'Ver 100+ guías completas' : 'View all 100+ guides'}</span>
                  <span>→</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Legal & Contact */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200 mb-4">
              {getTranslation(currentLang, 'legal')}
            </h4>
            <ul className="space-y-2.5 text-xs font-medium">
              <li>
                <button
                  onClick={() => onNavigate('#/privacy')}
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-left cursor-pointer"
                >
                  {getTranslation(currentLang, 'privacy')}
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('#/terms')}
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-left cursor-pointer"
                >
                  {getTranslation(currentLang, 'terms')}
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('#/cookies')}
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-left cursor-pointer"
                >
                  {getTranslation(currentLang, 'cookies')}
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('#/about')}
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-left cursor-pointer"
                >
                  {getTranslation(currentLang, 'about')}
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('#/contact')}
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-left cursor-pointer"
                >
                  {getTranslation(currentLang, 'contact')}
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('#/disclaimer')}
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-left cursor-pointer"
                >
                  {getTranslation(currentLang, 'disclaimer')}
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Disclaimer statement */}
        <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-500 leading-relaxed flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-center md:text-left">
            {currentLang === 'es'
              ? 'ToolBox World es una plataforma independiente de utilidades en línea. No estamos afiliados, patrocinados ni respaldados por Google, Adobe, Microsoft u otras empresas mencionadas.'
              : 'ToolBox World is an independent digital utility platform. We are not affiliated, sponsored, or endorsed by Google, Adobe, Microsoft, or any other trademarked companies.'}
          </p>
          <div className="flex items-center gap-3 shrink-0">
            <span>© 2026 ToolBox World.</span>
            <span>{getTranslation(currentLang, 'rightsReserved')}</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
