/**
 * Live under the Conversation shell's one resident composer seat.
 *
 * The shell mounts a composer seat — the input card plus the
 * `conversation.input.dock` rows above it — for every View. It also publishes the
 * hook a View uses to take the whole body: the View root declares
 * `data-conversation-composer-overlay`, and the shell then drops the transcript
 * width handles and floats the seat over the page. That hook repositions the seat;
 * it never removes it, so a page with no input of its own has to take the seat out
 * itself.
 *
 * Two things go into that, and both live here because they have to agree:
 *
 * 1. A stylesheet rule, so the seat is gone on every frame the shell paints —
 *    including the frames before this module's effect has run. The selector is
 *    scoped by the page's own root class, which exists only while that page is
 *    mounted, so Chat, Trajectory, Terminal and Git keep their composer
 *    untouched, and the rule disappears with the View.
 *
 * 2. A DOM write on the seat element. It is presentation too, but it depends on
 *    nothing beyond the rendered tree: not on this plugin's sheet being
 *    inserted, not on the shell ranking our selector above its own, not on the
 *    attribute names this version of the shell happens to use. The two are
 *    deliberately redundant, in the same direction.
 *
 * The seat is a sibling of the View inside the Conversation body, rendered
 * unconditionally by the same component that renders the View: when that body is
 * replaced the View remounts with it, so one write per mount reaches every seat
 * this page can coexist with.
 */

import { useLayoutEffect, type RefObject } from 'react'

/** The shell's marker on the Conversation body that owns one composer seat. */
const CONVERSATION_BODY = '[data-conversation-content]'

/** The shell's marker on the seat itself. */
const COMPOSER_SEAT = '[data-composer-seat]'

/**
 * Hide the composer seat of the Conversation hosting `view`.
 *
 * @param view - the mounted View root, or null before React attaches it.
 * @returns disposer restoring exactly the inline display it replaced.
 */
export function suppressComposerSeat(view: Element | null): () => void {
  if (view === null) return () => {}
  // A shell that stops marking the body falls back to the whole document: the
  // intent — no composer while this page is mounted — is unchanged, and reading
  // one marking is a smaller assumption than reading two.
  const body = view.closest(CONVERSATION_BODY) ?? document
  const seats = Array.from(body.querySelectorAll(COMPOSER_SEAT))
  if (seats.length === 0) return () => {}

  const previous = seats.map((seat) => (seat as HTMLElement).style.display)
  for (const seat of seats) (seat as HTMLElement).style.display = 'none'
  return () => {
    seats.forEach((seat, index) => {
      ;(seat as HTMLElement).style.display = previous[index] ?? ''
    })
  }
}

/**
 * Take the composer seat out for as long as a page is mounted.
 *
 * @param rootRef - the page's own root element; the View root that also declares
 *   `data-conversation-composer-overlay`.
 */
export function useComposerSeatSuppression(rootRef: RefObject<HTMLElement | null>): void {
  useLayoutEffect(() => suppressComposerSeat(rootRef.current), [rootRef])
}
