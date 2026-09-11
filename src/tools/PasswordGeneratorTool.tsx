import React, { useState, useEffect } from 'react';
import { Language } from '../types';
import { getTranslation } from '../i18n';
import { 
  KeyRound, 
  Copy, 
  Check, 
  RefreshCw, 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle2 
} from 'lucide-react';

interface PasswordGeneratorToolProps {
  lang: Language;
}

export const PasswordGeneratorTool: React.FC<PasswordGeneratorToolProps> = ({ lang }) => {
  const [length, setLength] = useState<number>(18);
  const [useUpper, setUseUpper] = useState<boolean>(true);
  const [useLower, setUseLower] = useState<boolean>(true);
  const [useNumbers, setUseNumbers] = useState<boolean>(true);
  const [useSymbols, setUseSymbols] = useState<boolean>(true);
  const [avoidAmbiguous, setAvoidAmbiguous] = useState<boolean>(false);

  const [password, setPassword] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  const generatePassword = () => {
    let charset = '';
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lower = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

    if (useUpper) charset += upper;
    if (useLower) charset += lower;
    if (useNumbers) charset += numbers;
    if (useSymbols) charset += symbols;

    if (avoidAmbiguous) {
      // Remove easily confused characters like O, 0, I, l, 1
      charset = charset.replace(/[O0Il1|]/g, '');
    }

    if (!charset) {
      setPassword('');
      return;
    }

    // Cryptographically secure random generation
    const randomArray = new Uint32Array(length);
    window.crypto.getRandomValues(randomArray);

    let result = '';
    for (let i = 0; i < length; i++) {
      result += charset[randomArray[i] % charset.length];
    }

    setPassword(result);
  };

  useEffect(() => {
    generatePassword();
  }, [length, useUpper, useLower, useNumbers, useSymbols, avoidAmbiguous]);

  const handleCopy = () => {
    if (!password) return;
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Estimate entropy in bits
  const entropy = Math.round(
    length *
      Math.log2(
        (useUpper ? 26 : 0) +
        (useLower ? 26 : 0) +
        (useNumbers ? 10 : 0) +
        (useSymbols ? 28 : 0) || 1
      )
  );

  const getStrengthLabel = () => {
    if (entropy < 45) return { text: lang === 'es' ? 'Débil' : 'Weak', color: 'text-rose-500', bg: 'bg-rose-500' };
    if (entropy < 70) return { text: lang === 'es' ? 'Media' : 'Moderate', color: 'text-amber-500', bg: 'bg-amber-500' };
    if (entropy < 95) return { text: lang === 'es' ? 'Fuerte' : 'Strong', color: 'text-emerald-500', bg: 'bg-emerald-500' };
    return { text: lang === 'es' ? 'Extremadamente Segura' : 'Very Strong', color: 'text-blue-500', bg: 'bg-blue-500' };
  };

  const strength = getStrengthLabel();

  return (
    <div className="p-6 sm:p-10">
      <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          <ShieldCheck className="w-4 h-4" />
          <span>{lang === 'es' ? 'Generado con WebCrypto CSPRNG (100% en tu memoria RAM)' : 'WebCrypto CSPRNG Generated (100% in RAM)'}</span>
        </div>
        <span className="text-xs font-mono font-bold text-slate-500">{entropy} bits de entropía</span>
      </div>

      {/* Password display card */}
      <div className="p-4 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 text-white mb-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="font-mono text-lg sm:text-2xl font-bold tracking-wider break-all text-blue-400">
            {password || '...'}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={generatePassword}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title={getTranslation(lang, 'generatePassword')}
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <button
              onClick={handleCopy}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? '¡Copiada!' : 'Copiar'}</span>
            </button>
          </div>
        </div>

        {/* Strength meter bar */}
        <div className="space-y-1 pt-2 border-t border-slate-800">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-slate-400">{lang === 'es' ? 'Nivel de seguridad:' : 'Security level:'}</span>
            <span className={strength.color}>{strength.text}</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${strength.bg}`}
              style={{ width: `${Math.min(100, (entropy / 120) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Customization Options */}
      <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-5">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              {lang === 'es' ? 'Longitud de la contraseña:' : 'Password length:'}
            </label>
            <span className="text-sm font-mono font-extrabold text-blue-600 dark:text-blue-400 px-2.5 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950">
              {length} caracteres
            </span>
          </div>
          <input
            type="range"
            min="6"
            max="64"
            value={length}
            onChange={(e) => setLength(Number(e.target.value))}
            className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <label className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-pointer">
            <input
              type="checkbox"
              checked={useUpper}
              onChange={(e) => setUseUpper(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600"
            />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {lang === 'es' ? 'Mayúsculas (A-Z)' : 'Uppercase (A-Z)'}
            </span>
          </label>

          <label className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-pointer">
            <input
              type="checkbox"
              checked={useLower}
              onChange={(e) => setUseLower(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600"
            />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {lang === 'es' ? 'Minúsculas (a-z)' : 'Lowercase (a-z)'}
            </span>
          </label>

          <label className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-pointer">
            <input
              type="checkbox"
              checked={useNumbers}
              onChange={(e) => setUseNumbers(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600"
            />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {lang === 'es' ? 'Números (0-9)' : 'Numbers (0-9)'}
            </span>
          </label>

          <label className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-pointer">
            <input
              type="checkbox"
              checked={useSymbols}
              onChange={(e) => setUseSymbols(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600"
            />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {lang === 'es' ? 'Símbolos (!@#$%^&*)' : 'Symbols (!@#$%^&*)'}
            </span>
          </label>

          <label className="col-span-1 sm:col-span-2 flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-pointer">
            <input
              type="checkbox"
              checked={avoidAmbiguous}
              onChange={(e) => setAvoidAmbiguous(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600"
            />
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
              {lang === 'es' ? 'Evitar caracteres ambiguos (0, O, l, 1, I)' : 'Exclude ambiguous characters (0, O, l, 1, I)'}
            </span>
          </label>
        </div>
      </div>
    </div>
  );
};
