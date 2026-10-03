import { Link } from 'react-router-dom'
import Carte from '../composants/Carte'
import { fcfa, kg, nombre } from '../format'
import type { LigneStock } from '../types'
import { useCharger } from '../useCharger'

export default function Stock() {
  const { donnees, chargement } = useCharger<LigneStock[]>('/tableau-de-bord/stock')
  const stock = donnees ?? []
  const valeur = stock.reduce((t, s) => t + s.valeur, 0)
  const epuises = stock.filter((s) => s.stockKg <= 0)

  return (
    <>
      <h1 className="titre-page">Stock des aliments</h1>
      <p className="text-body-secondary">
        Calculé automatiquement : <Link to="/achats">achats</Link> − quantités utilisées dans les <Link to="/aliments">mélanges</Link>.
      </p>

      <div className="row g-3 mb-4">
        <div className="col-6 col-md-4">
          <Carte titre="Valeur du stock" valeur={fcfa(valeur)} />
        </div>
        <div className="col-6 col-md-4">
          <Carte titre="Produits épuisés" valeur={nombre(epuises.length)} ton={epuises.length ? 'negatif' : undefined} />
        </div>
      </div>

      <div className="card">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead>
              <tr>
                <th>Produit</th>
                <th className="text-end">Acheté</th>
                <th className="text-end">Utilisé</th>
                <th className="text-end">En stock</th>
                <th className="text-end">Équivalent</th>
                <th className="text-end">Valeur</th>
                <th>État</th>
              </tr>
            </thead>
            <tbody>
              {stock.map((s) => (
                <tr key={s.produitId}>
                  <td className="fw-semibold">{s.nom}</td>
                  <td className="text-end">{kg(s.entreeKg)}</td>
                  <td className="text-end">{kg(s.sortieKg)}</td>
                  <td className={`text-end fw-semibold ${s.stockKg < 0 ? 'texte-negatif' : ''}`}>{kg(s.stockKg)}</td>
                  <td className="text-end text-body-secondary">{s.unite !== 'kg' ? `${nombre(s.stockUnites)} ${s.unite}` : '—'}</td>
                  <td className="text-end">{fcfa(s.valeur)}</td>
                  <td>
                    {s.stockKg < 0 ? (
                      <span className="badge text-bg-danger">Achat manquant</span>
                    ) : s.stockKg === 0 ? (
                      <span className="badge text-bg-warning">Épuisé</span>
                    ) : (
                      <span className="badge text-bg-success">Disponible</span>
                    )}
                  </td>
                </tr>
              ))}
              {!chargement && !stock.length && (
                <tr>
                  <td colSpan={7} className="text-center text-body-secondary py-4">
                    Aucun produit
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
