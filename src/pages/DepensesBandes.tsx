import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import { api, messageErreur } from '../api'
import { useBande } from '../BandeContext'
import FiltreBandes from '../composants/FiltreBandes'
import { aujourdhui, dateFr, fcfa, nombre } from '../format'
import type { Depense, StockAchat } from '../types'
import { useCharger } from '../useCharger'
import ModifierDepenseModal from './ModifierDepenseModal'

/** Affecter en groupe des produits achetés (vaccins, médicaments…) à une bande : ce sont ses dépenses. */
export default function DepensesBandes() {
  const { bandes, bande: bandeActive, rafraichirBandes } = useBande()
  const stock = useCharger<StockAchat[]>('/achats/stock')
  const [filtre, setFiltre] = useState('')
  const depenses = useCharger<Depense[]>(filtre ? `/depenses?bandeId=${filtre}` : '/depenses')
  const enCours = bandes.filter((b) => b.vivants > 0)

  const [date, setDate] = useState(aujourdhui())
  const [bandeId, setBandeId] = useState('')
  // Produits cochés → quantité saisie
  const [choix, setChoix] = useState<Record<string, string>>({})
  const [envoi, setEnvoi] = useState(false)
  const [aModifier, setAModifier] = useState<Depense | null>(null)

  const cible = bandeId || (bandeActive && bandeActive.vivants > 0 ? bandeActive.id : enCours[0]?.id) || ''
  const disponibles = (stock.donnees ?? []).filter((p) => p.restant > 0)
  const coches = disponibles.filter((p) => choix[p.produitId] !== undefined)
  const tousCoches = disponibles.length > 0 && coches.length === disponibles.length
  // Estimation au prix proposé (le prix exact est celui des lots achetés)
  const estimation = coches.reduce((t, p) => t + (Number(choix[p.produitId]) || 0) * p.prix, 0)
  const depassement = coches.some((p) => (Number(choix[p.produitId]) || 0) > p.restant)

  const basculer = (p: StockAchat) =>
    setChoix((c) => {
      const suite = { ...c }
      if (suite[p.produitId] !== undefined) delete suite[p.produitId]
      else suite[p.produitId] = '1'
      return suite
    })

  const toutBasculer = () => setChoix(tousCoches ? {} : Object.fromEntries(disponibles.map((p) => [p.produitId, choix[p.produitId] ?? '1'])))

  function recharger() {
    void stock.recharger()
    void depenses.recharger()
    void rafraichirBandes()
  }

  async function affecter() {
    setEnvoi(true)
    try {
      const lignes = coches.map((p) => ({ produitId: p.produitId, quantite: choix[p.produitId] }))
      const res = await api.post<Depense[]>('/depenses', { date, bandeId: cible, lignes })
      const total = res.data.reduce((t, d) => t + d.montant, 0)
      toast.success(`${coches.length} produit(s) affecté(s) à ${bandes.find((b) => b.id === cible)?.nom} : ${fcfa(total)}`)
      setChoix({})
      recharger()
    } catch (err) {
      toast.error(messageErreur(err))
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <>
      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3 align-items-end mb-3">
            <div className="col-12 col-md-4">
              <label className="form-label">Bande</label>
              <select className="form-select" value={cible} onChange={(e) => setBandeId(e.target.value)}>
                {!enCours.length && <option value="">Aucune bande en cours</option>}
                {enCours.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.nom} — {nombre(b.vivants)} poulets · J{b.age}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-6 col-md-3">
              <label className="form-label">Date</label>
              <input type="date" className="form-control" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="col-6 col-md-5 text-end">
              {disponibles.length > 0 && (
                <button type="button" className="btn btn-outline-secondary" onClick={toutBasculer}>
                  {tousCoches ? 'Tout désélectionner' : 'Tout sélectionner'}
                </button>
              )}
            </div>
          </div>

          {disponibles.length ? (
            <div className="grille-produits">
              {disponibles.map((p) => {
                const coche = choix[p.produitId] !== undefined
                const q = Number(choix[p.produitId]) || 0
                return (
                  <div key={p.produitId} className={`card carte-produit ${coche ? 'selectionnee' : ''}`}>
                    <div className="card-body">
                      <label className="d-flex gap-2 align-items-start mb-1" role="button">
                        <input type="checkbox" className="form-check-input mt-1" checked={coche} onChange={() => basculer(p)} />
                        <span className="fw-semibold lh-sm">
                          {p.nom}
                          {p.details && <span className="d-block small fw-normal text-body-secondary">{p.details}</span>}
                        </span>
                      </label>
                      <div className="small text-body-secondary">
                        Reste <strong className="text-body">{nombre(coche ? Math.max(p.restant - q, 0) : p.restant)}</strong> / {nombre(p.restant)} {p.unite}
                      </div>
                      {coche && (
                        <div className="input-group input-group-sm mt-2">
                          <input
                            type="number"
                            min="0"
                            max={p.restant}
                            step="any"
                            className={`form-control ${q > p.restant ? 'is-invalid' : ''}`}
                            value={choix[p.produitId]}
                            onChange={(e) => setChoix((c) => ({ ...c, [p.produitId]: e.target.value }))}
                            aria-label={`Quantité de ${p.nom}`}
                          />
                          <span className="input-group-text">{p.unite}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-body-secondary mb-0">
              Aucun produit en stock. <Link to="/achats">Achetez des produits</Link> pour les affecter aux bandes.
            </p>
          )}

          <div className="d-flex flex-wrap align-items-center gap-3 mt-3">
            <div className="apercu flex-grow-1">
              {coches.length ? (
                <>
                  <strong>{coches.length}</strong> produit(s) sélectionné(s) · environ <strong>{fcfa(estimation)}</strong>
                  {depassement && <span className="texte-negatif fw-semibold"> · quantité supérieure au stock</span>}
                </>
              ) : (
                'Cochez les produits à affecter à la bande'
              )}
            </div>
            <button className="btn btn-success" onClick={affecter} disabled={envoi || !coches.length || !cible || depassement}>
              Affecter à la bande
            </button>
          </div>
        </div>
      </div>

      <h2 className="h5 mb-3">Dépenses des bandes</h2>
      <FiltreBandes valeur={filtre} changer={setFiltre} />
      <div className="card">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead>
              <tr>
                <th>Date</th>
                <th>Bande</th>
                <th>Produit</th>
                <th className="text-end">Quantité</th>
                <th className="text-end">Prix unit.</th>
                <th className="text-end">Montant</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {(depenses.donnees ?? []).map((d) => (
                <tr key={d.id}>
                  <td>{dateFr(d.date)}</td>
                  <td>{d.bandeNom ?? '—'}</td>
                  <td>
                    {d.nom ?? d.designation} {d.details && <span className="text-body-secondary small">· {d.details}</span>}
                  </td>
                  <td className="text-end">
                    {nombre(d.quantite)} <span className="text-body-secondary small">{d.unite}</span>
                  </td>
                  <td className="text-end">{fcfa(d.prixUnitaire)}</td>
                  <td className="text-end fw-semibold">{fcfa(d.montant)}</td>
                  <td className="text-end text-nowrap">
                    <button className="btn btn-sm btn-outline-secondary" onClick={() => setAModifier(d)}>
                      Modifier
                    </button>
                  </td>
                </tr>
              ))}
              {!depenses.chargement && !depenses.donnees?.length && (
                <tr>
                  <td colSpan={7} className="text-center text-body-secondary py-4">
                    Aucune dépense
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {aModifier && (
        <ModifierDepenseModal
          depense={aModifier}
          bandes={bandes}
          fermer={() => setAModifier(null)}
          apres={recharger}
        />
      )}
    </>
  )
}
