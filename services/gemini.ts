
import { GoogleGenAI } from "@google/genai";

const ensureApiKey = async (): Promise<string> => {
  // Apenas retorna a chave injetada pelo sistema. 
  // O controle de abertura do seletor agora é feito exclusivamente via UI no painel de configurações.
  return process.env.API_KEY || '';
};

export const geminiService = {
  async generateCatchyDescription(productName: string): Promise<string> {
    try {
      const apiKey = await ensureApiKey();
      if (!apiKey) throw new Error("API Key não configurada");
      
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Crie uma frase curta e impactante de marketing para vender ${productName} em um açougue. Máximo 40 caracteres. Use palavras como 'Suculento', 'Premium', 'Oferta'.`,
      });
      return response.text?.replace(/[#"]/g, '').trim() || "Qualidade superior em cada corte.";
    } catch (error: any) {
      console.error("Gemini Text Error:", error);
      return "O melhor sabor para sua mesa hoje.";
    }
  },

  async generateProductImage(
    prompt: string, 
    highQuality: boolean = false, 
    aspectRatio: "1:1" | "16:9" | "4:3" | "3:4" | "9:16" = "1:1"
  ): Promise<string | null> {
    try {
      const apiKey = await ensureApiKey();
      if (!apiKey) return null;

      const tryGenerate = async (modelName: string) => {
        const ai = new GoogleGenAI({ apiKey });
        const enhancedPrompt = prompt.length < 30 
          ? `Professional commercial food photography of ${prompt}. Fresh meat, high quality, dark slate background, cinematic lighting, appetizing, 4k, macro shot.`
          : prompt;

        const config: any = {
          imageConfig: {
            aspectRatio: aspectRatio
          }
        };

        if (modelName === 'gemini-3-pro-image-preview') {
          config.imageConfig.imageSize = "1K";
        }

        return await ai.models.generateContent({
          model: modelName,
          contents: {
            parts: [{ text: enhancedPrompt }]
          },
          config: config
        });
      };

      const targetModel = highQuality ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';
      let response = await tryGenerate(targetModel);

      const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
      if (part?.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
      return null;
    } catch (error: any) {
      console.error("Gemini Image Error:", error);
      return null;
    }
  }
};
