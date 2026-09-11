import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Language } from '../types';
import { TOOLS } from '../data/tools';
import { GUIDES } from '../data/guides';
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
  Sparkles
} from 'lucide-react';

interface UserAuthModalsProps {
  lang: Language;
  onNavigate: (route: string) => void;
}

export const UserAuthModals: React.FC<UserAuthModalsProps> = ({ lang, onNavigate }) => {
  const {
    user,
    isAuthenticated,
    login,
    logout,
    favoriteTools,
    favoriteGuides,
    toggleFavoriteTool,
    toggleFavoriteGuide,
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
  const [errorMsg, setErrorMsg] = useState('');

  // Profile Modal State
  const [profileTab, setProfileTab] = useState<'favorites' | 'citations' | 'history'>('favorites');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const isEs = lang === 'es';

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg(isEs ? 'Ingresa un correo electrónico válido.' : 'Please enter a valid email address.');
      return;
    }
    if (authMode === 'register' && !name.trim()) {
      setErrorMsg(isEs ? 'Ingresa tu nombre o tratamiento (ej. Sr. Yocar).' : 'Please enter your name.');
      return;
    }

    const displayName = authMode === 'register' 
      ? name.trim() 
      : (email.toLowerCase().includes('yocar') ? 'Sr. Yocar' : email.split('@')[0]);

    login(displayName, email);
    setName('');
    setEmail('');
    setPassword('');
    setErrorMsg('');
  };

  const handleQuickDemo = (demoName: string, demoEmail: string) => {
    login(demoName, demoEmail);
  };

  const handleCopyCitation = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. AUTH MODAL (LOGIN / REGISTER) - COMPLETELY VOLUNTARY */}
      {/* ========================================================================= */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            {/* Header */}
            <div className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {authMode === 'login'
                      ? (isEs ? 'Iniciar Sesión' : 'Sign In')
                      : (isEs ? 'Crear Cuenta' : 'Create Account')}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {isEs ? 'Acceso voluntario a tu espacio personal' : 'Voluntary personal account access'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAuthModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 space-y-4">
              {/* Tab Selector */}
              <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                <button
                  onClick={() => setAuthMode('login')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    authMode === 'login'
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  {isEs ? 'Iniciar Sesión' : 'Sign In'}
                </button>
                <button
                  onClick={() => setAuthMode('register')}
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
                      {isEs ? 'Nombre o tratamiento deseado' : 'Full Name or Title'}
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={isEs ? 'Ej: Sr. Yocar o María López' : 'e.g. Mr. Yocar or Alex Smith'}
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
                  className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-colors cursor-pointer"
                >
                  {authMode === 'login'
                    ? (isEs ? 'Acceder a mi cuenta' : 'Log In to My Account')
                    : (isEs ? 'Completar Registro' : 'Complete Registration')}
                </button>
              </form>

              {/* Quick Login Shortcut */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <button
                  type="button"
                  onClick={() => handleQuickDemo('Sr. Yocar', 'yoscarelduro05@gmail.com')}
                  className="w-full py-2 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>{isEs ? 'Entrar como Sr. Yocar' : 'Quick Sign In as Mr. Yocar'}</span>
                </button>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-[11px] text-slate-500 dark:text-slate-400 flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>
                    {isEs
                      ? 'Todas las herramientas pueden usarse sin registro. La cuenta te permite guardar favoritos y citas generadas en este navegador.'
                      : 'All tools can be used without an account. Logging in allows saving favorites and citation history.'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. PROFILE MODAL (FAVORITES, CITATIONS, HISTORY, LOGOUT) */}
      {/* ========================================================================= */}
      {isProfileModalOpen && user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-extrabold text-lg shadow-md shadow-blue-500/20">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {user.name}
                  </h3>
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
