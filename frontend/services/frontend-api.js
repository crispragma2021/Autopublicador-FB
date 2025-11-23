// frontend-api.js: Adaptador para conectar React con Cloudflare Workers
const WORKER_URL = "TU_URL_DEL_WORKER_REAL"; // ¡URL CORREGIDA!

export const api = {
  async generate(prompt, userId, type = 'image') {
    const response = await fetch(`${WORKER_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, userId, type })
    });
    if (response.status === 402) throw new Error("PAYMENT_REQUIRED"); 
    if (!response.ok) throw new Error("Error en generación"); 
    return await response.json(); 
  },
  async saveByokKey(userId, apiKey) {
    await fetch(`${WORKER_URL}/api/save-byok`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, apiKey })
    });
  },
  async createCheckoutSession(userId, planId) {
    const response = await fetch(`${WORKER_URL}/api/create-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, planId })
    });
    const data = await response.json();
    window.location.href = data.checkoutUrl;
  }
};
