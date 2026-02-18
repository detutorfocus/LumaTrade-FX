
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
  aiMaxPositions: number;
  setAiMaxPositions: (count: number) => void;
  aiSlippageTolerance: number;
  setAiSlippageTolerance: (pips: number) => void;
  login: (data: LoginResponse & AuthTokenResponse) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [accountMode, setAccountModeState] = useState<AccountMode>(() => (localStorage.getItem('account_mode') as AccountMode) || 'DEMO');
  const [autoTradeEnabled, setAutoTradeEnabledState] = useState<boolean>(() => localStorage.getItem('auto_trade_enabled') === 'true');
  const [aiConfidenceThreshold, setAiConfidenceThresholdState] = useState<number>(() => {
    const saved = localStorage.getItem('ai_confidence_threshold');
    return saved ? parseInt(saved, 10) : 92;
  });
  const [aiOrderTypePreference, setAiOrderTypePreferenceState] = useState<'MARKET' | 'LIMIT'>(() => (localStorage.getItem('ai_order_type_preference') as 'MARKET' | 'LIMIT') || 'MARKET');
  
  const [aiMaxPositions, setAiMaxPositionsState] = useState<number>(() => {
    const saved = localStorage.getItem('ai_max_positions');
    return saved ? parseInt(saved, 10) : 3;
  });
  
  const [aiSlippageTolerance, setAiSlippageToleranceState] = useState<number>(() => {
    const saved = localStorage.getItem('ai_slippage_tolerance');
    return saved ? parseFloat(saved) : 2.5;
  });

  const setAccountMode = (mode: AccountMode) => {
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

  const setAiMaxPositions = (count: number) => {
    localStorage.setItem('ai_max_positions', String(count));
    setAiMaxPositionsState(count);
  };

  const setAiSlippageTolerance = (pips: number) => {
    localStorage.setItem('ai_slippage_tolerance', String(pips));
    setAiSlippageToleranceState(pips);
  };

  const checkAuth = async () => {
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        const res = await apiClient.get('/api/auth/user/');
        setUser(res.data);
      } catch (e) {
        logout();
      }
    }
    setIsLoading(false);
  };

  const refreshUser = async () => {
    try {
      const res = await apiClient.get('/api/auth/user/');
      setUser(res.data);
    } catch (e) {}
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = (data: any) => {
    if (data.access) localStorage.setItem('access_token', data.access);
    if (data.user) setUser(data.user);
    else refreshUser();
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
    setAccountModeState('DEMO');
  };

  return (
    <AuthContext.Provider value={{ 
      user, isAuthenticated: !!user, isLoading, accountMode, setAccountMode,
      autoTradeEnabled, setAutoTradeEnabled, aiConfidenceThreshold, setAiConfidenceThreshold,
      aiOrderTypePreference, setAiOrderTypePreference, aiMaxPositions, setAiMaxPositions,
      aiSlippageTolerance, setAiSlippageTolerance, login, logout, refreshUser
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
