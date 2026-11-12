/**
 * The sidebar row's glyph, plus the unread mark that rides with it.
 *
 * The shell owns the row — the button, the label, the tooltip, and the hover and
 * selected fills — and hands this slot a `size` and the active flag inside a
 * fixed 16px glyph box. It renders the label itself and offers no seat beside it,
 * so the mark is measured into place: it stays a child of this slot (absolutely
 * positioned against the glyph's own box) and is laid out against the row's own
 * box — pinned to the row's right edge, centred on its height, clear of the text
 * with room to spare. When the row is too narrow for both, the mark steps aside
 * rather than covering the name.
 *
 * Collapsed to the icon rail there is no label and no width to spend on a word,
 * so the mark falls back to a dot on the glyph's top-right corner: with the text
 * gone, the icon is the only place left to say "there is something new here".
 *
 * The mark is decorative: the row's label is the accessible name (the shell wraps
 * this slot in `aria-hidden`), and the article list, not this mark, is where
 * unread state is actually acted on.
 */

import * as React from 'react'
import { IconFileAttachment } from '@dsh-cool/icons'

import type { Translate } from './locales.js'
import { useUnreadCount } from './unread.js'

/** Props the sidebar hands a `sidebar.panellist` occupant. */
export interface DailyPanelIconProps {
  /** Glyph edge in px: 16 in the expanded column, 18 in the collapsed rail. */
  size?: number
  /** Whether this panel is the selected one; the shell also paints the row. */
  active?: boolean
  /** The locale seat the shell synthesizes for this registration. */
  t: Translate
}

/** Minimum gap kept between the end of the label and the mark, in px. */
const LABEL_CLEARANCE = 8

/**
 * Find the label the shell draws beside this glyph.
 *
 * The shell's class names are hashed, so the label is recognised structurally:
 * the row is a button, and the label is the one child of it that carries text and
 * does not contain the glyph. `null` means the row is collapsed to the rail, where
 * the label is not rendered at all.
 *
 * @param glyph - this slot's element, already in the document.
 * @returns the label element, or null when there is none.
 */
function labelOf(glyph: HTMLElement): HTMLElement | null {
  const button = glyph.closest('button')
  if (button === null) return null
  for (const child of Array.from(button.children)) {
    if (child === glyph || child.contains(glyph)) continue
    if ((child.textContent ?? '').trim() !== '') return child as HTMLElement
  }
  return null
}

/**
 * Render the entry's document glyph, marked while anything is unread.
 *
 * @param props - the glyph size the shell asks for and the locale seat.
 * @returns the glyph, plus the "New" mark (or the rail's dot) while unread.
 */
export function DailyPanelIcon({ size, t }: DailyPanelIconProps): React.ReactElement {
  const unread = useUnreadCount()
  const glyphRef = React.useRef<HTMLSpanElement | null>(null)

  // Placing the mark from a measurement keeps it tied to the row instead of to a
  // guessed offset: the label's width follows the locale and the font, the row's
  // its column width, so both boxes are read after layout — before paint, hence
  // the layout effect — and read again whenever either of them resizes.
  React.useLayoutEffect(() => {
    const glyph = glyphRef.current
    const mark = glyph?.querySelector<HTMLElement>('.dsh-cd-mark') ?? null
    const dot = glyph?.querySelector<HTMLElement>('.dsh-cd-mark-dot') ?? null
    if (glyph === null || mark === null || dot === null) return

    // The row can be resized and the label can change width on its own (locale,
    // font, an ellipsis), so both are observed: the row for the column's width and
    // the label for the text's. Elements that leave the DOM drop off the observer
    // by themselves, so expanding and collapsing the column needs no bookkeeping.
    const observer = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(() => { place() })
    const watched = new WeakSet<Element>()
    const watch = (target: Element | null): void => {
      if (target === null || watched.has(target)) return
      watched.add(target)
      observer?.observe(target)
    }

    const place = (): void => {
      const row = glyph.closest('button')
      if (row === null) return
      const box = glyph.getBoundingClientRect()
      const rowBox = row.getBoundingClientRect()
      const label = labelOf(glyph)
      watch(label)

      // Rail: no text to sit beside, so the mark becomes a dot on the artwork's
      // own top-right corner, half outside the glyph's box.
      if (label === null) {
        mark.style.display = 'none'
        dot.style.display = 'block'
        dot.style.left = `${Math.round(box.width - 5)}px`
        dot.style.top = '-2px'
        dot.style.visibility = 'visible'
        return
      }

      dot.style.display = 'none'
      dot.style.visibility = 'hidden'
      mark.style.display = 'inline-flex'
      // Measure first: the pill's own width decides whether it fits at all.
      const width = mark.offsetWidth
      const height = mark.offsetHeight
      const paddingRight = Number.parseFloat(getComputedStyle(row).paddingRight) || 0
      const contentRight = rowBox.right - paddingRight
      const room = contentRight - label.getBoundingClientRect().right
      if (room < width + LABEL_CLEARANCE) {
        // Too narrow for the word and the name together: the name wins.
        mark.style.visibility = 'hidden'
        return
      }
      mark.style.left = `${Math.round(contentRight - box.left - width)}px`
      mark.style.top = `${Math.round(rowBox.top + (rowBox.height - height) / 2 - box.top)}px`
      mark.style.visibility = 'visible'
    }

    watch(glyph.closest('button'))
    place()
    return () => { observer?.disconnect() }
  }, [unread, size])

  return (
    <span className="dsh-cd-glyph" ref={glyphRef}>
      <IconFileAttachment size={size} />
      {unread > 0 ? (
        <>
          <span className="dsh-cd-mark" aria-hidden="true">{t('card.new')}</span>
          <span className="dsh-cd-mark-dot" aria-hidden="true" />
        </>
      ) : null}
    </span>
  )
}
