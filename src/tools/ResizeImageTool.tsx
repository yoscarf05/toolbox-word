import React, { useState } from 'react';
import { Language } from '../types';
import { getTranslation } from '../i18n';
import { 
  UploadCloud, 
  Download, 
  CheckCircle, 
  AlertCircle, 
  ShieldCheck, 
  Lock, 
  Unlock 
} from 'lucide-react';

interface ResizeImageToolProps {
  lang: Language;
}

export const ResizeImageTool: React.FC<ResizeImageToolProps> = ({ lang }) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [originalWidth, setOriginalWidth] = useState<number>(0);
  const [originalHeight, setOriginalHeight] = useState<number>(0);
  
  const [targetWidth, setTargetWidth] = useState<number>(1080);
  const [targetHeight, setTargetHeight] = useState<number>(1080);
  const [keepAspectRatio, setKeepAspectRatio] = useState<boolean>(true);

  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = (f: File) => {
    if (!f.type.startsWith('image/')) {
      setError(lang === 'es' ? 'Selecciona un archivo de imagen válido.' : 'Please select a valid image file.');
      return;
    }
    setError(null);
    setFile(f);
    const url = URL.createObjectURL(f);
    setPreviewUrl(url);

    const img = new Image();
    img.onload = () => {
      setOriginalWidth(img.naturalWidth);
      setOriginalHeight(img.naturalHeight);
      setTargetWidth(img.naturalWidth);
      setTargetHeight(img.naturalHeight);
    };
    img.src = url;
    setResultUrl(null);
  };

  const handleWidthChange = (w: number) => {
    setTargetWidth(w);
    if (keepAspectRatio && originalWidth > 0) {
      const ratio = originalHeight / originalWidth;
      setTargetHeight(Math.round(w * ratio));
    }
  };

  const handleHeightChange = (h: number) => {
    setTargetHeight(h);
    if (keepAspectRatio && originalHeight > 0) {
      const ratio = originalWidth / originalHeight;
      setTargetWidth(Math.round(h * ratio));
    }
  };

  const applyPreset = (w: number, h: number) => {
    setKeepAspectRatio(false);
    setTargetWidth(w);
    setTargetHeight(h);
  };

  const handleResize = () => {
    if (!file || !previewUrl || targetWidth <= 0 || targetHeight <= 0) return;
    setIsResizing(true);
    setError(null);

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setIsResizing(false);
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      canvas.toBlob((blob) => {
        setIsResizing(false);
        if (blob) {
          if (resultUrl) URL.revokeObjectURL(resultUrl);
          setResultUrl(URL.createObjectURL(blob));
        }
      }, file.type || 'image/png');
    };
    img.src = previewUrl;
  };

  const handleDownload = () => {
    if (!resultUrl || !file) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = `redimensionada_${targetWidth}x${targetHeight}_${file.name}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="p-6 sm:p-10">
      <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          <ShieldCheck className="w-4 h-4" />
          <span>{lang === 'es' ? 'Redimensión instantánea en tu dispositivo' : 'Instant in-browser resizing'}</span>
        </div>
        <span className="text-xs text-slate-400">
          {originalWidth > 0 ? `${originalWidth} × ${originalHeight} px` : ''}
        </span>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!file ? (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
          }}
          className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 rounded-3xl p-8 sm:p-14 text-center transition-colors bg-slate-50/50 dark:bg-slate-800/20 group"
        >
          <div className="mx-auto w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <UploadCloud className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">
            {lang === 'es' ? 'Arrastra tu imagen para cambiar sus medidas' : 'Drag image to resize'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-6">
            {lang === 'es' ? 'Ajusta ancho y alto exactos o usa medidas de redes sociales' : 'Set exact dimensions or choose social media presets'}
          </p>
          <label className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md transition-all cursor-pointer">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              className="hidden"
            />
            {getTranslation(lang, 'selectFiles')}
          </label>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Presets */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              {lang === 'es' ? 'Plantillas de tamaño populares:' : 'Popular presets:'}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => applyPreset(1080, 1080)}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 text-left transition-colors"
              >
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Instagram Post</p>
                <p className="text-[11px] text-slate-500">1080 × 1080 px</p>
              </button>
              <button
                type="button"
                onClick={() => applyPreset(1080, 1920)}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 text-left transition-colors"
              >
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Story / TikTok</p>
                <p className="text-[11px] text-slate-500">1080 × 1920 px</p>
              </button>
              <button
                type="button"
                onClick={() => applyPreset(1200, 630)}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 text-left transition-colors"
              >
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Web / Open Graph</p>
                <p className="text-[11px] text-slate-500">1200 × 630 px</p>
              </button>
              <button
                type="button"
                onClick={() => applyPreset(1500, 500)}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 text-left transition-colors"
              >
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Banner X / Twitter</p>
                <p className="text-[11px] text-slate-500">1500 × 500 px</p>
              </button>
            </div>
          </div>

          {/* Custom Dimension Inputs */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                  {lang === 'es' ? 'Ancho (px)' : 'Width (px)'}
                </label>
                <input
                  type="number"
                  value={targetWidth}
                  onChange={(e) => handleWidthChange(Number(e.target.value))}
                  className="w-28 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="pt-5">
                <button
                  type="button"
                  onClick={() => setKeepAspectRatio(!keepAspectRatio)}
                  className={`p-2 rounded-xl border transition-colors ${
                    keepAspectRatio 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 text-blue-600' 
                      : 'border-slate-300 text-slate-400'
                  }`}
                  title={keepAspectRatio ? 'Proporción bloqueada' : 'Proporción desbloqueada'}
                >
                  {keepAspectRatio ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                  {lang === 'es' ? 'Alto (px)' : 'Height (px)'}
                </label>
                <input
                  type="number"
                  value={targetHeight}
                  onChange={(e) => handleHeightChange(Number(e.target.value))}
                  className="w-28 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            <button
              onClick={handleResize}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-colors cursor-pointer"
            >
              {lang === 'es' ? 'Aplicar nuevas medidas' : 'Apply new dimensions'}
            </button>
          </div>

          {/* Preview & Download */}
          <div className="aspect-video max-h-72 rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center p-2">
            <img
              src={resultUrl || previewUrl || ''}
              alt="Preview"
              className="max-h-full max-w-full object-contain rounded-lg"
            />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={handleDownload}
              className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{getTranslation(lang, 'downloadFile')}</span>
            </button>
            <button
              onClick={() => {
                setFile(null);
                setPreviewUrl(null);
                setResultUrl(null);
              }}
              className="px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-sm hover:bg-slate-50 transition-colors"
            >
              {getTranslation(lang, 'resetTool')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
