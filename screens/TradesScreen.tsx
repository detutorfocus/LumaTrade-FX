
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

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['trades-live'] });
    queryClient.invalidateQueries({ queryKey: ['trades-history'] });
  }, [accountMode, queryClient]);

  const { data: positions, isLoading: isPositionsLoading, refetch: refetchPositions } = useQuery<MT5Position[]>({
    queryKey: ['trades-live', accountMode],
    queryFn: async () => {
      const res = await apiClient.get('/api/mt5/live/positions/');
      return res.data;
    },
    refetchInterval: 3000,
    enabled: activeTab === 'live'
  });

  const totalFloatingProfit = useMemo(() => 
    Array.isArray(positions) ? positions.reduce((acc, pos) => acc + pos.profit, 0) : 0,
    [positions]
  );

  const { data: history, isLoading: isHistoryLoading, refetch: refetchHistory } = useQuery<MT5Position[]>({
    queryKey: ['trades-history', accountMode],
    queryFn: async () => {
      const res = await apiClient.get('/api/mt5/live/history/');
      return res.data;
    },
    enabled: activeTab === 'history'
  });

  const performanceStats = useMemo(() => {
    if (!Array.isArray(history) || history.length === 0) return null;
    const profitableTrades = history.filter(t => t.profit > 0).length;
    const totalProfit = history.reduce((acc, t) => acc + t.profit, 0);
    return {
      totalTrades: history.length,
      winRate: (profitableTrades / history.length) * 100,
      totalProfit,
      profitableTrades
    };
  }, [history]);

  const sortedAndFilteredHistory = useMemo(() => {
    if (!Array.isArray(history)) return [];
    let result = history.filter(t => 
      t.symbol.toLowerCase().includes(historySearch.toLowerCase()) ||
      t.type.toLowerCase().includes(historySearch.toLowerCase())
    );
    result.sort((a, b) => {
      if (sortBy === 'time') {
        const timeA = new Date(a.close_time || a.time).getTime();
        const timeB = new Date(b.close_time || b.time).getTime();
        return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
      }
      return sortOrder === 'desc' ? b.profit - a.profit : a.profit - b.profit;
    });
    return result;
  }, [history, historySearch, sortBy, sortOrder]);

  const closePosition = useMutation({
    mutationFn: async (ticket: number) => apiClient.post('/api/mt5/live/close/', { ticket }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades-live'] });
      queryClient.invalidateQueries({ queryKey: ['trades-history'] });
    }
  });

  const calculateDuration = (open: string, close?: string) => {
    if (!close) return 'Active';
    const diff = new Date(close).getTime() - new Date(open).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}m`;
    return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
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
        <Zap size={32} className="text-slate-700 mb-6" />
        <h3 className="text-lg font-black text-white mb-2 uppercase tracking-tighter">Market Neutral</h3>
        <p className="text-xs font-medium text-slate-500 max-w-[200px]">No active exposure detected.</p>
      </div>
    );
    return (
      <div className="space-y-6">
        <div className={`rounded-3xl p-6 flex justify-between items-center shadow-xl border-l-4 ${totalFloatingProfit >= 0 ? 'bg-emerald-500/10 border-emerald-500' : 'bg-rose-500/10 border-rose-500'}`}>
           <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Floating P/L</p>
              <h2 className={`text-3xl font-black font-mono tracking-tighter tabular-nums ${totalFloatingProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {totalFloatingProfit >= 0 ? '+' : ''}{totalFloatingProfit.toFixed(2)}
              </h2>
           </div>
           <div className="text-right flex flex-col items-end">
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2">Exposed Lots</span>
              <span className="text-lg font-black text-white font-mono">{positions.reduce((acc, p) => acc + p.volume, 0).toFixed(2)}</span>
           </div>
        </div>
        <div className="space-y-4">
          {positions.map((pos) => (
            <div key={pos.ticket} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-col gap-5 shadow-xl transition-all" onClick={() => navigate(`/chart/${pos.symbol}`)}>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${pos.type === 'BUY' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-rose-500/10 border-rose-500/20 text-rose-500'}`}>
                    {pos.type === 'BUY' ? <ArrowUpRight size={24} /> : <ArrowDownRight size={24} />}
                  </div>
                  <div>
                    <h4 className="text-base font-black text-white">{pos.symbol} <span className="text-[9px] text-slate-500 font-bold uppercase ml-2">#{pos.ticket}</span></h4>
                    <span className={`text-[10px] font-black uppercase ${pos.type === 'BUY' ? 'text-emerald-500' : 'text-rose-500'}`}>{pos.type} · {pos.volume} Lots</span>
                  </div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); closePosition.mutate(pos.ticket); }} className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400"><X size={20} /></button>
              </div>
              <div className="grid grid-cols-2 gap-4 border-t border-slate-800 pt-5">
                <div className="flex flex-col gap-1.5"><span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Entry</span><span className="text-xs font-mono font-bold text-slate-300">{pos.open_price.toFixed(5)}</span></div>
                <div className="flex flex-col gap-0.5 text-right"><span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Floating P/L</span><p className={`text-2xl font-black font-mono tracking-tighter tabular-nums ${pos.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{pos.profit >= 0 ? '+' : ''}{pos.profit.toFixed(2)}</p></div>
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
        <p className="text-xs font-medium text-slate-500 max-w-[200px]">Closed positions appear here.</p>
      </div>
    );
    return (
      <div className="space-y-6">
        {performanceStats && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-5 flex flex-col gap-1 relative overflow-hidden group">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">NET PROFIT</span>
              <span className={`text-2xl font-black font-mono tabular-nums ${performanceStats.totalProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>${performanceStats.totalProfit.toFixed(2)}</span>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                <div className="bg-emerald-500 h-full transition-all duration-1000" style={{ width: `${performanceStats.winRate}%` }} />
              </div>
            </div>
            <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-5 flex flex-col gap-1 relative overflow-hidden group">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">WIN RATE</span>
              <span className="text-2xl font-black text-white tabular-nums tracking-tighter">{performanceStats.winRate.toFixed(1)}%</span>
              <span className="text-[9px] font-bold text-slate-500 uppercase mt-3">{performanceStats.profitableTrades} / {performanceStats.totalTrades} Successes</span>
            </div>
          </div>
        )}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
            <input type="text" placeholder="Search history..." className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-3 pl-11 pr-4 text-xs font-medium text-white focus:ring-1 focus:ring-blue-500 outline-none" value={historySearch} onChange={(e) => setHistorySearch(e.target.value)} />
          </div>
          <div className="space-y-3 pb-24">
            {sortedAndFilteredHistory.map((trade) => (
              <div key={trade.ticket} className="bg-slate-900/40 border border-slate-800/60 rounded-3xl p-5 flex justify-between items-start" onClick={() => setExpandedTrade(expandedTrade === trade.ticket ? null : trade.ticket)}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${trade.profit >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                    {trade.type === 'BUY' ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white">{trade.symbol}</h4>
                    <span className={`text-[10px] font-black uppercase ${trade.type === 'BUY' ? 'text-emerald-400' : 'text-rose-400'}`}>{trade.type} · {trade.volume} Lots</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-black font-mono tabular-nums ${trade.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{trade.profit >= 0 ? '+' : ''}{trade.profit.toFixed(2)}</p>
                  <p className="text-[9px] font-bold text-slate-600 uppercase tabular-nums">{new Date(trade.close_time || trade.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-5 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Terminal</h2>
        <button onClick={() => activeTab === 'live' ? refetchPositions() : refetchHistory()} className="w-11 h-11 flex items-center justify-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-400"><RefreshCw size={20} /></button>
      </div>
      <div className="flex bg-slate-900 p-1.5 rounded-3xl border border-slate-800/50 shadow-inner">
        <button onClick={() => setActiveTab('live')} className={`flex-1 flex items-center justify-center gap-2.5 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'live' ? 'bg-blue-600 text-white shadow-xl' : 'text-slate-500'}`}>Live exposure</button>
        <button onClick={() => setActiveTab('history')} className={`flex-1 flex items-center justify-center gap-2.5 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-blue-600 text-white shadow-xl' : 'text-slate-500'}`}>History audit</button>
      </div>
      {activeTab === 'live' ? renderLiveTab() : renderHistoryTab()}
    </div>
  );
};

export default TradesScreen;
