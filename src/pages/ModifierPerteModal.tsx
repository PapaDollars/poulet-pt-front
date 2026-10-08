import { useState } from 'react'
import { toast } from 'react-toastify'
import { api, messageErreur } from '../api'
import Fenetre from '../composants/Fenetre'
import { dateFr, nombre } from '../format'
import type { Bande, Perte } from '../types'

interface Props {
  perte: Perte
  bandes: Bande[]
  fermer: () => void
  apres: () => void
}

/** Corriger une perte : bande, date, nombre, cause. */
export default function ModifierPerteModal({ perte, bandes, fermer, apres }: Props) {
  const [bandeId, setBandeId] = useState(perte.bandeId)
  const [date, setDate] = useState(perte.date)
  const [nombrePerdu, setNombrePerdu] = useState(String(perte.nombre))
  const [cause, setCause] = useState(perte.cause ?? '')
  const [envoi, setEnvoi] = useState(false)

  const bande = bandes.find((b) => b.id === bandeId)
  const maximum = (bande?.vivants ?? 0) + (bandeId === perte.bandeId ? perte.nombre : 0)
  const n = Number(nombrePerdu) || 0

  async function enregistrer() {
    setEnvoi(true)
    try {
      await api.put(`/pertes/${perte.id}`, { bandeId, date, nombre: nombrePerdu, cause })
      toast.success(`Perte modifiée : ${nombre(n)} poulet(s)`)
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
      titre="Modifier la perte"
      fermer={fermer}
      enregistrer={enregistrer}
      boutons={
        <button className="btn btn-primary" disabled={envoi || n > maximum}>
          Enregistrer
        </button>
      }
      suppression={{ url: `/pertes/${perte.id}`, confirmation: 'Supprimer cette perte ?', apres }}
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
          <input type="number" min="1" max={maximum} step="1" className="form-control" value={nombrePerdu} onChange={(e) => setNombrePerdu(e.target.value)} required />
        </div>
        <div className="col-12">
          <label className="form-label">Cause</label>
          <input className="form-control" value={cause} onChange={(e) => setCause(e.target.value)} placeholder="Facultatif" />
        </div>
        <div className="col-12">
          <div className="apercu">
            <span className={n > maximum ? 'texte-negatif fw-semibold' : ''}>Maximum {nombre(maximum)} poulets</span> · le coût perdu est recalculé
            automatiquement.
          </div>
        </div>
      </div>
    </Fenetre>
  )
}
