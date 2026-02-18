
import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

/**
 * Base URL is configured via environment variable for mobile/production parity.
 * Fallback to default institutional endpoint if not provided.
 */
const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.luma-trade.com';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Helper to generate historical candlestick data for simulation.
 */
const generateMockHistory = (symbol: string, tf: string, count: number = 300) => {
  const data = [];
  const intervalMinutes = tf.includes('m') 
    ? parseInt(tf) 
    : tf.includes('H') 
      ? parseInt(tf) * 60 
      : 1440;
  
  let lastClose = symbol.includes('BTC') ? 67000 : symbol.includes('XAU') ? 2350 : symbol.includes('JPY') ? 151 : 1.08;
  const nowInSeconds = Math.floor(Date.now() / 1000);
  let time = nowInSeconds - (count * intervalMinutes * 60);
  
  for (let i = 0; i < count; i++) {
    const volatility = symbol.includes('BTC') ? 200 : symbol.includes('XAU') ? 5 : symbol.includes('JPY') ? 0.2 : 0.002;
    const open = lastClose;
    const move = (Math.random() - 0.5) * volatility;
    const close = open + move;
    const high = Math.max(open, close) + Math.random() * (volatility * 0.5);
    const low = Math.min(open, close) - Math.random() * (volatility * 0.5);
    
    data.push({
      time: time,
      open, 
      high, 
      low, 
      close
    });
    time += intervalMinutes * 60;
    lastClose = close;
  }
  return data;
};

/**
 * Mock Simulation Engine
 * Provides high-fidelity data when the backend environment is unreachable.
 */
