import { sanitizeRichHtml } from '../components/molecules/RichTextEditor'
import {
  SHEET_STATUS_LABELS,
  TASK_CATEGORY_LABELS,
  type SprintSheet,
  type SprintSheetTask,
  type TaskCategory,
} from '../types'

export type SheetExportMeta = {
  groupLabel: string
}

type TextBlock =
  | { type: 'p'; text: string; bold?: boolean; italics?: boolean }
  | { type: 'li'; text: string }

function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function kindLabel(kind: SprintSheet['kind']): string {
  return kind === 'start' ? 'Inicio' : 'Fin'
}

function formatDate(iso: string | null): string | null {
  if (!iso) return null
  try {
    return new Intl.DateTimeFormat('es-AR', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

function categoryLabels(categories: TaskCategory[]): string {
  return categories.map((c) => TASK_CATEGORY_LABELS[c] ?? c).join(', ')
}

function fileBaseName(sheet: SprintSheet): string {
  const kind = sheet.kind === 'start' ? 'inicio' : 'fin'
  return `ficha-sprint-${sheet.sprintNumber}-${kind}`
}

/** Convert sanitized sheet HTML into plain text blocks for Word. */
export function htmlToPlainBlocks(raw: string): TextBlock[] {
  const html = sanitizeRichHtml(raw)
  if (!html) return []

  if (typeof DOMParser === 'undefined') {
    const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    return text ? [{ type: 'p', text }] : []
  }

  const doc = new DOMParser().parseFromString(html, 'text/html')
  const blocks: TextBlock[] = []

  function textOf(node: Node): string {
    return (node.textContent ?? '').replace(/\s+/g, ' ').trim()
  }

  function walk(node: Node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = textOf(node)
      if (text) blocks.push({ type: 'p', text })
      return
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return
    const el = node as HTMLElement
    const tag = el.tagName

    if (tag === 'BR') {
      blocks.push({ type: 'p', text: '' })
      return
    }
    if (tag === 'LI') {
      const text = textOf(el)
      if (text) blocks.push({ type: 'li', text })
      return
    }
    if (tag === 'UL' || tag === 'OL') {
      for (const child of Array.from(el.childNodes)) walk(child)
      return
    }
    if (tag === 'P' || tag === 'DIV') {
      const text = textOf(el)
      if (!text) {
        for (const child of Array.from(el.childNodes)) walk(child)
        return
      }
      const bold = Boolean(el.querySelector('b, strong'))
      const italics = Boolean(el.querySelector('i, em'))
      const hasList = el.querySelector('ul, ol')
      if (hasList) {
        for (const child of Array.from(el.childNodes)) walk(child)
      } else {
        blocks.push({ type: 'p', text, bold, italics })
      }
      return
    }
    if (
      tag === 'B' ||
      tag === 'STRONG' ||
      tag === 'I' ||
      tag === 'EM' ||
      tag === 'U'
    ) {
      const text = textOf(el)
      if (text) {
        blocks.push({
          type: 'p',
          text,
          bold: tag === 'B' || tag === 'STRONG',
          italics: tag === 'I' || tag === 'EM',
        })
      }
      return
    }
    for (const child of Array.from(el.childNodes)) walk(child)
  }

  for (const child of Array.from(doc.body.childNodes)) walk(child)

  return blocks.filter((b) => b.type === 'li' || b.text.length > 0)
}

function taskStatusLine(
  sheet: SprintSheet,
  task: SprintSheetTask,
): string | null {
  if (sheet.kind !== 'end') return null
  if (task.isExtra) return 'Extra'
  if (task.completed === true) return 'Hecha'
  if (task.completed === false) return 'No hecha'
  return 'Sin marcar'
}

function buildPrintHtml(sheet: SprintSheet, meta: SheetExportMeta): string {
  const tasksHtml = sheet.tasks
    .map((task, index) => {
      const cats = categoryLabels(task.categories ?? [])
      const status = taskStatusLine(sheet, task)
      const desc = task.description
        ? `<div class="rich">${sanitizeRichHtml(task.description)}</div>`
        : ''
      const incomplete =
        sheet.kind === 'end' &&
        !task.isExtra &&
        task.completed === false &&
        task.incompleteReason
          ? `<p class="meta"><strong>Motivo:</strong></p><div class="rich">${sanitizeRichHtml(task.incompleteReason)}</div>`
          : ''
      const extra =
        sheet.kind === 'end' && task.isExtra && task.extraReason
          ? `<p class="meta"><strong>Motivo extra:</strong></p><div class="rich">${sanitizeRichHtml(task.extraReason)}</div>`
          : ''
      const links = (task.trelloLinks ?? [])
        .filter(Boolean)
        .map(
          (url) =>
            `<li><a href="${escapeHtml(url)}">${escapeHtml(url)}</a></li>`,
        )
        .join('')
      return `
        <section class="task">
          <h3>${index + 1}. ${escapeHtml(task.title)}</h3>
          ${cats ? `<p class="meta">Tags: ${escapeHtml(cats)}</p>` : ''}
          ${status ? `<p class="meta">Estado: ${escapeHtml(status)}</p>` : ''}
          ${desc}
          ${incomplete}
          ${extra}
          ${links ? `<p class="meta">Trello</p><ul>${links}</ul>` : ''}
        </section>`
    })
    .join('')

  const commentsHtml =
    sheet.comments.length === 0
      ? '<p class="meta">Sin comentarios.</p>'
      : `<ul class="comments">${sheet.comments
          .map((c) => {
            const author = c.author.displayName?.trim() || c.author.email
            const when = formatDate(c.createdAt) ?? c.createdAt
            return `<li><strong>${escapeHtml(author)}</strong> · ${escapeHtml(when)}<br/>${escapeHtml(c.body)}</li>`
          })
          .join('')}</ul>`

  const submitted = formatDate(sheet.submittedAt)
  const approved = formatDate(sheet.approvedAt)

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(fileBaseName(sheet))}</title>
  <style>
    body { font-family: system-ui, Segoe UI, sans-serif; color: #111; margin: 24px; line-height: 1.45; }
    h1 { font-size: 20px; margin: 0 0 4px; }
    h2 { font-size: 15px; margin: 20px 0 8px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
    h3 { font-size: 14px; margin: 0 0 4px; }
    .meta { color: #555; font-size: 12px; margin: 2px 0; }
    .task { margin: 0 0 14px; padding-bottom: 10px; border-bottom: 1px solid #eee; }
    .rich { font-size: 13px; margin: 4px 0 6px; }
    .rich ul, .rich ol { margin: 4px 0 4px 1.2rem; padding: 0; }
    .comments { padding-left: 1.1rem; font-size: 13px; }
    a { color: #0b6; word-break: break-all; }
    @media print {
      body { margin: 12mm; }
      .task { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <p class="meta">ClassTrack</p>
  <h1>Sprint ${sheet.sprintNumber} · ${kindLabel(sheet.kind)}</h1>
  <p class="meta">${escapeHtml(meta.groupLabel)}</p>
  <p class="meta">Estado: ${escapeHtml(SHEET_STATUS_LABELS[sheet.status])}</p>
  ${submitted ? `<p class="meta">Enviada: ${escapeHtml(submitted)}</p>` : ''}
  ${approved ? `<p class="meta">Aprobada: ${escapeHtml(approved)}</p>` : ''}

  <h2>Tareas (${sheet.tasks.length})</h2>
  ${tasksHtml || '<p class="meta">Sin tareas.</p>'}

  <h2>Comentarios del docente</h2>
  ${commentsHtml}
</body>
</html>`
}

/** Open a print dialog so the user can save as PDF. */
export function exportSheetToPdf(
  sheet: SprintSheet,
  meta: SheetExportMeta,
): void {
  const html = buildPrintHtml(sheet, meta)
  const win = window.open(
    '',
    '_blank',
    'noopener,noreferrer,width=900,height=700',
  )
  if (!win) {
    throw new Error(
      'El navegador bloqueó la ventana de impresión. Permití popups para ClassTrack.',
    )
  }
  win.document.open()
  win.document.write(html)
  win.document.close()
  win.focus()
  window.setTimeout(() => {
    win.print()
  }, 250)
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

/** Build and download a .docx for the sprint sheet. */
export async function exportSheetToDocx(
  sheet: SprintSheet,
  meta: SheetExportMeta,
): Promise<void> {
  const {
    Document,
    ExternalHyperlink,
    HeadingLevel,
    Packer,
    Paragraph,
    TextRun,
  } = await import('docx')

  function blocksToParagraphs(blocks: TextBlock[]) {
    return blocks.map((b) => {
      if (b.type === 'li') {
        return new Paragraph({
          text: `• ${b.text}`,
          spacing: { after: 80 },
        })
      }
      return new Paragraph({
        children: [
          new TextRun({
            text: b.text,
            bold: b.bold,
            italics: b.italics,
          }),
        ],
        spacing: { after: 80 },
      })
    })
  }

  const children = [
    new Paragraph({
      text: 'ClassTrack',
      spacing: { after: 120 },
    }),
    new Paragraph({
      text: `Sprint ${sheet.sprintNumber} · ${kindLabel(sheet.kind)}`,
      heading: HeadingLevel.HEADING_1,
    }),
    new Paragraph({
      text: meta.groupLabel,
      spacing: { after: 80 },
    }),
    new Paragraph({
      text: `Estado: ${SHEET_STATUS_LABELS[sheet.status]}`,
      spacing: { after: 40 },
    }),
  ]

  const submitted = formatDate(sheet.submittedAt)
  const approved = formatDate(sheet.approvedAt)
  if (submitted) {
    children.push(
      new Paragraph({ text: `Enviada: ${submitted}`, spacing: { after: 40 } }),
    )
  }
  if (approved) {
    children.push(
      new Paragraph({ text: `Aprobada: ${approved}`, spacing: { after: 40 } }),
    )
  }

  children.push(
    new Paragraph({
      text: `Tareas (${sheet.tasks.length})`,
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 240 },
    }),
  )

  if (sheet.tasks.length === 0) {
    children.push(
      new Paragraph({ text: 'Sin tareas.', spacing: { after: 120 } }),
    )
  }

  sheet.tasks.forEach((task, index) => {
    children.push(
      new Paragraph({
        text: `${index + 1}. ${task.title}`,
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 160 },
      }),
    )
    const cats = categoryLabels(task.categories ?? [])
    if (cats) {
      children.push(
        new Paragraph({ text: `Tags: ${cats}`, spacing: { after: 40 } }),
      )
    }
    const status = taskStatusLine(sheet, task)
    if (status) {
      children.push(
        new Paragraph({ text: `Estado: ${status}`, spacing: { after: 40 } }),
      )
    }
    if (task.description) {
      children.push(...blocksToParagraphs(htmlToPlainBlocks(task.description)))
    }
    if (
      sheet.kind === 'end' &&
      !task.isExtra &&
      task.completed === false &&
      task.incompleteReason
    ) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: 'Motivo:', bold: true })],
          spacing: { before: 60 },
        }),
      )
      children.push(
        ...blocksToParagraphs(htmlToPlainBlocks(task.incompleteReason)),
      )
    }
    if (sheet.kind === 'end' && task.isExtra && task.extraReason) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: 'Motivo extra:', bold: true })],
          spacing: { before: 60 },
        }),
      )
      children.push(...blocksToParagraphs(htmlToPlainBlocks(task.extraReason)))
    }
    for (const url of task.trelloLinks ?? []) {
      if (!url.trim()) continue
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Trello: ' }),
            new ExternalHyperlink({
              children: [new TextRun({ text: url, style: 'Hyperlink' })],
              link: url,
            }),
          ],
          spacing: { after: 40 },
        }),
      )
    }
  })

  children.push(
    new Paragraph({
      text: 'Comentarios del docente',
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 280 },
    }),
  )

  if (sheet.comments.length === 0) {
    children.push(
      new Paragraph({ text: 'Sin comentarios.', spacing: { after: 80 } }),
    )
  } else {
    for (const c of sheet.comments) {
      const author = c.author.displayName?.trim() || c.author.email
      const when = formatDate(c.createdAt) ?? c.createdAt
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${author} · ${when}`, bold: true }),
          ],
          spacing: { before: 120 },
        }),
      )
      children.push(new Paragraph({ text: c.body, spacing: { after: 80 } }))
    }
  }

  const doc = new Document({
    sections: [{ children }],
  })
  const blob = await Packer.toBlob(doc)
  downloadBlob(blob, `${fileBaseName(sheet)}.docx`)
}
