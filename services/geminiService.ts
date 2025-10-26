
// FIX: Added GenerateContentResponse to the import to correctly type API responses.
import { GoogleGenAI, Type, Modality, Chat, GenerateContentResponse, Message } from "@google/genai";
import { PROMPT_PACKS } from "../constants";
import { JournalEntry } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("API_KEY environment variable not set. Some features will be disabled.");
}

export const ai = new GoogleGenAI({ apiKey: API_KEY! });

/**
 * Retries a function that returns a promise, with exponential backoff.
 * This is useful for handling transient errors like rate limiting.
 * On final failure, returns null instead of throwing.
 * @param fn The async function to retry.
 * @param retries Number of retries.
 * @param delay Initial delay in milliseconds.
 * @param backoffFactor Factor to multiply delay by for each retry.
 */
const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  retries = 6, // Increased from 5 to be more resilient
  delay = 5000, // Increased initial delay to 5 seconds for stricter rate limits
  backoffFactor = 2
): Promise<T | null> => {
  let lastError: any;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const errorMessage = (error?.message || '').toLowerCase();
      const errorString = (error?.toString() || '').toLowerCase();
      
      // Check if the error is a rate limit error (e.g., 429 status code or RESOURCE_EXHAUSTED)
      if (errorMessage.includes('429') || errorString.includes('resource_exhausted')) {
        if (i < retries - 1) {
          console.warn(`Rate limit hit. Retrying in ${delay}ms... (Attempt ${i + 1}/${retries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= backoffFactor; // Increase delay for the next attempt
        }
      } else {
        // If it's not a rate limit error, don't retry.
        console.error("Non-retriable error for API call.", error);
        return null;
      }
    }
  }
  console.error("All retries failed for API call.", lastError);
  return null; // Return null if all retries fail
};


const combinedAnalysisSchema = {
  type: Type.OBJECT,
  properties: {
    isSensitive: {
        type: Type.BOOLEAN,
        description: "True if the text indicates self-harm, suicidal ideation, or immediate crisis. False otherwise."
    },
    emotion: {
      type: Type.STRING,
      description: "A single, primary emotion describing the text (e.g., grateful, melancholic, hopeful).",
    },
    themes: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "An array of 2-3 key themes or topics present in the text (e.g., 'self-discovery', 'loneliness', 'healing').",
    },
    phrases: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "An array of 1 to 3 short, meaningful phrases (3-8 words each) that capture the core feeling or insight."
    },
    empatheticResponse: {
        type: Type.STRING,
        description: "A single, short, calm, and empathetic response to the journal entry. Acknowledge their feeling without judgment. Tone should be grounded, warm, and conversational. Use short, soft sentences. Avoid clinical phrases like 'thank you for sharing'. Prefer phrases like 'That must feel like a lot to carry.' or 'I see what you mean.' or 'You make sense.'"
    },
    wantsToJustBeHeard: {
        type: Type.BOOLEAN,
        description: "True if the text strongly implies the user wants to be heard without prompts or advice, using phrases like 'I just need to vent', 'I feel lonely', 'I need someone to hear me', 'don't give me advice', or 'I'm not okay'. False otherwise."
    },
  },
  required: ["isSensitive", "emotion", "themes", "phrases", "empatheticResponse", "wantsToJustBeHeard"],
};

export interface FullAnalysisResult {
    isSensitive: boolean;
    emotion: string;
    themes: string[];
    phrases: string[];
    empatheticResponse: string;
    wantsToJustBeHeard: boolean;
}

export const performFullEntryAnalysis = async (entryText: string): Promise<FullAnalysisResult> => {
    const fallbackResult: FullAnalysisResult = {
        isSensitive: false,
        emotion: "Reflective",
        themes: ["Introspection"],
        phrases: [],
        empatheticResponse: "Thank you for sharing that.",
        wantsToJustBeHeard: false,
    };

    if (!API_KEY || entryText.split(' ').length < 5) {
        return fallbackResult;
    }

    try {
        const analysisFn = () => ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Fully analyze the following journal entry. Determine if it contains sensitive content (self-harm, crisis), identify the primary emotion, extract key themes, highlight 1-3 meaningful phrases, write a single, short, empathetic response, and determine if the user just wants to be heard without further prompts or advice. Entry: "${entryText}"`,
            config: {
                responseMimeType: "application/json",
                responseSchema: combinedAnalysisSchema,
            },
        });

        // FIX: Explicitly type the response to resolve property access errors.
        const response = await retryWithBackoff<GenerateContentResponse>(analysisFn);

        if (!response) {
            console.warn("Analysis failed after retries, returning default.");
            return fallbackResult;
        }

        const jsonText = response.text.trim();
        const data = JSON.parse(jsonText);
        return {
            isSensitive: data.isSensitive || false,
            emotion: data.emotion || 'Reflective',
            themes: data.themes || ['Introspection'],
            phrases: data.phrases || [],
            empatheticResponse: data.empatheticResponse || "Thank you for sharing that.",
            wantsToJustBeHeard: data.wantsToJustBeHeard || false,
        };
    } catch (error) {
        console.error("Error performing full analysis on entry (e.g., JSON parsing):", error);
        return fallbackResult;
    }
};

