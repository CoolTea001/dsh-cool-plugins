/**
 * The archive glyph on the Settings panel's Sessions entry.
 *
 * A section registration carries a label, not an icon: the shipped settings
 * shell picks its navigation glyph from the section id (`navIcon(row.id)` in
 * ui-settings-general), and every id it does not know — a plugin's id included —
 * gets the generic gear. The entry therefore owns its glyph the only way a
 * plugin can: after the cell renders, hide the shell's gear and render
 * `@dsh-cool/icons`' archive glyph in the seat beside the label. dsh-cool-theme
 * patches its palette into the same seat for the same reason.
 *
 * Matching is by the rendered label rather than by class hash, because the
 * shell's CSS module hashes rotate between releases. The observer only watches
 * child-list changes: opening and closing Settings replaces the cell's children,
 * while typing elsewhere in the page usually edits text nodes and must not
 * trigger a scan.
 */

import { createElement } from 'react'
import { createRoot, type Root } from 'react-dom'
import { IconArchive } from '@dsh-cool/icons'
import { navLabels, type Translate } from './locales.js'

/** The shell draws its own navigation glyphs at 16px. */
const NAV_ICON_SIZE = 16

/** Marks the span this module inserts, so re-patching stays idempotent. */
const ICON_ATTRIBUTE = 'data-dsh-cs-nav-icon'

/** Marks the gear this module hid, so disposal can restore it. */
const HIDDEN_ATTRIBUTE = 'data-dsh-cs-nav-hidden'

/** The nav label in every translated language, plus the one this render is reading. */
function settingsLabels(t: Translate): readonly string[] {
  const labels = new Set(navLabels())
  // A locale switch can land between registration and this read; the shipped
  // dictionaries still identify the cell in every translated language, so a
  // miss is safe.
  try {
    const current = t('settings.nav')
    if (current !== '') labels.add(current)
  } catch { /* dictionary not readable yet */ }
  return [...labels]
}

/**
 * Find the settings navigation cells, tolerating a rotated class hash.
 *
 * The panel carries `data-shortcut-modal="settings"` in the shipped shell; using
 * it as the scope keeps the observer from scanning the rest of the page while
 * Settings is closed. Inside the panel the cell class may be rehashed, so the
 * fallback reads every button under the nav column.
 *
 * @returns the cells to inspect, or every button under a nav-like element when
 * the hashed name is not present.
 */
function navCells(): readonly HTMLElement[] {
  const panel = document.querySelector<HTMLElement>('[data-shortcut-modal="settings"]')
  if (panel === null) return []
  const cells = panel.querySelectorAll<HTMLElement>('[class*="navCell"]')
  if (cells.length > 0) return [...cells]
  return [...panel.querySelectorAll<HTMLElement>('[class*="nav"] button')]
}

/**
 * Replace the gear on the Sessions cell with the package's archive glyph.
 *
 * @param labels - the label spellings that identify this section's cell.
 * @param roots - the mounted icon roots, kept so disposal can unmount them.
 */
function patch(labels: ReadonlySet<string>, roots: Map<HTMLElement, Root>): void {
  // The shell can replace the nav cell while Settings is open; unmount any root
  // whose holder left the document before mounting another one.
  for (const [holder, root] of roots) {
    if (holder.isConnected) continue
    root.unmount()
    roots.delete(holder)
  }

  for (const cell of navCells()) {
    const label = cell.querySelector('[class*="navLabel"]')?.textContent ?? cell.textContent ?? ''
    if (!labels.has(label.trim())) continue
    if (cell.querySelector(`[${ICON_ATTRIBUTE}]`) !== null) continue
    const svg = cell.querySelector<SVGElement>('svg')
    if (svg === null) continue

    svg.style.display = 'none'
    svg.setAttribute(HIDDEN_ATTRIBUTE, '1')

    const holder = document.createElement('span')
    holder.className = 'dsh-cs-nav-icon'
    holder.setAttribute(ICON_ATTRIBUTE, '1')
    holder.setAttribute('aria-hidden', 'true')
    svg.after(holder)

    const root = createRoot(holder)
    root.render(createElement(IconArchive, { size: NAV_ICON_SIZE }))
    roots.set(holder, root)
  }
}

/**
 * Keep the Sessions entry's glyph patched for the plugin's lifetime.
 *
 * Runs once for a panel that is already open and again whenever the shell mounts
 * or re-renders the navigation. The disposer removes the inserted spans and
 * restores the gears, so an HMR update does not leave two glyphs in the seat.
 *
 * @param t - the plugin's translate seat, for the current locale's label.
 * @returns the disposer that stops observation and restores the shell's DOM.
 */
export function installSessionNavIcon(t: Translate): () => void {
  if (typeof document === 'undefined' || typeof MutationObserver === 'undefined') return () => {}
  const labels = new Set(settingsLabels(t).filter((label) => label.length > 0))
  const roots = new Map<HTMLElement, Root>()
  const apply = (): void => { patch(labels, roots) }

  apply()
  let frame: number | undefined
  const schedule = (): void => {
    if (frame !== undefined) return
    if (typeof requestAnimationFrame !== 'function') {
      apply()
      return
    }
    frame = requestAnimationFrame(() => {
      frame = undefined
      apply()
    })
  }
  const observer = new MutationObserver(schedule)
  observer.observe(document.body, { childList: true, subtree: true })

  return () => {
    observer.disconnect()
    if (frame !== undefined) cancelAnimationFrame(frame)
    for (const [holder, root] of roots) {
      root.unmount()
      holder.remove()
    }
    roots.clear()
    for (const svg of document.querySelectorAll<SVGElement>(`svg[${HIDDEN_ATTRIBUTE}]`)) {
      svg.style.display = ''
      svg.removeAttribute(HIDDEN_ATTRIBUTE)
    }
  }
}
