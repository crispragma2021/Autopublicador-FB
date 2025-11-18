
import type { Post } from '../types';

/**
 * Simula una llamada a la API de Facebook para publicar contenido.
 * Tarda entre 1 y 3 segundos en resolverse.
 * Tiene una pequeña posibilidad de fallar para simular errores de red/API.
 * @param post - El objeto Post a publicar.
 * @returns Una promesa que se resuelve si la publicación es exitosa o se rechaza si falla.
 */
export const postToFacebook = (post: Post): Promise<void> => {
  console.log("Publicando en Facebook (simulación):", post);
  
  return new Promise((resolve, reject) => {
    const delay = 1000 + Math.random() * 2000; // 1-3 segundos
    
    setTimeout(() => {
      // 10% de probabilidad de fallo
      if (Math.random() < 0.1) {
        console.error("Fallo simulado de la API de Facebook.");
        reject(new Error("Fallo simulado de la API de Facebook."));
      } else {
        console.log("Publicación en Facebook exitosa (simulación).");
        resolve();
      }
    }, delay);
  });
};
