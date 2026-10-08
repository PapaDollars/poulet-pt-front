import { faPen, faPlus } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { dateFr, fcfa, nombre } from '../format'
import type { Achat, StockAchat, Unite } from '../types'
import { useCharger } from '../useCharger'
import AcheterModal from './achats/AcheterModal'
import ModifierAchatModal from './achats/ModifierAchatModal'
import ProduitModal from './achats/ProduitModal'

/**
 * Achats des produits pour les bandes (vaccins, médicaments, litière…). Ils entrent en stock ici,
 * puis sont affectés aux bandes depuis Bandes → Dépenses.
 */
export default function Achats() {
  const stock = useCharger<StockAchat[]>('/achats/stock')
  const achats = useCharger<Achat[]>('/achats')
  const unites = useCharger<Unite[]>('/unites')
  // undefined : fermé · null : nouveau produit · produit : achat de ce produit
  const [aAcheter, setAAcheter] = useState<StockAchat | null | undefined>(undefined)
  const [produitAModifier, setProduitAModifier] = useState<StockAchat | null>(null)
  const [achatAModifier, setAchatAModifier] = useState<Achat | null>(null)

  function recharger() {
    void stock.recharger()
    void achats.recharger()
  }

  const produits = stock.donnees ?? []
  const totalAchats = (achats.donnees ?? []).reduce((t, a) => t + a.montant, 0)
  const valeurRestante = produits.reduce((t, p) => t + p.valeurRestante, 0)

  return (
    <>
      <div className="d-flex flex-wrap align-items-baseline gap-3 mb-2">
        <h1 className="titre-page mb-0">Achats</h1>
        <span className="text-body-secondary">
          {fcfa(totalAchats)} achetés · {fcfa(valeurRestante)} encore en stock
        </span>
      </div>
      <p className="text-body-secondary small mb-4">
        Achetez ici les produits ; affectez-les ensuite aux bandes dans <Link to="/bandes?onglet=depenses">Bandes → Dépenses</Link>.
      </p>

      <div className="grille-produits mb-5">
        {produits.map((p) => (
          <div key={p.produitId} className={`card carte-produit ${p.restant > 0 ? 'en-stock' : ''}`}>
            {/* Colonne flexible : le bouton Acheter reste en bas, aligné d'une carte à l'autre */}
            <div className="card-body d-flex flex-column">
              <div className="d-flex align-items-start gap-1">
                <div className="fw-semibold lh-sm flex-grow-1">{p.nom}</div>
                <button className="btn btn-sm btn-link p-0 text-body-secondary" onClick={() => setProduitAModifier(p)} title="Modifier le produit" aria-label={`Modifier ${p.nom}`}>
                  <FontAwesomeIcon icon={faPen} />
                </button>
              </div>
              {p.details && <div className="small text-body-secondary">{p.details}</div>}
              <div className="mt-2">
                <span className={`fs-5 fw-bold ${p.restant > 0 ? '' : 'text-body-secondary'}`}>{nombre(p.restant)}</span>{' '}
                <span className="small text-body-secondary">{p.unite} en stock</span>
              </div>
              <div className="small text-body-secondary mb-2">{fcfa(p.prix)} / {p.unite}</div>
              <button className="btn btn-sm btn-outline-primary w-100 mt-auto" onClick={() => setAAcheter(p)}>
                Acheter
              </button>
            </div>
          </div>
        ))}
        <button className="card carte-produit carte-nouveau" onClick={() => setAAcheter(null)}>
          <div className="card-body d-flex flex-column align-items-center justify-content-center text-body-secondary">
            <FontAwesomeIcon icon={faPlus} className="fs-4 mb-2" />
            Nouveau produit
          </div>
        </button>
      </div>

      <h2 className="h5 mb-3">Historique des achats</h2>
      <div className="card">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead>
              <tr>
                <th>Date</th>
                <th>Produit</th>
                <th className="text-end">Quantité</th>
                <th className="text-end">Prix unit.</th>
                <th className="text-end">Total</th>
                <th className="text-end">Restant</th>
                <th>Fournisseur</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {(achats.donnees ?? []).map((a) => (
                <tr key={a.id}>
                  <td>{dateFr(a.date)}</td>
                  <td>
                    {a.nom} {a.details && <span className="text-body-secondary small">· {a.details}</span>}
                  </td>
                  <td className="text-end">
                    {nombre(a.quantite)} <span className="text-body-secondary small">{a.unite}</span>
                  </td>
                  <td className="text-end">{fcfa(a.prixUnitaire)}</td>
                  <td className="text-end fw-semibold">{fcfa(a.montant)}</td>
                  <td className={`text-end ${a.restant > 0 ? 'fw-semibold' : 'text-body-secondary'}`}>{nombre(a.restant)}</td>
                  <td className="text-body-secondary small">{a.fournisseur || '—'}</td>
                  <td className="text-end text-nowrap">
                    <button className="btn btn-sm btn-outline-secondary" onClick={() => setAchatAModifier(a)}>
                      Modifier
                    </button>
                  </td>
                </tr>
              ))}
              {!achats.chargement && !achats.donnees?.length && (
                <tr>
                  <td colSpan={8} className="text-center text-body-secondary py-4">
                    Aucun achat : cliquez sur « Acheter » sous un produit.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {aAcheter !== undefined && <AcheterModal produit={aAcheter} unites={unites.donnees ?? []} fermer={() => setAAcheter(undefined)} apres={recharger} />}
      {produitAModifier && <ProduitModal produit={produitAModifier} unites={unites.donnees ?? []} fermer={() => setProduitAModifier(null)} apres={recharger} />}
      {achatAModifier && <ModifierAchatModal achat={achatAModifier} fermer={() => setAchatAModifier(null)} apres={recharger} />}
    </>
  )
}
