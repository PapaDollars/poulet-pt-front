import { faRotateLeft } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Fragment, useState, type FormEvent } from 'react'
import { toast } from 'react-toastify'
import { api, messageErreur } from '../api'
import { useBande } from '../BandeContext'
import BoutonSupprimer from '../composants/BoutonSupprimer'
import Carte from '../composants/Carte'
import SansBande from '../composants/SansBande'
import { aujourdhui, dateFr, fcfa, kg, nombre, PHASES } from '../format'
import type { LigneStock, Melange, Produit } from '../types'
import { useCharger } from '../useCharger'

// Prix d'une unité de saisie : le kg pour les produits pesés, le forfait sinon
const prixSaisie = (p: Produit) => (p.poidsKg > 0 ? p.prix / p.poidsKg : p.prix)

export default function Aliments() {
  const { bande, rafraichirBandes } = useBande()
  const produits = useCharger<Produit[]>('/produits')
  const stock = useCharger<LigneStock[]>('/tableau-de-bord/stock')
  const melanges = useCharger<Melange[]>(bande ? `/melanges?bandeId=${bande.id}` : null)
  const [phase, setPhase] = useState(1)
  const [date, setDate] = useState(aujourdhui())
  const [quantites, setQuantites] = useState<Record<string, string>>({})
  const [ouvert, setOuvert] = useState<string | null>(null)
  const [envoi, setEnvoi] = useState(false)

  if (!bande) return <SansBande />

  // Produits de l'étape choisie (l'étape 1 contient le Sodia, les étapes 2 et 3 non)
  const composition = (produits.donnees ?? []).filter((p) => p.phases.includes(phase))
  const quantite = (p: Produit) => Number(quantites[p.id] ?? (p.poidsKg === 0 ? 1 : 0)) || 0
  const lignes = composition.map((p) => ({ p, q: quantite(p), montant: Math.round(quantite(p) * prixSaisie(p)) }))
  const poidsTotal = lignes.reduce((t, l) => t + (l.p.poidsKg > 0 ? l.q : 0), 0)
  const coutTotal = lignes.reduce((t, l) => t + l.montant, 0)
  const vivants = Math.max(bande.vivants, 1)

  const dernierDeLEtape = melanges.donnees?.find((m) => m.phase === phase)

  function reprendreDernier() {
    if (!dernierDeLEtape) return
    setQuantites(Object.fromEntries(dernierDeLEtape.lignes.map((l) => [l.produitId, String(l.quantite)])))
  }

  async function enregistrer(e: FormEvent) {
    e.preventDefault()
    if (!bande) return
    setEnvoi(true)
    try {
      const res = await api.post<Melange>('/melanges', {
        date,
        bandeId: bande.id,
        phase,
        lignes: lignes.map((l) => ({ produitId: l.p.id, quantite: l.q })),
      })
      toast.success(`Mélange enregistré : ${kg(res.data.poidsTotalKg)} pour ${fcfa(res.data.montant)}`)
      if (res.data.avertissement) toast.warning(res.data.avertissement)
      setQuantites({})
      void melanges.recharger()
      void stock.recharger()
      void rafraichirBandes()
    } catch (err) {
      toast.error(messageErreur(err))
    } finally {
      setEnvoi(false)
    }
  }

  const totauxParPhase = [1, 2, 3].map((ph) => {
    const liste = (melanges.donnees ?? []).filter((m) => m.phase === ph)
    return { ph, kg: liste.reduce((t, m) => t + m.poidsTotalKg, 0), montant: liste.reduce((t, m) => t + m.montant, 0) }
  })

  return (
    <>
      <h1 className="titre-page">Aliments — {bande.nom}</h1>

      <div className="row g-3 mb-4">
        {totauxParPhase.map((t) => (
          <div className="col-12 col-md-4" key={t.ph}>
            <Carte titre={PHASES[t.ph]} valeur={fcfa(t.montant)} detail={`${kg(t.kg)} mélangés`} />
          </div>
        ))}
      </div>

      <form className="card mb-4" onSubmit={enregistrer}>
        <div className="card-body">
          <div className="row g-3 align-items-end mb-3">
            <div className="col-12 col-md-5">
              <label className="form-label">Étape</label>
              <select
                className="form-select"
                value={phase}
                onChange={(e) => {
                  setPhase(Number(e.target.value))
                  setQuantites({})
                }}
              >
                {[1, 2, 3].map((ph) => (
                  <option key={ph} value={ph}>
                    {PHASES[ph]}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-6 col-md-3">
              <label className="form-label">Date</label>
              <input type="date" className="form-control" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div className="col-6 col-md-4 text-end">
              <button type="button" className="btn btn-outline-secondary" onClick={reprendreDernier} disabled={!dernierDeLEtape}>
                <FontAwesomeIcon icon={faRotateLeft} /> Reprendre le dernier mélange
              </button>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table align-middle">
              <thead>
                <tr>
                  <th>Produit</th>
                  <th className="text-end">Prix</th>
                  <th className="text-end">En stock</th>
                  <th style={{ width: 160 }}>Quantité</th>
                  <th className="text-end">Coût</th>
                </tr>
              </thead>
              <tbody>
                {lignes.map(({ p, q, montant }) => {
                  const s = stock.donnees?.find((x) => x.produitId === p.id)
                  const manque = s && p.poidsKg > 0 && q > s.stockKg
                  return (
                    <tr key={p.id}>
                      <td>{p.nom}</td>
                      <td className="text-end text-body-secondary">
                        {fcfa(prixSaisie(p))} / {p.poidsKg > 0 ? 'kg' : p.unite}
                      </td>
                      <td className={`text-end ${manque ? 'text-danger fw-semibold' : 'text-body-secondary'}`}>
                        {p.poidsKg > 0 ? kg(s?.stockKg ?? 0) : '—'}
                      </td>
                      <td>
                        <div className="input-group input-group-sm">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            className="form-control"
                            value={quantites[p.id] ?? (p.poidsKg === 0 ? '1' : '')}
                            onChange={(e) => setQuantites((x) => ({ ...x, [p.id]: e.target.value }))}
                            placeholder="0"
                          />
                          <span className="input-group-text">{p.poidsKg > 0 ? 'kg' : p.unite}</span>
                        </div>
                      </td>
                      <td className="text-end fw-semibold">{fcfa(montant)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="row g-3 resume-melange">
            <div className="col-6 col-md-3">
              <div className="carte-titre">Poids total</div>
              <div className="fw-bold fs-5">{kg(poidsTotal)}</div>
            </div>
            <div className="col-6 col-md-3">
              <div className="carte-titre">Dépense du mélange</div>
              <div className="fw-bold fs-5">{fcfa(coutTotal)}</div>
            </div>
            <div className="col-6 col-md-3">
              <div className="carte-titre">Prix de revient / kg</div>
              <div className="fw-bold fs-5">{poidsTotal ? fcfa(coutTotal / poidsTotal) : '—'}</div>
            </div>
            <div className="col-6 col-md-3">
              <div className="carte-titre">Par poulet ({nombre(bande.vivants)} vivants)</div>
              <div className="fw-bold fs-5">
                {fcfa(coutTotal / vivants)} · {kg(Math.round((poidsTotal / vivants) * 1000) / 1000)}
              </div>
            </div>
          </div>

          <div className="text-end mt-3">
            <button className="btn btn-success" disabled={envoi || coutTotal === 0}>
              Enregistrer le mélange
            </button>
          </div>
        </div>
      </form>

      <h2 className="h5 mb-3">Historique des mélanges</h2>
      <div className="card">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead>
              <tr>
                <th>Date</th>
                <th>Étape</th>
                <th className="text-end">Poids</th>
                <th className="text-end">Dépense</th>
                <th className="text-end">Prix / kg</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {(melanges.donnees ?? []).map((m) => (
                <Fragment key={m.id}>
                  <tr className="ligne-cliquable" onClick={() => setOuvert(ouvert === m.id ? null : m.id)}>
                    <td>{dateFr(m.date)}</td>
                    <td>{PHASES[m.phase]}</td>
                    <td className="text-end">{kg(m.poidsTotalKg)}</td>
                    <td className="text-end fw-semibold">{fcfa(m.montant)}</td>
                    <td className="text-end">{m.poidsTotalKg ? fcfa(m.montant / m.poidsTotalKg) : '—'}</td>
                    <td className="text-end" onClick={(e) => e.stopPropagation()}>
                      <BoutonSupprimer
                        url={`/melanges/${m.id}`}
                        confirmation="Supprimer ce mélange ? Le stock sera recrédité."
                        apres={() => {
                          void melanges.recharger()
                          void stock.recharger()
                          void rafraichirBandes()
                        }}
                      />
                    </td>
                  </tr>
                  {ouvert === m.id && (
                    <tr>
                      <td colSpan={6} className="bg-body-tertiary">
                        <ul className="mb-0 small">
                          {m.lignes.map((l) => (
                            <li key={l.produitId}>
                              {l.nom} : {nombre(l.quantite)} {l.unite} × {fcfa(l.prixUnitaire)} = <strong>{fcfa(l.montant)}</strong>
                            </li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
              {!melanges.chargement && !melanges.donnees?.length && (
                <tr>
                  <td colSpan={6} className="text-center text-body-secondary py-4">
                    Aucun mélange pour cette bande
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
