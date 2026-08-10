import { useState } from 'react'
import { Button } from '../atoms/Button'
import {
  exportSheetToDocx,
  exportSheetToPdf,
} from '../../lib/sheetExport'
import type { SprintSheet } from '../../types'

type SheetExportActionsProps = {
  sheet: SprintSheet
  groupLabel: string
  className?: string
}

/**
 * Export sprint sheet to PDF (print) or Word (.docx). CT-057.
 */
export function SheetExportActions({
  sheet,
  groupLabel,
  className,
}: SheetExportActionsProps) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handlePdf() {
    setError(null)
    try {
      exportSheetToPdf(sheet, { groupLabel })
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No se pudo abrir la impresión',
      )
    }
  }

  async function handleDocx() {
    setBusy(true)
    setError(null)
    try {
      await exportSheetToDocx(sheet, { groupLabel })
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No se pudo generar el Word',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          className="min-h-11"
          disabled={busy}
          onClick={handlePdf}
        >
          Exportar PDF
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="min-h-11"
          disabled={busy}
          onClick={() => void handleDocx()}
        >
          {busy ? 'Generando Word…' : 'Descargar Word'}
        </Button>
      </div>
      {error ? (
        <p className="mt-1.5 m-0 text-[12px] text-critical" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
