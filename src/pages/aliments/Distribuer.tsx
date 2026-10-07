import { useState, type FormEvent } from 'react'
import { toast } from 'react-toastify'
import { api, messageErreur } from '../../api'
import { useBande } from '../../BandeContext'
import BoutonSupprimer from '../../composants/BoutonSupprimer'
import { aujourdhui, dateFr, fcfa, LISTE_TYPES, nombre, TYPES_ALIMENT } from '../../format'
import type { Distribution, StockSacs, TypeAliment } from '../../types'
import { useCharger } from '../../useCharger'

/** Stock de sacs fabriqués et distribution aux bandes (en plusieurs fois, jusqu'à épuisement). */
export default function Distribuer() {
  const { bandes, bande: bandeActive, rafraichirBandes } = useBande()
  const sacs = useCharger<StockSacs[]>('/fabrications/sacs')
  const distributions = useCharger<Distribution[]>('/distributions')
  const enCours = bandes.filter((b) => !b.cloturee)

  const [date, setDate] = useState(aujourdhui())
  const [bandeId, setBandeId] = useState('')
  const [type, setType] = useState<TypeAliment>('demarrage')
  const [lotId, setLotId] = useState('')
  const [nombreSacs, setNombreSacs] = useState('')
  const [envoi, setEnvoi] = useState(false)

  const cible = bandeId || (bandeActive && !bandeActive.cloturee ? bandeActive.id : enCours[0]?.id) || ''
  const duType = sacs.donnees?.find((s) => s.type === type)
  const lots = (duType?.lots ?? []).filter((l) => !lotId || l.fabricationId === lotId)

  // Aperçu du coût : on prend les lots les plus anciens d'abord (ou le lot choisi)
  let reste = Number(nombreSacs) || 0
  let montant = 0
  for (const l of lots) {
    const pris = Math.min(reste, l.restants)
    montant += pris * l.prixSac
    reste -= pris
  }
  const disponible = lots.reduce((t, l) => t + l.restants, 0)

  function recharger() {
    void sacs.recharger()
    void distributions.recharger()
    void rafraichirBandes()
  }

  async function distribuer(e: FormEvent) {
    e.preventDefault()
    setEnvoi(true)
    try {
      await api.post('/distributions', { date, bandeId: cible, type, fabricationId: lotId || null, nombreSacs })
      const nomBande = bandes.find((b) => b.id === cible)?.nom
      toast.success(`${nombreSacs} sac(s) ${TYPES_ALIMENT[type]} donnés à ${nomBande} : ${fcfa(montant)}`)
      setNombreSacs('')
      setLotId('')
      recharger()
    } catch (err) {
      toast.error(messageErreur(err))
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <>
      <div className="row g-3 mb-4">
        {LISTE_TYPES.map((t) => {
          const s = sacs.donnees?.find((x) => x.type === t)
          return (
            <div className="col-12 col-md-4" key={t}>
              <div className={`card h-100 ${t === type ? 'border-primary' : ''}`} role="button" onClick={() => setType(t)}>
                <div className="card-body">
                  <div className="carte-titre">
                    <span className={`badge badge-${t}`}>{TYPES_ALIMENT[t]}</span> en stock
                  </div>
                  <div className="carte-valeur">{nombre(s?.restants ?? 0)} sacs</div>
                  <div className="carte-detail">
                    {(s?.lots ?? []).map((l) => (
                      <div key={l.fabricationId}>
                        {dateFr(l.date)} · {nombre(l.restants)}/{nombre(l.total)} à {fcfa(l.prixSac)}
                      </div>
                    ))}
                    {!s?.lots.length && 'Aucun sac : fabriquez un mélange'}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <form className="card mb-4" onSubmit={distribuer}>
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-6 col-md-2">
              <label className="form-label">Date</label>
              <input type="date" className="form-control" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div className="col-6 col-md-3">
              <label className="form-label">Bande</label>
              <select className="form-select" value={cible} onChange={(e) => setBandeId(e.target.value)} required>
                {!enCours.length && <option value="">Aucune bande en cours</option>}
                {enCours.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.nom} — {nombre(b.vivants)} poulets · J{b.age}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-6 col-md-2">
              <label className="form-label">Type de sacs</label>
              <select
                className="form-select"
                value={type}
                onChange={(e) => {
                  setType(e.target.value as TypeAliment)
                  setLotId('')
                }}
              >
                {LISTE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {TYPES_ALIMENT[t]}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-6 col-md-3">
              <label className="form-label">Lot</label>
              <select className="form-select" value={lotId} onChange={(e) => setLotId(e.target.value)}>
                <option value="">Les plus anciens d'abord</option>
                {(duType?.lots ?? []).map((l) => (
                  <option key={l.fabricationId} value={l.fabricationId}>
                    {dateFr(l.date)} — {nombre(l.restants)} sacs à {fcfa(l.prixSac)}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-6 col-md-2">
              <label className="form-label">Nombre de sacs</label>
              <input type="number" min="0" max={disponible} step="any" className="form-control" value={nombreSacs} onChange={(e) => setNombreSacs(e.target.value)} required />
            </div>
          </div>
          <div className="d-flex flex-wrap align-items-center gap-3 mt-3">
            <div className="apercu flex-grow-1">
              Disponible : <strong>{nombre(disponible)} sacs</strong>
              {Number(nombreSacs) > 0 && (
                <>
                  {' '}
                  · coût pour la bande <strong>{fcfa(montant)}</strong> · reste après {nombre(Math.max(disponible - Number(nombreSacs), 0))} sacs
                </>
              )}
            </div>
            <button className="btn btn-success" disabled={envoi || !cible || !disponible}>
              Donner à la bande
            </button>
          </div>
        </div>
      </form>

      <h2 className="h5 mb-3">Sacs donnés</h2>
      <div className="card">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead>
              <tr>
                <th>Date</th>
                <th>Bande</th>
                <th>Type</th>
                <th className="text-end">Sacs</th>
                <th className="text-end">Prix du sac</th>
                <th className="text-end">Montant</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {(distributions.donnees ?? []).map((d) => (
                <tr key={d.id}>
                  <td>{dateFr(d.date)}</td>
                  <td>{d.bandeNom ?? '—'}</td>
                  <td>
                    <span className={`badge badge-${d.type}`}>{TYPES_ALIMENT[d.type]}</span>
                  </td>
                  <td className="text-end">{nombre(d.nombreSacs)}</td>
                  <td className="text-end">{fcfa(d.prixSac)}</td>
                  <td className="text-end fw-semibold">{fcfa(d.montant)}</td>
                  <td className="text-end">
                    <BoutonSupprimer url={`/distributions/${d.id}`} confirmation="Annuler cette distribution ? Les sacs reviennent en stock." apres={recharger} />
                  </td>
                </tr>
              ))}
              {!distributions.chargement && !distributions.donnees?.length && (
                <tr>
                  <td colSpan={7} className="text-center text-body-secondary py-4">
                    Aucun sac donné pour l'instant
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
