import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { validateJson } from './json'
import {
  clearHistory,
  deleteHistoryEntry,
  describeJson,
  listHistoryEntries,
  matchingExcerpt,
  resetHistoryDatabaseForTests,
  saveHistoryEntry,
  searchHistory,
} from './history'

const validDocument = (source: string) => {
  const result = validateJson(source)
  if (!result.valid) throw new Error('Fixture JSON invalide')
  return result
}

beforeEach(() => resetHistoryDatabaseForTests())

describe('historique JSON', () => {
  it('enregistre les documents du plus récent au plus ancien', async () => {
    const first = validDocument('{"name":"Premier"}')
    const second = validDocument('{"name":"Second"}')
    await saveHistoryEntry('{"name":"Premier"}', first.value, first.stats, 100)
    await saveHistoryEntry('{"name":"Second"}', second.value, second.stats, 200)

    expect((await listHistoryEntries()).map((entry) => entry.title)).toEqual(['Second', 'Premier'])
  })

  it('ignore les doublons qui diffèrent seulement par le formatage', async () => {
    const compact = validDocument('{"project":"Même document"}')
    const formatted = validDocument('{\n  "project": "Même document"\n}')
    expect((await saveHistoryEntry('{"project":"Même document"}', compact.value, compact.stats)).created).toBe(true)
    expect((await saveHistoryEntry('{\n  "project": "Même document"\n}', formatted.value, formatted.stats)).created).toBe(false)
    expect(await listHistoryEntries()).toHaveLength(1)
  })

  it('recherche dans le titre et dans tout le contenu', async () => {
    const document = validDocument('{"title":"Patients","city":"Annecy"}')
    await saveHistoryEntry('{"title":"Patients","city":"Annecy"}', document.value, document.stats)
    const entries = await listHistoryEntries()

    expect(searchHistory(entries, 'patients')).toHaveLength(1)
    expect(searchHistory(entries, 'annecy')).toHaveLength(1)
    expect(searchHistory(entries, 'lyon')).toHaveLength(0)
    expect(matchingExcerpt(entries[0].source, 'annecy')).toContain('Annecy')
  })

  it('supprime une entrée ou vide tout l’historique', async () => {
    const first = validDocument('{"id":1}')
    const second = validDocument('{"id":2}')
    const saved = await saveHistoryEntry('{"id":1}', first.value, first.stats)
    await saveHistoryEntry('{"id":2}', second.value, second.stats)
    await deleteHistoryEntry(saved.entry.id)
    expect(await listHistoryEntries()).toHaveLength(1)
    await clearHistory()
    expect(await listHistoryEntries()).toHaveLength(0)
  })

  it('produit des titres lisibles selon la racine', () => {
    expect(describeJson({ project: 'Atlas' })).toBe('Atlas')
    expect(describeJson([1, 2])).toBe('Tableau · 2 éléments')
  })
})
