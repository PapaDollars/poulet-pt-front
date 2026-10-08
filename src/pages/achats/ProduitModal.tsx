import { useState } from 'react'
import { toast } from 'react-toastify'
import { api, messageErreur } from '../../api'
import Fenetre from '../../composants/Fenetre'
import type { StockAchat, Unite } from '../../types'

interface Props {
  produit: StockAchat
  unites: Unite[]
  fermer: () => void
  apres: () => void
}

/** Modifier un produit du catalogue des achats : nom, détails, unité, prix proposé. */
export default function ProduitModal({ produit, unites, fermer, apres }: Props) {
  const [nom, setNom] = useState(produit.nom)
  const [details, setDetails] = useState(produit.details)
  const [unite, setUnite] = useState(produit.unite)
  const [prix, setPrix] = useState(String(produit.prix))
  const [envoi, setEnvoi] = useState(false)

  async function enregistrer() {
    setEnvoi(true)
    try {
      await api.put(`/produits/${produit.produitId}`, { nom, details, unite, prix, categorie: 'bande' })
      toast.success(`${nom} enregistré`)
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
      titre="Modifier le produit"
      fermer={fermer}
      enregistrer={enregistrer}
      boutons={
        <button className="btn btn-primary" disabled={envoi}>
          Enregistrer
        </button>
      }
      suppression={{ url: `/produits/${produit.produitId}`, confirmation: `Retirer ${produit.nom} de la liste des produits ?`, apres, impossible: produit.achete > 0 ? 'Ce produit a déjà été acheté : il ne peut plus être retiré' : undefined, }}
    >
      <div className="row g-3">
        <div className="col-12">
          <label className="form-label">Produit</label>
          <input className="form-control" value={nom} onChange={(e) => setNom(e.target.value)} required />
        </div>
        <div className="col-12">
          <label className="form-label">Détails</label>
          <input className="form-control" value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Facultatif" />
        </div>
        <div className="col-6">
          <label className="form-label">Unité</label>
          <select className="form-select" value={unite} onChange={(e) => setUnite(e.target.value)}>
            {!unites.some((u) => u.nom === unite) && <option>{unite}</option>}
            {unites.map((u) => (
              <option key={u.id}>{u.nom}</option>
            ))}
          </select>
        </div>
        <div className="col-6">
          <label className="form-label">Prix proposé</label>
          <input type="number" min="0" step="any" className="form-control" value={prix} onChange={(e) => setPrix(e.target.value)} required />
        </div>
      </div>
    </Fenetre>
  )
}
