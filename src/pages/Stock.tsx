import { faArrowDown, faSackDollar } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import Carte from '../composants/Carte'
import { dateFr, fcfa, nombre } from '../format'
import { enSacs, lirePoidsSac } from '../poidsSac'
import type { HistoriqueProduit, LigneStock, MouvementStock } from '../types'
import { useCharger } from '../useCharger'
import EntreeStockModal from './EntreeStockModal'
import ModifierMouvementModal from './ModifierMouvementModal'
import VenteStockModal from './VenteStockModal'

const LIBELLES = { entree: 'Entrée', vente: 'Vente', melange: 'Mélange' }

/** Stock du maïs (seul produit stocké et revendu) : entrées, ventes au sac, historique. */
export default function Stock() {
  const stock = useCharger<LigneStock[]>('/stock')
  const [fenetre, setFenetre] = useState<'entree' | 'vente' | null>(null)
  // Incrémenté après chaque opération pour recharger les historiques
  const [version, setVersion] = useState(0)

  const produits = stock.donnees ?? []
  const nom = produits.length === 1 ? produits[0].nom.toLowerCase() : null
  // Équivalent en sacs, avec le poids d'un sac utilisé lors des entrées et ventes (100 kg par défaut)
  const poidsSac = Number(lirePoidsSac()) || 0

  function recharger() {
    void stock.recharger()
    setVersion((v) => v + 1)
  }

  return (
    <>
      <div className="d-flex flex-wrap align-items-center gap-2 mb-4">
        <h1 className="titre-page mb-0">Stock</h1>
        <div className="ms-auto d-flex gap-2">
          <button className="btn btn-primary" onClick={() => setFenetre('entree')} disabled={!produits.length}>
            <FontAwesomeIcon icon={faArrowDown} /> Entrée {nom ? `de ${nom}` : 'en stock'}
          </button>
          <button className="btn btn-success" onClick={() => setFenetre('vente')} disabled={!produits.length}>
            <FontAwesomeIcon icon={faSackDollar} /> Vendre {nom ? `du ${nom}` : 'du stock'}
          </button>
        </div>
      </div>

      {fenetre === 'entree' && <EntreeStockModal produits={produits} fermer={() => setFenetre(null)} apresEntree={recharger} />}
      {fenetre === 'vente' && <VenteStockModal produits={produits} fermer={() => setFenetre(null)} apresVente={recharger} />}

      {!stock.chargement && !produits.length && (
        <div className="alert alert-info">
          Aucun produit géré en stock. Cochez « En stock » pour le maïs dans <Link to="/parametres">Paramètres</Link>.
        </div>
      )}

      {produits.map((p) => (
        <section key={p.produitId} className="mb-5">
          {produits.length > 1 && <h2 className="h5 mb-3">{p.nom}</h2>}
          <div className="row g-3 mb-4">
            <div className="col-6 col-xl-3">
              <Carte
                titre="En stock"
                valeur={
                  <>
                    {nombre(enSacs(p.quantite, poidsSac))} sacs <span className="fs-6 fw-normal text-body-secondary">({nombre(p.quantite)} {p.unite})</span>
                  </>
                }
                ton={p.quantite <= 0 && p.entrees > 0 ? 'negatif' : undefined}
                detail={`${nombre(enSacs(p.entrees, poidsSac))} entrés · ${nombre(enSacs(p.utiliseMelange, poidsSac))} mélangés · ${nombre(enSacs(p.vendu, poidsSac))} vendus (sacs)`}
              />
            </div>
            <div className="col-6 col-xl-3">
              <Carte titre="Valeur du stock" valeur={fcfa(p.valeur)} detail={p.coutMoyen ? `${fcfa(p.coutMoyen * poidsSac)} / sac (${fcfa(p.coutMoyen)} / ${p.unite}), achat + transport` : '—'} />
            </div>
            <div className="col-6 col-xl-3">
              <Carte titre="Ventes" valeur={fcfa(p.chiffreAffaires)} />
            </div>
            <div className="col-6 col-xl-3">
              <Carte titre="Bénéfice sur ventes" valeur={fcfa(p.benefice)} ton={p.benefice >= 0 ? 'positif' : 'negatif'} detail="Le maïs mélangé ne rapporte rien (bénéfice 0)" />
            </div>
          </div>
          <Historique produitId={p.produitId} unite={p.unite} poidsSac={poidsSac} version={version} recharger={recharger} />
        </section>
      ))}
    </>
  )
}

