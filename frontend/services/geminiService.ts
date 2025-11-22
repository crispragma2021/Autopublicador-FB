import { GoogleGenAI } from "@google/genai";

const BACKEND_URL = 'https://us-central1-mi-pwa-2302f.cloudfunctions.net';
const TEXT_MODEL = 'gemini-2.5-flash';
const VIDEO_MODEL = 'veo-3.1-fast-generate-preview'; 

export const generateText = async (prompt: string, tone: string = 'Profesional'): Promise<string> => {
  try {
    const response = await fetch(`${BACKEND_URL}/optimizeAdText`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            prompt, 
            tone,
            userId: localStorage.getItem('fb_user_id') 
        })
    });

    if (response.ok) {
        const data = await response.json();
        if (data.result) {
            return data.result;
        }
    }
    throw new Error("Fallback to local");
  } catch (serverError) {
    console.log("⚠️ Usando generación local (Cliente):", serverError);
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const toneInstructions: Record<string, string> = {
            'Profesional': 'Usa un lenguaje de autoridad.',
            'Divertido': 'Usa humor inteligente.',
            'Urgente': 'Usa frases cortas e impactantes.',
            'Empático': 'Usa un lenguaje cálido.',
            'Lujo': 'Usa vocabulario sofisticado.',
            'Inspirador': 'Usa lenguaje edificante.'
        };
        const specificToneInstruction = toneInstructions[tone] || toneInstructions['Profesional'];
        
        const response = await ai.models.generateContent({
        model: TEXT_MODEL,
        config: { temperature: 0.85, topP: 0.95, topK: 40 },
        contents: `Actúa como Community Manager. Crea un post sobre: "${prompt}". ESTILO: ${tone}. ${specificToneInstruction}`,
        });
        return response.text || "Error generando texto.";
    } catch (localError) {
        console.error("Error crítico:", localError);
        throw new Error("Servicio IA no disponible.");
    }
  }
};

export const generateImage = async (prompt: string): Promise<string> => {
  try {
    const seed = Math.floor(Math.random() * 10000000);
    const safePrompt = encodeURIComponent(prompt + ", high quality");
    const url = `https://image.pollinations.ai/prompt/${safePrompt}?width=1080&height=1080&seed=${seed}&model=flux&nologo=true`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Error imagen");
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    throw new Error("No se pudo generar imagen.");
  }
};

export const generateVideo = async (prompt: string): Promise<{operationName: string}> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        let operation = await ai.models.generateVideos({
            model: VIDEO_MODEL,
            prompt: `Video profesional: ${prompt}`,
            config: { numberOfVideos: 1, resolution: '720p', aspectRatio: '9:16' }
        });
        return { operationName: operation.name };
    } catch (error) {
        throw new Error("Servicio video ocupado.");
    }
};

export const checkVideoStatus = async (operationName: string): Promise<{done: boolean, url?: string}> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        // @ts-ignore
        let operation = await ai.operations.getVideosOperation({ name: operationName });
        
        if (operation.done) {
            const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
            if (!downloadLink) return { done: true };
            const fullUrl = `${downloadLink}&key=${process.env.API_KEY}`;
            const response = await fetch(fullUrl);
            const videoBlob = await response.blob();
            return { done: true, url: URL.createObjectURL(videoBlob) };
        }
        return { done: false };
    } catch (error) {
        return { done: false };
    }
};
