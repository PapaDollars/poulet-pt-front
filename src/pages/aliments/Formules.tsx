import BoutonSupprimer from '../../composants/BoutonSupprimer'
import { fcfa, nombre, TYPES_ALIMENT } from '../../format'
import type { Formule } from '../../types'

interface Props {
  formules: Formule[]
  recharger: () => Promise<void>
  utiliser: (id: string) => void
}

/** Formules enregistrées : on les réutilise (et modifie) dans l'onglet Fabriquer. */
export default function Formules({ formules, recharger, utiliser }: Props) {
  return (
    <>
      <p className="text-body-secondary">
        Une formule est une recette réutilisable. Choisissez « Utiliser » pour la charger dans l'onglet Fabriquer : vous pourrez y changer les
        quantités, les prix, retirer ou ajouter des produits, puis mettre la formule à jour ou en créer une nouvelle.
      </p>
      <div className="row g-3">
        {formules.map((f) => {
          const cout = f.lignes.reduce((t, l) => t + l.quantite * l.prixUnitaire, 0)
          return (
            <div className="col-12 col-lg-6 col-xxl-4" key={f.id}>
              <div className="card h-100">
                <div className="card-body">
                  <div className="d-flex align-items-start gap-2 mb-2">
                    <div>
                      <h2 className="h6 mb-1">{f.nom}</h2>
                      <span className={`badge badge-${f.type}`}>{TYPES_ALIMENT[f.type]}</span>{' '}
                      <span className="small text-body-secondary">{nombre(f.nombreSacs)} sacs par mélange</span>
                    </div>
                    <div className="ms-auto text-nowrap">
                      <button className="btn btn-sm btn-primary me-2" onClick={() => utiliser(f.id)}>
                        Utiliser
                      </button>
                      <BoutonSupprimer url={`/formules/${f.id}`} confirmation={`Supprimer la formule ${f.nom} ?`} apres={recharger} />
                    </div>
                  </div>
                  <table className="table table-sm small mb-2">
                    <tbody>
                      {f.lignes.map((l, i) => (
                        <tr key={i}>
                          <td>{l.nom}</td>
                          <td className="text-end">
                            {nombre(l.quantite)} {l.unite}
                          </td>
                          <td className="text-end text-body-secondary">{fcfa(l.prixUnitaire)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="small">
                    Coût indicatif : <strong>{fcfa(cout)}</strong> · <strong>{fcfa(f.nombreSacs ? cout / f.nombreSacs : 0)}</strong> le sac
                  </div>
                </div>
              </div>
            </div>
          )
        })}
        {!formules.length && <p className="text-body-secondary">Aucune formule : composez un mélange dans l'onglet Fabriquer et enregistrez-le.</p>}
      </div>
    </>
  )
}
