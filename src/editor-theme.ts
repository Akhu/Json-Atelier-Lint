import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { EditorView } from '@codemirror/view'
import { tags } from '@lezer/highlight'

export const editorTheme = [
  EditorView.theme(
    {
      '&': { backgroundColor: 'transparent', color: 'var(--color-zinc-200)', fontSize: '14px' },
      '.cm-content': { caretColor: 'var(--color-zinc-100)', padding: '16px 0 32px' },
      '.cm-line': { padding: '0 20px' },
      '.cm-scroller': {
        fontFamily: 'SFMono-Regular, Menlo, Monaco, Consolas, monospace',
        lineHeight: '1.65',
      },
      '.cm-gutters': {
        backgroundColor: 'var(--color-zinc-950)',
        color: 'var(--color-zinc-600)',
        border: 'none',
        paddingLeft: '8px',
      },
      '.cm-activeLine': { backgroundColor: 'color-mix(in oklab, var(--color-zinc-800) 35%, transparent)' },
      '.cm-activeLineGutter': { backgroundColor: 'transparent', color: 'var(--color-zinc-400)' },
      '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
        backgroundColor: 'color-mix(in oklab, var(--color-blue-500) 25%, transparent) !important',
      },
      '.cm-cursor': { borderLeftColor: 'var(--color-zinc-100)' },
      '.cm-foldGutter span': { color: 'var(--color-zinc-500)' },
      '.cm-tooltip': {
        border: '1px solid var(--color-zinc-800)',
        backgroundColor: 'var(--color-zinc-900)',
        color: 'var(--color-zinc-200)',
      },
      '.cm-panels': {
        backgroundColor: 'var(--color-zinc-900)',
        color: 'var(--color-zinc-200)',
      },
      '.cm-panel.cm-search': {
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 12px',
        borderBottom: '1px solid var(--color-zinc-800)',
      },
      '.cm-panel.cm-search input': {
        height: '32px',
        border: '1px solid var(--color-zinc-700)',
        borderRadius: '6px',
        backgroundColor: 'var(--color-zinc-950)',
        color: 'var(--color-zinc-100)',
        padding: '0 10px',
        outline: 'none',
      },
      '.cm-panel.cm-search input:focus': { borderColor: 'var(--color-zinc-500)' },
      '.cm-panel.cm-search button': {
        height: '32px',
        border: '1px solid var(--color-zinc-700)',
        borderRadius: '6px',
        backgroundColor: 'var(--color-zinc-800)',
        color: 'var(--color-zinc-200)',
        padding: '0 10px',
      },
      '.cm-panel.cm-search label': { fontSize: '12px', color: 'var(--color-zinc-400)' },
      '.cm-panel.cm-search [name=close]': { marginLeft: 'auto' },
      '.cm-searchMatch': { backgroundColor: 'color-mix(in oklab, var(--color-amber-400) 28%, transparent)' },
      '.cm-searchMatch-selected': { backgroundColor: 'color-mix(in oklab, var(--color-amber-300) 45%, transparent)' },
      '.cm-lintRange-error': { backgroundImage: 'none', borderBottom: '1px wavy var(--color-red-400)' },
    },
    { dark: true },
  ),
  syntaxHighlighting(
    HighlightStyle.define([
      { tag: tags.propertyName, color: 'var(--color-blue-300)' },
      { tag: tags.string, color: 'var(--color-emerald-300)' },
      { tag: tags.number, color: 'var(--color-violet-300)' },
      { tag: [tags.bool, tags.null], color: 'var(--color-amber-300)' },
      { tag: tags.punctuation, color: 'var(--color-zinc-500)' },
      { tag: tags.invalid, color: 'var(--color-red-300)' },
    ]),
  ),
]
