const SENSITIVE_KEY =
  /^(password|passwordconfirmation|secret|token|apikey|api_key|authorization|cookie|mailjet_api_key|mailjet_api_secret|accesstoken|refreshtoken)$/i

const MAX_DEPTH = 6

/** Deep-clone metadata and replace sensitive keys with [REDACTED]. */
export function redactSensitive<T>(value: T, depth = 0): T {
  if (value == null || depth > MAX_DEPTH) return value

  if (typeof value === 'string') {
    return value as T
  }

  if (Array.isArray(value)) {
    return value.map((item) => redactSensitive(item, depth + 1)) as T
  }

  if (typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      if (SENSITIVE_KEY.test(key)) {
        out[key] = '[REDACTED]'
        continue
      }
      out[key] = redactSensitive(nested, depth + 1)
    }
    return out as T
  }

  return value
}

export function serializeError(
  err: unknown,
  includeStack: boolean,
): { name: string; message: string; stack?: string } {
  if (err instanceof Error) {
    const message = redactSensitive({ message: err.message }).message as string
    return {
      name: err.name || 'Error',
      message,
      ...(includeStack && err.stack ? { stack: err.stack } : {}),
    }
  }
  return {
    name: 'NonError',
    message: typeof err === 'string' ? err : 'Unknown error',
  }
}
