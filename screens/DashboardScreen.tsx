
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

// Mock data for top movers - in a real app this would come from an endpoint
const MOCK_MOVERS = [
  { symbol: 'XAUUSD', name: 'Gold Spot', price: '2,356.12', change: '+1.42%', positive: true, volume: 'High' },
  { symbol: 'BTCUSD', name: 'Bitcoin', price: '67,210.5', change: '+2.85%', positive: true, volume: 'Extreme' },
  { symbol: 'ETHUSD', name: 'Ethereum', price: '3,512.40', change: '+1.92%', positive: true, volume: 'High' },
  { symbol: 'NAS100', name: 'Nasdaq 100', price: '18,050.0', change: '+0.51%', positive: true, volume: 'Normal' },
  { symbol: 'EURUSD', name: 'Euro / Dollar', price: '1.08924', change: '-0.15%', positive: false, volume: 'Normal' },
  { symbol: 'GBPUSD', name: 'Pound / Dollar', price: '1.26453', change: '-0.21%', positive: false, volume: 'Normal' },
  { symbol: 'USDJPY', name: 'Dollar / Yen', price: '151.203', change: '+0.08%', positive: true, volume: 'Normal' },
  { symbol: 'AUDUSD', name: 'Aussie / Dollar', price: '0.66215', change: '-0.45%', positive: false, volume: 'Low' },
  { symbol: 'USDCAD', name: 'Loonie / Dollar', price: '1.35901', change: '-0.12%', positive: false, volume: 'Low' },
  { symbol: 'SPX500', name: 'S&P 500', price: '5,250.00', change: '+0.33%', positive: true, volume: 'Normal' },
];

