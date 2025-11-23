import { GoogleGenAI } from '@google/genai';

// Usaremos la API Key directamente desde el entorno (o inyectada al frontend)
// Esto asume que tienes process.env.VITE_GEMINI_API_KEY o similar configurado
// NOTA: Si esta clave no está configurada como una Variable de Entorno de Cloudflare Pages (prefijo VITE_), esto fallará.
const API_KEY = process.env.VITE_GEMINI_API_KEY || 'WORKER_FAILED_USE_API_KEY';

if (API_KEY === 'WORKER_FAILED_USE_API_KEY' || !API_KEY) {
    console.error("ADVERTENCIA: API Key no inyectada en el Frontend. La IA no funcionará directamente.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export const generateIdea = async (prompt) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: `Genera una idea de publicación corta para redes sociales basada en: ${prompt}` }] }],
    });
    
    return { success: true, text: response.text };

  } catch (error) {
    console.error("Error al generar idea directamente con Gemini:", error);
    return { success: false, error: "Servicio IA no disponible (Error en llamada directa a la API)." };
  }
};

export const improveText = async (textToImprove) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: `Mejora y haz más profesional el siguiente texto para una publicación en redes sociales: "${textToImprove}"` }] }],
    });
    
    return { success: true, text: response.text };

  } catch (error) {
    console.error("Error al mejorar texto directamente con Gemini:", error);
    return { success: false, error: "Servicio IA no disponible (Error en llamada directa a la API)." };
  }
};

export const generateImage = async (prompt) => {
  console.warn("La generación de imágenes/video ha sido deshabilitada en el Frontend directo.");
  return { success: false, error: "Generación de imagen/video deshabilitada en modo directo." };
};
