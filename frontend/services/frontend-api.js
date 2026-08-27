// frontend-api.js: Adaptador para conectar React con Cloudflare Workers
const WORKER_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

const request = async (path, options = {}) => {
  const response = await fetch(`${WORKER_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Error en ${path}`);
  return data;
};

export const api = {
  /**
   * Generar contenido multimedia.
   */
  async generate(prompt, userId, type = 'image') {
    return request('/api/generate-content', {
      method: 'POST',
      body: JSON.stringify({ topic: prompt, userId, type }),
    });
  },

  /**
   * Guardar la clave API propia del usuario (BYOK)
   */
  async saveByokKey(userId, apiKey) {
    return request('/api/save-byok', {
      method: 'POST',
      body: JSON.stringify({ userId, apiKey }),
    });
  },

  /**
   * Obtener enlace de pago para recargar créditos
   */
  async createCheckoutSession(userId, planId) {
    const data = await request('/api/create-checkout', {
      method: 'POST',
      body: JSON.stringify({ userId, planId }),
    });
    if (!data.checkoutUrl) throw new Error('El checkout no está configurado en el Worker');
    window.location.href = data.checkoutUrl;
  }
};
