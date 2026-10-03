import axios from 'axios'

// En local, Vite redirige /api vers le backend (voir vite.config.ts).
// En production, VITE_API_URL donne l'adresse du backend déployé, ex. https://mon-api.onrender.com/api
export const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' })

// Une réponse non JSON (page HTML…) signifie que l'API n'est pas joignable à cette adresse
api.interceptors.response.use((res) => {
  const type = String(res.headers['content-type'] ?? '')
  if (res.status !== 204 && !type.includes('application/json')) {
    return Promise.reject(new Error("API introuvable : vérifiez que le backend est déployé et que VITE_API_URL est configurée"))
  }
  return res
})

/** Message lisible à partir d'une erreur axios (message renvoyé par l'API si possible). */
export function messageErreur(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { error?: string } | undefined
    if (data?.error) return data.error
    if (!err.response) return 'Serveur injoignable : le backend est-il démarré ?'
    return `API indisponible (erreur ${err.response.status}) : vérifiez que le backend est démarré et que VITE_API_URL est correcte`
  }
  return err instanceof Error ? err.message : 'Erreur inconnue'
}
