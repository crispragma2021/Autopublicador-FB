
import { GoogleGenAI } from "@google/genai";

// CONFIGURACIÓN DE MODELOS
const TEXT_MODEL = 'gemini-2.5-flash';
const VIDEO_MODEL = 'veo-3.1-fast-generate-preview'; 

export const generateText = async (prompt: string, tone: string = 'Profesional'): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // Mapa de instrucciones específicas por tono para dar más matices
    const toneInstructions: Record<string, string> = {
        'Profesional': 'Usa un lenguaje de autoridad, confianza y vocabulario experto pero accesible. Estructura limpia. Evita la jerga excesiva.',
        'Divertido': 'Usa humor inteligente, ironía suave, emojis alegres y un lenguaje muy casual y cercano. Haz que sea entretenido de leer.',
        'Urgente': 'Usa frases cortas e impactantes. Genera sentido de escasez (FOMO) y necesidad inmediata. Verbos de acción potentes.',
        'Empático': 'Usa un lenguaje cálido, comprensivo y validador. Enfócate en las emociones, el apoyo y la conexión humana.',
        'Lujo': 'Usa un vocabulario sofisticado, exclusivo y elegante. Evoca sensaciones premium, aspiracionales y de alta calidad.',
        'Inspirador': 'Usa un lenguaje edificante, visionario y lleno de esperanza. Enfócate en el crecimiento, la superación y la energía positiva.'
    };

    const specificToneInstruction = toneInstructions[tone] || toneInstructions['Profesional'];
    
    const response = await ai.models.generateContent({
      model: TEXT_MODEL,
      config: {
        temperature: 0.85,
        topP: 0.95,
        topK: 40,
      },
      contents: `Actúa como un experto Community Manager y Copywriter de clase mundial especializado en viralidad.
      Tu objetivo es crear un post para Facebook de alto impacto basado en la idea: "${prompt}".
      
      ### DIRECTRICES DE ESTILO (TONO: ${tone.toUpperCase()})
      ${specificToneInstruction}

      ### ESTRUCTURA OBLIGATORIA:
      1.  **El Gancho (Hook):** La primera frase debe ser irresistible, corta y detener el scroll. (No uses "¡Hola a todos!" o saludos genéricos).
      2.  **El Cuerpo:** Aporta valor, entretiene o educa de forma concisa. Usa párrafos cortos.
      3.  **EL CIERRE (CRÍTICO):** Tu última frase o párrafo DEBE ser una **PREGUNTA ABIERTA ESPECÍFICA** relacionada con el tema.
          *   ❌ MAL: "Comenta abajo qué piensas." / "¿Y tú?"
          *   ✅ BIEN: "¿Cuál ha sido tu mayor reto al trabajar desde casa esta semana?" / "¿Prefieres playa o montaña para desconectar?"
          *   *Objetivo:* Obligar psicológicamente al lector a dejar un comentario.

      4.  **Formato:** Usa saltos de línea y emojis estratégicos (no abuses) para facilitar la lectura.
      5.  **Hashtags:** Añade 3-5 hashtags relevantes al final.
      `,
    });
    return response.text || "No se pudo generar texto. Por favor intenta de nuevo.";
  } catch (error) {
    console.error("Error generando texto con Gemini:", error);
    throw new Error("El servicio de IA está temporalmente saturado. Intenta en unos segundos.");
  }
};

export const generateImage = async (prompt: string): Promise<string> => {
  try {
    // SERVICIO GRATUITO E ILIMITADO (NO USA API KEY DE GOOGLE)
    const seed = Math.floor(Math.random() * 10000000);
    const safePrompt = encodeURIComponent(prompt + ", high quality, 8k, photorealistic, social media aesthetic");
    
    const url = `https://image.pollinations.ai/prompt/${safePrompt}?width=1080&height=1080&seed=${seed}&model=flux&nologo=true`;

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error("El servidor de imágenes no respondió correctamente.");
    }
    
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });

  } catch (error) {
    console.error("Error generando imagen gratuita:", error);
    throw new Error("No se pudo generar la imagen. Intenta con otra descripción.");
  }
};

export const generateVideo = async (prompt: string): Promise<{operationName: string}> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        let operation = await ai.models.generateVideos({
            model: VIDEO_MODEL,
            prompt: `Video profesional para redes sociales: ${prompt}. Estilo cinematográfico, alta resolución, iluminación perfecta, movimiento suave.`,
            config: {
              numberOfVideos: 1,
              resolution: '720p',
              aspectRatio: '9:16'
            }
        });
        return { operationName: operation.name };
    } catch (error) {
        console.error("Error iniciando generación de video:", error);
        throw new Error("El servidor de video está ocupado o requiere configuración de plan Premium.");
    }
};

export const checkVideoStatus = async (operationName: string): Promise<{done: boolean, url?: string}> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        let operation = await ai.operations.getVideosOperation({ operation: operationName });
        
        if (operation.done) {
            const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
            if (!downloadLink) {
                throw new Error("Video generado sin enlace de descarga.");
            }
            const fullUrl = `${downloadLink}&key=${process.env.API_KEY}`;
            
            const response = await fetch(fullUrl);
            if (!response.ok) {
              throw new Error(`Error descargando el video final.`);
            }
            const videoBlob = await response.blob();
            return { done: true, url: URL.createObjectURL(videoBlob) };
        }
        return { done: false };
    } catch (error) {
        console.error("Error verificando estado del video:", error);
        throw new Error("Hubo un problema procesando tu video.");
    }
};
