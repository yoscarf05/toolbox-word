import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { SudoModal } from './SudoModal';
import { CriticalActionModal } from './CriticalActionModal';
import { 
  Users, 
  Search, 
  Shield, 
  ShieldAlert, 
  Ban, 
  CheckCircle, 
  RefreshCw, 
  KeyRound, 
  LogOut,
  UserCheck,
  UserX,
  AlertTriangle
} from 'lucide-react';

interface ManagedUser {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin' | 'super_admin';
  status: 'active' | 'blocked';
  createdAt: number;
  lastLoginAt?: number;
  totpEnabled: boolean;
  activeSessionsCount: number;
}

export const AdminUsers: React.FC = () => {
  const { user: currentUser, isSuperAdmin } = useAuth();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Sudo modal triggers for Super Admin
  const [sudoModalOpen, setSudoModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    type: 'role' | 'status' | 'revoke';
    targetUser: ManagedUser;
    payload?: any;
    title: string;
  } | null>(null);

  // Critical action modal for regular Admins
  const [criticalModalOpen, setCriticalModalOpen] = useState(false);
  const [criticalActionData, setCriticalActionData] = useState<{
    title: string;
    actionName: string;
    targetResource: string;
    consequences: string;
    paramsToChange: Record<string, any>;
  } | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/admin/users', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('toolbox_token') || ''}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRoleSelect = (targetUser: ManagedUser, newRole: string) => {
    if (newRole === targetUser.role) return;

    if (!isSuperAdmin) {
      // 1. Un admin NO puede elevarse a super_admin
      // 2. Un admin NO puede modificar sus propios permisos ni rol
      if (newRole === 'super_admin') {
        setActionFeedback({
          type: 'error',
          message: 'Prohibido: Un administrador NO puede elevarse ni otorgar privilegios de Super Administrador.'
        });
        setTimeout(() => setActionFeedback(null), 5000);
        return;
      }

      if (targetUser.id === currentUser?.id) {
        setActionFeedback({
          type: 'error',
          message: 'Prohibido: Un administrador NO puede modificar sus propios permisos ni su propio rol.'
        });
        setTimeout(() => setActionFeedback(null), 5000);
        return;
      }

      // Open critical authorization modal
      setCriticalActionData({
        title: `Cambiar Rol de Usuario (${targetUser.name})`,
        actionName: 'change_user_role',
        targetResource: `user/${targetUser.id}`,
        consequences: `Modifica el nivel de privilegios de ${targetUser.email} al rol '${newRole}'. Requiere aprobación obligatoria del Super Admin.`,
        paramsToChange: {
          targetUserId: targetUser.id,
          role: newRole
        }
      });
      setCriticalModalOpen(true);
      return;
    }

    // Super Admin path -> Sudo authorization
    setPendingAction({
      type: 'role',
      targetUser,
      payload: { newRole },
      title: `Cambiar rol de ${targetUser.email} a ${newRole}`
    });
    setSudoModalOpen(true);
  };

  const handleStatusToggle = (targetUser: ManagedUser) => {
    const newStatus = targetUser.status === 'active' ? 'blocked' : 'active';

    if (!isSuperAdmin) {
      if (targetUser.id === currentUser?.id) {
        setActionFeedback({
          type: 'error',
          message: 'Prohibido: No puedes bloquear tu propia cuenta administrativa.'
        });
        setTimeout(() => setActionFeedback(null), 5000);
        return;
      }

      setCriticalActionData({
        title: `${newStatus === 'blocked' ? 'Bloquear' : 'Desbloquear'} Usuario`,
        actionName: 'change_user_status',
        targetResource: `user/${targetUser.id}`,
        consequences: `${newStatus === 'blocked' ? 'Revocará accesos e impedirá' : 'Permitirá'} el inicio de sesión a ${targetUser.email}. Requiere aprobación del Super Admin.`,
        paramsToChange: {
          targetUserId: targetUser.id,
          status: newStatus
        }
      });
      setCriticalModalOpen(true);
      return;
    }

    setPendingAction({
      type: 'status',
      targetUser,
      payload: { status: newStatus, reason: 'Acción administrativa manual' },
      title: `${newStatus === 'blocked' ? 'Bloquear' : 'Desbloquear'} cuenta de ${targetUser.email}`
    });
    setSudoModalOpen(true);
  };

  const handleSudoSuccess = async (sudoTicket: string) => {
    if (!pendingAction) return;
    const { type, targetUser, payload } = pendingAction;
    const token = localStorage.getItem('toolbox_token') || '';

    try {
      if (type === 'role') {
        const res = await fetch(`/api/admin/users/${targetUser.id}/role`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            'x-sudo-ticket': sudoTicket
          },
          body: JSON.stringify({ role: payload.newRole })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Error al cambiar rol');
        setActionFeedback({ type: 'success', message: `Rol actualizado para ${targetUser.email}` });
      } else if (type === 'status') {
        const res = await fetch(`/api/admin/users/${targetUser.id}/status`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            'x-sudo-ticket': sudoTicket
          },
          body: JSON.stringify({ status: payload.status, reason: payload.reason })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Error al modificar estado');
        setActionFeedback({ type: 'success', message: `Estado actualizado a ${payload.status}` });
      } else if (type === 'revoke') {
        const res = await fetch(`/api/admin/users/${targetUser.id}/revoke-sessions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            'x-sudo-ticket': sudoTicket
          }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Error al revocar sesiones');
        setActionFeedback({ type: 'success', message: `Sesiones revocadas para ${targetUser.email}` });
      }
      fetchUsers();
    } catch (err: any) {
      setActionFeedback({ type: 'error', message: err.message || 'Operación fallida' });
    } finally {
      setPendingAction(null);
      setTimeout(() => setActionFeedback(null), 4000);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch = 
      u.name.toLowerCase().includes(search.toLowerCase()) || 
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Title & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span>Gestión de Cuentas y Accesos</span>
          </h2>
          <p className="text-xs text-slate-500">
            Control de identidades, jerarquía RBAC, autenticación TOTP y sesiones activas
          </p>
        </div>

        <button
          onClick={fetchUsers}
          disabled={isLoading}
          className="self-start md:self-auto p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors flex items-center gap-1 text-xs font-bold cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Actualizar</span>
        </button>
      </div>

      {actionFeedback && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
            actionFeedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 dark:bg-rose-950 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800'
          }`}
        >
          {actionFeedback.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
          <span>{actionFeedback.message}</span>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o correo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold"
          >
            <option value="all">Todos los Roles</option>
            <option value="super_admin">Super Admins</option>
            <option value="admin">Administradores</option>
            <option value="user">Usuarios Normales</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold"
          >
            <option value="all">Todos los Estados</option>
            <option value="active">Activos</option>
            <option value="blocked">Bloqueados</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
              <tr>
                <th className="py-3 px-4">Usuario</th>
                <th className="py-3 px-4">Rol Asignado</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4">2FA (TOTP)</th>
                <th className="py-3 px-4">Sesiones</th>
                <th className="py-3 px-4">Registrado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No se encontraron usuarios coincidentes
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isCurrent = u.id === currentUser?.id;
                  const isSuper = u.role === 'super_admin';

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <span>{u.name}</span>
                            {isCurrent && (
                              <span className="text-[10px] text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-1.5 py-0.2 rounded font-bold">
                                (Tú)
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-slate-400">{u.email}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {u.role === 'super_admin' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800/50">
                            <Shield className="w-3 h-3 text-amber-600" />
                            Super Admin
                          </span>
                        ) : u.role === 'admin' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                            Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            Usuario
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {u.status === 'active' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                            <UserCheck className="w-3.5 h-3.5" />
                            Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600">
                            <UserX className="w-3.5 h-3.5" />
                            Bloqueado
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {u.totpEnabled ? (
                          <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                            <KeyRound className="w-3 h-3" />
                            Activado
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">No activado</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {u.activeSessionsCount}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-[11px]">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1 justify-end">
                          {/* Role Selector */}
                          {!isSuper && !isCurrent && (
                            <select
                              value={u.role}
                              onChange={(e) => handleRoleSelect(u, e.target.value)}
                              className="py-1 px-2 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 cursor-pointer"
                            >
                              <option value="user">Usuario</option>
                              <option value="admin">Admin</option>
                              {isSuperAdmin && <option value="super_admin">Super Admin</option>}
                            </select>
                          )}

                          {/* Block/Unblock Button */}
                          {!isSuper && !isCurrent && (
                            <button
                              onClick={() => handleStatusToggle(u)}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                u.status === 'active'
                                  ? 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                                  : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                              }`}
                              title={u.status === 'active' ? 'Bloquear usuario' : 'Desbloquear usuario'}
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          )}

                          {/* Revoke Sessions Button */}
                          {u.activeSessionsCount > 0 && isSuperAdmin && (
                            <button
                              onClick={() => {
                                setPendingAction({
                                  type: 'revoke',
                                  targetUser: u,
                                  title: `Revocar todas las sesiones activas de ${u.email}`
                                });
                                setSudoModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Cerrar todas las sesiones activas"
                            >
                              <LogOut className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sudo Modal for Super Admin */}
      <SudoModal
        isOpen={sudoModalOpen}
        onClose={() => setSudoModalOpen(false)}
        onSuccess={handleSudoSuccess}
        actionTitle={pendingAction?.title}
      />

      {/* Critical Action Request Modal for Admin */}
      {criticalActionData && (
        <CriticalActionModal
          isOpen={criticalModalOpen}
          onClose={() => {
            setCriticalModalOpen(false);
            setCriticalActionData(null);
          }}
          title={criticalActionData.title}
          actionName={criticalActionData.actionName}
          targetResource={criticalActionData.targetResource}
          consequences={criticalActionData.consequences}
          paramsToChange={criticalActionData.paramsToChange}
          onRequestCreated={() => {
            fetchUsers();
          }}
        />
      )}
    </div>
  );
};
