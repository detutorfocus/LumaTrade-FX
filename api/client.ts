
import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.luma-trade.com';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Institutional Price Simulation Engine
 * Maintains internal state for mock prices to simulate real-market fluctuations.
 */
const BASE_PRICES: Record<string, number> = {
  'XAUUSD': 2356.12,
  'EURUSD': 1.0892,
  'BTCUSD': 67210.5,
  'GBPUSD': 1.2645,
  'USDJPY': 151.20,
  'ETHUSD': 3512.40,
  'NAS100': 18050.0,
  'SPX500': 5250.00,
  'AUDUSD': 0.6621,
  'USDCAD': 1.3590
};

const currentPrices = { ...BASE_PRICES };

const updateMockPrices = () => {
  Object.keys(currentPrices).forEach(symbol => {
    const volatility = symbol.includes('BTC') ? 15 : symbol.includes('XAU') ? 0.25 : 0.00015;
    const change = (Math.random() - 0.5) * volatility;
    currentPrices[symbol] += change;
  });
};

// Update prices frequently for internal consistency
setInterval(updateMockPrices, 1000);

const generateMockHistory = (symbol: string, tf: string, count: number = 300) => {
  const data = [];
  const intervalMinutes = tf.includes('m') ? parseInt(tf) : tf.includes('H') ? parseInt(tf) * 60 : 1440;
  let lastClose = currentPrices[symbol] || 1.0;
  const nowInSeconds = Math.floor(Date.now() / 1000);
  let time = nowInSeconds - (count * intervalMinutes * 60);
  
  for (let i = 0; i < count; i++) {
    const volatility = symbol.includes('BTC') ? 200 : symbol.includes('XAU') ? 5 : 0.002;
    const open = lastClose;
    const move = (Math.random() - 0.5) * volatility;
    const close = open + move;
    const high = Math.max(open, close) + Math.random() * (volatility * 0.5);
    const low = Math.min(open, close) - Math.random() * (volatility * 0.5);
    data.push({ time, open, high, low, close });
    time += intervalMinutes * 60;
    lastClose = close;
  }
  return data;
};

const getStoredUser = () => {
  const saved = localStorage.getItem('luma_user_profile');
  return saved ? JSON.parse(saved) : null;
};

const saveUser = (user: any) => {
  localStorage.setItem('luma_user_profile', JSON.stringify(user));
};

