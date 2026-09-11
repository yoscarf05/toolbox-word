import React, { useState } from 'react';
import { Language } from '../types';
import { getTranslation } from '../i18n';
import { 
  UploadCloud, 
  Download, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  ShieldCheck 
} from 'lucide-react';

interface JpgToWebpToolProps {
  lang: Language;
}

export const JpgToWebpTool: React.FC<JpgToWebpToolProps> = ({ lang }) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [quality, setQuality] = useState<number>(85);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleFile = (f: File) => {
    if (!f.type.includes('jpeg') && !f.type.includes('jpg') && !f.name.toLowerCase().endsWith('.jpg') && !f.name.toLowerCase().endsWith('.jpeg')) {
      setError(lang === 'es' ? 'Por favor sube una imagen en formato JPG o JPEG.' : 'Please upload a JPG or JPEG image.');
      return;
    }
    setError(null);
    setFile(f);
    const url = URL.createObjectURL(f);
    setPreviewUrl(url);
    convertToWebp(url, f.name, quality);
  };

  const convertToWebp = (srcUrl: string, fileName: string, q: number) => {
    setIsProcessing(true);
    setError(null);

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setIsProcessing(false);
        return;
      }

      ctx.drawImage(img, 0, 0);
      canvas.toBlob(
        (blob) => {
          setIsProcessing(false);
          if (blob) {
            setResultBlob(blob);
            if (resultUrl) URL.revokeObjectURL(resultUrl);
            setResultUrl(URL.createObjectURL(blob));
          }
        },
        'image/webp',
        q / 100
      );
    };
    img.onerror = () => {
      setIsProcessing(false);
      setError(lang === 'es' ? 'Error al procesar la imagen.' : 'Failed to process image.');
    };
    img.src = srcUrl;
  };

  const handleQualityChange = (newQ: number) => {
    setQuality(newQ);
    if (previewUrl && file) {
      convertToWebp(previewUrl, file.name, newQ);
    }
  };

  const handleDownload = () => {
    if (!resultUrl || !file) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || 'imagen';
    a.download = `${nameWithoutExt}.webp`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const originalSize = file ? file.size : 0;
  const webpSize = resultBlob ? resultBlob.size : 0;
  const savings = originalSize > 0 && webpSize > 0 
    ? Math.round(((originalSize - webpSize) / originalSize) * 100) 
    : 0;

  return (
    <div className="p-6 sm:p-10">
      <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          <ShieldCheck className="w-4 h-4" />
          <span>{lang === 'es' ? 'Conversión 100% en tu navegador' : '100% Client-side conversion'}</span>
        </div>
        <span className="text-xs text-slate-400">JPG → WebP</span>
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
            {lang === 'es' ? 'Selecciona o arrastra una imagen JPG' : 'Select or drag a JPG image'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-6">
            {lang === 'es' ? 'Convierte a formato WebP moderno para sitios web rápidos' : 'Convert to modern WebP format for fast web delivery'}
          </p>
          <label className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md transition-all cursor-pointer">
            <input
              type="file"
              accept=".jpg,.jpeg,image/jpeg"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              className="hidden"
            />
            {getTranslation(lang, 'selectFiles')}
          </label>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 max-w-lg mx-auto">
            <div className="flex items-center justify-between text-xs font-bold mb-2">
              <span className="text-slate-700 dark:text-slate-300">
                {lang === 'es' ? 'Calidad WebP:' : 'WebP Quality:'}
              </span>
              <span className="text-blue-600 dark:text-blue-400 font-mono">{quality}%</span>
            </div>
            <input
              type="range"
              min="20"
              max="100"
              value={quality}
              onChange={(e) => handleQualityChange(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center space-y-2">
              <span className="text-xs font-bold text-slate-400">JPG ({formatSize(originalSize)})</span>
              <div className="aspect-video rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center">
                {previewUrl && <img src={previewUrl} alt="JPG" className="max-h-full object-contain" />}
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-blue-200 dark:border-blue-900 bg-blue-50/20 dark:bg-blue-950/20 text-center space-y-2">
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                WebP ({formatSize(webpSize)}) {savings > 0 && `(-${savings}%)`}
              </span>
              <div className="aspect-video rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center">
                {isProcessing ? (
                  <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                ) : resultUrl ? (
                  <img src={resultUrl} alt="WebP" className="max-h-full object-contain" />
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={handleDownload}
              disabled={!resultBlob}
              className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{lang === 'es' ? 'Descargar imagen WebP' : 'Download WebP image'}</span>
            </button>
            <button
              onClick={() => {
                setFile(null);
                setPreviewUrl(null);
                setResultBlob(null);
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
