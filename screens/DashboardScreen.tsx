
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, Activity, Globe, Wallet, ChevronRight, Zap, 
  BarChart3, Clock, Maximize2, RefreshCw, Landmark, History,
  ArrowRight, ArrowUpRight, ArrowDownRight, Flame
} from 'lucide-react';
import { createChart, IChartApi, ISeriesApi, CandlestickData, Time, ColorType } from 'lightweight-charts';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { MarketData, MT5Position } from '../api/types';

const DASHBOARD_SYMBOLS = ['XAUUSD', 'BTCUSD', 'EURUSD'];
const DASHBOARD_TIMEFRAMES = ['1m', '5m', '1H'];

const MOCK_MOVERS = [
  { symbol: 'XAUUSD', name: 'Gold Spot', price: '2,356.12', change: '+1.42%', positive: true, volume: 'High' },
  { symbol: 'BTCUSD', name: 'Bitcoin', price: '67,210.5', change: '+2.85%', positive: true, volume: 'Extreme' },
  { symbol: 'ETHUSD', name: 'Ethereum', price: '3,512.40', change: '+1.92%', positive: true, volume: 'High' },
  { symbol: 'NAS100', name: 'Nasdaq 100', price: '18,050.0', change: '+0.51%', positive: true, volume: 'Normal' },
  { symbol: 'EURUSD', name: 'Euro / Dollar', price: '1.08924', change: '-0.15%', positive: false, volume: 'Normal' },
];

