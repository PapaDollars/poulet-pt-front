import axios from 'axios'

export const api = axios.create({ baseURL: '/api' })

/** Message lisible à partir d'une erreur axios (message renvoyé par l'API si possible). */
export function messageErreur(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { error?: string } | undefined
    if (data?.error) return data.error
    if (!err.response) return 'Serveur injoignable : le backend est-il démarré ?'
  }
  return err instanceof Error ? err.message : 'Erreur inconnue'
}
