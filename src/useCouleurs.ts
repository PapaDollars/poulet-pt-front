import { useEffect, useState } from 'react'

const lire = () => {
  const s = getComputedStyle(document.documentElement)
  const v = (nom: string) => s.getPropertyValue(nom).trim()
  return { serie1: v('--serie-1'), serie2: v('--serie-2'), serie3: v('--serie-3'), grille: v('--grille'), texte: v('--texte-axe'), surface: v('--bs-body-bg') }
}

/** Couleurs des graphiques lues depuis les variables CSS (clair / sombre). */
export function useCouleurs() {
  const [couleurs, setCouleurs] = useState(lire)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const maj = () => setTimeout(() => setCouleurs(lire), 0)
    mq.addEventListener('change', maj)
    return () => mq.removeEventListener('change', maj)
  }, [])
  return couleurs
}

export const compact = (n: number) => new Intl.NumberFormat('fr-FR', { notation: 'compact', maximumFractionDigits: 1 }).format(n)

/** Props communes des axes et infobulles recharts. */
export function styleGraphique(c: ReturnType<typeof lire>) {
  return {
    axe: { stroke: c.grille, tick: { fill: c.texte, fontSize: 12 }, tickLine: false },
    infobulle: {
      contentStyle: { background: c.surface, border: `1px solid ${c.grille}`, borderRadius: 8, fontSize: 13 },
      labelStyle: { color: c.texte },
    },
  }
}
