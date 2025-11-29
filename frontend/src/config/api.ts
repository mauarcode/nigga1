// Configuración centralizada de URLs de la API
// Estas variables se configuran en .env.local (desarrollo) o .env.production (producción)

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://barberrock.es'
export const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://barberrock.es'

// Helper para construir URLs de la API
export const apiUrl = (path: string) => `${API_URL}${path.startsWith('/') ? path : `/${path}`}`

// Helper para construir URLs del frontend
export const frontendUrl = (path: string) => `${FRONTEND_URL}${path.startsWith('/') ? path : `/${path}`}`

// Helper para construir URLs de media (imágenes, etc.)
export const mediaUrl = (path: string | null | undefined) => {
  if (!path) return ''
  if (path.startsWith('http')) return path
  return `${API_URL}${path.startsWith('/') ? path : `/${path}`}`
}


