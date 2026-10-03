import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { toast } from 'react-toastify'
import { api, messageErreur } from './api'
import type { Bande } from './types'

interface ContexteBande {
  bandes: Bande[]
  bande: Bande | null
  choisirBande: (id: string) => void
  rafraichirBandes: () => Promise<void>
}

const Contexte = createContext<ContexteBande | null>(null)
const CLE = 'poulet-pt.bande'

function lireChoix() {
  try {
    return localStorage.getItem(CLE)
  } catch {
    return null
  }
}

export function BandeProvider({ children }: { children: ReactNode }) {
  const [bandes, setBandes] = useState<Bande[]>([])
  const [bandeId, setBandeId] = useState<string | null>(lireChoix)

  const rafraichirBandes = useCallback(async () => {
    try {
      const res = await api.get<Bande[]>('/bandes')
      setBandes(Array.isArray(res.data) ? res.data : [])
    } catch (err) {
      toast.error(messageErreur(err), { toastId: 'erreur-chargement' })
    }
  }, [])

  useEffect(() => {
    void rafraichirBandes()
  }, [rafraichirBandes])

  const choisirBande = useCallback((id: string) => {
    setBandeId(id)
    try {
      localStorage.setItem(CLE, id)
    } catch {
      // stockage indisponible : le choix ne sera simplement pas mémorisé
    }
  }, [])

  // Sélection automatique : le choix mémorisé, sinon la bande en cours la plus récente
  const bande = useMemo(
    () => bandes.find((b) => b.id === bandeId) ?? bandes.find((b) => !b.cloturee) ?? bandes[0] ?? null,
    [bandes, bandeId],
  )

  const valeur = useMemo(() => ({ bandes, bande, choisirBande, rafraichirBandes }), [bandes, bande, choisirBande, rafraichirBandes])
  return <Contexte.Provider value={valeur}>{children}</Contexte.Provider>
}

// eslint-disable-next-line react/only-export-components
export function useBande() {
  const ctx = useContext(Contexte)
  if (!ctx) throw new Error('useBande doit être utilisé dans BandeProvider')
  return ctx
}
