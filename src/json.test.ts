import { describe, expect, it } from 'vitest'
import { formatJson, minifyJson, validateJson } from './json'

describe('JSON helpers', () => {
  it('validates and counts a document', () => {
    const result = validateJson('{"user":{"name":"Ada"},"tags":["math","code"]}')
    expect(result.valid).toBe(true)
    if (result.valid) {
      expect(result.stats).toMatchObject({ keys: 3, objects: 2, arrays: 1, depth: 2 })
    }
  })

  it('locates a syntax error', () => {
    const result = validateJson('{\n  "ok": true,\n  "broken":,\n}')
    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.error.line).toBe(3)
      expect(result.error.column).toBeGreaterThan(1)
      expect(result.error.message).toBe('Une valeur est attendue après les deux-points.')
    }
  })

  it('formats and minifies valid JSON', () => {
    expect(formatJson('{"a":1}')).toBe('{\n  "a": 1\n}')
    expect(minifyJson('{\n  "a": 1\n}')).toBe('{"a":1}')
  })
})
