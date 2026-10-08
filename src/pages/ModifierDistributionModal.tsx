import { useState } from 'react'
import { toast } from 'react-toastify'
import { api, messageErreur } from '../api'
import Fenetre from '../composants/Fenetre'
import { dateFr, fcfa, nombre, TYPES_ALIMENT } from '../format'
import type { Bande, Distribution } from '../types'

interface Props {
  distribution: Distribution
  bandes: Bande[]
  // Sacs encore libres dans le lot (sans compter cette distribution)
  restantsLot: number
  fermer: () => void
  apres: () => void
}

/** Correction de sacs donnés à une bande : date, bande, nombre de sacs (même lot, même prix). */
export default function ModifierDistributionModal({ distribution, bandes, restantsLot, fermer, apres }: Props) {
  const [date, setDate] = useState(distribution.date)
  const [bandeId, setBandeId] = useState(distribution.bandeId)
  const [nombreSacs, setNombreSacs] = useState(String(distribution.nombreSacs))
  const [envoi, setEnvoi] = useState(false)

  const maximum = restantsLot + distribution.nombreSacs
  const sacs = Number(nombreSacs) || 0
  const trop = sacs > maximum
  const bande = bandes.find((b) => b.id === bandeId)

  async function enregistrer() {
    setEnvoi(true)
    try {
      await api.put(`/distributions/${distribution.id}`, { date, bandeId, nombreSacs })
      toast.success(`${nombre(sacs)} sac(s) ${TYPES_ALIMENT[distribution.type]} pour ${bande?.nom} : ${fcfa(sacs * distribution.prixSac)}`)
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
      titre="Modifier les sacs donnés"
      fermer={fermer}
      enregistrer={enregistrer}
      boutons={
        <button className="btn btn-primary" disabled={envoi || trop || sacs <= 0}>
          Enregistrer
        </button>
      }
      suppression={{
        url: `/distributions/${distribution.id}`,
        confirmation: 'Annuler cette distribution ? Les sacs reviennent en stock.',
        apres,
      }}
    >
      <p className="small text-body-secondary">
        <span className={`badge badge-${distribution.type}`}>{TYPES_ALIMENT[distribution.type]}</span> · lot à {fcfa(distribution.prixSac)} le sac. Pour
        changer de type ou de lot, supprimez cette ligne et donnez de nouveaux sacs.
      </p>
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
          <label className="form-label">Nombre de sacs</label>
          <input type="number" min="0" max={maximum} step="any" className="form-control" value={nombreSacs} onChange={(e) => setNombreSacs(e.target.value)} required />
        </div>
        <div className="col-12">
          <div className="apercu">
            Montant <strong>{fcfa(sacs * distribution.prixSac)}</strong> ·{' '}
            <span className={trop ? 'texte-negatif fw-semibold' : ''}>maximum {nombre(maximum)} sacs dans ce lot</span>
          </div>
        </div>
      </div>
    </Fenetre>
  )
}