const getMockResponse = (config: InternalAxiosRequestConfig): any => {
  const url = config.url || '';
  const method = config.method?.toLowerCase();
  const accountMode = config.headers['X-Account-Mode'] || 'DEMO';
  const isReal = accountMode === 'REAL';
  
  if (url.includes('/api/auth/registration/')) {
    const body = JSON.parse(config.data || '{}');
    const newUser = { 
      pk: Math.floor(Math.random() * 10000), 
      username: body.username || 'Trader_' + Math.floor(Math.random() * 999), 
      email: body.email || 'trader@luma-trade.com', 
      mt5_linked: false 
    };
    saveUser(newUser);
    return { access: 'sim_access', refresh: 'sim_refresh', user: newUser };
  }

  if (url.includes('/api/token/')) {
    const body = JSON.parse(config.data || '{}');
    let user = getStoredUser();
    if (!user || (body.email && user.email !== body.email)) {
      user = { 
        pk: Math.floor(Math.random() * 10000), 
        username: body.email?.split('@')[0] || 'Institutional_Trader', 
        email: body.email || 'trader@luma-trade.com', 
        mt5_linked: false 
      };
      saveUser(user);
    }
    return { access: 'sim_access', refresh: 'sim_refresh', user };
  }
  
  if (url.includes('/api/auth/user/')) {
    const currentUser = getStoredUser();
    const isLinked = localStorage.getItem('mt5_linked_status') === 'true';
    const base = currentUser || { pk: 777, username: 'Institutional_Trader', email: 'trader@luma-trade.com' };
    return { ...base, mt5_linked: isLinked };
  }

  if (url.includes('/api/mt5/market/live/')) {
    return Object.keys(currentPrices).map(symbol => ({
      symbol,
      bid: currentPrices[symbol],
      ask: currentPrices[symbol] + (symbol.includes('BTC') ? 5 : 0.0002),
      timestamp: new Date().toISOString()
    }));
  }

  if (url.includes('/api/market/news/')) {
    return [
      { id: '1', title: 'US Inflation Data Surprises Markets', summary: 'Core CPI figures came in higher than expected, leading to speculation of a delayed Fed rate cut.', source: 'Luma Intelligence', impact: 'HIGH', category: 'ECONOMY', published_at: new Date().toISOString(), symbol_linked: 'EURUSD' },
      { id: '2', title: 'Institutional BTC Accumulation Reaches New Peak', summary: 'On-chain data suggests massive wallet movements from exchanges to cold storage.', source: 'Bloomberg', impact: 'MEDIUM', category: 'CRYPTO', published_at: new Date().toISOString(), symbol_linked: 'BTCUSD' }
    ];
  }

  if (url.includes('/api/mt5/market/history')) {
    const urlParts = url.split('?');
    const queryParams = new URLSearchParams(urlParts.length > 1 ? urlParts[1] : '');
    const symbol = queryParams.get('symbol') || 'XAUUSD';
    const timeframe = queryParams.get('timeframe') || '5m';
    return generateMockHistory(symbol, timeframe);
  }

  if (url.includes('/api/mt5/live/positions/')) {
    return [
      { ticket: 991201, symbol: 'XAUUSD', type: 'BUY', volume: 0.1, open_price: 2345.10, current_price: currentPrices['XAUUSD'], profit: (currentPrices['XAUUSD'] - 2345.10) * 100, time: new Date().toISOString(), commission: isReal ? -1.2 : 0, swap: 0, mode: accountMode }
    ];
  }

  if (url.includes('/api/mt5/live/history/')) {
    return [
      { ticket: 881001, symbol: 'EURUSD', type: 'SELL', volume: 0.5, open_price: 1.0920, close_price: 1.0892, profit: 140.00, time: new Date(Date.now() - 86400000).toISOString(), close_time: new Date(Date.now() - 86340000).toISOString(), commission: isReal ? -3.50 : 0, swap: -0.15, mode: accountMode },
      { ticket: 881011, symbol: 'XAUUSD', type: 'SELL', volume: 0.2, open_price: 2395.00, close_price: 2356.12, profit: 777.60, time: new Date(Date.now() - 7200000).toISOString(), close_time: new Date(Date.now() - 7100000).toISOString(), commission: isReal ? -2.00 : 0, swap: 0, mode: accountMode }
    ];
  }

  if (url.includes('/api/security/activity/')) {
    return [
      { id: 1, event_type: 'login_success', ip_address: '192.168.1.1', user_agent: 'Mozilla/5.0', success: true, created_at: new Date(Date.now() - 3600000).toISOString() },
      { id: 2, event_type: 'terminal_sync', ip_address: '192.168.1.1', user_agent: 'Mozilla/5.0', success: true, created_at: new Date(Date.now() - 1800000).toISOString() }
    ];
  }

  // Collection Fallback
  if (url.endsWith('/') || url.includes('?')) {
    return [];
  }

  return { detail: "Simulation Engine active." };
};

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  config.headers['X-Account-Mode'] = localStorage.getItem('account_mode') || 'DEMO';
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig;
    if (error.code === 'ERR_NETWORK' || error.response?.status === 404) {
      return Promise.resolve({
        data: getMockResponse(originalRequest),
        status: 200,
        statusText: 'OK',
        headers: {},
        config: originalRequest,
      } as AxiosResponse);
    }
    return Promise.reject(error);
  }
);
