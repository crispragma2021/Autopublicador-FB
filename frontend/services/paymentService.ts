const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

export const startCheckoutSession = async (userId: string, planId = 'pro') => {
  const response = await fetch(`${API_URL}/api/create-checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, planId }),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok || !data.checkoutUrl) {
    throw new Error(data.error || 'Stripe no está configurado en el Cloudflare Worker.')
  }

  window.location.assign(data.checkoutUrl)
}
