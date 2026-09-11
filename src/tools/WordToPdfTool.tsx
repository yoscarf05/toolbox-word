import React, { useState, useRef } from 'react';
import { Language } from '../types';
import {
  parseDocxFile,
  buildDocxToPdf,
  validateGeneratedPdf,
  DocxAnalysisResult,
  DocxToPdfOptions,
} from '../utils/docxToPdfConverter';
import {
  UploadCloud,
  Download,
  FileText,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  FileType,
  Settings2,
  Eye,
  RefreshCw,
  Sparkles,
  Table as TableIcon,
  ListOrdered,
  Image as ImageIcon,
  BookOpen,
} from 'lucide-react';

interface WordToPdfToolProps {
  lang: Language;
}

export const WordToPdfTool: React.FC<WordToPdfToolProps> = ({ lang }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressStatus, setProgressStatus] = useState('');
  const [analysis, setAnalysis] = useState<DocxAnalysisResult | null>(null);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [validationInfo, setValidationInfo] = useState<{
    isValid: boolean;
    pageCount?: number;
    byteSize: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewTab, setPreviewTab] = useState<'reading' | 'structure'>('reading');

  // Conversion options
  const [pageSize, setPageSize] = useState<'A4' | 'LETTER'>('A4');
  const [marginSize, setMarginSize] = useState<'normal' | 'compact' | 'wide'>('normal');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (selectedFile: File) => {
    const fileName = selectedFile.name.toLowerCase();

    // Check for older .doc binary format
    if (fileName.endsWith('.doc') && !fileName.endsWith('.docx')) {
      setError(
        lang === 'es'
          ? 'El formato binario antiguo .doc (Word 97-2003) no es compatible directamente. Por favor guárdalo como .docx en Microsoft Word o Google Docs y vuelve a cargarlo.'
          : 'The older binary .doc format (Word 97-2003) is not directly supported. Please save it as .docx in Microsoft Word or Google Docs and re-upload.'
      );
      return;
    }

    if (!fileName.endsWith('.docx')) {
      setError(
        lang === 'es'
          ? 'Por favor selecciona un archivo de Microsoft Word válido (.docx).'
          : 'Please select a valid Microsoft Word file (.docx).'
      );
      return;
    }

    if (selectedFile.size > 80 * 1024 * 1024) {
      setError(
        lang === 'es'
          ? 'El archivo supera el límite recomendado de 80 MB para procesamiento en el navegador.'
          : 'File exceeds the recommended 80 MB limit for browser processing.'
      );
      return;
    }

    setError(null);
    setPdfBlob(null);
    setAnalysis(null);
    setValidationInfo(null);
    setFile(selectedFile);
  };

  const handleConvert = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgress(5);
    setProgressStatus(
      lang === 'es'
        ? 'Analizando archivo Word (.docx)...'
        : 'Analyzing Word document (.docx)...'
    );
    setError(null);

    try {
      const arrayBuffer = await file.arrayBuffer();

      // Step 1: Parse and extract structure
      const parsedAnalysis = await parseDocxFile(arrayBuffer, file.name);
      setAnalysis(parsedAnalysis);

      // Step 2: Build compliant PDF
      const options: DocxToPdfOptions = {
        pageSize,
        marginSize,
        includeHeader: true,
        includePageNumbers: true,
      };

      const generatedBlob = await buildDocxToPdf(
        parsedAnalysis,
        options,
        (pct, msg) => {
          setProgress(pct);
          setProgressStatus(
            lang === 'es'
              ? msg
              : msg
                  .replace('Inicializando motor vectorial PDF...', 'Initializing PDF vector engine...')
                  .replace('Renderizando contenido y estilos...', 'Rendering content and styles...')
                  .replace('Generando numeración de páginas y pie de página...', 'Generating page numbering and footers...')
                  .replace('Empaquetando documento PDF final...', 'Packaging final PDF document...')
          );
        }
      );

      // Step 3: Validate generated PDF
      setProgress(95);
      setProgressStatus(
        lang === 'es'
          ? 'Validando integridad del documento PDF generado...'
          : 'Validating generated PDF document integrity...'
      );

      const validation = await validateGeneratedPdf(generatedBlob);
      if (!validation.isValid) {
        throw new Error(
          validation.error ||
            (lang === 'es'
              ? 'La validación del archivo PDF generado no fue satisfactoria.'
              : 'The generated PDF validation failed.')
        );
      }

      setValidationInfo(validation);
      setPdfBlob(generatedBlob);
      setProgress(100);
      setProgressStatus(
        lang === 'es'
          ? '¡Documento PDF generado y validado con éxito!'
          : 'PDF document generated and verified successfully!'
      );
    } catch (err: any) {
      console.error('Error converting Word to PDF:', err);
      setError(
        err?.message ||
          (lang === 'es'
            ? 'No se pudo completar la conversión de Word a PDF. Verifica que el archivo .docx no esté dañado.'
            : 'Could not complete Word to PDF conversion. Please verify the .docx file is not damaged.')
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const getCleanDownloadName = (): string => {
    if (!file) return 'documento.pdf';
    const base = file.name.replace(/\.[^/.]+$/, '');
    return `${base}.pdf`;
  };

  const handleDownload = () => {
    if (!pdfBlob || !file) return;

    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = getCleanDownloadName();
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  };

  const handleReset = () => {
    setFile(null);
    setAnalysis(null);
    setPdfBlob(null);
    setValidationInfo(null);
    setError(null);
    setProgress(0);
    setProgressStatus('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div id="word-to-pdf-container" className="space-y-6 max-w-5xl mx-auto">
      {/* Privacy Notice Banner */}
      <div
        id="privacy-notice"
        className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-800 dark:text-emerald-300 text-sm"
      >
        <ShieldCheck className="w-5 h-5 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
        <p className="leading-relaxed">
          <strong className="font-semibold">
            {lang === 'es' ? 'Privacidad y Seguridad:' : 'Privacy and Security:'}
          </strong>{' '}
          {lang === 'es'
            ? 'La conversión de Word a PDF se ejecuta al 100% en tu navegador mediante renderizado vectorial. Tu archivo nunca sale de tu equipo ni se sube a servidores externos.'
            : 'Word to PDF conversion runs 100% locally in your browser via vector rendering. Your file never leaves your machine or gets uploaded to external servers.'}
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div
          id="conversion-error"
          className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-700 dark:text-red-400 flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1 text-sm">
            <p className="font-semibold mb-1">
              {lang === 'es' ? 'Error en la conversión' : 'Conversion Error'}
            </p>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Upload Zone */}
      {!file ? (
        <div
          id="dropzone-area"
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
              handleFileChange(e.dataTransfer.files[0]);
            }
          }}
          className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 rounded-2xl p-10 text-center transition-all bg-slate-50/50 dark:bg-slate-900/50 cursor-pointer group"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileChange(e.target.files[0]);
              }
            }}
          />
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
            <UploadCloud className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            {lang === 'es'
              ? 'Selecciona o arrastra tu archivo Word (.docx)'
              : 'Select or drag your Word document (.docx)'}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-4">
            {lang === 'es'
              ? 'Compatible con documentos Microsoft Word (.docx). Renderizado vectorial de alta precisión y calidad de impresión.'
              : 'Compatible with Microsoft Word (.docx). High-precision vector rendering with print quality.'}
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors shadow-sm">
            <FileType className="w-4 h-4" />
            <span>{lang === 'es' ? 'Explorar archivos' : 'Browse Files'}</span>
          </div>
        </div>
      ) : (
        /* File Loaded & Configuration View */
        <div id="file-loaded-view" className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white text-base truncate max-w-sm sm:max-w-md">
                    {file.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB • Microsoft Word (.docx)
                  </p>
                </div>
              </div>
              <button
                id="reset-file-btn"
                onClick={handleReset}
                disabled={isProcessing}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors self-start sm:self-center"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                {lang === 'es' ? 'Cambiar archivo' : 'Change File'}
              </button>
            </div>

            {/* Conversion Options */}
            <div className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  <Settings2 className="w-3.5 h-3.5 inline mr-1" />
                  {lang === 'es' ? 'Tamaño de Página PDF' : 'PDF Page Size'}
                </label>
                <select
                  id="page-size-select"
                  value={pageSize}
                  onChange={(e) => setPageSize(e.target.value as 'A4' | 'LETTER')}
                  disabled={isProcessing || Boolean(pdfBlob)}
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="A4">A4 (210 × 297 mm — Estándar Internacional)</option>
                  <option value="LETTER">Carta / Letter (8.5 × 11 in — Estándar América)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  <Settings2 className="w-3.5 h-3.5 inline mr-1" />
                  {lang === 'es' ? 'Márgenes del Documento' : 'Document Margins'}
                </label>
                <select
                  id="margin-size-select"
                  value={marginSize}
                  onChange={(e) => setMarginSize(e.target.value as any)}
                  disabled={isProcessing || Boolean(pdfBlob)}
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="normal">{lang === 'es' ? 'Normales (1.9 cm)' : 'Normal (0.75 in)'}</option>
                  <option value="compact">{lang === 'es' ? 'Estrechos / Compactos (1.2 cm)' : 'Narrow / Compact (0.5 in)'}</option>
                  <option value="wide">{lang === 'es' ? 'Anchos (2.5 cm)' : 'Wide (1.0 in)'}</option>
                </select>
              </div>
            </div>

            {/* Processing Bar */}
            {isProcessing && (
              <div id="processing-bar-wrapper" className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 mb-2">
                  <span className="font-medium flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-500 animate-spin" />
                    {progressStatus}
                  </span>
                  <span className="font-semibold">{progress}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-end gap-3">
              {!pdfBlob ? (
                <button
                  id="start-convert-btn"
                  onClick={handleConvert}
                  disabled={isProcessing}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl text-sm transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Sparkles className="w-4 h-4" />
                  {lang === 'es' ? 'Convertir a PDF' : 'Convert to PDF'}
                </button>
              ) : (
                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                  <button
                    id="download-pdf-btn"
                    onClick={handleDownload}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl text-sm transition-colors shadow-sm"
                  >
                    <Download className="w-4 h-4" />
                    {lang === 'es' ? 'Descargar Documento PDF' : 'Download PDF Document'}
                  </button>
                  <button
                    id="convert-again-btn"
                    onClick={handleReset}
                    className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-xl text-sm transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    {lang === 'es' ? 'Convertir otro archivo' : 'Convert another file'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Analysis & Validation Summary (When Available) */}
          {analysis && (
            <div id="analysis-summary" className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-medium mb-1">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>{lang === 'es' ? 'Páginas estimadas' : 'Estimated Pages'}</span>
                </div>
                <div className="text-xl font-bold text-slate-900 dark:text-white">
                  {validationInfo?.pageCount || analysis.estimatedPages}
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-medium mb-1">
                  <FileText className="w-3.5 h-3.5" />
                  <span>{lang === 'es' ? 'Palabras totales' : 'Total Words'}</span>
                </div>
                <div className="text-xl font-bold text-slate-900 dark:text-white">
                  {analysis.totalWords.toLocaleString()}
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-medium mb-1">
                  <TableIcon className="w-3.5 h-3.5" />
                  <span>{lang === 'es' ? 'Tablas' : 'Tables'}</span>
                </div>
                <div className="text-xl font-bold text-slate-900 dark:text-white">
                  {analysis.tableCount}
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-medium mb-1">
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>{lang === 'es' ? 'Imágenes' : 'Images'}</span>
                </div>
                <div className="text-xl font-bold text-slate-900 dark:text-white">
                  {analysis.imageCount}
                </div>
              </div>
            </div>
          )}

          {/* Validation Guarantee Card (When Completed) */}
          {validationInfo && (
            <div
              id="validation-guarantee"
              className="p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-start gap-4 text-emerald-900 dark:text-emerald-300"
            >
              <CheckCircle2 className="w-6 h-6 flex-shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
              <div className="text-sm space-y-1">
                <p className="font-semibold text-base">
                  {lang === 'es'
                    ? 'Documento PDF válido y garantizado'
                    : 'Valid & Guaranteed PDF Document'}
                </p>
                <p className="text-emerald-800 dark:text-emerald-400 leading-relaxed">
                  {lang === 'es'
                    ? `El archivo PDF ha sido validado estructuralmente (${(validationInfo.byteSize / 1024).toFixed(1)} KB, ${validationInfo.pageCount || 1} páginas). Es compatible con Adobe Acrobat Reader, navegadores web y lectores PDF estándar.`
                    : `The PDF document has been structurally validated (${(validationInfo.byteSize / 1024).toFixed(1)} KB, ${validationInfo.pageCount || 1} pages). It is fully compatible with Adobe Acrobat Reader, web browsers, and standard PDF viewers.`}
                </p>
              </div>
            </div>
          )}

          {/* Document Preview Tabs */}
          {analysis && analysis.elements.length > 0 && (
            <div id="preview-section" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-slate-500" />
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">
                    {lang === 'es' ? 'Vista previa del contenido' : 'Content Preview'}
                  </span>
                </div>
                <div className="flex items-center bg-slate-200 dark:bg-slate-700/60 p-1 rounded-lg text-xs">
                  <button
                    id="tab-reading-btn"
                    onClick={() => setPreviewTab('reading')}
                    className={`px-3 py-1 rounded-md font-medium transition-colors ${
                      previewTab === 'reading'
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    {lang === 'es' ? 'Lectura' : 'Reading'}
                  </button>
                  <button
                    id="tab-structure-btn"
                    onClick={() => setPreviewTab('structure')}
                    className={`px-3 py-1 rounded-md font-medium transition-colors ${
                      previewTab === 'structure'
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    {lang === 'es' ? 'Estructura' : 'Structure'}
                  </button>
                </div>
              </div>

              <div className="p-6 max-h-96 overflow-y-auto space-y-4 font-sans">
                {previewTab === 'reading' ? (
                  analysis.elements.map((el) => {
                    if (el.type === 'title') {
                      return (
                        <h1 key={el.id} className="text-2xl font-bold text-slate-900 dark:text-white">
                          {el.text}
                        </h1>
                      );
                    }
                    if (el.type === 'heading1') {
                      return (
                        <h2 key={el.id} className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-4">
                          {el.text}
                        </h2>
                      );
                    }
                    if (el.type === 'heading2') {
                      return (
                        <h3 key={el.id} className="text-lg font-semibold text-slate-800 dark:text-slate-200 mt-3">
                          {el.text}
                        </h3>
                      );
                    }
                    if (el.type === 'bullet_list' || el.type === 'numbered_list') {
                      return (
                        <div key={el.id} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300 ml-4">
                          <span className="font-bold text-blue-500">{el.listPrefix || '•'}</span>
                          <span>{el.text}</span>
                        </div>
                      );
                    }
                    if (el.type === 'table' && el.tableData) {
                      return (
                        <div key={el.id} className="overflow-x-auto my-3 border border-slate-200 dark:border-slate-700 rounded-lg">
                          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700 text-xs">
                            <tbody>
                              {el.tableData.rows.map((row, rIdx) => (
                                <tr key={rIdx} className={rIdx === 0 ? 'bg-slate-100 dark:bg-slate-800 font-semibold' : ''}>
                                  {row.map((cell, cIdx) => (
                                    <td key={cIdx} className="px-3 py-2 border-r border-slate-200 dark:border-slate-700 last:border-r-0">
                                      {cell}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      );
                    }
                    if (el.type === 'image') {
                      return (
                        <div key={el.id} className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs text-slate-500 flex items-center gap-2">
                          <ImageIcon className="w-4 h-4" />
                          <span>[Imagen incrustada del documento Word]</span>
                        </div>
                      );
                    }
                    return (
                      <p key={el.id} className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                        {el.text}
                      </p>
                    );
                  })
                ) : (
                  <div className="space-y-2 text-xs font-mono">
                    {analysis.elements.map((el, i) => (
                      <div
                        key={el.id}
                        className="p-2 bg-slate-50 dark:bg-slate-800/60 rounded border border-slate-200 dark:border-slate-700 flex items-center justify-between"
                      >
                        <span className="text-blue-600 dark:text-blue-400 font-bold uppercase">
                          #{i + 1} {el.type}
                        </span>
                        <span className="text-slate-600 dark:text-slate-400 truncate max-w-md">
                          {el.text || (el.tableData ? `Tabla (${el.tableData.rows.length} filas)` : 'Objeto')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
