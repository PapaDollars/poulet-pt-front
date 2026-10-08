import { faTrash } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { toast } from 'react-toastify'
import { api, messageErreur } from '../api'

interface Props {
  titre: ReactNode
  fermer: () => void
  enregistrer: (e: FormEvent) => void
  boutons: ReactNode
  children: ReactNode
  // Suppression placée dans la fenêtre (et non dans les tableaux) pour éviter les clics accidentels
  suppression?: { url: string; confirmation: string; apres: () => void; impossible?: string }
}

/** Fenêtre (modal) avec formulaire : Échap ou clic à côté pour fermer. */
export default function Fenetre({ titre, fermer, enregistrer, boutons, children, suppression }: Props) {
  const [suppressionEnCours, setSuppressionEnCours] = useState(false)

  async function supprimer() {
    if (!suppression || !window.confirm(suppression.confirmation)) return
    setSuppressionEnCours(true)
    try {
      await api.delete(suppression.url)
      toast.success('Supprimé')
      suppression.apres()
      fermer()
    } catch (err) {
      toast.error(messageErreur(err))
    } finally {
      setSuppressionEnCours(false)
    }
  }

  useEffect(() => {
    const touche = (e: KeyboardEvent) => e.key === 'Escape' && fermer()
    window.addEventListener('keydown', touche)
    return () => window.removeEventListener('keydown', touche)
  }, [fermer])

  return (
    <>
      <div className="modal d-block" role="dialog" aria-modal="true" aria-labelledby="titre-fenetre" onClick={fermer}>
        <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
          <form
            className="modal-content"
            onSubmit={(e) => {
              e.preventDefault()
              enregistrer(e)
            }}
          >
            <div className="modal-header">
              <h2 className="modal-title h5" id="titre-fenetre">
                {titre}
              </h2>
              <button type="button" className="btn-close" onClick={fermer} aria-label="Fermer" />
            </div>
            <div className="modal-body">{children}</div>
            <div className="modal-footer">
              {suppression && (
                <button
                  type="button"
                  className="btn btn-outline-danger me-auto"
                  onClick={supprimer}
                  disabled={suppressionEnCours || Boolean(suppression.impossible)}
                  title={suppression.impossible}
                >
                  <FontAwesomeIcon icon={faTrash} /> Supprimer
                </button>
              )}
              <button type="button" className="btn btn-outline-secondary" onClick={fermer}>
                Annuler
              </button>
              {boutons}
            </div>
          </form>
        </div>
      </div>
      <div className="modal-backdrop show" />
    </>
  )
}
