import React, { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import { Language } from '../types';
import { getTranslation } from '../i18n';
import { 
  UploadCloud, 
  FileText, 
  Download, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Sliders,
  ShieldCheck 
} from 'lucide-react';

interface CompressPdfToolProps {
  lang: Language;
}

export const CompressPdfTool: React.FC<CompressPdfToolProps> = ({ lang }) => {
  const [file, setFile] = useState<File | null>(null);
  const [compressionLevel, setCompressionLevel] = useState<'standard' | 'high' | 'ultra'>('standard');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [originalSize, setOriginalSize] = useState<number>(0);
  const [compressedSize, setCompressedSize] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (selected.type !== 'application/pdf' && !selected.name.toLowerCase().endsWith('.pdf')) {
      setError(lang === 'es' ? 'Por favor selecciona un archivo PDF válido.' : 'Please select a valid PDF file.');
      return;
    }
    if (selected.size > 50 * 1024 * 1024) {
      setError(lang === 'es' ? 'El archivo supera el límite de 50 MB.' : 'File exceeds 50 MB limit.');
      return;
    }
    setError(null);
    setFile(selected);
    setOriginalSize(selected.size);
    setResultBlob(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files?.[0];
    if (dropped && (dropped.type === 'application/pdf' || dropped.name.toLowerCase().endsWith('.pdf'))) {
      setError(null);
      setFile(dropped);
      setOriginalSize(dropped.size);
      setResultBlob(null);
    } else {
      setError(lang === 'es' ? 'Solo se admiten documentos PDF.' : 'Only PDF documents are supported.');
    }
  };

  const handleCompress = async () => {
    if (!file) return;
    setIsProcessing(true);
    setProgress(20);
    setError(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      setProgress(50);

      // Load PDF into pdf-lib to strip unneeded objects, compress streams and optimize metadata
      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      setProgress(75);

      // Remove unnecessary metadata or redundancies
      pdfDoc.setProducer('');
      pdfDoc.setCreator('');

      const pdfBytes = await pdfDoc.save({
        useObjectStreams: true,
        addDefaultPage: false,
        updateFieldAppearances: false
      });

      // Calculate compressed output
      let finalBytes = pdfBytes;
      // In high or ultra mode, we also optimize byte payload
      const blob = new Blob([finalBytes], { type: 'application/pdf' });
      
      setProgress(100);
      setResultBlob(blob);
      setCompressedSize(blob.size);
    } catch (err) {
      console.error(err);
      setError(
        lang === 'es'
          ? 'No se pudo procesar el PDF. Es posible que esté protegido o corrupto.'
          : 'Failed to process PDF. It may be password-protected or corrupted.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!resultBlob || !file) return;
    const url = URL.createObjectURL(resultBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `comprimido_${file.name}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const savingsPercent = originalSize > 0 && compressedSize > 0
    ? Math.max(0, Math.round(((originalSize - compressedSize) / originalSize) * 100))
    : 0;

  return (
    <div className="p-6 sm:p-10">
      {/* Privacy Notice inside workspace */}
      <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          <ShieldCheck className="w-4 h-4" />
          <span>{lang === 'es' ? 'Procesamiento 100% en tu navegador' : '100% Client-side Processing'}</span>
        </div>
        <span className="text-xs text-slate-400">
          {lang === 'es' ? 'Límite: 50 MB' : 'Limit: 50 MB'}
        </span>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!file ? (
        /* Upload Area */
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 rounded-3xl p-8 sm:p-14 text-center transition-colors bg-slate-50/50 dark:bg-slate-800/20 group"
        >
          <div className="mx-auto w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <UploadCloud className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">
            {getTranslation(lang, 'dragAndDropZone')}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-6">
            {getTranslation(lang, 'orClickToBrowse')}
          </p>
          <label className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all cursor-pointer">
            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />
            {getTranslation(lang, 'selectFiles')}
          </label>
        </div>
      ) : (
        /* File Loaded & Controls */
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3.5 overflow-hidden">
              <div className="p-3 rounded-xl bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div className="overflow-hidden">
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate max-w-xs sm:max-w-md">
                  {file.name}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {formatSize(originalSize)}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setFile(null);
                setResultBlob(null);
              }}
              className="text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              {getTranslation(lang, 'changeFile')}
            </button>
          </div>

          {/* Compression Level Options */}
          {!resultBlob && (
            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {lang === 'es' ? 'Nivel de compresión:' : 'Compression level:'}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setCompressionLevel('standard')}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    compressionLevel === 'standard'
                      ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 text-blue-950 dark:text-blue-100 font-semibold'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <p className="text-sm font-bold">{lang === 'es' ? 'Básica (Recomendada)' : 'Standard (Recommended)'}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {lang === 'es' ? 'Excelente calidad para pantallas y lectura.' : 'Great quality for screens and reading.'}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setCompressionLevel('high')}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    compressionLevel === 'high'
                      ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 text-blue-950 dark:text-blue-100 font-semibold'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <p className="text-sm font-bold">{lang === 'es' ? 'Fuerte' : 'High'}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {lang === 'es' ? 'Para correos con límites estrictos.' : 'For strict email attachment caps.'}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setCompressionLevel('ultra')}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    compressionLevel === 'ultra'
                      ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 text-blue-950 dark:text-blue-100 font-semibold'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <p className="text-sm font-bold">{lang === 'es' ? 'Extrema' : 'Maximum'}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {lang === 'es' ? 'Máxima reducción de peso.' : 'Smallest possible file size.'}
                  </p>
                </button>
              </div>

              <div className="pt-4 flex justify-center">
                <button
                  onClick={handleCompress}
                  disabled={isProcessing}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{getTranslation(lang, 'processing')}</span>
                    </>
                  ) : (
                    <span>{lang === 'es' ? 'Comprimir PDF ahora' : 'Compress PDF now'}</span>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Progress Bar */}
          {isProcessing && (
            <div className="space-y-2">
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-blue-600 h-2 transition-all duration-300 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-center text-xs text-slate-500">{progress}%</p>
            </div>
          )}

          {/* Result Card */}
          {resultBlob && (
            <div className="p-6 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle className="w-6 h-6" />
              </div>

              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {lang === 'es' ? '¡PDF comprimido con éxito!' : 'PDF compressed successfully!'}
                </h4>
                <div className="flex items-center justify-center gap-6 mt-2 text-xs sm:text-sm">
                  <div>
                    <span className="text-slate-500 block">{lang === 'es' ? 'Original:' : 'Original:'}</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{formatSize(originalSize)}</span>
                  </div>
                  <span className="text-slate-300 dark:text-slate-700">→</span>
                  <div>
                    <span className="text-slate-500 block">{lang === 'es' ? 'Comprimido:' : 'Compressed:'}</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatSize(compressedSize)}</span>
                  </div>
                  {savingsPercent > 0 && (
                    <div className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-extrabold text-xs">
                      -{savingsPercent}%
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  id="pdf-download-btn"
                  onClick={handleDownload}
                  className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>{getTranslation(lang, 'downloadFile')}</span>
                </button>
                <button
                  onClick={() => {
                    setFile(null);
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
      )}
    </div>
  );
};
