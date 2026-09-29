export type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue }

export type JsonError = {
  message: string
  line: number
  column: number
  position: number
  excerpt: string
}

export type JsonStats = {
  bytes: number
  lines: number
  keys: number
  objects: number
  arrays: number
  depth: number
}

export type ValidationResult =
  | { valid: true; value: JsonValue; stats: JsonStats }
  | { valid: false; error: JsonError }

const positionToLocation = (source: string, position: number) => {
  const before = source.slice(0, Math.max(0, position))
  const lines = before.split('\n')
  return { line: lines.length, column: lines.at(-1)!.length + 1 }
}

const parseErrorPosition = (message: string, source: string) => {
  const directPosition = message.match(/position\s+(\d+)/i)?.[1]
  if (directPosition) return Number(directPosition)

  const location = message.match(/line\s+(\d+)\s+column\s+(\d+)/i)
  if (location) {
    const targetLine = Number(location[1])
    const targetColumn = Number(location[2])
    const lines = source.split('\n')
    return lines.slice(0, targetLine - 1).reduce((total, line) => total + line.length + 1, 0) + targetColumn - 1
  }

  if (/unexpected end/i.test(message)) return source.length

  const missingValue = source.match(/:\s*([,}\]])/)
  if (missingValue?.index !== undefined) {
    return missingValue.index + missingValue[0].lastIndexOf(missingValue[1])
  }

  const trailingComma = source.match(/,(?=\s*[}\]])/)
  if (trailingComma?.index !== undefined) return trailingComma.index

  const unexpectedToken = message.match(/Unexpected token\s+'([^']+)'/i)?.[1]
  if (unexpectedToken) {
    const position = source.indexOf(unexpectedToken)
    if (position >= 0) return position
  }

  return 0
}

const collectStats = (value: JsonValue, source: string): JsonStats => {
  let keys = 0
  let objects = 0
  let arrays = 0
  let depth = 0

  const visit = (node: JsonValue, level: number) => {
    depth = Math.max(depth, level)
    if (Array.isArray(node)) {
      arrays += 1
      node.forEach((child) => visit(child, level + 1))
      return
    }
    if (node !== null && typeof node === 'object') {
      objects += 1
      const entries = Object.entries(node)
      keys += entries.length
      entries.forEach(([, child]) => visit(child, level + 1))
    }
  }

  visit(value, 0)
  return {
    bytes: new TextEncoder().encode(source).length,
    lines: source.split('\n').length,
    keys,
    objects,
    arrays,
    depth,
  }
}

const describeJsonError = (source: string, rawMessage: string) => {
  if (!source.trim()) return 'Le document est vide.'
  if (/:\s*[,}\]]/.test(source)) return 'Une valeur est attendue après les deux-points.'
  if (/,(?=\s*[}\]])/.test(source)) return "La virgule finale n'est pas autorisée en JSON."
  if (/unexpected end/i.test(rawMessage)) return "Le document s'arrête avant la fermeture de la structure."

  const unexpectedToken = rawMessage.match(/Unexpected token\s+'([^']+)'/i)?.[1]
  if (unexpectedToken) return `Caractère inattendu "${unexpectedToken}".`

  return rawMessage.replace(/^JSON\.parse:\s*/i, '')
}

export const validateJson = (source: string): ValidationResult => {
  try {
    const value = JSON.parse(source) as JsonValue
    return { valid: true, value, stats: collectStats(value, source) }
  } catch (caught) {
    const rawMessage = caught instanceof Error ? caught.message : 'JSON invalide'
    const position = parseErrorPosition(rawMessage, source)
    const { line, column } = positionToLocation(source, position)
    return {
      valid: false,
      error: {
        message: describeJsonError(source, rawMessage),
        line,
        column,
        position,
        excerpt: source.split('\n')[line - 1] ?? '',
      },
    }
  }
}

export const formatJson = (source: string, indentation: number | string = 2) => {
  const result = validateJson(source)
  return result.valid ? JSON.stringify(result.value, null, indentation) : null
}

export const minifyJson = (source: string) => {
  const result = validateJson(source)
  return result.valid ? JSON.stringify(result.value) : null
}
