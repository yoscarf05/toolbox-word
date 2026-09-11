import React, { useState, useMemo } from 'react';
import { Language } from '../types';
import { getTranslation } from '../i18n';
import { 
  FileText, 
  Copy, 
  Check, 
  Trash2, 
  Clock, 
  Volume2, 
  AlignLeft, 
  ShieldCheck, 
  Sparkles 
} from 'lucide-react';

interface WordCounterToolProps {
  lang: Language;
}

export const WordCounterTool: React.FC<WordCounterToolProps> = ({ lang }) => {
  const [text, setText] = useState('');
  const [copied, setCopied] = useState(false);

  const stats = useMemo(() => {
    const raw = text;
    const trimmed = raw.trim();

    const words = trimmed ? trimmed.split(/\s+/).length : 0;
    const characters = raw.length;
    const charactersNoSpaces = raw.replace(/\s/g, '').length;
    const sentences = trimmed ? (raw.match(/[.!?]+(?:\s+|$)/g) || []).length || (words > 0 ? 1 : 0) : 0;
    const paragraphs = trimmed ? (raw.split(/\n+/).filter((p) => p.trim().length > 0).length) : 0;

    // Reading time (average 200 words per minute)
    const readingMinutes = words / 200;
    const readingTime = readingMinutes < 1 
      ? `${Math.max(1, Math.round(readingMinutes * 60))} s` 
      : `${Math.round(readingMinutes)} min`;

    // Speaking time (average 130 words per minute)
    const speakingMinutes = words / 130;
    const speakingTime = speakingMinutes < 1 
      ? `${Math.max(1, Math.round(speakingMinutes * 60))} s` 
      : `${Math.round(speakingMinutes)} min`;

    // Keyword density
    const wordList = trimmed.toLowerCase().match(/\b[a-záéíóúüñ]{3,}\b/g) || [];
    const freqMap: Record<string, number> = {};
    wordList.forEach((w) => {
      freqMap[w] = (freqMap[w] || 0) + 1;
    });

    const topKeywords = Object.entries(freqMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([keyword, count]) => ({
        keyword,
        count,
        percent: words > 0 ? ((count / words) * 100).toFixed(1) : '0'
      }));

    return {
      words,
      characters,
      charactersNoSpaces,
      sentences,
      paragraphs,
      readingTime,
      speakingTime,
      topKeywords
    };
  }, [text]);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toUppercase = () => setText(text.toUpperCase());
  const toLowercase = () => setText(text.toLowerCase());
  const toTitleCase = () => {
    setText(text.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()));
  };
  const cleanSpaces = () => {
    setText(text.replace(/[ \t]+/g, ' ').replace(/\n\s*\n/g, '\n\n').trim());
  };

  return (
    <div className="p-6 sm:p-10">
      <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          <ShieldCheck className="w-4 h-4" />
          <span>{lang === 'es' ? 'Análisis en tiempo real sin enviar tu texto a servidores' : 'Real-time analysis without sending text to any server'}</span>
        </div>
        <span className="text-xs text-slate-400 font-mono">{stats.words} {lang === 'es' ? 'palabras' : 'words'}</span>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50 text-center">
          <span className="text-2xl sm:text-3xl font-extrabold text-blue-600 dark:text-blue-400 block font-mono">
            {stats.words.toLocaleString()}
          </span>
          <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
            {lang === 'es' ? 'Palabras' : 'Words'}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-center">
          <span className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-slate-100 block font-mono">
            {stats.characters.toLocaleString()}
          </span>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {lang === 'es' ? 'Caracteres' : 'Characters'}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-center">
          <span className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-slate-100 block font-mono">
            {stats.charactersNoSpaces.toLocaleString()}
          </span>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {lang === 'es' ? 'Sin espacios' : 'No spaces'}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-center">
          <span className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-slate-100 block font-mono">
            {stats.paragraphs.toLocaleString()}
          </span>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {lang === 'es' ? 'Párrafos' : 'Paragraphs'}
          </span>
        </div>

        <div className="col-span-2 sm:col-span-1 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-center">
          <span className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-slate-100 block font-mono">
            {stats.sentences.toLocaleString()}
          </span>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {lang === 'es' ? 'Oraciones' : 'Sentences'}
          </span>
        </div>
      </div>

      {/* Main Textarea */}
      <div className="space-y-3 mb-6">
        <textarea
          rows={10}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={
            lang === 'es' 
              ? 'Pega o escribe tu texto aquí para contar palabras, caracteres y tiempos de lectura al instante...'
              : 'Paste or type your text here to count words, characters, and reading time in real time...'
          }
          className="w-full p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed text-sm sm:text-base font-sans"
        />

        {/* Quick Format Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={toUppercase}
              className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 text-xs font-semibold"
            >
              MAYÚSCULAS
            </button>
            <button
              onClick={toLowercase}
              className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 text-xs font-semibold"
            >
              minúsculas
            </button>
            <button
              onClick={toTitleCase}
              className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 text-xs font-semibold"
            >
              Capitalizar Palabras
            </button>
            <button
              onClick={cleanSpaces}
              className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 text-xs font-semibold"
            >
              Limpiar espacios extra
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              disabled={!text}
              className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 hover:bg-blue-100 text-xs font-semibold flex items-center gap-1.5 disabled:opacity-40"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiado' : 'Copiar'}</span>
            </button>
            <button
              onClick={() => setText('')}
              disabled={!text}
              className="px-3 py-1.5 rounded-lg hover:bg-rose-50 text-rose-600 text-xs font-semibold flex items-center gap-1.5 disabled:opacity-40"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{lang === 'es' ? 'Limpiar' : 'Clear'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Reading / Speaking times & Keyword analysis */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-around">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold">{lang === 'es' ? 'Tiempo de lectura' : 'Reading time'}</p>
              <p className="text-base font-bold text-slate-800 dark:text-slate-100 font-mono">{stats.readingTime}</p>
            </div>
          </div>

          <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold">{lang === 'es' ? 'Tiempo de locución' : 'Speaking time'}</p>
              <p className="text-base font-bold text-slate-800 dark:text-slate-100 font-mono">{stats.speakingTime}</p>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
          <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            {lang === 'es' ? 'Palabras más repetidas:' : 'Top keywords:'}
          </span>
          {stats.topKeywords.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {stats.topKeywords.map((k) => (
                <span
                  key={k.keyword}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300"
                >
                  <strong className="text-slate-900 dark:text-white font-bold">{k.keyword}</strong> ({k.count})
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">
              {lang === 'es' ? 'Escribe más texto para analizar frecuencia' : 'Type more text to see keyword density'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
