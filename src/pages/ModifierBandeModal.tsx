import { useState } from 'react'
import { toast } from 'react-toastify'
import { api, messageErreur } from '../api'
import Fenetre from '../composants/Fenetre'
import { fcfa, nombre } from '../format'
import type { Bande } from '../types'

interface Props {
  bande: Bande
  fermer: () => void
  apres: () => void
}

/** Correction d'une bande : nom, date d'arrivée, nombre et prix des poussins. */
export default function ModifierBandeModal({ bande, fermer, apres }: Props) {
  const [nom, setNom] = useState(bande.nom)
  const [dateArrivee, setDateArrivee] = useState(bande.dateArrivee)
  const [nombreInitial, setNombreInitial] = useState(String(bande.nombreInitial))
  const [prixUnitaire, setPrixUnitaire] = useState(String(bande.prixUnitaire))
  const [envoi, setEnvoi] = useState(false)

  const sortis = bande.morts + bande.vendus
  const total = Math.round((Number(nombreInitial) || 0) * (Number(prixUnitaire) || 0))

  // Suppression possible seulement pour une bande sans aucune opération
  const utilisee = bande.morts + bande.vendus + bande.sacsTotal + bande.coutSoins > 0

  async function enregistrer() {
    setEnvoi(true)
    try {
      await api.put(`/bandes/${bande.id}`, { nom, dateArrivee, nombreInitial, prixUnitaire })
      toast.success(`${nom} modifiée`)
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
      titre={`Modifier ${bande.nom}`}
      fermer={fermer}
      enregistrer={enregistrer}
      boutons={
        <button className="btn btn-primary" disabled={envoi}>
          Enregistrer
        </button>
      }
      suppression={{
        url: `/bandes/${bande.id}`,
        confirmation: `Supprimer définitivement ${bande.nom} ?`,
        apres,
        impossible: utilisee ? 'Cette bande a déjà des sacs, dépenses, ventes ou pertes : supprimez-les d\'abord' : undefined,
      }}
    >
      <div className="row g-3">
        <div className="col-7">
          <label className="form-label">Nom</label>
          <input className="form-control" value={nom} onChange={(e) => setNom(e.target.value)} required autoFocus />
        </div>
        <div className="col-5">
          <label className="form-label">Date d'arrivée</label>
          <input type="date" className="form-control" value={dateArrivee} onChange={(e) => setDateArrivee(e.target.value)} required />
        </div>
        <div className="col-6">
          <label className="form-label">Poussins</label>
          <input
            type="number"
            min={Math.max(sortis, 1)}
            step="1"
            className="form-control"
            value={nombreInitial}
            onChange={(e) => setNombreInitial(e.target.value)}
            required
          />
          {sortis > 0 && <div className="form-text">Au moins {nombre(sortis)} (déjà vendus ou morts)</div>}
        </div>
        <div className="col-6">
          <label className="form-label">Prix / poussin</label>
          <input type="number" min="0" step="any" className="form-control" value={prixUnitaire} onChange={(e) => setPrixUnitaire(e.target.value)} required />
        </div>
        <div className="col-12">
          <div className="apercu">
            Achat des poussins : <strong>{fcfa(total)}</strong>. Les coûts par poulet, pertes et marges sont recalculés automatiquement.
          </div>
        </div>
      </div>
    </Fenetre>
  )
}
