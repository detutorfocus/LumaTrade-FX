
import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, Bot, User, Loader2, RotateCcw, RefreshCw, 
  Target, ShieldAlert, Zap, TrendingUp, ChevronDown, 
  ChevronUp, AlertCircle, Globe, ShieldCheck, Waves,
  Cpu, Database, Search, FileText, Shield
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getGeminiResponse } from '../services/geminiService';
import { ChatMessage } from '../types';
import { apiClient } from '../api/client';
import { MarketData } from '../api/types';

interface InternalMessage extends ChatMessage {
  isError?: boolean;
  linkedSymbol?: string;
  isVerified?: boolean;
}

const ChatScreen: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<InternalMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Neural Uplink Established. Alex Core v3 active.\n\nSIGNAL: STANDBY\nBIAS: NEUTRAL\nCONFIDENCE: 100%\nEXPLANATION: Mention a symbol (e.g., 'Analyze XAUUSD') to begin data-grounded interrogation.",
      timestamp: new Date(),
      isVerified: true
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncingData, setIsSyncingData] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isLoading, isSyncingData]);

  const fetchMarketContext = async (symbol: string, timeframe: string = '1H') => {
    try {
      const [liveRes, historyRes] = await Promise.all([
        apiClient.get<MarketData[]>('/api/mt5/market/live/'),
        apiClient.get(`/api/mt5/market/history?symbol=${symbol}&timeframe=${timeframe}`)
      ]);

      const livePrice = liveRes.data.find(m => m.symbol === symbol.toUpperCase());
      const history = (historyRes.data || []).slice(-25); // Increased for better context

      if (!livePrice) return null;

      // Providing structured JSON-like text helps Gemini's reasoning engine
      return `
PRIMARY_DATASET:
SYMBOL: ${symbol.toUpperCase()}
CURRENT_TIME: ${new Date().toISOString()}
LIVE_BID: ${livePrice.bid}
LIVE_ASK: ${livePrice.ask}
TIMEFRAME: ${timeframe}

HISTORICAL_CANDLES_OHLC:
${history.map((c: any) => `[T:${c.time} O:${c.open} H:${c.high} L:${c.low} C:${c.close}]`).join('\n')}
      `.trim();
    } catch (err) {
      console.error("Market context retrieval failed:", err);
      return null;
    }
  };

  const detectSymbolAndTimeframe = (text: string) => {
    const symbolRegex = /\b(XAUUSD|EURUSD|BTCUSD|GBPUSD|USDJPY|NAS100|SPX500|AUDUSD|USDCAD|ETHUSD)\b/i;
    const tfRegex = /\b(1m|5m|15m|30m|1H|4H|1D)\b/i;
    
    const symbolMatch = text.match(symbolRegex);
    const tfMatch = text.match(tfRegex);
    
    return {
      symbol: symbolMatch ? symbolMatch[0].toUpperCase() : null,
      timeframe: tfMatch ? tfMatch[0] : '1H'
    };
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const { symbol, timeframe } = detectSymbolAndTimeframe(text);
    
    const userMsg: InternalMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
      linkedSymbol: symbol || undefined
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    let marketContext = '';
    if (symbol) {
      setIsSyncingData(true);
      const contextData = await fetchMarketContext(symbol, timeframe);
      if (contextData) {
        marketContext = contextData;
      }
      setIsSyncingData(false);
    }

    try {
      const geminiHistory = messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user' as 'model' | 'user',
        parts: [{ text: m.content }]
      }));

      const responseText = await getGeminiResponse(text, geminiHistory, marketContext);
      
      const assistantMsg: InternalMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseText || "Analysis Engine silent. Verify connection.",
        timestamp: new Date(),
        isVerified: !!marketContext
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (error: any) {
      console.error("AI Communication Error:", error);
      
      const errorMsg: InternalMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "SIGNAL: ERROR\nBIAS: UNKNOWN\nEXPLANATION: Critical failure in intelligence uplink. Please verify connection protocols.",
        timestamp: new Date(),
        isError: true
      };
      
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
      setIsSyncingData(false);
    }
  };

  const retryLastMessage = () => {
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserMsg) {
      if (messages[messages.length - 1].isError) {
        setMessages(prev => prev.slice(0, -1));
      }
      handleSendMessage(lastUserMsg.content);
    }
  };

  const clearHistory = () => {
    if (confirm("Execute history purge?")) {
      setMessages([messages[0]]);
    }
  };

  const formatReport = (content: string) => {
    const sections = ['SIGNAL:', 'BIAS:', 'ENTRY IDEA:', 'RISK:', 'CONFIDENCE:', 'EXPLANATION:'];
    let formattedContent = content;

    sections.forEach(header => {
      const regex = new RegExp(`(${header})`, 'g');
      formattedContent = formattedContent.replace(regex, `<span class="font-black text-blue-400 block mt-3 mb-1 tracking-widest text-[10px] uppercase underline decoration-blue-500/20 underline-offset-4">$1</span>`);
    });

    return formattedContent;
  };

  const getSignalStatusColor = (content: string) => {
    if (content.includes('SIGNAL: BUY') || content.includes('SIGNAL: ENTER')) return 'border-l-emerald-500 bg-emerald-500/5';
    if (content.includes('SIGNAL: SELL')) return 'border-l-rose-500 bg-rose-500/5';
    if (content.includes('SIGNAL: WAIT') || content.includes('SIGNAL: PREPARE')) return 'border-l-amber-500 bg-amber-500/5';
    if (content.includes('SIGNAL: AVOID') || content.includes('SIGNAL: ERROR')) return 'border-l-slate-700 bg-slate-900/50';
    return 'border-l-blue-500 bg-slate-900/40';
  };

  return (
    <div className="flex flex-col h-full bg-slate-950">
      <div className="px-5 py-3 border-b border-slate-800/50 flex justify-between items-center glass shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></div>
            <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-blue-400 animate-ping opacity-50"></div>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Alex Core v3</span>
            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest leading-none">Grounded Intelligence</span>
          </div>
        </div>
        <button 
          onClick={clearHistory}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-500 hover:text-rose-400 transition-all active:scale-95"
        >
          <RotateCcw size={12} />
          <span className="text-[9px] font-black uppercase tracking-wider">Reset</span>
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-8">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[95%] flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-1 border ${
                msg.role === 'user' 
                  ? 'bg-blue-600/20 border-blue-500/30 text-blue-400' 
                  : msg.isError 
                    ? 'bg-rose-500/20 border-rose-500/30 text-rose-500' 
                    : 'bg-slate-900 border-slate-800 text-blue-500 shadow-lg'
              }`}>
                {msg.role === 'user' ? <User size={16} /> : <FileText size={16} />}
              </div>
              
              <div className="flex flex-col gap-2 flex-1">
                <div className={`px-4 py-3 rounded-2xl text-[13px] leading-relaxed font-medium shadow-sm border-l-2 ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white border-l-white/20 rounded-tr-none' 
                    : getSignalStatusColor(msg.content) + ' border border-slate-800/40 rounded-tl-none text-slate-200'
                }`}>
                  {msg.role === 'assistant' ? (
                    <div 
                      className="report-content"
                      dangerouslySetInnerHTML={{ __html: formatReport(msg.content) }}
                    />
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  )}
                  
                  {msg.isError && (
                    <button onClick={retryLastMessage} className="mt-3 flex items-center gap-1.5 text-[10px] font-black uppercase text-rose-400">
                      <RefreshCw size={12} /> Retry
                    </button>
                  )}
                </div>
                
                <div className={`flex items-center gap-2 mt-1 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.isVerified && (
                    <div className="flex items-center gap-1 px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded text-[7px] font-black text-emerald-500 uppercase">
                      <Shield size={8} /> Data Grounded
                    </div>
                  )}
                  {msg.linkedSymbol && (
                    <div className="flex items-center gap-1 px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded text-[7px] font-black text-blue-500 uppercase">
                      <Database size={8} /> Source: {msg.linkedSymbol}
                    </div>
                  )}
                  <div className="text-[8px] font-bold opacity-30 uppercase tracking-tighter">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
        {(isLoading || isSyncingData) && (
          <div className="flex justify-start">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shadow-lg">
                <Loader2 size={16} className="text-blue-500 animate-spin" />
              </div>
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl rounded-tl-none px-4 py-3 flex flex-col gap-2">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-blue-500/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 bg-blue-500/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 bg-blue-500/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest animate-pulse">
                  {isSyncingData ? 'Syncing Liquidity Nodes...' : 'Anti-Hallucination Check Active...'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-5 border-t border-slate-800/50 glass-dark pb-8">
        <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(input); }} className="relative">
          <input
            type="text"
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 pl-5 pr-14 text-[13px] text-white focus:ring-2 focus:ring-blue-600 outline-none placeholder:text-slate-600 transition-all shadow-inner"
            placeholder="Interrogate market strategy..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white disabled:opacity-30 active:scale-90 transition-all shadow-lg shadow-blue-600/20"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatScreen;
