
import type { Post, FacebookTarget } from '../types';
import { PostType } from '../types';

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
 * Obtiene las Páginas y Grupos reales conectados al usuario mediante Graph API.
 */
export const getConnectedTargets = async (): Promise<FacebookTarget[]> => {
    if (!window.FB) {
        throw new Error('La conexión con Meta no está disponible. Configura FACEBOOK_APP_ID e inicia sesión.');
    }

    return new Promise((resolve) => {
        // 1. Obtener Páginas (Accounts)
        window.FB.api('/me/accounts', { fields: 'name,id,access_token,picture{url}' }, (response: any) => {
            if (!response || response.error) {
                console.error("Error fetching pages:", response?.error);
                resolve([]);
                return;
            }

            const realPages: FacebookTarget[] = response.data.map((page: any) => ({
                id: page.id,
                name: page.name,
                type: 'PAGE',
                avatar: page.picture?.data?.url || `https://ui-avatars.com/api/?name=${encodeURIComponent(page.name)}&background=1877F2&color=fff`,
                accessToken: page.access_token // Guardamos el token para publicar después
            }));

            // Nota: La API de Grupos requiere revisión de app avanzada. 
            // Por ahora simulamos grupos o requeriría permisos 'groups_access_member_info'
            // Para este ejemplo, devolvemos las páginas reales + grupos simulados para UI
            resolve([...realPages]);
        });
    });
};

/**
 * Publica contenido real en Facebook utilizando la Graph API.
 */
export const postToFacebook = async (post: Post, targetIds: string[]): Promise<void> => {
    logFacebookEvent('Iniciando Publicación', { targetIds, post }, 'info');

    if (!window.FB) {
        throw new Error('La conexión con Meta no está disponible.');
    }

    // Necesitamos recuperar los targets completos para tener sus access_tokens
    // En una app real, esto vendría del estado o backend. 
    // Aquí haremos un fetch rápido para refrescar tokens o asumimos que el componente los pasa.
    // Para simplificar, asumimos que 'post' contiene la info necesaria o la buscamos de nuevo.
    
    // ESTRATEGIA: Iterar sobre los IDs seleccionados y publicar uno por uno.
    const targets = await getConnectedTargets(); 
    const selectedTargets = targets.filter(t => targetIds.includes(t.id));

    const promises = selectedTargets.map(target => {
        return new Promise<void>((resolve, reject) => {
            
            if (!target.accessToken) {
                reject(new Error(`La cuenta ${target.name} no tiene un token válido de Meta.`));
                return;
            }

            const apiPath = `/${target.id}/feed`;
            const method = 'post';
            const params: any = {
                message: post.text,
                access_token: target.accessToken
            };

            // Manejo de Imagen (Solo 1 por simplicidad en MVP, FB soporta álbumes con lógica compleja)
            if (post.media && post.media.length > 0) {
                const mediaItem = post.media[0];
                if (mediaItem.type === PostType.IMAGE) {
                    // Cambiamos endpoint a /photos
                    // Nota: Para URLs externas, usamos 'url'. Para subidas locales, se requiere FormData.
                    // Aquí asumimos URL pública (generada por IA)
                    params.url = mediaItem.url;
                    // params.caption = post.text; // En /photos el mensaje es 'caption' no 'message'
                    // Pero si usamos /feed con link, es diferente.
                    // Usaremos /photos para que salga la imagen grande.
                    
                    window.FB.api(`/${target.id}/photos`, 'post', {
                        url: mediaItem.url,
                        caption: post.text,
                        access_token: target.accessToken
                    }, (response: any) => {
                        if (!response || response.error) {
                            console.error(`Error publicando en ${target.name}:`, response?.error);
                            reject(response?.error);
                        } else {
                            console.log(`Publicado en ${target.name}. ID: ${response.id}`);
                            resolve();
                        }
                    });
                    return;
                }
            }

            // Solo Texto
            window.FB.api(apiPath, method, params, (response: any) => {
                if (!response || response.error) {
                    console.error(`Error publicando en ${target.name}:`, response?.error);
                    reject(response?.error);
                } else {
                    console.log(`Publicado en ${target.name}. ID: ${response.id}`);
                    resolve();
                }
            });
        });
    });

    await Promise.all(promises);
    logFacebookEvent('Proceso Finalizado', { count: promises.length }, 'success');
};
