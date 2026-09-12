import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { SudoModal } from './SudoModal';
import { 
  Laptop, 
  Smartphone, 
  Globe, 
  ShieldCheck, 
  LogOut, 
  RefreshCw, 
  KeyRound, 
  Check, 
  Copy, 
  ShieldAlert,
  Clock
} from 'lucide-react';

interface SessionItem {
  id: string;
  ip: string;
  userAgent: string;
  createdAt: number;
  lastActiveAt: number;
  isCurrent: boolean;
  browser?: string;
  os?: string;
}

export const AdminSessions: React.FC = () => {
  const { user, isSuperAdmin } = useAuth();
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sudoModalOpen, setSudoModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<'revoke_others' | 'regenerate_2fa' | null>(null);
  const [new2FAData, setNew2FAData] = useState<{ qrCodeDataUrl: string; secret: string; recoveryCodes: string[] } | null>(null);

  const fetchSessions = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/admin/sessions/my', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('toolbox_token') || ''}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleRevokeSession = async (sessionId: string) => {
    try {
      const res = await fetch(`/api/admin/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('toolbox_token') || ''}`
        }
      });
      if (res.ok) {
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSudoSuccess = async (sudoTicket: string) => {
    const token = localStorage.getItem('toolbox_token') || '';

    if (pendingAction === 'revoke_others') {
      try {
        const res = await fetch('/api/admin/sessions/revoke-others', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'x-sudo-ticket': sudoTicket
          }
        });
        if (res.ok) {
          fetchSessions();
        }
      } catch (err) {
        console.error(err);
      }
    } else if (pendingAction === 'regenerate_2fa') {
      try {
        const res = await fetch('/api/admin/security/setup-2fa', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'x-sudo-ticket': sudoTicket
          }
        });
        if (res.ok) {
          const data = await res.json();
          setNew2FAData(data);
        }
      } catch (err) {
        console.error(err);
      }
    }

    setPendingAction(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <span>Sesiones Activas y Seguridad de la Cuenta</span>
          </h2>
          <p className="text-xs text-slate-500">
            Control de terminales conectados, revocación remota y autenticación de segundo factor
          </p>
        </div>

        <button
          onClick={fetchSessions}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Actualizar</span>
        </button>
      </div>

      {/* 2FA Status Card for Super Admin */}
      {isSuperAdmin && (
        <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-blue-500/10 border border-amber-300 dark:border-amber-800/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Segundo Factor TOTP Obligatorio</span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                    Activo y Protegido
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  La cuenta de Super Administrador requiere verificación TOTP en cada inicio de sesión.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setPendingAction('regenerate_2fa');
                setSudoModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Reconfigurar 2FA / Ver Claves
            </button>
          </div>

          {new2FAData && (
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                Nuevas Credenciales TOTP Generadas:
              </h4>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <img
                  src={new2FAData.qrCodeDataUrl}
                  alt="QR Code"
                  className="w-36 h-36 rounded-lg border border-slate-200"
                />
                <div className="space-y-2 text-xs flex-1">
                  <p className="text-slate-500">
                    Escanea este código con tu aplicación de autenticación para vincular el nuevo secreto.
                  </p>
                  <p className="font-mono bg-slate-100 dark:bg-slate-800 p-2 rounded text-slate-800 dark:text-slate-200 font-bold">
                    {new2FAData.secret}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Active Sessions List */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden space-y-4 p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Sesiones Abiertas ({sessions.length})
          </h3>
          {sessions.length > 1 && (
            <button
              onClick={() => {
                setPendingAction('revoke_others');
                setSudoModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 hover:bg-rose-100 text-xs font-bold transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Cerrar todas las demás sesiones</span>
            </button>
          )}
        </div>

        <div className="space-y-3">
          {sessions.map((s) => (
            <div
              key={s.id}
              className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                s.isCurrent
                  ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/50'
                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 shadow-2xs">
                  {s.userAgent.toLowerCase().includes('mobile') ? (
                    <Smartphone className="w-5 h-5" />
                  ) : (
                    <Laptop className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      {s.browser || 'Navegador'} en {s.os || 'Dispositivo'}
                    </p>
                    {s.isCurrent && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                        Esta sesión actual
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    IP: {s.ip} • Iniciada: {new Date(s.createdAt).toLocaleString()}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Última actividad: {new Date(s.lastActiveAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>

              {!s.isCurrent && (
                <button
                  onClick={() => handleRevokeSession(s.id)}
                  className="self-end sm:self-center px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-rose-300 text-xs font-semibold text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
                >
                  Cerrar Sesión
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <SudoModal
        isOpen={sudoModalOpen}
        onClose={() => setSudoModalOpen(false)}
        onSuccess={handleSudoSuccess}
        actionTitle="Confirmar Acción de Seguridad Crítica"
      />
    </div>
  );
};
