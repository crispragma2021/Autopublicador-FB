
import type { Post, FacebookTarget } from '../types';

/**
 * Función auxiliar para logs formateados
 */
const logFacebookEvent = (action: string, details: any, type: 'info' | 'error' | 'success' = 'info') => {
    const timestamp = new Date().toISOString();
    const styles = {
        info: 'color: #60a5fa; font-weight: bold;', // blue
        error: 'color: #f87171; font-weight: bold;', // red
        success: 'color: #4ade80; font-weight: bold;', // green
    };
    
    console.groupCollapsed(`%c[Facebook API] ${action} @ ${timestamp}`, styles[type]);
    console.log('Payload/Details:', details);
    console.groupEnd();
};

/**
 * Simula la obtención de Páginas y Grupos conectados al usuario.
 * DATOS REALISTAS PARA SIMULAR META BUSINESS SUITE
 */
export const getConnectedTargets = async (): Promise<FacebookTarget[]> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve([
                // PÁGINAS (Activos Comerciales)
                { id: 'page_main', name: 'Mi Marca Oficial', type: 'PAGE', avatar: 'https://picsum.photos/seed/brand/100/100' },
                { id: 'page_sec', name: 'Soporte al Cliente', type: 'PAGE', avatar: 'https://picsum.photos/seed/support/100/100' },
                
                // GRUPOS (Comunidades)
                { id: 'g_1', name: 'Vecinos Unidos de la Ciudad', type: 'GROUP', avatar: 'https://picsum.photos/seed/neighbor/100/100' },
                { id: 'g_2', name: 'Compra y Venta (Sin Reglas)', type: 'GROUP', avatar: 'https://picsum.photos/seed/sales1/100/100' },
                { id: 'g_3', name: 'Mercado Libre Local', type: 'GROUP', avatar: 'https://picsum.photos/seed/sales2/100/100' },
                { id: 'g_4', name: 'Fanáticos de la Tecnología', type: 'GROUP', avatar: 'https://picsum.photos/seed/tech/100/100' },
                { id: 'g_5', name: 'Bolsa de Empleo 2024', type: 'GROUP', avatar: 'https://picsum.photos/seed/jobs/100/100' },
                { id: 'g_6', name: 'Emprendedores Digitales', type: 'GROUP', avatar: 'https://picsum.photos/seed/biz/100/100' },
                { id: 'g_7', name: 'Meme Posting', type: 'GROUP', avatar: 'https://picsum.photos/seed/meme/100/100' },
                { id: 'g_8', name: 'Noticias al Minuto', type: 'GROUP', avatar: 'https://picsum.photos/seed/news/100/100' },
                { id: 'g_9', name: 'Club de Lectura', type: 'GROUP', avatar: 'https://picsum.photos/seed/read/100/100' },
                { id: 'g_10', name: 'Gamers PC & Console', type: 'GROUP', avatar: 'https://picsum.photos/seed/game/100/100' },
                { id: 'g_11', name: 'Recetas Caseras', type: 'GROUP', avatar: 'https://picsum.photos/seed/food/100/100' },
                { id: 'g_12', name: 'Ventas de Garage Fin de Semana', type: 'GROUP', avatar: 'https://picsum.photos/seed/garage/100/100' },
            ]);
        }, 800); // Simular un poco más de carga
    });
};

/**
 * Simula una llamada a la API de Facebook para publicar contenido.
 */
export const postToFacebook = (post: Post, targetIds: string[]): Promise<void> => {
  logFacebookEvent('Iniciando Publicación Multi-Destino', { 
      postSize: post.text.length, 
      hasMedia: !!post.media,
      targets: targetIds 
  }, 'info');
  
  return new Promise((resolve, reject) => {
    const delay = 1000 + Math.random() * 2000; // 1-3 segundos
    
    setTimeout(() => {
      // 10% de probabilidad de fallo
      if (Math.random() < 0.1) {
        const errorMsg = "Fallo simulado de conexión con Graph API (Error 500)";
        logFacebookEvent('Error en Publicación', { error: errorMsg }, 'error');
        console.error("Facebook Service Error:", errorMsg);
        reject(new Error(errorMsg));
      } else {
        const postId = `fb_post_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        logFacebookEvent('Publicación Exitosa', { postId, status: 'published', targetsCount: targetIds.length }, 'success');
        resolve();
      }
    }, delay);
  });
};
