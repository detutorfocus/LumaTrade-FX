
// DO NOT add any new files, classes, or namespaces.
// Fix: Property 'setMarkers' does not exist on type 'ISeriesApi<"Candlestick", ...>'.
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createChart, IChartApi, ISeriesApi, CandlestickData, Time, ColorType, IPriceLine, SeriesMarker } from 'lightweight-charts';
import { 
  ArrowLeft, Activity, Zap, ChevronDown, Loader2, Clock, 
  CheckCircle2, AlertCircle, BellPlus, Bell, 
  Target, TrendingUp, X, MousePointer2,
  ShieldAlert, Crosshair, Move, Cpu, TrendingDown,
  ChevronRight, Sparkles, Bot, BrainCircuit, Waves, ShieldCheck,
  Quote, Plus, Layers, BarChart4, Gauge,
  ArrowUp, ArrowDown, Minus, Trash2, Calendar,
  Ban, ShieldX, Wallet
} from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { apiClient } from '../api/client';
import { MarketData, MT5Order, MT5Position } from '../api/types';
import { useAuth } from '../context/AuthContext';
import TradeConfirmationModal from '../components/TradeConfirmationModal';

const SYMBOLS = ['XAUUSD', 'EURUSD', 'BTCUSD', 'GBPUSD', 'USDJPY'];
const TIMEFRAMES = ['1m', '5m', '15m', '1H', '4H', '1D'];
const LOT_PRESETS = [0.01, 0.1, 0.5, 1.0];

interface PriceAlert {
  id: string;
  symbol: string;
  price: number;
  direction: 'above' | 'below';
  active: boolean;
}

interface TradeSignal {
  symbol: string;
  type: 'BUY' | 'SELL';
  entry: number;
  tp: number;
  sl: number;
  confidence: number;
  reasoning: string;
  volatilityContext: string;
  indicators: {
    rsi?: number;
    trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    volatility: 'LOW' | 'NORMAL' | 'EXTREME';
  };
  autoExecuted?: boolean;
}

interface SelectionRange {
  start: number | null;
  end: number | null;
  startPrice: number | null;
  endPrice: number | null;
}

interface PendingTrade {
  orderType: 'BUY' | 'SELL';
  price: number;
  tp: string;
  sl: string;
  volume: number;
  timeframe: string;
}

