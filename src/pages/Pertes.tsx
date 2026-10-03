import { useState, type FormEvent } from 'react'
import { toast } from 'react-toastify'
import { api, messageErreur } from '../api'
import { useBande } from '../BandeContext'
import BoutonSupprimer from '../composants/BoutonSupprimer'
import Carte from '../composants/Carte'
import SansBande from '../composants/SansBande'
import { aujourdhui, dateFr, fcfa, kg, nombre } from '../format'
import type { Perte } from '../types'
import { useCharger } from '../useCharger'
import { useCoutAuJour } from '../useCoutAuJour'

export default function Pertes() {
  const { bande, rafraichirBandes } = useBande()
  const pertes = useCharger<Perte[]>(bande ? `/pertes?bandeId=${bande.id}` : null)
  const [date, setDate] = useState(aujourdhui())
  const [nombrePerdu, setNombrePerdu] = useState('')
  const [cause, setCause] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const cout = useCoutAuJour(bande?.id, date, pertes.donnees)

  if (!bande) return <SansBande />

  const n = Number(nombrePerdu) || 0

  async function enregistrer(e: FormEvent) {
    e.preventDefault()
    if (!bande) return
    setEnvoi(true)
    try {
      const res = await api.post<Perte>('/pertes', { date, bandeId: bande.id, nombre: nombrePerdu, cause })
      toast.info(`${res.data.nombre} poulet(s) perdu(s) à J${res.data.age} : ${fcfa(res.data.coutTotal)} de dépenses perdues`)
      setNombrePerdu('')
      setCause('')
      void pertes.recharger()
      void rafraichirBandes()
    } catch (err) {
      toast.error(messageErreur(err))
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <>
      <h1 className="titre-page">Pertes — {bande.nom}</h1>

      <div className="row g-3 mb-4">
        <div className="col-6 col-xl-3">
          <Carte titre="Poulets perdus" valeur={nombre(bande.morts)} detail={`sur ${nombre(bande.nombreInitial)} poussins`} />
        </div>
        <div className="col-6 col-xl-3">
          <Carte
            titre="Taux de mortalité"
            valeur={`${nombre(bande.tauxMortalite)} %`}
            ton={bande.tauxMortalite > 5 ? 'negatif' : undefined}
            detail={bande.tauxMortalite > 5 ? 'Au-dessus de 5 % : à surveiller' : 'Normal (≤ 5 %)'}
          />
        </div>
        <div className="col-6 col-xl-3">
          <Carte titre="Coût des pertes" valeur={fcfa(bande.coutPertes)} ton="negatif" detail="Poussin + aliments + soins investis" />
        </div>
        <div className="col-6 col-xl-3">
          <Carte titre="Poulets vivants" valeur={nombre(bande.vivants)} detail={`Âge J${bande.age}`} />
        </div>
      </div>

      <form className="card mb-4" onSubmit={enregistrer}>
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-6 col-md-2">
              <label className="form-label">Date</label>
              <input
                type="date"
                className="form-control"
                value={date}
                min={bande.dateArrivee}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div className="col-6 col-md-2">
              <label className="form-label">Nombre</label>
              <input
                type="number"
                min="1"
                max={bande.vivants}
                step="1"
                className="form-control"
                value={nombrePerdu}
                onChange={(e) => setNombrePerdu(e.target.value)}
                required
              />
            </div>
            <div className="col-12 col-md-5">
              <label className="form-label">Cause</label>
              <input
                className="form-control"
                value={cause}
                onChange={(e) => setCause(e.target.value)}
                placeholder="Maladie, chaleur, étouffement… (facultatif)"
                list="causes"
              />
              <datalist id="causes">
                {['Maladie', 'Chaleur', 'Étouffement', 'Prédateur', 'Inconnue'].map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
            <div className="col-12 col-md-3 text-end">
              <button className="btn btn-danger" disabled={envoi || !bande.vivants}>
                Enregistrer la perte
              </button>
            </div>
          </div>
          {cout && (
            <div className="apercu mt-3">
              À <strong>J{cout.age}</strong>, chaque poulet a consommé <strong>{kg(cout.alimentKg)}</strong> d'aliment et coûté{' '}
              <strong>{fcfa(cout.coutUnitaire)}</strong> (poussin {fcfa(cout.coutPoussin)} + aliments {fcfa(cout.coutAliment)} + soins{' '}
              {fcfa(cout.coutSoins)})
              {n > 0 && (
                <>
                  {' '}
                  → perte de <strong className="texte-negatif">{fcfa(cout.coutUnitaire * n)}</strong> pour {nombre(n)} poulet(s)
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
                <th className="text-end">Nombre</th>
                <th>Cause</th>
                <th className="text-end">Aliment consommé</th>
                <th className="text-end">Coût / poulet</th>
                <th className="text-end">Dépense perdue</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {(pertes.donnees ?? []).map((p) => (
                <tr key={p.id}>
                  <td>{dateFr(p.date)}</td>
                  <td>J{p.age}</td>
                  <td className="text-end fw-semibold">{nombre(p.nombre)}</td>
                  <td>{p.cause || '—'}</td>
                  <td className="text-end">
                    {kg(p.alimentKgTotal)} <span className="text-body-secondary small">({kg(p.alimentKgUnitaire)} / poulet)</span>
                  </td>
                  <td className="text-end">{fcfa(p.coutUnitaire)}</td>
                  <td className="text-end fw-semibold texte-negatif">{fcfa(p.coutTotal)}</td>
                  <td className="text-end">
                    <BoutonSupprimer
                      url={`/pertes/${p.id}`}
                      confirmation="Supprimer cette perte ?"
                      apres={() => {
                        void pertes.recharger()
                        void rafraichirBandes()
                      }}
                    />
                  </td>
                </tr>
              ))}
              {!pertes.chargement && !pertes.donnees?.length && (
                <tr>
                  <td colSpan={8} className="text-center text-body-secondary py-4">
                    Aucune perte enregistrée 👍
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
