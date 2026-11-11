/**
 * The editor body: the preview with a caret in it.
 *
 * The coloured rows are not a page of their own. They are drawn exactly as the
 * preview draws them — same gutter, same tokens, same metrics — and a textarea
 * whose glyphs are transparent is laid over them. The reader therefore edits the
 * highlighted code in place: there is no second panel to switch to, and no mode
 * that gives up colour for the sake of a keyboard.
 *
 * The field is the only scroller. It owns both axes, because a textarea must own
 * the scroll that follows its caret; the artwork behind it is clipped by its own
 * box and translated by the field's offsets (`sync`). That is what keeps a row
 * and its number under the caret after a wheel, a drag, or a page of typing.
 *
 * The transparency is what makes the whole thing work, and it is also what it
 * costs: the visible glyphs are the painted ones, so they are redrawn on every
 * keystroke. Tokenising a large file per keystroke would stall the field, so
 * past `EDIT_HIGHLIGHT_CHARS` the rows are redrawn plain — still aligned, still
 * editable, just one colour — which the page explains above the body.
 *
 * Metrics are declared twice, in the sheet: once for the rows, once for the
 * field. They must stay identical, down to the ligature setting, or the caret
 * slowly walks away from the glyph it belongs to.
 */

import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactElement,
} from 'react'
import { gutterBox } from './code.js'
import { highlightCode, plainCode } from './highlight.js'

/** Props of the editor body. */
interface CodeEditorProps {
  /** The LF-normalized draft text. */
  readonly text: string
  /** The workspace path, which chooses the grammar. */
  readonly path: string
  /** Called with the complete text after any change. */
  readonly onChange: (value: string) => void
  /** Called for ⌘S / Ctrl+S. */
  readonly onSave: () => void
  /** Accessible name for the field: the file's workspace path. */
  readonly label: string
}

/**
 * Largest draft that is re-tokenised on every keystroke: about 1 200 lines.
 *
 * Below it a redraw costs a few milliseconds, which no typist can feel. Above it
 * it costs tens of them, and a field that stalls under the keyboard is worse
 * than one without colours.
 */
export const EDIT_HIGHLIGHT_CHARS = 40_000

/** What Tab inserts: the two spaces the preview's `tab-size` already draws. */
const INDENT = '  '

/**
 * Draw the editor for one file.
 *
 * @param props - the draft, its sinks, and the field's name.
 * @returns the painted rows with a transparent field over them.
 */
export function CodeEditor({ text, path, onChange, onSave, label }: CodeEditorProps): ReactElement {
  const painted = useMemo(
    () => (text.length > EDIT_HIGHLIGHT_CHARS ? plainCode(text) : highlightCode(text, path)),
    [text, path],
  )
  const gutter = useMemo(() => gutterBox(painted.lineCount), [painted.lineCount])

  const field = useRef<HTMLTextAreaElement>(null)
  const rows = useRef<HTMLElement>(null)
  const numbers = useRef<HTMLPreElement>(null)

  // The field scrolls; the artwork follows it. Both are moved by transform
  // rather than by setting `scrollTop` on something, because neither is a
  // scroller: they are pictures of the text the field is really showing.
  const sync = useCallback((): void => {
    const box = field.current
    if (box === null) return
    const x = box.scrollLeft
    const y = box.scrollTop
    if (rows.current !== null) rows.current.style.transform = `translate(${-x}px, ${-y}px)`
    if (numbers.current !== null) numbers.current.style.transform = `translateY(${-y}px)`
  }, [])

  // A file opens at its first line, not at the caret the field would otherwise
  // place at its end when React assigns the value.
  useLayoutEffect(() => {
    const box = field.current
    if (box === null) return
    box.setSelectionRange(0, 0)
    box.scrollTop = 0
    box.scrollLeft = 0
    sync()
  }, [sync])

  // After a redraw the field may have clamped its own scroll offset (a deleted
  // line shortens the text); the picture must follow that too.
  useLayoutEffect(sync, [text, sync])

  const onKeyDown = (event: ReactKeyboardEvent<HTMLTextAreaElement>): void => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
      event.preventDefault()
      onSave()
      return
    }
    if (event.key !== 'Tab' || event.shiftKey) return
    event.preventDefault()
    const box = event.currentTarget
    box.setRangeText(INDENT, box.selectionStart, box.selectionEnd, 'end')
    // The field already holds the inserted text; reporting its value keeps the
    // controlled draft in step without moving the caret.
    onChange(box.value)
  }

  return (
    <div className="dsh-cf-edit">
      {/* The same ruler the preview draws, translated by the same vertical
          offset, and hidden from assistive technology and from the pointer. */}
      <div className="dsh-cf-edit-gutter" aria-hidden="true" style={gutter.style}>
        <pre ref={numbers} className="dsh-cf-edit-numbers">{gutter.text}</pre>
      </div>
      <div className="dsh-cf-edit-pane">
        {/* The row markup is this module's own output, built by `highlight.ts`:
            every token was escaped there and the colours come from the theme
            this plugin registered, never from the file. */}
        <pre className="dsh-cf-code" aria-hidden="true">
          <code ref={rows} dangerouslySetInnerHTML={{ __html: painted.html }} />
        </pre>
        <textarea
          ref={field}
          className="dsh-cf-edit-input"
          aria-label={label}
          value={text}
          autoFocus
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          autoComplete="off"
          wrap="off"
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={onKeyDown}
          onScroll={sync}
        />
      </div>
    </div>
  )
}
