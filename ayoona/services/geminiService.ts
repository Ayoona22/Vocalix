import { GoogleGenAI } from "@google/genai";

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("API_KEY not found in environment variables.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const generateVerificationText = async (userName: string): Promise<string> => {
  const ai = getAiClient();
  if (!ai) return "I certify that my voice is my unique identity and I authorize Vocalix to use this recording for verification purposes.";

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate a short, unique, and slightly whimsical 2-sentence paragraph for a user named "${userName}" to read aloud. This is for voice biometric verification. It should include some phonetically rich words. Do not use quotes.`,
    });
    return response.text || "I certify that my voice is my unique identity.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "I certify that my voice is my unique identity and I authorize Vocalix to use this recording for verification purposes.";
  }
};

export const personalizeMessage = async (originalText: string): Promise<string> => {
  const ai = getAiClient();
  if (!ai) return originalText;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Rewrite the following message to be more professional, polite, and engaging, while keeping the original meaning intact. Only return the rewritten text. Message: "${originalText}"`,
    });
    return response.text?.trim() || originalText;
  } catch (error) {
    console.error("Gemini Error:", error);
    return originalText;
  }
};
