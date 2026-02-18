
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, LoginResponse, AuthTokenResponse, AccountMode } from '../api/types';
import { apiClient } from '../api/client';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  accountMode: AccountMode;
  setAccountMode: (mode: AccountMode) => void;
  autoTradeEnabled: boolean;
  setAutoTradeEnabled: (enabled: boolean) => void;
  aiConfidenceThreshold: number;
  setAiConfidenceThreshold: (threshold: number) => void;
  aiOrderTypePreference: 'MARKET' | 'LIMIT';
  setAiOrderTypePreference: (type: 'MARKET' | 'LIMIT') => void;
  login: (data: LoginResponse & AuthTokenResponse) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [accountMode, setAccountModeState] = useState<AccountMode>(() => {
    return (localStorage.getItem('account_mode') as AccountMode) || 'DEMO';
  });

  const [autoTradeEnabled, setAutoTradeEnabledState] = useState<boolean>(() => {
    return localStorage.getItem('auto_trade_enabled') === 'true';
  });

  const [aiConfidenceThreshold, setAiConfidenceThresholdState] = useState<number>(() => {
    const saved = localStorage.getItem('ai_confidence_threshold');
    return saved ? parseInt(saved, 10) : 92;
  });

  const [aiOrderTypePreference, setAiOrderTypePreferenceState] = useState<'MARKET' | 'LIMIT'>(() => {
    const saved = localStorage.getItem('ai_order_type_preference');
    return (saved as 'MARKET' | 'LIMIT') || 'MARKET';
  });

  const setAccountMode = (mode: AccountMode) => {
    if (mode === 'REAL' && !user?.mt5_linked) {
      console.warn("Real mode requires MT5 link");
      return;
    }
    localStorage.setItem('account_mode', mode);
    setAccountModeState(mode);
  };

  const setAutoTradeEnabled = (enabled: boolean) => {
    localStorage.setItem('auto_trade_enabled', String(enabled));
    setAutoTradeEnabledState(enabled);
  };

  const setAiConfidenceThreshold = (threshold: number) => {
    localStorage.setItem('ai_confidence_threshold', String(threshold));
    setAiConfidenceThresholdState(threshold);
  };

  const setAiOrderTypePreference = (type: 'MARKET' | 'LIMIT') => {
    localStorage.setItem('ai_order_type_preference', type);
    setAiOrderTypePreferenceState(type);
  };

  const checkAuth = async () => {
    const token = localStorage.getItem('access_token');
    const apiKey = localStorage.getItem('x_api_key');
    
    if (token || apiKey) {
      try {
        const res = await apiClient.get('/api/auth/user/');
        setUser(res.data);
      } catch (e) {
        console.error("Auth verification failed", e);
        logout();
      }
    }
    setIsLoading(false);
  };

  const refreshUser = async () => {
    try {
      const res = await apiClient.get('/api/auth/user/');
      setUser(res.data);
    } catch (e) {
      console.error("Failed to refresh user", e);
    }
  };

  useEffect(() => {
    checkAuth();
    
    const handleLogout = () => logout();
    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, []);

  const login = (data: LoginResponse & AuthTokenResponse) => {
    if (data.access) localStorage.setItem('access_token', data.access);
    if (data.refresh) localStorage.setItem('refresh_token', data.refresh);
    if (data.key) localStorage.setItem('x_api_key', data.key);
    
    if (data.user) setUser(data.user);
    else checkAuth();
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('x_api_key');
    localStorage.removeItem('account_mode');
    setUser(null);
    setAccountModeState('DEMO');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: !!user, 
      isLoading,
      accountMode,
      setAccountMode,
      autoTradeEnabled,
      setAutoTradeEnabled,
      aiConfidenceThreshold,
      setAiConfidenceThreshold,
      aiOrderTypePreference,
      setAiOrderTypePreference,
      login, 
      logout,
      refreshUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
