import { useCallback, useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { api, messageErreur } from './api'

/** Charge une ressource de l'API et la recharge quand l'URL change. */
export function useCharger<T>(url: string | null) {
  const [donnees, setDonnees] = useState<T | null>(null)
  const [chargement, setChargement] = useState(true)

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
    } catch (err) {
      toast.error(messageErreur(err))
    } finally {
      setChargement(false)
    }
  }, [url])

  useEffect(() => {
    void recharger()
  }, [recharger])

  return { donnees, chargement, recharger }
}