const getMockResponse = (config: InternalAxiosRequestConfig): any => {
  const url = config.url || '';
  const method = config.method?.toLowerCase();
  const accountMode = config.headers['X-Account-Mode'] || 'DEMO';
  
  if (url.includes('/api/token/') || url.includes('/api/auth/registration/')) {
    return {
      access: 'sim_access_token',
      refresh: 'sim_refresh_token',
      user: { pk: 777, username: 'Google_Operator', email: 'operator@workspace-luma.com', mt5_linked: false }
    };
  }
  
  if (url.includes('/api/auth/user/')) {
    if (method === 'patch' || method === 'put') {
      const data = JSON.parse(config.data || '{}');
      return { 
        pk: 777, 
        username: data.username || 'Google_Operator', 
        email: data.email || 'operator@workspace-luma.com', 
        first_name: data.first_name || 'Google', 
        last_name: data.last_name || 'Operator',
        mt5_linked: true // Mock linking success if updated
      };
    }
    const isLinked = localStorage.getItem('mt5_linked_status') === 'true';
    return { 
      pk: 777, 
      username: 'Google_Operator', 
      email: 'operator@workspace-luma.com', 
      first_name: 'Google', 
      last_name: 'Operator',
      mt5_linked: isLinked
    };
  }

  if (url.includes('/api/mt5/connect/')) {
    localStorage.setItem('mt5_linked_status', 'true');
    return { status: 'success', message: 'MT5 Linked' };
  }

  if (url.includes('/api/mt5/market/live/')) {
    return [
      { symbol: 'XAUUSD', bid: 2356.12, ask: 2356.45, timestamp: new Date().toISOString() },
      { symbol: 'EURUSD', bid: 1.0892, ask: 1.0894, timestamp: new Date().toISOString() },
      { symbol: 'BTCUSD', bid: 67210.5, ask: 67215.8, timestamp: new Date().toISOString() },
      { symbol: 'GBPUSD', bid: 1.2645, ask: 1.2647, timestamp: new Date().toISOString() },
      { symbol: 'USDJPY', bid: 151.20, ask: 151.22, timestamp: new Date().toISOString() }
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
    if (accountMode === 'REAL') {
      return [
        { ticket: 991201, symbol: 'XAUUSD', type: 'BUY', volume: 0.1, open_price: 2345.10, current_price: 2356.12, profit: 110.20, time: new Date().toISOString(), commission: -1.20, swap: 0, mode: 'REAL' },
        { ticket: 991205, symbol: 'BTCUSD', type: 'SELL', volume: 0.05, open_price: 68500.0, current_price: 67210.5, profit: 64.48, time: new Date().toISOString(), commission: -3.50, swap: -0.42, mode: 'REAL' }
      ];
    }
    return [
      { ticket: 100001, symbol: 'EURUSD', type: 'BUY', volume: 1.0, open_price: 1.0850, current_price: 1.0892, profit: 420.00, time: new Date().toISOString(), commission: -5.00, swap: 0, mode: 'DEMO' }
    ];
  }

  if (url.includes('/api/mt5/live/orders/')) {
    return [
      { ticket: 772001, symbol: 'XAUUSD', type: 'BUY_LIMIT', volume: 0.50, price: 2340.00, time: new Date().toISOString() },
      { ticket: 772002, symbol: 'BTCUSD', type: 'SELL_STOP', volume: 0.10, price: 68500.00, time: new Date().toISOString() }
    ];
  }

  if (url.includes('/api/mt5/live/cancel-order/')) {
    return { status: 'success', message: 'Pending order cancelled' };
  }

  if (url.includes('/api/mt5/live/history/')) {
    const isReal = accountMode === 'REAL';
    const mode: 'DEMO' | 'REAL' = isReal ? 'REAL' : 'DEMO';
    return [
      { ticket: 881001, symbol: 'EURUSD', type: 'SELL', volume: 0.5, open_price: 1.0920, close_price: 1.0892, profit: 140.00, time: new Date(Date.now() - 86400000).toISOString(), close_time: new Date(Date.now() - 86340000).toISOString(), commission: isReal ? -3.50 : 0, swap: -0.15, mode },
      { ticket: 881002, symbol: 'BTCUSD', type: 'BUY', volume: 0.01, open_price: 65100.0, close_price: 67210.5, profit: 21.10, time: new Date(Date.now() - 172800000).toISOString(), close_time: new Date(Date.now() - 172740000).toISOString(), commission: isReal ? -0.80 : 0, swap: 0, mode },
      { ticket: 881003, symbol: 'XAUUSD', type: 'BUY', volume: 0.1, open_price: 2380.50, close_price: 2365.20, profit: -153.00, time: new Date(Date.now() - 43200000).toISOString(), close_time: new Date(Date.now() - 43100000).toISOString(), commission: isReal ? -1.00 : 0, swap: 0, mode },
      { ticket: 881004, symbol: 'GBPUSD', type: 'SELL', volume: 0.2, open_price: 1.2680, close_price: 1.2645, profit: 70.00, time: new Date(Date.now() - 10800000).toISOString(), close_time: new Date(Date.now() - 10700000).toISOString(), commission: isReal ? -2.00 : 0, swap: -0.10, mode },
      { ticket: 881005, symbol: 'USDJPY', type: 'BUY', volume: 1.0, open_price: 150.20, close_price: 151.20, profit: 660.00, time: new Date(Date.now() - 3600000).toISOString(), close_time: new Date(Date.now() - 3500000).toISOString(), commission: isReal ? -7.00 : 0, swap: 0, mode },
      { ticket: 881006, symbol: 'ETHUSD', type: 'BUY', volume: 0.5, open_price: 3420.00, close_price: 3512.40, profit: 46.20, time: new Date(Date.now() - 259200000).toISOString(), close_time: new Date(Date.now() - 259100000).toISOString(), commission: isReal ? -1.20 : 0, swap: -0.50, mode },
      { ticket: 881007, symbol: 'AUDUSD', type: 'SELL', volume: 0.8, open_price: 0.6650, close_price: 0.6620, profit: 24.00, time: new Date(Date.now() - 345600000).toISOString(), close_time: new Date(Date.now() - 345500000).toISOString(), commission: isReal ? -2.40 : 0, swap: 0, mode },
      { ticket: 881008, symbol: 'USDCAD', type: 'BUY', volume: 0.4, open_price: 1.3610, close_price: 1.3590, profit: -8.00, time: new Date(Date.now() - 432000000).toISOString(), close_time: new Date(Date.now() - 431900000).toISOString(), commission: isReal ? -1.20 : 0, swap: -0.20, mode },
      { ticket: 881009, symbol: 'SPX500', type: 'BUY', volume: 0.05, open_price: 5210.50, close_price: 5250.00, profit: 197.50, time: new Date(Date.now() - 518400000).toISOString(), close_time: new Date(Date.now() - 518300000).toISOString(), commission: isReal ? -0.50 : 0, swap: 0, mode },
      { ticket: 881010, symbol: 'NAS100', type: 'SELL', volume: 0.02, open_price: 18200.0, close_price: 18050.0, profit: 300.00, time: new Date(Date.now() - 604800000).toISOString(), close_time: new Date(Date.now() - 604700000).toISOString(), commission: isReal ? -0.40 : 0, swap: -0.10, mode },
      { ticket: 881011, symbol: 'XAUUSD', type: 'SELL', volume: 0.2, open_price: 2395.00, close_price: 2356.12, profit: 777.60, time: new Date(Date.now() - 7200000).toISOString(), close_time: new Date(Date.now() - 7100000).toISOString(), commission: isReal ? -2.00 : 0, swap: 0, mode },
      { ticket: 881012, symbol: 'EURGBP', type: 'BUY', volume: 0.3, open_price: 0.8540, close_price: 0.8565, profit: 75.00, time: new Date(Date.now() - 14400000).toISOString(), close_time: new Date(Date.now() - 14300000).toISOString(), commission: isReal ? -1.50 : 0, swap: -0.05, mode }
    ];
  }

  if (url.includes('/api/mt5/trade/execute')) {
    const data = JSON.parse(config.data || '{}');
    return {
      status: 'success',
      ticket: Math.floor(Math.random() * 1000000),
      message: `Executed ${data.orderType} order for ${data.symbol} at ${data.price}`,
      timestamp: new Date().toISOString()
    };
  }

  return { detail: "Simulation Engine active." };
};

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const accessToken = localStorage.getItem('access_token');
  const accountMode = localStorage.getItem('account_mode') || 'DEMO';
  
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  
  config.headers['X-Account-Mode'] = accountMode;
  
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error' || error.response?.status === 404) {
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
