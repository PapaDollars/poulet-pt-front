import { useState } from 'react'
import { toast } from 'react-toastify'
import { api, messageErreur } from '../api'
import Fenetre from '../composants/Fenetre'
import { fcfa, nombre } from '../format'
import type { MouvementStock } from '../types'

interface Props {
  mouvement: MouvementStock
  produitId: string
  unite: string
  fermer: () => void
  apres: () => void
}

/** Corriger une entrée ou une vente de maïs (au sac). */
export default function ModifierMouvementModal({ mouvement: m, produitId, unite, fermer, apres }: Props) {
  const entree = m.type === 'entree'
  const poidsInitial = m.poidsSac ?? 100
  const [date, setDate] = useState(m.date)
  const [nombreSacs, setNombreSacs] = useState(String(m.nombreSacs ?? Math.round((m.quantite / poidsInitial) * 100) / 100))
  const [poidsSac, setPoidsSac] = useState(String(poidsInitial))
  const [prixSac, setPrixSac] = useState(String(m.prixSac ?? Math.round((m.prixUnitaire ?? 0) * poidsInitial)))
  const [transport, setTransport] = useState(String(m.transport ?? 0))
  const [tiers, setTiers] = useState((entree ? m.fournisseur : m.client) ?? '')
  const [envoi, setEnvoi] = useState(false)

  const sacs = Number(nombreSacs) || 0
  const montant = Math.round(sacs * (Number(prixSac) || 0) + (entree ? Number(transport) || 0 : 0))

  async function enregistrer() {
    setEnvoi(true)
    try {
      await api.put(`/stock/mouvements/${m.id}`, {
        produitId,
        date,
        nombreSacs,
        poidsSac,
        prixSac,
        ...(entree ? { transport, fournisseur: tiers } : { client: tiers }),
      })
      toast.success(`${entree ? 'Entrée' : 'Vente'} modifiée : ${fcfa(montant)}`)
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
      titre={entree ? "Modifier l'entrée en stock" : 'Modifier la vente'}
      fermer={fermer}
      enregistrer={enregistrer}
      boutons={
        <button className="btn btn-primary" disabled={envoi}>
          Enregistrer
        </button>
      }
      suppression={{ url: `/stock/mouvements/${m.id}`, confirmation: entree ? 'Supprimer cette entrée en stock ?' : 'Supprimer cette vente ?', apres }}
    >
      <div className="row g-3">
        <div className="col-12">
          <label className="form-label">Date</label>
          <input type="date" className="form-control" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>
        <div className="col-4">
          <label className="form-label">Nombre de sacs</label>
          <input type="number" min="0" step="any" className="form-control" value={nombreSacs} onChange={(e) => setNombreSacs(e.target.value)} required />
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
        {entree && (
          <div className="col-6">
            <label className="form-label">Transport (total)</label>
            <input type="number" min="0" step="any" className="form-control" value={transport} onChange={(e) => setTransport(e.target.value)} />
          </div>
        )}
        <div className={entree ? 'col-6' : 'col-12'}>
          <label className="form-label">{entree ? 'Fournisseur' : 'Client'}</label>
          <input className="form-control" value={tiers} onChange={(e) => setTiers(e.target.value)} placeholder="Facultatif" />
        </div>
        <div className="col-12">
          <div className="apercu">
            <strong>{nombre(sacs)} sac(s)</strong> <span className="text-body-secondary">({nombre(sacs * (Number(poidsSac) || 0))} {unite})</span> · montant{' '}
            <strong>{fcfa(montant)}</strong>
          </div>
        </div>
      </div>
    </Fenetre>
  )
}
