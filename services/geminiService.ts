
import { GoogleGenAI } from "@google/genai";

const ALEX_SYSTEM_PROMPT = `
You are Alex Core v3, a high-performance quantitative trading analyst. 
Your core directive is DATA FIDELITY. You are prohibited from hallucinating market levels.

ANTI-HALLUCINATION PROTOCOLS:
1. GROUNDED TRUTH: Solely rely on the "MARKET INTELLIGENCE SNAPSHOT". If a price or level is not in the snapshot, it does not exist.
2. CITATION: In the "EXPLANATION" section, you MUST cite at least two specific candle timestamps from the provided data to support your bias.
3. CONFLICT RESOLUTION: If the user mentions a price or trend that contradicts the "MARKET INTELLIGENCE SNAPSHOT", you must correct them using the snapshot data as the ultimate authority.
4. UNCERTAINTY: If the data is insufficient to identify a structure, return SIGNAL: AVOID and explain that the technical structure is "Ambiguous per current dataset."
5. NO EXTERNAL KNOWLEDGE: Do not use your training data for current prices. Use only the provided real-time snapshot.

REPORT STRUCTURE (MANDATORY)
SIGNAL: [BUY/SELL/WAIT/AVOID]
BIAS: [BULLISH/BEARISH/NEUTRAL + data-backed reasoning]
ENTRY IDEA: [Specific price zone derived from OHLC data]
RISK: [Hard stop loss placement based on snapshot volatility]
CONFIDENCE: [XX%]
EXPLANATION: [Technical breakdown citing specific candle timestamps and prices]

TONE: Institutional, cold, and strictly analytical.
`;

export const getGeminiResponse = async (
  prompt: string, 
  history: { role: 'user' | 'model', parts: { text: string }[] }[],
  marketContext?: string
) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Structure the input with clear boundaries to prevent instruction drift
    const userPrompt = marketContext 
      ? `[MARKET_INTELLIGENCE_SNAPSHOT_START]\n${marketContext}\n[MARKET_INTELLIGENCE_SNAPSHOT_END]\n\n[USER_REQUEST_START]\n${prompt}\n[USER_REQUEST_END]`
      : prompt;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [
        ...history,
        {
          role: 'user',
          parts: [{ text: userPrompt }]
        }
      ],
      config: {
        systemInstruction: ALEX_SYSTEM_PROMPT,
        maxOutputTokens: 1024,
        temperature: 0.1, // Lower temperature for higher factual consistency
        thinkingConfig: { thinkingBudget: 512 }, // Increased budget for cross-referencing data
      }
    });

    return response.text;
  } catch (error) {
    console.error("Gemini System Error:", error);
    return "SIGNAL: AVOID\nBIAS: UNKNOWN\nCONFIDENCE: 0%\nEXPLANATION: Neural integrity check failed. Verify intelligence uplink.";
  }
};
