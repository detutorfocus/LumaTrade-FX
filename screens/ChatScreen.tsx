
import React, { useState, useRef, useEffect } from 'react';
/* Added Globe and ShieldCheck to resolve missing name errors on lines 241 and 244 */
import { Send, Bot, User, Loader2, Sparkles, RotateCcw, RefreshCw, Target, ShieldAlert, Zap, TrendingUp, Info, ChevronDown, ChevronUp, AlertCircle, Globe, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getGeminiResponse } from '../services/geminiService';
import { ChatMessage } from '../types';

interface AlexAnalysis {
  action: 'WAIT' | 'PREPARE' | 'ENTER' | 'AVOID' | 'NEED_DATA';
  confidence: number;
  explanation: string;
  what_to_watch?: string[];
  technical_analysis: {
    market_context: string;
    zones: string;
    liquidity: string;
    confirmation: string;
    signal?: string;
    risk?: string;
    next_actions?: string;
  };
  limits?: string[];
}

interface InternalMessage extends ChatMessage {
  isError?: boolean;
  analysis?: AlexAnalysis;
}

const ChatScreen: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<InternalMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Neural Uplink Established. I am Alex, your Sniper Entry specialist. Provide a symbol and timeframe (e.g., 'Analyze XAUUSD on H1') to begin market interrogation.",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [expandedDetails, setExpandedDetails] = useState<Record<string, boolean>>({});
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isLoading]);

  const toggleDetails = (id: string) => {
    setExpandedDetails(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: InternalMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const geminiHistory = messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user' as 'model' | 'user',
        parts: [{ text: m.role === 'assistant' && m.analysis ? JSON.stringify(m.analysis) : m.content }]
      }));

      const responseText = await getGeminiResponse(text, geminiHistory);
      
      let analysis: AlexAnalysis | undefined;
      let displayContent = responseText || '';

      try {
        if (responseText) {
          analysis = JSON.parse(responseText);
          displayContent = analysis?.explanation || responseText;
        }
      } catch (e) {
        console.warn("Response was not JSON:", responseText);
      }

      const assistantMsg: InternalMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: displayContent,
        analysis: analysis,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (error: any) {
      console.error("AI Communication Error:", error);
      
      const errorMsg: InternalMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Critical failure in intelligence uplink. Please verify connection protocols.",
        timestamp: new Date(),
        isError: true
      };
      
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
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
      setExpandedDetails({});
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'ENTER': return 'bg-emerald-500 text-white';
      case 'PREPARE': return 'bg-blue-500 text-white';
      case 'WAIT': return 'bg-amber-500 text-white';
      case 'AVOID': return 'bg-rose-500 text-white';
      default: return 'bg-slate-700 text-white';
    }
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
            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest leading-none">Sniper Entry Intelligence</span>
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
                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              
              <div className="flex flex-col gap-2 flex-1">
                {msg.analysis ? (
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-300">
                    {/* Action Header */}
                    <div className={`px-4 py-2 flex justify-between items-center ${getActionColor(msg.analysis.action)}`}>
                       <div className="flex items-center gap-2">
                         <Zap size={14} fill="currentColor" />
                         <span className="text-[11px] font-black uppercase tracking-wider">{msg.analysis.action}</span>
                       </div>
                       <div className="flex items-center gap-1.5">
                         <span className="text-[10px] font-black uppercase tracking-tighter">{msg.analysis.confidence}% Conviction</span>
                       </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-4 space-y-4">
                      {/* Confidence Bar */}
                      <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)] transition-all duration-1000 ease-out"
                          style={{ width: `${msg.analysis.confidence}%` }}
                        />
                      </div>

                      <p className="text-[13px] leading-relaxed text-slate-200 font-medium italic">
                        "{msg.analysis.explanation}"
                      </p>

                      {/* Watch Bullets */}
                      {msg.analysis.what_to_watch && msg.analysis.what_to_watch.length > 0 && (
                        <div className="bg-slate-950/50 rounded-xl p-3 border border-slate-800/50">
                           <h5 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                             <Target size={10} className="text-blue-500" /> Key Observation Windows
                           </h5>
                           <ul className="space-y-1.5">
                             {msg.analysis.what_to_watch.map((item, idx) => (
                               <li key={idx} className="text-[11px] text-slate-400 flex gap-2">
                                 <span className="text-blue-500 font-black">•</span> {item}
                               </li>
                             ))}
                           </ul>
                        </div>
                      )}

                      {/* Technical Toggle */}
                      <button 
                        onClick={() => toggleDetails(msg.id)}
                        className="w-full py-2 bg-slate-800/50 hover:bg-slate-800 rounded-lg flex items-center justify-center gap-2 transition-all"
                      >
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          {expandedDetails[msg.id] ? 'Minimize Technicals' : 'View Sniper Breakdown'}
                        </span>
                        {expandedDetails[msg.id] ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      </button>

                      {/* Technical Details */}
                      {expandedDetails[msg.id] && (
                        <div className="space-y-3 pt-2 animate-in slide-in-from-top-2 duration-300">
                          <div className="grid grid-cols-1 gap-3">
                             {[
                               { label: 'Market Context', val: msg.analysis.technical_analysis.market_context, icon: Globe },
                               { label: 'Zones Identified', val: msg.analysis.technical_analysis.zones, icon: Target },
                               { label: 'Liquidity Analysis', val: msg.analysis.technical_analysis.liquidity, icon: Waves },
                               { label: 'Confirmation Protocol', val: msg.analysis.technical_analysis.confirmation, icon: ShieldCheck },
                               { label: 'Tactical Signal', val: msg.analysis.technical_analysis.signal, icon: TrendingUp, color: 'text-blue-400' },
                               { label: 'Risk Protection', val: msg.analysis.technical_analysis.risk, icon: ShieldAlert, color: 'text-rose-400' },
                             ].map((tech, idx) => tech.val ? (
                               <div key={idx} className="border-l-2 border-slate-800 pl-3 py-1">
                                 <div className="flex items-center gap-1.5 mb-1">
                                   <tech.icon size={10} className={tech.color || 'text-slate-500'} />
                                   <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{tech.label}</span>
                                 </div>
                                 <p className="text-[11px] text-slate-300 font-medium leading-tight">{tech.val}</p>
                               </div>
                             ) : null)}
                          </div>
                          
                          {msg.analysis.limits && (
                            <div className="pt-2">
                               <div className="flex items-center gap-1.5 mb-2">
                                 <AlertCircle size={10} className="text-amber-500" />
                                 <span className="text-[8px] font-black text-amber-500/70 uppercase tracking-widest">Constraints & Limits</span>
                               </div>
                               <ul className="space-y-1">
                                 {msg.analysis.limits.map((l, i) => (
                                   <li key={i} className="text-[10px] text-slate-500 italic">• {l}</li>
                                 ))}
                               </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className={`px-4 py-3 rounded-2xl text-[13px] leading-relaxed font-medium shadow-sm whitespace-pre-wrap ${
                    msg.role === 'user' 
                      ? 'bg-blue-600 text-white rounded-tr-none' 
                      : msg.isError
                        ? 'bg-rose-500/10 border border-rose-500/20 text-rose-200 rounded-tl-none'
                        : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none'
                  }`}>
                    {msg.content}
                    {msg.isError && (
                      <button onClick={retryLastMessage} className="mt-3 flex items-center gap-1.5 text-[10px] font-black uppercase text-rose-400">
                        <RefreshCw size={12} /> Retry
                      </button>
                    )}
                  </div>
                )}
                <div className={`text-[8px] font-bold opacity-30 uppercase tracking-tighter ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shadow-lg">
                <Loader2 size={16} className="text-blue-500 animate-spin" />
              </div>
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl rounded-tl-none px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-blue-500/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 bg-blue-500/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 bg-blue-500/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
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

// Mock icon for waves/liquidity
const Waves = ({ size, className }: { size: number, className: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>
  </svg>
);

export default ChatScreen;
