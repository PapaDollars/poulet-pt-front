import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import { api, messageErreur } from '../api'
import { useBande } from '../BandeContext'
import BoutonSupprimer from '../composants/BoutonSupprimer'
import { aujourdhui, dateFr, fcfa, nombre } from '../format'
import type { Bande } from '../types'

export default function Bandes() {
  const { bandes, choisirBande, rafraichirBandes } = useBande()
  const [nom, setNom] = useState('')
  const [dateArrivee, setDateArrivee] = useState(aujourdhui())
  const [nombreInitial, setNombreInitial] = useState('')
  const [prixUnitaire, setPrixUnitaire] = useState('')
  const [envoi, setEnvoi] = useState(false)

  const total = Math.round((Number(nombreInitial) || 0) * (Number(prixUnitaire) || 0))

  async function creer(e: FormEvent) {
    e.preventDefault()
    setEnvoi(true)
    try {
      const res = await api.post<Bande>('/bandes', { nom, dateArrivee, nombreInitial, prixUnitaire })
      toast.success(`${res.data.nom} créée : ${nombre(res.data.nombreInitial)} poussins`)
      setNom('')
      setNombreInitial('')
      await rafraichirBandes()
      choisirBande(res.data.id)
    } catch (err) {
      toast.error(messageErreur(err))
    } finally {
      setEnvoi(false)
    }
  }

  async function basculer(b: Bande) {
    try {
      await api.put(`/bandes/${b.id}`, { cloturee: !b.cloturee })
      toast.success(b.cloturee ? `${b.nom} rouverte` : `${b.nom} clôturée`)
      void rafraichirBandes()
    } catch (err) {
      toast.error(messageErreur(err))
    }
  }

  const enCours = bandes.filter((b) => !b.cloturee)
  const cloturees = bandes.filter((b) => b.cloturee)

  const tableau = (liste: Bande[]) => (
    <div className="card mb-4">
      <div className="table-responsive">
        <table className="table table-hover align-middle mb-0">
          <thead>
            <tr>
              <th>Bande</th>
              <th>Arrivée</th>
              <th className="text-end">Départ</th>
              <th className="text-end">Vivants</th>
              <th className="text-end">Vendus</th>
              <th className="text-end">Morts</th>
              <th className="text-end">Sacs</th>
              <th className="text-end">Coût / poulet</th>
              <th className="text-end">Ventes</th>
              <th className="text-end">Résultat</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {liste.map((b) => (
              <tr key={b.id}>
                <td>
                  <Link to={`/bandes/${b.id}`} className="fw-semibold" onClick={() => choisirBande(b.id)}>
                    {b.nom}
                  </Link>
                </td>
                <td>
                  {dateFr(b.dateArrivee)} <span className="text-body-secondary small">· {b.cloturee ? `${b.duree} j` : `J${b.age}`}</span>
                </td>
                <td className="text-end">{nombre(b.nombreInitial)}</td>
                <td className="text-end">{nombre(b.vivants)}</td>
                <td className="text-end">{nombre(b.vendus)}</td>
                <td className="text-end">
                  {nombre(b.morts)} <span className="text-body-secondary small">({nombre(b.tauxMortalite)} %)</span>
                </td>
                <td className="text-end">{nombre(b.sacsTotal)}</td>
                <td className="text-end">{fcfa(b.coutRevientActuel)}</td>
                <td className="text-end">{fcfa(b.chiffreAffaires)}</td>
                <td className={`text-end fw-semibold ${b.benefice >= 0 ? 'texte-positif' : 'texte-negatif'}`}>{fcfa(b.benefice)}</td>
                <td className="text-end text-nowrap">
                  <button className="btn btn-sm btn-outline-secondary me-2" onClick={() => basculer(b)}>
                    {b.cloturee ? 'Rouvrir' : 'Clôturer'}
                  </button>
                  <BoutonSupprimer url={`/bandes/${b.id}`} confirmation={`Supprimer ${b.nom} ?`} apres={rafraichirBandes} />
                </td>
              </tr>
            ))}
            {!liste.length && (
              <tr>
                <td colSpan={11} className="text-center text-body-secondary py-4">
                  Aucune bande
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )

  return (
    <>
      <h1 className="titre-page">Bandes</h1>

      <form className="card mb-4" onSubmit={creer}>
        <div className="card-body">
          <h2 className="h6 mb-3">Nouvelle vague de poussins</h2>
          <div className="row g-3 align-items-end">
            <div className="col-12 col-md-3">
              <label className="form-label">Nom</label>
              <input className="form-control" value={nom} onChange={(e) => setNom(e.target.value)} placeholder={`Bande ${bandes.length + 1}`} />
            </div>
            <div className="col-6 col-md-2">
              <label className="form-label">Date d'arrivée</label>
              <input type="date" className="form-control" value={dateArrivee} onChange={(e) => setDateArrivee(e.target.value)} required />
            </div>
            <div className="col-6 col-md-2">
              <label className="form-label">Poussins</label>
              <input type="number" min="1" step="1" className="form-control" value={nombreInitial} onChange={(e) => setNombreInitial(e.target.value)} required />
            </div>
            <div className="col-6 col-md-2">
              <label className="form-label">Prix / poussin</label>
              <input type="number" min="0" step="any" className="form-control" value={prixUnitaire} onChange={(e) => setPrixUnitaire(e.target.value)} required />
            </div>
            <div className="col-6 col-md-3 text-end">
              <div className="total-auto mb-2">
                Total : <strong>{fcfa(total)}</strong>
              </div>
              <button className="btn btn-success" disabled={envoi}>
                Créer la bande
              </button>
            </div>
          </div>
        </div>
      </form>

      <h2 className="h5 mb-3">En cours ({enCours.length})</h2>
      {tableau(enCours)}
      {cloturees.length > 0 && (
        <>
          <h2 className="h5 mb-3">Clôturées ({cloturees.length})</h2>
          {tableau(cloturees)}
        </>
      )}
    </>
  )
}
