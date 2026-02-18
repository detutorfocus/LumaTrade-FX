
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Newspaper, 
  Search, 
  Filter, 
  ArrowUpRight, 
  Clock, 
  AlertCircle, 
  Zap, 
  BrainCircuit, 
  ChevronRight,
  TrendingUp,
  RefreshCw,
  Info,
  CalendarDays
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { NewsArticle } from '../api/types';

const NewsScreen: React.FC = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: news, isLoading, refetch } = useQuery<NewsArticle[]>({
    queryKey: ['market-news'],
    queryFn: async () => {
      const res = await apiClient.get('/api/market/news/');
      return res.data;
    },
    refetchInterval: 300000, // 5 minutes
  });

  const filteredNews = useMemo(() => {
    if (!news) return [];
    return news.filter(item => {
      const matchesCategory = activeCategory === 'ALL' || item.category === activeCategory;
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           item.summary.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [news, activeCategory, searchQuery]);

  const getImpactColor = (impact: string) => {
    switch(impact) {
      case 'HIGH': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      case 'MEDIUM': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'LOW': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  };

  const handleAIAnalyze = (item: NewsArticle) => {
    navigate('/chat', { state: { initialMessage: `Alex, analyze this news: "${item.title}". Summary: ${item.summary}. What is the likely impact on ${item.symbol_linked || 'the markets'}?` } });
  };

  return (
    <div className="p-5 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Intelligence</h2>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Global Macro Feed</p>
        </div>
        <button 
          onClick={() => refetch()}
          className="w-11 h-11 flex items-center justify-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 active:rotate-180 transition-all duration-500"
        >
          <RefreshCw size={20} />
        </button>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
          <input 
            type="text" 
            placeholder="Search market intel..." 
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-3 pl-11 pr-4 text-xs font-medium text-white focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-700"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
          {['ALL', 'ECONOMY', 'FOREX', 'CRYPTO'].map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border shrink-0 ${
                activeCategory === cat 
                  ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20' 
                  : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-slate-900/40 border border-slate-800 rounded-[2rem] h-48 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-4 pb-12">
          {filteredNews.length > 0 ? (
            filteredNews.map((item) => (
              <div key={item.id} className="bg-slate-900/40 border border-slate-800 rounded-[2rem] p-6 shadow-xl relative overflow-hidden group hover:border-blue-500/30 transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div className={`px-2 py-0.5 rounded border text-[8px] font-black uppercase tracking-widest ${getImpactColor(item.impact)}`}>
                    {item.impact} IMPACT
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Clock size={10} />
                    <span className="text-[9px] font-bold uppercase tracking-widest">
                      {new Date(item.published_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                <h3 className="text-sm font-black text-white leading-snug mb-2 group-hover:text-blue-400 transition-colors">
                  {item.title}
                </h3>
                
                <p className="text-[11px] text-slate-400 font-medium leading-relaxed mb-6 line-clamp-3">
                  {item.summary}
                </p>

                <div className="flex items-center justify-between border-t border-slate-800 pt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.1em]">{item.source}</span>
                  </div>
                  
                  <button 
                    onClick={() => handleAIAnalyze(item)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-600/10 border border-blue-500/20 rounded-xl text-blue-500 hover:bg-blue-600 hover:text-white transition-all active:scale-95"
                  >
                    <BrainCircuit size={12} />
                    <span className="text-[9px] font-black uppercase tracking-widest">Neural Analysis</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="py-20 flex flex-col items-center justify-center text-center">
              <Newspaper size={48} className="text-slate-800 mb-4 opacity-50" />
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">No Intelligence Matching Query</p>
            </div>
          )}
        </div>
      )}

      {/* Economic Calendar Mini-HUD */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-[2rem] p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <CalendarDays size={100} />
        </div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500">
            <Zap size={20} />
          </div>
          <div>
            <h3 className="text-xs font-black text-white uppercase tracking-widest">Session Volatility</h3>
            <p className="text-[8px] font-bold text-slate-500 uppercase mt-1">Expected Trend: High Vol</p>
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between items-center px-1">
             <span className="text-[9px] font-bold text-slate-400 uppercase">FOMC Minutes</span>
             <span className="text-[9px] font-black text-white font-mono">18:00 UTC</span>
          </div>
          <div className="flex justify-between items-center px-1">
             <span className="text-[9px] font-bold text-slate-400 uppercase">BoE Rate Decision</span>
             <span className="text-[9px] font-black text-rose-500 font-mono">HIGH IMPACT</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsScreen;
