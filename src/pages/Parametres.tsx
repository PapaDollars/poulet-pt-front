import { useState, type FormEvent } from 'react'
import { toast } from 'react-toastify'
import { api, messageErreur } from '../api'
import BoutonSupprimer from '../composants/BoutonSupprimer'
import type { CategorieProduit, Produit, Unite } from '../types'
import { useCharger } from '../useCharger'

type Brouillon = Omit<Produit, 'id'> & { id?: string }

const nouveau = (categorie: CategorieProduit): Brouillon => ({
  nom: '',
  categorie,
  details: '',
  unite: categorie === 'aliment' ? 'kg' : 'flacon',
  prix: 0,
  vendable: false,
})

function LigneProduit({ initial, unites, apres }: { initial: Brouillon; unites: Unite[]; apres: () => void }) {
  const [p, setP] = useState(initial)
  const modifie = JSON.stringify(p) !== JSON.stringify(initial)
  const aliment = p.categorie === 'aliment'

  async function enregistrer() {
    try {
      if (p.id) await api.put(`/produits/${p.id}`, p)
      else await api.post('/produits', p)
      toast.success(`${p.nom} enregistré`)
      if (!p.id) setP(nouveau(p.categorie))
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
      {!aliment && (
        <td>
          <input
            className="form-control form-control-sm"
            value={p.details ?? ''}
            onChange={(e) => setP({ ...p, details: e.target.value })}
            placeholder="Facultatif"
          />
        </td>
      )}
      <td style={{ width: 140 }}>
        <select className="form-select form-select-sm" value={p.unite} onChange={(e) => setP({ ...p, unite: e.target.value })}>
          {!unites.some((u) => u.nom === p.unite) && <option>{p.unite}</option>}
          {unites.map((u) => (
            <option key={u.id}>{u.nom}</option>
          ))}
        </select>
      </td>
      <td style={{ width: 140 }}>
        <input type="number" min="0" step="any" className="form-control form-control-sm" value={p.prix} onChange={(e) => setP({ ...p, prix: Number(e.target.value) })} />
      </td>
      {aliment && (
        <td className="text-center">
          <input
            type="checkbox"
            className="form-check-input"
            checked={Boolean(p.vendable)}
            onChange={(e) => setP({ ...p, vendable: e.target.checked })}
            aria-label="Géré en stock et revendu"
          />
        </td>
      )}
      <td className="text-end text-nowrap">
        {/* Bleu tant qu'il y a des changements à enregistrer, clair sinon */}
        <button className={`btn btn-sm me-2 ${modifie ? 'btn-primary' : 'btn-light'}`} disabled={!modifie || !p.nom} onClick={enregistrer}>
          {p.id ? 'Enregistrer' : 'Ajouter'}
        </button>
        {p.id && <BoutonSupprimer url={`/produits/${p.id}`} confirmation={`Supprimer ${p.nom} ?`} apres={apres} />}
      </td>
    </tr>
  )
}

function TableProduits({ categorie, produits, unites, apres }: { categorie: CategorieProduit; produits: Produit[]; unites: Unite[]; apres: () => void }) {
  const aliment = categorie === 'aliment'
  return (
    <div className="card mb-4">
      <div className="table-responsive">
        <table className="table align-middle mb-0">
          <thead>
            <tr>
              <th>Produit</th>
              {!aliment && <th>Détails</th>}
              <th>Unité</th>
              <th>Prix (F)</th>
              {aliment && <th className="text-center">En stock (se vend)</th>}
              <th />
            </tr>
          </thead>
          <tbody>
            {produits
              .filter((p) => p.categorie === categorie)
              .map((p) => (
                <LigneProduit key={`${p.id}-${JSON.stringify(p)}`} initial={p} unites={unites} apres={apres} />
              ))}
            <LigneProduit key={`nouveau-${categorie}`} initial={nouveau(categorie)} unites={unites} apres={apres} />
          </tbody>
        </table>
      </div>
    </div>
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

  const liste = produits.donnees ?? []
  const listeUnites = unites.donnees ?? []

  return (
    <>
      <h1 className="titre-page">Paramètres</h1>

      <div className="row g-4">
        <div className="col-12 col-xl-8">
          <h2 className="h5">Produits pour les aliments</h2>
          <p className="text-body-secondary small">
            Matières des mélanges (maïs, Sodia…). Prix en FCFA par unité ; dans les mélanges, c'est le
            prix indiqué ici qui est proposé, sauf pour un produit « En stock » (le maïs) : son coût réel d'achat + transport. « En stock (se vend) » : le produit est
            géré dans la page Stock (entrées, ventes, historique).
          </p>
          <TableProduits categorie="aliment" produits={liste} unites={listeUnites} apres={produits.recharger} />

        </div>

        <div className="col-12 col-xl-4">
          <h2 className="h5">Unités</h2>
          <p className="text-body-secondary small">Unités proposées pour les produits, les achats et les lignes libres des mélanges.</p>
          <div className="card">
            <div className="card-body">
              <form className="input-group mb-3" onSubmit={ajouterUnite}>
                <input className="form-control" value={nouvelleUnite} onChange={(e) => setNouvelleUnite(e.target.value)} placeholder="ex. seau, carton…" required />
                <button className="btn btn-primary">Ajouter</button>
              </form>
              <div className="d-flex flex-wrap gap-2">
                {listeUnites.map((u) => (
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
