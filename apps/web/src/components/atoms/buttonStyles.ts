/** Shared Button / ButtonLink visual language (CT-064). */

export const buttonBaseClassName =
  'inline-flex touch-manipulation items-center justify-center rounded-md border px-3 py-2 text-[13px] font-medium shadow-panel transition-[background-color,border-color,color,transform,filter,box-shadow] duration-200 ease-out hover:shadow-lift motion-safe:hover:-translate-y-px motion-safe:active:scale-[0.97] disabled:cursor-not-allowed'

export const buttonVariantClassName = {
  primary:
    'border-transparent bg-accent text-white hover:brightness-110 disabled:opacity-50',
  ghost:
    'border-border bg-surface-1 text-fg-muted hover:bg-surface-hover hover:text-fg disabled:opacity-50',
  toggle:
    'min-h-10 border-border bg-surface-2 text-fg-muted hover:border-border-strong hover:text-fg disabled:opacity-50',
  toggleOn:
    'min-h-10 border-[color-mix(in_srgb,var(--color-ok)_45%,var(--color-border))] bg-ok-soft text-ok disabled:opacity-50',
} as const
