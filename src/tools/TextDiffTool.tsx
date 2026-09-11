import React, { useState, useMemo } from 'react';
import { Language } from '../types';
import { getTranslation } from '../i18n';
import { ShieldCheck, ArrowRightLeft, Sparkles, Check, Copy } from 'lucide-react';

interface TextDiffToolProps {
  lang: Language;
}

export const TextDiffTool: React.FC<TextDiffToolProps> = ({ lang }) => {
  const [original, setOriginal] = useState(
    'ToolBox World es una plataforma moderna.\nOfrece más de 20 herramientas en línea.\nEl procesamiento se realiza en tu navegador.\nEs rápido y seguro.'
  );
  const [modified, setModified] = useState(
    'ToolBox World es una plataforma moderna y global.\nOfrece más de 20 herramientas gratuitas en línea.\nEl procesamiento se realiza en tu navegador.\nEs ultra rápido y 100% privado.'
  );

  const diffResult = useMemo(() => {
    const origLines = original.split('\n');
    const modLines = modified.split('\n');
    const max = Math.max(origLines.length, modLines.length);

    const lines: {
      num: number;
      orig: string | null;
      mod: string | null;
      type: 'same' | 'changed' | 'added' | 'removed';
    }[] = [];

    let diffCount = 0;

    for (let i = 0; i < max; i++) {
      const o = origLines[i] ?? null;
      const m = modLines[i] ?? null;

      if (o === m) {
        lines.push({ num: i + 1, orig: o, mod: m, type: 'same' });
      } else if (o === null) {
        diffCount++;
        lines.push({ num: i + 1, orig: null, mod: m, type: 'added' });
      } else if (m === null) {
        diffCount++;
        lines.push({ num: i + 1, orig: o, mod: null, type: 'removed' });
      } else {
        diffCount++;
        lines.push({ num: i + 1, orig: o, mod: m, type: 'changed' });
      }
    }

    return { lines, diffCount };
  }, [original, modified]);

  return (
    <div className="p-6 sm:p-10">
      <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          <ShieldCheck className="w-4 h-4" />
          <span>{lang === 'es' ? 'Comparación instantánea línea a línea' : 'Instant side-by-side line diff'}</span>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
          {diffResult.diffCount} {lang === 'es' ? 'diferencias detectadas' : 'differences found'}
        </span>
      </div>

      {/* Two Input Editors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            {lang === 'es' ? 'Texto Original (Versión 1):' : 'Original Text (Version 1):'}
          </label>
          <textarea
            rows={7}
            value={original}
            onChange={(e) => setOriginal(e.target.value)}
            className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 font-mono text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            {lang === 'es' ? 'Texto Modificado (Versión 2):' : 'Modified Text (Version 2):'}
          </label>
          <textarea
            rows={7}
            value={modified}
            onChange={(e) => setModified(e.target.value)}
            className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 font-mono text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Visual Diff View */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
        <div className="p-3 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-bold">
          <span className="text-slate-600 dark:text-slate-300">
            {lang === 'es' ? 'Resultado visual de cambios:' : 'Visual Diff Output:'}
          </span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-emerald-600">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              {lang === 'es' ? 'Modificado/Añadido' : 'Added'}
            </span>
            <span className="flex items-center gap-1 text-rose-600">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              {lang === 'es' ? 'Original/Eliminado' : 'Removed'}
            </span>
          </div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800/50 font-mono text-xs overflow-x-auto">
          {diffResult.lines.map((line) => {
            if (line.type === 'same') {
              return (
                <div key={line.num} className="flex items-start px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                  <span className="w-8 shrink-0 text-slate-400 select-none text-right pr-3 font-semibold">{line.num}</span>
                  <span className="text-slate-400 select-none px-2"> </span>
                  <span className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{line.mod}</span>
                </div>
              );
            }

            if (line.type === 'changed') {
              return (
                <div key={line.num} className="space-y-0.5">
                  <div className="flex items-start px-3 py-1.5 bg-rose-50/70 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200">
                    <span className="w-8 shrink-0 text-rose-400 select-none text-right pr-3 font-semibold">{line.num}</span>
                    <span className="text-rose-500 select-none px-2 font-bold">-</span>
                    <span className="whitespace-pre-wrap">{line.orig}</span>
                  </div>
                  <div className="flex items-start px-3 py-1.5 bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200">
                    <span className="w-8 shrink-0 text-emerald-400 select-none text-right pr-3 font-semibold">{line.num}</span>
                    <span className="text-emerald-500 select-none px-2 font-bold">+</span>
                    <span className="whitespace-pre-wrap">{line.mod}</span>
                  </div>
                </div>
              );
            }

            if (line.type === 'added') {
              return (
                <div key={line.num} className="flex items-start px-3 py-1.5 bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200">
                  <span className="w-8 shrink-0 text-emerald-400 select-none text-right pr-3 font-semibold">{line.num}</span>
                  <span className="text-emerald-500 select-none px-2 font-bold">+</span>
                  <span className="whitespace-pre-wrap">{line.mod}</span>
                </div>
              );
            }

            return (
              <div key={line.num} className="flex items-start px-3 py-1.5 bg-rose-50/70 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200">
                <span className="w-8 shrink-0 text-rose-400 select-none text-right pr-3 font-semibold">{line.num}</span>
                <span className="text-rose-500 select-none px-2 font-bold">-</span>
                <span className="whitespace-pre-wrap">{line.orig}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
