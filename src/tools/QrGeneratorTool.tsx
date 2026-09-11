import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { Language } from '../types';
import { getTranslation } from '../i18n';
import { 
  Download, 
  Copy, 
  Check, 
  QrCode as QrIcon, 
  Palette, 
  ShieldCheck, 
  Link, 
  Mail, 
  Phone, 
  Type 
} from 'lucide-react';

interface QrGeneratorToolProps {
  lang: Language;
}

export const QrGeneratorTool: React.FC<QrGeneratorToolProps> = ({ lang }) => {
  const [qrType, setQrType] = useState<'url' | 'text' | 'email' | 'phone'>('url');
  const [content, setContent] = useState('https://toolbox.world');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  
  const [fgColor, setFgColor] = useState('#0f172a');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [correctionLevel, setCorrectionLevel] = useState<'L' | 'M' | 'Q' | 'H'>('M');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // Compute raw payload based on type
  const getRawPayload = () => {
    if (qrType === 'url') {
      return content.startsWith('http://') || content.startsWith('https://') ? content : `https://${content}`;
    }
    if (qrType === 'email') {
      const encSub = encodeURIComponent(emailSubject);
      const encBody = encodeURIComponent(emailBody);
      return `mailto:${content}?subject=${encSub}&body=${encBody}`;
    }
    if (qrType === 'phone') {
      return `tel:${content}`;
    }
    return content;
  };

  useEffect(() => {
    const raw = getRawPayload();
    if (!raw.trim()) {
      setQrDataUrl('');
      return;
    }

    QRCode.toDataURL(raw, {
      errorCorrectionLevel: correctionLevel,
      margin: 2,
      width: 400,
      color: {
        dark: fgColor,
        light: bgColor
      }
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error(err));
  }, [content, emailSubject, emailBody, qrType, fgColor, bgColor, correctionLevel]);

  const handleDownloadPng = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `codigo_qr_toolbox_${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopyImage = async () => {
    if (!qrDataUrl) return;
    try {
      const res = await fetch(qrDataUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-6 sm:p-10">
      <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          <ShieldCheck className="w-4 h-4" />
          <span>{lang === 'es' ? 'QR estático y permanente (Sin caducidad ni enlaces intermedios)' : 'Static & Permanent QR (Never expires)'}</span>
        </div>
        <span className="text-xs text-slate-400">{lang === 'es' ? 'Alta Resolución' : 'High Resolution'}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form: Content and Options (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Type Selector Tabs */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              {lang === 'es' ? 'Tipo de contenido:' : 'Content type:'}
            </label>
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => { setQrType('url'); setContent('https://'); }}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                  qrType === 'url'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Link className="w-3.5 h-3.5" />
                <span>Web URL</span>
              </button>
              <button
                type="button"
                onClick={() => { setQrType('text'); setContent(''); }}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                  qrType === 'text'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Type className="w-3.5 h-3.5" />
                <span>{lang === 'es' ? 'Texto' : 'Text'}</span>
              </button>
              <button
                type="button"
                onClick={() => { setQrType('email'); setContent(''); }}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                  qrType === 'email'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Email</span>
              </button>
              <button
                type="button"
                onClick={() => { setQrType('phone'); setContent('+1'); }}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                  qrType === 'phone'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Phone className="w-3.5 h-3.5" />
                <span>{lang === 'es' ? 'Teléfono' : 'Phone'}</span>
              </button>
            </div>
          </div>

          {/* Inputs based on type */}
          <div>
            {qrType === 'url' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {lang === 'es' ? 'Dirección web o enlace:' : 'Website URL:'}
                </label>
                <input
                  type="url"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="https://ejemplo.com"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {qrType === 'text' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {lang === 'es' ? 'Texto o mensaje:' : 'Text message:'}
                </label>
                <textarea
                  rows={3}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={lang === 'es' ? 'Escribe aquí tu mensaje o datos...' : 'Enter your text or note...'}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {qrType === 'email' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'es' ? 'Correo destinatario:' : 'Recipient email:'}
                  </label>
                  <input
                    type="email"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="contacto@ejemplo.com"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'es' ? 'Asunto predeterminado:' : 'Subject:'}
                  </label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder={lang === 'es' ? 'Consulta sobre servicios' : 'Inquiry'}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            )}

            {qrType === 'phone' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {lang === 'es' ? 'Número de teléfono (con código de país):' : 'Phone number (with country code):'}
                </label>
                <input
                  type="tel"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="+34 600 000 000"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white"
                />
              </div>
            )}
          </div>

          {/* Style Customization (Colors and Correction Level) */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
              <Palette className="w-4 h-4 text-blue-600" />
              <span>{lang === 'es' ? 'Personalización visual:' : 'Visual customization:'}</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  {lang === 'es' ? 'Color del código (Oscuro):' : 'Code color (Foreground):'}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="w-9 h-9 rounded-lg border border-slate-300 dark:border-slate-600 cursor-pointer p-0.5 bg-white"
                  />
                  <span className="text-xs font-mono text-slate-700 dark:text-slate-300">{fgColor}</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  {lang === 'es' ? 'Color de fondo (Claro):' : 'Background color:'}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-9 h-9 rounded-lg border border-slate-300 dark:border-slate-600 cursor-pointer p-0.5 bg-white"
                  />
                  <span className="text-xs font-mono text-slate-700 dark:text-slate-300">{bgColor}</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                {lang === 'es' ? 'Corrección de error (Legibilidad si se imprime o daña):' : 'Error Correction Level:'}
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(['L', 'M', 'Q', 'H'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setCorrectionLevel(lvl)}
                    className={`py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                      correctionLevel === lvl
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {lvl === 'L' && '7% (L)'}
                    {lvl === 'M' && '15% (M)'}
                    {lvl === 'Q' && '25% (Q)'}
                    {lvl === 'H' && '30% (H)'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Card: Live QR Preview & Download (5 cols) */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-center space-y-5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {lang === 'es' ? 'Vista previa en tiempo real' : 'Live Preview'}
          </span>

          <div 
            className="p-4 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 bg-white"
            style={{ backgroundColor: bgColor }}
          >
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="QR Code" className="w-56 h-56 object-contain" />
            ) : (
              <div className="w-56 h-56 flex items-center justify-center text-slate-400">
                <QrIcon className="w-12 h-12 stroke-1" />
              </div>
            )}
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
            {lang === 'es'
              ? 'Código QR estático directo. Nunca expira ni redirige a servicios de terceros.'
              : 'Direct static QR code. Never expires and contains no third-party tracking.'}
          </p>

          <div className="flex flex-col sm:flex-row gap-2.5 w-full max-w-xs">
            <button
              onClick={handleDownloadPng}
              disabled={!qrDataUrl}
              className="flex-1 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{lang === 'es' ? 'Descargar PNG' : 'Download PNG'}</span>
            </button>
            <button
              onClick={handleCopyImage}
              disabled={!qrDataUrl}
              className="px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copiado' : 'Copiar'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
