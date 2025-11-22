// frontend-api.js: Adaptador para conectar React con Cloudflare Workers
const WORKER_URL = "https://autopublicador-backend.pages.dev"; // ¡URL REAL CONFIGURADA!

export const api = {
  /**
   * Generar contenido multimedia.
   * Maneja automáticamente la lógica de Prueba/Créditos/BYOK en el backend.
   */
  async generate(prompt, userId, type = 'image') {
    const response = await fetch(`${WORKER_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, userId, type })
    });
    if (response.status === 402) {
      throw new Error("PAYMENT_REQUIRED"); // Manejar en UI abriendo modal de pagos
    }

    if (!response.ok) throw new Error("Error en generación");
    return await response.json(); // Retorna { url: "...", mode: "TRIAL" }
  },

  /**
   * Guardar la clave API propia del usuario (BYOK)
   */
  async saveByokKey(userId, apiKey) {
    await fetch(`${WORKER_URL}/api/save-byok`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, apiKey })
    });
  },

  /**
   * Obtener enlace de pago para recargar créditos
   */
  async createCheckoutSession(userId, planId) {
    // Esto normalmente llamaría a otro endpoint del worker que crea la sesión de Stripe
    // y devuelve la URL de redirección.
    const response = await fetch(`${WORKER_URL}/api/create-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, planId })
      });
    const data = await response.json();
    window.location.href = data.checkoutUrl;
  }
};
