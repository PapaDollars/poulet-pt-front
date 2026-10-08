import {
  faBoxesStacked,
  faCartShopping,
  faChartLine,
  faGear,
  faLayerGroup,
  faBars,
  faSackDollar,
  faSkullCrossbones,
  faWheatAwn,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useBande } from '../BandeContext'
import { nombre } from '../format'

const MENU = [
  { to: '/', label: 'Tableau de bord', icone: faChartLine },
  { to: '/bandes', label: 'Bandes', icone: faLayerGroup },
  { to: '/achats', label: 'Achats', icone: faCartShopping },
  { to: '/fabrications', label: 'Fabrications', icone: faWheatAwn },
  { to: '/stock', label: 'Stock', icone: faBoxesStacked },
  { to: '/ventes', label: 'Ventes', icone: faSackDollar },
  { to: '/pertes', label: 'Pertes', icone: faSkullCrossbones },
  { to: '/parametres', label: 'Paramètres', icone: faGear },
]

export default function Layout() {
  const { bandes, bande, choisirBande } = useBande()
  const [menuOuvert, setMenuOuvert] = useState(false)

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOuvert ? 'ouvert' : ''}`}>
        <div className="sidebar-logo">🐔 Poulet PT</div>
        <nav>
          {MENU.map((m) => (
            <NavLink key={m.to} to={m.to} end={m.to === '/'} className="sidebar-lien" onClick={() => setMenuOuvert(false)}>
              <FontAwesomeIcon icon={m.icone} fixedWidth />
              <span>{m.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
      {menuOuvert && <div className="sidebar-fond" onClick={() => setMenuOuvert(false)} />}

      <div className="contenu">
        <header className="barre-haut">
          <button className="btn btn-outline-secondary d-lg-none" onClick={() => setMenuOuvert(true)} aria-label="Ouvrir le menu">
            <FontAwesomeIcon icon={faBars} />
          </button>
          <div className="d-flex align-items-center gap-2 ms-auto">
            <label htmlFor="choix-bande" className="text-body-secondary small text-nowrap">
              Bande
            </label>
            <select
              id="choix-bande"
              className="form-select form-select-sm"
              value={bande?.id ?? ''}
              onChange={(e) => choisirBande(e.target.value)}
              disabled={!bandes.length}
            >
              {!bandes.length && <option value="">Aucune bande — créez-en une</option>}
              {bandes.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.nom} — {nombre(b.vivants)} vivants {b.cloturee ? '(terminée)' : `· J${b.age}`}
                </option>
              ))}
            </select>
          </div>
        </header>
        <main className="page">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
