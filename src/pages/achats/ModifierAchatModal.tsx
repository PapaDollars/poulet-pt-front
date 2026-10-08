import { useState } from 'react'
import { toast } from 'react-toastify'
import { api, messageErreur } from '../../api'
import Fenetre from '../../composants/Fenetre'
import { fcfa, nombre } from '../../format'
import type { Achat } from '../../types'

interface Props {
  achat: Achat
  fermer: () => void
  apres: () => void
}

/** Corriger un achat : la quantité ne peut pas descendre sous ce qui est déjà affecté aux bandes. */
export default function ModifierAchatModal({ achat, fermer, apres }: Props) {
  const [date, setDate] = useState(achat.date)
  const [details, setDetails] = useState(achat.details ?? '')
  const [quantite, setQuantite] = useState(String(achat.quantite))
  const [prix, setPrix] = useState(String(achat.prixUnitaire))
  const [fournisseur, setFournisseur] = useState(achat.fournisseur ?? '')
  const [envoi, setEnvoi] = useState(false)

  const q = Number(quantite) || 0
  const tropPeu = q < achat.utilise

  async function enregistrer() {
    setEnvoi(true)
    try {
      await api.put(`/achats/${achat.id}`, { date, details, quantite, prixUnitaire: prix, fournisseur })
      toast.success(`Achat de ${achat.nom} modifié`)
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
      titre={`Modifier l'achat : ${achat.nom}`}
      fermer={fermer}
      enregistrer={enregistrer}
      boutons={
        <button className="btn btn-primary" disabled={envoi || tropPeu}>
          Enregistrer
        </button>
      }
      suppression={{ url: `/achats/${achat.id}`, confirmation: `Supprimer cet achat de ${achat.nom} ?`, apres, impossible: achat.utilise > 0 ? 'Une partie de cet achat est affectée à une bande : annulez d\'abord ces dépenses' : undefined, }}
    >
      <div className="row g-3">
        <div className="col-6">
          <label className="form-label">Date</label>
          <input type="date" className="form-control" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>
        <div className="col-6">
          <label className="form-label">Détails</label>
          <input className="form-control" value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Facultatif" />
        </div>
        <div className="col-6">
          <label className="form-label">Quantité</label>
          <div className="input-group">
            <input type="number" min="0" step="any" className="form-control" value={quantite} onChange={(e) => setQuantite(e.target.value)} required />
            <span className="input-group-text">{achat.unite}</span>
          </div>
        </div>
        <div className="col-6">
          <label className="form-label">Prix unitaire</label>
          <input type="number" min="0" step="any" className="form-control" value={prix} onChange={(e) => setPrix(e.target.value)} required />
        </div>
        <div className="col-12">
          <label className="form-label">Fournisseur</label>
          <input className="form-control" value={fournisseur} onChange={(e) => setFournisseur(e.target.value)} placeholder="Facultatif" />
        </div>
        <div className="col-12">
          <div className="apercu">
            Total <strong>{fcfa(q * (Number(prix) || 0))}</strong> ·{' '}
            <span className={tropPeu ? 'texte-negatif fw-semibold' : ''}>
              {nombre(achat.utilise)} {achat.unite} déjà affectés aux bandes
            </span>
            {achat.utilise > 0 && <div className="small text-body-secondary">Un changement de prix met à jour le coût de ces bandes.</div>}
          </div>
        </div>
      </div>
    </Fenetre>
  )
}
