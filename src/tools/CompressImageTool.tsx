import React, { useState, useEffect } from 'react';
import { Language } from '../types';
import { getTranslation } from '../i18n';
import { 
  UploadCloud, 
  Image as ImageIcon, 
  Download, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Sliders, 
  ShieldCheck 
} from 'lucide-react';

interface CompressImageToolProps {
  lang: Language;
}

export const CompressImageTool: React.FC<CompressImageToolProps> = ({ lang }) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [quality, setQuality] = useState<number>(80);
  const [maxDimension, setMaxDimension] = useState<number>(1920);
  const [outputFormat, setOutputFormat] = useState<'image/jpeg' | 'image/webp'>('image/jpeg');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [compressedSize, setCompressedSize] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFile = (f: File) => {
    if (!f.type.startsWith('image/')) {
      setError(lang === 'es' ? 'Selecciona una imagen válida (JPG, PNG, WebP).' : 'Please select a valid image.');
      return;
    }
    setError(null);
    setFile(f);
    const url = URL.createObjectURL(f);
    setPreviewUrl(url);
    setResultBlob(null);
    setResultUrl(null);
  };

  const processImage = () => {
    if (!file || !previewUrl) return;
    setIsProcessing(true);
    setError(null);

    const img = new Image();
    img.onload = () => {
      let width = img.naturalWidth;
      let height = img.naturalHeight;

      // Scale if larger than maxDimension
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setIsProcessing(false);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          setIsProcessing(false);
          if (blob) {
            setResultBlob(blob);
            setCompressedSize(blob.size);
            if (resultUrl) URL.revokeObjectURL(resultUrl);
            setResultUrl(URL.createObjectURL(blob));
          }
        },
        outputFormat,
        quality / 100
      );
    };

    img.onerror = () => {
      setIsProcessing(false);
      setError(lang === 'es' ? 'Error al procesar la imagen.' : 'Error processing image.');
    };

    img.src = previewUrl;
  };

  // Run auto-compression whenever settings change if file loaded
  useEffect(() => {
    if (file && previewUrl) {
      const timer = setTimeout(() => {
        processImage();
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [file, previewUrl, quality, maxDimension, outputFormat]);

  const handleDownload = () => {
    if (!resultUrl || !file) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    const ext = outputFormat === 'image/webp' ? 'webp' : 'jpg';
    a.download = `comprimida_${file.name.substring(0, file.name.lastIndexOf('.')) || 'imagen'}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const originalSize = file ? file.size : 0;
  const savingsPercent = originalSize > 0 && compressedSize > 0
    ? Math.max(0, Math.round(((originalSize - compressedSize) / originalSize) * 100))
    : 0;

  return (
    <div className="p-6 sm:p-10">
      <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          <ShieldCheck className="w-4 h-4" />
          <span>{lang === 'es' ? 'Compresión 100% en tu navegador' : '100% Client-side compression'}</span>
        </div>
        <span className="text-xs text-slate-400">
          {lang === 'es' ? 'Formatos: JPG, PNG, WebP' : 'Formats: JPG, PNG, WebP'}
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
            {lang === 'es' ? 'Arrastra tu imagen para optimizar y reducir peso' : 'Drag your image to compress'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-6">
            {lang === 'es' ? 'Reduce hasta un 80% del peso sin pérdida visible de nitidez' : 'Save up to 80% without noticeable quality loss'}
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
          {/* Controls Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            {/* Quality Slider */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold mb-2">
                <span className="text-slate-700 dark:text-slate-300">
                  {lang === 'es' ? 'Calidad de compresión:' : 'Compression Quality:'}
                </span>
                <span className="text-blue-600 dark:text-blue-400 font-mono text-sm">{quality}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="98"
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>{lang === 'es' ? 'Menor peso' : 'Smallest'}</span>
                <span>{lang === 'es' ? 'Equilibrado' : 'Balanced'}</span>
                <span>{lang === 'es' ? 'Alta fidelidad' : 'Crisp'}</span>
              </div>
            </div>

            {/* Max Resolution / Scale */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                {lang === 'es' ? 'Dimensión máxima (px):' : 'Max Dimension (px):'}
              </label>
              <select
                value={maxDimension}
                onChange={(e) => setMaxDimension(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                <option value="3840">Original / 4K (3840px)</option>
                <option value="1920">Full HD (1920px - Recomendado)</option>
                <option value="1280">Web Estándar (1280px)</option>
                <option value="800">Móvil / Miniatura (800px)</option>
              </select>
            </div>

            {/* Target format */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                {lang === 'es' ? 'Formato de salida:' : 'Output Format:'}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setOutputFormat('image/jpeg')}
                  className={`py-2 rounded-lg text-xs font-bold border transition-colors ${
                    outputFormat === 'image/jpeg'
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  JPG
                </button>
                <button
                  type="button"
                  onClick={() => setOutputFormat('image/webp')}
                  className={`py-2 rounded-lg text-xs font-bold border transition-colors ${
                    outputFormat === 'image/webp'
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  WebP (Moderno)
                </button>
              </div>
            </div>
          </div>

          {/* Before & After comparison card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {lang === 'es' ? 'Original' : 'Original'}
              </span>
              <div className="aspect-video rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center">
                {previewUrl && <img src={previewUrl} alt="Original" className="max-h-full object-contain" />}
              </div>
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {formatSize(originalSize)}
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/20 dark:bg-blue-950/20 text-center space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                {lang === 'es' ? 'Comprimida' : 'Compressed'}
              </span>
              <div className="aspect-video rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center">
                {isProcessing ? (
                  <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                ) : resultUrl ? (
                  <img src={resultUrl} alt="Compressed" className="max-h-full object-contain" />
                ) : null}
              </div>
              <div className="flex items-center justify-center gap-2">
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  {formatSize(compressedSize)}
                </span>
                {savingsPercent > 0 && (
                  <span className="text-xs font-extrabold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                    -{savingsPercent}%
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={handleDownload}
              disabled={isProcessing || !resultBlob}
              className="px-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{getTranslation(lang, 'downloadFile')}</span>
            </button>
            <button
              onClick={() => {
                setFile(null);
                setPreviewUrl(null);
                setResultBlob(null);
              }}
              className="px-4 py-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-sm hover:bg-slate-50 transition-colors"
            >
              {getTranslation(lang, 'resetTool')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
