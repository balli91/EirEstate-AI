import { GoogleGenAI, Type } from "@google/genai";
import { PropertyInput, MarketInsight } from "../types";

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

// Helper to extract unique ID from Daft URL
const extractIdFromDaftUrl = (url: string): string => {
  try {
    // Matches /123456 at the end, or /123456? or /123456/
    const match = url.match(/\/(\d{6,10})[\/?]?$/) || url.match(/\/(\d{6,10})[\/?]/);
    return match ? match[1] : "";
  } catch (e) {
    return "";
  }
};

// Helper to extract address hint from Daft URL
const extractAddressFromDaftUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);
    const pathSegments = urlObj.pathname.split('/').filter(Boolean);
    
    // Daft URLs are typically /for-sale/property-type-address-slug/id
    // We want the address-slug part
    const slug = pathSegments.find(segment => 
      segment.includes('-') && !segment.match(/^\d+$/) && segment !== 'for-sale' && segment !== 'for-rent'
    );

    if (!slug) return "";

    // Common prefixes to strip for a cleaner address search.
    // ORDER MATTERS: Longer prefixes should be checked before shorter ones (e.g. 'semi-detached-house' before 'house')
    const prefixes = [
      'detached-house', 'semi-detached-house', 'terraced-house', 'end-of-terrace-house', 
      'townhouse', 'apartment', 'studio-apartment', 'duplex', 'bungalow', 'site', 'commercial',
      'house' // generic fallback
    ];

    let cleanSlug = slug;
    // Strip the ID from the end if it was caught in the slug (rare but possible with some formats)
    cleanSlug = cleanSlug.replace(/-?\d+$/, '');

    // Attempt to remove the property type prefix to isolate the address
    for (const prefix of prefixes) {
      if (cleanSlug.startsWith(prefix + '-')) {
        cleanSlug = cleanSlug.substring(prefix.length + 1);
        break; 
      }
    }

    // Convert hyphens to spaces and capitalize words
    return cleanSlug
      .replace(/-/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
      .trim();

  } catch (e) {
    return "";
  }
};

