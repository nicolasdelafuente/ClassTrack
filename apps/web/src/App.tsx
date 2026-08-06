import { useEffect, useState } from 'react'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api'

function App() {
  const [apiStatus, setApiStatus] = useState<string>('cargando…')

  useEffect(() => {
    fetch(`${API_URL}/health`)
      .then((res) => res.json())
      .then((data) => setApiStatus(data.status === 'ok' ? 'API conectada' : 'respuesta inesperada'))
      .catch(() => setApiStatus('API no disponible (¿está corriendo apps/api?)'))
  }, [])

  return (
    <main className="app">
      <h1>ClassTrack</h1>
      <p>Seguimiento docente — Desarrollo de Aplicaciones (UNaHur)</p>
      <p className="status">
        Estado API: <strong>{apiStatus}</strong>
      </p>
      <p className="hint">Monorepo: <code>apps/web</code> + <code>apps/api</code> (CT-009)</p>
    </main>
  )
}

export default App
