import { GoogleGenAI } from "@google/genai";
import { MarketInsight } from "../types";

// Simple in-memory cache for market analysis
const marketCache = new Map<string, MarketInsight>();

// Helper to get client safely
const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing. Please set process.env.API_KEY.");
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzeMarket = async (location: string, propertyType: string, price: number): Promise<MarketInsight> => {
  // Check cache first
  const cacheKey = `${location.toLowerCase().trim()}-${propertyType.toLowerCase()}-${price}`;
  if (marketCache.has(cacheKey)) {
    return marketCache.get(cacheKey)!;
  }

  try {
    const ai = getAiClient();
    // Using Search Grounding for real-time market data
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Analyze the residential rental market in ${location}, Ireland for a ${propertyType} around €${price}.
      
      Perform the following research and Provide ESTIMATES based on typical data for this area:
      1. Current estimated monthly rent range (low to high).
      2. Rental price trend over the last 3 years (estimate average rent for previous 3 years).
      3. Market Demand level (Low, Medium, High).
      4. Walkability Score (0-100).
      5. Safety/Crime Index (0-100, where 100 is very safe).
      6. Commute/Transit Score (0-100).
      7. Key pros and cons for investors.
      8. Brief investment outlook summary.

      Format your response as a valid JSON object string (do not use markdown formatting around it if possible, just the JSON).
      
      Expected JSON Structure:
      {
        "rentLow": number,
        "rentHigh": number,
        "rentHistory": [
           {"year": "2022", "price": number},
           {"year": "2023", "price": number},
           {"year": "2024", "price": number}
        ],
        "demand": "Low" | "Medium" | "High",
        "walkabilityScore": number,
        "safetyScore": number,
        "transitScore": number,
        "pros": ["string", "string"],
        "cons": ["string", "string"],
        "summary": "string"
      }`,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    let text = response.text || "{}";
    
    // Attempt to extract JSON from the text response
    let parsedData: any = {};
    try {
        // Clean up markdown if present
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const firstBrace = jsonStr.indexOf('{');
        const lastBrace = jsonStr.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
            const cleanJson = jsonStr.substring(firstBrace, lastBrace + 1);
            parsedData = JSON.parse(cleanJson);
        } else {
            // Fallback if no JSON found
             parsedData = { summary: text };
        }
    } catch (e) {
        console.log("Failed to parse market JSON", e);
        parsedData = { summary: text };
    }

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    const urls = (groundingChunks as any[])
      .map((c: any) => c.web?.uri)
      .filter((u: any): u is string => typeof u === "string");

    const result: MarketInsight = {
      summary: parsedData.summary || "No summary available.",
      rentRangeLow: parsedData.rentLow || 0,
      rentRangeHigh: parsedData.rentHigh || 0,
      rentHistory: parsedData.rentHistory || [],
      demandLevel: parsedData.demand || 'Medium',
      walkabilityScore: parsedData.walkabilityScore || 50,
      safetyScore: parsedData.safetyScore || 50,
      transitScore: parsedData.transitScore || 50,
      pros: parsedData.pros || [],
      cons: parsedData.cons || [],
      groundingUrls: [...new Set(urls)], // Dedupe
    };

    // Cache the result
    marketCache.set(cacheKey, result);
    return result;

  } catch (error) {
    console.error("Analysis Error:", error);
    return {
      summary: "Could not analyze market data at this time.",
      rentRangeLow: 0,
      rentRangeHigh: 0,
      rentHistory: [],
      demandLevel: 'Medium',
      walkabilityScore: 0,
      safetyScore: 0,
      transitScore: 0,
      groundingUrls: [],
      pros: [],
      cons: []
    };
  }
};