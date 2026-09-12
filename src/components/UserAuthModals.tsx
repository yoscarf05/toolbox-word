import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Language } from '../types';
import { TOOLS } from '../data/tools';
import { DynamicIcon } from './DynamicIcon';
import { 
  X, 
  User, 
  Mail, 
  Lock, 
  Star, 
  History, 
  BookMarked, 
  LogOut, 
  Trash2, 
  Copy, 
  Check, 
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  QrCode,
  ArrowRight,
  Shield
} from 'lucide-react';

interface UserAuthModalsProps {
  lang: Language;
  onNavigate: (route: string) => void;
}

export const UserAuthModals: React.FC<UserAuthModalsProps> = ({ lang, onNavigate }) => {
  const {
    user,
    isAdmin,
    isSuperAdmin,
    login,
    verify2FA,
    register,
    logout,
    favoriteTools,
    toggleFavoriteTool,
    history,
    clearHistory,
    savedCitations,
    removeCitation,
    isAuthModalOpen,
    setIsAuthModalOpen,
    isProfileModalOpen,
    setIsProfileModalOpen
  } = useAuth();

  // Auth Modal State
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 2FA Verification State (for Super Admin)
  const [pending2FA, setPending2FA] = useState<{
    tempToken: string;
    setupMode: boolean;
    qrCodeDataUrl?: string;
    secret?: string;
    recoveryCodes?: string[];
    message?: string;
  } | null>(null);
  const [totpCode, setTotpCode] = useState('');
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);

  // Profile Modal State
  const [profileTab, setProfileTab] = useState<'favorites' | 'citations' | 'history'>('favorites');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const isEs = lang === 'es';

  const resetAuthState = () => {
    setName('');
    setEmail('');
    setPassword('');
    setErrorMsg('');
    setPending2FA(null);
    setTotpCode('');
    setIsSubmitting(false);
  };

  const handleCloseAuth = () => {
    setIsAuthModalOpen(false);
    resetAuthState();
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim() || !email.includes('@')) {
      setErrorMsg(isEs ? 'Ingresa un correo electrónico válido.' : 'Please enter a valid email address.');
      return;
    }
    if (!password) {
      setErrorMsg(isEs ? 'Ingresa tu contraseña.' : 'Please enter your password.');
      return;
    }
    if (authMode === 'register' && !name.trim()) {
      setErrorMsg(isEs ? 'Ingresa tu nombre o tratamiento.' : 'Please enter your name.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (authMode === 'register') {
        const result = await register(name.trim(), email.trim(), password);
        if (!result.success) {
          setErrorMsg(result.error || (isEs ? 'Error en el registro.' : 'Registration error.'));
        } else {
          resetAuthState();
        }
      } else {
        const result = await login(email.trim(), password);
        if (!result.success) {
          setErrorMsg(result.error || (isEs ? 'Credenciales incorrectas.' : 'Invalid credentials.'));
        } else if (result.requires2FA && result.tempToken) {
          // Super Admin requires 2FA: smoothly switch to TOTP prompt
          setPending2FA({
            tempToken: result.tempToken,
            setupMode: !!result.setup2FA,
            qrCodeDataUrl: result.qrCodeDataUrl,
            secret: result.secret,
            recoveryCodes: result.recoveryCodes,
            message: result.message
          });
        } else {
          resetAuthState();
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || (isEs ? 'Error de conexión.' : 'Connection error.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerify2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pending2FA || !totpCode.trim()) return;

    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const result = await verify2FA(pending2FA.tempToken, totpCode.trim());
      if (!result.success) {
        setErrorMsg(result.error || (isEs ? 'Código de autenticación incorrecto.' : 'Invalid authentication code.'));
      } else {
        resetAuthState();
        // If super admin, offer immediate navigation to admin panel
        onNavigate('/admin');
      }
    } catch (err: any) {
      setErrorMsg(err.message || (isEs ? 'Error al verificar segundo factor.' : 'Verification error.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyCitation = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. AUTH MODAL (LOGIN / REGISTER / MANDATORY TOTP) */}
      {/* ========================================================================= */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            {/* Header */}
            <div className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                  {pending2FA ? <KeyRound className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> : <User className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {pending2FA
                      ? (isEs ? 'Autenticación en Dos Pasos (2FA)' : 'Two-Factor Authentication')
                      : authMode === 'login'
                      ? (isEs ? 'Iniciar Sesión' : 'Sign In')
                      : (isEs ? 'Crear Cuenta' : 'Create Account')}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {pending2FA
                      ? (isEs ? 'Verificación obligatoria de segundo factor' : 'Mandatory second factor verification')
                      : (isEs ? 'Accede a tu espacio personal en Toolbox Word' : 'Access your Toolbox Word personal account')}
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseAuth}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 space-y-4">
              {/* STEP A: TOTP 2FA Verification (Triggered strictly by backend for Super Admin) */}
              {pending2FA ? (
                <form onSubmit={handleVerify2FASubmit} className="space-y-4">
                  {pending2FA.setupMode ? (
                    <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-200">
                        <QrCode className="w-4 h-4 text-amber-600" />
                        <span>{isEs ? 'Configuración inicial de Super Admin' : 'Super Admin Initial 2FA Setup'}</span>
                      </div>
                      <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                        {isEs
                          ? 'Escanea el código QR con Google Authenticator, Microsoft Authenticator o Authy:'
                          : 'Scan the QR code with Google Authenticator, Microsoft Authenticator, or Authy:'}
                      </p>

                      {pending2FA.qrCodeDataUrl && (
                        <div className="flex justify-center p-2 bg-white rounded-xl shadow-xs w-fit mx-auto">
                          <img
                            src={pending2FA.qrCodeDataUrl}
                            alt="TOTP QR Code"
                            className="w-44 h-44 rounded-lg"
                          />
                        </div>
                      )}

                      {pending2FA.secret && (
                        <div className="space-y-1">
                          <span className="text-[10px] uppercase font-bold text-amber-800 dark:text-amber-400">
                            {isEs ? 'O introduce esta clave manualmente:' : 'Or enter this key manually:'}
                          </span>
                          <div className="flex items-center gap-1.5 p-2 bg-white dark:bg-slate-900 rounded-lg border border-amber-200 dark:border-amber-900/50">
                            <code className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 tracking-wider flex-1 overflow-x-auto">
                              {pending2FA.secret}
                            </code>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(pending2FA.secret!);
                                setCopiedSecret(true);
                                setTimeout(() => setCopiedSecret(false), 2000);
                              }}
                              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                            >
                              {copiedSecret ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                      )}

                      {pending2FA.recoveryCodes && (
                        <div className="space-y-1 pt-2 border-t border-amber-200 dark:border-amber-800/40">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase font-bold text-amber-800 dark:text-amber-400">
                              {isEs ? 'Códigos de respaldo de un solo uso:' : 'One-time recovery codes:'}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(pending2FA.recoveryCodes!.join('\n'));
                                setCopiedCodes(true);
                                setTimeout(() => setCopiedCodes(false), 2000);
                              }}
                              className="text-[10px] font-bold text-amber-700 dark:text-amber-300 hover:underline flex items-center gap-1"
                            >
                              {copiedCodes ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                              <span>{copiedCodes ? 'Copiados' : 'Copiar todos'}</span>
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-1 text-[10px] font-mono bg-white dark:bg-slate-900 p-2 rounded-lg border border-amber-200 dark:border-amber-900/50">
                            {pending2FA.recoveryCodes.map((c, i) => (
                              <div key={i} className="text-slate-700 dark:text-slate-300">{c}</div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 flex items-start gap-2.5">
                      <ShieldAlert className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                      <div className="text-xs text-blue-900 dark:text-blue-200 leading-relaxed">
                        <p className="font-semibold">{isEs ? 'Introduce el código de autenticación' : 'Enter the authentication code'}</p>
                        <p className="text-[11px] text-blue-800/80 dark:text-blue-300/80 mt-0.5">
                          {isEs
                            ? 'Abre Google Authenticator, Microsoft Authenticator o Authy e ingresa el código temporal de 6 dígitos (o un código de respaldo).'
                            : 'Open Google Authenticator, Microsoft Authenticator, or Authy and enter your 6-digit code (or recovery code).'}
                        </p>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {isEs ? 'Código de 6 dígitos' : '6-digit Security Code'}
                    </label>
                    <input
                      type="text"
                      autoFocus
                      maxLength={12}
                      value={totpCode}
                      onChange={(e) => setTotpCode(e.target.value.replace(/[^a-zA-Z0-9-]/g, ''))}
                      placeholder="123456"
                      className="w-full text-center tracking-widest text-lg font-mono font-bold py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  {errorMsg && (
                    <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                      {errorMsg}
                    </p>
                  )}

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPending2FA(null)}
                      className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 text-xs font-bold transition-colors cursor-pointer"
                    >
                      {isEs ? 'Volver' : 'Back'}
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || !totpCode.trim()}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>{isSubmitting ? (isEs ? 'Verificando...' : 'Verifying...') : (isEs ? 'Confirmar Acceso' : 'Confirm Access')}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              ) : (
                /* STEP B: Standard Email + Password Form (Single, Unified) */
                <>
                  {/* Tab Selector (Login vs Register) */}
                  <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                    <button
                      onClick={() => {
                        setAuthMode('login');
                        setErrorMsg('');
                      }}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        authMode === 'login'
                          ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      {isEs ? 'Iniciar Sesión' : 'Sign In'}
                    </button>
                    <button
                      onClick={() => {
                        setAuthMode('register');
                        setErrorMsg('');
                      }}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        authMode === 'register'
                          ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      {isEs ? 'Crear Cuenta' : 'Register'}
                    </button>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleAuthSubmit} className="space-y-3.5">
                    {authMode === 'register' && (
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          {isEs ? 'Nombre completo' : 'Full Name'}
                        </label>
                        <div className="relative">
                          <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={isEs ? 'Tu nombre' : 'Your name'}
                            className="w-full pl-9 pr-3 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        {isEs ? 'Correo Electrónico' : 'Email Address'}
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="email"
                          autoComplete="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="usuario@ejemplo.com"
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        {isEs ? 'Contraseña' : 'Password'}
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="password"
                          autoComplete="current-password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    {errorMsg && (
                      <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                        {errorMsg}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
                    >
                      <span>
                        {isSubmitting
                          ? (isEs ? 'Verificando credenciales...' : 'Verifying credentials...')
                          : authMode === 'login'
                          ? (isEs ? 'Acceder a mi cuenta' : 'Log In to My Account')
                          : (isEs ? 'Completar Registro' : 'Complete Registration')}
                      </span>
                    </button>
                  </form>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-[11px] text-slate-500 dark:text-slate-400 flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>
                      {isEs
                        ? 'Toda la plataforma y conversiones pueden usarse sin registro. La cuenta guarda de forma segura tus preferencias.'
                        : 'All tools can be used without an account. Logging in securely saves your preferences.'}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. PROFILE MODAL (FAVORITES, CITATIONS, HISTORY, ADMIN ACCESS, LOGOUT) */}
      {/* ========================================================================= */}
      {isProfileModalOpen && user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-extrabold text-lg shadow-md ${
                  isSuperAdmin 
                    ? 'bg-gradient-to-tr from-amber-500 to-indigo-600 text-white shadow-amber-500/20'
                    : isAdmin
                    ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-blue-500/20'
                    : 'bg-gradient-to-tr from-slate-700 to-slate-900 text-white'
                }`}>
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      {user.name}
                    </h3>
                    {isSuperAdmin ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 flex items-center gap-1">
                        <Shield className="w-3 h-3 text-amber-600" />
                        <span>Super Admin (2FA)</span>
                      </span>
                    ) : isAdmin ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                        Admin
                      </span>
                    ) : null}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {user.email}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* If Admin or Super Admin: Prominent Admin Access Banner */}
            {isAdmin && (
              <div className="mx-6 mt-4 p-3.5 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-amber-400">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold">{isEs ? 'Panel de Administración y Supervisión' : 'Admin & Supervision Panel'}</h4>
                    <p className="text-[11px] text-slate-300">
                      {isEs ? 'Monitoreo en tiempo real, usuarios, métricas y telemetría técnica.' : 'Real-time telemetry, users, and health monitoring.'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsProfileModalOpen(false);
                    onNavigate('/admin');
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-white text-slate-900 text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer shadow-xs flex items-center gap-1.5 shrink-0"
                >
                  <span>{isEs ? 'Abrir Panel' : 'Open Panel'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Profile Navigation Tabs */}
            <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setProfileTab('favorites')}
                className={`pb-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
                  profileTab === 'favorites'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Star className="w-4 h-4 text-amber-500" />
                <span>{isEs ? 'Herramientas Favoritas' : 'Favorite Tools'} ({favoriteTools.length})</span>
              </button>

              <button
                onClick={() => setProfileTab('citations')}
                className={`pb-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
                  profileTab === 'citations'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <BookMarked className="w-4 h-4 text-indigo-500" />
                <span>{isEs ? 'Citas Guardadas' : 'Saved Citations'} ({savedCitations.length})</span>
              </button>

              <button
                onClick={() => setProfileTab('history')}
                className={`pb-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
                  profileTab === 'history'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <History className="w-4 h-4 text-emerald-500" />
                <span>{isEs ? 'Historial Reciente' : 'Recent History'}</span>
              </button>
            </div>

            {/* Tab Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {profileTab === 'favorites' && (
                <div className="space-y-3">
                  {favoriteTools.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-8">
                      {isEs ? 'No tienes herramientas favoritas marcadas todavía.' : 'No favorite tools yet.'}
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {favoriteTools.map((slug) => {
                        const tool = TOOLS.find((t) => t.slug === slug);
                        if (!tool) return null;
                        return (
                          <div
                            key={slug}
                            className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between group"
                          >
                            <div
                              onClick={() => {
                                setIsProfileModalOpen(false);
                                onNavigate(`/tool/${slug}`);
                              }}
                              className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                            >
                              <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                                <DynamicIcon name={tool.icon} className="w-5 h-5" />
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-blue-600">
                                  {tool.name[lang] || tool.name.es}
                                </h4>
                                <span className="text-[10px] text-slate-400 uppercase font-semibold">
                                  {tool.categoryId}
                                </span>
                              </div>
                            </div>

                            <button
                              onClick={() => toggleFavoriteTool(slug)}
                              className="p-1.5 rounded-lg text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"
                              title={isEs ? 'Quitar de favoritos' : 'Remove favorite'}
                            >
                              <Star className="w-4 h-4 fill-amber-400" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {profileTab === 'citations' && (
                <div className="space-y-3">
                  {savedCitations.length === 0 ? (
                    <div className="text-center py-8 space-y-2">
                      <p className="text-xs text-slate-400">
                        {isEs
                          ? 'Aún no has guardado ninguna cita. Puedes guardarlas desde el Generador de Citas.'
                          : 'No saved citations yet. You can save them directly from the Citation Generator.'}
                      </p>
                      <button
                        onClick={() => {
                          setIsProfileModalOpen(false);
                          onNavigate('/tool/citation-generator');
                        }}
                        className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-xs hover:bg-blue-700 transition-colors cursor-pointer"
                      >
                        {isEs ? 'Ir al Generador de Citas' : 'Go to Citation Generator'}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {savedCitations.map((cit) => (
                        <div
                          key={cit.id}
                          className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                              {cit.style.toUpperCase()} • {cit.sourceType}
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleCopyCitation(cit.id, cit.fullReference.replace(/\*/g, ''))}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-white dark:hover:bg-slate-700 transition-colors"
                                title={isEs ? 'Copiar referencia' : 'Copy reference'}
                              >
                                {copiedId === cit.id ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                              </button>
                              <button
                                onClick={() => removeCitation(cit.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-white dark:hover:bg-slate-700 transition-colors"
                                title={isEs ? 'Eliminar' : 'Delete'}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <p className="text-xs font-serif text-slate-800 dark:text-slate-200 leading-relaxed">
                            {cit.fullReference.replace(/\*/g, '')}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-sans">
                            <span className="font-semibold">{isEs ? 'Cita en texto:' : 'In-text citation:'}</span> {cit.inTextCitation}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {profileTab === 'history' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-xs text-slate-500">
                      {isEs ? 'Historial local protegido en tu navegador' : 'Local browser-only protected history'}
                    </span>
                    {history.length > 0 && (
                      <button
                        onClick={clearHistory}
                        className="text-xs text-rose-600 dark:text-rose-400 font-bold hover:underline cursor-pointer"
                      >
                        {isEs ? 'Limpiar historial' : 'Clear history'}
                      </button>
                    )}
                  </div>

                  {history.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-6">
                      {isEs ? 'No hay actividad reciente registrada.' : 'No recent activity recorded.'}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {history.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => {
                            if (item.slug) {
                              setIsProfileModalOpen(false);
                              onNavigate(item.type === 'tool' ? `/tool/${item.slug}` : `/guide/${item.slug}`);
                            }
                          }}
                          className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200 dark:border-slate-700 flex items-center justify-between cursor-pointer transition-colors"
                        >
                          <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white">
                              {item.title}
                            </p>
                            <span className="text-[10px] text-slate-400 uppercase font-semibold">
                              {item.type} {item.meta ? `• ${item.meta}` : ''}
                            </span>
                          </div>
                          <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer with Logout */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Toolbox Word Account • {isEs ? 'Privacidad Total' : 'Total Privacy'}
              </span>
              <button
                onClick={logout}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 hover:bg-rose-100 font-bold text-xs transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{isEs ? 'Cerrar Sesión' : 'Log Out'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
