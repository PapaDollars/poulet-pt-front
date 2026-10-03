import { useCallback, useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { api, messageErreur } from './api'

/** Charge une ressource de l'API et la recharge quand l'URL change. */
export function useCharger<T>(url: string | null) {
  const [donnees, setDonnees] = useState<T | null>(null)
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState<string | null>(null)

  const recharger = useCallback(async () => {
    if (!url) {
      setDonnees(null)
      setChargement(false)
      return
    }
    setChargement(true)
    try {
      const res = await api.get<T>(url)
      setDonnees(res.data)
      setErreur(null)
    } catch (err) {
      setErreur(messageErreur(err))
      toast.error(messageErreur(err), { toastId: 'erreur-chargement' })
    } finally {
      setChargement(false)
    }
  }, [url])

  useEffect(() => {
    void recharger()
  }, [recharger])

  return { donnees, chargement, erreur, recharger }
}
