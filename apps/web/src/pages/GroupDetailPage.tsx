import { useParams } from 'react-router-dom'
import { AppShell } from '../components/AppShell'

/** Placeholder until CT-012 (detalle de grupo). */
export function GroupDetailPage() {
  const { groupId } = useParams()

  return (
    <AppShell showBack>
      <section className="detail-stub">
        <h1>Detalle de grupo</h1>
        <p>
          Próximo ticket <strong>CT-012</strong>: integrantes, semáforo editable y
          links.
        </p>
        <p className="detail-stub__id">
          Grupo: <code>{groupId}</code>
        </p>
      </section>
    </AppShell>
  )
}
