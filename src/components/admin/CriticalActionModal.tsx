import React, { useState } from 'react';
import { ShieldAlert, AlertTriangle, Send, XCircle, CheckCircle2, Clock, RefreshCw } from 'lucide-react';

interface CriticalActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  actionName: string;
  targetResource: string;
  consequences?: string;
  paramsToChange: Record<string, any>;
  onRequestCreated: (requestId: string) => void;
}

export const CriticalActionModal: React.FC<CriticalActionModalProps> = ({
  isOpen,
  onClose,
  title,
  actionName,
  targetResource,
  consequences,
  paramsToChange,
  onRequestCreated
}) => {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [createdRequestId, setCreatedRequestId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRequestAuthorization = async () => {
    try {
      setSubmitting(true);
      setError(null);

      // Determine endpoint based on action
      let url = '/api/admin/settings';
      let method = 'PUT';

      if (actionName === 'change_user_role') {
        url = `/api/admin/users/${paramsToChange.targetUserId}/role`;
        method = 'POST';
      } else if (actionName === 'change_user_status') {
        url = `/api/admin/users/${paramsToChange.targetUserId}/status`;
        method = 'POST';
      } else if (actionName === 'tool_toggle_status') {
        url = `/api/admin/tools/${paramsToChange.slug}/status`;
        method = 'POST';
      }

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('toolbox_token') || ''}`
        },
        body: JSON.stringify({
          ...paramsToChange,
          reason: reason.trim() || 'Modificación solicitada por administrador.'
        })
      });

      const data = await res.json();
      if (res.status === 202 && data.authorizationRequired) {
        setCreatedRequestId(data.requestId);
        onRequestCreated(data.requestId);
      } else if (!res.ok) {
        throw new Error(data.message || data.error || 'Error al solicitar autorización.');
      } else {
        // Was executed directly (e.g. if super_admin)
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error al enviar la solicitud.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {title || 'Autorización de Cambio Crítico Requerida'}
              </h3>
              <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold">
                Este cambio requiere autorización del Super Admin.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        {createdRequestId ? (
          <div className="p-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Solicitud Creada en Estado Pendiente
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                La solicitud ha sido enviada con el ID: <strong className="font-mono text-slate-800 dark:text-slate-200">{createdRequestId}</strong>.
              </p>
              <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-left space-y-1">
                <p>• <strong>Estado:</strong> pending (en espera de revisión)</p>
                <p>• <strong>Regla de seguridad:</strong> El cambio <u>NO</u> se ha aplicado ni se aplicará hasta que el Super Admin lo autorice criptográficamente.</p>
                <p>• Puedes consultar el avance en la pestaña de <strong>Autorizaciones Críticas</strong>.</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer transition-colors"
            >
              Aceptar y Continuar
            </button>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Recurso Afectado:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{targetResource}</span>
              </div>
              {consequences && (
                <div>
                  <span className="text-slate-500 block">Consecuencias Potenciales:</span>
                  <p className="text-amber-900 dark:text-amber-200 font-medium mt-0.5">{consequences}</p>
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Motivo / Justificación del Cambio (para el Super Admin):
              </label>
              <textarea
                rows={3}
                placeholder="Indica la razón por la cual es necesario aplicar esta modificación..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full p-3 text-xs rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500 resize-none"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleRequestAuthorization}
                disabled={submitting}
                className="flex-1 py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
              >
                {submitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    Solicitar autorización
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
