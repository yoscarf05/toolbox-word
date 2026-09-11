import React, { useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { Language } from '../types';
import { getTranslation } from '../i18n';
import { 
  UploadCloud, 
  FileText, 
  Download, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  ShieldCheck, 
  Image as ImageIcon 
} from 'lucide-react';

if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
  } catch (e) {
    console.warn('PDF.js worker URL setup notice:', e);
  }
}

interface PdfToJpgToolProps {
  lang: Language;
}

export const PdfToJpgTool: React.FC<PdfToJpgToolProps> = ({ lang }) => {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [extractedPages, setExtractedPages] = useState<{ pageNumber: number; dataUrl: string }[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (selected: File) => {
    if (selected.type !== 'application/pdf' && !selected.name.toLowerCase().endsWith('.pdf')) {
      setError(lang === 'es' ? 'Selecciona un archivo PDF válido.' : 'Please select a valid PDF file.');
      return;
    }
    setError(null);
    setFile(selected);
    setExtractedPages([]);

    try {
      const buffer = await selected.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({
        data: buffer.slice(0),
        cMapUrl: 'https://unpkg.com/pdfjs-dist@4.10.38/cmaps/',
        cMapPacked: true,
        standardFontDataUrl: 'https://unpkg.com/pdfjs-dist@4.10.38/standard_fonts/',
      }).promise;
      setPageCount(pdf.numPages);
    } catch (e) {
      console.error(e);
      setError(lang === 'es' ? 'No se pudo leer el archivo PDF.' : 'Failed to read PDF document.');
    }
  };

  const handleExtractPages = async () => {
    if (!file) return;
    setIsProcessing(true);
    setError(null);
    setStatusText(lang === 'es' ? 'Cargando motor de renderizado...' : 'Loading rendering engine...');

    try {
      const buffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({
        data: buffer.slice(0),
        cMapUrl: 'https://unpkg.com/pdfjs-dist@4.10.38/cmaps/',
        cMapPacked: true,
        standardFontDataUrl: 'https://unpkg.com/pdfjs-dist@4.10.38/standard_fonts/',
      }).promise;
      const count = pdf.numPages;

      // Render each page to genuine high-res canvas representation
      const pagesData: { pageNumber: number; dataUrl: string }[] = [];

      for (let i = 1; i <= count; i++) {
        setStatusText(
          lang === 'es'
            ? `Renderizando página ${i} de ${count}...`
            : `Rendering page ${i} of ${count}...`
        );

        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 });

        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          // Fill pure white background first so transparent PDFs don't become black in JPG
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          await page.render({
            canvasContext: ctx,
            viewport,
          }).promise;

          const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
          pagesData.push({ pageNumber: i, dataUrl });
        }
      }

      setExtractedPages(pagesData);
    } catch (err: any) {
      console.error('Error rendering PDF to JPG:', err);
      setError(
        lang === 'es'
          ? 'Error al renderizar las páginas del PDF a imágenes JPG.'
          : 'Error rendering PDF pages to JPG images.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadSingle = (pageNumber: number, dataUrl: string) => {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `pagina_${pageNumber}_${file?.name.replace('.pdf', '')}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="p-6 sm:p-10">
      <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          <ShieldCheck className="w-4 h-4" />
          <span>{lang === 'es' ? 'Conversión 100% en tu navegador' : '100% Client-side conversion'}</span>
        </div>
        <span className="text-xs text-slate-400">
          {pageCount > 0 ? `${pageCount} ${lang === 'es' ? 'páginas detectadas' : 'pages found'}` : ''}
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
            if (e.dataTransfer.files[0]) handleFileChange(e.dataTransfer.files[0]);
          }}
          className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 rounded-3xl p-8 sm:p-14 text-center transition-colors bg-slate-50/50 dark:bg-slate-800/20 group"
        >
          <div className="mx-auto w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <UploadCloud className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">
            {lang === 'es' ? 'Selecciona el PDF para convertir a JPG' : 'Select PDF to convert to JPG'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-6">
            {lang === 'es' ? 'Arrastra tu archivo o pulsa el botón' : 'Drag your file or click the button'}
          </p>
          <label className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md transition-all cursor-pointer">
            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
              className="hidden"
            />
            {getTranslation(lang, 'selectFiles')}
          </label>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3.5">
              <div className="p-3 rounded-xl bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {file.name}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {pageCount} {lang === 'es' ? 'páginas disponibles para extraer' : 'pages available for extraction'}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setFile(null);
                setExtractedPages([]);
              }}
              className="text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              {getTranslation(lang, 'changeFile')}
            </button>
          </div>

          {extractedPages.length === 0 && (
            <div className="text-center pt-2">
              <button
                onClick={handleExtractPages}
                disabled={isProcessing}
                className="px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 mx-auto cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{statusText || getTranslation(lang, 'processing')}</span>
                  </>
                ) : (
                  <span>{lang === 'es' ? 'Convertir todas las páginas a JPG' : 'Convert all pages to JPG'}</span>
                )}
              </button>
            </div>
          )}

          {extractedPages.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {lang === 'es' ? 'Páginas extraídas en JPG:' : 'Extracted JPG Pages:'}
                </h4>
                <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  {extractedPages.length} {lang === 'es' ? 'imágenes listas' : 'images ready'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {extractedPages.map((p) => (
                  <div
                    key={p.pageNumber}
                    className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between space-y-3"
                  >
                    <div className="aspect-[3/4] rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-100 dark:border-slate-800">
                      <img src={p.dataUrl} alt={`Página ${p.pageNumber}`} className="w-full h-full object-contain" />
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        {lang === 'es' ? `Página ${p.pageNumber}` : `Page ${p.pageNumber}`}
                      </span>
                      <button
                        onClick={() => handleDownloadSingle(p.pageNumber, p.dataUrl)}
                        className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition-colors text-xs font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>JPG</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
