import React, { useState } from 'react';
import { PDFDocument, PageSizes } from 'pdf-lib';
import { Language } from '../types';
import { getTranslation } from '../i18n';
import { 
  UploadCloud, 
  Image as ImageIcon, 
  Download, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  ShieldCheck, 
  Trash2,
  Plus
} from 'lucide-react';

interface JpgToPdfToolProps {
  lang: Language;
}

interface ImageItem {
  id: string;
  file: File;
  name: string;
  previewUrl: string;
}

export const JpgToPdfTool: React.FC<JpgToPdfToolProps> = ({ lang }) => {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [margin, setMargin] = useState<'none' | 'small' | 'large'>('small');
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAddImages = (fileList: FileList | File[]) => {
    setError(null);
    const valid: ImageItem[] = [];
    Array.from(fileList).forEach((f) => {
      if (f.type.startsWith('image/')) {
        valid.push({
          id: Math.random().toString(36).substring(2, 9),
          file: f,
          name: f.name,
          previewUrl: URL.createObjectURL(f)
        });
      }
    });

    if (valid.length === 0) {
      setError(lang === 'es' ? 'Selecciona imágenes válidas (JPG, PNG, WebP).' : 'Please select valid images (JPG, PNG, WebP).');
      return;
    }

    setImages((prev) => [...prev, ...valid]);
    setResultBlob(null);
  };

  const removeImage = (id: string) => {
    setImages(images.filter((img) => img.id !== id));
  };

  // Convert any image to JPEG/PNG bytes using canvas helper if needed
  const getCleanImageBytes = async (file: File): Promise<{ bytes: Uint8Array; format: 'jpg' | 'png' }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject('No canvas context');

        // Draw image on canvas to normalize format
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(
          async (blob) => {
            if (!blob) return reject('Failed to convert canvas to blob');
            const ab = await blob.arrayBuffer();
            resolve({ bytes: new Uint8Array(ab), format: 'jpg' });
          },
          'image/jpeg',
          0.92
        );
      };
      img.onerror = () => reject('Failed to load image');
      img.src = url;
    });
  };

  const handleConvert = async () => {
    if (images.length === 0) return;
    setIsProcessing(true);
    setError(null);

    try {
      const pdfDoc = await PDFDocument.create();

      const marginSize = margin === 'none' ? 0 : margin === 'small' ? 24 : 48;

      for (let i = 0; i < images.length; i++) {
        const item = images[i];
        const { bytes } = await getCleanImageBytes(item.file);
        const embedded = await pdfDoc.embedJpg(bytes);

        // Standard A4 dimensions: 595.28 x 841.89
        const pageWidth = orientation === 'portrait' ? PageSizes.A4[0] : PageSizes.A4[1];
        const pageHeight = orientation === 'portrait' ? PageSizes.A4[1] : PageSizes.A4[0];

        const page = pdfDoc.addPage([pageWidth, pageHeight]);

        const availWidth = pageWidth - marginSize * 2;
        const availHeight = pageHeight - marginSize * 2;

        const imgWidth = embedded.width;
        const imgHeight = embedded.height;

        const scale = Math.min(availWidth / imgWidth, availHeight / imgHeight, 1);

        const finalWidth = imgWidth * scale;
        const finalHeight = imgHeight * scale;

        const x = marginSize + (availWidth - finalWidth) / 2;
        const y = marginSize + (availHeight - finalHeight) / 2;

        page.drawImage(embedded, {
          x,
          y,
          width: finalWidth,
          height: finalHeight
        });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      setResultBlob(blob);
    } catch (err) {
      console.error(err);
      setError(lang === 'es' ? 'Error al generar el PDF.' : 'Error generating PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!resultBlob) return;
    const url = URL.createObjectURL(resultBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'imagenes_a_pdf_toolbox.pdf';
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
          <span>{lang === 'es' ? 'Conversión 100% en tu dispositivo' : '100% Client-side conversion'}</span>
        </div>
        <span className="text-xs text-slate-400">
          {images.length} {lang === 'es' ? 'fotos cargadas' : 'photos loaded'}
        </span>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {images.length === 0 ? (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleAddImages(e.dataTransfer.files);
          }}
          className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 rounded-3xl p-8 sm:p-14 text-center transition-colors bg-slate-50/50 dark:bg-slate-800/20 group"
        >
          <div className="mx-auto w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <UploadCloud className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">
            {lang === 'es' ? 'Arrastra tus fotos o imágenes JPG aquí' : 'Drag your JPG images here'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-6">
            {lang === 'es' ? 'o pulsa el botón para seleccionar desde tu galería' : 'or browse from your library'}
          </p>
          <label className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md transition-all cursor-pointer">
            <input
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/*"
              onChange={(e) => e.target.files && handleAddImages(e.target.files)}
              className="hidden"
            />
            {lang === 'es' ? 'Seleccionar imágenes' : 'Select images'}
          </label>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Thumbnails grid */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {lang === 'es' ? 'Páginas que se crearán:' : 'Pages to be created:'}
              </span>
              <label className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline cursor-pointer">
                <Plus className="w-3.5 h-3.5" />
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp,image/*"
                  onChange={(e) => e.target.files && handleAddImages(e.target.files)}
                  className="hidden"
                />
                {lang === 'es' ? 'Añadir más imágenes' : 'Add more images'}
              </label>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {images.map((img, idx) => (
                <div 
                  key={img.id}
                  className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 aspect-square"
                >
                  <img
                    src={img.previewUrl}
                    alt={img.name}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/70 text-white text-[10px] font-bold">
                    Pág {idx + 1}
                  </span>
                  <button
                    onClick={() => removeImage(img.id)}
                    className="absolute top-1.5 right-1.5 p-1 rounded-full bg-rose-600 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    title="Eliminar"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Options */}
          {!resultBlob && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  {lang === 'es' ? 'Orientación de página:' : 'Page orientation:'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setOrientation('portrait')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border transition-colors ${
                      orientation === 'portrait'
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {lang === 'es' ? 'Vertical (A4)' : 'Portrait (A4)'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrientation('landscape')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border transition-colors ${
                      orientation === 'landscape'
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {lang === 'es' ? 'Horizontal' : 'Landscape'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  {lang === 'es' ? 'Márgenes de página:' : 'Page margins:'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['none', 'small', 'large'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMargin(m)}
                      className={`py-2 px-2 rounded-lg text-xs font-bold border transition-colors ${
                        margin === m
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300'
                          : 'border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {m === 'none' && (lang === 'es' ? 'Sin margen' : 'None')}
                      {m === 'small' && (lang === 'es' ? 'Pequeño' : 'Small')}
                      {m === 'large' && (lang === 'es' ? 'Grande' : 'Large')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {!resultBlob && (
            <div className="pt-2 flex justify-center">
              <button
                onClick={handleConvert}
                disabled={isProcessing || images.length === 0}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{getTranslation(lang, 'processing')}</span>
                  </>
                ) : (
                  <span>{lang === 'es' ? 'Generar documento PDF' : 'Generate PDF document'}</span>
                )}
              </button>
            </div>
          )}

          {resultBlob && (
            <div className="p-6 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {lang === 'es' ? '¡PDF creado con éxito!' : 'PDF created successfully!'}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {images.length} {lang === 'es' ? 'páginas procesadas en alta definición.' : 'pages converted into PDF.'}
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
                    setImages([]);
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
