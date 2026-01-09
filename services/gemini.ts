
import { GoogleGenAI } from "@google/genai";

const ensureApiKey = async (): Promise<string> => {
  if (typeof window !== 'undefined' && window.aistudio) {
    const hasKey = await window.aistudio.hasSelectedApiKey();
    if (!hasKey) {
      await window.aistudio.openSelectKey();
    }
  }
  // A chave é injetada automaticamente em process.env.API_KEY após o seletor
  return process.env.API_KEY || '';
};

export const geminiService = {
  async generateCatchyDescription(productName: string): Promise<string> {
    try {
      const apiKey = await ensureApiKey();
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

  async generateProductImage(prompt: string, highQuality: boolean = false): Promise<string | null> {
    const apiKey = await ensureApiKey();
    if (!apiKey) return null;

    const tryGenerate = async (modelName: string) => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const enhancedPrompt = prompt.length < 30 
        ? `Professional commercial food photography of ${prompt}. Fresh meat, high quality, dark slate background, cinematic lighting, appetizing, 4k, macro shot.`
        : prompt;

      // Configuração básica suportada por todos os modelos de imagem
      const config: any = {
        imageConfig: {
          aspectRatio: "1:1"
        }
      };

      // imageSize só é suportado pelo gemini-3-pro-image-preview
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

    try {
      // Tenta o modelo solicitado (Pro ou Flash)
      const targetModel = highQuality ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';
      let response = await tryGenerate(targetModel);

      const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
      if (part?.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
      return null;
    } catch (error: any) {
      console.error("Gemini Image Error:", error);

      // Se for erro de permissão (403), modelo não encontrado (404) ou erro de argumento (400)
      if (error.message?.includes("403") || error.message?.includes("404") || error.message?.includes("400")) {
        
        // Se tentou o Pro e deu erro, tenta o Flash como fallback
        if (highQuality) {
          try {
            console.log("Tentando fallback para gemini-2.5-flash-image...");
            const fallbackResponse = await tryGenerate('gemini-2.5-flash-image');
            const part = fallbackResponse.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
            if (part?.inlineData) {
              return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
          } catch (fallbackError) {
            console.error("Fallback também falhou:", fallbackError);
          }
        }

        // Se for erro de permissão persistente, solicita nova chave
        if (error.message?.includes("403") && window.aistudio) {
          alert("Sua chave de API não tem permissão para gerar imagens (erro 403). Certifique-se de selecionar uma chave de um projeto com faturamento (Billing) ativo.");
          await window.aistudio.openSelectKey();
        }
      }
      return null;
    }
  }
};
