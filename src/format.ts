const nombreFr = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 })

export const nombre = (n: number) => nombreFr.format(n)
export const fcfa = (n: number) => `${nombreFr.format(Math.round(n))} F`
export const kg = (n: number) => `${nombreFr.format(n)} kg`

export const dateFr = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })

export const moisFr = (cle: string) =>
  new Date(`${cle}-01T00:00:00`).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })

export function aujourdhui() {
  const d = new Date()
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}

export const TYPES_ALIMENT: Record<string, string> = {
  demarrage: 'Démarrage',
  croissance: 'Croissance',
  finition: 'Finition',
}

export const LISTE_TYPES = ['demarrage', 'croissance', 'finition'] as const
