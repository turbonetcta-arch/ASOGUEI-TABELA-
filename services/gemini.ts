
import { GoogleGenAI } from "@google/genai";

export const geminiService = {
  // Gera uma frase de impacto para o corte de carne usando Gemini 3 Flash
  async generateCatchyDescription(productName: string): Promise<string> {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ parts: [{ text: `Crie um slogan de marketing premium para o corte de carne: ${productName}. Use no máximo 30 caracteres. Seja agressivo no desejo (ex: SUCULÊNCIA ABSOLUTA, O REI DO CHURRASCO). Retorne apenas o texto em MAIÚSCULAS.` }] }],
      });
      return response.text?.trim().toUpperCase() || "QUALIDADE PREMIUM PARA VOCÊ!";
    } catch (e: any) {
      console.error("Gemini Text Error:", e);
      if (e?.message?.includes("Requested entity was not found") && typeof window !== 'undefined' && (window as any).aistudio) {
        (window as any).aistudio.openSelectKey();
      }
      return "SABOR INIGUALÁVEL NO SEU PRATO!";
    }
  },

  // Gera imagens profissionais ultra-realistas de cortes de carne
  async generateProductImage(productName: string, highQuality: boolean = false, aspectRatio: "1:1" | "16:9" | "4:3" = "16:9"): Promise<string | null> {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      // Usamos gemini-2.5-flash-image para as artes de fundo de TV pela rapidez e qualidade de texturas
      const model = 'gemini-2.5-flash-image';
      
      const prompt = `Professional food photography of raw ${productName} meat. 
      Visual Style: Luxury butcher shop display. 
      Details: extremely juicy texture, deep vibrant red meat color, clean white fat marbling, macro detail. 
      Setting: dark elegant slate background, coarse rock salt crystals scattered, a sprig of rosemary. 
      Lighting: dramatic rim lighting, soft bokeh, cinematic atmosphere, 8k resolution, appetizing, masterwork quality.`;

      const response = await ai.models.generateContent({
        model: model,
        contents: {
          parts: [{ text: prompt }]
        },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio,
          }
        }
      });

      const candidate = response.candidates?.[0];
      if (candidate) {
        for (const part of candidate.content.parts) {
          if (part.inlineData) {
            return `data:image/png;base64,${part.inlineData.data}`;
          }
        }
      }
      return null;
    } catch (e: any) {
      console.error("Gemini Image Error:", e);
      if (e?.message?.includes("Requested entity was not found") && typeof window !== 'undefined' && (window as any).aistudio) {
        (window as any).aistudio.openSelectKey();
      }
      return null;
    }
  }
};
