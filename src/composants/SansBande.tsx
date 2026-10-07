import { Link } from 'react-router-dom'

export default function SansBande() {
  return (
    <div className="alert alert-info">
      Aucune bande pour le moment. <Link to="/bandes">Créez une bande</Link> à l'arrivée des poussins.
    </div>
  )
}
