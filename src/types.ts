export type Categorie = 'aliment' | 'poussins' | 'medicament' | 'autre'

export interface Produit {
  id: string
  nom: string
  unite: string
  prix: number
  poidsKg: number
  phases: number[]
}

export interface CoutPoulet {
  date: string
  age: number
  coutPoussin: number
  coutAliment: number
  coutSoins: number
  coutUnitaire: number
  alimentKg: number
}

export interface PointEvolution {
  date: string
  age: number
  vivants: number
  morts: number
  coutUnitaire: number
}

export interface Bande {
  id: string
  nom: string
  dateArrivee: string
  nombreInitial: number
  prixUnitaire: number
  cloturee: boolean
  age: number
  morts: number
  vendus: number
  vivants: number
  tauxMortalite: number
  coutPoussins: number
  coutAliments: number
  coutSoins: number
  chargesTotales: number
  alimentKg: number
  alimentKgParPoulet: number
  coutRevientActuel: number
  detailCoutActuel: CoutPoulet
  valeurCheptel: number
  chiffreAffaires: number
  prixVenteMoyen: number
  coutPertes: number
  coutVendus: number
  margeVentes: number
  benefice: number
  evolution?: PointEvolution[]
}

export interface Achat {
  id: string
  date: string
  categorie: Categorie
  produitId?: string
  designation: string
  quantite: number
  unite: string
  quantiteKg?: number
  prixUnitaire: number
  montant: number
  bandeId?: string | null
  bandeNom?: string | null
}

export interface LigneMelange {
  produitId: string
  nom: string
  quantite: number
  unite: string
  prixUnitaire: number
  montant: number
  poidsKg: number
}

export interface Melange {
  id: string
  date: string
  bandeId: string
  bandeNom?: string | null
  phase: number
  lignes: LigneMelange[]
  poidsTotalKg: number
  montant: number
  avertissement?: string | null
}

export interface Vente {
  id: string
  date: string
  bandeId: string
  bandeNom?: string
  quantite: number
  prixUnitaire: number
  montant: number
  client: string
  age: number
  coutRevientUnitaire: number
  coutTotal: number
  marge: number
}

export interface Perte {
  id: string
  date: string
  bandeId: string
  bandeNom?: string
  nombre: number
  cause: string
  age: number
  coutUnitaire: number
  alimentKgUnitaire: number
  alimentKgTotal: number
  coutTotal: number
}

export interface LigneStock {
  produitId: string
  nom: string
  unite: string
  poidsKg: number
  entreeKg: number
  sortieKg: number
  stockKg: number
  stockUnites: number
  valeur: number
}

export interface Mois {
  mois: string
  aliment: number
  poussins: number
  medicament: number
  autre: number
  ventes: number
}

export interface TableauDeBord {
  bande: Bande | null
  global: { bandesActives: number; totalAchats: number; totalVentes: number; valeurStock: number }
  parMois: Mois[]
  stock: LigneStock[]
  alertesStock: LigneStock[]
}
