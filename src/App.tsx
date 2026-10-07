import { Route, Routes } from 'react-router-dom'
import { BandeProvider } from './BandeContext'
import Layout from './composants/Layout'
import Achats from './pages/Achats'
import Aliments from './pages/Aliments'
import Bandes from './pages/Bandes'
import FicheBande from './pages/FicheBande'
import Parametres from './pages/Parametres'
import Pertes from './pages/Pertes'
import Stock from './pages/Stock'
import TableauDeBord from './pages/TableauDeBord'
import Ventes from './pages/Ventes'

function App() {
  return (
    <BandeProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<TableauDeBord />} />
          <Route path="achats" element={<Achats />} />
          <Route path="aliments" element={<Aliments />} />
          <Route path="ventes" element={<Ventes />} />
          <Route path="pertes" element={<Pertes />} />
          <Route path="stock" element={<Stock />} />
          <Route path="bandes" element={<Bandes />} />
          <Route path="bandes/:id" element={<FicheBande />} />
          <Route path="parametres" element={<Parametres />} />
        </Route>
      </Routes>
    </BandeProvider>
  )
}

export default App
