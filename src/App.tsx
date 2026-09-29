import { useEffect, useState } from 'react'

type ApiStatus = 'chargement' | 'ok' | 'erreur'

function App() {
  const [status, setStatus] = useState<ApiStatus>('chargement')

  useEffect(() => {
    fetch('/api/health')
      .then((res) => setStatus(res.ok ? 'ok' : 'erreur'))
      .catch(() => setStatus('erreur'))
  }, [])

  return (
    <main className="app">
      <h1>Poulet PT</h1>
      <p>Gestion d'élevage de poulets de chair</p>
      <p>
        API : <strong className={`status status-${status}`}>{status}</strong>
      </p>
    </main>
  )
}

export default App
