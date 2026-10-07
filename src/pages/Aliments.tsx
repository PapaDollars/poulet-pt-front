import { useState } from 'react'
import { useCharger } from '../useCharger'
import type { Formule } from '../types'
import Distribuer from './aliments/Distribuer'
import Fabriquer from './aliments/Fabriquer'
import Formules from './aliments/Formules'
import Historique from './aliments/Historique'

type Onglet = 'fabriquer' | 'distribuer' | 'historique' | 'formules'

const ONGLETS: { cle: Onglet; libelle: string }[] = [
  { cle: 'fabriquer', libelle: '1. Fabriquer un mélange' },
  { cle: 'distribuer', libelle: '2. Donner des sacs aux bandes' },
  { cle: 'historique', libelle: 'Historique' },
  { cle: 'formules', libelle: 'Formules' },
]

export default function Aliments() {
  const [onglet, setOnglet] = useState<Onglet>('fabriquer')
  const formules = useCharger<Formule[]>('/formules')
  // Formule à charger dans l'onglet Fabriquer (depuis l'onglet Formules)
  const [formuleAUtiliser, setFormuleAUtiliser] = useState<string | null>(null)

  return (
    <>
      <h1 className="titre-page">Aliments</h1>
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
          apresFabrication={() => setOnglet('distribuer')}
        />
      )}
      {onglet === 'distribuer' && <Distribuer />}
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
