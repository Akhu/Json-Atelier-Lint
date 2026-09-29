import { useEffect, useState, type RefObject } from 'react'
import { ArchiveRestore, Database, FileJson2, Search, Trash2 } from 'lucide-react'
import type { HistoryEntry } from '../history'
import { matchingExcerpt } from '../history'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from './ui/sheet'

const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
  dateStyle: 'short',
  timeStyle: 'short',
})

type HistorySheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  entries: HistoryEntry[]
  totalCount: number
  query: string
  onQueryChange: (query: string) => void
  onRestore: (entry: HistoryEntry) => void
  onDelete: (entry: HistoryEntry) => void
  onClear: () => void
  searchInputRef: RefObject<HTMLInputElement | null>
}

export function HistorySheet({
  open,
  onOpenChange,
  entries,
  totalCount,
  query,
  onQueryChange,
  onRestore,
  onDelete,
  onClear,
  searchInputRef,
}: HistorySheetProps) {
  const [confirmClear, setConfirmClear] = useState(false)

  useEffect(() => {
    if (!open) setConfirmClear(false)
  }, [open])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent onOpenAutoFocus={(event) => {
        event.preventDefault()
        searchInputRef.current?.focus()
      }}>
        <div className="border-b border-border px-6 py-5 pr-14">
          <SheetTitle className="text-base font-semibold">Historique JSON</SheetTitle>
          <SheetDescription className="mt-1 text-xs text-muted-foreground">
            Versions valides enregistrées uniquement sur ce Mac.
          </SheetDescription>
        </div>

        <div className="border-b border-border p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              className="pl-9"
              placeholder="Rechercher une clé ou une valeur…"
              aria-label="Rechercher dans tout l'historique"
            />
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>{entries.length} résultat{entries.length > 1 ? 's' : ''} sur {totalCount}</span>
            {totalCount > 0 && (
              confirmClear ? (
                <div className="flex items-center gap-2">
                  <span>Tout supprimer ?</span>
                  <Button variant="destructive" size="sm" onClick={onClear}>Confirmer</Button>
                  <Button variant="ghost" size="sm" onClick={() => setConfirmClear(false)}>Annuler</Button>
                </div>
              ) : (
                <Button variant="ghost" size="sm" onClick={() => setConfirmClear(true)}>
                  <Trash2 /> Vider
                </Button>
              )
            )}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          {entries.length === 0 ? (
            <div className="flex h-full min-h-64 flex-col items-center justify-center px-8 text-center">
              <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Database className="size-5" />
              </div>
              <p className="mt-4 text-sm font-medium">{query ? 'Aucun résultat' : 'Historique vide'}</p>
              <p className="mt-1 max-w-64 text-xs leading-5 text-muted-foreground">
                {query ? 'Essaie une autre clé ou valeur.' : 'Un JSON valide sera enregistré après une courte pause de saisie.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {entries.map((entry) => (
                <article key={entry.id} className="group rounded-md border border-border bg-background hover:border-zinc-700">
                  <button className="w-full p-4 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={() => onRestore(entry)}>
                    <div className="flex items-start gap-3">
                      <FileJson2 className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <p className="truncate text-sm font-medium">{entry.title}</p>
                          <time className="shrink-0 text-[10px] text-muted-foreground">{dateFormatter.format(entry.createdAt)}</time>
                        </div>
                        <p className="mt-2 line-clamp-2 font-mono text-[11px] leading-5 text-muted-foreground">
                          {matchingExcerpt(entry.source, query)}
                        </p>
                        <div className="mt-3 flex items-center gap-3 text-[10px] text-muted-foreground">
                          <span>{entry.stats.lines} lignes</span>
                          <span>{entry.stats.bytes.toLocaleString('fr-FR')} o</span>
                          <span className="ml-auto flex items-center gap-1 text-zinc-400"><ArchiveRestore className="size-3" /> Restaurer</span>
                        </div>
                      </div>
                    </div>
                  </button>
                  <div className="flex justify-end border-t border-border px-2 py-1">
                    <Button variant="destructive" size="sm" onClick={() => onDelete(entry)}>
                      <Trash2 /> Supprimer
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
