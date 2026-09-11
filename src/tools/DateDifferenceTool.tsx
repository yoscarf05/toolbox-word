import React, { useState, useMemo } from 'react';
import { Language } from '../types';
import { getTranslation } from '../i18n';
import { Calendar, ShieldCheck, Clock, CheckCircle } from 'lucide-react';

interface DateDifferenceToolProps {
  lang: Language;
}

export const DateDifferenceTool: React.FC<DateDifferenceToolProps> = ({ lang }) => {
  const today = new Date().toISOString().split('T')[0];
  const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(nextMonth);
  const [includeEndDay, setIncludeEndDay] = useState(true);

  const diff = useMemo(() => {
    if (!startDate || !endDate) return null;

    const d1 = new Date(startDate);
    const d2 = new Date(endDate);

    const timeDiff = d2.getTime() - d1.getTime();
    let totalDays = Math.round(timeDiff / (1000 * 60 * 60 * 24));

    if (includeEndDay && totalDays >= 0) {
      totalDays += 1;
    }

    const absDays = Math.abs(totalDays);
    const weeks = Math.floor(absDays / 7);
    const remainingDays = absDays % 7;
    const months = (absDays / 30.4375).toFixed(1);
    const hours = absDays * 24;
    const minutes = hours * 60;

    // Calculate working / business days (Mon-Fri)
    let businessDays = 0;
    const cur = new Date(d1 < d2 ? d1 : d2);
    const end = new Date(d1 < d2 ? d2 : d1);

    while (cur <= end) {
      const dayOfWeek = cur.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        businessDays++;
      }
      cur.setDate(cur.getDate() + 1);
    }

    return {
      totalDays,
      weeks,
      remainingDays,
      months,
      hours,
      minutes,
      businessDays,
      isPast: timeDiff < 0
    };
  }, [startDate, endDate, includeEndDay]);

  return (
    <div className="p-6 sm:p-10">
      <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          <ShieldCheck className="w-4 h-4" />
          <span>{lang === 'es' ? 'Cálculo de calendario exacto' : 'Exact calendar difference calculation'}</span>
        </div>
        <span className="text-xs text-slate-400">Días, Semanas y Días Hábiles</span>
      </div>

      {/* Date Pickers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
            {lang === 'es' ? 'Fecha de inicio:' : 'Start Date:'}
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
            {lang === 'es' ? 'Fecha de fin:' : 'End Date:'}
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white"
          />
        </div>
      </div>

      <div className="mb-6">
        <label className="inline-flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={includeEndDay}
            onChange={(e) => setIncludeEndDay(e.target.checked)}
            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
          />
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
            {lang === 'es' ? 'Incluir el día final en el cómputo total (+1 día)' : 'Include end day in count (+1 day)'}
          </span>
        </label>
      </div>

      {diff && (
        <div className="space-y-4">
          <div className="p-6 rounded-3xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 block mb-1">
              {lang === 'es' ? 'Total de días transcurridos' : 'Total Days Difference'}
            </span>
            <span className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white font-mono">
              {diff.totalDays.toLocaleString()} {lang === 'es' ? 'días' : 'days'}
            </span>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              {diff.weeks} {lang === 'es' ? 'semanas' : 'weeks'} {diff.remainingDays > 0 && `y ${diff.remainingDays} días`}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-center">
              <span className="text-xs text-slate-500 font-semibold block">{lang === 'es' ? 'Días hábiles / laborables' : 'Business Days'}</span>
              <span className="text-xl font-bold text-slate-900 dark:text-white font-mono mt-1 block">
                {diff.businessDays}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-center">
              <span className="text-xs text-slate-500 font-semibold block">{lang === 'es' ? 'Meses aprox.' : 'Approx. Months'}</span>
              <span className="text-xl font-bold text-slate-900 dark:text-white font-mono mt-1 block">
                {diff.months}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-center">
              <span className="text-xs text-slate-500 font-semibold block">{lang === 'es' ? 'Horas' : 'Total Hours'}</span>
              <span className="text-xl font-bold text-slate-900 dark:text-white font-mono mt-1 block">
                {diff.hours.toLocaleString()}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-center">
              <span className="text-xs text-slate-500 font-semibold block">{lang === 'es' ? 'Minutos' : 'Total Minutes'}</span>
              <span className="text-xl font-bold text-slate-900 dark:text-white font-mono mt-1 block">
                {diff.minutes.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
