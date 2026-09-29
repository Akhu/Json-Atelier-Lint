import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { json, jsonParseLinter } from '@codemirror/lang-json'
import { foldAll, unfoldAll } from '@codemirror/language'
import { linter } from '@codemirror/lint'
import { openSearchPanel } from '@codemirror/search'
import { EditorView } from '@codemirror/view'
import {
  AlignLeft,
  Braces,
  CheckCircle2,
  ChevronsDownUp,
  ChevronsUpDown,
  Clipboard,
  Download,
  FileJson2,
  History,
  LocateFixed,
  Minimize2,
  RotateCcw,
  Search,
  ShieldCheck,
  Trash2,
  TriangleAlert,
} from 'lucide-react'
import { Button } from './components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select'
import { HistorySheet } from './components/HistorySheet'
import { editorTheme } from './editor-theme'
import {
  clearHistory,
  deleteHistoryEntry,
  listHistoryEntries,
  saveHistoryEntry,
  searchHistory,
  type HistoryEntry,
} from './history'
import { formatJson, minifyJson, validateJson } from './json'

const SAMPLE = `{
  "project": "JSON Atelier",
  "localOnly": true,
  "features": [
    "validation",
    "formatting",
    "minification",
    "folding"
  ],
  "settings": {
    "indentation": 2,
    "language": "fr"
  }
}`

const STORAGE_KEY = 'json-atelier-document'
type Indentation = '2' | '4' | 'tab'

