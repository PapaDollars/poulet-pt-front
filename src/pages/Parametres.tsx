import { useState, type FormEvent } from 'react'
import { toast } from 'react-toastify'
import { api, messageErreur } from '../api'
import BoutonSupprimer from '../composants/BoutonSupprimer'
import type { Produit, Unite } from '../types'
import { useCharger } from '../useCharger'

type Brouillon = Omit<Produit, 'id'> & { id?: string }

const NOUVEAU: Brouillon = { nom: '', unite: 'kg', prix: 0 }

function LigneProduit({ initial, unites, apres }: { initial: Brouillon; unites: Unite[]; apres: () => void }) {
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

  return (
    <tr>
      <td>
        <input className="form-control form-control-sm" value={p.nom} onChange={(e) => setP({ ...p, nom: e.target.value })} placeholder="Nouveau produit" />
      </td>
      <td style={{ width: 150 }}>
        <select className="form-select form-select-sm" value={p.unite} onChange={(e) => setP({ ...p, unite: e.target.value })}>
          {!unites.some((u) => u.nom === p.unite) && <option>{p.unite}</option>}
          {unites.map((u) => (
            <option key={u.id}>{u.nom}</option>
          ))}
        </select>
      </td>
      <td style={{ width: 160 }}>
        <input type="number" min="0" step="any" className="form-control form-control-sm" value={p.prix} onChange={(e) => setP({ ...p, prix: Number(e.target.value) })} />
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
  const unites = useCharger<Unite[]>('/unites')
  const [nouvelleUnite, setNouvelleUnite] = useState('')

  async function ajouterUnite(e: FormEvent) {
    e.preventDefault()
    try {
      await api.post('/unites', { nom: nouvelleUnite })
      toast.success(`Unité « ${nouvelleUnite} » ajoutée`)
      setNouvelleUnite('')
      void unites.recharger()
    } catch (err) {
      toast.error(messageErreur(err))
    }
  }

  return (
    <>
      <h1 className="titre-page">Paramètres</h1>

      <div className="row g-4">
        <div className="col-12 col-xl-8">
          <h2 className="h5">Produits</h2>
          <p className="text-body-secondary small">
            Prix de référence en FCFA par unité : il est proposé quand on achète le produit. Dans les mélanges, le prix proposé est le coût réel du
            stock (achat + transport).
          </p>
          <div className="card">
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead>
                  <tr>
                    <th>Produit</th>
                    <th>Unité</th>
                    <th>Prix de référence (F)</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {(produits.donnees ?? []).map((p) => (
                    <LigneProduit key={`${p.id}-${JSON.stringify(p)}`} initial={p} unites={unites.donnees ?? []} apres={produits.recharger} />
                  ))}
                  <LigneProduit key="nouveau" initial={NOUVEAU} unites={unites.donnees ?? []} apres={produits.recharger} />
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-4">
          <h2 className="h5">Unités</h2>
          <p className="text-body-secondary small">Unités proposées pour les produits, les achats des bandes et les lignes libres des mélanges.</p>
          <div className="card">
            <div className="card-body">
              <form className="input-group mb-3" onSubmit={ajouterUnite}>
                <input className="form-control" value={nouvelleUnite} onChange={(e) => setNouvelleUnite(e.target.value)} placeholder="ex. seau, carton…" required />
                <button className="btn btn-primary">Ajouter</button>
              </form>
              <div className="d-flex flex-wrap gap-2">
                {(unites.donnees ?? []).map((u) => (
                  <span key={u.id} className="badge text-bg-light border d-inline-flex align-items-center gap-2 fs-6 fw-normal">
                    {u.nom}
                    <BoutonSupprimer url={`/unites/${u.id}`} confirmation={`Supprimer l'unité « ${u.nom} » ?`} apres={unites.recharger} />
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
