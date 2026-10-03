import { Link } from 'react-router-dom'

export default function SansBande() {
  return (
    <div className="alert alert-info">
      Aucune bande pour le moment. Enregistrez un <Link to="/achats">achat de poussins</Link> : la bande est créée
      automatiquement.
    </div>
  )
}
