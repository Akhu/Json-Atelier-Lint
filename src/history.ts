import type { JsonStats, JsonValue } from './json'

const DATABASE_NAME = 'json-atelier'
const DATABASE_VERSION = 1
const STORE_NAME = 'history'

export type HistoryEntry = {
  id: string
  createdAt: number
  fingerprint: string
  title: string
  source: string
  stats: JsonStats
}

const requestResult = <T>(request: IDBRequest<T>) => new Promise<T>((resolve, reject) => {
  request.onsuccess = () => resolve(request.result)
  request.onerror = () => reject(request.error)
})

const transactionDone = (transaction: IDBTransaction) => new Promise<void>((resolve, reject) => {
  transaction.oncomplete = () => resolve()
  transaction.onerror = () => reject(transaction.error)
  transaction.onabort = () => reject(transaction.error)
})

const openDatabase = () => new Promise<IDBDatabase>((resolve, reject) => {
  const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION)
  request.onupgradeneeded = () => {
    const store = request.result.createObjectStore(STORE_NAME, { keyPath: 'id' })
    store.createIndex('createdAt', 'createdAt')
    store.createIndex('fingerprint', 'fingerprint', { unique: true })
  }
  request.onsuccess = () => resolve(request.result)
  request.onerror = () => reject(request.error)
})

const fingerprint = async (value: JsonValue) => {
  const canonical = JSON.stringify(value)
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonical))
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

const shortValue = (value: unknown) => {
  if (typeof value === 'string' || typeof value === 'number') return String(value).trim()
  return ''
}

export const describeJson = (value: JsonValue) => {
  if (Array.isArray(value)) return `Tableau · ${value.length} élément${value.length > 1 ? 's' : ''}`
  if (value !== null && typeof value === 'object') {
    for (const key of ['title', 'name', 'label', 'project', 'id']) {
      const candidate = shortValue(value[key])
      if (candidate) return candidate.slice(0, 72)
    }
    const count = Object.keys(value).length
    return `Objet · ${count} clé${count > 1 ? 's' : ''}`
  }
  if (value === null) return 'Valeur null'
  return String(value).slice(0, 72)
}

export const saveHistoryEntry = async (
  source: string,
  value: JsonValue,
  stats: JsonStats,
  createdAt = Date.now(),
) => {
  const database = await openDatabase()
  const hash = await fingerprint(value)
  const transaction = database.transaction(STORE_NAME, 'readwrite')
  const store = transaction.objectStore(STORE_NAME)
  const existing = await requestResult(store.index('fingerprint').get(hash)) as HistoryEntry | undefined

  if (existing) {
    await transactionDone(transaction)
    database.close()
    return { entry: existing, created: false }
  }

  const entry: HistoryEntry = {
    id: crypto.randomUUID(),
    createdAt,
    fingerprint: hash,
    title: describeJson(value),
    source,
    stats,
  }
  store.add(entry)
  await transactionDone(transaction)
  database.close()
  return { entry, created: true }
}

export const listHistoryEntries = async () => {
  const database = await openDatabase()
  const transaction = database.transaction(STORE_NAME, 'readonly')
  const entries = await requestResult(transaction.objectStore(STORE_NAME).getAll()) as HistoryEntry[]
  await transactionDone(transaction)
  database.close()
  return entries.sort((left, right) => right.createdAt - left.createdAt)
}

export const deleteHistoryEntry = async (id: string) => {
  const database = await openDatabase()
  const transaction = database.transaction(STORE_NAME, 'readwrite')
  transaction.objectStore(STORE_NAME).delete(id)
  await transactionDone(transaction)
  database.close()
}

export const clearHistory = async () => {
  const database = await openDatabase()
  const transaction = database.transaction(STORE_NAME, 'readwrite')
  transaction.objectStore(STORE_NAME).clear()
  await transactionDone(transaction)
  database.close()
}

export const searchHistory = (entries: HistoryEntry[], query: string) => {
  const normalized = query.trim().toLocaleLowerCase('fr')
  if (!normalized) return entries
  return entries.filter((entry) => `${entry.title}\n${entry.source}`.toLocaleLowerCase('fr').includes(normalized))
}

export const matchingExcerpt = (source: string, query: string) => {
  const compact = source.replace(/\s+/g, ' ').trim()
  const normalized = query.trim().toLocaleLowerCase('fr')
  if (!normalized) return compact.slice(0, 120)
  const index = compact.toLocaleLowerCase('fr').indexOf(normalized)
  const start = Math.max(0, index - 36)
  const excerpt = compact.slice(start, start + 120)
  return `${start > 0 ? '…' : ''}${excerpt}${start + 120 < compact.length ? '…' : ''}`
}

export const resetHistoryDatabaseForTests = () => new Promise<void>((resolve, reject) => {
  const request = indexedDB.deleteDatabase(DATABASE_NAME)
  request.onsuccess = () => resolve()
  request.onerror = () => reject(request.error)
})
