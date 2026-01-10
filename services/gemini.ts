
import { GoogleGenAI } from "@google/genai";

export const geminiService = {
  // Generate a catchy marketing phrase for a product
  async generateCatchyDescription(productName: string): Promise<string> {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ parts: [{ text: `Crie uma frase de marketing muito curta e impactante (máx 40 caracteres) para vender ${productName} em um açougue premium. Retorne apenas o texto da frase em LETRAS MAIÚSCULAS, sem aspas.` }] }],
      });
      return response.text?.trim().toUpperCase() || "QUALIDADE GARANTIDA E PREÇO JUSTO!";
    } catch (e) {
      console.error("Gemini Text Error:", e);
      return "QUALIDADE E SABOR NO SEU CHURRASCO!";
    }
  },

  // Generate a professional product image using Gemini models
  async generateProductImage(productName: string, highQuality: boolean = false, aspectRatio: "1:1" | "16:9" | "4:3" = "16:9"): Promise<string | null> {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      // Use pro image model if requested, else flash image
      const model = highQuality ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';
      
      const response = await ai.models.generateContent({
        model: model,
        contents: {
          parts: [{ text: `High-end commercial studio photography of fresh, raw ${productName} meat. Beautiful marbling, appetizing, dark professional background, dramatic studio lighting, 8k resolution, butcher shop presentation.` }]
        },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio,
          }
        }
      });

      // Extract image from response parts
      const candidate = response.candidates?.[0];
      if (candidate) {
        for (const part of candidate.content.parts) {
          if (part.inlineData) {
            return `data:image/png;base64,${part.inlineData.data}`;
          }
        }
      }
      return null;
    } catch (e) {
      console.error("Gemini Image Error:", e);
      return null;
    }
  }
};
