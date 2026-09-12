import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, KeyRound, Lock, X, ArrowRight } from 'lucide-react';

interface SudoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (sudoTicket: string) => void;
  actionTitle?: string;
}

export const SudoModal: React.FC<SudoModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  actionTitle = 'Acción Administrativa Crítica'
}) => {
  const { user, isSuperAdmin } = useAuth();
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setErrorMsg('Ingresa tu contraseña actual.');
      return;
    }
    if (isSuperAdmin && !totpCode.trim()) {
      setErrorMsg('Ingresa el código TOTP de 6 dígitos.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/reauth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('toolbox_token') || ''}`
        },
        body: JSON.stringify({
          password,
          totpCode: totpCode.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.message || data.error || 'Reautenticación fallida.');
      } else if (data.sudoTicket) {
        setPassword('');
        setTotpCode('');
        onSuccess(data.sudoTicket);
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error de conexión con el servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-amber-300 dark:border-amber-800/80 overflow-hidden">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Reautenticación de Seguridad
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Confirmación de identidad obligatoria (Sudo Mode)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200">
            <p className="font-semibold">{actionTitle}</p>
            <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 mt-0.5">
              Por razones de seguridad, debes ingresar tu contraseña {isSuperAdmin ? 'y tu código de autenticación TOTP actual' : ''} para continuar.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Contraseña de cuenta ({user?.email})
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {isSuperAdmin && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Código TOTP (Google/Microsoft Authenticator)
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  maxLength={8}
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="123456"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl text-xs font-mono font-bold tracking-widest bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {errorMsg && (
            <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
              {errorMsg}
            </p>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !password || (isSuperAdmin && !totpCode)}
              className="flex-1 py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold text-xs shadow-sm transition-colors flex items-center justify-center gap-1.5"
            >
              <span>{isSubmitting ? 'Verificando...' : 'Confirmar y Proceder'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
