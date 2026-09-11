import React, { useState, useMemo } from 'react';
import { Language } from '../types';
import { GUIDES, GUIDE_CATEGORIES } from '../data/guides';
import { TOOLS } from '../data/tools';
import { Search, BookOpen, Clock, ArrowRight, Sparkles, Filter, CheckCircle2, ChevronRight } from 'lucide-react';
import { BannerAd } from './AdComponents';

interface GuidesCatalogPageProps {
  lang: Language;
  onNavigate: (route: string) => void;
  initialCategory?: string;
}

export const GuidesCatalogPage: React.FC<GuidesCatalogPageProps> = ({
  lang,
  onNavigate,
  initialCategory = 'all'
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredGuides = useMemo(() => {
    return GUIDES.filter((guide) => {
      // Category filter
      const matchesCategory =
        selectedCategory === 'all' ||
        guide.category.toLowerCase() === selectedCategory.toLowerCase();

      // Search filter
      const title = (guide.title[lang] || guide.title.es || '').toLowerCase();
      const summary = (guide.summary[lang] || guide.summary.es || '').toLowerCase();
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch = !query || title.includes(query) || summary.includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery, lang]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs font-medium text-slate-500">
        <button
          onClick={() => onNavigate('/')}
          className="hover:text-blue-600 transition-colors cursor-pointer"
        >
          {lang === 'es' ? 'Inicio' : 'Home'}
        </button>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-800 dark:text-slate-200 font-semibold">
          {lang === 'es' ? 'Centro de Guías y Tutoriales' : 'Guides & Tutorials Center'}
        </span>
      </nav>

      {/* Header Banner */}
      <div className="rounded-3xl p-8 sm:p-12 bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        
        <div className="max-w-3xl space-y-4 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold">
            <BookOpen className="w-3.5 h-3.5" />
            <span>{lang === 'es' ? 'Guías y tutoriales prácticos paso a paso' : 'Step-by-step practical guides & tutorials'}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            {lang === 'es' ? 'Guías y Tutoriales' : 'Guides & Tutorials'}
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
            {lang === 'es'
              ? 'Aprende a dominar la conversión de documentos, formatos de citas bibliográficas (APA 7, MLA 9, Chicago, IEEE), optimización de archivos y productividad digital.'
              : 'Master document conversions, citation styles (APA 7, MLA 9, Chicago, IEEE), file optimization, and digital productivity with verified guides.'}
          </p>

          {/* Quick Search */}
          <div className="pt-2 max-w-xl">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  lang === 'es'
                    ? 'Buscar tutoriales y guías (ej. APA 7, PDF a Word, comprimir...)'
                    : 'Search tutorials and guides (e.g. APA 7, PDF to Word, compress...)'
                }
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Category Pills Filter */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
          <Filter className="w-4 h-4" />
          <span>{lang === 'es' ? 'Filtrar por Categoría' : 'Filter by Category'}</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {GUIDE_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20 ring-2 ring-blue-600'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <span>{cat.name[lang] || cat.name.es}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Guides Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-500 font-medium pb-2 border-b border-slate-100 dark:border-slate-800">
          <span>
            {lang === 'es'
              ? 'Guías y tutoriales disponibles'
              : 'Available guides and tutorials'}
          </span>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-blue-600 hover:underline cursor-pointer"
            >
              {lang === 'es' ? 'Limpiar búsqueda' : 'Clear search'}
            </button>
          )}
        </div>

        {filteredGuides.length === 0 ? (
          <div className="py-16 text-center space-y-3 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
            <BookOpen className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
            <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
              {lang === 'es' ? 'No se encontraron guías' : 'No guides found'}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {lang === 'es'
                ? 'Prueba ajustando tus términos de búsqueda o seleccionando otra categoría.'
                : 'Try adjusting your search terms or picking a different category.'}
            </p>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
              }}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold"
            >
              {lang === 'es' ? 'Ver todas las guías' : 'View all guides'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredGuides.map((guide) => {
              const relatedTool = guide.relatedToolId
                ? TOOLS.find((t) => t.id === guide.relatedToolId || t.slug === guide.relatedToolId)
                : null;

              return (
                <article
                  key={guide.slug}
                  onClick={() => onNavigate(`/guide/${guide.slug}`)}
                  className="group relative flex flex-col justify-between p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-lg transition-all duration-200 cursor-pointer"
                >
                  <div className="space-y-3">
                    {/* Meta info */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {guide.category}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <Clock className="w-3.5 h-3.5" />
                        {guide.readTime || '4 min'}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug line-clamp-2">
                      {guide.title[lang] || guide.title.es}
                    </h3>

                    {/* Summary */}
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3">
                      {guide.summary[lang] || guide.summary.es}
                    </p>
                  </div>

                  <div className="pt-5 mt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-semibold text-blue-600 dark:text-blue-400">
                    <span className="flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      <span>{lang === 'es' ? 'Leer tutorial completo' : 'Read full tutorial'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                    {relatedTool && (
                      <span className="text-[10px] text-slate-400 font-normal truncate max-w-[120px]">
                        {relatedTool.name[lang] || relatedTool.name.es}
                      </span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Ad / Promotion */}
      <div className="pt-6">
        <BannerAd slotId="guides-catalog-bottom" />
      </div>
    </div>
  );
};
