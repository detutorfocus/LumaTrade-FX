
export interface UserDetails {
  pk: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
}

export interface TokenObtainPair {
  access: string;
  refresh: string;
}

export interface Trade {
  id: number;
  symbol: string;
  side: 'BUY' | 'SELL';
  lot: string;
  entry_price?: string;
  close_price?: string;
  profit?: string;
  status: string;
  opened_at?: string;
  closed_at?: string;
}

export interface SecurityEvent {
  id: number;
  event_type: string;
  success: boolean;
  detail: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export enum AppRoute {
  LOGIN = '/login',
  DASHBOARD = '/',
  CHAT = '/chat',
  NEWS = '/news',
  TRADES = '/trades',
  AUDIT = '/audit',
  SETTINGS = '/settings',
  PROFILE = '/profile',
  CHART = '/chart/:symbol',
  TERMS = '/terms'
}
