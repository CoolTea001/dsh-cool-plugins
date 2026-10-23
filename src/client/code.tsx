/**
 * The code body of the preview pane: a fixed line-number gutter beside the
 * text, with the text coloured by the grammar its file name picks.
 *
 * The gutter is a sibling of the code, not part of it: the code block owns the
 * horizontal scroll while the pane owns the vertical one, so a long line slides
 * under the pointer without taking the line numbers with it, and the numbers
 * stay put while the reader scrolls down. Both columns draw the same line box —
 * same size, line height and top padding — which is what keeps number n on the
 * line it belongs to; the gutter repeats that box as plain text (`white-space:
 * pre`) rather than as one element per line, so a five-thousand-line file still
 * mounts one node per column.
 *
 * Highlighting is memoised per text and path: selecting another file replaces
 * both, while re-rendering for a resize or a tab switch costs nothing.
 */

import { useMemo, type ReactElement } from 'react'
import { highlightCode } from './highlight.js'

/** Props of the preview body. */
interface CodePreviewProps {
  /** The file text exactly as the Host returned it. */
  readonly text: string
  /** The workspace path, which chooses the grammar and names the scroll region. */
  readonly path: string
}

/**
 * Draw one file's text with line numbers and syntax colours.
 *
 * @param props - the text to draw and the path it came from.
 * @returns the two-column code body.
 */
export function CodePreview({ text, path }: CodePreviewProps): ReactElement {
  const highlighted = useMemo(() => highlightCode(text, path), [text, path])
  const numbers = useMemo(() => lineNumbers(text), [text])
  return (
    <div className="dsh-cf-code-view">
      {/* The numbers are an aid to the eye, not content: hidden from the
          accessibility tree, and unselectable so copying the code never picks
          up a column of digits. */}
      <div className="dsh-cf-gutter" aria-hidden="true">
        {numbers}
      </div>
      <pre className="dsh-cf-code">
        {highlighted === null ? (
          <code>{text}</code>
        ) : (
          // highlight.js escapes the text it highlights, so this is the same
          // characters plus spans; the string is this module's output, never
          // the raw file.
          <code dangerouslySetInnerHTML={{ __html: highlighted }} />
        )}
      </pre>
    </div>
  )
}

/**
 * The gutter's text for one file: the numbers 1..n, one per line.
 *
 * An empty file still gets line 1, the way an editor draws it. The result is
 * rendered inside `white-space: pre`, so the newlines are the row boundaries.
 *
 * @param text - the file text.
 * @returns the numbers, newline separated.
 */
function lineNumbers(text: string): string {
  const count = text === '' ? 1 : text.split('\n').length
  const numbers: string[] = []
  for (let line = 1; line <= count; line += 1) numbers.push(String(line))
  return numbers.join('\n')
}
