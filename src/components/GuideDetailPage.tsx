import React, { useEffect } from 'react';
import { Language } from '../types';
import { GUIDES } from '../data/guides';
import { TOOLS } from '../data/tools';
import { BannerAd } from './AdComponents';
import { ArrowLeft, Clock, Calendar, ArrowRight, BookOpen, Share2, ChevronRight, CheckCircle2, Sparkles, ExternalLink } from 'lucide-react';

interface GuideDetailPageProps {
  guideSlug: string;
  lang: Language;
  onNavigate: (route: string) => void;
}

export const GuideDetailPage: React.FC<GuideDetailPageProps> = ({ guideSlug, lang, onNavigate }) => {
  const guide = GUIDES.find((g) => g.slug === guideSlug) || GUIDES[0];

  // Update document title for SEO
  useEffect(() => {
    if (guide) {
      const titleText = guide.seoTitle?.[lang] || guide.title[lang] || guide.title.es || 'Guía';
      document.title = `${titleText} | Toolbox Word`;
    }
    return () => {
      document.title = 'Toolbox Word - Herramientas Online Rápidas y Privadas';
    };
  }, [guide, lang]);

  // Find related tool safely
  const relatedToolObj = guide.relatedToolId
    ? TOOLS.find((t) => t.id === guide.relatedToolId || t.slug === guide.relatedToolId)
    : null;

  // Find 3 other guides in the same category or overall
  const relatedGuides = GUIDES.filter((g) => g.slug !== guide.slug && (g.category === guide.category || true)).slice(0, 3);

  if (!guide) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          {lang === 'es' ? 'Guía no encontrada' : 'Guide not found'}
        </h2>
        <button
          onClick={() => onNavigate('/guides')}
          className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-xs shadow-sm hover:bg-blue-700 transition-colors"
        >
          {lang === 'es' ? 'Ver catálogo de guías' : 'View all guides'}
        </button>
      </div>
    );
  }

  const guideTitle = guide.title[lang] || guide.title.es || '';
  const guideSummary = guide.summary[lang] || guide.summary.es || '';
  const guideContent = guide.content[lang] || guide.content.es || '';

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs font-medium text-slate-500 overflow-x-auto whitespace-nowrap pb-1">
        <button
          onClick={() => onNavigate('/')}
          className="hover:text-blue-600 transition-colors cursor-pointer"
        >
          {lang === 'es' ? 'Inicio' : 'Home'}
        </button>
        <ChevronRight className="w-3.5 h-3.5 shrink-0" />
        <button
          onClick={() => onNavigate('/guides')}
          className="hover:text-blue-600 transition-colors cursor-pointer"
        >
          {lang === 'es' ? 'Guías' : 'Guides'}
        </button>
        <ChevronRight className="w-3.5 h-3.5 shrink-0" />
        <span className="text-slate-800 dark:text-slate-200 font-semibold truncate max-w-xs sm:max-w-md">
          {guideTitle}
        </span>
      </nav>

      {/* Guide Header */}
      <header className="space-y-4 pb-6 border-b border-slate-100 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
          <span className="px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold uppercase tracking-wider text-[11px]">
            {guide.category}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            {guide.readTime || '4 min'}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {guide.publishedAt || '2025'}
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white leading-tight">
          {guideTitle}
        </h1>

        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
          {guideSummary}
        </p>
      </header>

      {/* Callout box to launch the corresponding tool right away */}
      {relatedToolObj && (
        <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-blue-950/40 border border-blue-200/80 dark:border-blue-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              {lang === 'es' ? 'Herramienta oficial recomendada' : 'Official Recommended Tool'}
            </span>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              {relatedToolObj.name[lang] || relatedToolObj.name.es}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-lg">
              {relatedToolObj.shortDescription[lang] || relatedToolObj.shortDescription.es}
            </p>
          </div>
          <button
            onClick={() => onNavigate(`/tool/${relatedToolObj.slug}`)}
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer shrink-0 transition-all hover:scale-[1.02]"
          >
            <span>{lang === 'es' ? 'Usar herramienta gratis' : 'Use tool for free'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Steps Block if available */}
      {guide.steps && guide.steps.length > 0 && (
        <section className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>{lang === 'es' ? 'Procedimiento resumido paso a paso' : 'Step-by-Step Action Plan'}</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            {guide.steps.map((step, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold">
                  {idx + 1}
                </span>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  {step.title}
                </h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Main Body with Clean Typography */}
      <div className="prose dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 leading-relaxed space-y-6 text-sm sm:text-base">
        {guideContent.split('\n\n').map((para, idx) => {
          if (para.startsWith('## ')) {
            return (
              <h2 key={idx} className="text-2xl font-bold text-slate-900 dark:text-white pt-4 pb-1 border-b border-slate-100 dark:border-slate-800">
                {para.replace('## ', '')}
              </h2>
            );
          }
          if (para.startsWith('### ')) {
            return (
              <h3 key={idx} className="text-xl font-bold text-slate-900 dark:text-white pt-2">
                {para.replace('### ', '')}
              </h3>
            );
          }
          if (para.startsWith('- ')) {
            const listItems = para.split('\n').map((li) => li.replace('- ', ''));
            return (
              <ul key={idx} className="list-disc pl-5 space-y-2">
                {listItems.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            );
          }
          if (para.match(/^\d+\. /)) {
            const listItems = para.split('\n');
            return (
              <ol key={idx} className="list-decimal pl-5 space-y-2">
                {listItems.map((item, i) => (
                  <li key={i}>{item.replace(/^\d+\.\s*/, '')}</li>
                ))}
              </ol>
            );
          }
          return <p key={idx} className="leading-relaxed">{para}</p>;
        })}
      </div>

      {/* Related Guides Section */}
      <div className="pt-8 border-t border-slate-100 dark:border-slate-800 space-y-4">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center justify-between">
          <span>{lang === 'es' ? 'Otras guías recomendadas' : 'Other Recommended Guides'}</span>
          <button
            onClick={() => onNavigate('/guides')}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>{lang === 'es' ? 'Ver catálogo de 100+ guías' : 'View all 100+ guides'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {relatedGuides.map((relGuide) => (
            <div
              key={relGuide.slug}
              onClick={() => onNavigate(`/guide/${relGuide.slug}`)}
              className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer space-y-2"
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {relGuide.category}
              </span>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2 hover:text-blue-600 transition-colors">
                {relGuide.title[lang] || relGuide.title.es}
              </h4>
              <p className="text-[11px] text-slate-500 line-clamp-2">
                {relGuide.summary[lang] || relGuide.summary.es}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Back to Guides Button */}
      <div className="pt-4 flex items-center justify-between">
        <button
          onClick={() => onNavigate('/guides')}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{lang === 'es' ? 'Volver a todas las guías' : 'Back to all guides'}</span>
        </button>

        <button
          onClick={() => {
            if (navigator.share) {
              navigator.share({ title: guideTitle, url: window.location.href });
            } else {
              navigator.clipboard.writeText(window.location.href);
              alert(lang === 'es' ? 'Enlace copiado al portapapeles' : 'Link copied to clipboard');
            }
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <Share2 className="w-4 h-4" />
          <span>{lang === 'es' ? 'Compartir' : 'Share'}</span>
        </button>
      </div>

      <div className="pt-6">
        <BannerAd slotId="guide-bottom-ad" />
      </div>
    </article>
  );
};
