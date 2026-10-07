import { Link, useParams } from 'react-router-dom'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import Carte from '../composants/Carte'
import { dateFr, fcfa, nombre, TYPES_ALIMENT } from '../format'
import type { BandeDetail } from '../types'
import { useCharger } from '../useCharger'
import { compact, styleGraphique, useCouleurs } from '../useCouleurs'

/** Fiche d'une bande, comme une feuille Excel : achats, ventes, résultat. */
export default function FicheBande() {
  const { id } = useParams()
  const { donnees: b } = useCharger<BandeDetail>(`/bandes/${id}`)
  const c = useCouleurs()
  const { axe, infobulle } = styleGraphique(c)

  if (!b) return <p className="text-body-secondary">Chargement…</p>

  const totalAchats = b.lignesAchats.reduce((t, l) => t + l.montant, 0)
  const ventesQte = b.ventes.reduce((t, v) => t + v.quantite, 0)

  return (
    <>
      <div className="d-flex flex-wrap align-items-baseline gap-3 mb-3">
        <h1 className="titre-page mb-0">{b.nom}</h1>
        <span className="text-body-secondary">
          arrivée le {dateFr(b.dateArrivee)} · {b.cloturee ? `clôturée après ${b.duree} jours` : `J${b.age}`}
        </span>
        <Link to="/bandes" className="ms-auto small">
          ← Toutes les bandes
        </Link>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-6 col-xl-3">
          <Carte titre="Poulets vivants" valeur={nombre(b.vivants)} detail={`${nombre(b.nombreInitial)} au départ · ${nombre(b.vendus)} vendus · ${nombre(b.morts)} morts (${nombre(b.tauxMortalite)} %)`} />
        </div>
        <div className="col-6 col-xl-3">
          <Carte
            titre="Sacs consommés"
            valeur={nombre(b.sacsTotal)}
            detail={`Démarrage ${nombre(b.sacsParType.demarrage)} · Croissance ${nombre(b.sacsParType.croissance)} · Finition ${nombre(b.sacsParType.finition)}`}
          />
        </div>
        <div className="col-6 col-xl-3">
          <Carte
            titre="Coût de revient / poulet"
            valeur={fcfa(b.coutRevientActuel)}
            detail={`Poussin ${fcfa(b.detailCoutActuel.coutPoussin)} · aliment ${fcfa(b.detailCoutActuel.coutAliment)} · soins ${fcfa(b.detailCoutActuel.coutSoins)}`}
          />
        </div>
        <div className="col-6 col-xl-3">
          <Carte
            titre="Résultat"
            valeur={fcfa(b.benefice)}
            ton={b.benefice >= 0 ? 'positif' : 'negatif'}
            detail={`Ventes ${fcfa(b.chiffreAffaires)} − achats ${fcfa(b.chargesTotales)}`}
          />
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-xl-6">
          <div className="card h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h2 className="titre-graphique mb-0">Achats</h2>
                <Link to="/achats" className="small">
                  Ajouter
                </Link>
              </div>
              <div className="table-responsive">
                <table className="table table-sm table-fiche align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Produits</th>
                      <th className="text-end">Qté</th>
                      <th className="text-end">Prix unit.</th>
                      <th className="text-end">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {b.lignesAchats.map((l, i) => (
                      <tr key={l.id ?? `${l.source}-${i}`}>
                        <td>
                          {l.source === 'sacs' && l.typeAliment ? (
                            <span className={`badge badge-${l.typeAliment}`}>{TYPES_ALIMENT[l.typeAliment]}</span>
                          ) : (
                            l.designation
                          )}
                        </td>
                        <td className="text-end">
                          {nombre(l.quantite)} <span className="text-body-secondary small">{l.unite}</span>
                        </td>
                        <td className="text-end">{fcfa(l.prixUnitaire)}</td>
                        <td className="text-end fw-semibold">{fcfa(l.montant)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={3}>Prix achats</td>
                      <td className="text-end">{fcfa(totalAchats)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-6">
          <div className="card h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h2 className="titre-graphique mb-0">Ventes</h2>
                <Link to="/ventes" className="small">
                  Ajouter
                </Link>
              </div>
              <div className="table-responsive">
                <table className="table table-sm table-fiche align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Dates</th>
                      <th>Clients</th>
                      <th className="text-end">Qté</th>
                      <th className="text-end">Prix unit.</th>
                      <th className="text-end">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {b.ventes.map((v) => (
                      <tr key={v.id}>
                        <td>
                          {dateFr(v.date)} <span className="text-body-secondary small">J{v.age}</span>
                        </td>
                        <td>{v.client || '—'}</td>
                        <td className="text-end">{nombre(v.quantite)}</td>
                        <td className="text-end">{fcfa(v.prixUnitaire)}</td>
                        <td className="text-end fw-semibold">{fcfa(v.montant)}</td>
                      </tr>
                    ))}
                    {!b.ventes.length && (
                      <tr>
                        <td colSpan={5} className="text-center text-body-secondary py-3">
                          Aucune vente
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={2}>Total ventes</td>
                      <td className="text-end">{nombre(ventesQte)}</td>
                      <td />
                      <td className="text-end">{fcfa(b.chiffreAffaires)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-lg-6">
          <div className="card h-100">
            <div className="card-body">
              <h2 className="titre-graphique">Effectif</h2>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={b.evolution} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke={c.grille} vertical={false} />
                  <XAxis dataKey="age" type="number" domain={['dataMin', 'dataMax']} allowDecimals={false} tickFormatter={(a) => `J${a}`} {...axe} />
                  <YAxis allowDecimals={false} width={44} {...axe} axisLine={false} />
                  <Tooltip {...infobulle} labelFormatter={(a) => `Jour ${a}`} formatter={(v) => [nombre(Number(v)), 'Poulets']} />
                  <Line isAnimationActive={false} type="stepAfter" dataKey="vivants" stroke={c.serie1} strokeWidth={2} dot={false} activeDot={{ r: 5, stroke: c.surface, strokeWidth: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <div className="col-12 col-lg-6">
          <div className="card h-100">
            <div className="card-body">
              <h2 className="titre-graphique">Coût de revient d'un poulet</h2>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={b.evolution} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke={c.grille} vertical={false} />
                  <XAxis dataKey="age" type="number" domain={['dataMin', 'dataMax']} allowDecimals={false} tickFormatter={(a) => `J${a}`} {...axe} />
                  <YAxis width={52} tickFormatter={compact} {...axe} axisLine={false} />
                  <Tooltip {...infobulle} labelFormatter={(a) => `Jour ${a}`} formatter={(v) => [fcfa(Number(v)), 'Coût / poulet']} />
                  <Line isAnimationActive={false} type="stepAfter" dataKey="coutUnitaire" stroke={c.serie1} strokeWidth={2} dot={false} activeDot={{ r: 5, stroke: c.surface, strokeWidth: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {b.pertes.length > 0 && (
        <div className="card">
          <div className="card-body">
            <h2 className="titre-graphique">Pertes · {fcfa(b.coutPertes)} perdus</h2>
            <div className="table-responsive">
              <table className="table table-sm align-middle mb-0">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Âge</th>
                    <th className="text-end">Nombre</th>
                    <th>Cause</th>
                    <th className="text-end">Sacs consommés</th>
                    <th className="text-end">Dépense perdue</th>
                  </tr>
                </thead>
                <tbody>
                  {b.pertes.map((p) => (
                    <tr key={p.id}>
                      <td>{dateFr(p.date)}</td>
                      <td>J{p.age}</td>
                      <td className="text-end">{nombre(p.nombre)}</td>
                      <td>{p.cause || '—'}</td>
                      <td className="text-end">{nombre(p.sacsTotal)}</td>
                      <td className="text-end texte-negatif fw-semibold">{fcfa(p.coutTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
