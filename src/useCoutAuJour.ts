import { useEffect, useState } from 'react'
import { api } from './api'
import type { CoutPoulet } from './types'

/** Coût et consommation d'un poulet de la bande à une date, recalculés automatiquement. */
export function useCoutAuJour(bandeId: string | undefined, date: string, version: unknown) {
  const [cout, setCout] = useState<(CoutPoulet & { disponibles: number }) | null>(null)

  useEffect(() => {
    if (!bandeId || !date) return
    let annule = false
    api
      .get(`/bandes/${bandeId}/cout`, { params: { date } })
      .then((res) => !annule && setCout(res.data))
      .catch(() => !annule && setCout(null))
    return () => {
      annule = true
    }
  }, [bandeId, date, version])

  return cout
}
