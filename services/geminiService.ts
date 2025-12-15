import { GoogleGenAI } from "@google/genai";

const SYSTEM_INSTRUCTION = `
You are a high-energy, cyberpunk hype-man commentator for a rhythm motion game. 
Your output must be extremely short (max 10 words), encouraging, and use slang or "neon" aesthetic language.
React to the user's score. Be punchy. Use emojis.
Examples: "Laser sharp moves! ⚡️", "Neon legend rising! 🎸", "System overload! Amazing! 🔥"
`;

let client: GoogleGenAI | null = null;

const getClient = () => {
  if (!client && process.env.API_KEY) {
    client = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return client;
};

export const generateCommentary = async (score: number, combo: number): Promise<string> => {
  const ai = getClient();
  if (!ai) return "AI Offline";

  try {
    const prompt = `User Score: ${score}. Combo: ${combo}. Hype them up now!`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.9,
        maxOutputTokens: 20, // Keep it very short
      },
    });

    return response.text || "Keep moving! 🚀";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Nice moves! ✨"; // Fallback
  }
};
