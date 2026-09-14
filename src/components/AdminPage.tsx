import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Language } from '../types';
import { AdminDashboard } from './admin/AdminDashboard';
import { AdminUsers } from './admin/AdminUsers';
import { AdminTools } from './admin/AdminTools';
import { AdminErrors } from './admin/AdminErrors';
import { AdminAuditLogs } from './admin/AdminAuditLogs';
import { AdminSessions } from './admin/AdminSessions';
import { AdminReports } from './admin/AdminReports';
import { AdminSettings } from './admin/AdminSettings';
import { AdminChangeRequests } from './admin/AdminChangeRequests';
import { 
  Shield, 
  LayoutDashboard, 
  Users, 
  Wrench, 
  AlertTriangle, 
  FileText, 
  Laptop, 
  FileSpreadsheet, 
  Sliders, 
  ArrowLeft,
  Lock,
  LogOut,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';

interface AdminPageProps {
  lang: Language;
  onNavigate: (route: string) => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({ lang, onNavigate }) => {
  const { user, isAuthenticated, isAdmin, isSuperAdmin, logout, setIsAuthModalOpen, isLoading: isAuthLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [telemetry, setTelemetry] = useState({
    usersNow: 1,
    users5m: 1,
    users15m: 1,
    ongoingConversions: 0,
    recentErrors24h: 0,
    totalConversions24h: 0,
    successRate24h: 100
  });
  const [overview, setOverview] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingRequestsCount, setPendingRequestsCount] = useState<number>(0);

  // Poll real-time telemetry and pending change requests from server
  const fetchTelemetry = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const res = await fetch('/api/admin/telemetry', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('toolbox_token') || ''}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setTelemetry(data);
      }
    } catch (err) {
      console.error(err);
    }
  }, [isAdmin]);

  const fetchPendingRequestsCount = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const res = await fetch('/api/admin/change-requests/pending-count', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('toolbox_token') || ''}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setPendingRequestsCount(data.pendingCount || 0);
      }
    } catch (err) {
      console.error(err);
    }
  }, [isAdmin]);

  const fetchOverview = useCallback(async () => {
    if (!isAdmin) return;
    try {
      setIsLoading(true);
      const res = await fetch('/api/admin/overview', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('toolbox_token') || ''}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setOverview(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      fetchTelemetry();
      fetchPendingRequestsCount();
      fetchOverview();
      const interval = setInterval(() => {
        fetchTelemetry();
        fetchPendingRequestsCount();
      }, 6000);
      return () => clearInterval(interval);
    }
  }, [isAdmin, fetchTelemetry, fetchPendingRequestsCount, fetchOverview]);

  // Session validation state check on initial mount / reload
  if (isAuthLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 space-y-3">
        <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center animate-spin">
          <RefreshCw className="w-5 h-5" />
        </div>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          Verificando credenciales de acceso...
        </p>
      </div>
    );
  }

  // Access Control Guard
  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="w-full max-w-md p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center">
            <Lock className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Acceso Restringido
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Esta sección requiere permisos administrativos autenticados.
            </p>
          </div>
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => onNavigate('/')}
              className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 transition-colors"
            >
              Volver al Inicio
            </button>
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-xs transition-colors"
            >
              Iniciar Sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  const navTabs = [
    { id: 'dashboard', label: 'Panel General', icon: LayoutDashboard },
    { id: 'change-requests', label: 'Autorizaciones Críticas', icon: ShieldCheck, badge: pendingRequestsCount > 0 ? pendingRequestsCount : undefined },
    { id: 'users', label: 'Usuarios y Cuentas', icon: Users },
    { id: 'tools', label: 'Telemetría Herramientas', icon: Wrench },
    { id: 'errors', label: 'Monitor de Errores', icon: AlertTriangle, badge: telemetry.recentErrors24h > 0 ? telemetry.recentErrors24h : undefined },
    { id: 'audit', label: 'Registro de Auditoría', icon: FileText },
    { id: 'sessions', label: 'Sesiones y 2FA', icon: Laptop },
    { id: 'reports', label: 'Informes Semanales', icon: FileSpreadsheet },
    { id: 'settings', label: 'Configuración', icon: Sliders }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Top Banner & User Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('/')}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Volver al catálogo público"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-indigo-600 text-white flex items-center justify-center font-bold">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 dark:text-white">
                Centro de Mando Administrativo
              </h1>
              {isSuperAdmin ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800/60">
                  Super Admin (2FA) 👑
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                  Administrador
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Conectado como <strong className="text-slate-700 dark:text-slate-300">{user?.email}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('/')}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer"
          >
            Ir a la Web
          </button>
          <button
            onClick={logout}
            className="px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 hover:bg-rose-100 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none border-b border-slate-200 dark:border-slate-800">
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                  isActive ? 'bg-white text-blue-600' : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Active Tab View */}
      <div>
        {activeTab === 'dashboard' && (
          <AdminDashboard
            telemetry={telemetry}
            overview={overview}
            isLoading={isLoading}
            onRefresh={() => {
              fetchTelemetry();
              fetchOverview();
            }}
            onNavigateTab={(tabId) => setActiveTab(tabId)}
          />
        )}

        {activeTab === 'change-requests' && <AdminChangeRequests />}

        {activeTab === 'users' && <AdminUsers />}

        {activeTab === 'tools' && <AdminTools />}

        {activeTab === 'errors' && <AdminErrors />}

        {activeTab === 'audit' && <AdminAuditLogs />}

        {activeTab === 'sessions' && <AdminSessions />}

        {activeTab === 'reports' && <AdminReports />}

        {activeTab === 'settings' && <AdminSettings />}
      </div>
    </div>
  );
};
