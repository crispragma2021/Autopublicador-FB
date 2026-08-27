const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

const callWorker = async (path: string, body: Record<string, unknown>) => {
  const response = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error || 'El servicio IA no está disponible')
  return data
}

export const generateText = async (prompt: string, tone = 'professional'): Promise<string> => {
  const data = await callWorker('/api/generate-content', { topic: prompt, platform: 'facebook', tone })
  return data.generatedContent
}

export const generateIdea = async (prompt: string) => {
  try {
    return { success: true, text: await generateText(prompt) }
  } catch (error) {
    console.error('Error generando idea en Worker:', error)
    return { success: false, error: 'Servicio IA no disponible.' }
  }
}

export const improveText = async (textToImprove: string) => {
  try {
    const data = await callWorker('/api/improve-text', { textToImprove, style: 'professional' })
    return { success: true, text: data.improvedText }
  } catch (error) {
    console.error('Error mejorando texto en Worker:', error)
    return { success: false, error: 'Servicio IA no disponible.' }
  }
}

export const generateImage = async (): Promise<string> => {
  throw new Error('La generación de imágenes todavía no está implementada en el Worker.')
}

export const generateVideo = async (): Promise<{ operationName: string }> => {
  throw new Error('La generación de video todavía no está implementada en el Worker.')
}

export const checkVideoStatus = async (): Promise<{ done: boolean; url?: string }> => ({ done: false })
