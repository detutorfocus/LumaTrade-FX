
import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  TrendingDown, 
  X, 
  ShieldAlert, 
  Zap, 
  History, 
  Activity, 
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Clock,
  BarChart3,
  PieChart,
  ArrowRight,
  Filter,
  Search,
  ChevronDown,
  ChevronUp,
  Coins,
  Receipt,
  TestTube2,
  AlertCircle,
  LayoutGrid,
  List
} from 'lucide-react';
import { apiClient } from '../api/client';
import { MT5Position } from '../api/types';
import { useAuth } from '../context/AuthContext';

const TradesScreen: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { accountMode } = useAuth();
  const [activeTab, setActiveTab] = useState<'live' | 'history'>('live');
  const [historyViewType, setHistoryViewType] = useState<'card' | 'table'>('card');
  const [historySearch, setHistorySearch] = useState('');
  const [sortBy, setSortBy] = useState<'time' | 'profit'>('time');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [expandedTrade, setExpandedTrade] = useState<number | null>(null);

  // Force cache refresh when switching account modes
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['trades-live'] });
    queryClient.invalidateQueries({ queryKey: ['trades-history'] });
  }, [accountMode, queryClient]);

  // Fetch live positions
  const { 
    data: positions, 
    isLoading: isPositionsLoading, 
    isRefetching: isPositionsRefetching,
    refetch: refetchPositions 
  } = useQuery<MT5Position[]>({
    queryKey: ['trades-live', accountMode],
    queryFn: async () => {
      const res = await apiClient.get('/api/mt5/live/positions/');
      return res.data;
    },
    refetchInterval: 3000,
    enabled: activeTab === 'live'
  });

  // Aggregated Floating Profit
  const totalFloatingProfit = useMemo(() => 
    positions?.reduce((acc, pos) => acc + pos.profit, 0) || 0,
    [positions]
  );

  // Fetch trade history
  const { 
    data: history, 
    isLoading: isHistoryLoading, 
    isRefetching: isHistoryRefetching,
    refetch: refetchHistory 
  } = useQuery<MT5Position[]>({
    queryKey: ['trades-history', accountMode],
    queryFn: async () => {
      const res = await apiClient.get('/api/mt5/live/history/');
      return res.data;
    },
    enabled: activeTab === 'history'
  });

  // Calculate performance metrics from history
  const performanceStats = useMemo(() => {
    if (!history || history.length === 0) return null;
    
    const totalTrades = history.length;
    const profitableTrades = history.filter(t => t.profit > 0).length;
    const totalProfit = history.reduce((acc, t) => acc + t.profit, 0);
    const winRate = (profitableTrades / totalTrades) * 100;
    
    return {
      totalTrades,
      winRate,
      totalProfit,
      profitableTrades
    };
  }, [history]);

  const sortedAndFilteredHistory = useMemo(() => {
    if (!history) return [];
    
    let result = history.filter(t => 
      t.symbol.toLowerCase().includes(historySearch.toLowerCase()) ||
      t.type.toLowerCase().includes(historySearch.toLowerCase())
    );

    result.sort((a, b) => {
      if (sortBy === 'time') {
        const timeA = new Date(a.close_time || a.time).getTime();
        const timeB = new Date(b.close_time || b.time).getTime();
        return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
      } else {
        return sortOrder === 'desc' ? b.profit - a.profit : a.profit - b.profit;
      }
    });

    return result;
  }, [history, historySearch, sortBy, sortOrder]);

  const closePosition = useMutation({
    mutationFn: async (ticket: number) => {
      return apiClient.post('/api/mt5/live/close/', { ticket });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades-live'] });
      queryClient.invalidateQueries({ queryKey: ['trades-history'] });
    }
  });

  const emergencyCloseAll = useMutation({
    mutationFn: async () => {
      return apiClient.post('/api/mt5/live/emergency-close-all/');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades-live'] });
      queryClient.invalidateQueries({ queryKey: ['trades-history'] });
    }
  });

  const handlePanic = () => {
    if (confirm("EMERGENCY: Close ALL open positions immediately?")) {
      emergencyCloseAll.mutate();
    }
  };

  const onRefresh = () => {
    if (activeTab === 'live') refetchPositions();
    else refetchHistory();
  };

  const calculateDuration = (open: string, close?: string) => {
    if (!close) return 'Active';
    const start = new Date(open).getTime();
    const end = new Date(close).getTime();
    const diff = end - start;
    
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ${minutes % 60}m`;
    return `${Math.floor(hours / 24)}d`;
  };

  const renderLiveTab = () => {
    if (isPositionsLoading && !positions) return (
      <div className="flex flex-col items-center justify-center py-20">
        <RefreshCw className="animate-spin text-blue-500 mb-4" size={32} />
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Polling Live Stream...</p>
      </div>
    );

    if (!Array.isArray(positions) || positions.length === 0) return (
      <div className="bg-slate-900/50 border border-slate-800 border-dashed rounded-[2rem] p-12 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-slate-700 mb-6 border border-slate-800">
           <Zap size={32} />
        </div>
        <h3 className="text-lg font-black text-white mb-2 uppercase tracking-tighter">Market Neutral</h3>
        <p className="text-xs font-medium text-slate-500 max-w-[200px] leading-relaxed">No active exposure detected in {accountMode} mode.</p>
      </div>
    );

    return (
      <div className="space-y-6">
        {/* Aggregated HUD */}
        <div className={`rounded-3xl p-6 flex justify-between items-center shadow-xl border-l-4 transition-all duration-500 ${
          totalFloatingProfit >= 0 ? 'bg-emerald-500/10 border-emerald-500 shadow-emerald-500/10' : 'bg-rose-500/10 border-rose-500 shadow-rose-500/10'
        }`}>
           <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Floating P/L</p>
              <h2 className={`text-3xl font-black font-mono tracking-tighter tabular-nums ${totalFloatingProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {totalFloatingProfit >= 0 ? '+' : ''}{totalFloatingProfit.toFixed(2)}
              </h2>
           </div>
           <div className="text-right flex flex-col items-end">
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2">Exposed Lots</span>
              <div className="flex items-center gap-2">
                 <Coins size={14} className="text-slate-600" />
                 <span className="text-lg font-black text-white font-mono">
                   {positions.reduce((acc, p) => acc + p.volume, 0).toFixed(2)}
                 </span>
              </div>
           </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
             <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.25em]">Live Positions</h3>
             <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] font-black text-emerald-500 uppercase">Synchronized</span>
             </div>
          </div>
          
          {positions.map((pos) => (
            <div key={pos.ticket} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-2 shadow-xl hover:border-slate-700 transition-all active:scale-[0.99]" onClick={() => navigate(`/chart/${pos.symbol}`)}>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-lg ${
                    pos.type === 'BUY' 
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' 
                      : 'bg-rose-500/10 border-rose-500/20 text-rose-500'
                  }`}>
                    {pos.type === 'BUY' ? <ArrowUpRight size={24} /> : <ArrowDownRight size={24} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-black text-white">{pos.symbol}</h4>
                      <span className="px-1.5 py-0.5 bg-slate-800 rounded text-[9px] font-bold text-slate-400 uppercase">#{pos.ticket}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[10px] font-black uppercase ${pos.type === 'BUY' ? 'text-emerald-500' : 'text-rose-500'}`}>{pos.type}</span>
                      <span className="w-1 h-1 bg-slate-700 rounded-full" />
                      <span className="text-[10px] font-bold text-slate-500 uppercase">{pos.volume} Lots</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); closePosition.mutate(pos.ticket); }}
                  disabled={closePosition.isPending}
                  className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 hover:text-rose-500 active:scale-90 transition-all border border-slate-700"
                >
                  {closePosition.isPending && closePosition.variables === pos.ticket ? (
                    <RefreshCw size={18} className="animate-spin text-blue-500" />
                  ) : (
                    <X size={20} />
                  )}
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-4 border-t border-slate-800 pt-5">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest px-1">Price Delta</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-400">{pos.open_price.toFixed(5)}</span>
                    <ArrowRight size={12} className="text-slate-700" />
                    <span className="text-xs font-mono font-bold text-blue-400">{pos.current_price.toFixed(5)}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-0.5 text-right">
                  <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest px-1">Floating P/L</span>
                  <p className={`text-2xl font-black font-mono tracking-tighter tabular-nums ${pos.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {pos.profit >= 0 ? '+' : ''}{pos.profit.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Cockpit Analytics */}
              <div className="flex gap-2 bg-slate-950/50 rounded-2xl p-3 border border-slate-800/50">
                 <div className="flex-1 flex flex-col items-center border-r border-slate-800">
                    <span className="text-[7px] font-black text-slate-600 uppercase">Comm</span>
                    <span className="text-[9px] font-bold text-slate-400">${pos.commission.toFixed(2)}</span>
                 </div>
                 <div className="flex-1 flex flex-col items-center border-r border-slate-800">
                    <span className="text-[7px] font-black text-slate-600 uppercase">Swap</span>
                    <span className="text-[9px] font-bold text-slate-400">${pos.swap.toFixed(2)}</span>
                 </div>
                 <div className="flex-1 flex flex-col items-center">
                    <span className="text-[7px] font-black text-slate-600 uppercase">Duration</span>
                    <span className="text-[9px] font-bold text-slate-400">{calculateDuration(pos.time)}</span>
                 </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderHistoryTab = () => {
    if (isHistoryLoading && !history) return (
      <div className="flex flex-col items-center justify-center py-20">
        <RefreshCw className="animate-spin text-blue-500 mb-4" size={32} />
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Retrieving History...</p>
      </div>
    );

    if (!Array.isArray(history) || history.length === 0) return (
      <div className="bg-slate-900 border border-slate-800 border-dashed rounded-[2rem] p-12 flex flex-col items-center justify-center text-center">
        <History size={40} className="text-slate-700 mb-4" />
        <h3 className="text-lg font-black text-white mb-2 uppercase tracking-tighter">Empty Ledger</h3>
        <p className="text-xs font-medium text-slate-500 max-w-[200px] leading-relaxed">Closed positions will be archived here for performance analysis.</p>
      </div>
    );

    return (
      <div className="space-y-6">
        {/* Performance Summary Cards */}
        {performanceStats && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-5 flex flex-col gap-1 relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform">
                <BarChart3 size={80} />
              </div>
              <div className="flex items-center justify-between mb-3 relative z-10">
                 <div className="p-1.5 bg-blue-500/10 rounded-lg">
                    <BarChart3 size={14} className="text-blue-500" />
                 </div>
                 <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">NET PROFIT</span>
              </div>
              <span className={`text-2xl font-black font-mono tracking-tighter tabular-nums relative z-10 ${performanceStats.totalProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                ${performanceStats.totalProfit.toFixed(2)}
              </span>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden relative z-10">
                <div 
                  className="bg-emerald-500 h-full rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)] transition-all duration-1000" 
                  style={{ width: `${Math.min(100, Math.max(0, performanceStats.winRate))}%` }} 
                />
              </div>
            </div>
            
            <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-5 flex flex-col gap-1 relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform">
                <PieChart size={80} />
              </div>
              <div className="flex items-center justify-between mb-3 relative z-10">
                 <div className="p-1.5 bg-purple-500/10 rounded-lg">
                    <PieChart size={14} className="text-purple-500" />
                 </div>
                 <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">WIN RATE</span>
              </div>
              <span className="text-2xl font-black text-white tabular-nums relative z-10 tracking-tighter">
                {performanceStats.winRate.toFixed(1)}%
              </span>
              <span className="text-[9px] font-bold text-slate-500 uppercase mt-3 relative z-10">
                {performanceStats.profitableTrades} / {performanceStats.totalTrades} Successes
              </span>
            </div>
          </div>
        )}

        {/* History Search & Sort Controls */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
            <input 
              type="text" 
              placeholder="Search history by symbol..."
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-3 pl-11 pr-4 text-xs font-medium text-white focus:ring-1 focus:ring-blue-500 outline-none transition-all"
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2">
            <div className="flex-1 flex bg-slate-900 p-1 rounded-xl border border-slate-800">
               <button 
                 onClick={() => setHistoryViewType('card')}
                 className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-2 transition-all ${historyViewType === 'card' ? 'bg-slate-800 text-blue-400 shadow-sm' : 'text-slate-600'}`}
               >
                 <LayoutGrid size={12} />
                 <span className="text-[9px] font-black uppercase">Cards</span>
               </button>
               <button 
                 onClick={() => setHistoryViewType('table')}
                 className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-2 transition-all ${historyViewType === 'table' ? 'bg-slate-800 text-blue-400 shadow-sm' : 'text-slate-600'}`}
               >
                 <List size={12} />
                 <span className="text-[9px] font-black uppercase">Table</span>
               </button>
            </div>
            <div className="flex gap-1">
              <button 
                onClick={() => {
                  if (sortBy === 'time') setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
                  else setSortBy('time');
                }}
                className={`w-10 h-10 rounded-xl border transition-all flex items-center justify-center ${
                  sortBy === 'time' ? 'bg-blue-600/10 border-blue-500/50 text-blue-400' : 'bg-slate-900 border-slate-800 text-slate-600'
                }`}
              >
                <Clock size={16} />
              </button>
              <button 
                onClick={() => {
                  if (sortBy === 'profit') setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
                  else setSortBy('profit');
                }}
                className={`w-10 h-10 rounded-xl border transition-all flex items-center justify-center ${
                  sortBy === 'profit' ? 'bg-blue-600/10 border-blue-500/50 text-blue-400' : 'bg-slate-900 border-slate-800 text-slate-600'
                }`}
              >
                <Coins size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Audit Ledger List/Table */}
        <div className="space-y-3 pb-24">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.25em]">Audit Ledger</h3>
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{sortedAndFilteredHistory.length} Records</span>
          </div>
          
          {sortedAndFilteredHistory.length > 0 ? (
            historyViewType === 'card' ? (
              sortedAndFilteredHistory.map((trade) => {
                const isExpanded = expandedTrade === trade.ticket;
                return (
                  <div 
                    key={trade.ticket} 
                    className={`bg-slate-900/40 border rounded-3xl transition-all duration-300 overflow-hidden ${
                      isExpanded ? 'border-blue-500 shadow-xl' : 'border-slate-800/60 shadow-sm'
                    }`}
                  >
                    <div 
                      className="p-5 cursor-pointer flex justify-between items-start"
                      onClick={() => setExpandedTrade(isExpanded ? null : trade.ticket)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-md ${trade.profit >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                          {trade.type === 'BUY' ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-black text-white">{trade.symbol}</h4>
                            {trade.mode === 'DEMO' && (
                              <span className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded text-[7px] font-black text-amber-500 uppercase tracking-widest">
                                <TestTube2 size={8} /> Demo
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-[10px] font-black uppercase ${trade.type === 'BUY' ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {trade.type}
                            </span>
                            <span className="w-1 h-1 bg-slate-700 rounded-full" />
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                              {trade.volume} Lots
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end">
                        <p className={`text-lg font-black font-mono tabular-nums tracking-tighter ${trade.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {trade.profit >= 0 ? '+' : ''}{trade.profit.toFixed(2)}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <Clock size={10} className="text-slate-600" />
                          <p className="text-[9px] font-bold text-slate-600 uppercase tracking-tighter">
                            {new Date(trade.close_time || trade.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-5 pb-5 pt-2 space-y-4 animate-in slide-in-from-top-2">
                        <div className="grid grid-cols-2 gap-6 p-4 bg-slate-950/50 rounded-2xl border border-slate-800">
                          <div className="space-y-1">
                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Entry Price</span>
                            <p className="text-xs font-mono font-bold text-slate-300">{trade.open_price.toFixed(5)}</p>
                          </div>
                          <div className="space-y-1 text-right">
                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Exit Price</span>
                            <p className="text-xs font-mono font-bold text-blue-400">{trade.close_price?.toFixed(5) || trade.current_price.toFixed(5)}</p>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Duration</span>
                            <p className="text-xs font-mono font-bold text-slate-300">{calculateDuration(trade.time, trade.close_time)}</p>
                          </div>
                          <div className="space-y-1 text-right">
                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Ticket ID</span>
                            <p className="text-xs font-mono font-bold text-slate-300">#{trade.ticket}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => navigate(`/chart/${trade.symbol}`)}
                          className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-[9px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
                        >
                          Context Analysis <ArrowRight size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
                 <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                       <thead>
                          <tr className="border-b border-slate-800 bg-slate-950/50">
                             <th className="px-4 py-3 text-[8px] font-black text-slate-500 uppercase tracking-widest">Symbol</th>
                             <th className="px-4 py-3 text-[8px] font-black text-slate-500 uppercase tracking-widest text-center">Lot</th>
                             <th className="px-4 py-3 text-[8px] font-black text-slate-500 uppercase tracking-widest text-right">Exit Price</th>
                             <th className="px-4 py-3 text-[8px] font-black text-slate-500 uppercase tracking-widest text-right">P/L</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-800/50">
                          {sortedAndFilteredHistory.map((trade) => (
                             <tr key={trade.ticket} className="active:bg-slate-800/50 transition-colors" onClick={() => navigate(`/chart/${trade.symbol}`)}>
                                <td className="px-4 py-4">
                                   <div className="flex items-center gap-2">
                                      <div className={`w-1 h-3 rounded-full ${trade.type === 'BUY' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                      <span className="text-[10px] font-black text-white">{trade.symbol}</span>
                                   </div>
                                </td>
                                <td className="px-4 py-4 text-center">
                                   <span className="text-[9px] font-bold text-slate-400 font-mono">{trade.volume.toFixed(2)}</span>
                                </td>
                                <td className="px-4 py-4 text-right">
                                   <span className="text-[9px] font-bold text-slate-300 font-mono">{(trade.close_price || trade.current_price).toFixed(trade.symbol.includes('BTC') ? 2 : 5)}</span>
                                </td>
                                <td className="px-4 py-4 text-right">
                                   <div className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-black font-mono tracking-tighter ${trade.profit >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                                      {trade.profit >= 0 ? '+' : ''}{trade.profit.toFixed(2)}
                                   </div>
                                </td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              </div>
            )
          ) : (
            <div className="py-20 text-center">
              <p className="text-xs font-black text-slate-600 uppercase tracking-widest">No matching records</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="p-5 space-y-6">
      {/* Terminal Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Terminal</h2>
          <div className="flex items-center gap-1.5 mt-1">
             <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${accountMode === 'REAL' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
               {accountMode} EXPOSURE
             </span>
             <div className="w-1 h-1 bg-slate-800 rounded-full" />
             <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">0.1ms Edge</p>
          </div>
        </div>
        <div className="flex gap-2.5">
          <button 
            onClick={onRefresh}
            className={`w-11 h-11 flex items-center justify-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 active:scale-95 transition-all shadow-xl ${isPositionsRefetching || isHistoryRefetching ? 'animate-spin' : ''}`}
          >
            <RefreshCw size={20} />
          </button>
          <button 
            onClick={handlePanic}
            className="px-5 py-2.5 bg-rose-500/10 border border-rose-500/30 text-rose-500 text-[10px] font-black rounded-2xl uppercase flex items-center gap-2 active:scale-95 transition-all shadow-xl shadow-rose-500/10 group"
          >
            <ShieldAlert size={16} className="group-hover:animate-shake" /> Panic
          </button>
        </div>
      </div>

      {/* Modern Tab System */}
      <div className="flex bg-slate-900 p-1.5 rounded-3xl border border-slate-800/50 shadow-inner">
        <button 
          onClick={() => setActiveTab('live')}
          className={`flex-1 flex items-center justify-center gap-2.5 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'live' ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/30' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <Activity size={16} className={activeTab === 'live' ? 'animate-pulse' : ''} /> Live exposure
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`flex-1 flex items-center justify-center gap-2.5 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/30' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <History size={16} /> History audit
        </button>
      </div>

      {activeTab === 'live' ? renderLiveTab() : renderHistoryTab()}
    </div>
  );
};

export default TradesScreen;