export const parsePropertyDescription = async (input: string): Promise<Partial<PropertyInput>> => {
  try {
    const ai = getAiClient();
    const cleanInput = input.trim();
    const isUrl = cleanInput.toLowerCase().startsWith('http') || cleanInput.toLowerCase().startsWith('www');

    if (isUrl) {
      if (!cleanInput.includes('daft.ie')) {
        throw new Error("Invalid URL. Only Daft.ie listings are supported.");
      }

      // 1. Intelligent URL Parsing
      const addressHint = extractAddressFromDaftUrl(cleanInput);
      const daftId = extractIdFromDaftUrl(cleanInput);
      
      const searchContext = `Address Hint: "${addressHint}"\nDaft ID: "${daftId}"`;

      // 2. Advanced Prompt with Search Grounding
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `You are a real estate data extraction expert for the Irish market.
        
        Task: Extract structured data for a property listing on Daft.ie.
        
        Input URL: ${cleanInput}
        ${searchContext}

        **Instructions:**
        1. Use Google Search to find this specific Daft.ie listing. 
        2. CRITICAL SEARCH STRATEGY: 
           - Search for 'site:daft.ie ${daftId}' (This ID is unique and is the best way to find the page).
           - Search for 'site:daft.ie "${addressHint}"'.
        3. Extract the details below from the search snippets or page content. 

        **Extraction Rules & Patterns:**
        - **Price**: Look for "€". Remove commas. If "Sale Agreed", the price might still be shown (e.g. "€249,000"). If "AMV", use that.
        - **Address**: The full postal address.
        - **Bedrooms**: Look for "Bed", "Beds". Return integer.
        - **Bathrooms**: Look for "Bath", "Baths". Return integer. (Note: "3 Bath" means 3 bathrooms).
        - **Floor Area**: Look for "m²" or "sq. m". (e.g. "110 m²"). If "sq. ft", convert to m² (divide by 10.764).
        - **Property Type**: Look for terms like "Semi-D", "Terraced", "Detached". 
          - MAPPING: "Semi-D" -> "Semi-Detached House". "Terrace" -> "Terraced House". "Apt" -> "Apartment".

        Return ONLY a JSON object with this schema:
        {
          "address": string,
          "price": number | null,
          "bedrooms": number | null,
          "bathrooms": number | null,
          "sqMeters": number | null,
          "propertyType": string,
          "monthlyRent": number | null,
          "description": string
        }
        
        For "monthlyRent", estimate conservatively if not a rental.
        For "description", provide a 1-sentence summary.
        `,
        config: {
          tools: [{ googleSearch: {} }]
        }
      });

      let jsonStr = response.text || "{}";
      // Clean up markdown if present
      jsonStr = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
      
      const firstBrace = jsonStr.indexOf('{');
      const lastBrace = jsonStr.lastIndexOf('}');
      
      if (firstBrace === -1 || lastBrace === -1) {
         throw new Error("Could not retrieve property data. The listing might be inactive.");
      }

      jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
      const result = JSON.parse(jsonStr);

      if (result.error) {
        throw new Error(result.error);
      }
      
      // Post-Processing & Fallbacks
      // Improve Property Type mapping if AI was vague
      const urlLower = cleanInput.toLowerCase();
      let finalType = result.propertyType || "House";
      
      // Normalize common variations
      if (finalType === "Semi-D") finalType = "Semi-Detached House";
      if (finalType === "Terrace") finalType = "Terraced House";
      if (finalType === "Apt") finalType = "Apartment";

      // Fallback to URL hints if AI returned "House" or generic but URL is specific
      if (finalType === "House") {
        if (urlLower.includes('apartment')) finalType = "Apartment";
        else if (urlLower.includes('semi-detached')) finalType = "Semi-Detached House";
        else if (urlLower.includes('terraced')) finalType = "Terraced House";
        else if (urlLower.includes('detached')) finalType = "Detached House";
        else if (urlLower.includes('bungalow')) finalType = "Bungalow";
      }

      return {
        address: result.address || addressHint || "", 
        price: typeof result.price === 'number' ? result.price : 0,
        bedrooms: typeof result.bedrooms === 'number' ? result.bedrooms : 0,
        bathrooms: typeof result.bathrooms === 'number' ? result.bathrooms : 1,
        sqMeters: typeof result.sqMeters === 'number' ? result.sqMeters : 0,
        propertyType: finalType,
        monthlyRent: typeof result.monthlyRent === 'number' ? result.monthlyRent : 0,
        propertyTaxYearly: 0, // Force calc in UI
        description: result.description || ""
      };

    } else {
      // Use Standard JSON Schema extraction for pasted text (fallback)
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Extract property details from the following real estate listing text. Return a JSON object.
        If a value is not found, leave null.
        Text: "${cleanInput}"`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              address: { type: Type.STRING },
              price: { type: Type.NUMBER, description: "Listing price in Euros. Treat commas as thousands separators (e.g. 895,000 = 895000)." },
              bedrooms: { type: Type.NUMBER },
              bathrooms: { type: Type.NUMBER },
              sqMeters: { type: Type.NUMBER },
              propertyType: { type: Type.STRING },
              monthlyRent: { type: Type.NUMBER },
              description: { type: Type.STRING }
            },
            required: ["address"],
          }
        }
      });

      const result = JSON.parse(response.text || "{}");
      return result;
    }

  } catch (error: any) {
    console.error("AI Parsing Error:", error);
    let msg = "Failed to import property details.";
    if (error.message.includes("404") || error.message.includes("not found")) {
      msg = "The property listing could not be found. Please check the URL.";
    } else if (error.message.includes("JSON")) {
      msg = "Could not read the property data. Please enter details manually.";
    }
    throw new Error(msg);
  }
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
