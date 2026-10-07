export type TypeAliment = 'demarrage' | 'croissance' | 'finition'

export interface Unite {
  id: string
  nom: string
}

export interface Produit {
  id: string
  nom: string
  unite: string
  prix: number
}

export interface LigneMelange {
  produitId: string | null
  nom: string
  unite: string
  quantite: number
  prixUnitaire: number
  montant: number
  depuisStock: boolean
}

export interface Formule {
  id: string
  nom: string
  type: TypeAliment
  nombreSacs: number
  lignes: LigneMelange[]
}

export interface Fabrication {
  id: string
  date: string
  formuleId: string | null
  nom: string
  type: TypeAliment
  nombreSacs: number
  repetitions: number
  lignes: LigneMelange[]
  montant: number
  prixSac: number
  montantTotal: number
  distribues: number
  restants: number
}

export interface Lot {
  fabricationId: string
  date: string
  nom: string
  type: TypeAliment
  prixSac: number
  total: number
  distribues: number
  restants: number
}

export interface StockSacs {
  type: TypeAliment
  restants: number
  valeur: number
  lots: Lot[]
}

export interface Distribution {
  id: string
  date: string
  bandeId: string
  bandeNom?: string | null
  fabricationId: string
  type: TypeAliment
  nombreSacs: number
  prixSac: number
  montant: number
}

export interface LigneStock {
  produitId: string
  nom: string
  unite: string
  prixReference: number
  quantite: number
  coutMoyen: number
  valeur: number
  entrees: number
  utiliseMelange: number
  vendu: number
  chiffreAffaires: number
  benefice: number
}

export interface MouvementStock {
  id: string
  date: string
  type: 'entree' | 'vente' | 'melange'
  quantite: number
  prixUnitaire?: number
  transport?: number
  montant?: number
  coutUnitaire?: number
  cout?: number
  benefice?: number
  client?: string
  fournisseur?: string
  libelle?: string
  fabricationId?: string
  stockApres: number
}

export interface HistoriqueProduit {
  produit: Produit
  quantite: number
  coutMoyen: number
  valeur: number
  lignes: MouvementStock[]
}

export interface Depense {
  id: string
  date: string
  bandeId: string
  designation: string
  quantite: number
  unite: string
  prixUnitaire: number
  montant: number
}

export interface CoutPoulet {
  date: string
  age: number
  coutPoussin: number
  coutAliment: number
  coutSoins: number
  coutUnitaire: number
  sacs: number
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
  sacsUnitaire: number
  sacsTotal: number
  coutTotal: number
}

export interface LigneAchat {
  id?: string
  designation: string
  typeAliment?: TypeAliment
  quantite: number
  unite: string
  prixUnitaire: number
  montant: number
  date: string
  source: 'poussins' | 'depense' | 'sacs'
}

export interface Bande {
  id: string
  nom: string
  dateArrivee: string
  nombreInitial: number
  prixUnitaire: number
  cloturee: boolean
  age: number
  duree: number
  premiereVente: string | null
  ageVente: number | null
  morts: number
  vendus: number
  vivants: number
  tauxMortalite: number
  coutPoussins: number
  coutAliments: number
  coutSoins: number
  chargesTotales: number
  sacsParType: Record<TypeAliment, number>
  sacsTotal: number
  sacsParPoulet: number
  coutRevientActuel: number
  detailCoutActuel: CoutPoulet
  valeurCheptel: number
  chiffreAffaires: number
  prixVenteMoyen: number
  coutPertes: number
  margeVentes: number
  benefice: number
  beneficeParPoulet: number
}

export interface BandeDetail extends Bande {
  evolution: { date: string; age: number; vivants: number; coutUnitaire: number }[]
  lignesAchats: LigneAchat[]
  ventes: Vente[]
  pertes: Perte[]
}

export interface Mois {
  mois: string
  ventesPoulets: number
  ventesStock: number
  depensesBandes: number
  achatsStock: number
}

export interface TableauDeBord {
  bandesEnCours: Bande[]
  bandes: Bande[]
  totaux: {
    ventesPoulets: number
    poulets: number
    vivants: number
    beneficeBandes: number
    ventesStock: number
    beneficeStock: number
    valeurStock: number
    valeurSacs: number
  }
  parMois: Mois[]
  stock: LigneStock[]
  sacs: StockSacs[]
  alertesStock: LigneStock[]
}
