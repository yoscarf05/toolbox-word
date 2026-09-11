import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserHistoryItem, Language } from '../types';

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

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  login: (name: string, email: string) => void;
  logout: () => void;
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // User state
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('toolbox_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

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

  // Sync to localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem('toolbox_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('toolbox_user');
    }
  }, [user]);

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

  const login = (name: string, email: string) => {
    const newUser: UserProfile = {
      id: Date.now().toString(),
      name: name.trim() || 'Usuario',
      email: email.trim().toLowerCase() || 'usuario@toolboxword.com',
      createdAt: Date.now()
    };
    setUser(newUser);
    setIsAuthModalOpen(false);
  };

  const logout = () => {
    setUser(null);
    setIsProfileModalOpen(false);
  };

  const updateProfile = (data: Partial<UserProfile>) => {
    if (!user) return;
    setUser({ ...user, ...data });
  };

  // Dynamic greeting matching time of day
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

    // Generic polite greeting for unauthenticated guests
    return {
      greeting: isEs ? 'Bienvenido a Toolbox Word' : 'Welcome to Toolbox Word',
      subtext: isEs
        ? 'Herramientas online rápidas, seguras y privadas. Todo se procesa en tu navegador sin necesidad de registro.'
        : 'Fast, secure, and private online tools. Everything processes right in your browser without mandatory sign-up.'
    };
  };

  const toggleFavoriteTool = (slug: string) => {
    setFavoriteTools((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
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

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
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
        setIsProfileModalOpen
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
