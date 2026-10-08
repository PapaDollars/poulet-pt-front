import { useBande } from '../BandeContext'
import { nombre } from '../format'

/** Choix de la bande concernée par une opération ; toute la page suit la bande choisie. */
export default function ChoixBande() {
  const { bandes, bande, choisirBande } = useBande()
  // Les bandes qui ont encore des poulets, plus celle affichée (même terminée)
  const choix = bandes.filter((b) => b.vivants > 0 || b.id === bande?.id)

  return (
    <>
      <label className="form-label" htmlFor="choix-bande-operation">
        Bande
      </label>
      <select id="choix-bande-operation" className="form-select" value={bande?.id ?? ''} onChange={(e) => choisirBande(e.target.value)} required>
        {choix.map((b) => (
          <option key={b.id} value={b.id}>
            {b.nom} — {nombre(b.vivants)} vivants · J{b.age}
          </option>
        ))}
      </select>
    </>
  )
}
