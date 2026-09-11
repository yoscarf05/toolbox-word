import React, { useState } from 'react';
import { Language } from '../types';
import { getTranslation } from '../i18n';
import { 
  Binary, 
  Copy, 
  Check, 
  Trash2, 
  UploadCloud, 
  ShieldCheck, 
  ArrowRightLeft, 
  Download 
} from 'lucide-react';

interface Base64ConverterToolProps {
  lang: Language;
}

export const Base64ConverterTool: React.FC<Base64ConverterToolProps> = ({ lang }) => {
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const [inputText, setInputText] = useState('ToolBox World: Herramientas 100% privadas.');
  const [outputText, setOutputText] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper for UTF-8 Base64 encode
  const utf8ToBase64 = (str: string) => {
    return window.btoa(
      encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) => {
        return String.fromCharCode(parseInt(p1, 16));
      })
    );
  };

  // Helper for UTF-8 Base64 decode
  const base64ToUtf8 = (str: string) => {
    return decodeURIComponent(
      Array.prototype.map
        .call(window.atob(str), (c: string) => {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join('')
    );
  };

  const handleConvert = (text: string, currentMode: 'encode' | 'decode') => {
    setInputText(text);
    setError(null);
    if (!text) {
      setOutputText('');
      return;
    }

    try {
      if (currentMode === 'encode') {
        setOutputText(utf8ToBase64(text));
      } else {
        setOutputText(base64ToUtf8(text.trim()));
      }
    } catch (e: any) {
      setError(lang === 'es' ? 'Cadena Base64 no válida o corrupta.' : 'Invalid Base64 string.');
      setOutputText('');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const res = reader.result as string;
      setInputText(`Archivo cargado: ${file.name}`);
      setOutputText(res);
      setMode('encode');
    };
    reader.readAsDataURL(file);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(outputText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 sm:p-10">
      <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          <ShieldCheck className="w-4 h-4" />
          <span>{lang === 'es' ? 'Conversión UTF-8 directa en tu navegador' : 'Direct client-side UTF-8 conversion'}</span>
        </div>
        <span className="text-xs text-slate-400">RFC 4648 Base64</span>
      </div>

      {/* Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setMode('encode');
              handleConvert(inputText, 'encode');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              mode === 'encode'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            {lang === 'es' ? 'Codificar (Texto a Base64)' : 'Encode (Text to Base64)'}
          </button>
          <button
            onClick={() => {
              setMode('decode');
              handleConvert(inputText, 'decode');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              mode === 'decode'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            {lang === 'es' ? 'Decodificar (Base64 a Texto)' : 'Decode (Base64 to Text)'}
          </button>
        </div>

        <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer">
          <UploadCloud className="w-3.5 h-3.5" />
          <span>{lang === 'es' ? 'Codificar archivo a Data URI' : 'Encode file to Data URI'}</span>
          <input type="file" onChange={handleFileUpload} className="hidden" />
        </label>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold">
          {error}
        </div>
      )}

      {/* Two Panes: Input and Output */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            {mode === 'encode' 
              ? (lang === 'es' ? 'Texto original:' : 'Plain text:') 
              : (lang === 'es' ? 'Código Base64:' : 'Base64 code:')}
          </label>
          <textarea
            rows={8}
            value={inputText}
            onChange={(e) => handleConvert(e.target.value, mode)}
            placeholder="Introduce los datos aquí..."
            className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 font-mono text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {mode === 'encode' 
                ? (lang === 'es' ? 'Resultado Base64:' : 'Base64 Output:') 
                : (lang === 'es' ? 'Texto Decodificado:' : 'Decoded Text:')}
            </label>
            <button
              onClick={handleCopy}
              disabled={!outputText}
              className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 hover:bg-blue-100 text-xs font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-40"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiado' : 'Copiar'}</span>
            </button>
          </div>
          <textarea
            rows={8}
            readOnly
            value={outputText}
            placeholder="El resultado aparecerá aquí..."
            className="w-full p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-xs sm:text-sm text-slate-900 dark:text-white select-all"
          />
        </div>
      </div>
    </div>
  );
};
