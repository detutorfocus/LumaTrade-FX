
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  User, LogOut, Terminal, Link2, Shield, Globe, Lock, Hash, 
  Loader2, CheckCircle2, ChevronRight, Bot, Cpu, Sliders, 
  Zap, Timer, Info, ShieldAlert, BadgeCheck, Activity,
  Wallet, Landmark, ArrowUpRight, SignalHigh, ShieldCheck,
  Smartphone, Database, RefreshCw, AlertCircle, FileText, Scale,
  Dna, Gavel, BarChart4, Gauge, Layers, MousePointer2
} from 'lucide-react';
import { apiClient } from '../api/client';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

type StrategyType = 'CONSERVATIVE' | 'BALANCED' | 'AGGRESSIVE' | 'CUSTOM';

const SettingsScreen: React.FC = () => {
  const { 
    user, 
    logout, 
    refreshUser,
    autoTradeEnabled, 
    setAutoTradeEnabled,
    aiConfidenceThreshold,
    setAiConfidenceThreshold,
    aiOrderTypePreference,
    setAiOrderTypePreference,
    aiMaxPositions,
    setAiMaxPositions,
    aiSlippageTolerance,
    setAiSlippageTolerance,
    accountMode,
    setAccountMode
  } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [isLinking, setIsLinking] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [linkData, setLinkData] = useState({ login: '', password: '', server: 'MetaQuotes-Demo' });
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);

  const isLinked = !!user?.mt5_linked;

  const strategyType = useMemo<StrategyType>(() => {
    if (aiConfidenceThreshold === 95 && aiOrderTypePreference === 'LIMIT') return 'CONSERVATIVE';
    if (aiConfidenceThreshold === 88 && aiOrderTypePreference === 'MARKET') return 'BALANCED';
    if (aiConfidenceThreshold === 78 && aiOrderTypePreference === 'MARKET') return 'AGGRESSIVE';
    return 'CUSTOM';
  }, [aiConfidenceThreshold, aiOrderTypePreference]);

  const applyStrategyPreset = (type: StrategyType) => {
    switch (type) {
      case 'CONSERVATIVE':
        setAiConfidenceThreshold(95);
        setAiOrderTypePreference('LIMIT');
        setAiMaxPositions(2);
        break;
      case 'BALANCED':
        setAiConfidenceThreshold(88);
        setAiOrderTypePreference('MARKET');
        setAiMaxPositions(5);
        break;
      case 'AGGRESSIVE':
        setAiConfidenceThreshold(78);
        setAiOrderTypePreference('MARKET');
        setAiMaxPositions(10);
        break;
    }
  };

  const handleLinkMT5 = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLinking(true);
    try {
      await apiClient.post('/api/mt5/connect/', linkData);
      await refreshUser(); 
      setShowSuccessOverlay(true);
      setTimeout(() => setShowSuccessOverlay(false), 2000);
      setIsLinking(false);
    } catch (err) {
      alert("Failed to connect MT5 terminal.");
      setIsLinking(false);
    }
  };

  const handleModeSwitch = (mode: 'DEMO' | 'REAL') => {
    if (mode === accountMode) return;
    setTransitioning(true);
    setTimeout(() => {
      setAccountMode(mode);
      setTransitioning(false);
    }, 800);
  };

  return (
    <div className="p-5 space-y-6 pb-32 relative">
      {transitioning && (
        <div className="fixed inset-0 z-[60] bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center">
          <Loader2 className="w-16 h-16 text-blue-500 animate-spin mb-6" />
          <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] animate-pulse">Rerouting Liquidity...</p>
        </div>
      )}

      {showSuccessOverlay && (
        <div className="fixed inset-0 z-[60] bg-emerald-600 flex flex-col items-center justify-center animate-in zoom-in-95 duration-500">
           <CheckCircle2 size={64} className="text-white animate-bounce mb-4" />
           <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Terminal Linked</h2>
        </div>
      )}

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-black text-white uppercase tracking-tighter">Terminal Tools</h2>
        <button onClick={logout} className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl">
          <LogOut size={16} />
        </button>
      </div>

      {/* Profile Card */}
      <button 
        onClick={() => navigate('/profile')}
        className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-5 flex items-center gap-4 text-left shadow-lg"
      >
        <div className="w-14 h-14 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-500 border border-blue-500/20">
          <User size={28} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-black text-white truncate">{user?.username || 'Institutional Trader'}</h3>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate">{user?.email}</p>
        </div>
        <ChevronRight size={18} className="text-slate-700" />
      </button>

      {/* AI TRADING ENGINE */}
      <div className={`bg-slate-900 border rounded-[2.5rem] p-6 space-y-6 shadow-2xl transition-all duration-700 relative overflow-hidden ${
        strategyType === 'CONSERVATIVE' ? 'border-cyan-500/30' : 
        strategyType === 'AGGRESSIVE' ? 'border-amber-500/30' : 'border-slate-800'
      }`}>
        <div className="flex justify-between items-center relative z-10">
          <div className="flex items-center gap-3">
            <Cpu size={20} className={autoTradeEnabled ? 'text-blue-400' : 'text-slate-600'} />
            <div>
              <h3 className="text-xs font-black text-white uppercase tracking-widest">Neural Execution Core</h3>
              <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-1">Autonomous Strategy</p>
            </div>
          </div>
          <button 
            onClick={() => setAutoTradeEnabled(!autoTradeEnabled)}
            className={`w-14 h-7 rounded-full flex items-center px-1.5 transition-all ${autoTradeEnabled ? 'bg-blue-600' : 'bg-slate-800'}`}
          >
            <div className={`w-4 h-4 rounded-full bg-white transition-all ${autoTradeEnabled ? 'translate-x-7' : 'translate-x-0'}`} />
          </button>
        </div>

        {autoTradeEnabled && (
          <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500 relative z-10">
            {/* Strategy Selectors */}
            <div className="grid grid-cols-3 gap-2">
              {(['CONSERVATIVE', 'BALANCED', 'AGGRESSIVE'] as StrategyType[]).map(type => (
                <button
                  key={type}
                  onClick={() => applyStrategyPreset(type)}
                  className={`py-3 rounded-2xl border text-[8px] font-black uppercase tracking-tighter transition-all ${
                    strategyType === type ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-950/50 border-slate-800 text-slate-600'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            {/* Confidence Slider */}
            <div className="space-y-4">
              <div className="flex justify-between items-end px-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Confidence Floor</span>
                <span className="text-xl font-black font-mono text-white">{aiConfidenceThreshold}%</span>
              </div>
              <input 
                type="range" min="70" max="98" step="1"
                className="w-full h-2 bg-slate-950 rounded-full appearance-none outline-none accent-blue-600"
                value={aiConfidenceThreshold}
                onChange={(e) => setAiConfidenceThreshold(parseInt(e.target.value, 10))}
              />
            </div>

            {/* Execution Protocol */}
            <div className="space-y-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Protocol Priority</span>
              <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-2xl">
                <button onClick={() => setAiOrderTypePreference('MARKET')} className={`py-4 rounded-xl text-[10px] font-black uppercase transition-all ${aiOrderTypePreference === 'MARKET' ? 'bg-blue-600 text-white' : 'text-slate-700'}`}>Instant Market</button>
                <button onClick={() => setAiOrderTypePreference('LIMIT')} className={`py-4 rounded-xl text-[10px] font-black uppercase transition-all ${aiOrderTypePreference === 'LIMIT' ? 'bg-blue-600 text-white' : 'text-slate-700'}`}>Precise Limit</button>
              </div>
            </div>

            {/* NEW: Institutional Guardrails */}
            <div className="space-y-4 pt-4 border-t border-slate-800">
               <div className="flex items-center gap-2 mb-2">
                 <Shield className="text-emerald-500" size={14} />
                 <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Institutional Guardrails</h4>
               </div>
               
               <div className="space-y-4">
                 <div className="flex justify-between items-center px-1">
                    <div className="flex items-center gap-2">
                      <Layers size={12} className="text-slate-500" />
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Max Open Positions</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => setAiMaxPositions(Math.max(1, aiMaxPositions - 1))} className="w-8 h-8 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center text-white">-</button>
                      <span className="text-sm font-black text-white font-mono w-4 text-center">{aiMaxPositions}</span>
                      <button onClick={() => setAiMaxPositions(Math.min(20, aiMaxPositions + 1))} className="w-8 h-8 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center text-white">+</button>
                    </div>
                 </div>

                 <div className="space-y-2">
                    <div className="flex justify-between items-center px-1">
                      <div className="flex items-center gap-2">
                        <MousePointer2 size={12} className="text-slate-500" />
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Slippage Tolerance</span>
                      </div>
                      <span className="text-xs font-black text-white font-mono">{aiSlippageTolerance} Pips</span>
                    </div>
                    <input 
                      type="range" min="0.5" max="10" step="0.5"
                      className="w-full h-1.5 bg-slate-950 rounded-full appearance-none outline-none accent-emerald-500"
                      value={aiSlippageTolerance}
                      onChange={(e) => setAiSlippageTolerance(parseFloat(e.target.value))}
                    />
                 </div>
               </div>
            </div>
          </div>
        )}
      </div>

      {/* Account Mode Switcher */}
      <div className={`bg-slate-900 border rounded-[2.5rem] p-5 space-y-5 ${accountMode === 'REAL' ? 'border-emerald-500/30' : 'border-slate-800'}`}>
        <div className="flex justify-between items-center px-1">
          <div className="flex items-center gap-2">
            <Activity size={16} className={accountMode === 'REAL' ? 'text-emerald-500' : 'text-amber-500'} />
            <h3 className="text-xs font-black text-white uppercase tracking-widest">Execution Mode</h3>
          </div>
          <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${accountMode === 'REAL' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'}`}>
            {accountMode}
          </span>
        </div>

        <div className="flex bg-slate-950 p-1.5 rounded-2xl gap-2">
          <button onClick={() => handleModeSwitch('DEMO')} className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase ${accountMode === 'DEMO' ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-700'}`}>Simulated</button>
          <button disabled={!isLinked} onClick={() => handleModeSwitch('REAL')} className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase ${accountMode === 'REAL' ? 'bg-emerald-600 text-white shadow-lg' : isLinked ? 'text-slate-700' : 'text-slate-900 cursor-not-allowed'}`}>Institutional</button>
        </div>
      </div>

      {/* MT5 Link Form */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5">
        <h3 className="text-xs font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
          <Terminal size={14} className="text-blue-500" /> Terminal Bridge
        </h3>
        {isLinked ? (
          <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex flex-col items-center gap-3">
             <ShieldCheck size={32} className="text-emerald-500" />
             <p className="text-[10px] font-black text-emerald-500 uppercase">Secure Link Established</p>
             <button onClick={() => { localStorage.removeItem('mt5_linked_status'); refreshUser(); }} className="text-[8px] font-black text-slate-500 uppercase underline mt-2">Disconnect Terminal</button>
          </div>
        ) : (
          <form onSubmit={handleLinkMT5} className="space-y-4">
            <input type="text" placeholder="MT5 Login" className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-xs font-medium text-white" value={linkData.login} onChange={e => setLinkData({...linkData, login: e.target.value})} />
            <input type="password" placeholder="Master Password" className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-xs font-medium text-white" value={linkData.password} onChange={e => setLinkData({...linkData, password: e.target.value})} />
            <button type="submit" disabled={isLinking} className="w-full bg-blue-600 text-white font-black py-4 rounded-xl text-[10px] uppercase tracking-widest">
              {isLinking ? <Loader2 className="animate-spin mx-auto" size={16} /> : 'Synchronize Bridge'}
            </button>
          </form>
        )}
      </div>

      <div className="text-center pb-8 opacity-30">
        <p className="text-[7px] font-bold text-slate-700 uppercase tracking-widest">LumaTrade Terminal v3.4.772-PRO</p>
      </div>
    </div>
  );
};

const UserIcon = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);

export default SettingsScreen;
