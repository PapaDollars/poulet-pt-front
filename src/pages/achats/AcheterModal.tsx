import { useState } from 'react'
import { toast } from 'react-toastify'
import { api, messageErreur } from '../../api'
import Fenetre from '../../composants/Fenetre'
import { aujourdhui, fcfa, nombre } from '../../format'
import type { StockAchat, Unite } from '../../types'

interface Props {
  // Produit du catalogue, ou null pour acheter un nouveau produit
  produit: StockAchat | null
  unites: Unite[]
  fermer: () => void
  apres: () => void
}

/** Achat d'un produit pour les bandes : il entre dans le stock, à affecter ensuite aux bandes. */
export default function AcheterModal({ produit, unites, fermer, apres }: Props) {
  const [nom, setNom] = useState('')
  const [details, setDetails] = useState(produit?.details ?? '')
  const [unite, setUnite] = useState(produit?.unite ?? 'flacon')
  const [date, setDate] = useState(aujourdhui())
  const [quantite, setQuantite] = useState('1')
  const [prix, setPrix] = useState(produit ? String(produit.prix) : '')
  const [fournisseur, setFournisseur] = useState('')
  const [envoi, setEnvoi] = useState(false)

  const montant = Math.round((Number(quantite) || 0) * (Number(prix) || 0))

  async function enregistrer() {
    setEnvoi(true)
    try {
      await api.post('/achats', {
        produitId: produit?.produitId ?? null,
        nom,
        details,
        unite,
        date,
        quantite,
        prixUnitaire: prix,
        fournisseur,
      })
      toast.success(`${nombre(Number(quantite))} ${unite} de ${produit?.nom ?? nom} achetés : ${fcfa(montant)}`)
      apres()
      fermer()
    } catch (err) {
      toast.error(messageErreur(err))
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <Fenetre
      titre={produit ? `Acheter : ${produit.nom}` : 'Acheter un nouveau produit'}
      fermer={fermer}
      enregistrer={enregistrer}
      boutons={
        <button className="btn btn-primary" disabled={envoi}>
          Enregistrer l'achat
        </button>
      }
    >
      <div className="row g-3">
        {!produit && (
          <>
            <div className="col-7">
              <label className="form-label">Produit</label>
              <input className="form-control" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Nom du produit" required autoFocus />
            </div>
            <div className="col-5">
              <label className="form-label">Unité</label>
              <select className="form-select" value={unite} onChange={(e) => setUnite(e.target.value)}>
                {unites.map((u) => (
                  <option key={u.id}>{u.nom}</option>
                ))}
              </select>
            </div>
          </>
        )}
        <div className="col-12">
          <label className="form-label">Détails</label>
          <input className="form-control" value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Dosage, conditionnement… (facultatif)" />
        </div>
        <div className="col-6">
          <label className="form-label">Date</label>
          <input type="date" className="form-control" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>
        <div className="col-6">
          <label className="form-label">Quantité</label>
          <div className="input-group">
            <input type="number" min="0" step="any" className="form-control" value={quantite} onChange={(e) => setQuantite(e.target.value)} required autoFocus={Boolean(produit)} />
            <span className="input-group-text">{unite}</span>
          </div>
        </div>
        <div className="col-6">
          <label className="form-label">Prix unitaire</label>
          <input type="number" min="0" step="any" className="form-control" value={prix} onChange={(e) => setPrix(e.target.value)} required />
        </div>
        <div className="col-6">
          <label className="form-label">Fournisseur</label>
          <input className="form-control" value={fournisseur} onChange={(e) => setFournisseur(e.target.value)} placeholder="Facultatif" />
        </div>
        <div className="col-12">
          <div className="apercu">
            Total <strong>{fcfa(montant)}</strong>
          </div>
        </div>
      </div>
    </Fenetre>
  )
}
