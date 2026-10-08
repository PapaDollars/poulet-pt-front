// Poids d'un sac de maïs (en kg), mémorisé dans le navigateur : 100 kg par défaut
const CLE = 'poulet-pt.poidsSac'

export function lirePoidsSac() {
  try {
    return localStorage.getItem(CLE) ?? '100'
  } catch {
    return '100'
  }
}

export function memoriserPoidsSac(poids: string) {
  try {
    localStorage.setItem(CLE, poids)
  } catch {
    // stockage indisponible : le poids ne sera pas mémorisé
  }
}

/** Nombre de sacs équivalent à une quantité en kg (arrondi au dixième). */
export const enSacs = (quantite: number, poidsSac: number) => (poidsSac > 0 ? Math.round((quantite / poidsSac) * 10) / 10 : 0)
