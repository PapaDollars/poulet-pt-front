import axios from 'axios'

// En local, Vite redirige /api vers le backend (voir vite.config.ts).
// En production, VITE_API_URL donne l'adresse du backend déployé, ex. https://mon-api.onrender.com/api
export const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' })

/** Message lisible à partir d'une erreur axios (message renvoyé par l'API si possible). */
export function messageErreur(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { error?: string } | undefined
    if (data?.error) return data.error
    if (!err.response) return 'Serveur injoignable : le backend est-il démarré ?'
  }
  return err instanceof Error ? err.message : 'Erreur inconnue'
}
