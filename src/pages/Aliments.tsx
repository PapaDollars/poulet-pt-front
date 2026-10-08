import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCharger } from '../useCharger'
import type { Formule } from '../types'
import Fabriquer from './aliments/Fabriquer'
import Formules from './aliments/Formules'
import Historique from './aliments/Historique'

type Onglet = 'fabriquer' | 'formules' | 'historique'

const ONGLETS: { cle: Onglet; libelle: string }[] = [
  { cle: 'fabriquer', libelle: 'Fabriquer un mélange' },
  { cle: 'formules', libelle: 'Formules' },
  { cle: 'historique', libelle: 'Historique' },
]

export default function Fabrications() {
  const naviguer = useNavigate()
  const [onglet, setOnglet] = useState<Onglet>('fabriquer')
  const formules = useCharger<Formule[]>('/formules')
  // Formule à charger dans l'onglet Fabriquer (depuis l'onglet Formules)
  const [formuleAUtiliser, setFormuleAUtiliser] = useState<string | null>(null)

  return (
    <>
      <h1 className="titre-page">Fabrications</h1>
      <ul className="nav nav-tabs mb-4">
        {ONGLETS.map((o) => (
          <li className="nav-item" key={o.cle}>
            <button className={`nav-link ${onglet === o.cle ? 'active' : ''}`} onClick={() => setOnglet(o.cle)}>
              {o.libelle}
            </button>
          </li>
        ))}
      </ul>

      {onglet === 'fabriquer' && (
        <Fabriquer
          formules={formules.donnees ?? []}
          rechargerFormules={formules.recharger}
          formuleInitiale={formuleAUtiliser}
          apresFabrication={() => naviguer('/bandes?onglet=sacs')}
        />
      )}
      {onglet === 'historique' && <Historique />}
      {onglet === 'formules' && (
        <Formules
          formules={formules.donnees ?? []}
          recharger={formules.recharger}
          utiliser={(id) => {
            setFormuleAUtiliser(id)
            setOnglet('fabriquer')
          }}
        />
      )}
    </>
  )
}
