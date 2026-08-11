import { redactSensitive, serializeError } from './redact'

describe('redactSensitive', () => {
  it('redacts password and token keys (case-insensitive)', () => {
    expect(
      redactSensitive({
        email: 'a@b.com',
        password: 'secret-value',
        nested: { apiKey: 'mj_xxx', ok: 1 },
      }),
    ).toEqual({
      email: 'a@b.com',
      password: '[REDACTED]',
      nested: { apiKey: '[REDACTED]', ok: 1 },
    })
  })

  it('redacts arrays of objects', () => {
    expect(redactSensitive([{ token: 'abc', name: 'x' }])).toEqual([
      { token: '[REDACTED]', name: 'x' },
    ])
  })
})

describe('serializeError', () => {
  it('includes stack when requested', () => {
    const err = new Error('boom')
    const serialized = serializeError(err, true)
    expect(serialized.name).toBe('Error')
    expect(serialized.message).toBe('boom')
    expect(serialized.stack).toContain('boom')
  })

  it('omits stack when not requested', () => {
    const serialized = serializeError(new Error('boom'), false)
    expect(serialized.stack).toBeUndefined()
  })
})
