/**
 * The code body of the preview pane: a number column beside coloured source rows.
 *
 * The numbers are a column of their own, a sibling of the block that scrolls.
 * That is what keeps them still: the `<pre>` owning the horizontal scroll holds
 * the source and nothing else, so a long line slides sideways underneath the
 * pointer while its number stays on the left edge. Vertical motion needs no
 * syncing at all — the body scrolls the gutter and the rows together, because
 * they are siblings in the same scroller.
 *
 * Both columns are measured by the same rules (`styles.ts`): the same monospaced
 * font, the same 12px size and 21.6px line height, the same 12px top padding and
 * the same bottom padding. Every source row is a fixed-height block, and a number
 * is one line of the gutter's `<pre>`, so row *n* and number *n* start at the same
 * offset for every *n* — the two columns cannot accumulate a difference because
 * neither one has a height of its own to vary.
 *
 * The gutter's width follows the file: it is sized in `ch` from the digits of the
 * last line number, so a 9-line file gets a narrow column and a 100 000-line file
 * still fits its numbers without re-measuring.
 *
 * Rendering is memoised per text and path: selecting another file replaces both,
 * while re-rendering for a resize or a tab switch costs nothing. The tokenizer
 * lives in `highlight.ts`; what it returns is escaped HTML — one block per row,
 * coloured tokens inside — plus the row count the gutter needs.
 */

import { useEffect, useLayoutEffect, useMemo, useRef, type CSSProperties, type ReactElement, type RefObject } from 'react'
import { highlightCode } from './highlight.js'

/** Keep wrapped source rows and their line numbers on the same baselines. */
export function useWrappedRowHeights(
  wrap: boolean,
  rows: RefObject<HTMLElement | null>,
  gutter: RefObject<HTMLElement | null>,
): void {
  useLayoutEffect(() => {
    const source = rows.current
    const ruler = gutter.current
    if (source === null || ruler === null) return
    const align = (): void => {
      const sourceRows = Array.from(source.querySelectorAll<HTMLElement>('.dsh-cf-line'))
      const numbers = Array.from(ruler.querySelectorAll<HTMLElement>('.dsh-cf-gutter-number'))
      sourceRows.forEach((row, index) => {
        const number = numbers[index]
        // Editor rows are translated to follow the textarea's scroll position;
        // offsetHeight measures layout height without including that transform.
        if (number !== undefined) number.style.setProperty('--dsh-cf-row-height', `${row.offsetHeight}px`)
      })
    }
    if (!wrap) return
    align()
    const observer = new ResizeObserver(align)
    observer.observe(source)
    source.querySelectorAll<HTMLElement>('.dsh-cf-line').forEach(row => observer.observe(row))
    return () => observer.disconnect()
  }, [wrap, rows, gutter])
}

/** Props of the preview body. */
interface CodePreviewProps {
  /** The file text exactly as the Host returned it. */
  readonly text: string
  /** The workspace path, which chooses the grammar and names the scroll region. */
  readonly path: string
  /** Whether a long source line continues on the next visual row. */
  readonly wrap: boolean
  /**
   * The 1-based line to bring into view once drawn.
   *
   * A Markdown link may name one (`README.md#L24`), and opening the file at the
   * top would make the link look broken. Absent means "start at the top", which
   * is what a file opened from the tree wants.
   */
  readonly line?: number | undefined
}

/**
 * One row's height, in pixels.
 *
 * Declared here because two things read it: the sheet, which pins every row and
 * both columns to it, and the one-off reveal below, which converts a line number
 * into a scroll offset by multiplying. A rule and a multiplication that disagreed
 * by a pixel would drift by a handful of rows over a long file.
 */
export const CODE_LINE_HEIGHT = 21.6

/** The padding the gutter spends on either side of its digits, in pixels. */
const GUTTER_PADDING = 16

/** The narrowest the number column may be, in characters: two digits are enough to read. */
const GUTTER_MIN_DIGITS = 2

/**
 * The number column for a file of `lineCount` rows.
 *
 * The editor draws its own number column — it has to translate the numbers by
 * the field's scroll offset, which the preview never does — but the digits, the
 * width and the pitch have to be the preview's, or the two modes would disagree
 * about where a row starts.
 *
 * @param lineCount - how many rows the file has.
 * @returns the numbers, one per line, and the width of the column.
 */
export function gutterBox(lineCount: number): { readonly text: string; readonly style: CSSProperties } {
  const digits = Math.max(GUTTER_MIN_DIGITS, String(lineCount).length)
  const numbers: string[] = []
  for (let line = 1; line <= lineCount; line += 1) numbers.push(String(line))
  const style: CSSProperties = { width: `calc(${digits}ch + ${GUTTER_PADDING}px)` }
  // One number per line: the gutter is a `<pre>`, so the breaks between them
  // are its own line boxes, counted by the same 21.6px the rows use.
  return { text: numbers.join('\n'), style }
}

/**
 * Draw one file's text with line numbers and syntax colours.
 *
 * @param props - the text to draw and the path it came from.
 * @returns the code body.
 */
export function CodePreview({ text, path, wrap, line }: CodePreviewProps): ReactElement {
  const { html, lineCount } = useMemo(() => highlightCode(text, path), [text, path])
  const gutter = useMemo(() => gutterBox(lineCount), [lineCount])
  /** The scrolling body this preview was drawn into, for the one-off reveal. */
  const view = useRef<HTMLDivElement>(null)
  const rows = useRef<HTMLElement>(null)
  const numbers = useRef<HTMLPreElement>(null)
  useWrappedRowHeights(wrap, rows, numbers)

  // Without wrapping, line pitch gives the offset without measuring. Wrapped rows
  // instead use their actual layout offset because previous rows may be taller.
  // Done once per file/wrap choice: later re-renders leave the reader's scroll alone.
  useEffect(() => {
    if (line === undefined || line < 1) return
    const scroller = view.current?.parentElement
    if (scroller == null) return
    const target = rows.current?.children[line - 1]
    const top = wrap && target instanceof HTMLElement
      ? target.offsetTop
      : CODE_LINE_HEIGHT * (line - 1)
    scroller.scrollTop = Math.max(0, top - scroller.clientHeight / 2)
  }, [line, wrap])

  return (
    <div className="dsh-cf-code-view" ref={view} data-wrap={wrap ? '' : undefined}>
      {/* The ruler is not content: it is hidden from assistive technology,
          cannot be selected into a copy, and never takes the pointer. */}
      {wrap ? (
        <pre ref={numbers} className="dsh-cf-gutter" aria-hidden="true" style={gutter.style}>
          {Array.from({ length: lineCount }, (_, index) => (
            <span className="dsh-cf-gutter-number" key={index}>{index + 1}</span>
          ))}
        </pre>
      ) : <pre className="dsh-cf-gutter" aria-hidden="true" style={gutter.style}>{gutter.text}</pre>}
      <pre className="dsh-cf-code">
        {/* The row markup is this module's own output: every token was escaped
            while it was built and the colours come from the theme this plugin
            registered, never from the file. */}
        <code ref={rows} dangerouslySetInnerHTML={{ __html: html }} />
      </pre>
    </div>
  )
}
