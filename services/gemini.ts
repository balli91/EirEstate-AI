
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

export const parsePropertyDescription = async (input: string): Promise<Partial<PropertyInput>> => {
  try {
    const ai = getAiClient();
    const isUrl = input.trim().toLowerCase().startsWith('http') || input.trim().toLowerCase().startsWith('www');

    if (isUrl) {
      if (!input.includes('daft.ie')) {
        throw new Error("Invalid URL. Only Daft.ie listings are supported.");
      }

      // Use Search Grounding for URLs to find listing details
      // Note: responseSchema/MimeType is NOT supported with Search tools, so we ask for raw JSON text.
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `I will provide a URL to a property listing on Daft.ie.
        Search for the property listing at this URL and extract the details.
        
        URL: ${input}

        If you cannot find the exact page content via the URL directly, search specifically for the **address** visible in the URL to find the listing details.

        **Daft.ie Extraction Rules:**
        - Address: Extract the full property address.
        - Price: Locate the div with attribute 'data-testid="price"'. Inside this div, find the <h2> element. Extract the exact text content (e.g. "€895,000"). You MUST remove the '€' symbol and ALL commas. Treat commas strictly as thousands separators (not decimals). Example: "€895,000" becomes 895000. Do NOT round, truncate, or return zero. If the element is missing or POA, return null.
        
        **Property Specs (Critical):**
        - Look for the main property info bar which typically contains Beds, Baths, Area, and Type in that order.
        - Beds: Look for text like "3 Bed" or "4 Bed". (Corresponds to data-testid="beds")
        - Baths: Look for text like "1 Bath" or "3 Bath". (Corresponds to data-testid="baths")
        - Area: Look for text like "108 m²" or "125 sq. m". (Corresponds to data-testid="floor-area")
        - Type: Look for text like "Semi-D", "Terraced", "Detached", "Apartment". (Corresponds to data-testid="property-type")
        
        **Property Type Mapping:**
        - If type is "Semi-D", map to "Semi-Detached House"
        - If type is "Terraced", map to "Terraced House"
        - If type is "End of Terrace", map to "End of Terrace House"
        - If type is "Bungalow", map to "Bungalow"

        Return a JSON object with these exact keys:
        - address (string)
        - price (number, integer only)
        - bedrooms (number, or null if not found)
        - bathrooms (number, or null if not found)
        - sqMeters (number, or null if not found)
        - propertyType (string, or null if not found)
        - monthlyRent (number, estimate based on location/size if not explicit)
        - propertyTaxYearly (number, estimated LPT)
        - description (string, brief summary)

        **Important:**
        - If a specific count (like beds/baths) is not visibly listed, return null for that field. Do NOT guess.
        - If the listing is sold, extract the sold price and details. Do NOT return an error.
        - Only return a JSON with an "error" key if the URL is strictly invalid (404) or the page content is totally inaccessible.
        
        Return ONLY the JSON string. Do not use markdown formatting.`,
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
         throw new Error("Could not parse property data from the link provided.");
      }

      jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
      const result = JSON.parse(jsonStr);

      if (result.error) {
        throw new Error(result.error);
      }
      
      // Apply sensible defaults if the AI returns null for specific fields
      // This prevents the calculator from breaking on missing data
      return {
        address: result.address || "",
        price: typeof result.price === 'number' ? result.price : 0,
        bedrooms: typeof result.bedrooms === 'number' ? result.bedrooms : 1, // Default to 1 bed
        bathrooms: typeof result.bathrooms === 'number' ? result.bathrooms : 1, // Default to 1 bath
        sqMeters: typeof result.sqMeters === 'number' ? result.sqMeters : 0,
        propertyType: result.propertyType || "House",
        monthlyRent: typeof result.monthlyRent === 'number' ? result.monthlyRent : 0,
        propertyTaxYearly: typeof result.propertyTaxYearly === 'number' ? result.propertyTaxYearly : 500,
        description: result.description || ""
      };

    } else {
      // Use Standard JSON Schema extraction for pasted text
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Extract property details from the following real estate listing text. Return a JSON object.
        If a value is not found, estimate it conservatively based on standard Irish market rates or leave null.
        Text: "${input}"`,
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
              monthlyRent: { type: Type.NUMBER, description: "Estimated monthly rent if not specified, infer from location/size" },
              propertyTaxYearly: { type: Type.NUMBER, description: "Local Property Tax estimate" },
              description: { type: Type.STRING }
            },
            required: ["address", "price"],
          }
        }
      });

      const result = JSON.parse(response.text || "{}");
      return result;
    }

  } catch (error: any) {
    console.error("AI Parsing Error:", error);
    // Propagate specific error messages
    if (error.message && (error.message.includes("parse") || error.message.includes("listing") || error.message.includes("expired") || error.message.includes("Daft"))) {
      throw error;
    }
    throw new Error("Failed to process the request. Please check the link or input text.");
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
