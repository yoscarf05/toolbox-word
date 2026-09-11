import React from 'react';

interface ToolVisualIllustrationProps {
  slug: string;
  className?: string;
  size?: 'card' | 'hero' | 'compact';
}

export const ToolVisualIllustration: React.FC<ToolVisualIllustrationProps> = ({
  slug,
  className = '',
  size = 'card'
}) => {
  const isHero = size === 'hero';
  const isCompact = size === 'compact';
  
  const heightClass = isHero ? 'h-36 sm:h-44' : isCompact ? 'h-16' : 'h-28 sm:h-32';

  // Render dedicated vector illustration based on tool slug
  const renderArt = () => {
    switch (slug) {
      case 'pdf-to-word':
        return (
          <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-gradient-to-br from-red-500/10 via-slate-50 to-blue-600/10 dark:from-red-950/30 dark:via-slate-900 dark:to-blue-950/30 rounded-xl p-3">
            {/* Background geometric accents */}
            <div className="absolute -top-6 -left-6 w-20 h-20 rounded-full bg-red-400/10 blur-xl pointer-events-none" />
            <div className="absolute -bottom-6 -right-6 w-20 h-20 rounded-full bg-blue-500/10 blur-xl pointer-events-none" />
            
            {/* Left Card: PDF */}
            <div className="relative z-10 flex flex-col items-center bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-red-200 dark:border-red-900/50 p-2.5 w-20 transform -rotate-3 transition-transform group-hover:rotate-0">
              <div className="w-full flex items-center justify-between mb-1.5">
                <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-red-600 text-white tracking-wider">PDF</span>
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              </div>
              <div className="w-full space-y-1 my-1">
                <div className="h-1 bg-red-100 dark:bg-red-950 rounded w-full" />
                <div className="h-1 bg-red-100 dark:bg-red-950 rounded w-4/5" />
                <div className="h-1 bg-red-100 dark:bg-red-950 rounded w-3/4" />
              </div>
              <span className="text-[8px] font-semibold text-red-700 dark:text-red-400 mt-1">.pdf estático</span>
            </div>

            {/* Transform Arrow */}
            <div className="relative z-20 mx-2 flex flex-col items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-red-500 to-blue-600 flex items-center justify-center text-white shadow-md transform group-hover:scale-110 transition-transform">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </div>
              <span className="text-[9px] font-extrabold text-blue-600 dark:text-blue-400 mt-1 tracking-tight">100% editable</span>
            </div>

            {/* Right Card: Word DOCX */}
            <div className="relative z-10 flex flex-col items-center bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-blue-200 dark:border-blue-900/50 p-2.5 w-20 transform rotate-3 transition-transform group-hover:rotate-0">
              <div className="w-full flex items-center justify-between mb-1.5">
                <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-blue-600 text-white tracking-wider">DOCX</span>
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              </div>
              <div className="w-full space-y-1 my-1">
                <div className="h-1 bg-blue-100 dark:bg-blue-950 rounded w-full" />
                <div className="h-1 bg-blue-100 dark:bg-blue-950 rounded w-5/6" />
                <div className="h-1 bg-blue-100 dark:bg-blue-950 rounded w-2/3" />
              </div>
              <span className="text-[8px] font-semibold text-blue-700 dark:text-blue-400 mt-1">Word nativo</span>
            </div>
          </div>
        );

      case 'citation-generator':
        return (
          <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-500/10 via-slate-50 to-purple-600/10 dark:from-indigo-950/30 dark:via-slate-900 dark:to-purple-950/30 rounded-xl p-3">
            <div className="relative z-10 flex items-center gap-3">
              {/* Academic Book */}
              <div className="w-16 h-20 bg-indigo-700 dark:bg-indigo-800 rounded-r-lg rounded-l-xs p-2 shadow-md flex flex-col justify-between border-l-4 border-indigo-900 text-white transform -rotate-6 group-hover:rotate-0 transition-transform">
                <div className="space-y-0.5">
                  <div className="w-4 h-0.5 bg-indigo-300 rounded" />
                  <div className="text-[8px] font-bold tracking-tight">APA / MLA</div>
                </div>
                <div className="text-center font-serif text-lg leading-none font-bold text-indigo-200">“ ”</div>
                <div className="w-full h-0.5 bg-indigo-400/50 rounded" />
              </div>

              {/* Bibliographic Reference Card */}
              <div className="w-32 bg-white dark:bg-slate-800 rounded-lg p-2.5 shadow-sm border border-indigo-100 dark:border-indigo-900/50 space-y-1.5 transform rotate-2 group-hover:rotate-0 transition-transform">
                <div className="flex items-center justify-between">
                  <span className="text-[8px] font-bold uppercase text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded">
                    Referencia
                  </span>
                  <span className="text-[8px] font-semibold text-slate-400">7.ª ed.</span>
                </div>
                <p className="text-[9px] text-slate-700 dark:text-slate-200 font-serif leading-tight">
                  García, G. (2024). <span className="italic">Ciencia Digital</span>.
                </p>
                <div className="flex items-center gap-1 text-[8px] text-emerald-600 dark:text-emerald-400 font-bold">
                  <span>✓ Cita en texto</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'compress-pdf':
        return (
          <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-gradient-to-br from-amber-500/10 via-slate-50 to-red-500/10 dark:from-amber-950/30 dark:via-slate-900 dark:to-red-950/30 rounded-xl p-3">
            <div className="relative flex items-center justify-center">
              {/* Hydraulic Compression Vise */}
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-24 h-1.5 bg-amber-500 dark:bg-amber-600 rounded flex items-center justify-center text-white">
                  <span className="text-[8px] transform -translate-y-2 font-bold text-amber-600 dark:text-amber-400">▼ COMPRESIÓN ▼</span>
                </div>

                <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-900/40 rounded-lg p-2 shadow-xs">
                  <div className="text-center px-1">
                    <span className="text-[9px] block text-slate-400 line-through">12.4 MB</span>
                    <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">2.1 MB</span>
                  </div>
                  <div className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-extrabold text-[10px]">
                    -83%
                  </div>
                </div>

                <div className="w-24 h-1.5 bg-amber-500 dark:bg-amber-600 rounded" />
              </div>
            </div>
          </div>
        );

      case 'merge-pdf':
        return (
          <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-gradient-to-br from-purple-500/10 via-slate-50 to-pink-500/10 dark:from-purple-950/30 dark:via-slate-900 dark:to-pink-950/30 rounded-xl p-3">
            <div className="relative flex items-center justify-center">
              {/* 3 Layered PDF Pages converging */}
              <div className="relative w-36 h-20">
                <div className="absolute left-2 top-0 w-16 h-18 bg-purple-100 dark:bg-purple-950 border border-purple-300 dark:border-purple-800 rounded-md p-1.5 shadow-xs transform -rotate-6">
                  <span className="text-[8px] font-bold text-purple-700 dark:text-purple-300">Doc 1</span>
                </div>
                <div className="absolute left-10 top-1 w-16 h-18 bg-pink-100 dark:bg-pink-950 border border-pink-300 dark:border-pink-800 rounded-md p-1.5 shadow-xs transform rotate-3">
                  <span className="text-[8px] font-bold text-pink-700 dark:text-pink-300">Doc 2</span>
                </div>
                <div className="absolute right-1 top-2 w-16 h-18 bg-white dark:bg-slate-800 border-2 border-purple-600 dark:border-purple-400 rounded-md p-1.5 shadow-md flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] font-extrabold text-purple-600">UNIDO</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  </div>
                  <span className="text-[7px] text-slate-500 dark:text-slate-400">PDF Final</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'split-pdf':
        return (
          <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-gradient-to-br from-rose-500/10 via-slate-50 to-orange-500/10 dark:from-rose-950/30 dark:via-slate-900 dark:to-orange-950/30 rounded-xl p-3">
            <div className="flex items-center gap-3">
              <div className="w-14 h-18 bg-white dark:bg-slate-800 border-2 border-dashed border-rose-400 rounded-md p-1.5 flex flex-col justify-between">
                <span className="text-[8px] font-bold text-rose-600">Pág. 1-5</span>
                <div className="h-1 bg-rose-200 dark:bg-rose-900 rounded w-full" />
              </div>
              <div className="flex flex-col items-center text-rose-500 font-bold">
                <span className="text-sm">✂</span>
                <span className="text-[8px] uppercase tracking-wider">Dividir</span>
              </div>
              <div className="w-14 h-18 bg-white dark:bg-slate-800 border-2 border-dashed border-orange-400 rounded-md p-1.5 flex flex-col justify-between">
                <span className="text-[8px] font-bold text-orange-600">Pág. 6-12</span>
                <div className="h-1 bg-orange-200 dark:bg-orange-900 rounded w-full" />
              </div>
            </div>
          </div>
        );

      case 'qr-generator':
      case 'qr-wifi':
        return (
          <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-500/10 via-slate-50 to-teal-500/10 dark:from-emerald-950/30 dark:via-slate-900 dark:to-teal-950/30 rounded-xl p-3">
            <div className="relative flex items-center gap-3">
              {/* QR Code Matrix */}
              <div className="w-18 h-18 bg-white dark:bg-slate-800 rounded-lg p-1.5 shadow-sm border border-emerald-200 dark:border-emerald-800 grid grid-cols-5 gap-1">
                <div className="bg-emerald-700 dark:bg-emerald-400 rounded-xs" />
                <div className="bg-emerald-700 dark:bg-emerald-400 rounded-xs" />
                <div className="bg-emerald-100 dark:bg-emerald-950 rounded-xs" />
                <div className="bg-emerald-700 dark:bg-emerald-400 rounded-xs" />
                <div className="bg-emerald-700 dark:bg-emerald-400 rounded-xs" />
                <div className="bg-emerald-700 dark:bg-emerald-400 rounded-xs" />
                <div className="bg-emerald-100 dark:bg-emerald-950 rounded-xs" />
                <div className="bg-emerald-700 dark:bg-emerald-400 rounded-xs" />
                <div className="bg-emerald-100 dark:bg-emerald-950 rounded-xs" />
                <div className="bg-emerald-700 dark:bg-emerald-400 rounded-xs" />
                <div className="bg-emerald-100 dark:bg-emerald-950 rounded-xs" />
                <div className="bg-emerald-700 dark:bg-emerald-400 rounded-xs" />
                <div className="bg-emerald-700 dark:bg-emerald-400 rounded-xs" />
                <div className="bg-emerald-100 dark:bg-emerald-950 rounded-xs" />
                <div className="bg-emerald-100 dark:bg-emerald-950 rounded-xs" />
                <div className="bg-emerald-700 dark:bg-emerald-400 rounded-xs" />
                <div className="bg-emerald-700 dark:bg-emerald-400 rounded-xs" />
                <div className="bg-emerald-100 dark:bg-emerald-950 rounded-xs" />
                <div className="bg-emerald-700 dark:bg-emerald-400 rounded-xs" />
                <div className="bg-emerald-700 dark:bg-emerald-400 rounded-xs" />
                <div className="bg-emerald-700 dark:bg-emerald-400 rounded-xs" />
                <div className="bg-emerald-100 dark:bg-emerald-950 rounded-xs" />
                <div className="bg-emerald-700 dark:bg-emerald-400 rounded-xs" />
                <div className="bg-emerald-700 dark:bg-emerald-400 rounded-xs" />
                <div className="bg-emerald-700 dark:bg-emerald-400 rounded-xs" />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 block">
                  {slug === 'qr-wifi' ? 'Wi-Fi Directo' : 'QR Vectorial'}
                </span>
                <span className="text-[8px] text-slate-500 dark:text-slate-400 block">Alta resolución</span>
                <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  PNG / SVG
                </span>
              </div>
            </div>
          </div>
        );

      case 'password-generator':
        return (
          <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-gradient-to-br from-cyan-500/10 via-slate-50 to-blue-600/10 dark:from-cyan-950/30 dark:via-slate-900 dark:to-blue-950/30 rounded-xl p-3">
            <div className="relative flex items-center gap-3">
              <div className="w-12 h-14 bg-gradient-to-tr from-cyan-600 to-blue-600 rounded-xl shadow-md flex items-center justify-center text-white">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div className="space-y-1">
                <div className="font-mono text-xs font-extrabold text-slate-800 dark:text-slate-200 tracking-wider">
                  K#9x$L!2mQ
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-1 bg-emerald-500 rounded" />
                  <div className="w-3 h-1 bg-emerald-500 rounded" />
                  <div className="w-3 h-1 bg-emerald-500 rounded" />
                  <div className="w-3 h-1 bg-emerald-500 rounded" />
                  <span className="text-[8px] font-bold text-emerald-600 dark:text-emerald-400 ml-1">Segura</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'word-counter':
        return (
          <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-500/10 via-slate-50 to-indigo-500/10 dark:from-blue-950/30 dark:via-slate-900 dark:to-indigo-950/30 rounded-xl p-3">
            <div className="w-full max-w-[200px] bg-white dark:bg-slate-800 rounded-lg p-2.5 shadow-xs border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[9px] text-slate-400 uppercase font-bold block">Conteo Real</span>
                <span className="text-base font-extrabold text-blue-600 dark:text-blue-400">1,420</span>
                <span className="text-[8px] text-slate-500 block">palabras</span>
              </div>
              <div className="border-l border-slate-200 dark:border-slate-700 pl-3 space-y-1">
                <span className="text-[9px] text-slate-400 uppercase font-bold block">Lectura</span>
                <span className="text-base font-extrabold text-indigo-600 dark:text-indigo-400">5.5</span>
                <span className="text-[8px] text-slate-500 block">minutos</span>
              </div>
            </div>
          </div>
        );

      case 'compress-image':
      case 'resize-image':
      case 'jpg-to-webp':
      case 'png-to-webp':
      case 'pdf-to-jpg':
      case 'jpg-to-pdf':
        return (
          <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-500/10 via-slate-50 to-sky-500/10 dark:from-emerald-950/30 dark:via-slate-900 dark:to-sky-950/30 rounded-xl p-3">
            <div className="flex items-center gap-3">
              <div className="w-14 h-16 bg-white dark:bg-slate-800 rounded-lg border border-sky-200 dark:border-sky-800 p-1.5 flex flex-col justify-between shadow-xs">
                <div className="w-full h-7 bg-sky-100 dark:bg-sky-950 rounded flex items-center justify-center text-sky-600">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-[8px] font-bold text-slate-600 dark:text-slate-300 text-center">
                  {slug.includes('webp') ? 'WebP ultra' : slug.includes('resize') ? 'Escalado HD' : 'Optimizado'}
                </span>
              </div>
              <div className="text-sky-600 dark:text-sky-400 font-bold text-sm">➔</div>
              <div className="px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 rounded-lg text-center">
                <span className="text-[9px] font-extrabold text-emerald-600 dark:text-emerald-400 block">100% Nitidez</span>
                <span className="text-[7px] text-slate-400 block">Procesamiento local</span>
              </div>
            </div>
          </div>
        );

      case 'json-formatter':
      case 'base64-converter':
      case 'url-encoder':
      case 'text-diff':
        return (
          <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-100 via-slate-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-950 rounded-xl p-3 font-mono">
            <div className="w-full max-w-[210px] bg-slate-900 text-emerald-400 rounded-lg p-2.5 text-[9px] shadow-sm border border-slate-700 space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-[8px] border-b border-slate-800 pb-1">
                <span>terminal://dev</span>
                <span className="text-emerald-400">✓ OK</span>
              </div>
              <div className="text-slate-300">
                {slug === 'json-formatter' && '{\n  "status": 200,\n  "clean": true\n}'}
                {slug === 'base64-converter' && 'aGVsbG8gd29ybGQ= ➔ text'}
                {slug === 'url-encoder' && 'https://site.com/?q=%20test'}
                {slug === 'text-diff' && '+ Added line\n- Removed line'}
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-500/10 via-slate-50 to-indigo-500/10 dark:from-blue-950/30 dark:via-slate-900 dark:to-indigo-950/30 rounded-xl p-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Utilidad Digital</span>
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold block">Nativo & Privado</span>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className={`w-full ${heightClass} ${className} select-none transition-transform`}>
      {renderArt()}
    </div>
  );
};
