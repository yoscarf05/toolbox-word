import React, { useState } from 'react';
import { Language, ToolDefinition } from '../types';
import { getTranslation } from '../i18n';
import { getToolBySlug } from '../data/tools';
import { TopAd, BottomAd } from './AdComponents';
import { 
  ShieldCheck, 
  ChevronDown, 
  ChevronRight, 
  ArrowLeft, 
  Share2, 
  Check, 
  HelpCircle, 
  Lightbulb, 
  Sparkles,
  ArrowRight,
  Lock
} from 'lucide-react';

interface ToolLayoutProps {
  tool: ToolDefinition;
  lang: Language;
  onNavigate: (route: string) => void;
  children: React.ReactNode;
}

export const ToolLayout: React.FC<ToolLayoutProps> = ({
  tool,
  lang,
  onNavigate,
  children
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const relatedTools = (tool.relatedToolIds || [])
    .map((id) => getToolBySlug(id))
    .filter(Boolean) as ToolDefinition[];

  return (
    <div className="min-h-screen py-6 sm:py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb & Navigation Bar */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <button
            onClick={() => onNavigate('#/')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{getTranslation(lang, 'backToHome')}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-xs cursor-pointer"
              title={getTranslation(lang, 'shareTool')}
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copiedLink ? getTranslation(lang, 'linkCopied') : getTranslation(lang, 'shareTool')}</span>
            </button>
          </div>
        </div>

        {/* Top Responsible Non-Intrusive Ad Slot */}
        <TopAd className="mb-8" />

        {/* Tool Header */}
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 text-xs font-semibold mb-3">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>
              {tool.processLocally 
                ? (lang === 'es' ? 'Procesamiento en tu dispositivo (100% Privado)' : 'Processed on your device (100% Private)')
                : (lang === 'es' ? 'Herramienta Online Segura' : 'Secure Online Utility')}
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-3">
            {tool.name[lang] || tool.name.es}
          </h1>

          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
            {tool.shortDescription[lang] || tool.shortDescription.es}
          </p>
        </div>

        {/* Main Interactive Tool Workspace */}
        <div 
          id="main-tool-workspace"
          className="bg-white dark:bg-slate-900/90 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden mb-12"
        >
          {children}
        </div>

        {/* Device-Only Privacy Guarantee Banner */}
        {tool.processLocally && (
          <div className="flex items-start sm:items-center gap-3.5 p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/40 text-emerald-900 dark:text-emerald-300 mb-14">
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div className="text-xs sm:text-sm leading-relaxed">
              <p className="font-bold">
                {lang === 'es' ? 'Garantía de privacidad absoluta' : 'Absolute Privacy Guarantee'}
              </p>
              <p className="text-emerald-800 dark:text-emerald-400 mt-0.5">
                {getTranslation(lang, 'localPrivacyNote')}
              </p>
            </div>
          </div>
        )}

        {/* Step-by-Step Instructions */}
        {tool.steps && tool.steps.length > 0 && (
          <section className="mb-14">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                {getTranslation(lang, 'howToUse')}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {tool.steps.map((s) => (
                <div 
                  key={s.step} 
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs"
                >
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-sm mb-3.5 shadow-sm">
                    {s.step}
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1.5">
                    {s.title[lang] || s.title.es}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {s.desc[lang] || s.desc.es}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Practical Example */}
        {tool.exampleUse && (
          <div className="p-6 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50 mb-14">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-blue-600 text-white shrink-0 mt-0.5">
                <Lightbulb className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
                  {getTranslation(lang, 'practicalExample')}
                </h3>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {tool.exampleUse[lang] || tool.exampleUse.es}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* In-Content Non-Intrusive Ad */}
        <BottomAd className="mb-14" />

        {/* Frequently Asked Questions */}
        {tool.faqs && tool.faqs.length > 0 && (
          <section className="mb-14">
            <div className="flex items-center gap-2 mb-6">
              <HelpCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                {getTranslation(lang, 'frequentlyAskedQuestions')}
              </h2>
            </div>

            <div className="space-y-3">
              {tool.faqs.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div
                    key={idx}
                    className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 overflow-hidden"
                  >
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="w-full flex items-center justify-between p-4 sm:p-5 text-left text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                    >
                      <span>{faq.question[lang] || faq.question.es}</span>
                      <ChevronDown
                        className={`w-5 h-5 text-slate-400 transition-transform duration-200 shrink-0 ml-3 ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-4 sm:px-5 pb-5 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-3">
                        {faq.answer[lang] || faq.answer.es}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Related Tools */}
        {relatedTools.length > 0 && (
          <section className="mb-10">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-4">
              {getTranslation(lang, 'relatedTools')}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {relatedTools.map((rel) => (
                <button
                  key={rel.id}
                  onClick={() => onNavigate(`#/tools/${rel.slug}`)}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 hover:shadow-md transition-all text-left group cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                      {rel.categoryId}
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    {rel.name[lang] || rel.name.es}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                    {rel.shortDescription[lang] || rel.shortDescription.es}
                  </p>
                </button>
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  );
};