const DashboardScreen: React.FC = () => {
  const { user, accountMode } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Dashboard Chart State
  const [chartSymbol, setChartSymbol] = useState('XAUUSD');
  const [chartTimeframe, setChartTimeframe] = useState('5m');
  
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const lastPriceRef = useRef<number | null>(null);

  // Market Data
  const { data: marketData, isLoading: isMarketLoading } = useQuery<MarketData[]>({
    queryKey: ['market-live'],
    queryFn: async () => {
      const res = await apiClient.get('/api/mt5/market/live/');
      return res.data;
    },
    refetchInterval: 1000
  });

  // History for Dashboard Chart
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

  // Realized History for Performance HUD
  const { data: tradeHistory } = useQuery<MT5Position[]>({
    queryKey: ['trades-history', accountMode],
    queryFn: async () => {
      const res = await apiClient.get('/api/mt5/live/history/');
      return res.data;
    }
  });

  const recentHistory = useMemo(() => 
    (tradeHistory || []).slice(0, 4),
    [tradeHistory]
  );

  // Calculate dynamic equity
  const { balance, profit, equity } = useMemo(() => {
    const baseBalance = accountMode === 'REAL' ? 42500.50 : 12450.82;
    const currentProfit = positions?.reduce((acc: number, pos: any) => acc + pos.profit, 0) || 0;
    return {
      balance: baseBalance,
      profit: currentProfit,
      equity: baseBalance + currentProfit
    };
  }, [accountMode, positions]);

  // Real-time Tick Sync for Dashboard Chart
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

  // Dashboard Chart Lifecycle
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
      grid: {
        vertLines: { visible: false },
        horzLines: { color: 'rgba(30, 41, 59, 0.1)' },
      },
      timeScale: {
        borderColor: 'rgba(30, 41, 59, 0.2)',
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: 'rgba(30, 41, 59, 0.2)',
        autoScale: true,
        scaleMargins: { top: 0.2, bottom: 0.2 },
      },
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

    if (historyData) {
      series.setData(historyData);
    }
    
    chartRef.current = chart;
    seriesRef.current = series;

    const resizeObserver = new ResizeObserver(entries => {
      if (entries[0].contentRect && chartRef.current) {
        try {
          chartRef.current.applyOptions({ 
            width: entries[0].contentRect.width,
            height: entries[0].contentRect.height 
          });
          chartRef.current.timeScale().fitContent();
        } catch (e) {
          console.debug("Resize suppression:", e);
        }
      }
    });

    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      const currentChart = chartRef.current;
      chartRef.current = null;
      seriesRef.current = null;
      if (currentChart) {
        try {
          currentChart.remove();
        } catch (e) {
          console.debug("Disposal error:", e);
        }
      }
    };
  }, [chartSymbol, chartTimeframe, historyData]);

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['positions-live'] });
    queryClient.invalidateQueries({ queryKey: ['trades-history'] });
  }, [accountMode, queryClient]);

  const handleSymbolClick = (symbol: string) => {
    navigate(`/chart/${symbol}`);
  };

  return (
    <div className="p-5 space-y-6 pb-20">
      {/* Portfolio Card */}
      <div className={`rounded-[2rem] p-6 shadow-2xl relative overflow-hidden transition-all duration-500 ${
        accountMode === 'REAL' 
          ? 'bg-gradient-to-br from-emerald-600 via-teal-600 to-teal-700 shadow-emerald-600/30' 
          : 'bg-gradient-to-br from-indigo-600 via-blue-600 to-blue-700 shadow-blue-600/30'
      }`}>
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Wallet size={120} />
        </div>
        <div className="relative z-10">
          <div className="flex justify-between items-center mb-6">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em]">
                {accountMode === 'REAL' ? 'MT5 Institutional Liquidity' : 'Standard Simulation Engine'}
              </span>
              {accountMode === 'REAL' && (
                <span className="text-[8px] font-black text-white/40 uppercase tracking-widest mt-0.5">Linked Terminal: 7720054</span>
              )}
            </div>
            <div className="px-2 py-1 bg-white/10 rounded-lg text-[9px] font-bold text-white uppercase flex items-center gap-1.5">
              <div className={`w-1 h-1 rounded-full animate-pulse ${accountMode === 'REAL' ? 'bg-white' : 'bg-emerald-400'}`} />
              {accountMode} LIVE
            </div>
          </div>
          
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-1">Total Equity</p>
              <h2 className="text-4xl font-black text-white tracking-tighter mb-2">
                ${equity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
            </div>
            <div className="text-right">
               <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-1">Unrealized P/L</p>
               <p className={`text-xl font-black font-mono tracking-tighter tabular-nums ${profit >= 0 ? 'text-white' : 'text-rose-200'}`}>
                 {profit >= 0 ? '+' : ''}{profit.toFixed(2)}
               </p>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-4 border-t border-white/10 pt-4">
             <div className="flex flex-col">
                <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">Balance</span>
                <span className="text-sm font-bold text-white/90 font-mono">${balance.toFixed(2)}</span>
             </div>
             <div className="w-px h-6 bg-white/10" />
             <div className="flex flex-col">
                <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">Margin Level</span>
                <span className="text-sm font-bold text-white/90 font-mono">1452.4%</span>
             </div>
          </div>
        </div>
      </div>

      <section className="bg-slate-900 border border-slate-800 rounded-[2rem] overflow-hidden flex flex-col shadow-xl">
        <div className="px-5 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/10">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                <BarChart3 size={16} />
             </div>
             <div>
                <h3 className="text-xs font-black text-white uppercase tracking-widest">Market Feed</h3>
                <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest leading-none mt-1">Real-time Oscilloscope</p>
             </div>
          </div>
          <button 
            onClick={() => handleSymbolClick(chartSymbol)}
            className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 active:scale-90 transition-all"
          >
            <Maximize2 size={14} />
          </button>
        </div>

        <div className="p-4 flex gap-2 overflow-x-auto no-scrollbar border-b border-slate-800/50">
           <div className="flex p-1 bg-slate-950 rounded-xl gap-1">
             {DASHBOARD_SYMBOLS.map(sym => (
               <button
                 key={sym}
                 onClick={() => setChartSymbol(sym)}
                 className={`px-3 py-1.5 rounded-lg text-[9px] font-black transition-all ${
                   chartSymbol === sym ? 'bg-blue-600 text-white' : 'text-slate-500'
                 }`}
               >
                 {sym}
               </button>
             ))}
           </div>
           <div className="flex p-1 bg-slate-950 rounded-xl gap-1 ml-auto">
             {DASHBOARD_TIMEFRAMES.map(tf => (
               <button
                 key={tf}
                 onClick={() => setChartTimeframe(tf)}
                 className={`px-3 py-1.5 rounded-lg text-[9px] font-black transition-all ${
                   chartTimeframe === tf ? 'bg-slate-800 text-blue-400' : 'text-slate-500'
                 }`}
               >
                 {tf}
               </button>
             ))}
           </div>
        </div>

        <div className="h-56 relative group">
          <div ref={chartContainerRef} className="w-full h-full" />
          
          {(isHistoryLoading || isMarketLoading) && !historyData && (
             <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-[2px] z-20">
                <RefreshCw size={24} className="text-blue-500 animate-spin mb-3" />
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Syncing Neural Feed...</span>
             </div>
          )}

          <div className="absolute top-4 right-4 z-10 pointer-events-none bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-1.5 backdrop-blur-md">
             <div className="text-[10px] font-mono font-black text-white tabular-nums">
               {currentPrice?.toFixed(5) || '---'}
             </div>
             <div className="flex items-center gap-1 mt-0.5">
               <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
               <span className="text-[7px] font-bold text-slate-500 uppercase tracking-widest">Live Tick</span>
             </div>
          </div>
        </div>
      </section>

      {/* TOP 10 MOVERS (LAST 1H) */}
      <section className="bg-slate-900 border border-slate-800 rounded-[2rem] overflow-hidden shadow-xl">
        <div className="px-5 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/20">
          <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
            <Flame size={14} className="text-orange-500" /> Top Movers <span className="text-[8px] font-bold text-slate-500 lowercase">(1h)</span>
          </h3>
          <button className="text-[9px] font-black text-blue-500 uppercase flex items-center gap-1">
            Exchange Hub <ArrowRight size={10} />
          </button>
        </div>
        <div className="p-2">
          <div className="grid grid-cols-1 gap-1">
            {MOCK_MOVERS.map((mover, index) => (
              <button 
                key={mover.symbol} 
                onClick={() => handleSymbolClick(mover.symbol)}
                className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-800/40 transition-all active:scale-[0.99] group text-left"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-1 h-6 rounded-full transition-all group-hover:h-8 ${mover.positive ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]'}`} />
                  <div className="flex items-baseline gap-2">
                    <p className="text-[12px] font-black text-white leading-none">{mover.symbol}</p>
                    <p className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">{mover.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right hidden sm:block">
                     <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Vol</p>
                     <p className={`text-[9px] font-bold uppercase ${mover.volume === 'Extreme' ? 'text-orange-500' : 'text-slate-500'}`}>{mover.volume}</p>
                  </div>
                  <div className="text-right min-w-[70px]">
                    <p className="text-[11px] font-black font-mono text-white tabular-nums leading-none mb-1">
                      {mover.price}
                    </p>
                    <div className={`flex items-center justify-end gap-1 ${mover.positive ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {mover.positive ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                      <span className="text-[10px] font-black font-mono tabular-nums">{mover.change}</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* RECENT REALIZED PERFORMANCE */}
      <section className="bg-slate-900 border border-slate-800 rounded-[2rem] overflow-hidden shadow-xl">
        <div className="px-5 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/20">
          <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
            <History size={14} className="text-blue-500" /> Recent History
          </h3>
          <button onClick={() => navigate('/trades')} className="text-[9px] font-black text-blue-500 uppercase flex items-center gap-1">
            Audit All <ArrowRight size={10} />
          </button>
        </div>
        <div className="p-2">
          {recentHistory.length > 0 ? (
             <div className="space-y-1">
                {recentHistory.map((trade) => (
                  <div key={trade.ticket} className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-800/40 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-1 h-6 rounded-full ${trade.profit >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      <div>
                        <p className="text-[11px] font-black text-white leading-none">{trade.symbol}</p>
                        <p className="text-[8px] font-bold text-slate-500 uppercase mt-1 tracking-widest">{trade.type} · {trade.volume} Lot</p>
                      </div>
                    </div>
                    <div className="text-right">
                       <p className={`text-xs font-black font-mono tabular-nums ${trade.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                         {trade.profit >= 0 ? '+' : ''}{trade.profit.toFixed(2)}
                       </p>
                       <p className="text-[7px] font-bold text-slate-600 uppercase tracking-tighter">
                         {new Date(trade.close_time || trade.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                       </p>
                    </div>
                  </div>
                ))}
             </div>
          ) : (
            <div className="py-8 text-center">
               <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">No recently closed trades</p>
            </div>
          )}
        </div>
      </section>

      <section className="bg-slate-900 border border-slate-800 rounded-[2rem] overflow-hidden shadow-lg">
        <div className="px-5 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/20">
          <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
            <Activity size={14} className="text-emerald-500" /> {accountMode === 'REAL' ? 'Real Portfolio' : 'Active Exposure'}
          </h3>
          <ChevronRight size={16} className="text-slate-600" />
        </div>
        <div className="p-5">
          {positions && positions.length > 0 ? (
             <div className="space-y-3">
               {positions.map((pos: any) => (
                 <button 
                  key={pos.ticket} 
                  onClick={() => handleSymbolClick(pos.symbol)}
                  className="w-full flex justify-between items-center p-2 rounded-xl hover:bg-slate-800/50 transition-colors text-left"
                 >
                    <div className="flex items-center gap-3">
                      <div className={`w-1 h-8 rounded-full ${pos.profit >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      <div>
                        <p className="text-xs font-black text-white tracking-tight">{pos.symbol}</p>
                        <p className="text-[8px] text-slate-500 uppercase tracking-widest">{pos.type} · {pos.volume} Lots</p>
                      </div>
                    </div>
                    <p className={`text-sm font-black font-mono ${pos.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      ${pos.profit.toFixed(2)}
                    </p>
                 </button>
               ))}
             </div>
          ) : (
            <div className="py-6 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-950 flex items-center justify-center text-slate-700 mb-3 border border-slate-800">
                <Activity size={24} />
              </div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Market Neutral</p>
              <p className="text-[9px] text-slate-600 mt-2 max-w-[150px] leading-relaxed">System ready for market execution. Visit Trades to open positions.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default DashboardScreen;
