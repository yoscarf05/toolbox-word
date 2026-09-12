import React, { useState } from 'react';
import { Language, Category, Tool } from '../types';
import { CATEGORIES } from '../data/categories';
import { TOOLS } from '../data/tools';
import { GUIDES } from '../data/guides';
import { BannerAd } from './AdComponents';
import { DynamicIcon } from './DynamicIcon';
import { ArrowLeft, ArrowRight, ShieldCheck, BookOpen, Layers } from 'lucide-react';

interface CategoryPageProps {
  categoryId: string;
  lang: Language;
  onNavigate: (route: string) => void;
}

export const CategoryPage: React.FC<CategoryPageProps> = ({ categoryId, lang, onNavigate }) => {
  const isAll = categoryId === 'all' || categoryId === 'explore';
  const [activeFilter, setActiveFilter] = useState<string>(isAll ? 'all' : categoryId);

  const category: Category = isAll
    ? {
        id: 'all' as any,
        name: {
          es: 'Todas las Herramientas',
          en: 'All Tools',
          pt: 'Todas as Ferramentas',
          fr: 'Tous les Outils',
          de: 'Alle Werkzeuge',
          it: 'Tutti gli Strumenti'
        },
        icon: 'Layers',
        description: {
          es: 'Catálogo completo de herramientas gratuitas, privadas y procesadas directamente en tu navegador.',
          en: 'Complete catalog of free, private tools running directly in your browser.',
          pt: 'Catálogo completo de ferramentas gratuitas e privadas que rodam no seu navegador.',
          fr: 'Catalogue complet d\'outils gratuits et privés fonctionnant directement dans votre navigateur.',
          de: 'Vollständiger Katalog kostenloser und privater Tools direkt im Browser.',
          it: 'Catalogo completo di strumenti gratuiti e privati eseguiti direttamente nel tuo browser.'
        }
      }
    : CATEGORIES.find((c) => c.id === categoryId) || CATEGORIES[0];

  // If user changed filter on this page, adjust displayed tools
  const currentCategory = activeFilter === 'all'
    ? category
    : (CATEGORIES.find((c) => c.id === activeFilter) || category);

  const tools = activeFilter === 'all'
    ? TOOLS
    : TOOLS.filter((t) => t.categoryId === activeFilter || t.category === activeFilter);

  // Safe filter for related guides: checks if relatedTools exists and is an array
  const relatedGuides = GUIDES.filter((g) => {
    const rel = Array.isArray(g.relatedTools)
      ? g.relatedTools
      : (g.relatedToolId ? [g.relatedToolId] : []);
    return rel.some((rt) => tools.some((t) => t.id === rt || t.slug === rt));
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-10">
      {/* Header */}
      <div className="space-y-4">
        <button
          onClick={() => onNavigate('/')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{lang === 'es' ? 'Volver al catálogo general' : 'Back to all categories'}</span>
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            {isAll ? <Layers className="w-7 h-7" /> : <DynamicIcon name={currentCategory.icon} className="w-7 h-7" />}
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {currentCategory.name[lang] || currentCategory.name.es}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-2xl leading-relaxed">
              {currentCategory.description[lang] || currentCategory.description.es}
            </p>
          </div>
        </div>
      </div>

      {/* Category Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeFilter === 'all'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          {lang === 'es' ? 'Todas' : 'All'} ({TOOLS.length})
        </button>
        {CATEGORIES.map((cat) => {
          const count = TOOLS.filter((t) => t.categoryId === cat.id || t.category === cat.id).length;
          const isActive = activeFilter === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveFilter(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>{cat.name[lang] || cat.name.es}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                isActive ? 'bg-blue-700 text-blue-100' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tools List */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {lang === 'es' ? 'Herramientas disponibles' : 'Available Tools'}
          </h2>
          <span className="text-xs font-semibold text-slate-400">
            {tools.length} {lang === 'es' ? 'herramientas' : 'tools'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {tools.map((tool) => {
            return (
              <div
                key={tool.id}
                onClick={() => onNavigate(`/tool/${tool.slug}`)}
                className="group p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500 hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <DynamicIcon name={tool.icon} className="w-6 h-6" />
                    </div>
                    {tool.badge && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900">
                        {tool.badge}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                      {tool.name[lang] || tool.name.es}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                      {tool.shortDescription[lang] || tool.shortDescription.es}
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-blue-600 dark:text-blue-400">
                  <span>{lang === 'es' ? 'Abrir herramienta' : 'Launch tool'}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Ad slot */}
      <div className="max-w-4xl mx-auto">
        <BannerAd slotId="category-banner" />
      </div>

      {/* Related Guides if any */}
      {relatedGuides.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <span>{lang === 'es' ? 'Guías y tutoriales relacionados' : 'Related Guides'}</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {relatedGuides.map((g) => (
              <div
                key={g.id}
                onClick={() => onNavigate(`/guide/${g.slug}`)}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500 transition-all cursor-pointer"
              >
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">{g.readTime}</span>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-1 mb-1">{g.title[lang] || g.title.es}</h4>
                <p className="text-xs text-slate-500 line-clamp-2">{g.summary[lang] || g.summary.es}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
