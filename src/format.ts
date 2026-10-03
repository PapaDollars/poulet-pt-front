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

export const PHASES: Record<number, string> = {
  1: 'Étape 1 — Démarrage',
  2: 'Étape 2 — Croissance',
  3: 'Étape 3 — Finition',
}

export const CATEGORIES: Record<string, string> = {
  aliment: 'Aliment',
  poussins: 'Poussins',
  medicament: 'Médicament',
  autre: 'Autre',
}
