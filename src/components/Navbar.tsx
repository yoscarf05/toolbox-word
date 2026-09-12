import React, { useState, useRef, useEffect } from 'react';
import { Language, ThemeMode } from '../types';
import { getTranslation } from '../i18n';
import { CATEGORIES } from '../data/categories';
import { DynamicIcon } from './DynamicIcon';
import { useAuth } from '../context/AuthContext';
import { 
  Wrench, 
  Search, 
  Moon, 
  Sun, 
  Monitor, 
  Globe, 
  Menu, 
  X, 
  ChevronDown, 
  User, 
  Star,
  Settings,
  BookOpen
} from 'lucide-react';

interface NavbarProps {
  currentLang: Language;
  onLanguageChange: (lang: Language) => void;
  currentTheme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
  onNavigate: (route: string) => void;
  onOpenSearch: () => void;
  onOpenAdmin: () => void;
}

const LANG_OPTIONS: { code: Language; label: string; flag: string }[] = [
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'pt', label: 'Português', flag: '🇧🇷' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
];

export const Navbar: React.FC<NavbarProps> = ({
  currentLang,
  onLanguageChange,
  currentTheme,
  onThemeChange,
  onNavigate,
  onOpenSearch,
  onOpenAdmin
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);

  const { user, isAdmin, isSuperAdmin, setIsAuthModalOpen, setIsProfileModalOpen, favoriteTools } = useAuth();

  const langRef = useRef<HTMLDivElement>(null);
  const themeRef = useRef<HTMLDivElement>(null);
  const catRef = useRef<HTMLDivElement>(null);

  const isEs = currentLang === 'es';

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangDropdownOpen(false);
      }
      if (themeRef.current && !themeRef.current.contains(e.target as Node)) {
        setThemeDropdownOpen(false);
      }
      if (catRef.current && !catRef.current.contains(e.target as Node)) {
        setCategoriesOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getThemeIcon = () => {
    if (currentTheme === 'light') return <Sun className="w-4 h-4 text-amber-500" />;
    if (currentTheme === 'dark') return <Moon className="w-4 h-4 text-blue-400" />;
    return <Monitor className="w-4 h-4 text-slate-500" />;
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          
          {/* Logo */}
          <div className="flex items-center gap-6">
            <button
              id="brand-logo-btn"
              onClick={() => onNavigate('#/')}
              className="flex items-center gap-2.5 group cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg p-1"
              aria-label="Toolbox Word Inicio"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <Wrench className="w-5 h-5" />
              </div>
              <div className="flex flex-col text-left">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                  Toolbox <span className="text-blue-600 dark:text-blue-400">Word</span>
                </span>
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 tracking-wide uppercase">
                  Digital Utilities
                </span>
              </div>
            </button>

            {/* Quick Flagship Shortcuts on Desktop */}
            <div className="hidden xl:flex items-center gap-1">
              <button
                onClick={() => onNavigate('/tool/pdf-to-word')}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 transition-colors cursor-pointer"
              >
                PDF a Word
              </button>
              <button
                onClick={() => onNavigate('/tool/citation-generator')}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition-colors cursor-pointer"
              >
                {isEs ? 'Citas APA/MLA' : 'APA/MLA Citations'}
              </button>
            </div>

            {/* Desktop Categories Dropdown */}
            <div className="hidden lg:block relative" ref={catRef}>
              <button
                id="navbar-categories-btn"
                onClick={() => setCategoriesOpen(!categoriesOpen)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                aria-expanded={categoriesOpen}
              >
                <span>{getTranslation(currentLang, 'allCategories')}</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${categoriesOpen ? 'rotate-180' : ''}`} />
              </button>

              {categoriesOpen && (
                <div className="absolute left-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-2 grid grid-cols-1 gap-1 z-50 animate-fade-in">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        onNavigate(`#/category/${cat.id}`);
                        setCategoriesOpen(false);
                      }}
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                          <DynamicIcon name={cat.icon} className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                            {cat.name[currentLang] || cat.name.es}
                          </p>
                        </div>
                      </div>
                      <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                        {cat.count}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Guides Link */}
            <button
              onClick={() => onNavigate('/guides')}
              className="hidden md:flex items-center gap-1 px-3 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
            >
              <span>{isEs ? 'Guías y Tutoriales' : 'Guides & Tutorials'}</span>
            </button>
          </div>

          {/* Center/Right: Fast Search Trigger & Controls */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            
            {/* Search Trigger Button */}
            <button
              id="navbar-search-trigger"
              onClick={onOpenSearch}
              className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700/60 transition-colors cursor-pointer text-xs sm:text-sm font-medium"
              aria-label={getTranslation(currentLang, 'searchAriaLabel')}
            >
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="hidden sm:inline-block text-slate-500 dark:text-slate-400">
                {isEs ? 'Buscar herramienta...' : 'Search tools...'}
              </span>
              <kbd className="hidden md:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded shadow-xs">
                ⌘K
              </kbd>
            </button>

            {/* Language Selector */}
            <div className="relative" ref={langRef}>
              <button
                id="lang-dropdown-btn"
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className="p-2 sm:px-2.5 sm:py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                aria-label={getTranslation(currentLang, 'languageSelector')}
                title={getTranslation(currentLang, 'languageSelector')}
              >
                <Globe className="w-4 h-4 text-slate-500" />
                <span className="hidden sm:inline uppercase">{currentLang}</span>
                <ChevronDown className="w-3 h-3 text-slate-400 hidden sm:inline" />
              </button>

              {langDropdownOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 p-1.5 z-50 animate-fade-in">
                  {LANG_OPTIONS.map((opt) => (
                    <button
                      key={opt.code}
                      onClick={() => {
                        onLanguageChange(opt.code);
                        setLangDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                        currentLang === opt.code
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold'
                          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span>{opt.flag}</span>
                        <span>{opt.label}</span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Theme Selector */}
            <div className="relative" ref={themeRef}>
              <button
                id="theme-dropdown-btn"
                onClick={() => setThemeDropdownOpen(!themeDropdownOpen)}
                className="p-2 sm:px-2.5 sm:py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                aria-label={getTranslation(currentLang, 'themeSelector')}
                title={getTranslation(currentLang, 'themeSelector')}
              >
                {getThemeIcon()}
                <ChevronDown className="w-3 h-3 text-slate-400 hidden sm:inline" />
              </button>

              {themeDropdownOpen && (
                <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 p-1.5 z-50 animate-fade-in">
                  <button
                    onClick={() => {
                      onThemeChange('system');
                      setThemeDropdownOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                      currentTheme === 'system'
                        ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Monitor className="w-4 h-4" />
                    <span>{getTranslation(currentLang, 'themeSystem')}</span>
                  </button>
                  <button
                    onClick={() => {
                      onThemeChange('light');
                      setThemeDropdownOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                      currentTheme === 'light'
                        ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Sun className="w-4 h-4 text-amber-500" />
                    <span>{getTranslation(currentLang, 'themeLight')}</span>
                  </button>
                  <button
                    onClick={() => {
                      onThemeChange('dark');
                      setThemeDropdownOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                      currentTheme === 'dark'
                        ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Moon className="w-4 h-4 text-blue-400" />
                    <span>{getTranslation(currentLang, 'themeDark')}</span>
                  </button>
                </div>
              )}
            </div>

            {/* User Account / Profile Button */}
            {user ? (
              <button
                onClick={() => setIsProfileModalOpen(true)}
                className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold text-xs transition-colors cursor-pointer"
                title={user.name}
              >
                <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center font-extrabold text-[11px]">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:inline max-w-[100px] truncate">{user.name}</span>
              </button>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-colors cursor-pointer"
                title={isEs ? 'Iniciar sesión opcional' : 'Sign in'}
              >
                <User className="w-4 h-4 text-slate-500" />
                <span className="hidden sm:inline">{isEs ? 'Acceder' : 'Sign In'}</span>
              </button>
            )}

            {/* Admin trigger - Strictly visible only when authenticated as Admin or Super Admin */}
            {isAdmin && (
              <button
                onClick={onOpenAdmin}
                className={`p-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 ${
                  isSuperAdmin
                    ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 hover:bg-amber-100'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title={isSuperAdmin ? 'Panel de Super Administrador' : getTranslation(currentLang, 'adminAccess')}
                aria-label={getTranslation(currentLang, 'adminAccess')}
              >
                <Settings className="w-4 h-4" />
                <span className="hidden lg:inline text-xs font-bold">{isSuperAdmin ? 'Super Admin' : 'Admin'}</span>
              </button>
            )}

            {/* Mobile Menu Button (touch friendly >= 44px) */}
            <button
              id="mobile-menu-toggle-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2.5 min-h-[44px] min-w-[44px] rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center cursor-pointer"
              aria-label="Abrir menú"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pt-3 pb-6 space-y-4 animate-fade-in shadow-xl">
          {/* User Status */}
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                {user ? user.name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  {user ? user.name : (isEs ? 'Espacio Personal Opcional' : 'Optional Account')}
                </p>
                <p className="text-[10px] text-slate-500">
                  {user ? user.email : (isEs ? 'Guarda favoritos y citas' : 'Save favorites and citations')}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                if (user) setIsProfileModalOpen(true);
                else setIsAuthModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold cursor-pointer"
            >
              {user ? (isEs ? 'Ver Perfil' : 'Profile') : (isEs ? 'Acceder' : 'Sign In')}
            </button>
          </div>

          <div className="pt-1">
            <span className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
              {isEs ? 'Herramientas Principales' : 'Flagship Tools'}
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  onNavigate('/tool/pdf-to-word');
                  setMobileMenuOpen(false);
                }}
                className="min-h-[44px] flex items-center gap-2 p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-xs font-bold text-blue-700 dark:text-blue-300 text-left border border-blue-200/60 dark:border-blue-900/60"
              >
                <span>PDF a Word</span>
              </button>
              <button
                onClick={() => {
                  onNavigate('/tool/citation-generator');
                  setMobileMenuOpen(false);
                }}
                className="min-h-[44px] flex items-center gap-2 p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-xs font-bold text-indigo-700 dark:text-indigo-300 text-left border border-indigo-200/60 dark:border-indigo-900/60"
              >
                <span>{isEs ? 'Citas APA/MLA' : 'APA Citations'}</span>
              </button>
            </div>
          </div>

          <div className="pt-2">
            <span className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
              {getTranslation(currentLang, 'allCategories')}
            </span>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    onNavigate(`#/category/${cat.id}`);
                    setMobileMenuOpen(false);
                  }}
                  className="min-h-[44px] flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-800 dark:text-slate-200 text-left"
                >
                  <DynamicIcon name={cat.icon} className="w-4 h-4 shrink-0 text-blue-600 dark:text-blue-400" />
                  <span>
                    {cat.name[currentLang] || cat.name.es}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
            <button
              onClick={() => {
                onNavigate('/guides');
                setMobileMenuOpen(false);
              }}
              className="min-h-[44px] flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 text-sm font-semibold text-slate-800 dark:text-slate-200 text-left"
            >
              <span>{isEs ? 'Guías y Tutoriales' : 'Guides & Tutorials'}</span>
              <span className="text-xs text-blue-600 dark:text-blue-400 font-bold">→</span>
            </button>
            <button
              onClick={() => {
                onNavigate('#/about');
                setMobileMenuOpen(false);
              }}
              className="min-h-[44px] flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 text-sm font-semibold text-slate-800 dark:text-slate-200 text-left"
            >
              <span>{getTranslation(currentLang, 'about')}</span>
            </button>
            <button
              onClick={() => {
                onNavigate('#/contact');
                setMobileMenuOpen(false);
              }}
              className="min-h-[44px] flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 text-sm font-semibold text-slate-800 dark:text-slate-200 text-left"
            >
              <span>{getTranslation(currentLang, 'contact')}</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
