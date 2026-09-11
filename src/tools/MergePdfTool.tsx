import React, { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import { Language } from '../types';
import { getTranslation } from '../i18n';
import { 
  UploadCloud, 
  FileText, 
  Download, 
  RefreshCw, 
  ArrowUp, 
  ArrowDown, 
  Trash2, 
  Plus, 
  CheckCircle, 
  AlertCircle,
  ShieldCheck 
} from 'lucide-react';

interface MergePdfToolProps {
  lang: Language;
}

interface LoadedFile {
  id: string;
  file: File;
  name: string;
  size: number;
}

export const MergePdfTool: React.FC<MergePdfToolProps> = ({ lang }) => {
  const [files, setFiles] = useState<LoadedFile[]>([]);
  const [isMerging, setIsMerging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const addFiles = (newFiles: FileList | File[]) => {
    setError(null);
    const valid: LoadedFile[] = [];
    Array.from(newFiles).forEach((f) => {
      if (f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')) {
        valid.push({
          id: Math.random().toString(36).substring(2, 9),
          file: f,
          name: f.name,
          size: f.size
        });
      }
    });

    if (valid.length === 0) {
      setError(lang === 'es' ? 'Solo se admiten archivos en formato PDF.' : 'Only PDF documents are allowed.');
      return;
    }

    setFiles((prev) => [...prev, ...valid]);
    setResultBlob(null);
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= files.length) return;
    const copy = [...files];
    const temp = copy[index];
    copy[index] = copy[target];
    copy[target] = temp;
    setFiles(copy);
  };

  const removeItem = (id: string) => {
    setFiles(files.filter((f) => f.id !== id));
  };

  const handleMerge = async () => {
    if (files.length < 2) {
      setError(lang === 'es' ? 'Debes agregar al menos 2 archivos PDF para unir.' : 'Please add at least 2 PDF files to merge.');
      return;
    }

    setIsMerging(true);
    setProgress(15);
    setError(null);

    try {
      const mergedPdf = await PDFDocument.create();

      for (let i = 0; i < files.length; i++) {
        const item = files[i];
        const bytes = await item.file.arrayBuffer();
        const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
        const pages = await mergedPdf.copyPages(doc, doc.getPageIndices());
        pages.forEach((p) => mergedPdf.addPage(p));
        setProgress(Math.round(15 + ((i + 1) / files.length) * 75));
      }

      const mergedBytes = await mergedPdf.save({ useObjectStreams: true });
      const blob = new Blob([mergedBytes], { type: 'application/pdf' });
      
      setProgress(100);
      setResultBlob(blob);
    } catch (err) {
      console.error(err);
      setError(
        lang === 'es'
          ? 'Error al unir los PDFs. Uno de los archivos puede estar protegido o dañado.'
          : 'Failed to merge PDFs. One of the documents may be password protected or corrupted.'
      );
    } finally {
      setIsMerging(false);
    }
  };

  const handleDownload = () => {
    if (!resultBlob) return;
    const url = URL.createObjectURL(resultBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'unido_toolbox_world.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 sm:p-10">
      <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          <ShieldCheck className="w-4 h-4" />
          <span>{lang === 'es' ? 'Unión 100% en tu navegador (Sin subir archivos)' : '100% In-Browser Merge'}</span>
        </div>
        <span className="text-xs text-slate-400">
          {files.length} {lang === 'es' ? 'archivos añadidos' : 'files added'}
        </span>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {files.length === 0 ? (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            addFiles(e.dataTransfer.files);
          }}
          className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 rounded-3xl p-8 sm:p-14 text-center transition-colors bg-slate-50/50 dark:bg-slate-800/20 group"
        >
          <div className="mx-auto w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <UploadCloud className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">
            {lang === 'es' ? 'Arrastra dos o más archivos PDF aquí' : 'Drag two or more PDFs here'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-6">
            {lang === 'es' ? 'o selecciona varios documentos desde tu equipo' : 'or choose documents from your device'}
          </p>
          <label className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md transition-all cursor-pointer">
            <input
              type="file"
              multiple
              accept=".pdf,application/pdf"
              onChange={(e) => e.target.files && addFiles(e.target.files)}
              className="hidden"
            />
            {lang === 'es' ? 'Seleccionar archivos PDF' : 'Select PDF files'}
          </label>
        </div>
      ) : (
        <div className="space-y-6">
          {/* File List for reordering */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {lang === 'es' ? 'Arrastra o usa flechas para ordenar:' : 'Reorder files:'}
              </span>
              <label className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
                <Plus className="w-3.5 h-3.5" />
                <input
                  type="file"
                  multiple
                  accept=".pdf,application/pdf"
                  onChange={(e) => e.target.files && addFiles(e.target.files)}
                  className="hidden"
                />
                {lang === 'es' ? 'Añadir más PDFs' : 'Add more PDFs'}
              </label>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {files.map((item, idx) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <span className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <FileText className="w-5 h-5 text-red-500 shrink-0" />
                    <div className="overflow-hidden">
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate max-w-xs sm:max-w-md">
                        {item.name}
                      </p>
                      <span className="text-[11px] text-slate-400">{formatSize(item.size)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => moveItem(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 disabled:opacity-30 cursor-pointer"
                      title="Mover arriba"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => moveItem(idx, 'down')}
                      disabled={idx === files.length - 1}
                      className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 disabled:opacity-30 cursor-pointer"
                      title="Mover abajo"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950 text-rose-500 transition-colors cursor-pointer ml-1"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {!resultBlob && (
            <div className="pt-2 flex justify-center">
              <button
                onClick={handleMerge}
                disabled={isMerging || files.length < 2}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isMerging ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{getTranslation(lang, 'processing')}</span>
                  </>
                ) : (
                  <span>{lang === 'es' ? `Unir ${files.length} archivos PDF` : `Merge ${files.length} PDF files`}</span>
                )}
              </button>
            </div>
          )}

          {isMerging && (
            <div className="space-y-2">
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-blue-600 h-2 transition-all duration-300 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {resultBlob && (
            <div className="p-6 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {lang === 'es' ? '¡Documentos unidos con éxito!' : 'PDFs merged successfully!'}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {lang === 'es' ? 'El PDF unificado está listo para ser guardado.' : 'Combined document is ready to download.'}
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={handleDownload}
                  className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>{getTranslation(lang, 'downloadFile')}</span>
                </button>
                <button
                  onClick={() => {
                    setFiles([]);
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
