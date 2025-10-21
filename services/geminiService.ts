
import { GoogleGenAI, Type } from "@google/genai";
import { JournalEntry } from "../types";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("API_KEY environment variable not set. Using mock data.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

const analysisSchema = {
  type: Type.OBJECT,
  properties: {
    emotion: {
      type: Type.STRING,
      description: "A single, primary emotion describing the text (e.g., grateful, melancholic, hopeful).",
    },
    themes: {
      type: Type.ARRAY,
      items: {
        type: Type.STRING,
      },
      description: "An array of 2-3 key themes or topics present in the text (e.g., 'self-discovery', 'loneliness', 'healing').",
    },
  },
  required: ["emotion", "themes"],
};

export const analyzeEntry = async (entryText: string): Promise<{ emotion: string; themes: string[] }> => {
  if (!API_KEY) {
    // Return mock data if API key is not available
    console.log("Using mock analysis.");
    return Promise.resolve({ emotion: "Reflective", themes: ["Introspection", "Honesty"] });
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Analyze the following journal entry and extract the primary emotion and key themes. Entry: "${entryText}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
      },
    });

    const jsonText = response.text.trim();
    const data = JSON.parse(jsonText);
    return {
        emotion: data.emotion || 'Unknown',
        themes: data.themes || []
    };

  } catch (error) {
    console.error("Error analyzing entry with Gemini:", error);
    // Fallback to mock data on API error
    return { emotion: "Reflective", themes: ["Introspection"] };
  }
};
