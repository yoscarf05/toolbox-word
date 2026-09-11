import React, { useState, useEffect } from 'react';
import { Language } from '../types';
import { ensurePdfWorker } from '../utils/pdfWorker';
import {
  extractStructuredPdf,
  buildCompliantDocx,
  validateDocxBlob,
  PdfDocumentAnalysis,
  DocxGenerationOptions,
} from '../utils/pdfConverter';
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
  AlertTriangle,
  Info,
  BookOpen
} from 'lucide-react';

interface PdfToWordToolProps {
  lang: Language;
}

export const PdfToWordTool: React.FC<PdfToWordToolProps> = ({ lang }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressStatus, setProgressStatus] = useState('');
  const [analysis, setAnalysis] = useState<PdfDocumentAnalysis | null>(null);
  const [docxBlob, setDocxBlob] = useState<Blob | null>(null);
  const [validationInfo, setValidationInfo] = useState<{ isValid: boolean; entryCount?: number; byteSize: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewTab, setPreviewTab] = useState<'reading' | 'structure'>('reading');

  // Conversion options
  const [fontFamily, setFontFamily] = useState<'Calibri' | 'Arial' | 'Times New Roman' | 'Aptos'>('Calibri');
  const [lineSpacing, setLineSpacing] = useState<number>(1.25);
  const [includePageBreaks, setIncludePageBreaks] = useState(true);
  const [addHeaderInfo, setAddHeaderInfo] = useState(false);

  useEffect(() => {
    ensurePdfWorker();
  }, []);

  const handleFileChange = async (selectedFile: File) => {
    const isPdfExt = selectedFile.name.toLowerCase().endsWith('.pdf');
    const isPdfMime = selectedFile.type.toLowerCase().includes('pdf') || selectedFile.type === '';

    if (!isPdfExt && !isPdfMime) {
      setError(
        lang === 'es'
          ? 'Por favor selecciona un archivo PDF válido (.pdf).'
          : 'Please select a valid PDF file (.pdf).'
      );
      return;
    }

    if (selectedFile.size === 0) {
      setError(
        lang === 'es'
          ? 'El archivo seleccionado está vacío (0 bytes).'
          : 'The selected file is empty (0 bytes).'
      );
      return;
    }

    const MAX_SIZE_MB = 100;
    if (selectedFile.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(
        lang === 'es'
          ? `Este archivo supera el tamaño máximo permitido de ${MAX_SIZE_MB} MB.`
          : `This file exceeds the maximum allowed size of ${MAX_SIZE_MB} MB.`
      );
      return;
    }

    setError(null);
    setDocxBlob(null);
    setAnalysis(null);
    setValidationInfo(null);
    setFile(selectedFile);
  };

  const handleConvert = async () => {
    if (!file) return;

    ensurePdfWorker();
    setIsProcessing(true);
    setProgress(5);
    setProgressStatus(lang === 'es' ? 'Leyendo estructura del archivo PDF...' : 'Reading PDF file structure...');
    setError(null);

    try {
      const arrayBuffer = await file.arrayBuffer();

      // Step 1: Extract and analyze structured content
      const analyzedDoc = await extractStructuredPdf(
        arrayBuffer,
        file.name,
        (pct, msg) => {
          setProgress(pct);
          setProgressStatus(
            lang === 'es'
              ? msg
              : msg
                  .replace('Cargando motor de lectura PDF...', 'Loading PDF engine...')
                  .replace('Extrayendo texto y estructura de la página', 'Extracting text and structure from page')
                  .replace('de', 'of')
          );
        }
      );

      setAnalysis(analyzedDoc);

      // Step 2: Build compliant Office Open XML document
      const options: DocxGenerationOptions = {
        fontFamily,
        includePageBreaks,
        addHeaderInfo,
        lineSpacingMultiplier: lineSpacing,
      };

      const generatedBlob = await buildCompliantDocx(
        analyzedDoc,
        options,
        (pct, msg) => {
          setProgress(pct);
          setProgressStatus(
            lang === 'es'
              ? msg
              : msg
                  .replace('Construyendo estructura Office Open XML...', 'Building Office Open XML structure...')
                  .replace('Empaquetando archivo binario DOCX (.docx)...', 'Packaging binary DOCX file (.docx)...')
          );
        }
      );

      // Step 3: Rigorously validate the generated DOCX blob
      setProgress(95);
      setProgressStatus(
        lang === 'es'
          ? 'Validando integridad del contenedor OpenXML...'
          : 'Validating OpenXML container integrity...'
      );

      const validation = await validateDocxBlob(generatedBlob);
      if (!validation.isValid) {
        throw new Error(
          validation.error ||
            (lang === 'es'
              ? 'La validación del archivo DOCX generado no fue satisfactoria.'
              : 'The generated DOCX validation failed.')
        );
      }

      setValidationInfo(validation);
      setDocxBlob(generatedBlob);
      setProgress(100);
      setProgressStatus(
        lang === 'es'
          ? '¡Documento Word (.docx) generado y validado con éxito!'
          : 'Word document (.docx) generated and verified successfully!'
      );
    } catch (err: any) {
      console.error('Error converting PDF to Word:', err);
      setError(
        err?.message ||
          (lang === 'es'
            ? 'No se pudo completar la conversión del archivo PDF. Verifica que el archivo no esté protegido con contraseña o dañado.'
            : 'Could not complete PDF to Word conversion. Please check that the file is not corrupted or password protected.')
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const getCleanDownloadName = (): string => {
    if (!file) return 'documento.docx';
    const base = file.name.replace(/\.[^/.]+$/, '');
    return `${base}.docx`;
  };

  const handleDownload = () => {
    if (!docxBlob || !file) return;

    // Use exact standard MIME type for Word 2007+ documents
    const url = URL.createObjectURL(docxBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = getCleanDownloadName();
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setFile(null);
    setDocxBlob(null);
    setAnalysis(null);
    setValidationInfo(null);
    setProgress(0);
    setProgressStatus('');
    setError(null);
  };

  return (
    <div className="p-6 sm:p-10 max-w-5xl mx-auto">
      {/* Privacy & Standards Badge */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-6 mb-8 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span>
            {lang === 'es'
              ? 'Conversión 100% local en tu navegador (Tus documentos nunca salen de tu equipo)'
              : '100% local in-browser conversion (Your documents never leave your computer)'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
            {lang === 'es' ? 'Motor Oficial Office Open XML (.docx)' : 'Official Office Open XML (.docx) Engine'}
          </span>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs sm:text-sm font-semibold flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div className="flex-1 leading-relaxed">{error}</div>
        </div>
      )}

      {/* Upload State */}
      {!file ? (
        <div className="space-y-8">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files[0]) handleFileChange(e.dataTransfer.files[0]);
            }}
            className="border-2 border-dashed border-blue-300 dark:border-blue-800/60 hover:border-blue-500 rounded-3xl p-8 sm:p-14 text-center transition-all bg-gradient-to-b from-blue-50/40 to-slate-50/30 dark:from-blue-950/20 dark:to-slate-900/40 group cursor-pointer"
            onClick={() => {
              const input = document.getElementById('pdf-word-upload-input');
              input?.click();
            }}
          >
            <input
              id="pdf-word-upload-input"
              type="file"
              accept=".pdf,application/pdf"
              onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
              className="hidden"
            />

            <div className="mx-auto w-20 h-20 rounded-3xl bg-blue-600 text-white flex items-center justify-center mb-5 shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-transform">
              <UploadCloud className="w-10 h-10" />
            </div>

            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mb-2">
              {lang === 'es'
                ? 'Arrastra tu archivo PDF aquí o pulsa para seleccionarlo'
                : 'Drag your PDF file here or click to browse'}
            </h3>

            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-lg mx-auto mb-6 leading-relaxed">
              {lang === 'es'
                ? 'Genera un documento Word (.docx) estándar 100% compatible con Microsoft Word, Microsoft 365, Word Online, LibreOffice y Google Docs. Extrae párrafos, títulos, listas y tablas.'
                : 'Generates a standard Word (.docx) document 100% compatible with Word, Microsoft 365, Word Online, LibreOffice, and Google Docs. Preserves paragraphs, headings, lists, and tables.'}
            </p>

            <div className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-all">
              <FileType className="w-4 h-4" />
              <span>{lang === 'es' ? 'Seleccionar archivo PDF' : 'Select PDF File'}</span>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-200/60 dark:border-slate-800/80 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-blue-500" />
                {lang === 'es' ? 'Microsoft Word 2013-2024 y Office 365' : 'Microsoft Word 2013-2024 & Office 365'}
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                {lang === 'es' ? 'Sin errores de apertura de archivo' : 'Zero file opening errors'}
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-purple-500" />
                {lang === 'es' ? '100% Confidencial y seguro' : '100% Confidential & secure'}
              </span>
            </div>
          </div>

          {/* Standards & Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
                <FileCheck className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                {lang === 'es' ? 'Office Open XML Genuino' : 'Genuine Office Open XML'}
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                {lang === 'es'
                  ? 'Construye un contenedor ZIP OpenXML real con word/document.xml y esquemas ISO/IEC 29500 validados.'
                  : 'Builds a true OpenXML ZIP container with word/document.xml and validated ISO/IEC 29500 schemas.'}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
                <TableIcon className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                {lang === 'es' ? 'Estructura y Tablas' : 'Structure & Tables'}
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                {lang === 'es'
                  ? 'Reconstruye párrafos limpios, títulos por tamaño tipográfico, listas numeradas y tablas tabulares editables.'
                  : 'Reconstructs clean paragraphs, headings by font scale, numbered lists, and editable tabular tables.'}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-3">
                <Sparkles className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                {lang === 'es' ? 'Sanitización Estricta' : 'Strict Sanitization'}
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                {lang === 'es'
                  ? 'Limpia caracteres de control y flujos binarios para garantizar que Microsoft Word nunca arroje advertencias.'
                  : 'Sanitizes control chars and binary streams to ensure Microsoft Word opens without warnings.'}
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* File Loaded State */
        <div className="space-y-6">
          {/* File Information Card */}
          <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white truncate max-w-xs sm:max-w-md">
                  {file.name}
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB • {analysis ? `${analysis.pageCount} ${lang === 'es' ? 'páginas' : 'pages'}` : 'PDF'}
                  {analysis && analysis.totalWords > 0 && ` • ${analysis.totalWords} ${lang === 'es' ? 'palabras' : 'words'}`}
                </p>
                {analysis && (
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    {analysis.hasCoverPage && (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                        {lang === 'es' ? 'Portada' : 'Cover Page'}
                      </span>
                    )}
                    {analysis.hasMultiColumns && (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                        {lang === 'es' ? 'Multi-columna' : 'Multi-column'}
                      </span>
                    )}
                    {analysis.hasTables && (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                        {lang === 'es' ? 'Tablas' : 'Tables'}
                      </span>
                    )}
                    {analysis.hasFormulas && (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                        {lang === 'es' ? 'Fórmulas' : 'Formulas'}
                      </span>
                    )}
                    {analysis.hasImages && (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                        {lang === 'es' ? 'Imágenes' : 'Images'}
                      </span>
                    )}
                    {analysis.hasDiagrams && (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300">
                        {lang === 'es' ? 'Gráficos/Diagramas' : 'Diagrams'}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleReset}
              disabled={isProcessing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors self-start sm:self-center cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              {lang === 'es' ? 'Cambiar archivo' : 'Change file'}
            </button>
          </div>

          {/* Options Panel */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-blue-500" />
                <span>{lang === 'es' ? 'Configuración del documento Word (.docx)' : 'Word (.docx) Document Settings'}</span>
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {lang === 'es' ? 'Tipografía principal:' : 'Primary font:'}
                </label>
                <select
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                >
                  <option value="Calibri">Calibri (Microsoft Office Estándar)</option>
                  <option value="Aptos">Aptos (Nuevo estándar Office 365)</option>
                  <option value="Arial">Arial (Legibilidad limpia)</option>
                  <option value="Times New Roman">Times New Roman (Académico / Formal)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {lang === 'es' ? 'Interlineado:' : 'Line spacing:'}
                </label>
                <select
                  value={lineSpacing}
                  onChange={(e) => setLineSpacing(parseFloat(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                >
                  <option value="1.15">1.15 (Estándar compacto)</option>
                  <option value="1.25">1.25 (Lectura balanceada)</option>
                  <option value="1.5">1.50 (Estilo académico / tesis)</option>
                </select>
              </div>

              <div className="flex flex-col justify-center gap-2 sm:col-span-2 lg:col-span-1">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includePageBreaks}
                    onChange={(e) => setIncludePageBreaks(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                  />
                  <span>{lang === 'es' ? 'Conservar saltos de página del PDF' : 'Preserve PDF page breaks'}</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={addHeaderInfo}
                    onChange={(e) => setAddHeaderInfo(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                  />
                  <span>{lang === 'es' ? 'Incluir título del documento en portada' : 'Include document title header'}</span>
                </label>
              </div>
            </div>
          </div>

          {/* Conversion Progress Bar */}
          {isProcessing && (
            <div className="p-6 rounded-3xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-blue-700 dark:text-blue-300">
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  {progressStatus}
                </span>
                <span>{progress}%</span>
              </div>
              <div className="w-full h-2.5 bg-blue-200/50 dark:bg-blue-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Conversion Action */}
          {!docxBlob ? (
            <div className="flex justify-center pt-2">
              <button
                onClick={handleConvert}
                disabled={isProcessing}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold text-sm shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <FileType className="w-5 h-5" />
                <span>
                  {isProcessing
                    ? (lang === 'es' ? 'Procesando conversión...' : 'Processing conversion...')
                    : (lang === 'es' ? 'Convertir PDF a Word DOCX' : 'Convert PDF to Word DOCX')}
                </span>
              </button>
            </div>
          ) : (
            <div className="w-full space-y-6">
              {/* Scanned Document Alert Notice (if applicable) */}
              {analysis?.isEntirelyScanned && (
                <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-300 text-xs sm:text-sm space-y-2">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                    <span>{lang === 'es' ? 'Documento escaneado detectado' : 'Scanned document detected'}</span>
                  </div>
                  <p className="leading-relaxed">
                    {lang === 'es'
                      ? 'Este archivo PDF está compuesto por imágenes escaneadas sin capa de texto digital seleccionable. Para extraer texto editable de imágenes se requiere un software de OCR (Reconocimiento Óptico de Caracteres). Para no generar un archivo corrupto ni colocar bytes ilegibles, el documento Word generado incluye la estructura formal de las páginas con un aviso explicativo.'
                      : 'This PDF consists of scanned images without a selectable digital text layer. Extracting editable text from images requires OCR (Optical Character Recognition). To prevent generating a corrupted file or dumping illegible bytes, the generated Word document includes page structure with explanatory notices.'}
                  </p>
                </div>
              )}

              {/* Ready to Download Success Card */}
              <div className="p-6 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {lang === 'es'
                      ? '¡Documento Word (.docx) listo para descargar!'
                      : 'Word document (.docx) ready for download!'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                    {lang === 'es'
                      ? 'Generado como un archivo Office Open XML nativo y validado antes de la descarga para garantizar total compatibilidad con Microsoft Word.'
                      : 'Generated as a native Office Open XML file and validated before download to ensure complete compatibility with Microsoft Word.'}
                  </p>
                </div>

                {/* Validation Badge */}
                {validationInfo && (
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100/70 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200 text-xs font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>
                      {lang === 'es'
                        ? `Validado: ${validationInfo.entryCount} componentes OpenXML • ${(validationInfo.byteSize / 1024).toFixed(1)} KB`
                        : `Verified: ${validationInfo.entryCount} OpenXML parts • ${(validationInfo.byteSize / 1024).toFixed(1)} KB`}
                    </span>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    onClick={handleDownload}
                    className="px-8 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-lg shadow-emerald-600/25 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Download className="w-5 h-5" />
                    <span>
                      {lang === 'es'
                        ? `Descargar "${getCleanDownloadName()}"`
                        : `Download "${getCleanDownloadName()}"`}
                    </span>
                  </button>

                  <button
                    onClick={handleReset}
                    className="px-5 py-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-50 transition-all cursor-pointer"
                  >
                    {lang === 'es' ? 'Convertir otro PDF' : 'Convert another PDF'}
                  </button>
                </div>
              </div>

              {/* Document Preview Panel */}
              {analysis && (
                <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-blue-500" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                        {lang === 'es' ? 'Vista previa del documento generado' : 'Generated Document Preview'}
                      </h4>
                    </div>

                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
                      <button
                        onClick={() => setPreviewTab('reading')}
                        className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                          previewTab === 'reading'
                            ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                            : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                      >
                        {lang === 'es' ? 'Formato Word' : 'Word Layout'}
                      </button>
                      <button
                        onClick={() => setPreviewTab('structure')}
                        className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                          previewTab === 'structure'
                            ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                            : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                      >
                        {lang === 'es' ? 'Estructura Detectada' : 'Detected Structure'}
                      </button>
                    </div>
                  </div>

                  {/* Tab 1: Reading / Formatted Word Layout */}
                  {previewTab === 'reading' && (
                    <div className="max-h-96 overflow-y-auto p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-4 font-sans">
                      {/* Document Header preview */}
                      {addHeaderInfo && (
                        <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
                          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                            {analysis.metadata?.title || file.name.replace(/\.[^/.]+$/, '')}
                          </h2>
                          <p className="text-[11px] text-slate-400 italic mt-0.5">
                            {analysis.pageCount} {lang === 'es' ? 'páginas' : 'pages'}
                          </p>
                        </div>
                      )}

                      {/* Elements Rendered */}
                      {analysis.allElements.length === 0 ? (
                        <div className="text-center py-8 text-slate-400 text-xs italic">
                          {lang === 'es'
                            ? 'No se detectó capa de texto seleccionable en este documento (PDF escaneado).'
                            : 'No selectable text layer was detected in this document (scanned PDF).'}
                        </div>
                      ) : (
                        analysis.allElements.slice(0, 40).map((el) => {
                          switch (el.type) {
                            case 'heading1':
                              return (
                                <h3 key={el.id} className="text-lg font-bold text-slate-900 dark:text-white pt-2">
                                  {el.text}
                                </h3>
                              );
                            case 'heading2':
                              return (
                                <h4 key={el.id} className="text-base font-bold text-slate-800 dark:text-slate-100 pt-1.5">
                                  {el.text}
                                </h4>
                              );
                            case 'heading3':
                              return (
                                <h5 key={el.id} className="text-sm font-semibold text-slate-800 dark:text-slate-200 pt-1">
                                  {el.text}
                                </h5>
                              );
                            case 'image':
                              return (
                                <div key={el.id} className="my-3 p-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold text-xs">
                                    IMG
                                  </div>
                                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                                    {lang === 'es' ? 'Imagen incrustada preservada' : 'Preserved embedded image'} ({el.imageWidth || 400} × {el.imageHeight || 250} pt)
                                  </span>
                                </div>
                              );
                            case 'formula':
                              return (
                                <div key={el.id} className="my-2.5 p-3 rounded-xl bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-center">
                                  <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100 tracking-wide">
                                    {el.text}
                                  </span>
                                  <span className="text-[10px] text-slate-400 block mt-0.5">
                                    {lang === 'es' ? 'Fórmula matemática detectada' : 'Detected mathematical formula'}
                                  </span>
                                </div>
                              );
                            case 'bullet_list':
                            case 'numbered_list':
                              return (
                                <div key={el.id} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300 pl-2">
                                  <span className="text-blue-500 font-bold shrink-0">{el.listPrefix || '•'}</span>
                                  <span className="leading-relaxed">{el.text}</span>
                                </div>
                              );
                            case 'table':
                              return (
                                <div key={el.id} className="my-3 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                                  <table className="w-full text-xs text-left border-collapse">
                                    <tbody>
                                      {el.tableRows?.map((row, rIdx) => (
                                        <tr
                                          key={rIdx}
                                          className={
                                            rIdx === 0
                                              ? 'bg-slate-100 dark:bg-slate-800/80 font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700'
                                              : 'border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/50'
                                          }
                                        >
                                          {row.map((cell, cIdx) => (
                                            <td key={cIdx} className="p-2.5">
                                              {cell}
                                            </td>
                                          ))}
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              );
                            case 'paragraph':
                            default:
                              return (
                                <p key={el.id} className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                                  {el.text}
                                </p>
                              );
                          }
                        })
                      )}

                      {analysis.allElements.length > 40 && (
                        <p className="text-[11px] text-slate-400 italic text-center pt-3 border-t border-slate-200/40 dark:border-slate-800">
                          {lang === 'es'
                            ? `... y ${analysis.allElements.length - 40} elementos más estructurados en el archivo Word .docx descargado.`
                            : `... and ${analysis.allElements.length - 40} more structured elements in your downloaded .docx file.`}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Tab 2: Structure Breakdown */}
                  {previewTab === 'structure' && (
                    <div className="max-h-96 overflow-y-auto p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 mb-3">
                        <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                          <span className="text-[11px] text-slate-400 block">{lang === 'es' ? 'Páginas' : 'Pages'}</span>
                          <span className="text-base font-extrabold text-slate-800 dark:text-slate-100">
                            {analysis.pageCount}
                          </span>
                        </div>
                        <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                          <span className="text-[11px] text-slate-400 block">{lang === 'es' ? 'Palabras' : 'Words'}</span>
                          <span className="text-base font-extrabold text-slate-800 dark:text-slate-100">
                            {analysis.totalWords}
                          </span>
                        </div>
                        <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                          <span className="text-[11px] text-slate-400 block">{lang === 'es' ? 'Imágenes' : 'Images'}</span>
                          <span className="text-base font-extrabold text-slate-800 dark:text-slate-100">
                            {analysis.imageCount || analysis.allElements.filter((e) => e.type === 'image').length}
                          </span>
                        </div>
                        <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                          <span className="text-[11px] text-slate-400 block">{lang === 'es' ? 'Tablas' : 'Tables'}</span>
                          <span className="text-base font-extrabold text-slate-800 dark:text-slate-100">
                            {analysis.tableCount || analysis.allElements.filter((e) => e.type === 'table').length}
                          </span>
                        </div>
                        <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                          <span className="text-[11px] text-slate-400 block">{lang === 'es' ? 'Listas' : 'Lists'}</span>
                          <span className="text-base font-extrabold text-slate-800 dark:text-slate-100">
                            {analysis.allElements.filter((e) => e.type === 'bullet_list' || e.type === 'numbered_list').length}
                          </span>
                        </div>
                        <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                          <span className="text-[11px] text-slate-400 block">{lang === 'es' ? 'Fórmulas' : 'Formulas'}</span>
                          <span className="text-base font-extrabold text-slate-800 dark:text-slate-100">
                            {analysis.formulaCount || analysis.allElements.filter((e) => e.type === 'formula').length}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {analysis.pages.map((p) => (
                          <div
                            key={p.pageNumber}
                            className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                          >
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              {lang === 'es' ? `Página ${p.pageNumber}` : `Page ${p.pageNumber}`}
                            </span>
                            <span className="text-slate-500">
                              {p.isScanned
                                ? (lang === 'es' ? 'Página escaneada / Imagen' : 'Scanned page / Image')
                                : `${p.wordCount} ${lang === 'es' ? 'palabras' : 'words'} • ${p.elements.length} ${lang === 'es' ? 'bloques' : 'blocks'}`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
