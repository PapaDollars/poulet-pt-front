import { faTrash } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { toast } from 'react-toastify'
import { api, messageErreur } from '../api'

interface Props {
  url: string
  confirmation: string
  apres: () => void
}

export default function BoutonSupprimer({ url, confirmation, apres }: Props) {
  async function supprimer() {
    if (!window.confirm(confirmation)) return
    try {
      await api.delete(url)
      toast.success('Supprimé')
      apres()
    } catch (err) {
      toast.error(messageErreur(err))
    }
  }
  return (
    <button className="btn btn-sm btn-link text-danger p-0" onClick={supprimer} title="Supprimer" aria-label="Supprimer">
      <FontAwesomeIcon icon={faTrash} />
    </button>
  )
}
