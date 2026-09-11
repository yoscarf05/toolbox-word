import React, { useState, useMemo } from 'react';
import { Language } from '../types';
import { getTranslation } from '../i18n';
import { 
  Link2, 
  Copy, 
  Check, 
  Trash2, 
  ShieldCheck, 
  ArrowRightLeft, 
  ListFilter 
} from 'lucide-react';

interface UrlEncoderToolProps {
  lang: Language;
}

export const UrlEncoderTool: React.FC<UrlEncoderToolProps> = ({ lang }) => {
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const [inputUrl, setInputUrl] = useState('https://toolbox.world/search?q=herramientas gratis&category=pdf&lang=es');
  const [copied, setCopied] = useState(false);

  const output = useMemo(() => {
    if (!inputUrl) return '';
    try {
      if (mode === 'encode') {
        return encodeURIComponent(inputUrl);
      } else {
        return decodeURIComponent(inputUrl);
      }
    } catch (e) {
      return lang === 'es' ? 'Error al procesar la URL.' : 'URL processing error.';
    }
  }, [inputUrl, mode, lang]);

  // Parse query parameters for visual table
  const queryParams = useMemo(() => {
    try {
      let rawToParse = inputUrl;
      if (mode === 'decode') {
        rawToParse = decodeURIComponent(inputUrl);
      }
      const qIndex = rawToParse.indexOf('?');
      if (qIndex === -1) return [];

      const queryString = rawToParse.substring(qIndex + 1);
      const params = new URLSearchParams(queryString);
      const list: { key: string; value: string }[] = [];
      params.forEach((value, key) => {
        list.push({ key, value });
      });
      return list;
    } catch {
      return [];
    }
  }, [inputUrl, mode]);

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 sm:p-10">
      <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          <ShieldCheck className="w-4 h-4" />
          <span>{lang === 'es' ? 'Codificación y decodificación RFC 3986 en tu navegador' : 'In-browser RFC 3986 encoding & decoding'}</span>
        </div>
        <span className="text-xs text-slate-400">URI / Query Inspector</span>
      </div>

      {/* Mode tabs */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => setMode('encode')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            mode === 'encode'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
          }`}
        >
          {lang === 'es' ? 'Codificar (Encode URI Component)' : 'Encode URI Component'}
        </button>
        <button
          onClick={() => setMode('decode')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            mode === 'decode'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
          }`}
        >
          {lang === 'es' ? 'Decodificar (Decode URI)' : 'Decode URI'}
        </button>
      </div>

      {/* Panes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            {mode === 'encode' ? 'URL o texto a codificar:' : 'URL codificada a decodificar:'}
          </label>
          <textarea
            rows={5}
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 font-mono text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {lang === 'es' ? 'Resultado:' : 'Output:'}
            </label>
            <button
              onClick={handleCopy}
              disabled={!output}
              className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 text-xs font-semibold flex items-center gap-1 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiado' : 'Copiar'}</span>
            </button>
          </div>
          <textarea
            rows={5}
            readOnly
            value={output}
            className="w-full p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-xs sm:text-sm text-slate-900 dark:text-white select-all"
          />
        </div>
      </div>

      {/* Query parameters table if any detected */}
      {queryParams.length > 0 && (
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 mb-3">
            <ListFilter className="w-4 h-4 text-blue-600" />
            <span>{lang === 'es' ? 'Parámetros Query identificados en la URL:' : 'Detected URL Query Parameters:'}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-400">
                  <th className="py-2 px-3">{lang === 'es' ? 'Clave (Key)' : 'Key'}</th>
                  <th className="py-2 px-3">{lang === 'es' ? 'Valor (Value)' : 'Value'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800">
                {queryParams.map((p, idx) => (
                  <tr key={idx} className="hover:bg-white dark:hover:bg-slate-800/60">
                    <td className="py-2 px-3 font-bold text-blue-600 dark:text-blue-400">{p.key}</td>
                    <td className="py-2 px-3 text-slate-700 dark:text-slate-300 break-all">{p.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
