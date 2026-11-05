/**
 * Shared unread count behind the sidebar entry's dot.
 *
 * The Host generates on its own schedule, so the entry cannot learn about a new
 * article from the page: the sidebar row is rendered outside the main panel, and
 * the generation happens while that panel is closed or showing something else.
 * The count therefore lives in the entry's own subscription — a slow poll of the
 * state route, a re-read whenever the window is focused again, and an event the
 * page fires after it changes something the count depends on (opening an article
 * marks it read, deleting removes it).
 *
 * The entry never caches the articles themselves: only the number matters here,
 * and the page keeps the list it already renders.
 */

import * as React from 'react'

import { fetchState } from './api.js'

/**
 * How often the entry re-reads the count on its own, in milliseconds.
 *
 * The scheduler writes its batch in the morning; a minute of latency is
 * invisible, and one request a minute costs nothing next to the page's own
 * polling while a generation runs.
 */
const POLL_INTERVAL_MS = 60_000

/** Window event the page fires after a read/delete, so the dot tracks it at once. */
const CHANGED_EVENT = 'dsh-cool-daily:changed'

/**
 * Tell the sidebar entry that the unread set probably changed.
 *
 * Cheap enough to fire on every mutation: listeners re-read the count from one
 * route rather than being handed the new value, so a missed event can only
 * delay the dot, never put it out of step.
 */
export function notifyUnreadChanged(): void {
  window.dispatchEvent(new Event(CHANGED_EVENT))
}

/**
 * Follow the number of unread articles.
 *
 * @returns the count, 0 until the first answer arrives and after any failure
 * (an unreachable Host has no articles to announce).
 */
export function useUnreadCount(): number {
  const [count, setCount] = React.useState(0)
  React.useEffect(() => {
    let live = true
    const load = async (): Promise<void> => {
      const answer = await fetchState()
      if (!live || answer.ok !== true) return
      setCount(answer.articles.filter(article => !article.read).length)
    }
    void load()
    const timer = window.setInterval(() => { void load() }, POLL_INTERVAL_MS)
    // Coming back to the window is exactly when a background batch should show
    // up, and it is sooner than the next tick.
    const reread = (): void => { void load() }
    window.addEventListener(CHANGED_EVENT, reread)
    window.addEventListener('focus', reread)
    return () => {
      live = false
      window.clearInterval(timer)
      window.removeEventListener(CHANGED_EVENT, reread)
      window.removeEventListener('focus', reread)
    }
  }, [])
  return count
}
