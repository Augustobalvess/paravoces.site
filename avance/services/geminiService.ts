import { GoogleGenAI } from "@google/genai";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

export const generateDailyInsight = async (niche: string, metrics: any) => {
  const ai = getClient();
  if (!ai) return "Adicione sua API Key para receber insights estratégicos diários.";

  try {
    const prompt = `
      Atue como um consultor de negócios sênior para uma clínica de ${niche}.
      
      Dados atuais:
      - Faturamento Mês: R$ ${metrics.revenue}
      - Novos Clientes: ${metrics.newPatients}
      - Top Serviço: ${metrics.topService}

      Gere um "Insight do Dia" curto, motivador e estratégico (máximo 2 frases) focado em como aumentar a retenção ou o ticket médio baseados nesses dados.
      Não use markdown complexo, apenas texto puro.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text;
  } catch (error: any) {
    // Handle Rate Limits gracefully
    if (error.status === 429 || error.code === 429 || error.message?.includes('429') || error.message?.includes('quota')) {
       console.warn("Gemini API Quota Exceeded (429). Using fallback insight.");
       return "Foque na experiência do paciente para aumentar a fidelização hoje.";
    }
    console.error("Gemini Error:", error);
    return "Foque na experiência do paciente para aumentar a fidelização hoje.";
  }
};

export const generateMarketingCaption = async (niche: string, serviceName: string) => {
    const ai = getClient();
    if (!ai) return "Configure a API Key para gerar legendas.";

    try {
      const prompt = `
        Crie uma legenda curta, envolvente e profissional para Instagram para promover o serviço "${serviceName}" de uma clínica de ${niche}.
        Inclua 3 hashtags relevantes. Use emojis moderadamente.
      `;
  
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
  
      return response.text;
    } catch (error: any) {
      if (error.status === 429 || error.code === 429 || error.message?.includes('429') || error.message?.includes('quota')) {
        console.warn("Gemini API Quota Exceeded (429). Using fallback caption.");
        return "Agende sua consulta hoje mesmo e cuide da sua saúde! #saude #bemestar";
      }
      console.error("Gemini Error:", error);
      return "Agende sua consulta hoje mesmo e cuide da sua saúde! #saude #bemestar";
    }
  };