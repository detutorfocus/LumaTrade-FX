
export type AccountMode = 'DEMO' | 'REAL';

export interface User {
  pk: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  mt5_linked?: boolean;
}

export interface AuthTokenResponse {
  access: string;
  refresh: string;
}

export interface LoginResponse {
  key?: string; // X-API-Key or similar from /auth/login/
  token?: string;
  user?: User;
  two_factor_required?: boolean;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password1: string;
  password2: string;
  first_name?: string;
  last_name?: string;
}

export interface MT5Position {
  ticket: number;
  symbol: string;
  type: 'BUY' | 'SELL';
  volume: number;
  open_price: number;
  current_price: number; // Used as live price for active positions
  close_price?: number;  // Only for historical trades
  profit: number;
  swap: number;
  commission: number;
  time: string;          // Open time
  close_time?: string;   // Only for historical trades
  mode?: AccountMode;    // Execution mode
}

export interface MT5Order {
  ticket: number;
  symbol: string;
  type: 'BUY_LIMIT' | 'SELL_LIMIT' | 'BUY_STOP' | 'SELL_STOP';
  volume: number;
  price: number;
  time: string;
}

export interface MarketData {
  symbol: string;
  bid: number;
  ask: number;
  timestamp: string;
}

export interface SecurityActivity {
  id: number;
  event_type: string;
  ip_address: string;
  user_agent: string;
  success: boolean;
  created_at: string;
}

export interface ChatRequest {
  message: string;
  context?: Record<string, any>;
}

export interface ChatResponse {
  response: string;
  status: string;
}

export interface MT5ConnectRequest {
  login: string;
  password?: string;
  server: string;
}
