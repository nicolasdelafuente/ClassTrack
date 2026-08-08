import { useEffect, useId, useRef } from 'react'
import { Button } from '../atoms/Button'
import { cn } from '../../lib/cn'

/** Keep only simple Word-like tags for sheet descriptions (CT-056). */
export function sanitizeRichHtml(raw: string): string {
  if (!raw?.trim()) return ''
  if (typeof DOMParser === 'undefined') {
    return raw.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
  }
  const doc = new DOMParser().parseFromString(raw, 'text/html')
  const allowed = new Set([
    'B',
    'STRONG',
    'I',
    'EM',
    'U',
    'UL',
    'OL',
    'LI',
    'P',
    'BR',
    'DIV',
  ])

  function clean(node: Node) {
    const children = Array.from(node.childNodes)
    for (const child of children) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const el = child as HTMLElement
        if (!allowed.has(el.tagName)) {
          while (el.firstChild) {
            node.insertBefore(el.firstChild, el)
          }
          node.removeChild(el)
          continue
        }
        // Drop attributes (styles/scripts)
        for (const attr of Array.from(el.attributes)) {
          el.removeAttribute(attr.name)
        }
        clean(el)
      } else if (child.nodeType === Node.COMMENT_NODE) {
        node.removeChild(child)
      }
    }
  }

  clean(doc.body)
  return doc.body.innerHTML.trim()
}

type RichTextEditorProps = {
  id?: string
  label?: string
  value: string
  disabled?: boolean
  className?: string
  onChange: (html: string) => void
}

/**
 * Lightweight Word-like editor for sprint sheet text (bullets, numbers, bold…).
 * Stores HTML in the existing description/reason string fields.
 */
export function RichTextEditor({
  id,
  label,
  value,
  disabled,
  className,
  onChange,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const autoId = useId()
  const fieldId = id ?? autoId

  useEffect(() => {
    const el = editorRef.current
    if (!el || disabled) return
    const next = value || ''
    if (el.innerHTML !== next) {
      el.innerHTML = next
    }
  }, [value, disabled])

  function run(command: string) {
    if (disabled) return
    editorRef.current?.focus()
    document.execCommand(command, false)
    emit()
  }

  function emit() {
    const html = sanitizeRichHtml(editorRef.current?.innerHTML ?? '')
    onChange(html)
  }

  return (
    <div className={cn('min-w-0', className)}>
      {label ? (
        <label
          htmlFor={fieldId}
          className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-fg-faint"
        >
          {label}
        </label>
      ) : null}
      {!disabled ? (
        <div
          className="mb-1.5 flex flex-wrap gap-1 rounded-md border border-border bg-surface-1 p-1"
          role="toolbar"
          aria-label="Formato de texto"
        >
          <Button
            type="button"
            variant="ghost"
            className="min-h-8 px-2 text-[12px] font-bold"
            title="Negrita"
            onClick={() => run('bold')}
          >
            N
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="min-h-8 px-2 text-[12px] italic"
            title="Cursiva"
            onClick={() => run('italic')}
          >
            C
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="min-h-8 px-2 text-[12px] underline"
            title="Subrayado"
            onClick={() => run('underline')}
          >
            S
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="min-h-8 px-2 text-[12px]"
            title="Viñetas"
            onClick={() => run('insertUnorderedList')}
          >
            • Lista
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="min-h-8 px-2 text-[12px]"
            title="Numeración"
            onClick={() => run('insertOrderedList')}
          >
            1. Lista
          </Button>
        </div>
      ) : null}
      <div
        id={fieldId}
        ref={editorRef}
        role="textbox"
        aria-multiline
        aria-label={label ?? 'Texto con formato'}
        contentEditable={!disabled}
        suppressContentEditableWarning
        className={cn(
          'min-h-[4.5rem] rounded-md border border-border-strong bg-surface-1 px-2.5 py-2 text-[13px] text-fg shadow-panel outline-none',
          '[&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-5',
          '[&_ol]:my-1 [&_ol]:list-decimal [&_ol]:pl-5',
          '[&_li]:my-0.5',
          disabled &&
            'cursor-default border-border bg-surface-2 text-fg-muted shadow-none',
          !disabled &&
            'focus:border-accent focus:shadow-[0_0_0_3px_var(--color-accent-soft)]',
        )}
        onInput={emit}
        onBlur={emit}
      />
    </div>
  )
}

type RichTextViewProps = {
  html: string
  className?: string
}

/** Read-only rich text for approved / review views. */
export function RichTextView({ html, className }: RichTextViewProps) {
  const clean = sanitizeRichHtml(html)
  if (!clean) return null
  return (
    <div
      className={cn(
        'text-[13px] text-fg-muted [&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-0.5 [&_p]:m-0 [&_p+p]:mt-1',
        className,
      )}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  )
}
