import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import { api, messageErreur } from '../api'
import { useBande } from '../BandeContext'
import BoutonSupprimer from '../composants/BoutonSupprimer'
import SansBande from '../composants/SansBande'
import { aujourdhui, dateFr, fcfa, nombre, TYPES_ALIMENT } from '../format'
import type { BandeDetail, Depense, Unite } from '../types'
import { useCharger } from '../useCharger'

interface Suggestion {
  designation: string
  unite: string
  prixUnitaire: number
}

/** Achats d'une bande : vaccins, médicaments, nettoyage… (+ poussins et sacs en lecture). */
export default function Achats() {
  const { bande, rafraichirBandes } = useBande()
  const fiche = useCharger<BandeDetail>(bande ? `/bandes/${bande.id}` : null)
  const suggestions = useCharger<Suggestion[]>('/depenses/designations')
  const unites = useCharger<Unite[]>('/unites')
  const [date, setDate] = useState(aujourdhui())
  const [designation, setDesignation] = useState('')
  const [quantite, setQuantite] = useState('1')
  const [unite, setUnite] = useState('unité')
  const [prix, setPrix] = useState('')
  const [envoi, setEnvoi] = useState(false)

  if (!bande) return <SansBande />

  const montant = Math.round((Number(quantite) || 0) * (Number(prix) || 0))

  // Une désignation déjà connue reprend son unité et son dernier prix
  function choisirDesignation(valeur: string) {
    setDesignation(valeur)
    const s = suggestions.donnees?.find((x) => x.designation.toLowerCase() === valeur.toLowerCase())
    if (s) {
      setUnite(s.unite)
      setPrix(String(s.prixUnitaire))
    }
  }

  function recharger() {
    void fiche.recharger()
    void suggestions.recharger()
    void rafraichirBandes()
  }

  async function enregistrer(e: FormEvent) {
    e.preventDefault()
    if (!bande) return
    setEnvoi(true)
    try {
      const res = await api.post<Depense>('/depenses', { date, bandeId: bande.id, designation, quantite, unite, prixUnitaire: prix })
      toast.success(`${res.data.designation} : ${fcfa(res.data.montant)}`)
      setDesignation('')
      setQuantite('1')
      setPrix('')
      recharger()
    } catch (err) {
      toast.error(messageErreur(err))
    } finally {
      setEnvoi(false)
    }
  }

  const lignes = fiche.donnees?.lignesAchats ?? []
  const total = lignes.reduce((t, l) => t + l.montant, 0)

  return (
    <>
      <h1 className="titre-page">Achats — {bande.nom}</h1>

      <form className="card mb-4" onSubmit={enregistrer}>
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-6 col-md-2">
              <label className="form-label">Date</label>
              <input type="date" className="form-control" value={date} min={bande.dateArrivee} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div className="col-12 col-md-4">
              <label className="form-label">Produit / désignation</label>
              <input
                className="form-control"
                value={designation}
                onChange={(e) => choisirDesignation(e.target.value)}
                list="designations"
                placeholder="Vaccin, Doxylin, nettoyage, charbon…"
                required
              />
              <datalist id="designations">
                {(suggestions.donnees ?? []).map((s) => (
                  <option key={s.designation} value={s.designation} />
                ))}
              </datalist>
            </div>
            <div className="col-6 col-md-2">
              <label className="form-label">Quantité</label>
              <div className="input-group">
                <input type="number" min="0" step="any" className="form-control" value={quantite} onChange={(e) => setQuantite(e.target.value)} required />
                <select className="form-select" value={unite} onChange={(e) => setUnite(e.target.value)} aria-label="Unité" style={{ maxWidth: 110 }}>
                  {(unites.donnees ?? []).map((u) => (
                    <option key={u.id}>{u.nom}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="col-6 col-md-2">
              <label className="form-label">Prix unitaire</label>
              <input type="number" min="0" step="any" className="form-control" value={prix} onChange={(e) => setPrix(e.target.value)} required />
            </div>
            <div className="col-12 col-md-2 text-end">
              <div className="total-auto mb-2">
                <strong>{fcfa(montant)}</strong>
              </div>
              <button className="btn btn-success" disabled={envoi}>
                Ajouter
              </button>
            </div>
          </div>
          <p className="small text-body-secondary mt-3 mb-0">
            Les poussins viennent de la <Link to="/bandes">bande</Link> et les sacs d'aliment des <Link to="/aliments">distributions</Link> : ils
            s'ajoutent tout seuls ci-dessous.
          </p>
        </div>
      </form>

      <div className="card">
        <div className="table-responsive">
          <table className="table table-hover table-fiche align-middle mb-0">
            <thead>
              <tr>
                <th>Produits</th>
                <th className="text-end">Qté</th>
                <th className="text-end">Prix unit.</th>
                <th className="text-end">Total</th>
                <th>Date</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {lignes.map((l, i) => (
                <tr key={l.id ?? `${l.source}-${i}`}>
                  <td>
                    {l.source === 'sacs' && l.typeAliment ? (
                      <span className={`badge badge-${l.typeAliment}`}>Sacs {TYPES_ALIMENT[l.typeAliment]}</span>
                    ) : (
                      l.designation
                    )}
                  </td>
                  <td className="text-end">
                    {nombre(l.quantite)} <span className="text-body-secondary small">{l.unite}</span>
                  </td>
                  <td className="text-end">{fcfa(l.prixUnitaire)}</td>
                  <td className="text-end fw-semibold">{fcfa(l.montant)}</td>
                  <td className="text-body-secondary small">{l.source === 'sacs' ? 'plusieurs' : dateFr(l.date)}</td>
                  <td className="text-end">
                    {l.source === 'depense' && l.id && (
                      <BoutonSupprimer url={`/depenses/${l.id}`} confirmation={`Supprimer ${l.designation} ?`} apres={recharger} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3}>Prix achats</td>
                <td className="text-end">{fcfa(total)}</td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </>
  )
}
