import { useEffect, useState, type FormEvent } from 'react'
import { toast } from 'react-toastify'
import { api, messageErreur } from '../api'
import { aujourdhui, fcfa, nombre } from '../format'
import { enSacs, lirePoidsSac, memoriserPoidsSac } from '../poidsSac'
import type { LigneStock } from '../types'

interface Props {
  produits: LigneStock[]
  fermer: () => void
  apresVente: () => void
}

/** Vente d'un produit du stock (le maïs) au sac : nombre de sacs × poids d'un sac, prix par sac. */
export default function VenteStockModal({ produits, fermer, apresVente }: Props) {
  const [produitId, setProduitId] = useState(produits[0]?.produitId ?? '')
  const [date, setDate] = useState(aujourdhui())
  const [nombreSacs, setNombreSacs] = useState('')
  const [poidsSac, setPoidsSac] = useState(lirePoidsSac)
  const [prixSac, setPrixSac] = useState('')
  const [client, setClient] = useState('')
  const [envoi, setEnvoi] = useState(false)

  // Échap ferme la fenêtre
  useEffect(() => {
    const touche = (e: KeyboardEvent) => e.key === 'Escape' && fermer()
    window.addEventListener('keydown', touche)
    return () => window.removeEventListener('keydown', touche)
  }, [fermer])

  const produit = produits.find((p) => p.produitId === produitId)
  const sacs = Number(nombreSacs) || 0
  const poids = Number(poidsSac) || 0
  const quantite = sacs * poids
  const montant = Math.round(sacs * (Number(prixSac) || 0))
  const cout = produit ? Math.round(quantite * produit.coutMoyen) : 0
  const benefice = montant - cout
  const trop = produit ? quantite > produit.quantite : false

  async function vendre(e: FormEvent) {
    e.preventDefault()
    setEnvoi(true)
    try {
      await api.post('/stock/mouvements', { type: 'vente', date, produitId, nombreSacs, poidsSac, prixSac, client })
      memoriserPoidsSac(poidsSac)
      toast.success(`${nombre(sacs)} sac(s) de ${produit?.nom} vendus : ${fcfa(montant)} (bénéfice ${fcfa(benefice)})`)
      apresVente()
      fermer()
    } catch (err) {
      toast.error(messageErreur(err))
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <>
      <div className="modal d-block" role="dialog" aria-modal="true" aria-labelledby="titre-vente" onClick={fermer}>
        <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
          <form className="modal-content" onSubmit={vendre}>
            <div className="modal-header">
              <h2 className="modal-title h5" id="titre-vente">
                Vendre du stock
              </h2>
              <button type="button" className="btn-close" onClick={fermer} aria-label="Fermer" />
            </div>
            <div className="modal-body">
              {!produits.length ? (
                <p className="mb-0">Aucun produit ne se revend. Cochez « Se revend » dans Paramètres.</p>
              ) : (
                <div className="row g-3">
                  <div className="col-7">
                    <label className="form-label">Produit</label>
                    <select className="form-select" value={produitId} onChange={(e) => setProduitId(e.target.value)} required>
                      {produits.map((p) => (
                        <option key={p.produitId} value={p.produitId}>
                          {p.nom}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-5">
                    <label className="form-label">Date</label>
                    <input type="date" className="form-control" value={date} onChange={(e) => setDate(e.target.value)} required />
                  </div>
                  <div className="col-4">
                    <label className="form-label">Nombre de sacs</label>
                    <input type="number" min="0" step="any" className="form-control" value={nombreSacs} onChange={(e) => setNombreSacs(e.target.value)} required autoFocus />
                  </div>
                  <div className="col-4">
                    <label className="form-label">Poids d'un sac</label>
                    <div className="input-group">
                      <input type="number" min="0" step="any" className="form-control" value={poidsSac} onChange={(e) => setPoidsSac(e.target.value)} required />
                      <span className="input-group-text">{produit?.unite ?? 'kg'}</span>
                    </div>
                  </div>
                  <div className="col-4">
                    <label className="form-label">Prix d'un sac</label>
                    <input type="number" min="0" step="any" className="form-control" value={prixSac} onChange={(e) => setPrixSac(e.target.value)} required />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Client</label>
                    <input className="form-control" value={client} onChange={(e) => setClient(e.target.value)} placeholder="Facultatif" />
                  </div>
                  {produit && (
                    <div className="col-12">
                      <div className="apercu">
                        <div>
                          <strong className={trop ? 'texte-negatif' : ''}>{nombre(sacs)} sac(s) retirés</strong>{' '}
                          <span className="text-body-secondary">({nombre(quantite)} {produit.unite})</span> · disponible{' '}
                          <strong>{nombre(enSacs(produit.quantite, poids))} sacs</strong>{' '}
                          <span className="text-body-secondary">({nombre(produit.quantite)} {produit.unite})</span>
                        </div>
                        <div>
                          Montant <strong>{fcfa(montant)}</strong> · coût {fcfa(cout)} · bénéfice{' '}
                          <strong className={benefice >= 0 ? 'texte-positif' : 'texte-negatif'}>{fcfa(benefice)}</strong>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline-secondary" onClick={fermer}>
                Annuler
              </button>
              <button className="btn btn-success" disabled={envoi || !produits.length || trop}>
                Vendre
              </button>
            </div>
          </form>
        </div>
      </div>
      <div className="modal-backdrop show" />
    </>
  )
}
