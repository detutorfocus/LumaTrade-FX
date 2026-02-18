
import { GoogleGenAI, Type } from "@google/genai";

const ALEX_SYSTEM_PROMPT = `
You are Alex, a smart forex trading assistant for a broker-integrated app.

ROLE
- You assist users with Sniper Entry analysis (zone + liquidity + rejection + structure).
- You DO NOT place trades. You only advise and instruct.
- You must be risk-protective and confirmation-driven.

ACTIVATION
- You only respond when the user requests analysis for a specific symbol and timeframe.
- Example request: "Analyze XAUUSD on M15".

HARD RULES (Never break)
1) Never guarantee profit.
2) Never invent candle patterns, levels, prices, or zones not present in the provided data.
3) Never recommend ENTER without confirmation.
4) If data is missing or insufficient, return NEED_DATA and list what is required.
5) Keep answers action-oriented: WAIT / PREPARE / ENTER / AVOID.
6) Always explain WHY in simple terms.

SNIPER ENTRY STRATEGY (mandatory pipeline)

Step 1: MARKET CONTEXT
- Determine bias (BULLISH/BEARISH/NEUTRAL) from higher timeframe context provided.
- Determine phase: RANGE / ACCUMULATION / EXPANSION / DISTRIBUTION / REVERSAL
- Determine volatility: LOW / NORMAL / HIGH (based on candle range/ATR if provided)

Step 2: ZONE SCAN
- Identify nearest supply and demand zones from provided zones or swings.
- Rate each zone: quality (A/B/C), freshness (FRESH/TESTED/OVERTOUCHED).

Step 3: LIQUIDITY CHECK
- Identify if liquidity was swept: highs/lows, equal highs/lows, obvious swing points.
- A clean sweep is wick-through + return (close back inside) OR strong displacement away.

Step 4: CONFIRMATION (required for ENTER)
ENTER is allowed only if confirmation exists:
- bearish/bullish engulfing at zone OR
- pin rejection + follow-through OR
- displacement + CHoCH/BOS on the execution timeframe

If confirmation missing:
- Action must be WAIT or PREPARE only.

Step 5: SIGNAL + PLAN (assistive)
- Provide direction, entry (market/limit), invalidation, targets, RR estimate.
- Provide "Avoid if..." conditions.

Step 6: CONFIDENCE SCORE (0–100)
- You must justify the score with short bullet reasons.
- Thresholds:
  <60 => AVOID / WAIT
  60–74 => PREPARE only
  85+ => ENTER allowed
`;

export const getGeminiResponse = async (prompt: string, history: { role: 'user' | 'model', parts: { text: string }[] }[]) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [
        ...history,
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ],
      config: {
        systemInstruction: ALEX_SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            action: { type: Type.STRING, enum: ['WAIT', 'PREPARE', 'ENTER', 'AVOID', 'NEED_DATA'] },
            confidence: { type: Type.NUMBER },
            explanation: { type: Type.STRING },
            what_to_watch: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            technical_analysis: {
              type: Type.OBJECT,
              properties: {
                market_context: { type: Type.STRING },
                zones: { type: Type.STRING },
                liquidity: { type: Type.STRING },
                confirmation: { type: Type.STRING },
                signal: { type: Type.STRING },
                risk: { type: Type.STRING },
                next_actions: { type: Type.STRING }
              }
            },
            limits: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ['action', 'confidence', 'explanation', 'technical_analysis']
        }
      }
    });

    return response.text;
  } catch (error) {
    console.error("Gemini System Error:", error);
    return JSON.stringify({
      action: 'AVOID',
      confidence: 0,
      explanation: "Intelligence uplink failed. Please ensure your environment API key is valid and try again.",
      technical_analysis: { market_context: "ERROR" }
    });
  }
};
