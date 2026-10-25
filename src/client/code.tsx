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
 * font, the same 12px size and 19.2px line height, the same 12px top padding and
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

import { useMemo, type CSSProperties, type ReactElement } from 'react'
import { highlightCode } from './highlight.js'

/** Props of the preview body. */
interface CodePreviewProps {
  /** The file text exactly as the Host returned it. */
  readonly text: string
  /** The workspace path, which chooses the grammar and names the scroll region. */
  readonly path: string
}

/** The padding the gutter spends on either side of its digits, in pixels. */
const GUTTER_PADDING = 16

/** The narrowest the number column may be, in characters: two digits are enough to read. */
const GUTTER_MIN_DIGITS = 2

/**
 * Draw one file's text with line numbers and syntax colours.
 *
 * @param props - the text to draw and the path it came from.
 * @returns the code body.
 */
export function CodePreview({ text, path }: CodePreviewProps): ReactElement {
  const { html, lineCount } = useMemo(() => highlightCode(text, path), [text, path])
  const gutter = useMemo(() => {
    const digits = Math.max(GUTTER_MIN_DIGITS, String(lineCount).length)
    const numbers: string[] = []
    for (let line = 1; line <= lineCount; line += 1) numbers.push(String(line))
    const style: CSSProperties = { width: `calc(${digits}ch + ${GUTTER_PADDING}px)` }
    // One number per line: the gutter is a `<pre>`, so the breaks between them
    // are its own line boxes, counted by the same 19.2px the rows use.
    return { text: numbers.join('\n'), style }
  }, [lineCount])
  return (
    <div className="dsh-cf-code-view">
      {/* The ruler is not content: it is hidden from assistive technology,
          cannot be selected into a copy, and never takes the pointer. Its text
          is one number per line, and it starts on the same line the first row
          starts on because both columns share one set of metrics. */}
      <pre className="dsh-cf-gutter" aria-hidden="true" style={gutter.style}>{gutter.text}</pre>
      <pre className="dsh-cf-code">
        {/* The row markup is this module's own output: every token was escaped
            while it was built and the colours come from the theme this plugin
            registered, never from the file. */}
        <code dangerouslySetInnerHTML={{ __html: html }} />
      </pre>
    </div>
  )
}