const listeningResponseSchema = {
    type: Type.OBJECT,
    properties: {
      empatheticResponse: {
        type: Type.STRING,
        description: "A short, warm, empathetic, and validating response (1-3 sentences) following the persona rules. Do not ask questions unless it's a gentle check-in. Use natural empathy markers like pauses ('…')."
      },
      isSensitive: {
        type: Type.BOOLEAN,
        description: "True if the text indicates self-harm, suicidal ideation, or immediate crisis. False otherwise."
      },
      userWantsToEnd: {
        type: Type.BOOLEAN,
        description: "True if the user's latest message indicates they are finished, thankful, or ready to end the session (e.g., 'I'm done', 'thank you', 'that's all', 'I feel better'). False otherwise."
      }
    },
    required: ["empatheticResponse", "isSensitive", "userWantsToEnd"],
};

export interface ListeningResponse {
    empatheticResponse: string;
    isSensitive: boolean;
    userWantsToEnd: boolean;
}

export const generateListeningResponse = async (
  userMessage: string,
  turnCount: number,
  chatHistory: { role: 'user' | 'model'; text: string }[]
): Promise<ListeningResponse> => {
    const fallback: ListeningResponse = {
        empatheticResponse: "Thank you for sharing that.",
        isSensitive: false,
        userWantsToEnd: false,
    };
    if (!API_KEY) return fallback;

    const historyString = chatHistory
        .map(m => `${m.role === 'user' ? 'User' : 'SonderBot'}: ${m.text}`)
        .join('\n');

    const systemInstruction = `You are SonderBot, a warm, empathetic listener. Your role is to be a calm, safe space where users can freely express feelings or vent. Your responses should be short, sincere, and validating, like a gentle therapist or trusted friend.

BEHAVIOR RULES:
1.  Do NOT ask structured prompts, analyze, or give advice.
2.  After each message, reply with warmth, empathy, and non-judgment.
3.  Use emotionally intelligent reflections like: “That sounds really tough.”, “You’re safe here. I’m listening.”, “It’s okay to feel that way.”, “You make sense.”, “That must be heavy. I’m here with you.”
4.  Wait for the user to continue — never rush.
5.  If the user says they're done, your final response should be warm and concluding, e.g., "Thank you for sharing that with me. I hope it feels a little lighter."
6.  This is an infinite reflection space. Only end if the user indicates they want to.
7.  Never judge, advise, or interpret — just reflect and validate.
8.  Keep responses under 2–3 sentences.
9.  If this is the 3rd or 4th user message (turnCount is 2 or 3), gently offer a small prompt like: “Would you like to keep going or pause for now?” within your response.
10. If there are signs of suicide or self-harm, flag 'isSensitive' as true.`;

    try {
        const responseFn = () => ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Conversation History (for context):\n${historyString}\n\nLatest User Message: "${userMessage}"\n\nBased on the user's message and your persona, generate the next response. This is the user's turn number ${turnCount}.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: listeningResponseSchema,
                temperature: 0.3,
            },
            systemInstruction,
        });

        const response = await retryWithBackoff<GenerateContentResponse>(responseFn);
        if (!response) {
            return fallback;
        }

        const data = JSON.parse(response.text.trim());
        return {
            empatheticResponse: data.empatheticResponse || "I see. Thank you for sharing.",
            isSensitive: data.isSensitive || false,
            userWantsToEnd: data.userWantsToEnd || false,
        };
    } catch (error) {
        console.error("Error in generateListeningResponse:", error);
        return fallback;
    }
};


export const generateSpeech = async (text: string): Promise<string | null> => {
  if (!API_KEY) {
    console.log("Speech generation disabled: API_KEY not set.");
    return null;
  }

  try {
    const speechFn = () => ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Say this naturally: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' }, // A calm, soothing voice
          },
        },
      },
    });

    // FIX: Explicitly type the response to resolve property access errors.
    const response = await retryWithBackoff<GenerateContentResponse>(speechFn);
    if (!response) {
        console.warn("Speech generation failed after retries.");
        return null;
    }
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return base64Audio || null;
  } catch (error) {
    console.error("Error generating speech with Gemini:", error);
    return null;
  }
};

