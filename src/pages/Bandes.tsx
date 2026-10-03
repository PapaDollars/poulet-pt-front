import { toast } from 'react-toastify'
import { api, messageErreur } from '../api'
import { useBande } from '../BandeContext'
import SansBande from '../composants/SansBande'
import { dateFr, fcfa, nombre } from '../format'

export default function Bandes() {
  const { bandes, bande, choisirBande, rafraichirBandes } = useBande()

  async function basculer(id: string, cloturee: boolean) {
    try {
      await api.put(`/bandes/${id}`, { cloturee })
      toast.success(cloturee ? 'Bande clôturée' : 'Bande rouverte')
      void rafraichirBandes()
    } catch (err) {
      toast.error(messageErreur(err))
    }
  }

  if (!bandes.length) return <SansBande />

  return (
    <>
      <h1 className="titre-page">Bandes</h1>
      <p className="text-body-secondary">Une bande est créée automatiquement à chaque achat de poussins.</p>
      <div className="card">
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
                <th className="text-end">Coût / poulet</th>
                <th className="text-end">Résultat</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {bandes.map((b) => (
                <tr key={b.id} className={b.id === bande?.id ? 'table-active' : ''}>
                  <td>
                    <button className="btn btn-link p-0 fw-semibold" onClick={() => choisirBande(b.id)}>
                      {b.nom}
                    </button>
                    {b.cloturee && <span className="badge text-bg-secondary ms-2">Clôturée</span>}
                  </td>
                  <td>
                    {dateFr(b.dateArrivee)} <span className="text-body-secondary small">· J{b.age}</span>
                  </td>
                  <td className="text-end">{nombre(b.nombreInitial)}</td>
                  <td className="text-end">{nombre(b.vivants)}</td>
                  <td className="text-end">{nombre(b.vendus)}</td>
                  <td className="text-end">
                    {nombre(b.morts)} <span className="text-body-secondary small">({nombre(b.tauxMortalite)} %)</span>
                  </td>
                  <td className="text-end">{fcfa(b.coutRevientActuel)}</td>
                  <td className={`text-end fw-semibold ${b.benefice >= 0 ? 'texte-positif' : 'texte-negatif'}`}>{fcfa(b.benefice)}</td>
                  <td className="text-end">
                    <button className="btn btn-sm btn-outline-secondary" onClick={() => basculer(b.id, !b.cloturee)}>
                      {b.cloturee ? 'Rouvrir' : 'Clôturer'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
