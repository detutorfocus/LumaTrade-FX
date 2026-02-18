
import React from 'react';
import { X, ShieldCheck, Target, ShieldAlert, AlertTriangle, Info } from 'lucide-react';
import { AccountMode } from '../api/types';

interface TradeConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  symbol: string;
  orderType: 'BUY' | 'SELL';
  price: number;
  volume: number;
  tp?: string;
  sl?: string;
  accountMode?: AccountMode;
}

const TradeConfirmationModal: React.FC<TradeConfirmationProps> = ({
  isOpen,
  onClose,
  onConfirm,
  symbol,
  orderType,
  price,
  volume,
  tp,
  sl,
  accountMode = 'DEMO'
}) => {
  if (!isOpen) return null;

  const isBuy = orderType === 'BUY';
  const isReal = accountMode === 'REAL';

  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-300 p-6">
      <div className={`w-full max-w-sm bg-slate-900 border ${isReal ? 'border-emerald-500/30' : 'border-slate-800'} rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300`}>
        {/* Header */}
        <div className={`p-6 ${isBuy ? (isReal ? 'bg-emerald-600' : 'bg-emerald-700') : (isReal ? 'bg-rose-600' : 'bg-rose-700')} flex justify-between items-center relative overflow-hidden`}>
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/40 to-transparent" />
          </div>
          <div className="flex items-center gap-3 relative z-10">
            {isReal ? <ShieldCheck className="text-white" size={24} /> : <Info className="text-white" size={24} />}
            <div className="flex flex-col">
              <h3 className="text-lg font-black text-white uppercase tracking-tighter">Confirm Execution</h3>
              <span className="text-[9px] font-black text-white/70 uppercase tracking-widest">{accountMode} ACCOUNT</span>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white active:scale-90 transition-all relative z-10"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6 bg-gradient-to-b from-slate-900 to-slate-950">
          {/* Real Mode Warning Banner */}
          {isReal && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex items-center gap-3 animate-pulse">
               <AlertTriangle size={20} className="text-emerald-500 shrink-0" />
               <p className="text-[10px] font-black text-emerald-500 uppercase leading-tight tracking-widest">
                 Live Institutional Order: Funds at risk.
               </p>
            </div>
          )}

          <div className="flex justify-between items-center border-b border-slate-800 pb-4">
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Trading Asset</p>
              <h4 className="text-2xl font-black text-white tracking-tighter">{symbol}</h4>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Market Volume</p>
              <h4 className="text-xl font-black text-blue-400 font-mono tracking-tighter">{volume.toFixed(2)} Lots</h4>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Direction</p>
              <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest ${
                isBuy ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-500 border border-rose-500/30'
              }`}>
                {orderType}
              </span>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Exec Price</p>
              <span className="text-sm font-black text-white font-mono">{price.toFixed(symbol.includes('BTC') ? 2 : 5)}</span>
            </div>
          </div>

          {(tp || sl) && (
            <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4 space-y-3">
              {tp && (
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Target size={12} className="text-emerald-500" />
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Target Profit</span>
                  </div>
                  <span className="text-xs font-black font-mono text-emerald-400">{tp}</span>
                </div>
              )}
              {sl && (
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <ShieldAlert size={12} className="text-rose-500" />
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Protective Stop</span>
                  </div>
                  <span className="text-xs font-black font-mono text-rose-400">{sl}</span>
                </div>
              )}
            </div>
          )}

          <div className="space-y-3 pt-2">
            <button 
              onClick={onConfirm}
              className={`w-full py-5 rounded-2xl text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 ${
                isBuy 
                  ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20' 
                  : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20'
              }`}
            >
              {isReal ? 'Authorize Real Order' : 'Execute Demo Order'}
            </button>
            <p className="text-[8px] text-center font-bold text-slate-600 uppercase tracking-[0.2em]">
              {isReal ? 'Direct routing to global liquidity pools' : 'Simulated execution for training purposes'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradeConfirmationModal;