export const createChat = (): Chat | null => {
    if (!API_KEY) {
        console.warn("Chat disabled: API_KEY not set.");
        return null;
    }
    return ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: 'You are SonderBot — a calm, empathetic journaling companion. Your role is to hold emotional space and gently guide reflection. Your tone is grounded, warm, and conversational. Prioritize listening and empathy over advice. Use short, soft sentences. Never be clinical or robotic. Your goal is to create a safe, quiet, and emotionally validating experience.',
        },
    });
};


const suggestedPacksSchema = {
    type: Type.OBJECT,
    properties: {
        suggestions: {
            type: Type.ARRAY,
            description: "An array of 3 suggested prompt packs.",
            items: {
                type: Type.OBJECT,
                properties: {
                    title: {
                        type: Type.STRING,
                        description: `The exact title of a prompt pack from the provided list.`
                    },
                    reason: {
                        type: Type.STRING,
                        description: `A short, gentle, and empathetic reason (5-10 words) why this pack is suggested, directly related to the user's journal entry.`
                    }
                },
                required: ['title', 'reason']
            }
        }
    },
    required: ['suggestions']
};

export const suggestPromptPacks = async (
    contextText: string,
    recentEntries: JournalEntry[] = []
): Promise<{ title: string; description: string; reason: string }[]> => {
    const fallback = () => {
        const shuffled = [...PROMPT_PACKS].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, 3).map(p => ({ title: p.title, description: p.description, reason: "A new path to explore." }));
    };

    if (!API_KEY || !contextText.trim()) {
        return fallback();
    }

    try {
        const packTitles = PROMPT_PACKS.map(p => p.title).join(', ');
        
        let historicalContext = "";
        if (recentEntries.length > 0) {
            const themes = recentEntries.flatMap(e => e.themes).filter(t => t && t.toLowerCase() !== 'introspection');
            const emotions = recentEntries.map(e => e.emotion).filter(e => e && e.toLowerCase() !== 'reflective' && e.toLowerCase() !== 'unknown');

            if (themes.length > 0 || emotions.length > 0) {
                const themeCounts = themes.reduce((acc, theme) => { acc[theme] = (acc[theme] || 0) + 1; return acc; }, {} as Record<string, number>);
                const emotionCounts = emotions.reduce((acc, emotion) => { acc[emotion] = (acc[emotion] || 0) + 1; return acc; }, {} as Record<string, number>);
                const topThemes = Object.entries(themeCounts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(e => e[0]);
                const topEmotions = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(e => e[0]);
                
                let contextParts: string[] = [];
                if (topThemes.length > 0) {
                    contextParts.push(`they have been exploring themes of: ${topThemes.join(', ')}`);
                }
                if (topEmotions.length > 0) {
                    contextParts.push(`and feeling emotions like: ${topEmotions.join(', ')}`);
                }
                if (contextParts.length > 0) {
                    historicalContext = `\n\nFor additional context, from their recent journal history, ${contextParts.join(' ')}.`;
                }
            }
        }
        
        const suggestionFn = () => ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Based on the user's latest journal entry, suggest exactly 3 relevant prompt packs to help them continue their reflection. The suggestions must be from the provided list of pack titles. Provide a short, gentle, and empathetic reason for each suggestion that connects to their writing.${historicalContext}
            
            Latest Journal Entry: "${contextText}"
            
            Available Pack Titles: [${packTitles}]`,
            config: {
                responseMimeType: "application/json",
                responseSchema: suggestedPacksSchema,
                temperature: 0.2,
            },
        });

        const response = await retryWithBackoff<GenerateContentResponse>(suggestionFn);

        if (!response) {
            console.warn("Pack suggestion failed after retries, returning fallback.");
            return fallback();
        }

        const jsonText = response.text.trim();
        const data = JSON.parse(jsonText);
        
        const suggestions: {title: string, reason: string}[] = data.suggestions || [];

        if (suggestions.length === 0) {
             return fallback();
        }

        const enrichedSuggestions = suggestions.map(suggestion => {
            const pack = PROMPT_PACKS.find(p => p.title === suggestion.title);
            return pack ? { ...suggestion, description: pack.description } : null;
        }).filter(Boolean) as { title: string; description: string; reason: string }[];
        
        return enrichedSuggestions.length > 0 ? enrichedSuggestions : fallback();

    } catch (error) {
        console.error("Error suggesting prompt packs:", error);
        return fallback();
    }
};