const DashboardScreen: React.FC = () => {
  const { user, accountMode } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [chartSymbol, setChartSymbol] = useState('XAUUSD');
  const [chartTimeframe, setChartTimeframe] = useState('5m');
  
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const lastPriceRef = useRef<number | null>(null);

  const { data: marketData, isLoading: isMarketLoading } = useQuery<MarketData[]>({
    queryKey: ['market-live'],
    queryFn: async () => {
      const res = await apiClient.get('/api/mt5/market/live/');
      return res.data;
    },
    refetchInterval: 1000
  });

  const { data: historyData, isLoading: isHistoryLoading } = useQuery<CandlestickData[]>({
    queryKey: ['market-history', chartSymbol, chartTimeframe, 'dashboard'],
    queryFn: async () => {
      const res = await apiClient.get(`/api/mt5/market/history?symbol=${chartSymbol}&timeframe=${chartTimeframe}`);
      return res.data;
    },
    staleTime: 30000
  });

  const activePrice = useMemo(() => 
    marketData?.find(m => m.symbol === chartSymbol),
    [marketData, chartSymbol]
  );
  
  const currentPrice = activePrice ? (activePrice.bid + activePrice.ask) / 2 : null;

  const { data: positions } = useQuery({
    queryKey: ['positions-live', accountMode],
    queryFn: async () => {
      const res = await apiClient.get('/api/mt5/live/positions/');
      return res.data;
    },
    refetchInterval: 5000
  });

  const { data: tradeHistory } = useQuery<MT5Position[]>({
    queryKey: ['trades-history', accountMode],
    queryFn: async () => {
      const res = await apiClient.get('/api/mt5/live/history/');
      return res.data;
    }
  });

  const recentHistory = useMemo(() => 
    Array.isArray(tradeHistory) ? tradeHistory.slice(0, 4) : [],
    [tradeHistory]
  );

  const { balance, profit, equity } = useMemo(() => {
    const baseBalance = accountMode === 'REAL' ? 42500.50 : 12450.82;
    const currentProfit = positions?.reduce((acc: number, pos: any) => acc + pos.profit, 0) || 0;
    return {
      balance: baseBalance,
      profit: currentProfit,
      equity: baseBalance + currentProfit
    };
  }, [accountMode, positions]);

  useEffect(() => {
    if (seriesRef.current && chartRef.current && currentPrice !== null) {
      try {
        const now = Math.floor(Date.now() / 1000) as Time;
        const lastP = lastPriceRef.current || currentPrice;
        seriesRef.current.update({
          time: now,
          open: lastP,
          high: Math.max(lastP, currentPrice),
          low: Math.min(lastP, currentPrice),
          close: currentPrice,
        });
        lastPriceRef.current = currentPrice;
      } catch (e) {
        console.debug("Chart update suppressed:", e);
      }
    }
  }, [currentPrice]);

  useEffect(() => {
    if (!chartContainerRef.current) return;
    lastPriceRef.current = null;
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#64748b',
        fontSize: 10,
        fontFamily: 'Inter',
      },
      grid: { vertLines: { visible: false }, horzLines: { color: 'rgba(30, 41, 59, 0.1)' } },
      timeScale: { borderColor: 'rgba(30, 41, 59, 0.2)', timeVisible: true },
      rightPriceScale: { borderColor: 'rgba(30, 41, 59, 0.2)', autoScale: true },
      handleScroll: false,
      handleScale: false,
    });
    const series = (chart as any).addCandlestickSeries({
      upColor: '#10b981',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444',
    });
    if (historyData) series.setData(historyData);
    chartRef.current = chart;
    seriesRef.current = series;
    const resizeObserver = new ResizeObserver(entries => {
      if (entries[0].contentRect && chartRef.current) {
        chartRef.current.applyOptions({ 
          width: entries[0].contentRect.width,
          height: entries[0].contentRect.height 
        });
        chartRef.current.timeScale().fitContent();
      }
    });
    resizeObserver.observe(chartContainerRef.current);
    return () => {
      resizeObserver.disconnect();
      if (chartRef.current) chartRef.current.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [chartSymbol, chartTimeframe, historyData]);

  const handleSymbolClick = (symbol: string) => navigate(`/chart/${symbol}`);

  return (
    <div className="p-5 space-y-6 pb-20">
      {/* Portfolio HUD */}
      <div className={`rounded-[2rem] p-6 shadow-2xl relative overflow-hidden transition-all duration-500 ${
        accountMode === 'REAL' 
          ? 'bg-gradient-to-br from-emerald-600 via-teal-600 to-teal-700 shadow-emerald-600/30' 
          : 'bg-gradient-to-br from-indigo-600 via-blue-600 to-blue-700 shadow-blue-600/30'
      }`}>
        <div className="absolute top-0 right-0 p-8 opacity-10"><Wallet size={120} /></div>
        <div className="relative z-10">
          <div className="flex justify-between items-center mb-6">
            <span className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em]">Institutional Engine</span>
            <div className="px-2 py-1 bg-white/10 rounded-lg text-[9px] font-bold text-white uppercase flex items-center gap-1.5">
              <div className={`w-1 h-1 rounded-full animate-pulse ${accountMode === 'REAL' ? 'bg-white' : 'bg-emerald-400'}`} />
              {accountMode}
            </div>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-1">Total Equity</p>
              <h2 className="text-4xl font-black text-white tracking-tighter mb-2">
                ${equity.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </h2>
            </div>
            <div className="text-right">
               <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-1">Floating P/L</p>
               <p className={`text-xl font-black font-mono tracking-tighter ${profit >= 0 ? 'text-white' : 'text-rose-200'}`}>
                 {profit >= 0 ? '+' : ''}{profit.toFixed(2)}
               </p>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <section className="bg-slate-900 border border-slate-800 rounded-[2rem] overflow-hidden flex flex-col shadow-xl">
        <div className="px-5 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/10">
          <div className="flex items-center gap-3">
             <BarChart3 size={16} className="text-blue-500" />
             <h3 className="text-xs font-black text-white uppercase tracking-widest">Market Feed</h3>
          </div>
          <button onClick={() => handleSymbolClick(chartSymbol)} className="p-2 bg-slate-800 rounded-lg text-slate-400"><Maximize2 size={14} /></button>
        </div>
        <div className="p-4 flex gap-2 overflow-x-auto no-scrollbar border-b border-slate-800/50">
           <div className="flex p-1 bg-slate-950 rounded-xl gap-1">
             {DASHBOARD_SYMBOLS.map(sym => (
               <button key={sym} onClick={() => setChartSymbol(sym)} className={`px-3 py-1.5 rounded-lg text-[9px] font-black ${chartSymbol === sym ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>{sym}</button>
             ))}
           </div>
        </div>
        <div className="h-56 relative"><div ref={chartContainerRef} className="w-full h-full" /></div>
      </section>

      {/* Movers */}
      <section className="bg-slate-900 border border-slate-800 rounded-[2rem] overflow-hidden shadow-xl">
        <div className="px-5 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/20">
          <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2"><Flame size={14} className="text-orange-500" /> Top Movers</h3>
        </div>
        <div className="p-2 space-y-1">
          {MOCK_MOVERS.map(mover => (
            <button key={mover.symbol} onClick={() => handleSymbolClick(mover.symbol)} className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-800/40">
              <div className="flex items-center gap-3">
                <div className={`w-1 h-6 rounded-full ${mover.positive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                <p className="text-[12px] font-black text-white">{mover.symbol}</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] font-black font-mono text-white">{mover.price}</p>
                <p className={`text-[10px] font-black ${mover.positive ? 'text-emerald-500' : 'text-rose-500'}`}>{mover.change}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* History */}
      <section className="bg-slate-900 border border-slate-800 rounded-[2rem] overflow-hidden shadow-xl">
        <div className="px-5 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/20">
          <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2"><History size={14} className="text-blue-500" /> Recent History</h3>
        </div>
        <div className="p-2 space-y-1">
          {recentHistory.length > 0 ? recentHistory.map((trade: any) => (
            <div key={trade.ticket} className="flex items-center justify-between p-3 rounded-2xl">
              <div>
                <p className="text-[11px] font-black text-white">{trade.symbol}</p>
                <p className="text-[8px] font-bold text-slate-500 uppercase">{trade.type} · {trade.volume} L</p>
              </div>
              <p className={`text-xs font-black font-mono ${trade.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {trade.profit >= 0 ? '+' : ''}{trade.profit.toFixed(2)}
              </p>
            </div>
          )) : (
            <p className="py-8 text-center text-[9px] font-black text-slate-600 uppercase tracking-widest">No recently closed trades</p>
          )}
        </div>
      </section>
    </div>
  );
};

export default DashboardScreen;
