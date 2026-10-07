import { useState, type FormEvent } from 'react'
import { toast } from 'react-toastify'
import { api, messageErreur } from '../api'
import BoutonSupprimer from '../composants/BoutonSupprimer'
import Carte from '../composants/Carte'
import { aujourdhui, dateFr, fcfa, nombre } from '../format'
import type { HistoriqueProduit, LigneStock } from '../types'
import { useCharger } from '../useCharger'

type Sens = 'entree' | 'vente'

const LIBELLES = { entree: 'Entrée', vente: 'Vente', melange: 'Mélange' }

/** Stock des produits (maïs, arachide…) : entrées avec transport, ventes avec bénéfice, historique. */
export default function Stock() {
  const stock = useCharger<LigneStock[]>('/stock')
  const [sens, setSens] = useState<Sens>('entree')
  const [produitId, setProduitId] = useState('')
  const [date, setDate] = useState(aujourdhui())
  const [quantite, setQuantite] = useState('')
  const [prix, setPrix] = useState('')
  const [transport, setTransport] = useState('')
  const [tiers, setTiers] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [ouvert, setOuvert] = useState<string | null>(null)
  const historique = useCharger<HistoriqueProduit>(ouvert ? `/stock/${ouvert}/historique` : null)

  const lignes = stock.donnees ?? []
  const produit = lignes.find((p) => p.produitId === produitId)
  const q = Number(quantite) || 0
  const p = Number(prix) || 0
  const t = Number(transport) || 0
  const montant = Math.round(q * p + (sens === 'entree' ? t : 0))
  const coutRevient = sens === 'entree' && q > 0 ? montant / q : 0
  const beneficeVente = sens === 'vente' && produit ? Math.round(q * (p - produit.coutMoyen)) : 0

  function recharger() {
    void stock.recharger()
    if (ouvert) void historique.recharger()
  }

  async function enregistrer(e: FormEvent) {
    e.preventDefault()
    setEnvoi(true)
    try {
      await api.post('/stock/mouvements', {
        type: sens,
        date,
        produitId,
        quantite,
        prixUnitaire: prix,
        ...(sens === 'entree' ? { transport, fournisseur: tiers } : { client: tiers }),
      })
      toast.success(sens === 'entree' ? `Entrée enregistrée : ${fcfa(montant)}` : `Vente enregistrée : bénéfice ${fcfa(beneficeVente)}`)
      setQuantite('')
      setTransport('')
      setTiers('')
      recharger()
    } catch (err) {
      toast.error(messageErreur(err))
    } finally {
      setEnvoi(false)
    }
  }

  const valeur = lignes.reduce((s, l) => s + l.valeur, 0)
  const ventes = lignes.reduce((s, l) => s + l.chiffreAffaires, 0)
  const benefice = lignes.reduce((s, l) => s + l.benefice, 0)

  return (
    <>
      <h1 className="titre-page">Stock des produits</h1>

      <div className="row g-3 mb-4">
        <div className="col-6 col-xl-4">
          <Carte titre="Valeur du stock" valeur={fcfa(valeur)} detail="Au prix d'achat + transport" />
        </div>
        <div className="col-6 col-xl-4">
          <Carte titre="Ventes de produits" valeur={fcfa(ventes)} />
        </div>
        <div className="col-12 col-xl-4">
          <Carte titre="Bénéfice sur ventes" valeur={fcfa(benefice)} ton={benefice >= 0 ? 'positif' : 'negatif'} detail="Les produits mélangés ne rapportent rien (bénéfice 0)" />
        </div>
      </div>

      <form className="card mb-4" onSubmit={enregistrer}>
        <div className="card-body">
          <div className="btn-group mb-3" role="group">
            <button type="button" className={`btn ${sens === 'entree' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setSens('entree')}>
              Entrée (achat)
            </button>
            <button type="button" className={`btn ${sens === 'vente' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setSens('vente')}>
              Retrait (vente)
            </button>
          </div>
          <div className="row g-3 align-items-end">
            <div className="col-6 col-md-2">
              <label className="form-label">Date</label>
              <input type="date" className="form-control" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div className="col-6 col-md-3">
              <label className="form-label">Produit</label>
              <select
                className="form-select"
                value={produitId}
                onChange={(e) => {
                  setProduitId(e.target.value)
                  const choisi = lignes.find((l) => l.produitId === e.target.value)
                  if (choisi && sens === 'entree') setPrix(String(choisi.prixReference))
                }}
                required
              >
                <option value="">Choisir…</option>
                {lignes.map((l) => (
                  <option key={l.produitId} value={l.produitId}>
                    {l.nom} ({nombre(l.quantite)} {l.unite})
                  </option>
                ))}
              </select>
            </div>
            <div className="col-6 col-md-2">
              <label className="form-label">Quantité</label>
              <div className="input-group">
                <input type="number" min="0" step="any" className="form-control" value={quantite} onChange={(e) => setQuantite(e.target.value)} required />
                {produit && <span className="input-group-text">{produit.unite}</span>}
              </div>
            </div>
            <div className="col-6 col-md-2">
              <label className="form-label">{sens === 'entree' ? 'Prix d\'achat / unité' : 'Prix de vente / unité'}</label>
              <input type="number" min="0" step="any" className="form-control" value={prix} onChange={(e) => setPrix(e.target.value)} required />
            </div>
            {sens === 'entree' && (
              <div className="col-6 col-md-1">
                <label className="form-label">Transport</label>
                <input type="number" min="0" step="any" className="form-control" value={transport} onChange={(e) => setTransport(e.target.value)} placeholder="0" />
              </div>
            )}
            <div className="col-6 col-md-2">
              <label className="form-label">{sens === 'entree' ? 'Fournisseur' : 'Client'}</label>
              <input className="form-control" value={tiers} onChange={(e) => setTiers(e.target.value)} placeholder="Facultatif" />
            </div>
          </div>
          <div className="d-flex flex-wrap align-items-center gap-3 mt-3">
            <div className="apercu flex-grow-1">
              {sens === 'entree' ? (
                <>
                  Total <strong>{fcfa(montant)}</strong>
                  {q > 0 && produit && (
                    <>
                      {' '}
                      · revient à <strong>{fcfa(coutRevient)}</strong> / {produit.unite} (achat + transport)
                    </>
                  )}
                </>
              ) : (
                <>
                  Montant <strong>{fcfa(montant)}</strong>
                  {produit && (
                    <>
                      {' '}
                      · coût {fcfa(produit.coutMoyen)} / {produit.unite} · bénéfice{' '}
                      <strong className={beneficeVente >= 0 ? 'texte-positif' : 'texte-negatif'}>{fcfa(beneficeVente)}</strong> · disponible{' '}
                      {nombre(produit.quantite)} {produit.unite}
                    </>
                  )}
                </>
              )}
            </div>
            <button className="btn btn-success" disabled={envoi}>
              Enregistrer
            </button>
          </div>
        </div>
      </form>

      <div className="card">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead>
              <tr>
                <th>Produit</th>
                <th className="text-end">En stock</th>
                <th className="text-end">Coût moyen</th>
                <th className="text-end">Valeur</th>
                <th className="text-end">Entré</th>
                <th className="text-end">Mélangé</th>
                <th className="text-end">Vendu</th>
                <th className="text-end">Bénéfice ventes</th>
              </tr>
            </thead>
            <tbody>
              {lignes.map((l) => (
                <ProduitLigne key={l.produitId} l={l} ouvert={ouvert === l.produitId} basculer={() => setOuvert(ouvert === l.produitId ? null : l.produitId)}>
                  {ouvert === l.produitId && historique.donnees && (
                    <table className="table table-sm mb-0 small">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Mouvement</th>
                          <th className="text-end">Quantité</th>
                          <th className="text-end">Prix</th>
                          <th className="text-end">Montant</th>
                          <th className="text-end">Bénéfice</th>
                          <th className="text-end">Stock après</th>
                          <th />
                        </tr>
                      </thead>
                      <tbody>
                        {historique.donnees.lignes.map((m) => (
                          <tr key={m.id}>
                            <td>{dateFr(m.date)}</td>
                            <td>
                              <span className={`badge ${m.type === 'entree' ? 'text-bg-success' : m.type === 'vente' ? 'text-bg-primary' : 'text-bg-secondary'}`}>
                                {LIBELLES[m.type]}
                              </span>{' '}
                              {m.type === 'melange' ? m.libelle : m.client || m.fournisseur || ''}
                            </td>
                            <td className="text-end">
                              {m.type === 'entree' ? '+' : '−'}
                              {nombre(m.quantite)}
                            </td>
                            <td className="text-end">
                              {m.type === 'entree'
                                ? `${fcfa(m.prixUnitaire ?? 0)}${m.transport ? ` + ${fcfa(m.transport)} transp.` : ''}`
                                : m.type === 'vente'
                                  ? fcfa(m.prixUnitaire ?? 0)
                                  : `coût ${fcfa(m.coutUnitaire ?? 0)}`}
                            </td>
                            <td className="text-end">{fcfa(m.montant ?? m.cout ?? 0)}</td>
                            <td className={`text-end ${(m.benefice ?? 0) > 0 ? 'texte-positif' : (m.benefice ?? 0) < 0 ? 'texte-negatif' : ''}`}>
                              {m.type === 'entree' ? '' : fcfa(m.benefice ?? 0)}
                            </td>
                            <td className="text-end">{nombre(m.stockApres)}</td>
                            <td className="text-end">
                              {m.type !== 'melange' && <BoutonSupprimer url={`/stock/mouvements/${m.id}`} confirmation="Supprimer ce mouvement ?" apres={recharger} />}
                            </td>
                          </tr>
                        ))}
                        {!historique.donnees.lignes.length && (
                          <tr>
                            <td colSpan={8} className="text-center text-body-secondary">
                              Aucun mouvement
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  )}
                </ProduitLigne>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <p className="small text-body-secondary mt-2">Cliquez sur un produit pour voir son historique (entrées, mélanges, ventes).</p>
    </>
  )
}

function ProduitLigne({ l, ouvert, basculer, children }: { l: LigneStock; ouvert: boolean; basculer: () => void; children: React.ReactNode }) {
  return (
    <>
      <tr className="ligne-cliquable" onClick={basculer}>
        <td className="fw-semibold">
          {ouvert ? '▾' : '▸'} {l.nom}
        </td>
        <td className={`text-end fw-semibold ${l.quantite <= 0 && l.entrees > 0 ? 'texte-negatif' : ''}`}>
          {nombre(l.quantite)} <span className="text-body-secondary small">{l.unite}</span>
        </td>
        <td className="text-end">{l.coutMoyen ? fcfa(l.coutMoyen) : '—'}</td>
        <td className="text-end">{fcfa(l.valeur)}</td>
        <td className="text-end">{nombre(l.entrees)}</td>
        <td className="text-end">{nombre(l.utiliseMelange)}</td>
        <td className="text-end">{nombre(l.vendu)}</td>
        <td className={`text-end ${l.benefice > 0 ? 'texte-positif' : l.benefice < 0 ? 'texte-negatif' : ''}`}>{fcfa(l.benefice)}</td>
      </tr>
      {ouvert && (
        <tr>
          <td colSpan={8} className="bg-body-tertiary">
            {children}
          </td>
        </tr>
      )}
    </>
  )
}
