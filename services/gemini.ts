
import { GoogleGenAI } from "@google/genai";

export const geminiService = {
  // Faz uma pergunta genérica para a IA
  async ask(prompt: string): Promise<string> {
    try {
      // Create a new instance right before use with process.env.API_KEY
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ parts: [{ text: prompt }] }],
      });
      return response.text || "Sem resposta.";
    } catch (e) {
      console.error("Erro na IA:", e);
      return "Erro na IA.";
    }
  },

  // Gera uma frase de marketing curta e impactante para o produto
  async generateCatchyDescription(productName: string): Promise<string> {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ parts: [{ text: `Crie uma frase de marketing muito curta (máx 45 caracteres) para vender ${productName} em um açougue. Retorne apenas o texto da frase em letras maiúsculas, sem aspas.` }] }],
      });
      return response.text?.trim().toUpperCase() || "QUALIDADE GARANTIDA!";
    } catch (e) {
      console.error("Erro na descrição IA:", e);
      return "QUALIDADE E PREÇO BAIXO!";
    }
  },

  // Gera uma imagem profissional do produto usando os modelos de imagem do Gemini
  async generateProductImage(productName: string, highQuality: boolean = false, aspectRatio: string = "1:1"): Promise<string | null> {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      // Seleciona o modelo baseado na qualidade desejada
      const model = highQuality ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';
      
      const response = await ai.models.generateContent({
        model: model,
        contents: {
          parts: [{ text: `High quality professional commercial photography of fresh ${productName} raw meat, appetizing, studio lighting, butcher shop background.` }]
        },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio as any,
          }
        }
      });

      // Itera pelas partes para encontrar os dados da imagem (inlineData)
      const candidates = response.candidates;
      if (candidates && candidates.length > 0) {
        for (const part of candidates[0].content.parts) {
          if (part.inlineData) {
            return `data:image/png;base64,${part.inlineData.data}`;
          }
        }
      }
      return null;
    } catch (e) {
      console.error("Erro na geração de imagem Gemini:", e);
      return null;
    }
  }
};
