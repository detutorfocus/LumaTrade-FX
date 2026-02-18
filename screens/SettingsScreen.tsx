
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  User, LogOut, Terminal, Link2, Shield, Globe, Lock, Hash, 
  Loader2, CheckCircle2, ChevronRight, Bot, Cpu, Sliders, 
  Zap, Timer, Info, ShieldAlert, BadgeCheck, Activity,
  Wallet, Landmark, ArrowUpRight, SignalHigh, ShieldCheck,
  Smartphone, Database, RefreshCw, AlertCircle
} from 'lucide-react';
import { apiClient } from '../api/client';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

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

  const handleLinkMT5 = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLinking(true);
    try {
      await apiClient.post('/api/mt5/connect/', linkData);
      await refreshUser(); 
      
      // Visual feedback for successful linkage
      setShowSuccessOverlay(true);
      setTimeout(() => {
        setShowSuccessOverlay(false);
        setAccountMode('REAL');
      }, 2000);
      
      setIsLinking(false);
    } catch (err) {
      console.error(err);
      alert("Failed to connect MT5 terminal. Verify your credentials.");
      setIsLinking(false);
    }
  };

  const handleModeSwitch = (mode: 'DEMO' | 'REAL') => {
    if (mode === accountMode) return;
    
    setTransitioning(true);
    // Simulate internal system re-routing
    setTimeout(() => {
      setAccountMode(mode);
      queryClient.invalidateQueries(); // Force all screens to fetch mode-specific data
      setTransitioning(false);
    }, 800);
  };

  const unlinkMT5 = async () => {
    if (confirm("Disconnect MT5 account? Real mode will be disabled immediately.")) {
      setAccountMode('DEMO');
      localStorage.removeItem('mt5_linked_status');
      await refreshUser();
      queryClient.invalidateQueries();
    }
  };

  return (
    <div className="p-5 space-y-6 pb-32 relative">
      {/* Mode Transition Overlay */}
      {transitioning && (
        <div className="fixed inset-0 z-[60] bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in duration-300">
          <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-6" />
          <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] animate-pulse">Switching Liquidity Pools...</p>
        </div>
      )}

      {/* Success Overlay for Linkage */}
      {showSuccessOverlay && (
        <div className="fixed inset-0 z-[60] bg-emerald-600 flex flex-col items-center justify-center animate-in zoom-in-95 duration-500">
           <div className="w-24 h-24 bg-white/20 rounded-[2.5rem] flex items-center justify-center text-white mb-6">
              <CheckCircle2 size={48} className="animate-bounce" />
           </div>
           <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Terminal Synced</h2>
           <p className="text-white/70 text-xs font-bold uppercase tracking-widest mt-2">Activating Institutional Mode</p>
        </div>
      )}

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-black text-white uppercase tracking-tighter">Tools & Access</h2>
        <button 
          onClick={logout}
          className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl active:scale-95 transition-all flex items-center gap-2"
        >
          <span className="text-[9px] font-black uppercase tracking-widest px-1">Exit Terminal</span>
          <LogOut size={16} />
        </button>
      </div>

      {/* Profile Card */}
      <button 
        onClick={() => navigate('/profile')}
        className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-5 flex items-center gap-4 text-left active:scale-[0.98] transition-all hover:bg-slate-800/50 shadow-lg"
      >
        <div className="w-14 h-14 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl flex items-center justify-center text-slate-500 border border-slate-700 shrink-0">
          <UserIcon size={28} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-black text-white leading-tight truncate">{user?.username || 'Trader'}</h3>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate">{user?.email}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <ChevronRight size={18} className="text-slate-700" />
          <span className="text-[7px] font-black text-emerald-500 uppercase tracking-widest px-1.5 py-0.5 bg-emerald-500/10 rounded">Verified ID</span>
        </div>
      </button>

      {/* Account Mode Switcher */}
      <div className={`bg-slate-900 border rounded-[2.5rem] p-5 space-y-5 shadow-xl transition-colors duration-500 ${
        accountMode === 'REAL' ? 'border-emerald-500/30' : 'border-slate-800'
      }`}>
        <div className="flex justify-between items-center px-1">
          <div className="flex items-center gap-2">
            <Activity size={16} className={accountMode === 'REAL' ? 'text-emerald-500' : 'text-amber-500'} />
            <h3 className="text-xs font-black text-white uppercase tracking-widest">Execution Mode</h3>
          </div>
          <div className="flex items-center gap-2">
             {accountMode === 'REAL' && <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />}
             <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
               accountMode === 'REAL' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
             }`}>
               {accountMode}
             </span>
          </div>
        </div>

        <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-800/50 gap-2">
          <button 
            onClick={() => handleModeSwitch('DEMO')}
            className={`flex-1 flex items-center justify-center gap-2.5 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              accountMode === 'DEMO' 
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30' 
                : 'text-slate-500 hover:text-slate-400'
            }`}
          >
            <Zap size={14} className={accountMode === 'DEMO' ? 'fill-current' : ''} />
            Simulated
          </button>
          <button 
            disabled={!isLinked}
            onClick={() => handleModeSwitch('REAL')}
            className={`flex-1 flex items-center justify-center gap-2.5 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all relative ${
              accountMode === 'REAL' 
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30' 
                : isLinked 
                  ? 'text-slate-500 hover:text-slate-400' 
                  : 'text-slate-700 cursor-not-allowed'
            }`}
          >
            <ShieldCheck size={14} className={accountMode === 'REAL' ? 'fill-current' : ''} />
            Institutional
            {!isLinked && (
              <div className="absolute -top-1 -right-1">
                <Lock size={10} className="text-slate-800 bg-slate-700 rounded-full p-0.5 border border-slate-900 shadow-md" />
              </div>
            )}
          </button>
        </div>

        {/* Real Account Specific Details */}
        {accountMode === 'REAL' && isLinked && (
          <div className="space-y-4 animate-in slide-in-from-top-4 duration-500">
             <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4 space-y-1">
                   <div className="flex items-center gap-1.5 mb-1">
                     <Wallet size={10} className="text-slate-500" />
                     <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Real Balance</span>
                   </div>
                   <p className="text-sm font-black text-white font-mono">$42,500.50</p>
                </div>
                <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4 space-y-1">
                   <div className="flex items-center gap-1.5 mb-1">
                     <Database size={10} className="text-slate-500" />
                     <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Tier-1 Equity</span>
                   </div>
                   <p className="text-sm font-black text-emerald-400 font-mono">$44,112.92</p>
                </div>
             </div>
             <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3 flex items-center gap-3">
                <Smartphone size={14} className="text-emerald-500 shrink-0" />
                <p className="text-[9px] font-bold text-emerald-500/80 uppercase leading-relaxed">
                  Terminal synced with London LD4 Data Center. High-priority execution active.
                </p>
             </div>
          </div>
        )}

        {!isLinked && (
          <div className="px-4 py-3 bg-amber-500/5 border border-amber-500/20 rounded-xl flex items-start gap-3">
            <ShieldAlert size={14} className="text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-[9px] font-black text-amber-500 uppercase">Institutional Access Locked</p>
              <p className="text-[8px] font-bold text-amber-500/60 uppercase leading-relaxed">
                Connect your verified MT5 credentials below to unlock Real Mode global liquidity routing.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Trading Engine Granular Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-6 space-y-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none text-blue-500">
          <Bot size={120} />
        </div>

        <div className="flex justify-between items-center relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Cpu size={20} />
            </div>
            <div>
              <h3 className="text-xs font-black text-white uppercase tracking-widest">Neural Execution Core</h3>
              <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest leading-none mt-1">Autonomous Trading Settings</p>
            </div>
          </div>
          <button 
            onClick={() => setAutoTradeEnabled(!autoTradeEnabled)}
            className={`shrink-0 w-14 h-7 rounded-full transition-all relative flex items-center px-1.5 shadow-inner ${
              autoTradeEnabled ? 'bg-emerald-600' : 'bg-slate-800 border border-slate-700'
            }`}
          >
            <div className={`w-4 h-4 rounded-full transition-all shadow-md ${
              autoTradeEnabled ? 'bg-white translate-x-7' : 'bg-slate-500 translate-x-0'
            }`} />
          </button>
        </div>

        {autoTradeEnabled && (
          <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300 relative z-10">
            {/* Confidence Threshold Slider */}
            <div className="space-y-3">
              <div className="flex justify-between items-end px-1">
                <div className="flex items-center gap-2">
                  <Shield size={14} className="text-blue-400" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Confidence Floor</span>
                </div>
                <span className="text-lg font-black font-mono text-blue-400 leading-none">{aiConfidenceThreshold}%</span>
              </div>
              <div className="relative h-2 bg-slate-950 rounded-full border border-slate-800/50 flex items-center">
                <input 
                  type="range" min="75" max="99" step="1"
                  className="w-full h-full opacity-0 cursor-pointer absolute inset-0 z-10"
                  value={aiConfidenceThreshold}
                  onChange={(e) => setAiConfidenceThreshold(parseInt(e.target.value, 10))}
                />
                <div 
                  className="absolute h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full shadow-[0_0_10px_rgba(37,99,235,0.4)]"
                  style={{ width: `${((aiConfidenceThreshold - 75) / (99 - 75)) * 100}%` }}
                />
              </div>
              <p className="text-[9px] text-slate-500 font-medium italic px-1 leading-relaxed">
                Trades will only fire if the AI conviction exceeds this threshold. High conviction reduces exposure risk.
              </p>
            </div>

            {/* Order Type Preference */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <Sliders size={14} className="text-blue-400" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Execution Protocol</span>
              </div>
              <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-800/50 gap-1.5 shadow-inner">
                <button 
                  onClick={() => setAiOrderTypePreference('MARKET')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    aiOrderTypePreference === 'MARKET' 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                      : 'text-slate-600 hover:text-slate-400'
                  }`}
                >
                  <Zap size={12} /> Market Order
                </button>
                <button 
                  onClick={() => setAiOrderTypePreference('LIMIT')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    aiOrderTypePreference === 'LIMIT' 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                      : 'text-slate-600 hover:text-slate-400'
                  }`}
                >
                  <Timer size={12} /> Pending Limit
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MT5 Bridge Section */}
      <div className={`bg-slate-900 border rounded-3xl overflow-hidden shadow-xl transition-all duration-500 ${
        isLinked ? 'border-emerald-500/20' : 'border-slate-800'
      }`}>
        <div className="p-5 border-b border-slate-800 bg-slate-800/20 flex justify-between items-center">
          <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
            <Terminal size={14} className="text-blue-500" /> MetaTrader 5 Bridge
          </h3>
          {isLinked && (
            <div className="flex items-center gap-1.5">
               <SignalHigh size={12} className="text-emerald-500" />
               <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Sync Active</span>
            </div>
          )}
        </div>
        
        {isLinked ? (
          <div className="p-8 text-center space-y-5 animate-in fade-in duration-700">
            <div className="mx-auto w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-3xl flex items-center justify-center border border-emerald-500/20 shadow-2xl shadow-emerald-500/5">
              <Landmark size={40} />
            </div>
            <div>
              <div className="flex items-center justify-center gap-2 mb-1">
                <CheckCircle2 size={12} className="text-emerald-500" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Terminal Operational</p>
              </div>
              <h4 className="text-sm font-black text-white uppercase tracking-tighter">Login: {user?.pk || '7720054'}</h4>
              <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mt-1">Server: MetaQuotes-Demo</p>
            </div>
            <div className="pt-4 flex flex-col gap-3">
              <button 
                onClick={unlinkMT5}
                className="w-full bg-slate-950 border border-slate-800 text-rose-500 font-black py-3 rounded-xl text-[10px] uppercase tracking-widest active:scale-95 transition-all hover:bg-rose-500/5"
              >
                Sever Terminal Link
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleLinkMT5} className="p-5 space-y-4">
             <div className="bg-blue-600/10 border border-blue-500/20 rounded-2xl p-4 mb-2 flex gap-3 items-center">
                <Info size={16} className="text-blue-400 shrink-0" />
                <p className="text-[10px] text-blue-400 font-bold leading-relaxed uppercase">
                  Linking your MT5 account enables Real Mode institutional trading.
                </p>
             </div>
             <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">MT5 Login</label>
                <div className="relative">
                  <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                  <input 
                    type="text" 
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-xs font-medium focus:ring-1 focus:ring-blue-500 outline-none text-white transition-all"
                    placeholder="Terminal ID"
                    value={linkData.login}
                    onChange={e => setLinkData({...linkData, login: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Server Name</label>
                <div className="relative">
                  <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                  <input 
                    type="text" 
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-xs font-medium focus:ring-1 focus:ring-blue-500 outline-none text-white transition-all"
                    placeholder="MetaQuotes-Demo"
                    value={linkData.server}
                    onChange={e => setLinkData({...linkData, server: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Master Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                  <input 
                    type="password" 
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-xs font-medium focus:ring-1 focus:ring-blue-500 outline-none text-white transition-all"
                    placeholder="••••••••"
                    value={linkData.password}
                    onChange={e => setLinkData({...linkData, password: e.target.value})}
                  />
                </div>
              </div>
              <button 
                type="submit" 
                disabled={isLinking}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-xl text-[10px] uppercase tracking-[0.2em] transition-all shadow-xl shadow-blue-600/20 flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                {isLinking ? <Loader2 size={16} className="animate-spin" /> : 'Synchronize Terminal'}
              </button>
          </form>
        )}
      </div>

      <div className="text-center pb-8 opacity-50 flex flex-col items-center gap-2">
        <div className="flex items-center gap-3">
          <RefreshCw size={10} className="text-slate-600" />
          <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.4em]">Institutional Access Engine v3.4</p>
        </div>
        <p className="text-[7px] font-bold text-slate-700 uppercase tracking-widest">Build 772-PRO.X</p>
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
