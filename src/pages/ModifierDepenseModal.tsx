import { useState } from 'react'
import { toast } from 'react-toastify'
import { api, messageErreur } from '../api'
import Fenetre from '../composants/Fenetre'
import { dateFr, fcfa, nombre } from '../format'
import type { Achat, Bande, Depense } from '../types'
import { useCharger } from '../useCharger'

interface Props {
  depense: Depense
  bandes: Bande[]
  fermer: () => void
  apres: () => void
}

/** Corriger une dépense : date, bande, quantité (dans la limite de son achat). */
export default function ModifierDepenseModal({ depense, bandes, fermer, apres }: Props) {
  const achats = useCharger<Achat[]>(depense.produitId ? `/achats?produitId=${depense.produitId}` : '/achats')
  const [date, setDate] = useState(depense.date)
  const [bandeId, setBandeId] = useState(depense.bandeId)
  const [quantite, setQuantite] = useState(String(depense.quantite))
  const [envoi, setEnvoi] = useState(false)

  const achat = achats.donnees?.find((a) => a.id === depense.achatId)
  // Maximum : ce qui reste dans l'achat + ce que cette dépense utilise déjà
  const maximum = achat ? achat.restant + depense.quantite : depense.quantite
  const q = Number(quantite) || 0
  const trop = q > maximum
  const bande = bandes.find((b) => b.id === bandeId)

  async function enregistrer() {
    setEnvoi(true)
    try {
      await api.put(`/depenses/${depense.id}`, { date, bandeId, quantite })
      toast.success(`${depense.nom} : ${nombre(q)} ${depense.unite} pour ${bande?.nom}`)
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
      titre={`Modifier la dépense : ${depense.nom ?? depense.designation}`}
      fermer={fermer}
      enregistrer={enregistrer}
      boutons={
        <button className="btn btn-primary" disabled={envoi || trop || q <= 0}>
          Enregistrer
        </button>
      }
      suppression={{ url: `/depenses/${depense.id}`, confirmation: 'Annuler cette dépense ? Le produit revient en stock.', apres,  }}
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
          <label className="form-label">Quantité</label>
          <div className="input-group">
            <input type="number" min="0" step="any" className="form-control" value={quantite} onChange={(e) => setQuantite(e.target.value)} required />
            <span className="input-group-text">{depense.unite}</span>
          </div>
        </div>
        <div className="col-12">
          <div className="apercu">
            Montant <strong>{fcfa(q * depense.prixUnitaire)}</strong> ({fcfa(depense.prixUnitaire)} / {depense.unite}) ·{' '}
            <span className={trop ? 'texte-negatif fw-semibold' : ''}>
              maximum {nombre(maximum)} {depense.unite}
            </span>
          </div>
        </div>
      </div>
    </Fenetre>
  )
}