const isBuiltInSample = (value: unknown) => {
  if (value === null || Array.isArray(value) || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  return record.project === 'JSON Atelier' && record.localOnly === true
}

export default function App() {
  const [source, setSource] = useState(() => localStorage.getItem(STORAGE_KEY) ?? SAMPLE)
  const [indentation, setIndentation] = useState<Indentation>('2')
  const [copied, setCopied] = useState(false)
  const [editor, setEditor] = useState<EditorView | null>(null)
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([])
  const [historyOpen, setHistoryOpen] = useState(false)
  const [historyQuery, setHistoryQuery] = useState('')
  const historySearchRef = useRef<HTMLInputElement>(null)
  const result = useMemo(() => validateJson(source), [source])
  const filteredHistory = useMemo(() => searchHistory(historyEntries, historyQuery), [historyEntries, historyQuery])
  const extensions = useMemo(() => [json(), linter(jsonParseLinter()), EditorView.lineWrapping, ...editorTheme], [])

  useEffect(() => localStorage.setItem(STORAGE_KEY, source), [source])

  useEffect(() => {
    void listHistoryEntries().then(setHistoryEntries)
  }, [])

  useEffect(() => {
    if (!result.valid || isBuiltInSample(result.value)) return

    let cancelled = false
    const timeout = window.setTimeout(() => {
      void saveHistoryEntry(source, result.value, result.stats).then(({ entry, created }) => {
        if (!cancelled && created) setHistoryEntries((entries) => [entry, ...entries])
      })
    }, 1500)

    return () => {
      cancelled = true
      window.clearTimeout(timeout)
    }
  }, [result, source])

  const applyFormat = useCallback(() => {
    const next = formatJson(source, indentation === 'tab' ? '\t' : Number(indentation))
    if (next !== null) setSource(next)
  }, [indentation, source])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const command = event.metaKey || event.ctrlKey
      if (command && event.shiftKey && event.key.toLocaleLowerCase() === 'f') {
        event.preventDefault()
        setHistoryOpen(true)
      } else if (command && event.key.toLocaleLowerCase() === 'f') {
        event.preventDefault()
        setHistoryOpen(false)
        if (editor) openSearchPanel(editor)
      } else if (command && event.key === 'Enter') {
        event.preventDefault()
        applyFormat()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [applyFormat, editor])

  const applyMinify = () => {
    const next = minifyJson(source)
    if (next !== null) setSource(next)
  }

  const copySource = async () => {
    await navigator.clipboard.writeText(source)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1400)
  }

  const downloadSource = () => {
    const url = URL.createObjectURL(new Blob([source], { type: 'application/json' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'document.json'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const goToError = () => {
    if (result.valid || !editor) return
    const position = Math.min(result.error.position, editor.state.doc.length)
    editor.dispatch({ selection: { anchor: position }, scrollIntoView: true })
    editor.focus()
  }

  const restoreHistoryEntry = (entry: HistoryEntry) => {
    setSource(entry.source)
    setHistoryOpen(false)
  }

  const removeHistoryEntry = async (entry: HistoryEntry) => {
    await deleteHistoryEntry(entry.id)
    setHistoryEntries((entries) => entries.filter((candidate) => candidate.id !== entry.id))
  }

  const removeAllHistory = async () => {
    await clearHistory()
    setHistoryEntries([])
    setHistoryQuery('')
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-16 max-w-screen-2xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-md border border-border bg-muted">
              <Braces className="size-5" />
            </div>
            <div>
              <h1 className="text-sm font-semibold leading-none">JSON Atelier</h1>
              <p className="mt-1 text-xs text-muted-foreground">Validateur local</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => editor && openSearchPanel(editor)} disabled={!editor}>
              <Search /> Rechercher <kbd className="ml-1 hidden text-[10px] opacity-60 md:inline">⌘F</kbd>
            </Button>
            <Button variant="outline" size="sm" onClick={() => setHistoryOpen(true)}>
              <History /> Historique
              {historyEntries.length > 0 && <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] tabular-nums">{historyEntries.length}</span>}
              <kbd className="ml-1 hidden text-[10px] opacity-60 lg:inline">⌘⇧F</kbd>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-screen-2xl space-y-4 p-4 sm:p-6">
        <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm" aria-label="Éditeur JSON">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border p-2">
            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={applyFormat} disabled={!result.valid}>
                <AlignLeft /> Formater <kbd className="ml-1 hidden text-[10px] opacity-60 sm:inline">⌘ ↵</kbd>
              </Button>
              <Button variant="outline" onClick={applyMinify} disabled={!result.valid}>
                <Minimize2 /> Minifier
              </Button>
              <Select value={indentation} onValueChange={(value) => setIndentation(value as Indentation)}>
                <SelectTrigger aria-label="Indentation"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 espaces</SelectItem>
                  <SelectItem value="4">4 espaces</SelectItem>
                  <SelectItem value="tab">Tabulation</SelectItem>
                </SelectContent>
              </Select>
              <div className="hidden h-5 w-px bg-border md:block" />
              <Button variant="ghost" size="sm" onClick={() => editor && foldAll(editor)} disabled={!editor || !result.valid}>
                <ChevronsDownUp /> Tout replier
              </Button>
              <Button variant="ghost" size="sm" onClick={() => editor && unfoldAll(editor)} disabled={!editor}>
                <ChevronsUpDown /> Tout déplier
              </Button>
            </div>

            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={() => setSource(SAMPLE)}><RotateCcw /> Exemple</Button>
              <Button variant="ghost" size="sm" onClick={copySource}><Clipboard /> {copied ? 'Copié' : 'Copier'}</Button>
              <Button variant="ghost" size="sm" onClick={downloadSource}><Download /> Télécharger</Button>
              <Button variant="destructive" size="icon" onClick={() => setSource('')} aria-label="Effacer"><Trash2 /></Button>
            </div>
          </div>

          <div className="flex h-10 items-center justify-between border-b border-border bg-muted/30 px-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-2"><FileJson2 className="size-4" /> document.json</span>
            <span className={result.valid ? 'flex items-center gap-1.5 text-emerald-400' : 'flex items-center gap-1.5 text-red-400'}>
              {result.valid ? <CheckCircle2 className="size-3.5" /> : <TriangleAlert className="size-3.5" />}
              {result.valid ? 'Valide' : 'Erreur de syntaxe'}
            </span>
          </div>

          <CodeMirror
            value={source}
            height="min(62vh, 680px)"
            minHeight="400px"
            extensions={extensions}
            theme="none"
            basicSetup={{
              autocompletion: false,
              bracketMatching: true,
              closeBrackets: true,
              foldGutter: true,
              highlightActiveLine: true,
              highlightActiveLineGutter: true,
              lineNumbers: true,
            }}
            onChange={setSource}
            onCreateEditor={setEditor}
            aria-label="Contenu JSON"
          />
        </section>

        <section className="rounded-lg border border-border bg-card p-4 shadow-sm" aria-live="polite">
          {result.valid ? (
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
              <div className="flex min-w-52 items-center gap-3">
                <CheckCircle2 className="size-5 text-emerald-400" />
                <div><p className="text-sm font-medium">JSON valide</p><p className="text-xs text-muted-foreground">Aucune erreur de syntaxe.</p></div>
              </div>
              <dl className="grid flex-1 grid-cols-3 gap-4 sm:grid-cols-6">
                {[
                  ['Lignes', result.stats.lines],
                  ['Taille', `${result.stats.bytes.toLocaleString('fr-FR')} o`],
                  ['Clés', result.stats.keys],
                  ['Objets', result.stats.objects],
                  ['Tableaux', result.stats.arrays],
                  ['Profondeur', result.stats.depth],
                ].map(([label, value]) => (
                  <div key={label} className="border-l border-border pl-3">
                    <dt className="text-[11px] text-muted-foreground">{label}</dt>
                    <dd className="mt-1 text-sm font-medium tabular-nums">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <TriangleAlert className="size-5 shrink-0 text-red-400" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">Ligne {result.error.line}, colonne {result.error.column}</p>
                <p className="mt-1 text-xs text-muted-foreground">{result.error.message}</p>
              </div>
              <code className="max-w-full truncate rounded bg-muted px-2 py-1 text-xs text-red-300">{result.error.excerpt || 'Document vide'}</code>
              <Button variant="outline" size="sm" onClick={goToError}><LocateFixed /> Localiser</Button>
            </div>
          )}
        </section>

        <footer className="flex items-center justify-between px-1 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-2"><ShieldCheck className="size-3.5 text-emerald-400" /> Les données restent sur ce Mac</span>
          <span>JSON natif · UTF-8 · historique automatique</span>
        </footer>
      </main>

      <HistorySheet
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        entries={filteredHistory}
        totalCount={historyEntries.length}
        query={historyQuery}
        onQueryChange={setHistoryQuery}
        onRestore={restoreHistoryEntry}
        onDelete={(entry) => void removeHistoryEntry(entry)}
        onClear={() => void removeAllHistory()}
        searchInputRef={historySearchRef}
      />
    </div>
  )
}
