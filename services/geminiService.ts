
import { GoogleGenAI } from "@google/genai";

// CONFIGURACIÓN DE MODELOS
// Usamos 'gemini-2.5-flash' porque tiene un Free Tier muy generoso (15 RPM, 1M TPM).
// Esto permite ofrecer el servicio "gratis" a los clientes sin que el dueño de la app incurra en costes altos.
const TEXT_MODEL = 'gemini-2.5-flash';
const VIDEO_MODEL = 'veo-3.1-fast-generate-preview'; 

export const generateText = async (prompt: string): Promise<string> => {
  try {
    // Se usa la API Key del entorno (Servidor) de forma transparente para el cliente.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response = await ai.models.generateContent({
      model: TEXT_MODEL,
      config: {
        temperature: 0.85, // Creatividad alta para redes sociales
        topP: 0.95,
        topK: 40,
      },
      contents: `Actúa como un experto Community Manager y Copywriter de clase mundial.
      Tu objetivo es crear un post viral para Facebook basado en: "${prompt}".
      
      Reglas de Oro para el contenido:
      1.  **Gancho (Hook):** La primera frase debe ser irresistible y detener el scroll.
      2.  **Cuerpo:** Aporta valor, entretiene o educa de forma concisa.
      3.  **Llamada a la Acción (CTA):** Termina OBLIGATORIAMENTE con una pregunta para generar comentarios.
      4.  **Formato:** Usa saltos de línea y emojis para facilitar la lectura.
      5.  **Hashtags:** Añade 3-5 hashtags relevantes al final.
      
      El tono debe ser humano, empático y energético.`,
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
    // Usamos la API pública de Pollinations que ofrece modelos Flux/SDXL gratis.
    // Esto garantiza que la generación de imágenes nunca tenga coste para ti ni tus clientes.
    
    const seed = Math.floor(Math.random() * 10000000);
    const safePrompt = encodeURIComponent(prompt + ", high quality, 8k, photorealistic, social media aesthetic");
    
    // Solicitamos una imagen 1:1 (cuadrada) optimizada para feed
    const url = `https://image.pollinations.ai/prompt/${safePrompt}?width=1080&height=1080&seed=${seed}&model=flux&nologo=true`;

    // Verificamos que la imagen sea accesible (fetch head)
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
        // Veo requiere autenticación real. Usamos la key del entorno.
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        let operation = await ai.models.generateVideos({
            model: VIDEO_MODEL,
            prompt: `Video profesional para redes sociales: ${prompt}. Estilo cinematográfico, alta resolución, iluminación perfecta, movimiento suave.`,
            config: {
              numberOfVideos: 1,
              resolution: '720p', // Resolución estándar para preview rápido
              aspectRatio: '9:16' // Formato vertical para Reels/TikTok/Facebook
            }
        });
        return { operationName: operation.name };
    } catch (error) {
        console.error("Error iniciando generación de video:", error);
        // Mensaje amigable para el usuario final
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
            
            // Importante: Para descargar el video de Veo, necesitamos adjuntar la key a la URL
            // Esto se hace en el backend/proxy normalmente, aquí lo hacemos directo.
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
