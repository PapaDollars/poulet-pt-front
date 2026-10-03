import { useState } from 'react'
import { toast } from 'react-toastify'
import { api, messageErreur } from '../api'
import BoutonSupprimer from '../composants/BoutonSupprimer'
import { fcfa, PHASES } from '../format'
import type { Produit } from '../types'
import { useCharger } from '../useCharger'

type Brouillon = Omit<Produit, 'id'> & { id?: string }

const NOUVEAU: Brouillon = { nom: '', unite: 'kg', prix: 0, poidsKg: 1, phases: [1, 2, 3] }

function LigneProduit({ initial, apres }: { initial: Brouillon; apres: () => void }) {
  const [p, setP] = useState(initial)
  const modifie = JSON.stringify(p) !== JSON.stringify(initial)

  async function enregistrer() {
    try {
      if (p.id) await api.put(`/produits/${p.id}`, p)
      else await api.post('/produits', p)
      toast.success(`${p.nom} enregistré`)
      if (!p.id) setP(NOUVEAU)
      apres()
    } catch (err) {
      toast.error(messageErreur(err))
    }
  }

  const basculerPhase = (ph: number) =>
    setP((x) => ({ ...x, phases: x.phases.includes(ph) ? x.phases.filter((y) => y !== ph) : [...x.phases, ph].sort() }))

  return (
    <tr>
      <td>
        <input className="form-control form-control-sm" value={p.nom} onChange={(e) => setP({ ...p, nom: e.target.value })} placeholder="Nouveau produit" />
      </td>
      <td style={{ width: 110 }}>
        <input className="form-control form-control-sm" value={p.unite} onChange={(e) => setP({ ...p, unite: e.target.value })} />
      </td>
      <td style={{ width: 130 }}>
        <input type="number" min="0" className="form-control form-control-sm" value={p.prix} onChange={(e) => setP({ ...p, prix: Number(e.target.value) })} />
      </td>
      <td style={{ width: 110 }}>
        <input type="number" min="0" step="any" className="form-control form-control-sm" value={p.poidsKg} onChange={(e) => setP({ ...p, poidsKg: Number(e.target.value) })} />
      </td>
      <td className="text-end text-body-secondary small">{p.poidsKg > 0 ? `${fcfa(p.prix / p.poidsKg)} / kg` : 'forfait'}</td>
      <td className="text-nowrap">
        {[1, 2, 3].map((ph) => (
          <label key={ph} className="form-check form-check-inline mb-0" title={PHASES[ph]}>
            <input type="checkbox" className="form-check-input" checked={p.phases.includes(ph)} onChange={() => basculerPhase(ph)} />
            <span className="form-check-label">{ph}</span>
          </label>
        ))}
      </td>
      <td className="text-end text-nowrap">
        <button className="btn btn-sm btn-primary me-2" disabled={!modifie || !p.nom} onClick={enregistrer}>
          {p.id ? 'Enregistrer' : 'Ajouter'}
        </button>
        {p.id && <BoutonSupprimer url={`/produits/${p.id}`} confirmation={`Supprimer ${p.nom} ?`} apres={apres} />}
      </td>
    </tr>
  )
}

export default function Parametres() {
  const produits = useCharger<Produit[]>('/produits')

  return (
    <>
      <h1 className="titre-page">Paramètres — produits et prix</h1>
      <p className="text-body-secondary">
        Prix en FCFA par unité. « Poids » = kilos contenus dans une unité (sac de 50 kg → 50 ; tonne → 1000 ; mettez 0 pour un forfait comme la
        manutention). Les cases 1, 2, 3 indiquent les étapes d'aliment qui utilisent le produit. Un changement de prix ne modifie pas les
        mélanges déjà enregistrés.
      </p>
      <div className="card">
        <div className="table-responsive">
          <table className="table align-middle mb-0">
            <thead>
              <tr>
                <th>Produit</th>
                <th>Unité</th>
                <th>Prix (F)</th>
                <th>Poids (kg)</th>
                <th className="text-end">Prix au kg</th>
                <th>Étapes</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {(produits.donnees ?? []).map((p) => (
                <LigneProduit key={`${p.id}-${JSON.stringify(p)}`} initial={p} apres={produits.recharger} />
              ))}
              <LigneProduit key="nouveau" initial={NOUVEAU} apres={produits.recharger} />
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
