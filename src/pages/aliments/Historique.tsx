import { Fragment, useState } from 'react'
import { dateFr, fcfa, nombre, TYPES_ALIMENT } from '../../format'
import type { Fabrication } from '../../types'
import { useCharger } from '../../useCharger'

/** Mélanges fabriqués : composition, prix du sac, sacs restants. */
export default function Historique() {
  const fabrications = useCharger<Fabrication[]>('/fabrications')
  const [ouvert, setOuvert] = useState<string | null>(null)

  return (
    <div className="card">
      <div className="table-responsive">
        <table className="table table-hover align-middle mb-0">
          <thead>
            <tr>
              <th>Date</th>
              <th>Mélange</th>
              <th>Type</th>
              <th className="text-end">Sacs</th>
              <th className="text-end">Coût d'un mélange</th>
              <th className="text-end">Prix du sac</th>
              <th className="text-end">Total</th>
              <th className="text-end">Restants</th>
            </tr>
          </thead>
          <tbody>
            {(fabrications.donnees ?? []).map((f) => (
              <Fragment key={f.id}>
                <tr className="ligne-cliquable" onClick={() => setOuvert(ouvert === f.id ? null : f.id)}>
                  <td>{dateFr(f.date)}</td>
                  <td className="fw-semibold">
                    {ouvert === f.id ? '▾' : '▸'} {f.nom}
                  </td>
                  <td>
                    <span className={`badge badge-${f.type}`}>{TYPES_ALIMENT[f.type]}</span>
                  </td>
                  <td className="text-end">
                    {f.repetitions > 1 ? `${f.repetitions} × ${nombre(f.nombreSacs)} = ` : ''}
                    {nombre(f.nombreSacs * f.repetitions)}
                  </td>
                  <td className="text-end">{fcfa(f.montant)}</td>
                  <td className="text-end fw-semibold">{fcfa(f.prixSac)}</td>
                  <td className="text-end">{fcfa(f.montantTotal)}</td>
                  <td className="text-end">{nombre(f.restants)}</td>
                </tr>
                {ouvert === f.id && (
                  <tr>
                    <td colSpan={8} className="bg-body-tertiary">
                      <table className="table table-sm mb-0 small">
                        <tbody>
                          {f.lignes.map((l, i) => (
                            <tr key={i}>
                              <td>
                                {l.nom} {l.depuisStock && <span className="badge text-bg-secondary">retiré du stock</span>}
                              </td>
                              <td className="text-end">
                                {nombre(l.quantite)} {l.unite}
                                {f.repetitions > 1 && <span className="text-body-secondary"> (× {f.repetitions} = {nombre(l.quantite * f.repetitions)})</span>}
                              </td>
                              <td className="text-end">× {fcfa(l.prixUnitaire)}</td>
                              <td className="text-end fw-semibold">{fcfa(l.montant)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
            {!fabrications.chargement && !fabrications.donnees?.length && (
              <tr>
                <td colSpan={8} className="text-center text-body-secondary py-4">
                  Aucun mélange fabriqué
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
