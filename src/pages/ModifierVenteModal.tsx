import { useState } from 'react'
import { toast } from 'react-toastify'
import { api, messageErreur } from '../api'
import Fenetre from '../composants/Fenetre'
import { dateFr, fcfa, nombre } from '../format'
import type { Bande, Vente } from '../types'

interface Props {
  vente: Vente
  bandes: Bande[]
  fermer: () => void
  apres: () => void
}

/** Corriger une vente de poulets : bande, date, nombre, prix, client. */
export default function ModifierVenteModal({ vente, bandes, fermer, apres }: Props) {
  const [bandeId, setBandeId] = useState(vente.bandeId)
  const [date, setDate] = useState(vente.date)
  const [quantite, setQuantite] = useState(String(vente.quantite))
  const [prix, setPrix] = useState(String(vente.prixUnitaire))
  const [client, setClient] = useState(vente.client ?? '')
  const [envoi, setEnvoi] = useState(false)

  const bande = bandes.find((b) => b.id === bandeId)
  // Poulets disponibles : les vivants + ceux de cette vente s'ils restent dans la même bande
  const maximum = (bande?.vivants ?? 0) + (bandeId === vente.bandeId ? vente.quantite : 0)
  const q = Number(quantite) || 0

  async function enregistrer() {
    setEnvoi(true)
    try {
      await api.put(`/ventes/${vente.id}`, { bandeId, date, quantite, prixUnitaire: prix, client })
      toast.success(`Vente modifiée : ${fcfa(q * (Number(prix) || 0))}`)
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
      titre="Modifier la vente"
      fermer={fermer}
      enregistrer={enregistrer}
      boutons={
        <button className="btn btn-primary" disabled={envoi || q > maximum}>
          Enregistrer
        </button>
      }
      suppression={{ url: `/ventes/${vente.id}`, confirmation: 'Supprimer cette vente ?', apres }}
    >
      <div className="row g-3">
        <div className="col-12">
          <label className="form-label">Bande</label>
          <select className="form-select" value={bandeId} onChange={(e) => setBandeId(e.target.value)}>
            {bandes.map((b) => (
              <option key={b.id} value={b.id}>
                {b.nom} — arrivée le {dateFr(b.dateArrivee)}
              </option>
            ))}
          </select>
        </div>
        <div className="col-6">
          <label className="form-label">Date</label>
          <input type="date" className="form-control" value={date} min={bande?.dateArrivee} onChange={(e) => setDate(e.target.value)} required />
        </div>
        <div className="col-6">
          <label className="form-label">Nombre</label>
          <input type="number" min="1" max={maximum} step="1" className="form-control" value={quantite} onChange={(e) => setQuantite(e.target.value)} required />
        </div>
        <div className="col-6">
          <label className="form-label">Prix / poulet</label>
          <input type="number" min="0" step="any" className="form-control" value={prix} onChange={(e) => setPrix(e.target.value)} required />
        </div>
        <div className="col-6">
          <label className="form-label">Client</label>
          <input className="form-control" value={client} onChange={(e) => setClient(e.target.value)} placeholder="Facultatif" />
        </div>
        <div className="col-12">
          <div className="apercu">
            Montant <strong>{fcfa(q * (Number(prix) || 0))}</strong> ·{' '}
            <span className={q > maximum ? 'texte-negatif fw-semibold' : ''}>maximum {nombre(maximum)} poulets</span>
          </div>
        </div>
      </div>
    </Fenetre>
  )
}
