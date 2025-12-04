import { GoogleGenAI } from "@google/genai";
import { PropertyInput } from "../types";

// Helper to get client safely
const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing. Please set process.env.API_KEY.");
  }
  return new GoogleGenAI({ apiKey });
};

// Helper: Extract the unique ID from a Daft URL
export const extractIdFromDaftUrl = (url: string): string => {
  try {
    // Daft URLs typically end in the ID, e.g., .../5345678
    // Matches numbers at the very end, or before a query string
    const match = url.match(/\/(\d+)(\?|$)/);
    return match ? match[1] : '';
  } catch (e) {
    return '';
  }
};

// Helper: Extract a clean address string from the URL slug for better search context
export const extractAddressFromDaftUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);
    const pathSegments = urlObj.pathname.split('/').filter(p => p.length > 0);
    
    // Daft URL structure usually: /for-sale/property-type-address-slug/id
    const daftId = extractIdFromDaftUrl(url);
    
    // Find the segment that looks like the address (not 'for-sale', not the ID)
    const slug = pathSegments.find(s => s !== 'for-sale' && s !== daftId && (s.includes('-') || s.length > 5));

    if (!slug) return '';

    let cleanSlug = slug.toLowerCase();
    
    // List of prefixes to strip out to get to the "real" address
    const stripList = [
      'house-for-sale', 'apartment-for-sale', 'site-for-sale', 'new-home-for-sale',
      'detached-house', 'semi-detached-house', 'terraced-house', 
      'end-of-terrace-house', 'townhouse', 'apartment', 'studio', 'duplex', 
      'bungalow', 'site', 'house', 'for-sale'
    ];

    for (const prefix of stripList) {
        if (cleanSlug.startsWith(prefix + '-')) {
            cleanSlug = cleanSlug.substring(prefix.length + 1);
        }
    }

    // Convert hyphens to spaces
    return cleanSlug.replace(/-/g, ' ');
  } catch (e) {
    return '';
  }
};

export const parsePropertyDescription = async (url: string): Promise<Partial<PropertyInput>> => {
  try {
    const ai = getAiClient();
    const daftId = extractIdFromDaftUrl(url);
    const addressHint = extractAddressFromDaftUrl(url);
    
    // We construct a specific search query using the ID to find the exact indexed page
    const searchQuery = daftId ? `site:daft.ie ${daftId}` : `site:daft.ie ${addressHint}`;

    const prompt = `
      I need to extract structured data for a property listing on Daft.ie.
      
      Target URL: ${url}
      Internal ID: ${daftId}
      Address Hint: ${addressHint}

      Please search for this specific property listing on Daft.ie using the ID or address. 
      Do NOT invent data. If you cannot find a specific field, leave it null or 0.

      Extract the following details:
      1. Full Address (Address / Location)
      2. Asking Price (in Euros) - Clean numeric value
      3. Number of Bedrooms
      4. Number of Bathrooms
      5. Floor Area in Square Meters (Note: If given in sq ft, convert: 1 sq m = 10.764 sq ft)
      6. Property Type (e.g., House, Apartment, Semi-Detached, etc.)
      7. Short Description (max 200 chars summary of key features)

      Special Rules:
      - If the listing is "Sale Agreed", still extract the last known asking price.
      - "Semi-D" = "Semi-Detached House"
      - "Terrace" = "Terraced House"

      Format your response as a valid JSON object string. Do not use Markdown formatting blocks.
      
      JSON Schema:
      {
        "address": string,
        "price": number,
        "bedrooms": number,
        "bathrooms": number,
        "sqMeters": number,
        "propertyType": string,
        "description": string
      }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }]
        // responseMimeType: "application/json" is NOT supported with googleSearch
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    // Manually clean up Markdown if present (e.g., ```json ... ```)
    let jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    // Ensure we only parse the JSON object part
    const start = jsonStr.indexOf('{');
    const end = jsonStr.lastIndexOf('}');
    if (start !== -1 && end !== -1) {
        jsonStr = jsonStr.substring(start, end + 1);
    }

    let data;
    try {
        data = JSON.parse(jsonStr);
    } catch (e) {
        console.error("Failed to parse JSON response:", jsonStr);
        throw new Error("Failed to parse property data.");
    }

    return {
      address: data.address || "",
      price: data.price || "",
      bedrooms: data.bedrooms || "",
      bathrooms: data.bathrooms || "",
      sqMeters: data.sqMeters || "",
      propertyType: data.propertyType || "House",
      description: data.description || ""
    };

  } catch (error) {
    console.error("Smart Import Error:", error);
    throw new Error("Failed to extract property details. Please ensure the link is valid.");
  }
};