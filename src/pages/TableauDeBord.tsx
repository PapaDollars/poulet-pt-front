import { faTriangleExclamation } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useBande } from '../BandeContext'
import Carte from '../composants/Carte'
import SansBande from '../composants/SansBande'
import { fcfa, kg, moisFr, nombre } from '../format'
import type { TableauDeBord as Donnees } from '../types'
import { useCharger } from '../useCharger'

/** Couleurs des graphiques lues depuis les variables CSS (clair / sombre). */
function useCouleurs() {
  const lire = () => {
    const s = getComputedStyle(document.documentElement)
    const v = (nom: string) => s.getPropertyValue(nom).trim()
    return { serie1: v('--serie-1'), serie2: v('--serie-2'), grille: v('--grille'), texte: v('--texte-axe'), surface: v('--bs-body-bg') }
  }
  const [couleurs, setCouleurs] = useState(lire)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const maj = () => setTimeout(() => setCouleurs(lire), 0)
    mq.addEventListener('change', maj)
    return () => mq.removeEventListener('change', maj)
  }, [])
  return couleurs
}

const compact = (n: number) => new Intl.NumberFormat('fr-FR', { notation: 'compact', maximumFractionDigits: 1 }).format(n)

export default function TableauDeBord() {
  const { bande: bandeChoisie } = useBande()
  const { donnees } = useCharger<Donnees>(`/tableau-de-bord${bandeChoisie ? `?bandeId=${bandeChoisie.id}` : ''}`)
  const c = useCouleurs()

  if (!donnees) return <p className="text-body-secondary">Chargement…</p>
  const b = donnees.bande

  const axe = { stroke: c.grille, tick: { fill: c.texte, fontSize: 12 }, tickLine: false }
  const infobulle = {
    contentStyle: { background: c.surface, border: `1px solid ${c.grille}`, borderRadius: 8, fontSize: 13 },
    labelStyle: { color: c.texte },
  }

  const moisGraphique = donnees.parMois.map((m) => ({
    mois: moisFr(m.mois),
    Dépenses: m.aliment + m.poussins + m.medicament + m.autre,
    Ventes: m.ventes,
  }))

  return (
    <>
      <h1 className="titre-page">Tableau de bord{b ? ` — ${b.nom}` : ''}</h1>

      {donnees.alertesStock.length > 0 && (
        <div className="alert alert-warning d-flex gap-2 align-items-start">
          <FontAwesomeIcon icon={faTriangleExclamation} className="mt-1" />
          <div>
            <strong>Stock épuisé :</strong> {donnees.alertesStock.map((s) => `${s.nom} (${kg(s.stockKg)})`).join(', ')}.{' '}
            <Link to="/achats">Enregistrer un achat</Link>
          </div>
        </div>
      )}

      {!b ? (
        <SansBande />
      ) : (
        <>
          <div className="row g-3 mb-3">
            <div className="col-6 col-xl-3">
              <Carte
                titre="Poulets vivants"
                valeur={nombre(b.vivants)}
                detail={`J${b.age} · ${nombre(b.nombreInitial)} au départ · ${nombre(b.vendus)} vendus`}
              />
            </div>
            <div className="col-6 col-xl-3">
              <Carte
                titre="Mortalité"
                valeur={`${nombre(b.tauxMortalite)} %`}
                ton={b.tauxMortalite > 5 ? 'negatif' : undefined}
                detail={`${nombre(b.morts)} morts · ${fcfa(b.coutPertes)} perdus`}
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
                titre="Résultat actuel"
                valeur={fcfa(b.benefice)}
                ton={b.benefice >= 0 ? 'positif' : 'negatif'}
                detail={`Ventes ${fcfa(b.chiffreAffaires)} − charges ${fcfa(b.chargesTotales)}`}
              />
            </div>
          </div>

          <div className="row g-3 mb-4">
            <div className="col-6 col-xl-3">
              <Carte titre="Charges de la bande" valeur={fcfa(b.chargesTotales)} />
            </div>
            <div className="col-6 col-xl-3">
              <Carte titre="Aliment mélangé" valeur={kg(b.alimentKg)} detail={`${kg(b.alimentKgParPoulet)} par poulet présent`} />
            </div>
            <div className="col-6 col-xl-3">
              <Carte titre="Valeur du cheptel" valeur={fcfa(b.valeurCheptel)} detail="Vivants × coût de revient" />
            </div>
            <div className="col-6 col-xl-3">
              <Carte titre="Valeur du stock" valeur={fcfa(donnees.global.valeurStock)} detail={<Link to="/stock">Voir le stock</Link>} />
            </div>
          </div>

          <div className="row g-3 mb-4">
            <div className="col-12 col-lg-6">
              <div className="card h-100">
                <div className="card-body">
                  <h2 className="titre-graphique">Effectif de la bande</h2>
                  <ResponsiveContainer width="100%" height={240}>
                    <LineChart data={b.evolution} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                      <CartesianGrid stroke={c.grille} strokeDasharray="0" vertical={false} />
                      <XAxis dataKey="age" type="number" domain={['dataMin', 'dataMax']} allowDecimals={false} tickFormatter={(a) => `J${a}`} {...axe} />
                      <YAxis allowDecimals={false} width={44} {...axe} axisLine={false} />
                      <Tooltip {...infobulle} labelFormatter={(a) => `Jour ${a}`} formatter={(v) => [nombre(Number(v)), 'Vivants']} />
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
                  <ResponsiveContainer width="100%" height={240}>
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

          <div className="row g-3 mb-4">
            <div className="col-12 col-lg-7">
              <div className="card h-100">
                <div className="card-body">
                  <h2 className="titre-graphique">Dépenses et ventes par mois (toutes bandes)</h2>
                  {moisGraphique.length ? (
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={moisGraphique} margin={{ top: 8, right: 16, left: 0, bottom: 0 }} barGap={2}>
                        <CartesianGrid stroke={c.grille} vertical={false} />
                        <XAxis dataKey="mois" {...axe} />
                        <YAxis width={52} tickFormatter={compact} {...axe} axisLine={false} />
                        <Tooltip {...infobulle} cursor={{ fill: c.grille, opacity: 0.4 }} formatter={(v, nom) => [fcfa(Number(v)), nom]} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: 13 }} formatter={(nom) => <span style={{ color: c.texte }}>{nom}</span>} />
                        <Bar isAnimationActive={false} dataKey="Dépenses" fill={c.serie2} radius={[4, 4, 0, 0]} maxBarSize={32} />
                        <Bar isAnimationActive={false} dataKey="Ventes" fill={c.serie1} radius={[4, 4, 0, 0]} maxBarSize={32} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-body-secondary">Aucune opération enregistrée.</p>
                  )}
                </div>
              </div>
            </div>
            <div className="col-12 col-lg-5">
              <div className="card h-100">
                <div className="card-body">
                  <h2 className="titre-graphique">Répartition des charges</h2>
                  {[
                    { nom: 'Poussins', montant: b.coutPoussins },
                    { nom: 'Aliments', montant: b.coutAliments },
                    { nom: 'Médicaments et divers', montant: b.coutSoins },
                  ].map((r) => {
                    const part = b.chargesTotales ? (r.montant / b.chargesTotales) * 100 : 0
                    return (
                      <div key={r.nom} className="mb-3">
                        <div className="d-flex justify-content-between small">
                          <span>{r.nom}</span>
                          <span>
                            <strong>{fcfa(r.montant)}</strong> <span className="text-body-secondary">· {Math.round(part)} %</span>
                          </span>
                        </div>
                        <div className="jauge">
                          <div className="jauge-remplie" style={{ width: `${part}%` }} />
                        </div>
                      </div>
                    )
                  })}
                  <hr />
                  <div className="d-flex justify-content-between small">
                    <span>Achats toutes bandes</span>
                    <strong>{fcfa(donnees.global.totalAchats)}</strong>
                  </div>
                  <div className="d-flex justify-content-between small">
                    <span>Ventes toutes bandes</span>
                    <strong>{fcfa(donnees.global.totalVentes)}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
