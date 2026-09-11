import React, { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import { Language } from '../types';
import { getTranslation } from '../i18n';
import { 
  UploadCloud, 
  Download, 
  FileText, 
  Scissors, 
  ShieldCheck, 
  CheckCircle, 
  AlertCircle 
} from 'lucide-react';

interface SplitPdfToolProps {
  lang: Language;
}

export const SplitPdfTool: React.FC<SplitPdfToolProps> = ({ lang }) => {
  const [file, setFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [fromPage, setFromPage] = useState<number>(1);
  const [toPage, setToPage] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (selectedFile: File) => {
    if (selectedFile.type !== 'application/pdf') {
      setError(lang === 'es' ? 'Por favor selecciona un archivo PDF válido.' : 'Please select a valid PDF file.');
      return;
    }

    setError(null);
    setDownloadUrl(null);
    setFile(selectedFile);

    try {
      const buffer = await selectedFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
      const count = pdfDoc.getPageCount();
      setTotalPages(count);
      setFromPage(1);
      setToPage(Math.min(count, 2));
    } catch (e) {
      setError(lang === 'es' ? 'No se pudo leer el documento PDF.' : 'Could not read PDF document.');
    }
  };

  const handleSplit = async () => {
    if (!file || totalPages === 0) return;
    setIsProcessing(true);
    setError(null);

    try {
      const buffer = await file.arrayBuffer();
      const srcPdf = await PDFDocument.load(buffer);
      const newPdf = await PDFDocument.create();

      const start = Math.max(0, fromPage - 1);
      const end = Math.min(totalPages - 1, toPage - 1);

      const pageIndices: number[] = [];
      for (let i = start; i <= end; i++) {
        pageIndices.push(i);
      }

      const copiedPages = await newPdf.copyPages(srcPdf, pageIndices);
      copiedPages.forEach((page) => newPdf.addPage(page));

      const pdfBytes = await newPdf.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
    } catch (e) {
      setError(lang === 'es' ? 'Ocurrió un error al extraer las páginas.' : 'Error extracting pages.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-6 sm:p-10">
      <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          <ShieldCheck className="w-4 h-4" />
          <span>{lang === 'es' ? 'División y extracción local con pdf-lib' : 'Local PDF split & extraction'}</span>
        </div>
        <span className="text-xs text-slate-400">
          {totalPages > 0 ? `${totalPages} ${lang === 'es' ? 'páginas detectadas' : 'pages detected'}` : 'PDF Tool'}
        </span>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!file ? (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files[0]) handleFileChange(e.dataTransfer.files[0]);
          }}
          className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 rounded-3xl p-8 sm:p-14 text-center transition-colors bg-slate-50/50 dark:bg-slate-800/20 group"
        >
          <div className="mx-auto w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <UploadCloud className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">
            {lang === 'es' ? 'Arrastra tu archivo PDF aquí para dividirlo' : 'Drag your PDF file here to split'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-6">
            {lang === 'es' ? 'Extrae páginas sueltas o rangos específicos de páginas' : 'Extract individual pages or specific ranges'}
          </p>
          <label className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md transition-all cursor-pointer">
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
              className="hidden"
            />
            {getTranslation(lang, 'selectFiles')}
          </label>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-xs">{file.name}</p>
                <p className="text-xs text-slate-500">{totalPages} {lang === 'es' ? 'páginas en total' : 'total pages'}</p>
              </div>
            </div>
            <button
              onClick={() => { setFile(null); setDownloadUrl(null); }}
              className="text-xs text-rose-600 hover:underline cursor-pointer"
            >
              {lang === 'es' ? 'Cambiar archivo' : 'Change file'}
            </button>
          </div>

          {/* Range selection */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {lang === 'es' ? 'Selecciona el rango de páginas a extraer:' : 'Select page range to extract:'}
            </h4>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'es' ? 'Desde página:' : 'From page:'}
                </label>
                <input
                  type="number"
                  min={1}
                  max={totalPages}
                  value={fromPage}
                  onChange={(e) => setFromPage(Math.min(totalPages, Math.max(1, Number(e.target.value))))}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'es' ? 'Hasta página:' : 'To page:'}
                </label>
                <input
                  type="number"
                  min={fromPage}
                  max={totalPages}
                  value={toPage}
                  onChange={(e) => setToPage(Math.min(totalPages, Math.max(fromPage, Number(e.target.value))))}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {!downloadUrl ? (
              <button
                onClick={handleSplit}
                disabled={isProcessing}
                className="px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <Scissors className="w-4 h-4" />
                <span>{isProcessing ? 'Extrayendo páginas...' : (lang === 'es' ? 'Dividir y Extraer Páginas' : 'Split & Extract Pages')}</span>
              </button>
            ) : (
              <div className="text-center space-y-3">
                <a
                  href={downloadUrl}
                  download={`paginas_${fromPage}_a_${toPage}_${file.name}`}
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>{lang === 'es' ? 'Descargar PDF Extraído' : 'Download Extracted PDF'}</span>
                </a>
                <button
                  onClick={() => setDownloadUrl(null)}
                  className="block mx-auto text-xs text-slate-500 hover:underline cursor-pointer"
                >
                  {lang === 'es' ? 'Extraer otro rango' : 'Extract another range'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
