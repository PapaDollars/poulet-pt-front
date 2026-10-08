import { useEffect, useState, type FormEvent } from 'react'
import { toast } from 'react-toastify'
import { api, messageErreur } from '../api'
import { aujourdhui, fcfa, nombre } from '../format'
import { lirePoidsSac, memoriserPoidsSac } from '../poidsSac'
import type { LigneStock } from '../types'

interface Props {
  produits: LigneStock[]
  fermer: () => void
  apresEntree: () => void
}

/** Entrée en stock (achat) au sac : nombre de sacs × poids d'un sac, prix d'un sac + transport. */
export default function EntreeStockModal({ produits, fermer, apresEntree }: Props) {
  const [produitId, setProduitId] = useState(produits[0]?.produitId ?? '')
  const produit = produits.find((p) => p.produitId === produitId)
  const [date, setDate] = useState(aujourdhui())
  const [nombreSacs, setNombreSacs] = useState('')
  const [poidsSac, setPoidsSac] = useState(lirePoidsSac)
  // Prix d'un sac proposé : prix de référence (par kg) × poids d'un sac
  const [prixSac, setPrixSac] = useState(produit ? String(Math.round(produit.prixReference * (Number(lirePoidsSac()) || 0))) : '')
  const [transport, setTransport] = useState('')
  const [fournisseur, setFournisseur] = useState('')
  const [envoi, setEnvoi] = useState(false)

  // Échap ferme la fenêtre
  useEffect(() => {
    const touche = (e: KeyboardEvent) => e.key === 'Escape' && fermer()
    window.addEventListener('keydown', touche)
    return () => window.removeEventListener('keydown', touche)
  }, [fermer])

  const sacs = Number(nombreSacs) || 0
  const poids = Number(poidsSac) || 0
  const quantite = sacs * poids
  const montant = Math.round(sacs * (Number(prixSac) || 0) + (Number(transport) || 0))
  const unite = produit?.unite ?? 'kg'

  async function enregistrer(e: FormEvent) {
    e.preventDefault()
    setEnvoi(true)
    try {
      await api.post('/stock/mouvements', { type: 'entree', date, produitId, nombreSacs, poidsSac, prixSac, transport, fournisseur })
      memoriserPoidsSac(poidsSac)
      toast.success(`${nombre(sacs)} sac(s) de ${produit?.nom} entrés en stock (${nombre(quantite)} ${unite}) : ${fcfa(montant)}`)
      apresEntree()
      fermer()
    } catch (err) {
      toast.error(messageErreur(err))
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <>
      <div className="modal d-block" role="dialog" aria-modal="true" aria-labelledby="titre-entree" onClick={fermer}>
        <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
          <form className="modal-content" onSubmit={enregistrer}>
            <div className="modal-header">
              <h2 className="modal-title h5" id="titre-entree">
                Entrée en stock{produits.length === 1 ? ` : ${produits[0].nom}` : ''}
              </h2>
              <button type="button" className="btn-close" onClick={fermer} aria-label="Fermer" />
            </div>
            <div className="modal-body">
              <div className="row g-3">
                {produits.length > 1 && (
                  <div className="col-12">
                    <label className="form-label">Produit</label>
                    <select className="form-select" value={produitId} onChange={(e) => setProduitId(e.target.value)}>
                      {produits.map((p) => (
                        <option key={p.produitId} value={p.produitId}>
                          {p.nom}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="col-12">
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
                    <span className="input-group-text">{unite}</span>
                  </div>
                </div>
                <div className="col-4">
                  <label className="form-label">Prix d'un sac</label>
                  <input type="number" min="0" step="any" className="form-control" value={prixSac} onChange={(e) => setPrixSac(e.target.value)} required />
                </div>
                <div className="col-6">
                  <label className="form-label">Transport (total)</label>
                  <input type="number" min="0" step="any" className="form-control" value={transport} onChange={(e) => setTransport(e.target.value)} placeholder="0" />
                </div>
                <div className="col-6">
                  <label className="form-label">Fournisseur</label>
                  <input className="form-control" value={fournisseur} onChange={(e) => setFournisseur(e.target.value)} placeholder="Facultatif" />
                </div>
                <div className="col-12">
                  <div className="apercu">
                    <div>
                      <strong>{nombre(sacs)} sac(s) ajoutés</strong> <span className="text-body-secondary">({nombre(quantite)} {unite})</span>
                    </div>
                    <div>
                      Total <strong>{fcfa(montant)}</strong>
                      {quantite > 0 && (
                        <>
                          {' '}
                          · revient à <strong>{fcfa(montant / sacs)}</strong> le sac, soit {fcfa(montant / quantite)} / {unite} (achat + transport)
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline-secondary" onClick={fermer}>
                Annuler
              </button>
              <button className="btn btn-primary" disabled={envoi || !produitId}>
                Enregistrer l'entrée
              </button>
            </div>
          </form>
        </div>
      </div>
      <div className="modal-backdrop show" />
    </>
  )
}
