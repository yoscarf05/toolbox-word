import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  RotateCcw, 
  Eye, 
  Lock, 
  Key, 
  AlertTriangle, 
  RefreshCw,
  Search,
  Check,
  Copy,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

interface ChangeRequestItem {
  id: string;
  requestedBy: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  action: string;
  actionLabel: string;
  targetResource: string;
  sanitizedParams: Record<string, any>;
  riskLevel: 'critical' | 'high';
  reason: string;
  potentialConsequences: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired' | 'executed' | 'rolled_back';
  createdAt: number;
  expiresAt: number;
  reviewedBy?: {
    id: string;
    name: string;
    email: string;
    reviewedAt: number;
  };
  reviewNotes?: string;
  usedAt?: number;
  executedBy?: {
    id: string;
    email: string;
    executedAt: number;
  };
  hasCheckpoint?: boolean;
  rollbackAt?: number;
  rollbackBy?: {
    id: string;
    email: string;
  };
}

export const AdminChangeRequests: React.FC = () => {
  const { isSuperAdmin } = useAuth();
  const [requests, setRequests] = useState<ChangeRequestItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal details state
  const [selectedRequest, setSelectedRequest] = useState<ChangeRequestItem | null>(null);

  // Approval / Action modal state
  const [actionModal, setActionModal] = useState<{
    type: 'approve' | 'reject' | 'execute' | 'rollback';
    request: ChangeRequestItem;
  } | null>(null);

  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [notes, setNotes] = useState('');
  const [actionSubmitting, setActionSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [approvalResult, setApprovalResult] = useState<{
    token: string;
    expiresAt: number;
  } | null>(null);
  const [copiedToken, setCopiedToken] = useState(false);

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (searchQuery) params.append('q', searchQuery);

      const res = await fetch(`/api/admin/change-requests?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('toolbox_token') || ''}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
      }
    } catch (err) {
      console.error('Error fetching change requests:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(fetchRequests, 10000);
    return () => clearInterval(interval);
  }, [fetchRequests]);

  const pendingCount = requests.filter((r) => r.status === 'pending').length;

  const handleActionSubmit = async () => {
    if (!actionModal) return;
    setActionSubmitting(true);
    setActionError(null);

    const { type, request } = actionModal;
    const url = `/api/admin/change-requests/${request.id}/${type}`;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('toolbox_token') || ''}`,
          'x-sudo-ticket': sessionStorage.getItem('sudo_ticket') || ''
        },
        body: JSON.stringify({
          password,
          totpCode,
          reviewNotes: notes,
          notes,
          reason: notes
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Error procesando la solicitud.');
      }

      if (type === 'approve' && data.authorizationToken) {
        setApprovalResult({
          token: data.authorizationToken,
          expiresAt: data.expiresAt
        });
      } else {
        setActionModal(null);
        setPassword('');
        setTotpCode('');
        setNotes('');
      }

      fetchRequests();
    } catch (err: any) {
      setActionError(err.message || 'Error ejecutando la acción.');
    } finally {
      setActionSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Super Admin Alert Notification Banner */}
      {isSuperAdmin && pendingCount > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-400 dark:border-amber-600 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-950 dark:text-amber-200">
                Hay {pendingCount} {pendingCount === 1 ? 'solicitud' : 'solicitudes'} de cambio crítico pendiente{pendingCount === 1 ? '' : 's'}
              </h3>
              <p className="text-xs text-amber-800 dark:text-amber-300">
                Acciones de alto riesgo requieren revisión y autorización criptográfica mediante contraseña y TOTP.
              </p>
            </div>
          </div>
          <button
            onClick={() => setStatusFilter('pending')}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors cursor-pointer shrink-0"
          >
            Filtrar Pendientes
          </button>
        </div>
      )}

      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Flujo de Autorización de Cambios Críticos
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Gobernanza centralizada: toda acción que altere seguridad, roles, configuración o datos requiere autorización del Super Admin.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchRequests}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Actualizar listado"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por acción, recurso, usuario o motivo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {[
            { id: 'all', label: 'Todos' },
            { id: 'pending', label: 'Pendientes' },
            { id: 'approved', label: 'Aprobados' },
            { id: 'executed', label: 'Ejecutados' },
            { id: 'rejected', label: 'Rechazados' },
            { id: 'rolled_back', label: 'Revertidos' },
            { id: 'expired', label: 'Expirados' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
              }`}
            >
              {tab.label}
              {tab.id === 'pending' && pendingCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-white font-extrabold">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Requests List */}
      <div className="space-y-3">
        {requests.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <ShieldCheck className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              No hay solicitudes que coincidan con los criterios
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Las solicitudes de autorización enviadas por administradores aparecerán aquí.
            </p>
          </div>
        ) : (
          requests.map((r) => {
            const isPending = r.status === 'pending';
            const isApproved = r.status === 'approved';
            const isExecuted = r.status === 'executed';
            const isRejected = r.status === 'rejected';
            const isRolledBack = r.status === 'rolled_back';
            const isExpired = r.status === 'expired';

            return (
              <div
                key={r.id}
                className={`p-5 rounded-2xl border bg-white dark:bg-slate-900 transition-all ${
                  isPending
                    ? 'border-amber-300 dark:border-amber-700/70 shadow-sm'
                    : isApproved
                    ? 'border-emerald-300 dark:border-emerald-800/60'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                        {r.id}
                      </span>

                      {/* Status Badges */}
                      {isPending && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Pendiente de Aprobación
                        </span>
                      )}
                      {isApproved && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Aprobado (Token Emitido)
                        </span>
                      )}
                      {isExecuted && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800 flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          Ejecutado
                        </span>
                      )}
                      {isRejected && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800 flex items-center gap-1">
                          <XCircle className="w-3 h-3" />
                          Rechazado
                        </span>
                      )}
                      {isRolledBack && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-800 flex items-center gap-1">
                          <RotateCcw className="w-3 h-3" />
                          Revertido
                        </span>
                      )}
                      {isExpired && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Expirado
                        </span>
                      )}

                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        r.riskLevel === 'critical'
                          ? 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                          : 'bg-orange-50 dark:bg-orange-950 text-orange-700 dark:text-orange-300'
                      }`}>
                        Riesgo: {r.riskLevel.toUpperCase()}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {r.actionLabel}
                      </h4>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">
                        Recurso: <span className="font-semibold text-slate-700 dark:text-slate-300">{r.targetResource}</span>
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span>
                        Solicitado por: <strong className="text-slate-700 dark:text-slate-300">{r.requestedBy.name}</strong> ({r.requestedBy.email})
                      </span>
                      <span>
                        Fecha: {new Date(r.createdAt).toLocaleString()}
                      </span>
                      {r.reviewedBy && (
                        <span>
                          Revisado por: <strong className="text-slate-700 dark:text-slate-300">{r.reviewedBy.name}</strong>
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                      <strong>Motivo:</strong> {r.reason}
                    </p>
                  </div>

                  {/* Actions column */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      onClick={() => setSelectedRequest(r)}
                      className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Ver Detalles
                    </button>

                    {isSuperAdmin && isPending && (
                      <>
                        <button
                          onClick={() => {
                            setActionModal({ type: 'reject', request: r });
                            setActionError(null);
                          }}
                          className="px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 hover:bg-rose-100 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Rechazar
                        </button>

                        <button
                          onClick={() => {
                            setActionModal({ type: 'approve', request: r });
                            setActionError(null);
                          }}
                          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Autorizar
                        </button>

                        <button
                          onClick={() => {
                            setActionModal({ type: 'execute', request: r });
                            setActionError(null);
                          }}
                          className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Ejecutar Directamente
                        </button>
                      </>
                    )}

                    {isSuperAdmin && isExecuted && r.hasCheckpoint && (
                      <button
                        onClick={() => {
                          setActionModal({ type: 'rollback', request: r });
                          setActionError(null);
                        }}
                        className="px-3 py-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 hover:bg-purple-100 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer border border-purple-200 dark:border-purple-800"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Revertir (Rollback)
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Details Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Detalles de la Solicitud Crítica
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    ID: {selectedRequest.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400 block mb-1">Usuario Solicitante</span>
                  <p className="font-bold text-slate-900 dark:text-white">{selectedRequest.requestedBy.name}</p>
                  <p className="text-slate-500">{selectedRequest.requestedBy.email}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                    Rol: {selectedRequest.requestedBy.role}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400 block mb-1">Acción y Recurso</span>
                  <p className="font-bold text-slate-900 dark:text-white">{selectedRequest.actionLabel}</p>
                  <p className="text-slate-500 font-mono mt-0.5">Recurso: {selectedRequest.targetResource}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                    Nivel de Riesgo: {selectedRequest.riskLevel}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block mb-1 font-semibold">Consecuencias Potenciales Declaradas</span>
                <p className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800">
                  {selectedRequest.potentialConsequences}
                </p>
              </div>

              <div>
                <span className="text-slate-400 block mb-1 font-semibold">Parámetros Exactos Solicitados</span>
                <pre className="p-3.5 rounded-xl bg-slate-950 text-emerald-400 font-mono text-[11px] overflow-x-auto border border-slate-800">
                  {JSON.stringify(selectedRequest.sanitizedParams, null, 2)}
                </pre>
              </div>

              <div className="grid grid-cols-2 gap-4 text-[11px] text-slate-500">
                <div>
                  <span className="text-slate-400 block">Fecha y Hora de Creación:</span>
                  <p className="text-slate-700 dark:text-slate-300 font-semibold">{new Date(selectedRequest.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-slate-400 block">Vencimiento de Solicitud:</span>
                  <p className="text-slate-700 dark:text-slate-300 font-semibold">{new Date(selectedRequest.expiresAt).toLocaleString()}</p>
                </div>
              </div>

              {selectedRequest.reviewNotes && (
                <div>
                  <span className="text-slate-400 block mb-1 font-semibold">Notas de Revisión del Super Admin:</span>
                  <p className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {selectedRequest.reviewNotes}
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end">
              <button
                onClick={() => setSelectedRequest(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Super Admin Re-Authentication & Action Modal */}
      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-center text-slate-900 dark:text-white">
                {actionModal.type === 'approve' && 'Autorizar Cambio Crítico'}
                {actionModal.type === 'reject' && 'Rechazar Solicitud de Cambio'}
                {actionModal.type === 'execute' && 'Ejecutar Cambio Crítico Directamente'}
                {actionModal.type === 'rollback' && 'Revertir Cambio a Checkpoint Anterior'}
              </h3>
              <p className="text-xs text-center text-slate-500 mt-1">
                Se requiere confirmación con contraseña de Super Admin y código TOTP.
              </p>
            </div>

            {approvalResult ? (
              <div className="p-6 space-y-4">
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mx-auto mb-2" />
                  <h4 className="text-sm font-bold text-emerald-950 dark:text-emerald-200">
                    ¡Solicitud Autorizada Exitosamente!
                  </h4>
                  <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-1">
                    Se ha generado el token criptográfico de un solo uso (válido durante 15 minutos).
                  </p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Token de Autorización de Un Solo Uso:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={approvalResult.token}
                      className="w-full px-3 py-2 text-xs font-mono bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700"
                    />
                    <button
                      onClick={() => copyToClipboard(approvalResult.token)}
                      className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      {copiedToken ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copiedToken ? 'Copiado' : 'Copiar'}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Este token se invalidará de manera irreversible tras ser utilizado una sola vez.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setApprovalResult(null);
                    setActionModal(null);
                    setPassword('');
                    setTotpCode('');
                    setNotes('');
                  }}
                  className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold cursor-pointer"
                >
                  Entendido y Finalizar
                </button>
              </div>
            ) : (
              <div className="p-6 space-y-4">
                {actionError && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{actionError}</span>
                  </div>
                )}

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    {actionModal.type === 'reject' ? 'Motivo del Rechazo:' : 'Notas de Revisión (opcional):'}
                  </label>
                  <input
                    type="text"
                    placeholder="Escribe un motivo o comentario de auditoría..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Contraseña del Super Admin:
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Código de Seguridad TOTP (2FA de 6 dígitos):
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono tracking-widest text-center rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActionModal(null);
                      setActionError(null);
                      setPassword('');
                      setTotpCode('');
                    }}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleActionSubmit}
                    disabled={actionSubmitting || !password || !totpCode}
                    className={`flex-1 py-2.5 px-4 rounded-xl text-white text-xs font-bold cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 ${
                      actionModal.type === 'reject'
                        ? 'bg-rose-600 hover:bg-rose-700'
                        : actionModal.type === 'rollback'
                        ? 'bg-purple-600 hover:bg-purple-700'
                        : 'bg-emerald-600 hover:bg-emerald-700'
                    }`}
                  >
                    {actionSubmitting ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        Confirmar
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
