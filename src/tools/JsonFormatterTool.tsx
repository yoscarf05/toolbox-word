import React, { useState } from 'react';
import { Language } from '../types';
import { getTranslation } from '../i18n';
import { 
  Code2, 
  Copy, 
  Check, 
  Trash2, 
  CheckCircle, 
  AlertCircle, 
  ShieldCheck, 
  Minimize2, 
  Maximize2 
} from 'lucide-react';

interface JsonFormatterToolProps {
  lang: Language;
}

const SAMPLE_JSON = `{
  "platform": "ToolBox World",
  "version": 1.0,
  "privacy": "100% Client-Side",
  "toolsCount": 20,
  "features": ["PDF", "Images", "QR", "Text", "Dev"],
  "settings": {
    "theme": "system",
    "languages": ["es", "en", "pt", "fr", "de", "it"]
  }
}`;

export const JsonFormatterTool: React.FC<JsonFormatterToolProps> = ({ lang }) => {
  const [input, setInput] = useState<string>(SAMPLE_JSON);
  const [indent, setIndent] = useState<number>(2);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const formatJson = (spaces: number = indent) => {
    try {
      setError(null);
      if (!input.trim()) return;
      const parsed = JSON.parse(input);
      const formatted = JSON.stringify(parsed, null, spaces);
      setInput(formatted);
      setSuccess(lang === 'es' ? 'JSON válido y formateado.' : 'Valid and formatted JSON.');
      setTimeout(() => setSuccess(null), 2500);
    } catch (e: any) {
      setError(e.message || (lang === 'es' ? 'Sintaxis JSON inválida.' : 'Invalid JSON syntax.'));
    }
  };

  const minifyJson = () => {
    try {
      setError(null);
      if (!input.trim()) return;
      const parsed = JSON.parse(input);
      const minified = JSON.stringify(parsed);
      setInput(minified);
      setSuccess(lang === 'es' ? 'JSON minificado con éxito.' : 'JSON minified successfully.');
      setTimeout(() => setSuccess(null), 2500);
    } catch (e: any) {
      setError(e.message || (lang === 'es' ? 'Sintaxis JSON inválida.' : 'Invalid JSON syntax.'));
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(input);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 sm:p-10">
      <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          <ShieldCheck className="w-4 h-4" />
          <span>{lang === 'es' ? 'Validación y formateo local sin telemetría' : 'Local validation & formatting without telemetry'}</span>
        </div>
        <span className="text-xs text-slate-400">JSON Parser v1</span>
      </div>

      {error && (
        <div className="mb-4 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-mono flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2.5">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Editor & Actions Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 mb-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => formatJson(2)}
            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>{lang === 'es' ? 'Embellecer (2 espacios)' : 'Prettify (2 spaces)'}</span>
          </button>
          <button
            onClick={() => formatJson(4)}
            className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 text-xs font-bold transition-colors"
          >
            <span>{lang === 'es' ? '4 espacios' : '4 spaces'}</span>
          </button>
          <button
            onClick={minifyJson}
            className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Minimize2 className="w-3.5 h-3.5" />
            <span>{lang === 'es' ? 'Minificar' : 'Minify'}</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            disabled={!input}
            className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 hover:bg-blue-100 text-xs font-semibold flex items-center gap-1.5"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copiado' : 'Copiar'}</span>
          </button>
          <button
            onClick={() => setInput('')}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 transition-colors"
            title="Borrar todo"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <textarea
        rows={14}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Pega tu código JSON aquí..."
        className="w-full p-4 rounded-2xl bg-slate-900 text-slate-100 font-mono text-xs sm:text-sm border border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
        spellCheck={false}
      />
    </div>
  );
};
