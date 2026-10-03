import { useState, type FormEvent } from 'react'
import { toast } from 'react-toastify'
import { api, messageErreur } from '../api'
import { useBande } from '../BandeContext'
import BoutonSupprimer from '../composants/BoutonSupprimer'
import Carte from '../composants/Carte'
import SansBande from '../composants/SansBande'
import { aujourdhui, dateFr, fcfa, nombre } from '../format'
import type { Vente } from '../types'
import { useCharger } from '../useCharger'
import { useCoutAuJour } from '../useCoutAuJour'

export default function Ventes() {
  const { bande, rafraichirBandes } = useBande()
  const ventes = useCharger<Vente[]>(bande ? `/ventes?bandeId=${bande.id}` : null)
  const [date, setDate] = useState(aujourdhui())
  const [quantite, setQuantite] = useState('')
  const [prix, setPrix] = useState('')
  const [client, setClient] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const cout = useCoutAuJour(bande?.id, date, ventes.donnees)

  if (!bande) return <SansBande />

  const q = Number(quantite) || 0
  const montant = Math.round(q * (Number(prix) || 0))
  const marge = cout ? montant - cout.coutUnitaire * q : 0

  async function enregistrer(e: FormEvent) {
    e.preventDefault()
    if (!bande) return
    setEnvoi(true)
    try {
      const res = await api.post<Vente>('/ventes', { date, bandeId: bande.id, quantite, prixUnitaire: prix, client })
      toast.success(`${res.data.quantite} poulet(s) vendus : ${fcfa(res.data.montant)}`)
      setQuantite('')
      setClient('')
      void ventes.recharger()
      void rafraichirBandes()
    } catch (err) {
      toast.error(messageErreur(err))
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <>
      <h1 className="titre-page">Ventes — {bande.nom}</h1>

      <div className="row g-3 mb-4">
        <div className="col-6 col-xl-3">
          <Carte titre="Poulets vendus" valeur={nombre(bande.vendus)} detail={`sur ${nombre(bande.nombreInitial)} achetés`} />
        </div>
        <div className="col-6 col-xl-3">
          <Carte titre="Poulets restants" valeur={nombre(bande.vivants)} detail={`${nombre(bande.morts)} morts`} />
        </div>
        <div className="col-6 col-xl-3">
          <Carte titre="Chiffre d'affaires" valeur={fcfa(bande.chiffreAffaires)} detail={`Prix moyen ${fcfa(bande.prixVenteMoyen)}`} />
        </div>
        <div className="col-6 col-xl-3">
          <Carte
            titre="Marge sur ventes"
            valeur={fcfa(bande.margeVentes)}
            ton={bande.margeVentes >= 0 ? 'positif' : 'negatif'}
            detail="Ventes − coût de revient des vendus"
          />
        </div>
      </div>

      <form className="card mb-4" onSubmit={enregistrer}>
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-6 col-md-2">
              <label className="form-label">Date</label>
              <input type="date" className="form-control" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div className="col-6 col-md-2">
              <label className="form-label">Nombre</label>
              <input
                type="number"
                min="1"
                max={bande.vivants}
                step="1"
                className="form-control"
                value={quantite}
                onChange={(e) => setQuantite(e.target.value)}
                required
              />
            </div>
            <div className="col-6 col-md-2">
              <label className="form-label">Prix / poulet</label>
              <input type="number" min="0" step="any" className="form-control" value={prix} onChange={(e) => setPrix(e.target.value)} required />
            </div>
            <div className="col-6 col-md-3">
              <label className="form-label">Client</label>
              <input className="form-control" value={client} onChange={(e) => setClient(e.target.value)} placeholder="Facultatif" />
            </div>
            <div className="col-12 col-md-3 text-end">
              <button className="btn btn-success" disabled={envoi || !bande.vivants}>
                Enregistrer la vente
              </button>
            </div>
          </div>
          {cout && (
            <div className="apercu mt-3">
              Âge : <strong>J{cout.age}</strong> · coût de revient : <strong>{fcfa(cout.coutUnitaire)}</strong> / poulet
              {q > 0 && (
                <>
                  {' '}
                  · montant <strong>{fcfa(montant)}</strong> · marge{' '}
                  <strong className={marge >= 0 ? 'texte-positif' : 'texte-negatif'}>{fcfa(marge)}</strong> · reste après vente{' '}
                  <strong>{nombre(Math.max(cout.disponibles - q, 0))}</strong>
                </>
              )}
            </div>
          )}
        </div>
      </form>

      <div className="card">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead>
              <tr>
                <th>Date</th>
                <th>Âge</th>
                <th>Client</th>
                <th className="text-end">Nombre</th>
                <th className="text-end">Prix / poulet</th>
                <th className="text-end">Montant</th>
                <th className="text-end">Coût de revient</th>
                <th className="text-end">Marge</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {(ventes.donnees ?? []).map((v) => (
                <tr key={v.id}>
                  <td>{dateFr(v.date)}</td>
                  <td>J{v.age}</td>
                  <td>{v.client || '—'}</td>
                  <td className="text-end">{nombre(v.quantite)}</td>
                  <td className="text-end">{fcfa(v.prixUnitaire)}</td>
                  <td className="text-end fw-semibold">{fcfa(v.montant)}</td>
                  <td className="text-end">{fcfa(v.coutTotal)}</td>
                  <td className={`text-end fw-semibold ${v.marge >= 0 ? 'texte-positif' : 'texte-negatif'}`}>{fcfa(v.marge)}</td>
                  <td className="text-end">
                    <BoutonSupprimer
                      url={`/ventes/${v.id}`}
                      confirmation="Supprimer cette vente ?"
                      apres={() => {
                        void ventes.recharger()
                        void rafraichirBandes()
                      }}
                    />
                  </td>
                </tr>
              ))}
              {!ventes.chargement && !ventes.donnees?.length && (
                <tr>
                  <td colSpan={9} className="text-center text-body-secondary py-4">
                    Aucune vente pour cette bande
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
