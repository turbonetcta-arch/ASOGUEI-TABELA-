
import { GoogleGenAI } from "@google/genai";

// Função para garantir que a chave de API esteja selecionada
const ensureApiKey = async (): Promise<boolean> => {
  if (typeof window === 'undefined' || !window.aistudio) return true;
  
  const hasKey = await window.aistudio.hasSelectedApiKey();
  if (!hasKey) {
    await window.aistudio.openSelectKey();
    // Assume sucesso após abrir o diálogo conforme orientações
    return true;
  }
  return true;
};

export const geminiService = {
  async generateCatchyDescription(productName: string): Promise<string> {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Crie uma frase curta de marketing para vender ${productName} em um açougue. Máximo 50 caracteres. Seja persuasivo.`,
      });
      return response.text?.replace(/[#"]/g, '').trim() || "Qualidade superior em cada corte.";
    } catch (error) {
      console.error("Gemini Text Error:", error);
      return "O melhor sabor para sua mesa hoje.";
    }
  },

  async generateProductImage(productName: string): Promise<string | null> {
    try {
      // Mandatário para modelos pro-image
      await ensureApiKey();
      
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const prompt = `Professional food photography, raw ${productName} beef cut, close up, studio lighting, elegant presentation, realistic, 4k resolution, gourmet style.`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: {
          parts: [{ text: prompt }]
        },
        config: {
          imageConfig: {
            aspectRatio: "1:1",
            imageSize: "1K"
          }
        }
      });

      // Itera pelas partes para encontrar a imagem (inlineData)
      const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
      if (part?.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
      return null;
    } catch (error: any) {
      console.error("Gemini Image Error:", error);
      
      // Se a entidade não for encontrada (chave inválida/expirada), resetamos
      if (error.message?.includes("Requested entity was not found")) {
        if (window.aistudio) {
           await window.aistudio.openSelectKey();
        }
      }
      return null;
    }
  }
};