/** Historique d'un produit : entrées, sorties vers les mélanges, ventes avec bénéfice. */
function Historique({
  produitId,
  unite,
  poidsSac,
  version,
  recharger,
}: {
  produitId: string
  unite: string
  poidsSac: number
  version: number
  recharger: () => void
}) {
  const { donnees } = useCharger<HistoriqueProduit>(`/stock/${produitId}/historique?v=${version}`)
  const lignes = donnees?.lignes ?? []
  const [aModifier, setAModifier] = useState<MouvementStock | null>(null)

  return (
    <div className="card">
      <div className="card-body pb-0">
        <h2 className="titre-graphique">Historique</h2>
      </div>
      <div className="table-responsive">
        <table className="table table-hover align-middle mb-0">
          <thead>
            <tr>
              <th>Date</th>
              <th>Mouvement</th>
              <th className="text-end">Quantité</th>
              <th className="text-end">Prix</th>
              <th className="text-end">Montant</th>
              <th className="text-end">Bénéfice</th>
              <th className="text-end">Stock après</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {lignes.map((m) => (
              <tr key={m.id}>
                <td>{dateFr(m.date)}</td>
                <td>
                  <span className={`badge ${m.type === 'entree' ? 'text-bg-success' : m.type === 'vente' ? 'text-bg-primary' : 'text-bg-secondary'}`}>
                    {LIBELLES[m.type]}
                  </span>{' '}
                  {m.type === 'melange' ? m.libelle : m.client || m.fournisseur || ''}
                </td>
                <td className="text-end">
                  {m.type === 'entree' ? '+' : '−'}
                  {nombre(m.nombreSacs ?? enSacs(m.quantite, poidsSac))} sacs{' '}
                  <span className="text-body-secondary small">
                    ({nombre(m.quantite)} {unite})
                  </span>
                </td>
                <td className="text-end">
                  {m.type === 'entree'
                    ? `${m.prixSac != null ? `${fcfa(m.prixSac)} / sac` : fcfa(m.prixUnitaire ?? 0)}${m.transport ? ` + ${fcfa(m.transport)} transp.` : ''}`
                    : m.type === 'vente'
                      ? m.prixSac != null
                        ? `${fcfa(m.prixSac)} / sac`
                        : fcfa(m.prixUnitaire ?? 0)
                      : `coût ${fcfa(m.coutUnitaire ?? 0)}`}
                </td>
                <td className="text-end">{fcfa(m.montant ?? m.cout ?? 0)}</td>
                <td className={`text-end ${(m.benefice ?? 0) > 0 ? 'texte-positif' : (m.benefice ?? 0) < 0 ? 'texte-negatif' : ''}`}>
                  {m.type === 'entree' ? '' : fcfa(m.benefice ?? 0)}
                </td>
                <td className="text-end">
                  <strong>{nombre(enSacs(m.stockApres, poidsSac))} sacs</strong>{' '}
                  <span className="text-body-secondary small">({nombre(m.stockApres)} {unite})</span>
                </td>
                <td className="text-end">
                  {/* Les sorties vers un mélange se corrigent dans Fabrications */}
                  {m.type !== 'melange' && (
                    <button className="btn btn-sm btn-outline-secondary" onClick={() => setAModifier(m)}>
                      Modifier
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {donnees && !lignes.length && (
              <tr>
                <td colSpan={8} className="text-center text-body-secondary py-4">
                  Aucun mouvement : enregistrez une première entrée.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {aModifier && (
        <ModifierMouvementModal mouvement={aModifier} produitId={produitId} unite={unite} fermer={() => setAModifier(null)} apres={recharger} />
      )}
    </div>
  )
}
