import React, { useState, useEffect, useRef } from 'react';
import { Language, ToolDefinition } from '../types';
import { searchTools } from '../data/tools';
import { Search, X, ArrowRight, ShieldCheck } from 'lucide-react';
import { DynamicIcon } from './DynamicIcon';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  onSelectTool: (slug: string) => void;
  initialQuery?: string;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  lang,
  onSelectTool,
  initialQuery = ''
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<ToolDefinition[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery(initialQuery);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, initialQuery]);

  useEffect(() => {
    setResults(searchTools(query, lang));
  }, [query, lang]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else onClose(); // parent handles toggle
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header */}
        <div className="flex items-center px-4 sm:px-6 py-3.5 border-b border-slate-200 dark:border-slate-800">
          <Search className="w-5 h-5 text-slate-400 mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              lang === 'es' 
                ? '¿Qué quieres hacer? (ej. comprimir pdf, foto, wifi, qr, contar palabras...)'
                : 'What do you want to do? (e.g. compress pdf, image, wifi, qr, word counter...)'
            }
            className="w-full bg-transparent text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none text-base"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded mr-2"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="text-[11px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
            ESC
          </kbd>
        </div>

        {/* Popular / Quick Suggestions when query is empty */}
        {query.trim() === '' && (
          <div className="p-4 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/30">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              {lang === 'es' ? 'Búsquedas populares:' : 'Popular searches:'}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {['PDF a Word', 'Citas APA / Referencias', 'Comprimir PDF', 'Unir PDF', 'JPG a WebP', 'Generar QR', 'Contador de Palabras', 'JSON'].map((term) => (
                <button
                  key={term}
                  onClick={() => setQuery(term)}
                  className="px-2.5 py-1 text-xs rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-500 transition-colors"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results List */}
        <div className="overflow-y-auto p-3 space-y-1.5 flex-1">
          {results.length > 0 ? (
            results.map((tool) => (
              <button
                key={tool.id}
                onClick={() => {
                  onSelectTool(tool.slug);
                  onClose();
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-blue-50/70 dark:hover:bg-blue-950/40 text-left transition-colors group cursor-pointer border border-transparent hover:border-blue-200 dark:hover:border-blue-900/50"
              >
                <div className="flex items-center gap-3.5">
                  <div className="p-2.5 rounded-xl bg-blue-100/70 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 shrink-0 group-hover:scale-105 transition-transform">
                    <DynamicIcon name={tool.icon} className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        {tool.name[lang] || tool.name.es}
                      </h4>
                      {tool.processLocally && (
                        <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/40">
                          <ShieldCheck className="w-3 h-3" />
                          {lang === 'es' ? 'Local' : 'Device'}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                      {tool.shortDescription[lang] || tool.shortDescription.es}
                    </p>
                  </div>
                </div>

                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transform group-hover:translate-x-1 transition-all shrink-0 ml-2" />
              </button>
            ))
          ) : (
            <div className="text-center py-12 text-slate-400">
              <p className="text-sm font-medium">
                {lang === 'es' ? 'No encontramos herramientas para esta búsqueda.' : 'No tools found for this query.'}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {lang === 'es' ? 'Prueba con términos como "pdf", "imagen", "qr" o "texto".' : 'Try terms like "pdf", "image", "qr" or "text".'}
              </p>
            </div>
          )}
        </div>

        {/* Footer Hint */}
        <div className="p-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
          <span>{results.length} {lang === 'es' ? 'herramientas disponibles' : 'tools available'}</span>
          <span>{lang === 'es' ? 'Presiona Enter para abrir' : 'Press Enter to open'}</span>
        </div>
      </div>
    </div>
  );
};
