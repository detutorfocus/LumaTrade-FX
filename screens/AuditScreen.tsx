
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  ShieldCheck, 
  Calendar, 
  Lock, 
  Globe, 
  RefreshCcw, 
  Filter, 
  Search, 
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { apiClient } from '../api/client';
import { SecurityActivity } from '../api/types';

const AuditScreen: React.FC = () => {
  const [filterType, setFilterType] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const { data: activities, isLoading, refetch, isRefetching } = useQuery<SecurityActivity[]>({
    queryKey: ['security-activity', filterType],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterType) params.append('event_type', filterType);
      const res = await apiClient.get(`/api/security/activity/?${params.toString()}`);
      return res.data;
    }
  });

  const filteredLogs = useMemo(() => {
    // Rigid defensive check against non-array responses
    if (!Array.isArray(activities)) return [];
    
    return activities.filter(log => 
      (log.event_type?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
      (log.ip_address || '').includes(searchTerm)
    );
  }, [activities, searchTerm]);

  const verifyIntegrity = async () => {
    try {
      const res = await apiClient.get('/api/trading/verify/');
      alert(`Terminal Integrity Verified: ${res.data.status || 'Success'}\nHash: ${res.data.hash_chain_tail?.substring(0, 16)}...`);
    } catch (err) {
      alert("Integrity verification failed. Terminal may be compromised.");
    }
  };

  return (
    <div className="p-5 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-black text-white uppercase tracking-tighter">Audit Console</h2>
        <button 
          onClick={() => refetch()}
          className={`w-9 h-9 flex items-center justify-center bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-all ${isRefetching ? 'animate-spin' : ''}`}
        >
          <RefreshCcw size={16} />
        </button>
      </div>

      <div className="space-y-3">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-500 transition-colors" size={16} />
          <input 
            type="text"
            placeholder="Search IP or event type..."
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-3 pl-11 pr-4 text-xs font-medium text-white focus:ring-1 focus:ring-blue-500 outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {['', 'login', 'trade', 'connection', 'logout'].map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${
                filterType === type 
                  ? 'bg-blue-600 border-blue-500 text-white' 
                  : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}
            >
              {type || 'All Events'}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-20 bg-slate-900/50 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLogs && filteredLogs.length > 0 ? filteredLogs.map((log) => (
            <div key={log.id} className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-4 flex gap-4 animate-in fade-in">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                log.success 
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' 
                  : 'bg-rose-500/10 border-rose-500/20 text-rose-500'
              }`}>
                {log.event_type?.includes('login') ? <Lock size={18} /> : <ShieldCheck size={18} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="text-[12px] font-bold text-white uppercase truncate pr-2">
                    {log.event_type?.replace(/_/g, ' ') || 'SYSTEM EVENT'}
                  </h4>
                  <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${
                    log.success ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-400'
                  }`}>
                    {log.success ? 'Success' : 'Refused'}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[9px] font-bold text-slate-500 uppercase tracking-tight">
                  <span className="flex items-center gap-1"><Globe size={10} /> {log.ip_address}</span>
                  <span className="flex items-center gap-1"><Calendar size={10} /> {new Date(log.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          )) : (
            <div className="py-20 flex flex-col items-center justify-center text-center">
              <ShieldCheck size={48} className="text-slate-800 mb-4 opacity-50" />
              <p className="text-xs font-bold text-slate-500 uppercase">No matching logs</p>
            </div>
          )}
        </div>
      )}

      <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-[2rem] p-6 shadow-xl border-t-blue-500/30">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
            <CheckCircle2 size={28} />
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-widest">Compliance Engine</h3>
            <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">Status: Operational</p>
          </div>
        </div>
        <p className="text-[11px] text-slate-400 mb-6 leading-relaxed">
          The LumaTrade platform implements a SHA-256 hash-chained transaction log. 
          Verify terminal state against the distributed ledger to ensure zero manipulation.
        </p>
        <button 
          onClick={verifyIntegrity}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-blue-600/20 text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 active:scale-95"
        >
          <RefreshCcw size={16} /> Verify Terminal State
        </button>
      </div>
    </div>
  );
};

export default AuditScreen;
