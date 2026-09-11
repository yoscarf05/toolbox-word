import React, { useState } from 'react';
import JSZip from 'jszip';
import { Language } from '../types';
import { getTranslation } from '../i18n';
import { 
  UploadCloud, 
  Download, 
  RefreshCw, 
  CheckCircle, 
  Copy, 
  Check, 
  FileArchive, 
  ShieldCheck, 
  Code 
} from 'lucide-react';

interface FaviconGeneratorToolProps {
  lang: Language;
}

const FAVICON_SIZES = [
  { size: 16, name: 'favicon-16x16.png', desc: 'Navegadores de escritorio' },
  { size: 32, name: 'favicon-32x32.png', desc: 'Pestañas de alta resolución' },
  { size: 48, name: 'favicon-48x48.png', desc: 'Atajos de escritorio' },
  { size: 180, name: 'apple-touch-icon.png', desc: 'iOS Apple Touch Icon' },
  { size: 192, name: 'android-chrome-192x192.png', desc: 'Android PWA Icon' },
  { size: 512, name: 'android-chrome-512x512.png', desc: 'Splash Screen PWA' },
];

export const FaviconGeneratorTool: React.FC<FaviconGeneratorToolProps> = ({ lang }) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [generatedIcons, setGeneratedIcons] = useState<{ size: number; name: string; url: string; blob: Blob }[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const handleFile = (f: File) => {
    if (!f.type.startsWith('image/')) return;
    setFile(f);
    const url = URL.createObjectURL(f);
    setPreviewUrl(url);
    generateAllFavicons(url);
  };

  const generateAllFavicons = async (srcUrl: string) => {
    setIsGenerating(true);
    const img = new Image();

    img.onload = async () => {
      const results: { size: number; name: string; url: string; blob: Blob }[] = [];

      for (const item of FAVICON_SIZES) {
        const canvas = document.createElement('canvas');
        canvas.width = item.size;
        canvas.height = item.size;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, item.size, item.size);

          const blob = await new Promise<Blob | null>((resolve) => {
            canvas.toBlob(resolve, 'image/png');
          });

          if (blob) {
            results.push({
              size: item.size,
              name: item.name,
              url: URL.createObjectURL(blob),
              blob
            });
          }
        }
      }

      setGeneratedIcons(results);
      setIsGenerating(false);
    };

    img.src = srcUrl;
  };

  const downloadZipPackage = async () => {
    if (generatedIcons.length === 0) return;
    const zip = new JSZip();

    // Add all icons
    for (const icon of generatedIcons) {
      zip.file(icon.name, icon.blob);
    }

    // Add HTML code snippet file
    const htmlSnippet = `<!-- Favicon & Touch Icons generados por ToolBox World -->
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="icon" type="image/png" sizes="192x192" href="/android-chrome-192x192.png">
<link rel="icon" type="image/png" sizes="512x512" href="/android-chrome-512x512.png">
<meta name="theme-color" content="#2563eb">
`;
    zip.file('README_HTML.txt', htmlSnippet);

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'favicon_package_toolbox.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const codeHtml = `<!-- Favicon & Icons para tu <head> -->
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">`;

  const copyHtmlSnippet = () => {
    navigator.clipboard.writeText(codeHtml);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="p-6 sm:p-10">
      <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          <ShieldCheck className="w-4 h-4" />
          <span>{lang === 'es' ? 'Generación local y empaquetado ZIP instantáneo' : 'Local generation & Instant ZIP package'}</span>
        </div>
        <span className="text-xs text-slate-400">16px a 512px</span>
      </div>

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
            {lang === 'es' ? 'Arrastra tu logotipo para generar favicons' : 'Drag your logo to create favicons'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-6">
            {lang === 'es' ? 'Recomendado: imagen cuadrada de 512x512 en PNG o JPG' : 'Recommended: square 512x512 image in PNG or JPG'}
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
          {/* Favicons previews */}
          <div>
            <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              {lang === 'es' ? 'Formatos generados listos para producción:' : 'Generated production icons:'}
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {generatedIcons.map((ico) => (
                <div
                  key={ico.name}
                  className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center flex flex-col items-center justify-between"
                >
                  <div className="w-14 h-14 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center p-2 border border-slate-100 dark:border-slate-800">
                    <img src={ico.url} alt={ico.name} className="max-h-full max-w-full object-contain" />
                  </div>
                  <div className="mt-2">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{ico.size}×{ico.size}</p>
                    <p className="text-[10px] text-slate-400 truncate max-w-[80px]">{ico.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* HTML Snippet block */}
          <div className="p-4 rounded-2xl bg-slate-900 text-slate-200 border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5 text-blue-400" />
                HTML Head Snippet
              </span>
              <button
                onClick={copyHtmlSnippet}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-mono text-blue-400 flex items-center gap-1 transition-colors"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'Copiado' : 'Copiar'}</span>
              </button>
            </div>
            <pre className="text-xs font-mono overflow-x-auto text-slate-300">
              {codeHtml}
            </pre>
          </div>

          {/* Download buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={downloadZipPackage}
              disabled={isGenerating || generatedIcons.length === 0}
              className="px-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <FileArchive className="w-4 h-4" />
              <span>{lang === 'es' ? 'Descargar Paquete ZIP Completo' : 'Download Complete ZIP Package'}</span>
            </button>
            <button
              onClick={() => {
                setFile(null);
                setPreviewUrl(null);
                setGeneratedIcons([]);
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