const ChartScreen: React.FC = () => {
  const { symbol: routeSymbol } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { autoTradeEnabled, accountMode } = useAuth();
  const [currentSymbol, setCurrentSymbol] = useState(routeSymbol || 'XAUUSD');
  const [timeframe, setTimeframe] = useState('5m');
  const [isTimeframeOpen, setIsTimeframeOpen] = useState(false);
  
  const [lotSize, setLotSize] = useState(0.1);
  
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const mainSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const lastPriceRef = useRef<Record<string, number>>({});
  const tradePriceLinesRef = useRef<IPriceLine[]>([]);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string, detail?: string } | null>(null);
  const [analysisMode, setAnalysisMode] = useState<'pan' | 'range'>('pan');
  const [selection, setSelection] = useState<SelectionRange>({ start: null, end: null, startPrice: null, endPrice: null });
  const isDraggingRef = useRef(false);

  const [activeSignal, setActiveSignal] = useState<TradeSignal | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [takeProfit, setTakeProfit] = useState('');
  const [stopLoss, setStopLoss] = useState('');

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [pendingTrade, setPendingTrade] = useState<PendingTrade | null>(null);

  const { data: chartHistory, isLoading: isHistoryLoading } = useQuery<CandlestickData[]>({
    queryKey: ['market-history', currentSymbol, timeframe],
    queryFn: async () => {
      const res = await apiClient.get(`/api/mt5/market/history?symbol=${currentSymbol}&timeframe=${timeframe}`);
      return res.data;
    },
    staleTime: 60000,
  });

  const { data: marketData } = useQuery<MarketData[]>({
    queryKey: ['market-live'],
    queryFn: async () => {
      const res = await apiClient.get('/api/mt5/market/live/');
      return res.data;
    },
    refetchInterval: 1000, 
  });

  const { data: activePositions } = useQuery<MT5Position[]>({
    queryKey: ['positions-live', accountMode],
    queryFn: async () => {
      const res = await apiClient.get('/api/mt5/live/positions/');
      return res.data;
    },
    refetchInterval: 3000
  });

  const { data: pendingOrders } = useQuery<MT5Order[]>({
    queryKey: ['orders-live', accountMode],
    queryFn: async () => {
      const res = await apiClient.get('/api/mt5/live/orders/');
      return res.data;
    },
    refetchInterval: 5000
  });

  const symbolOngoingTrade = useMemo(() => 
    activePositions?.find(pos => pos.symbol === currentSymbol),
    [activePositions, currentSymbol]
  );

  const symbolPendingOrder = useMemo(() => 
    pendingOrders?.find(ord => ord.symbol === currentSymbol),
    [pendingOrders, currentSymbol]
  );

  const activeSymbolData = useMemo(() => 
    marketData?.find(m => m.symbol === currentSymbol), 
    [marketData, currentSymbol]
  );
  
  const currentPrice = activeSymbolData ? (activeSymbolData.bid + activeSymbolData.ask) / 2 : null;

  const tradeMutation = useMutation({
    mutationFn: async ({ orderType, price, isAuto, tp, sl, volume, tf }: { orderType: 'BUY' | 'SELL', price: number, isAuto?: boolean, tp?: string, sl?: string, volume: number, tf: string }) => {
      await new Promise(resolve => setTimeout(resolve, 600));
      const response = await apiClient.post('/api/mt5/trade/execute', {
        symbol: currentSymbol,
        price,
        orderType,
        volume: volume,
        mode: isAuto ? 'autonomous' : 'manual',
        take_profit: tp ? parseFloat(tp) : null,
        stop_loss: sl ? parseFloat(sl) : null,
        account_mode: accountMode,
        execution_timeframe: tf
      });
      return response.data;
    },
    onSuccess: (data, variables) => {
      const priceText = variables.price.toFixed(currentSymbol.includes('BTC') ? 2 : 5);
      const msg = variables.isAuto ? 'AI Auto-Executed' : 'Order Confirmed';
      const modeSuffix = accountMode === 'REAL' ? ' (REAL)' : ' (DEMO)';
      setFeedback({ 
        type: 'success', 
        message: msg + modeSuffix, 
        detail: `Ticket #${data.ticket} at ${priceText} (${variables.volume} Lots) [${variables.tf}]` 
      });
      setTakeProfit('');
      setStopLoss('');
      queryClient.invalidateQueries({ queryKey: ['trades-live'] });
      queryClient.invalidateQueries({ queryKey: ['positions-live'] });
      queryClient.invalidateQueries({ queryKey: ['orders-live'] });
      setTimeout(() => setFeedback(null), 4000);
    },
    onError: () => {
      setFeedback({ type: 'error', message: 'Execution Failed', detail: 'Terminal connectivity issue' });
      setTimeout(() => setFeedback(null), 4000);
    }
  });

  const cancelOrderMutation = useMutation({
    mutationFn: async (ticket: number) => {
      return apiClient.post('/api/mt5/live/cancel/', { ticket });
    },
    onSuccess: () => {
      setFeedback({ type: 'success', message: 'Order Cancelled', detail: 'Pending order removed from queue.' });
      queryClient.invalidateQueries({ queryKey: ['orders-live'] });
      setTimeout(() => setFeedback(null), 3000);
    }
  });

  const closePositionMutation = useMutation({
    mutationFn: async (ticket: number) => {
      return apiClient.post('/api/mt5/live/close/', { ticket });
    },
    onSuccess: () => {
      setFeedback({ type: 'success', message: 'Trade Liquidated', detail: 'Position closed at market price.' });
      queryClient.invalidateQueries({ queryKey: ['positions-live'] });
      setTimeout(() => setFeedback(null), 3000);
    }
  });

  // Tick Sync Effect
  useEffect(() => {
    if (chartRef.current && mainSeriesRef.current && currentPrice !== null) {
      try {
        const now = Math.floor(Date.now() / 1000) as Time;
        const lastMain = lastPriceRef.current[currentSymbol] || currentPrice;
        mainSeriesRef.current.update({
          time: now,
          open: lastMain,
          high: Math.max(lastMain, currentPrice),
          low: Math.min(lastMain, currentPrice),
          close: currentPrice,
        });
        lastPriceRef.current[currentSymbol] = currentPrice;
      } catch (e) {
        console.debug("Tick sync suppressed:", e);
      }
    }
  }, [marketData, currentSymbol, currentPrice]);

  // Main Chart Lifecycle Effect
  useEffect(() => {
    if (!chartContainerRef.current) return;
    lastPriceRef.current = {};

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#020617' },
        textColor: '#94a3b8',
        fontSize: 10,
        fontFamily: 'Inter',
      },
      grid: {
        vertLines: { color: 'rgba(30, 41, 59, 0.1)' },
        horzLines: { color: 'rgba(30, 41, 59, 0.1)' },
      },
      timeScale: {
        borderColor: '#1e293b',
        timeVisible: true,
        secondsVisible: true,
        shiftVisibleRangeOnNewBar: true,
      },
      rightPriceScale: {
        borderColor: '#1e293b',
        autoScale: true,
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: analysisMode === 'pan',
        horzTouchDrag: true,
        vertTouchDrag: true,
      },
      handleScale: {
        mouseWheel: true,
        pinch: true,
        axisPressedMouseMove: true,
      },
    });

    const mainSeries = (chart as any).addCandlestickSeries({
      upColor: '#10b981',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444',
    });

    if (chartHistory) mainSeries.setData(chartHistory);
    mainSeriesRef.current = mainSeries;
    chartRef.current = chart;

    const handleMouseDown = (param: any) => {
      if (analysisMode !== 'range' || !param.time || !param.point || !mainSeriesRef.current) return;
      isDraggingRef.current = true;
      const price = mainSeriesRef.current.coordinateToPrice(param.point.y);
      setSelection({
        start: param.time as number,
        end: param.time as number,
        startPrice: price || null,
        endPrice: price || null,
      });
    };

    const handleMouseMove = (param: any) => {
      if (analysisMode !== 'range' || !isDraggingRef.current || !param.time || !param.point || !mainSeriesRef.current) return;
      const price = mainSeriesRef.current.coordinateToPrice(param.point.y);
      setSelection(prev => ({
        ...prev,
        end: param.time as number,
        endPrice: price || null,
      }));
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    chart.subscribeClick(handleMouseDown);
    chart.subscribeCrosshairMove(handleMouseMove);

    const resizeObserver = new ResizeObserver(entries => {
      if (entries[0].contentRect && chartRef.current) {
        try {
          chartRef.current.applyOptions({ 
            width: entries[0].contentRect.width,
            height: entries[0].contentRect.height 
          });
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
      mainSeriesRef.current = null;
      if (currentChart) {
        try {
          currentChart.unsubscribeClick(handleMouseDown);
          currentChart.unsubscribeCrosshairMove(handleMouseMove);
          currentChart.remove();
        } catch (e) {
          console.debug("Chart disposal error:", e);
        }
      }
    };
  }, [currentSymbol, timeframe, chartHistory, analysisMode]);

  useEffect(() => {
    if (!mainSeriesRef.current || !selection.start) return;
    const markers: SeriesMarker<Time>[] = [];
    if (selection.start) {
      markers.push({
        time: selection.start as Time,
        position: 'aboveBar',
        color: '#3b82f6',
        shape: 'arrowDown',
        text: 'START',
      });
    }
    if (selection.end && selection.end !== selection.start) {
      markers.push({
        time: selection.end as Time,
        position: 'aboveBar',
        color: '#3b82f6',
        shape: 'arrowDown',
        text: 'END',
      });
    }
    if (mainSeriesRef.current) {
      (mainSeriesRef.current as any).setMarkers(markers);
    }
  }, [selection]);

  const selectionData = useMemo(() => {
    if (!selection.start || !selection.end || !selection.startPrice || !selection.endPrice) return null;
    const diff = selection.endPrice - selection.startPrice;
    const pct = (diff / selection.startPrice) * 100;
    return { diff, pct };
  }, [selection]);

  const handleTrade = (orderType: 'BUY' | 'SELL', isAuto: boolean = false, tp?: string, sl?: string) => {
    if (!currentPrice) {
      setFeedback({ type: 'error', message: 'Price Sync Required', detail: 'Market feed offline' });
      setTimeout(() => setFeedback(null), 2000);
      return;
    }
    const finalTp = tp !== undefined ? tp : takeProfit;
    const finalSl = sl !== undefined ? sl : stopLoss;

    if (!isAuto) {
      setPendingTrade({
        orderType,
        price: currentPrice,
        tp: finalTp,
        sl: finalSl,
        volume: lotSize,
        timeframe: timeframe
      });
      setIsConfirmModalOpen(true);
    } else {
      tradeMutation.mutate({ orderType, price: currentPrice, isAuto, tp: finalTp, sl: finalSl, volume: lotSize, tf: timeframe });
    }
  };

  const confirmTradeExecution = () => {
    if (!pendingTrade) return;
    tradeMutation.mutate({ 
      orderType: pendingTrade.orderType, 
      price: pendingTrade.price, 
      isAuto: false, 
      tp: pendingTrade.tp, 
      sl: pendingTrade.sl,
      volume: pendingTrade.volume,
      tf: pendingTrade.timeframe
    });
    setIsConfirmModalOpen(false);
    setPendingTrade(null);
  };

  const triggerAIAnalysis = async () => {
    if (!currentPrice || isAnalyzing || !chartHistory) return;
    setIsAnalyzing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const marketContext = chartHistory.slice(-120).map(c => ({
        t: c.time,
        o: c.open,
        h: c.high,
        l: c.low,
        c: c.close
      }));

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Act as a Senior Quantitative Analyst. Provide a trade signal for ${currentSymbol} at ${currentPrice} based on the ${timeframe} timeframe. History: ${JSON.stringify(marketContext)}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING, enum: ['BUY', 'SELL'] },
              tp: { type: Type.NUMBER },
              sl: { type: Type.NUMBER },
              confidence: { type: Type.NUMBER },
              reasoning: { type: Type.STRING },
              volatility_assessment: { type: Type.STRING },
              indicators: {
                type: Type.OBJECT,
                properties: {
                  rsi: { type: Type.NUMBER },
                  trend: { type: Type.STRING, enum: ['BULLISH', 'BEARISH', 'NEUTRAL'] },
                  volatility: { type: Type.STRING, enum: ['LOW', 'NORMAL', 'EXTREME'] }
                },
                required: ['rsi', 'trend', 'volatility']
              }
            },
            required: ['type', 'tp', 'sl', 'confidence', 'reasoning', 'volatility_assessment', 'indicators']
          }
        }
      });

      const aiResult = JSON.parse(response.text || '{}');
      
      const signal: TradeSignal = {
        symbol: currentSymbol,
        type: aiResult.type as 'BUY' | 'SELL',
        entry: currentPrice,
        tp: aiResult.tp,
        sl: aiResult.sl,
        confidence: aiResult.confidence,
        reasoning: aiResult.reasoning,
        volatilityContext: aiResult.volatility_assessment,
        indicators: aiResult.indicators,
        autoExecuted: false
      };

      if (autoTradeEnabled && signal.confidence > 94) {
        signal.autoExecuted = true;
        handleTrade(
          signal.type, 
          true, 
          signal.tp.toFixed(currentSymbol.includes('BTC') ? 2 : 5), 
          signal.sl.toFixed(currentSymbol.includes('BTC') ? 2 : 5)
        );
      }
      
      setActiveSignal(signal);
      setTimeout(() => setActiveSignal(null), 60000); 
    } catch (err) {
      console.error("Quant AI Analysis Error:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 overflow-hidden relative" onMouseLeave={() => isDraggingRef.current = false}>
      {feedback && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[60] animate-in fade-in slide-in-from-top-4 duration-300">
          <div className={`px-6 py-3 rounded-2xl flex items-center gap-4 border shadow-2xl backdrop-blur-md ${
            feedback.type === 'success' ? 'bg-emerald-600/90 border-emerald-400/50 text-white' : 'bg-rose-600/90 border-rose-400/50 text-white'
          }`}>
            <div className="p-1.5 bg-white/20 rounded-lg">
              {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-black uppercase tracking-widest leading-none">{feedback.message}</span>
              {feedback.detail && <span className="text-[9px] font-bold opacity-70 uppercase tracking-tighter mt-1">{feedback.detail}</span>}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="px-5 py-4 flex justify-between items-center border-b border-slate-800/50 glass z-30 shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center bg-slate-900 border border-slate-800 rounded-xl text-slate-400">
            <ArrowLeft size={20} />
          </button>
          <div className="flex flex-col">
            <h2 className="text-sm font-black text-white leading-none mb-1">{currentSymbol}</h2>
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{timeframe} INTERVAL</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xl font-black font-mono text-white tabular-nums tracking-tighter">
            {currentPrice?.toLocaleString(undefined, { minimumFractionDigits: currentSymbol.includes('BTC') ? 2 : 5 }) || '---'}
          </p>
        </div>
      </div>

      {/* Mode Controls */}
      <div className="flex items-center gap-2 px-5 py-2.5 border-b border-slate-800/30 bg-slate-900/20 z-20 shrink-0">
        <button 
          onClick={() => { setAnalysisMode('pan'); setSelection({ start: null, end: null, startPrice: null, endPrice: null }); }}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${analysisMode === 'pan' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-slate-900 text-slate-500'}`}
        >
          <Move size={12} /> Pan
        </button>
        <button 
          onClick={() => setAnalysisMode('range')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${analysisMode === 'range' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-slate-900 text-slate-500'}`}
        >
          <Crosshair size={12} /> Analysis
        </button>
        {selection.start && (
          <button 
            onClick={() => setSelection({ start: null, end: null, startPrice: null, endPrice: null })}
            className="ml-auto p-1.5 text-slate-500 hover:text-rose-500"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {/* Floating Signal HUD */}
      {activeSignal && (
        <div className="absolute top-24 left-5 right-5 z-50 animate-in slide-in-from-top-4 fade-in duration-500">
          <div className={`relative bg-slate-900/95 border rounded-[2rem] overflow-hidden shadow-2xl backdrop-blur-2xl flex flex-col border-blue-500/40`}>
            <div className="bg-blue-600 px-5 py-3 flex justify-between items-center relative z-10 shrink-0">
              <span className="text-[10px] font-black text-white uppercase tracking-[0.15em]">Neural Signal Engine [${timeframe}]</span>
              <div className="px-2.5 py-1 bg-white/20 rounded-full text-[9px] font-black text-white">{activeSignal.confidence.toFixed(1)}% Conviction</div>
            </div>
            <div className="p-6 space-y-4 relative z-10">
              <h4 className="text-3xl font-black text-white tracking-tighter">{activeSignal.symbol} {activeSignal.type}</h4>
              <p className="text-[11px] text-slate-200 font-semibold leading-relaxed">"{activeSignal.reasoning}"</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3">
                   <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Target</span>
                   <p className="text-sm font-black font-mono text-emerald-400">{activeSignal.tp.toFixed(5)}</p>
                </div>
                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3">
                   <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Protective</span>
                   <p className="text-sm font-black font-mono text-rose-400">{activeSignal.sl.toFixed(5)}</p>
                </div>
              </div>
              <button onClick={() => setActiveSignal(null)} className="w-full py-4 bg-slate-800 text-white rounded-xl uppercase font-black text-[10px]">Dismiss Signal</button>
            </div>
          </div>
        </div>
      )}

      {/* Chart Canvas */}
      <div className={`flex-1 relative bg-slate-950 z-10 overflow-hidden ${analysisMode === 'pan' ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair'}`} ref={chartContainerRef}>
        {selectionData && (
          <div className="absolute bottom-4 left-4 right-4 z-40 pointer-events-none">
            <div className="bg-slate-900/90 border border-blue-500/50 backdrop-blur-md rounded-2xl p-4 shadow-2xl flex items-center justify-between pointer-events-auto animate-in slide-in-from-bottom-2 duration-300">
               <div className="flex gap-6">
                 <div className="flex flex-col gap-1">
                   <span className="text-[8px] font-black text-slate-500 uppercase">Price Delta</span>
                   <span className={`text-sm font-black font-mono leading-none ${selectionData.diff >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                     {selectionData.diff >= 0 ? '+' : ''}{selectionData.diff.toFixed(5)}
                   </span>
                 </div>
                 <div className="flex flex-col gap-1">
                   <span className="text-[8px] font-black text-slate-500 uppercase">Percentage</span>
                   <span className={`text-sm font-black font-mono leading-none ${selectionData.pct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                     {selectionData.pct >= 0 ? '+' : ''}{selectionData.pct.toFixed(2)}%
                   </span>
                 </div>
               </div>
            </div>
          </div>
        )}
      </div>

      {/* Trade Controls */}
      <div className={`p-4 border-t border-slate-800/50 glass-dark shrink-0 pb-12 z-30`}>
        {/* Timeframe Matrix */}
        <div className="mb-4">
          <div className="flex items-center gap-2 px-1 mb-2">
            <Calendar size={12} className="text-blue-500" />
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Analysis Timeframe</span>
          </div>
          <div className="flex bg-slate-950/50 p-1 rounded-2xl border border-slate-800/30 gap-1 overflow-x-auto no-scrollbar">
            {TIMEFRAMES.map(tf => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`flex-1 min-w-[50px] py-2.5 rounded-xl text-[10px] font-black transition-all ${
                  timeframe === tf 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' 
                    : 'text-slate-600 hover:text-slate-400 hover:bg-slate-900'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* TP/SL Input Section */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 px-1">
              <Target size={10} className="text-emerald-500" />
              <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Take Profit</label>
            </div>
            <input 
              type="number" step="any"
              placeholder="0.00000"
              className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-3 px-4 text-xs font-black text-white outline-none focus:ring-1 focus:ring-emerald-500/50 placeholder:text-slate-800 transition-all"
              value={takeProfit}
              onChange={(e) => setTakeProfit(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 px-1">
              <ShieldAlert size={10} className="text-rose-500" />
              <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Stop Loss</label>
            </div>
            <input 
              type="number" step="any"
              placeholder="0.00000"
              className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-3 px-4 text-xs font-black text-white outline-none focus:ring-1 focus:ring-rose-500/50 placeholder:text-slate-800 transition-all"
              value={stopLoss}
              onChange={(e) => setStopLoss(e.target.value)}
            />
          </div>
        </div>

        {/* Current Order/Position Status Display */}
        {(symbolOngoingTrade || symbolPendingOrder) && (
          <div className="mb-4 animate-in slide-in-from-bottom-2 fade-in duration-300">
            <div className={`p-4 rounded-2xl border flex flex-col gap-3 backdrop-blur-md shadow-lg ${
              symbolOngoingTrade 
                ? 'bg-blue-600/5 border-blue-500/30' 
                : 'bg-amber-600/5 border-amber-500/30'
            }`}>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${symbolOngoingTrade ? 'bg-blue-500' : 'bg-amber-500'}`} />
                  <span className="text-[9px] font-black uppercase tracking-widest text-white">
                    {symbolOngoingTrade ? 'Active Position' : 'Pending Order'}
                  </span>
                </div>
                <button 
                  onClick={() => symbolOngoingTrade ? closePositionMutation.mutate(symbolOngoingTrade.ticket) : cancelOrderMutation.mutate(symbolPendingOrder!.ticket)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[9px] font-black uppercase transition-all shadow-md ${
                    symbolOngoingTrade 
                      ? 'bg-rose-600/20 text-rose-500 border border-rose-500/30 hover:bg-rose-600 hover:text-white' 
                      : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-rose-900 hover:text-white'
                  }`}
                >
                  <Ban size={10} /> {symbolOngoingTrade ? 'Liquidate' : 'Void Order'}
                </button>
              </div>

              <div className="grid grid-cols-4 gap-2">
                <div className="flex flex-col">
                  <span className="text-[7px] font-black text-slate-500 uppercase">Side</span>
                  <span className={`text-[10px] font-black ${
                    (symbolOngoingTrade?.type || symbolPendingOrder?.type).includes('BUY') ? 'text-emerald-500' : 'text-rose-500'
                  }`}>
                    {symbolOngoingTrade?.type || symbolPendingOrder?.type}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[7px] font-black text-slate-500 uppercase">Volume</span>
                  <span className="text-[10px] font-black text-white font-mono">
                    {symbolOngoingTrade?.volume || symbolPendingOrder?.volume} L
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[7px] font-black text-slate-500 uppercase">Entry</span>
                  <span className="text-[10px] font-black text-white font-mono">
                    {(symbolOngoingTrade?.open_price || symbolPendingOrder?.price)?.toFixed(5)}
                  </span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-[7px] font-black text-slate-500 uppercase">Unrealized</span>
                  <span className={`text-[10px] font-black font-mono ${
                    (symbolOngoingTrade?.profit || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {symbolOngoingTrade ? `${symbolOngoingTrade.profit >= 0 ? '+' : ''}${symbolOngoingTrade.profit.toFixed(2)}` : '---'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center mb-4 px-2">
          <button onClick={triggerAIAnalysis} disabled={isAnalyzing} className="flex items-center gap-2 group">
            {isAnalyzing ? <Loader2 size={12} className="text-blue-500 animate-spin" /> : <BrainCircuit size={12} className="text-blue-500" />}
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{isAnalyzing ? 'Processing...' : 'Deep Quant Analysis'}</span>
          </button>
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-900 border border-slate-800 rounded-full">
             <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{accountMode} • {lotSize.toFixed(2)} L</span>
          </div>
        </div>
        
        <div className="flex gap-4 mb-5">
          <button onClick={() => handleTrade('BUY')} disabled={tradeMutation.isPending} className="flex-1 h-16 rounded-[1.25rem] font-black bg-emerald-600 hover:bg-emerald-500 text-white flex flex-col items-center justify-center transition-all active:scale-[0.97] shadow-xl shadow-emerald-600/20">
            {tradeMutation.isPending ? <Loader2 className="animate-spin" size={20} /> : <><span className="text-sm uppercase tracking-tighter">BUY MARKET</span><span className="text-[9px] font-mono opacity-60">{currentPrice?.toFixed(5)}</span></>}
          </button>
          <button onClick={() => handleTrade('SELL')} disabled={tradeMutation.isPending} className="flex-1 h-16 rounded-[1.25rem] font-black bg-rose-600 hover:bg-rose-500 text-white flex flex-col items-center justify-center transition-all active:scale-[0.97] shadow-xl shadow-rose-600/20">
            {tradeMutation.isPending ? <Loader2 className="animate-spin" size={20} /> : <><span className="text-sm uppercase tracking-tighter">SELL MARKET</span><span className="text-[9px] font-mono opacity-60">{currentPrice?.toFixed(5)}</span></>}
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {SYMBOLS.map(sym => (
            <button key={sym} onClick={() => { setCurrentSymbol(sym); navigate(`/chart/${sym}`, { replace: true }); }} className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase transition-all border ${currentSymbol === sym ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-900 border-slate-800 text-slate-600'}`}>{sym}</button>
          ))}
        </div>
      </div>

      <TradeConfirmationModal 
        isOpen={isConfirmModalOpen && !!pendingTrade}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={confirmTradeExecution}
        symbol={currentSymbol}
        orderType={pendingTrade?.orderType || 'BUY'}
        price={pendingTrade?.price || 0}
        volume={pendingTrade?.volume || 0}
        tp={pendingTrade?.tp}
        sl={pendingTrade?.sl}
        accountMode={accountMode}
      />
    </div>
  );
};

export default ChartScreen;
