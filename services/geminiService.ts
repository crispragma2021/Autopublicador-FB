
import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  // En un entorno real, esto debería manejarse de forma más elegante.
  // alert("La API Key de Gemini no está configurada.");
  console.warn("La API Key de Gemini no está configurada. Las funciones de IA no estarán disponibles.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export const generateText = async (prompt: string): Promise<string> => {
  if (!API_KEY) return "Función de IA no disponible. Configure la API Key.";
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Eres un experto en marketing para redes sociales. Crea un texto para una publicación de Facebook basado en esta idea: "${prompt}". El texto debe ser atractivo, conciso y con un claro llamado a la acción. Incluye algunos emojis relevantes.`,
    });
    return response.text;
  } catch (error) {
    console.error("Error generando texto:", error);
    throw new Error("No se pudo generar el texto.");
  }
};

export const generateImage = async (prompt: string): Promise<string> => {
  if (!API_KEY) return "https://picsum.photos/1080/1080"; // Placeholder
  try {
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: `Una imagen de alta calidad para una publicación en redes sociales sobre: ${prompt}. Estilo fotorealista, colores vibrantes, atractivo visualmente.`,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: '1:1',
        },
    });
    const base64ImageBytes = response.generatedImages[0].image.imageBytes;
    return `data:image/jpeg;base64,${base64ImageBytes}`;
  } catch (error) {
    console.error("Error generando imagen:", error);
    throw new Error("No se pudo generar la imagen.");
  }
};

export const generateVideo = async (prompt: string): Promise<{operationName: string}> => {
    if (!API_KEY) throw new Error("Función de IA no disponible.");
    try {
        let operation = await ai.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: `Un video corto y dinámico para redes sociales sobre: ${prompt}. Cinemático, atractivo y de alta calidad.`,
            config: {
              numberOfVideos: 1,
              resolution: '720p',
              aspectRatio: '9:16'
            }
        });
        return { operationName: operation.name };
    } catch (error) {
        console.error("Error iniciando generación de video:", error);
        throw new Error("No se pudo iniciar la generación del video.");
    }
};

export const checkVideoStatus = async (operationName: string): Promise<{done: boolean, url?: string}> => {
    if (!API_KEY) throw new Error("Función de IA no disponible.");
    try {
        let operation = await ai.operations.getVideosOperation({ name: operationName });
        if (operation.done) {
            const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
            if (!downloadLink) {
                throw new Error("La operación de video finalizó pero no se encontró el link de descarga.");
            }
            // El SDK no anexa la clave, pero la guía dice que debemos hacerlo.
            const fullUrl = `${downloadLink}&key=${API_KEY}`;
            const response = await fetch(fullUrl);
            if (!response.ok) {
              throw new Error(`Error al buscar el video: ${response.statusText}`);
            }
            const videoBlob = await response.blob();
            return { done: true, url: URL.createObjectURL(videoBlob) };
        }
        return { done: false };
    } catch (error) {
        console.error("Error verificando estado del video:", error);
        throw new Error("No se pudo verificar el estado del video.");
    }
};
