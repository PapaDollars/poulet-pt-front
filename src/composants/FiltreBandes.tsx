import { useBande } from '../BandeContext'

interface Props {
  valeur: string
  changer: (bandeId: string) => void
}

/** Filtre d'un tableau : toutes les bandes ou une seule. */
export default function FiltreBandes({ valeur, changer }: Props) {
  const { bandes } = useBande()
  return (
    <div className="d-flex align-items-center gap-2 mb-2">
      <label className="text-body-secondary small text-nowrap" htmlFor="filtre-bandes">
        Afficher
      </label>
      <select id="filtre-bandes" className="form-select form-select-sm" style={{ maxWidth: 260 }} value={valeur} onChange={(e) => changer(e.target.value)}>
        <option value="">Toutes les bandes</option>
        {bandes.map((b) => (
          <option key={b.id} value={b.id}>
            {b.nom}
          </option>
        ))}
      </select>
    </div>
  )
}
