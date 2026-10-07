import { faTriangleExclamation } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Link } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import Carte from '../composants/Carte'
import SansBande from '../composants/SansBande'
import { fcfa, LISTE_TYPES, moisFr, nombre, TYPES_ALIMENT } from '../format'
import type { TableauDeBord as Donnees } from '../types'
import { useCharger } from '../useCharger'
import { compact, styleGraphique, useCouleurs } from '../useCouleurs'

export default function TableauDeBord() {
  const { donnees: d } = useCharger<Donnees>('/tableau-de-bord')
  const c = useCouleurs()
  const { axe, infobulle } = styleGraphique(c)

  if (!d) return <p className="text-body-secondary">Chargement…</p>
  const t = d.totaux

  const moisGraphique = d.parMois.map((m) => ({
    mois: moisFr(m.mois),
    'Ventes poulets': m.ventesPoulets,
    'Ventes stock': m.ventesStock,
    Dépenses: m.depensesBandes + m.achatsStock,
  }))

  return (
    <>
      <h1 className="titre-page">Tableau de bord</h1>

      {d.alertesStock.length > 0 && (
        <div className="alert alert-warning d-flex gap-2 align-items-start">
          <FontAwesomeIcon icon={faTriangleExclamation} className="mt-1" />
          <div>
            <strong>Stock épuisé :</strong> {d.alertesStock.map((s) => s.nom).join(', ')}. <Link to="/stock">Enregistrer une entrée</Link>
          </div>
        </div>
      )}

      <div className="row g-3 mb-4">
        <div className="col-6 col-xl-3">
          <Carte titre="Poulets en élevage" valeur={nombre(t.vivants)} detail={`${d.bandesEnCours.length} bande(s) en cours`} />
        </div>
        <div className="col-6 col-xl-3">
          <Carte titre="Ventes de poulets" valeur={fcfa(t.ventesPoulets)} detail={`${nombre(t.poulets)} poulets vendus`} />
        </div>
        <div className="col-6 col-xl-3">
          <Carte titre="Résultat des bandes" valeur={fcfa(t.beneficeBandes)} ton={t.beneficeBandes >= 0 ? 'positif' : 'negatif'} detail="Ventes − achats de toutes les bandes" />
        </div>
        <div className="col-6 col-xl-3">
          <Carte
            titre="Ventes du stock"
            valeur={fcfa(t.ventesStock)}
            detail={
              <>
                Bénéfice <span className={t.beneficeStock >= 0 ? 'texte-positif' : 'texte-negatif'}>{fcfa(t.beneficeStock)}</span> · stock {fcfa(t.valeurStock)} ·
                sacs {fcfa(t.valeurSacs)}
              </>
            }
          />
        </div>
      </div>

      <h2 className="h5 mb-3">Bandes en cours</h2>
      {!d.bandes.length ? (
        <SansBande />
      ) : (
        <div className="row g-3 mb-4">
          {d.bandesEnCours.map((b) => (
            <div className="col-12 col-md-6 col-xxl-4" key={b.id}>
              <Link to={`/bandes/${b.id}`} className="text-reset text-decoration-none">
                <div className="card h-100 carte-bande">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-baseline mb-2">
                      <h3 className="h6 mb-0">{b.nom}</h3>
                      <span className="badge text-bg-secondary">J{b.age}</span>
                    </div>
                    <div className="row g-2 small">
                      <div className="col-6">
                        <div className="text-body-secondary">Vivants</div>
                        <strong>
                          {nombre(b.vivants)} / {nombre(b.nombreInitial)}
                        </strong>
                      </div>
                      <div className="col-6">
                        <div className="text-body-secondary">Mortalité</div>
                        <strong className={b.tauxMortalite > 5 ? 'texte-negatif' : ''}>{nombre(b.tauxMortalite)} %</strong>
                      </div>
                      <div className="col-6">
                        <div className="text-body-secondary">Sacs consommés</div>
                        <strong>{nombre(b.sacsTotal)}</strong>
                      </div>
                      <div className="col-6">
                        <div className="text-body-secondary">Coût / poulet</div>
                        <strong>{fcfa(b.coutRevientActuel)}</strong>
                      </div>
                      <div className="col-6">
                        <div className="text-body-secondary">Ventes</div>
                        <strong>
                          {fcfa(b.chiffreAffaires)} <span className="fw-normal text-body-secondary">({nombre(b.vendus)})</span>
                        </strong>
                      </div>
                      <div className="col-6">
                        <div className="text-body-secondary">Résultat</div>
                        <strong className={b.benefice >= 0 ? 'texte-positif' : 'texte-negatif'}>{fcfa(b.benefice)}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))}
          {!d.bandesEnCours.length && <p className="text-body-secondary">Aucune bande en cours.</p>}
        </div>
      )}

      {d.bandes.length > 0 && (
        <>
          <h2 className="h5 mb-3">Comparaison des bandes</h2>
          <div className="card mb-4">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 small">
                <thead>
                  <tr>
                    <th>Bande</th>
                    <th className="text-end">Durée</th>
                    <th className="text-end">Poussins</th>
                    <th className="text-end">Mortalité</th>
                    <th className="text-end">Vendus</th>
                    {LISTE_TYPES.map((ty) => (
                      <th key={ty} className="text-end">
                        Sacs {TYPES_ALIMENT[ty].toLowerCase()}
                      </th>
                    ))}
                    <th className="text-end">Sacs / poulet</th>
                    <th className="text-end">Coût / poulet</th>
                    <th className="text-end">Prix moyen</th>
                    <th className="text-end">Ventes</th>
                    <th className="text-end">Achats</th>
                    <th className="text-end">Bénéfice</th>
                    <th className="text-end">Bénéf. / poulet</th>
                  </tr>
                </thead>
                <tbody>
                  {d.bandes.map((b) => (
                    <tr key={b.id}>
                      <td>
                        <Link to={`/bandes/${b.id}`} className="fw-semibold">
                          {b.nom}
                        </Link>
                        {!b.cloturee && <span className="badge text-bg-success ms-1">en cours</span>}
                      </td>
                      <td className="text-end">{b.duree} j</td>
                      <td className="text-end">{nombre(b.nombreInitial)}</td>
                      <td className="text-end">{nombre(b.tauxMortalite)} %</td>
                      <td className="text-end">{nombre(b.vendus)}</td>
                      {LISTE_TYPES.map((ty) => (
                        <td key={ty} className="text-end">
                          {nombre(b.sacsParType[ty])}
                        </td>
                      ))}
                      <td className="text-end">{nombre(b.sacsParPoulet)}</td>
                      <td className="text-end">{fcfa(b.coutRevientActuel)}</td>
                      <td className="text-end">{b.prixVenteMoyen ? fcfa(b.prixVenteMoyen) : '—'}</td>
                      <td className="text-end">{fcfa(b.chiffreAffaires)}</td>
                      <td className="text-end">{fcfa(b.chargesTotales)}</td>
                      <td className={`text-end fw-semibold ${b.benefice >= 0 ? 'texte-positif' : 'texte-negatif'}`}>{fcfa(b.benefice)}</td>
                      <td className="text-end">{b.vendus ? fcfa(b.beneficeParPoulet) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <div className="row g-3 mb-4">
        <div className="col-12 col-lg-8">
          <div className="card h-100">
            <div className="card-body">
              <h2 className="titre-graphique">Ventes et dépenses par mois</h2>
              {moisGraphique.length ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={moisGraphique} margin={{ top: 8, right: 16, left: 0, bottom: 0 }} barGap={2}>
                    <CartesianGrid stroke={c.grille} vertical={false} />
                    <XAxis dataKey="mois" {...axe} />
                    <YAxis width={52} tickFormatter={compact} {...axe} axisLine={false} />
                    <Tooltip {...infobulle} cursor={{ fill: c.grille, opacity: 0.4 }} formatter={(v, nom) => [fcfa(Number(v)), nom]} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 13 }} formatter={(nom) => <span style={{ color: c.texte }}>{nom}</span>} />
                    <Bar isAnimationActive={false} dataKey="Ventes poulets" fill={c.serie1} radius={[4, 4, 0, 0]} maxBarSize={28} />
                    <Bar isAnimationActive={false} dataKey="Ventes stock" fill={c.serie3} radius={[4, 4, 0, 0]} maxBarSize={28} />
                    <Bar isAnimationActive={false} dataKey="Dépenses" fill={c.serie2} radius={[4, 4, 0, 0]} maxBarSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-body-secondary">Aucune opération enregistrée.</p>
              )}
            </div>
          </div>
        </div>
        <div className="col-12 col-lg-4">
          <div className="card h-100">
            <div className="card-body">
              <h2 className="titre-graphique">Sacs d'aliment en stock</h2>
              {d.sacs.map((s) => (
                <div key={s.type} className="d-flex justify-content-between align-items-center mb-2">
                  <span className={`badge badge-${s.type}`}>{TYPES_ALIMENT[s.type]}</span>
                  <span>
                    <strong>{nombre(s.restants)} sacs</strong> <span className="text-body-secondary small">· {fcfa(s.valeur)}</span>
                  </span>
                </div>
              ))}
              <hr />
              <h2 className="titre-graphique">Produits en stock</h2>
              {d.stock
                .filter((s) => s.entrees > 0)
                .map((s) => (
                  <div key={s.produitId} className="d-flex justify-content-between small mb-1">
                    <span>{s.nom}</span>
                    <span className={s.quantite <= 0 ? 'texte-negatif' : ''}>
                      {nombre(s.quantite)} {s.unite}
                    </span>
                  </div>
                ))}
              {!d.stock.some((s) => s.entrees > 0) && (
                <p className="small text-body-secondary mb-0">
                  Aucune entrée. <Link to="/stock">Ajouter du stock</Link>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
