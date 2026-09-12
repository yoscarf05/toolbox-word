import React, { useState, useEffect } from 'react';
import { Language, ThemeMode } from './types';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { CookieBanner } from './components/CookieBanner';
import { SearchModal } from './components/SearchModal';
import { UserAuthModals } from './components/UserAuthModals';
import { ToolLayout } from './components/ToolLayout';
import { HomePage } from './components/HomePage';
import { CategoryPage } from './components/CategoryPage';
import { GuideDetailPage } from './components/GuideDetailPage';
import { GuidesCatalogPage } from './components/GuidesCatalogPage';
import { AdminPage } from './components/AdminPage';
import { 
  PrivacyPage, 
  TermsPage, 
  CookiesPage, 
  AboutPage, 
  ContactPage, 
  DisclaimerPage 
} from './components/LegalPages';
import { TOOLS } from './data/tools';
import { TOOL_COMPONENTS } from './tools';
import { ArrowLeft, Home, Wrench } from 'lucide-react';

export default function App() {
  // Theme state: supports 'system' | 'light' | 'dark'
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('toolbox_theme') as ThemeMode;
    if (saved && ['system', 'light', 'dark'].includes(saved)) return saved;
    return 'system';
  });

  // Language state
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem('toolbox_lang') as Language;
    if (saved && ['es', 'en', 'pt', 'fr', 'de', 'it'].includes(saved)) return saved;
    return 'es';
  });

  // Route state: Supports path and hash-based navigation for iframe & standalone resilience
  const [route, setRoute] = useState<string>(() => {
    const hash = window.location.hash.replace(/^#/, '');
    if (hash) return hash.startsWith('/') ? hash : `/${hash}`;
    return window.location.pathname || '/';
  });

  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);

  // Apply theme to <html> element
  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = () => {
      const isDark = theme === 'dark' || (theme === 'system' && mediaQuery.matches);
      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    applyTheme();
    localStorage.setItem('toolbox_theme', theme);

    const listener = () => {
      if (theme === 'system') applyTheme();
    };
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, [theme]);

  // Persist language
  const handleLanguageChange = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem('toolbox_lang', newLang);
  };

  // Synchronize route with history popstate and hashchange
  useEffect(() => {
    const handleRouteSync = () => {
      const hash = window.location.hash.replace(/^#/, '');
      if (hash) {
        setRoute(hash.startsWith('/') ? hash : `/${hash}`);
      } else {
        setRoute(window.location.pathname || '/');
      }
    };

    window.addEventListener('popstate', handleRouteSync);
    window.addEventListener('hashchange', handleRouteSync);
    return () => {
      window.removeEventListener('popstate', handleRouteSync);
      window.removeEventListener('hashchange', handleRouteSync);
    };
  }, []);

  const navigate = (newRoute: string) => {
    setRoute(newRoute);
    window.location.hash = newRoute.startsWith('/') ? newRoute.substring(1) : newRoute;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Global Cmd+K / Ctrl+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
      if (e.key === 'Escape' && isSearchOpen) {
        setIsSearchOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen]);

  // Render view based on route
  const renderCurrentView = () => {
    const cleanRoute = route.replace(/^#/, '');

    // Homepage
    if (cleanRoute === '/' || cleanRoute === '') {
      return (
        <HomePage 
          lang={lang} 
          onNavigate={navigate} 
          onOpenSearch={() => setIsSearchOpen(true)} 
        />
      );
    }

    // Category page: /category/:id
    if (cleanRoute.startsWith('/category/')) {
      const categoryId = cleanRoute.replace('/category/', '');
      return (
        <CategoryPage 
          categoryId={categoryId} 
          lang={lang} 
          onNavigate={navigate} 
        />
      );
    }

    // Explore / All Tools page: /explore, /tools, /catalog
    if (cleanRoute === '/explore' || cleanRoute === '/tools' || cleanRoute === '/catalog') {
      return (
        <CategoryPage 
          categoryId="all" 
          lang={lang} 
          onNavigate={navigate} 
        />
      );
    }

    // Single Tool page: /tool/:slug
    if (cleanRoute.startsWith('/tool/')) {
      const slug = cleanRoute.replace('/tool/', '');
      const tool = TOOLS.find((t) => t.slug === slug);
      const ToolComponent = TOOL_COMPONENTS[slug];

      if (tool && ToolComponent) {
        return (
          <ToolLayout tool={tool} lang={lang} onNavigate={navigate}>
            <ToolComponent lang={lang} />
          </ToolLayout>
        );
      }

      // Tool Not Found Fallback
      return (
        <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
            <Wrench className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            {lang === 'es' ? 'Herramienta no encontrada' : 'Tool not found'}
          </h2>
          <p className="text-sm text-slate-500">
            {lang === 'es' 
              ? 'La herramienta que buscas no existe o fue reubicada.' 
              : 'The tool you are looking for does not exist or has been relocated.'}
          </p>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-xs shadow-sm hover:bg-blue-700 transition-colors cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>{lang === 'es' ? 'Volver al catálogo principal' : 'Return to Catalog'}</span>
          </button>
        </div>
      );
    }

    // Guides Catalog Page: /guides or /guides/:category
    if (cleanRoute === '/guides' || cleanRoute.startsWith('/guides/')) {
      const categoryParam = cleanRoute.startsWith('/guides/') ? cleanRoute.replace('/guides/', '') : 'all';
      return (
        <GuidesCatalogPage 
          lang={lang} 
          onNavigate={navigate} 
          initialCategory={categoryParam || 'all'} 
        />
      );
    }

    // Guide Detail Page: /guide/:slug
    if (cleanRoute.startsWith('/guide/')) {
      const guideSlug = cleanRoute.replace('/guide/', '');
      return (
        <GuideDetailPage 
          guideSlug={guideSlug} 
          lang={lang} 
          onNavigate={navigate} 
        />
      );
    }

    // Legal & Company Pages
    if (cleanRoute === '/privacy') {
      return <PrivacyPage lang={lang} onNavigate={navigate} />;
    }
    if (cleanRoute === '/terms') {
      return <TermsPage lang={lang} onNavigate={navigate} />;
    }
    if (cleanRoute === '/cookies') {
      return <CookiesPage lang={lang} onNavigate={navigate} />;
    }
    if (cleanRoute === '/about') {
      return <AboutPage lang={lang} onNavigate={navigate} />;
    }
    if (cleanRoute === '/contact') {
      return <ContactPage lang={lang} onNavigate={navigate} />;
    }
    if (cleanRoute === '/disclaimer') {
      return <DisclaimerPage lang={lang} onNavigate={navigate} />;
    }
    if (cleanRoute === '/admin') {
      return <AdminPage lang={lang} onNavigate={navigate} />;
    }

    // 404 Fallback
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center space-y-4">
        <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white font-mono">404</h2>
        <p className="text-sm text-slate-500">
          {lang === 'es' ? 'Página no encontrada en Toolbox Word.' : 'Page not found on Toolbox Word.'}
        </p>
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-xs shadow-sm hover:bg-blue-700 transition-colors cursor-pointer"
        >
          <Home className="w-4 h-4" />
          <span>{lang === 'es' ? 'Ir al inicio' : 'Go Home'}</span>
        </button>
      </div>
    );
  };

  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-200">
        {/* Persistent Navigation Bar */}
        <Navbar
          currentLang={lang}
          onLanguageChange={handleLanguageChange}
          currentTheme={theme}
          onThemeChange={setTheme}
          onNavigate={navigate}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenAdmin={() => navigate('/admin')}
        />

        {/* Main Content View */}
        <main className="flex-1">
          {renderCurrentView()}
        </main>

        {/* Global Footer */}
        <Footer lang={lang} onNavigate={navigate} />

        {/* GDPR / ePrivacy Cookie Banner */}
        <CookieBanner lang={lang} onNavigate={navigate} />

        {/* Instant Search Overlay Modal */}
        <SearchModal
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          lang={lang}
          onNavigate={navigate}
        />

        {/* Voluntary User Auth & Profile Modals */}
        <UserAuthModals
          lang={lang}
          onNavigate={navigate}
        />
      </div>
    </AuthProvider>
  );
}
