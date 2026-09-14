import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserProfile, UserHistoryItem, Language } from '../types';
import { sendAnalyticsEvent, startAnalyticsHeartbeat } from '../utils/analytics';
import { safeFetchJson } from '../utils/api';

export interface SavedCitationItem {
  id: string;
  style: string;
  sourceType: string;
  inTextCitation: string;
  fullReference: string;
  title: string;
  authors: string;
  year: string;
  timestamp: number;
}

export interface LoginResult {
  success: boolean;
  needsBootstrap?: boolean;
  requires2FA?: boolean;
  setup2FA?: boolean;
  tempToken?: string;
  qrCodeDataUrl?: string;
  secret?: string;
  recoveryCodes?: string[];
  message?: string;
  error?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  verify2FA: (tempToken: string, code: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; message: string; error?: string }>;
  resetPassword: (token: string, newPassword: string) => Promise<{ success: boolean; message: string; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => void;
  // Dynamic Greeting
  getGreeting: (lang: Language) => { greeting: string; subtext: string };
  // Favorites
  favoriteTools: string[];
  favoriteGuides: string[];
  toggleFavoriteTool: (slug: string) => void;
  toggleFavoriteGuide: (slug: string) => void;
  isFavoriteTool: (slug: string) => boolean;
  isFavoriteGuide: (slug: string) => boolean;
  // History
  history: UserHistoryItem[];
  addHistoryItem: (item: Omit<UserHistoryItem, 'id' | 'timestamp'>) => void;
  clearHistory: () => void;
  // Saved Citations
  savedCitations: SavedCitationItem[];
  saveCitation: (cit: Omit<SavedCitationItem, 'id' | 'timestamp'>) => void;
  removeCitation: (id: string) => void;
  // Modals state
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  isProfileModalOpen: boolean;
  setIsProfileModalOpen: (open: boolean) => void;
  // Bootstrap state
  needsBootstrap: boolean;
  checkBootstrapStatus: () => Promise<boolean>;
  // Refresh user profile from server
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem('toolbox_token');
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(true);

  // Favorites
  const [favoriteTools, setFavoriteTools] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('toolbox_fav_tools');
      return saved ? JSON.parse(saved) : ['pdf-to-word', 'citation-generator'];
    } catch {
      return ['pdf-to-word', 'citation-generator'];
    }
  });

  const [favoriteGuides, setFavoriteGuides] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('toolbox_fav_guides');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // History
  const [history, setHistory] = useState<UserHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('toolbox_history_items');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Citations
  const [savedCitations, setSavedCitations] = useState<SavedCitationItem[]>(() => {
    try {
      const saved = localStorage.getItem('toolbox_saved_citations');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // UI Modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [needsBootstrap, setNeedsBootstrap] = useState(false);

  // Check if system requires initial super admin bootstrap
  const checkBootstrapStatus = useCallback(async (): Promise<boolean> => {
    try {
      const res = await safeFetchJson<{ needsBootstrap: boolean }>('/api/auth/bootstrap-status');
      if (res.ok && res.data?.needsBootstrap) {
        setNeedsBootstrap(true);
        return true;
      }
      setNeedsBootstrap(false);
      return false;
    } catch {
      return false;
    }
  }, []);

  // Check current server session on mount
  const checkSession = useCallback(async () => {
    try {
      setIsLoading(true);
      // Run bootstrap check in parallel with session check
      checkBootstrapStatus();
      const headers: Record<string, string> = {};
      const savedToken = localStorage.getItem('toolbox_token');
      if (savedToken) {
        headers['Authorization'] = `Bearer ${savedToken}`;
      }

      const res = await safeFetchJson<{ authenticated: boolean; user: UserProfile; sessionId?: string }>('/api/auth/me', { headers });
      if (res.ok && res.data?.authenticated && res.data.user) {
        setUser(res.data.user);
        if (res.data.sessionId) {
          setToken(res.data.sessionId);
          localStorage.setItem('toolbox_token', res.data.sessionId);
        }
      } else {
        setUser(null);
        setToken(null);
        localStorage.removeItem('toolbox_token');
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
    startAnalyticsHeartbeat();
  }, [checkSession]);

  // Sync state to localStorage
  useEffect(() => {
    localStorage.setItem('toolbox_fav_tools', JSON.stringify(favoriteTools));
  }, [favoriteTools]);

  useEffect(() => {
    localStorage.setItem('toolbox_fav_guides', JSON.stringify(favoriteGuides));
  }, [favoriteGuides]);

  useEffect(() => {
    localStorage.setItem('toolbox_history_items', JSON.stringify(history.slice(0, 30)));
  }, [history]);

  useEffect(() => {
    localStorage.setItem('toolbox_saved_citations', JSON.stringify(savedCitations));
  }, [savedCitations]);

  // Unified login via Email + Password
  const login = async (email: string, password: string): Promise<LoginResult> => {
    try {
      const res = await safeFetchJson<any>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      if (res.data?.needsBootstrap) {
        setNeedsBootstrap(true);
        return {
          success: false,
          needsBootstrap: true,
          error: res.data.message || 'Configuración inicial requerida.'
        };
      }

      if (!res.ok) {
        return {
          success: false,
          needsBootstrap: res.data?.needsBootstrap || false,
          error: res.message || 'Error al iniciar sesión'
        };
      }

      const data = res.data;

      // If Super Admin requires 2FA:
      if (data.requires2FA) {
        return {
          success: true,
          requires2FA: true,
          setup2FA: data.setup2FA,
          tempToken: data.tempToken,
          qrCodeDataUrl: data.qrCodeDataUrl,
          secret: data.secret,
          recoveryCodes: data.recoveryCodes,
          message: data.message
        };
      }

      // Normal User or Regular Admin login completed:
      if (data.user && data.token) {
        setUser(data.user);
        setToken(data.token);
        localStorage.setItem('toolbox_token', data.token);
        setIsAuthModalOpen(false);

        sendAnalyticsEvent({
          type: 'login',
          details: { role: data.user.role }
        });

        return { success: true };
      }

      return { success: false, error: 'Respuesta inesperada del servidor.' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error de conexión con el servidor.' };
    }
  };

  // Verify TOTP 2FA for Super Admin
  const verify2FA = async (tempToken: string, code: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await safeFetchJson<any>('/api/auth/verify-2fa', {
        method: 'POST',
        body: JSON.stringify({ tempToken, code })
      });

      if (!res.ok) {
        return {
          success: false,
          error: res.message || 'Código incorrecto'
        };
      }

      const data = res.data;

      if (data.user && data.token) {
        setUser(data.user);
        setToken(data.token);
        localStorage.setItem('toolbox_token', data.token);
        setIsAuthModalOpen(false);

        sendAnalyticsEvent({
          type: 'login',
          details: { role: 'super_admin', method: 'totp_verified' }
        });

        return { success: true };
      }

      return { success: false, error: 'Error al verificar sesión administrativa.' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error de conexión.' };
    }
  };

  // Register standard user account
  const register = async (name: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await safeFetchJson<any>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password })
      });

      if (!res.ok) {
        return {
          success: false,
          error: res.message || 'Error al registrar la cuenta.'
        };
      }

      const data = res.data;

      if (data.user && data.token) {
        setUser(data.user);
        setToken(data.token);
        localStorage.setItem('toolbox_token', data.token);
        setIsAuthModalOpen(false);

        sendAnalyticsEvent({
          type: 'signup',
          details: { role: 'user' }
        });

        return { success: true };
      }

      return { success: false, error: 'Respuesta inválida del servidor.' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error al conectar con el servidor.' };
    }
  };

  // Request Password Reset
  const requestPasswordReset = async (email: string): Promise<{ success: boolean; message: string; error?: string }> => {
    try {
      const res = await safeFetchJson<any>('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email })
      });

      if (!res.ok) {
        return {
          success: false,
          message: res.message || 'Error al solicitar recuperación de contraseña.',
          error: res.error
        };
      }

      return {
        success: true,
        message: res.data?.message || 'Si el correo está registrado, se han generado las instrucciones de recuperación.'
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Error de conexión.',
        error: 'NetworkError'
      };
    }
  };

  // Reset Password with Token
  const resetPassword = async (token: string, newPassword: string): Promise<{ success: boolean; message: string; error?: string }> => {
    try {
      const res = await safeFetchJson<any>('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, newPassword })
      });

      if (!res.ok) {
        return {
          success: false,
          message: res.message || 'Error al restablecer la contraseña.',
          error: res.error
        };
      }

      return {
        success: true,
        message: res.data?.message || 'Contraseña actualizada con éxito.'
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Error de conexión.',
        error: 'NetworkError'
      };
    }
  };

  // Logout
  const logout = async () => {
    try {
      const savedToken = token || localStorage.getItem('toolbox_token');
      const headers: Record<string, string> = {};
      if (savedToken) {
        headers['Authorization'] = `Bearer ${savedToken}`;
      }
      await fetch('/api/auth/logout', { method: 'POST', headers }).catch(() => {});
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('toolbox_token');
      setIsProfileModalOpen(false);
      sendAnalyticsEvent({ type: 'logout' });
    }
  };

  const updateProfile = (data: Partial<UserProfile>) => {
    if (!user) return;
    setUser({ ...user, ...data });
  };

  // Dynamic greeting
  const getGreeting = (lang: Language): { greeting: string; subtext: string } => {
    const hour = new Date().getHours();
    const isEs = lang === 'es';

    if (user && user.name) {
      const name = user.name;
      if (hour >= 5 && hour < 12) {
        return {
          greeting: isEs ? `Buenos días, ${name}.` : `Good morning, ${name}.`,
          subtext: isEs ? 'Es un gusto tenerte por aquí. ¿Qué documento o tarea prepararemos hoy?' : 'It is a pleasure to have you here. What task are we working on today?'
        };
      } else if (hour >= 12 && hour < 20) {
        return {
          greeting: isEs ? `Buenas tardes, ${name}.` : `Good afternoon, ${name}.`,
          subtext: isEs ? 'Es un gusto tenerte por aquí. Tus herramientas y citas están listas.' : 'It is a pleasure to have you here. Your tools and citations are ready.'
        };
      } else {
        return {
          greeting: isEs ? `Buenas noches, ${name}.` : `Good evening, ${name}.`,
          subtext: isEs ? 'Es un gusto tenerte por aquí. Productividad y seguridad sin límites de horario.' : 'It is a pleasure to have you here. Seamless productivity and security anytime.'
        };
      }
    }

    return {
      greeting: isEs ? 'Bienvenido a Toolbox Word' : 'Welcome to Toolbox Word',
      subtext: isEs
        ? 'Herramientas online rápidas, seguras y privadas. Todo se procesa en tu navegador sin necesidad de registro.'
        : 'Fast, secure, and private online tools. Everything processes right in your browser without mandatory sign-up.'
    };
  };

  const toggleFavoriteTool = (slug: string) => {
    setFavoriteTools((prev) => {
      const isFav = prev.includes(slug);
      const updated = isFav ? prev.filter((s) => s !== slug) : [...prev, slug];
      sendAnalyticsEvent({
        type: isFav ? 'favorite_removed' : 'favorite_added',
        toolSlug: slug
      });
      return updated;
    });
  };

  const toggleFavoriteGuide = (slug: string) => {
    setFavoriteGuides((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  const isFavoriteTool = (slug: string) => favoriteTools.includes(slug);
  const isFavoriteGuide = (slug: string) => favoriteGuides.includes(slug);

  const addHistoryItem = (item: Omit<UserHistoryItem, 'id' | 'timestamp'>) => {
    const newItem: UserHistoryItem = {
      ...item,
      id: Date.now().toString(),
      timestamp: Date.now()
    };
    setHistory((prev) => [newItem, ...prev.filter((p) => p.slug !== item.slug || p.type !== item.type)].slice(0, 30));
  };

  const clearHistory = () => {
    setHistory([]);
  };

  const saveCitation = (cit: Omit<SavedCitationItem, 'id' | 'timestamp'>) => {
    const newCit: SavedCitationItem = {
      ...cit,
      id: Date.now().toString(),
      timestamp: Date.now()
    };
    setSavedCitations((prev) => [newCit, ...prev]);
  };

  const removeCitation = (id: string) => {
    setSavedCitations((prev) => prev.filter((c) => c.id !== id));
  };

  const isSuperAdmin = !!(user && user.role === 'super_admin');
  const isAdmin = !!(user && (user.role === 'admin' || user.role === 'super_admin'));

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isAdmin,
        isSuperAdmin,
        isLoading,
        login,
        verify2FA,
        register,
        requestPasswordReset,
        resetPassword,
        logout,
        updateProfile,
        getGreeting,
        favoriteTools,
        favoriteGuides,
        toggleFavoriteTool,
        toggleFavoriteGuide,
        isFavoriteTool,
        isFavoriteGuide,
        history,
        addHistoryItem,
        clearHistory,
        savedCitations,
        saveCitation,
        removeCitation,
        isAuthModalOpen,
        setIsAuthModalOpen,
        isProfileModalOpen,
        setIsProfileModalOpen,
        needsBootstrap,
        checkBootstrapStatus,
        refreshUser: checkSession
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
