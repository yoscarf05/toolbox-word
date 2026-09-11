import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Language } from '../types';
import { getTranslation } from '../i18n';
import { 
  Wifi, 
  Download, 
  Printer, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  Lock, 
  Copy, 
  Check 
} from 'lucide-react';

interface QrWifiToolProps {
  lang: Language;
}

export const QrWifiTool: React.FC<QrWifiToolProps> = ({ lang }) => {
  const [ssid, setSsid] = useState('MiRedWiFi');
  const [password, setPassword] = useState('');
  const [encryption, setEncryption] = useState<'WPA' | 'WEP' | 'nopass'>('WPA');
  const [hidden, setHidden] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [qrUrl, setQrUrl] = useState('');

  // Standard WIFI schema: WIFI:T:WPA;S:MyNetwork;P:MyPassword;H:false;;
  useEffect(() => {
    if (!ssid.trim()) {
      setQrUrl('');
      return;
    }

    const payload = `WIFI:T:${encryption};S:${ssid};P:${password};H:${hidden ? 'true' : 'false'};;`;

    QRCode.toDataURL(payload, {
      width: 400,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    })
      .then((url) => setQrUrl(url))
      .catch((err) => console.error(err));
  }, [ssid, password, encryption, hidden]);

  const handleDownload = () => {
    if (!qrUrl) return;
    const a = document.createElement('a');
    a.href = qrUrl;
    a.download = `wifi_qr_${ssid.replace(/\s+/g, '_')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 sm:p-10">
      <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          <ShieldCheck className="w-4 h-4" />
          <span>{lang === 'es' ? 'Tu contraseña nunca sale de tu navegador' : 'Your password never leaves your device'}</span>
        </div>
        <span className="text-xs text-slate-400">WPA / WPA2 / WPA3</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form Inputs (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              {lang === 'es' ? 'Nombre de la red (SSID):' : 'Network Name (SSID):'}
            </label>
            <div className="relative">
              <input
                type="text"
                value={ssid}
                onChange={(e) => setSsid(e.target.value)}
                placeholder="Nombre exacto del router"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white"
              />
              <Wifi className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              {lang === 'es' ? 'Contraseña de la red:' : 'WiFi Password:'}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={encryption === 'nopass' ? 'Sin contraseña (red abierta)' : 'Clave del WiFi'}
                disabled={encryption === 'nopass'}
                className="w-full pl-10 pr-10 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white disabled:opacity-50"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              {encryption !== 'nopass' && (
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                {lang === 'es' ? 'Tipo de seguridad:' : 'Encryption Type:'}
              </label>
              <select
                value={encryption}
                onChange={(e) => setEncryption(e.target.value as any)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                <option value="WPA">WPA / WPA2 / WPA3 (Predeterminado)</option>
                <option value="WEP">WEP (Antiguo)</option>
                <option value="nopass">Sin contraseña (Abierta)</option>
              </select>
            </div>

            <div className="flex items-center pt-6">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={hidden}
                  onChange={(e) => setHidden(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  {lang === 'es' ? 'Red oculta (Hidden SSID)' : 'Hidden Network'}
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Right Printable Guest Card (5 cols) */}
        <div className="lg:col-span-5 flex flex-col items-center">
          {/* Printable Card container */}
          <div 
            id="printable-wifi-card"
            className="w-full max-w-sm p-6 rounded-3xl bg-white border-2 border-slate-900 shadow-xl text-slate-900 text-center space-y-4 print:border-none print:shadow-none"
          >
            <div className="flex items-center justify-center gap-2">
              <div className="p-2 rounded-xl bg-blue-600 text-white">
                <Wifi className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-base tracking-tight">
                WiFi para Invitados
              </span>
            </div>

            <p className="text-xs text-slate-500">
              {lang === 'es' ? 'Apunta la cámara de tu móvil para conectarte:' : 'Scan with your camera to join:'}
            </p>

            <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-inner flex items-center justify-center">
              {qrUrl ? (
                <img src={qrUrl} alt="WiFi QR" className="w-48 h-48 object-contain" />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center text-slate-300">
                  <Wifi className="w-12 h-12" />
                </div>
              )}
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 space-y-1">
              <p><span className="font-bold">Red:</span> {ssid || '—'}</p>
              {password && (
                <p><span className="font-bold">Clave:</span> {password}</p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
            <button
              onClick={handleDownload}
              disabled={!qrUrl}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{lang === 'es' ? 'Descargar PNG' : 'Download PNG'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>{lang === 'es' ? 'Imprimir Tarjeta' : 'Print Card'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
