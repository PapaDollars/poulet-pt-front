import { useMemo, useState, type FormEvent } from 'react'
import { toast } from 'react-toastify'
import { api, messageErreur } from '../api'
import { useBande } from '../BandeContext'
import BoutonSupprimer from '../composants/BoutonSupprimer'
import Carte from '../composants/Carte'
import { aujourdhui, CATEGORIES, dateFr, fcfa, nombre } from '../format'
import type { Achat, Categorie, Produit } from '../types'
import { useCharger } from '../useCharger'

const VIDE = { produitId: '', unite: 'produit', quantite: '', prixUnitaire: '', designation: '', uniteLibre: '', nomBande: '' }

export default function Achats() {
  const { bande, rafraichirBandes, choisirBande } = useBande()
  const achats = useCharger<Achat[]>('/achats')
  const produits = useCharger<Produit[]>('/produits')
  const [categorie, setCategorie] = useState<Categorie>('aliment')
  const [date, setDate] = useState(aujourdhui())
  const [champs, setChamps] = useState(VIDE)
  const [envoi, setEnvoi] = useState(false)

  const produitsStockables = (produits.donnees ?? []).filter((p) => p.poidsKg > 0)
  const produit = produitsStockables.find((p) => p.id === champs.produitId)
  const enKg = champs.unite === 'kg'

  // Prix proposé automatiquement à partir du catalogue (modifiable)
  const prixAuto = produit ? (enKg ? produit.prix / produit.poidsKg : produit.prix) : 0
  const prix = champs.prixUnitaire === '' ? (categorie === 'aliment' ? prixAuto : 0) : Number(champs.prixUnitaire)
  const quantite = Number(champs.quantite) || 0
  const montant = Math.round(quantite * prix)

  const maj = (cle: keyof typeof VIDE) => (e: { target: { value: string } }) => setChamps((c) => ({ ...c, [cle]: e.target.value }))

  const totaux = useMemo(() => {
    const t: Record<string, number> = { aliment: 0, poussins: 0, medicament: 0, autre: 0 }
    for (const a of achats.donnees ?? []) t[a.categorie] += a.montant
    return t
  }, [achats.donnees])

  async function enregistrer(e: FormEvent) {
    e.preventDefault()
    setEnvoi(true)
    try {
      const corps = {
        categorie,
        date,
        quantite: champs.quantite,
        prixUnitaire: champs.prixUnitaire,
        ...(categorie === 'aliment' && { produitId: champs.produitId, unite: enKg ? 'kg' : 'produit' }),
        ...(categorie === 'poussins' && { nomBande: champs.nomBande }),
        ...((categorie === 'medicament' || categorie === 'autre') && {
          designation: champs.designation,
          unite: champs.uniteLibre,
          bandeId: bande?.id ?? null,
        }),
      }
      const res = await api.post<Achat>('/achats', corps)
      toast.success(`Achat enregistré : ${fcfa(res.data.montant)}`)
      setChamps({ ...VIDE, produitId: champs.produitId, unite: champs.unite })
      void achats.recharger()
      if (categorie === 'poussins' && res.data.bandeId) {
        await rafraichirBandes()
        choisirBande(res.data.bandeId)
      } else {
        void rafraichirBandes()
      }
    } catch (err) {
      toast.error(messageErreur(err))
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <>
      <h1 className="titre-page">Achats</h1>

      <div className="row g-3 mb-4">
        {Object.entries(CATEGORIES).map(([cle, libelle]) => (
          <div className="col-6 col-xl-3" key={cle}>
            <Carte titre={`Total ${libelle.toLowerCase()}`} valeur={fcfa(totaux[cle])} />
          </div>
        ))}
      </div>

      <form className="card mb-4" onSubmit={enregistrer}>
        <div className="card-body">
          <div className="btn-group mb-3 flex-wrap" role="group" aria-label="Type d'achat">
            {(Object.keys(CATEGORIES) as Categorie[]).map((c) => (
              <button
                type="button"
                key={c}
                className={`btn ${categorie === c ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => {
                  setCategorie(c)
                  setChamps(VIDE)
                }}
              >
                {CATEGORIES[c]}
              </button>
            ))}
          </div>

          <div className="row g-3 align-items-end">
            <div className="col-6 col-md-2">
              <label className="form-label">Date</label>
              <input type="date" className="form-control" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>

            {categorie === 'aliment' && (
              <>
                <div className="col-6 col-md-3">
                  <label className="form-label">Produit</label>
                  <select className="form-select" value={champs.produitId} onChange={maj('produitId')} required>
                    <option value="">Choisir…</option>
                    {produitsStockables.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nom}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-6 col-md-2">
                  <label className="form-label">Acheté en</label>
                  <select className="form-select" value={champs.unite} onChange={maj('unite')}>
                    <option value="produit">{produit && produit.unite !== 'kg' ? `${produit.unite} (${produit.poidsKg} kg)` : 'unité du produit'}</option>
                    <option value="kg">kg</option>
                  </select>
                </div>
              </>
            )}

            {categorie === 'poussins' && (
              <div className="col-12 col-md-3">
                <label className="form-label">Nom de la bande</label>
                <input className="form-control" value={champs.nomBande} onChange={maj('nomBande')} placeholder="Automatique (Bande N)" />
              </div>
            )}

            {(categorie === 'medicament' || categorie === 'autre') && (
              <>
                <div className="col-12 col-md-3">
                  <label className="form-label">Désignation</label>
                  <input
                    className="form-control"
                    value={champs.designation}
                    onChange={maj('designation')}
                    placeholder={categorie === 'medicament' ? 'Vaccin, vitamines…' : 'Litière, transport…'}
                    required
                  />
                </div>
                <div className="col-6 col-md-1">
                  <label className="form-label">Unité</label>
                  <input className="form-control" value={champs.uniteLibre} onChange={maj('uniteLibre')} placeholder="flacon" />
                </div>
              </>
            )}

            <div className="col-6 col-md-2">
              <label className="form-label">{categorie === 'poussins' ? 'Nombre' : 'Quantité'}</label>
              <input
                type="number"
                min="0"
                step={categorie === 'poussins' ? 1 : 'any'}
                className="form-control"
                value={champs.quantite}
                onChange={maj('quantite')}
                required
              />
            </div>
            <div className="col-6 col-md-2">
              <label className="form-label">{categorie === 'poussins' ? 'Prix / poussin' : 'Prix unitaire'}</label>
              <input
                type="number"
                min="0"
                step="any"
                className="form-control"
                value={champs.prixUnitaire}
                onChange={maj('prixUnitaire')}
                placeholder={categorie === 'aliment' && produit ? String(Math.round(prixAuto * 100) / 100) : ''}
                required={categorie !== 'aliment'}
              />
            </div>
          </div>

          <div className="d-flex flex-wrap align-items-center gap-3 mt-3">
            <div className="total-auto">
              Montant : <strong>{fcfa(montant)}</strong>
              {categorie === 'aliment' && produit && quantite > 0 && (
                <span className="text-body-secondary"> · {nombre(enKg ? quantite : quantite * produit.poidsKg)} kg en stock</span>
              )}
              {(categorie === 'medicament' || categorie === 'autre') && bande && (
                <span className="text-body-secondary"> · imputé à {bande.nom}</span>
              )}
            </div>
            <button className="btn btn-success ms-auto" disabled={envoi}>
              Enregistrer l'achat
            </button>
          </div>
        </div>
      </form>

      <div className="card">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Désignation</th>
                <th className="text-end">Quantité</th>
                <th className="text-end">Prix unitaire</th>
                <th className="text-end">Montant</th>
                <th>Bande</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {(achats.donnees ?? []).map((a) => (
                <tr key={a.id}>
                  <td>{dateFr(a.date)}</td>
                  <td>
                    <span className={`badge badge-${a.categorie}`}>{CATEGORIES[a.categorie]}</span>
                  </td>
                  <td>{a.designation}</td>
                  <td className="text-end">
                    {nombre(a.quantite)} {a.unite}
                  </td>
                  <td className="text-end">{fcfa(a.prixUnitaire)}</td>
                  <td className="text-end fw-semibold">{fcfa(a.montant)}</td>
                  <td>{a.bandeNom ?? '—'}</td>
                  <td className="text-end">
                    <BoutonSupprimer
                      url={`/achats/${a.id}`}
                      confirmation={a.categorie === 'poussins' ? 'Supprimer cet achat et la bande associée ?' : 'Supprimer cet achat ?'}
                      apres={() => {
                        void achats.recharger()
                        void rafraichirBandes()
                      }}
                    />
                  </td>
                </tr>
              ))}
              {!achats.chargement && !achats.donnees?.length && (
                <tr>
                  <td colSpan={8} className="text-center text-body-secondary py-4">
                    Aucun achat enregistré
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
