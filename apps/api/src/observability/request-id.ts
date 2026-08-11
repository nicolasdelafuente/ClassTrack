/**
 * Sole generator for HTTP request ids (used by pino-http `genReqId`).
 * Do not generate ids elsewhere — `req.id` from pino-http is the source of truth.
 */
export function createRequestId(): string {
  const rand = Math.random().toString(36).slice(2, 10)
  const time = Date.now().toString(36)
  return `req_${time}${rand}`
}

export function readRequestIdFromRequest(req: {
  id?: unknown
  headers?: Record<string, string | string[] | undefined>
}): string | undefined {
  if (req.id != null && String(req.id).trim()) {
    return String(req.id)
  }
  return undefined
}
