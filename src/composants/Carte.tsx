import type { ReactNode } from 'react'

interface Props {
  titre: string
  valeur: ReactNode
  detail?: ReactNode
  ton?: 'positif' | 'negatif'
}

/** Tuile de statistique : un libellé, une valeur, un détail optionnel. */
export default function Carte({ titre, valeur, detail, ton }: Props) {
  return (
    <div className="card carte-stat h-100">
      <div className="card-body">
        <div className="carte-titre">{titre}</div>
        <div className={`carte-valeur ${ton ? `texte-${ton}` : ''}`}>{valeur}</div>
        {detail && <div className="carte-detail">{detail}</div>}
      </div>
    </div>
  )
}
