/**
 * A page's remembered layout, stored as data rather than trusted as a fact.
 *
 * Every resizable page in this repository keeps its boundary widths in
 * `localStorage` under the plugin's own key, and every one of them had written
 * the same read path: try the entry, parse it, reject anything that is not a
 * positive finite number, fall back to the default. Three copies of that is
 * three chances to trust a value written in another window size, by another
 * version of the page, in a browser that may not give the entry back at all.
 *
 * The storage is a convenience and never a precondition: a write that is refused
 * (quota, or third-party storage blocked) is not worth surfacing, and a read that
 * fails leaves the page on its default layout for as long as it is open.
 */

/** How one field of a stored layout is validated. */
export interface LayoutField<T> {
  /** The value used when the stored one is missing or unusable. */
  readonly fallback: T
  /**
   * Read one stored field, returning it or the fallback.
   *
   * Written per field rather than derived from a type: a stored value is
   * untyped JSON, so "is this a positive finite number" is a decision the page
   * has to state, not something a type can recover after `JSON.parse`.
   */
  readonly read: (raw: unknown) => T
}

/** A reader for one number field of a stored layout. */
export function finiteNumber(fallback: number): LayoutField<number> {
  return {
    fallback,
    read: (raw) => (typeof raw === 'number' && Number.isFinite(raw) && raw > 0 ? raw : fallback),
  }
}

/**
 * A reader for one share field, stored as a fraction strictly between 0 and 1.
 *
 * A split is saved as a share rather than a size so that a boundary dragged in a
 * short window is the same split when the window grows. The strict bounds are
 * what keep a saved `0` or `1` — a pane collapsed to nothing, by an older version
 * or a hand-edited entry — from leaving a pane that can never be dragged back.
 */
export function fraction(fallback: number): LayoutField<number> {
  return {
    fallback,
    read: (raw) =>
      typeof raw === 'number' && Number.isFinite(raw) && raw > 0 && raw < 1 ? raw : fallback,
  }
}

/**
 * Read one stored layout.
 *
 * @param key - the plugin's own `localStorage` entry.
 * @param fields - one reader per field, in the shape the caller draws with.
 * @returns the layout to draw, always usable.
 */
export function readLayout<T extends Record<string, unknown>>(
  key: string,
  fields: { readonly [K in keyof T]: LayoutField<T[K]> },
): T {
  let raw: string | null
  try {
    raw = window.localStorage.getItem(key)
  } catch {
    // Storage is not available to this page (a sandboxed frame, or storage off):
    // the page keeps the default layout for as long as it is open.
    return parseLayout(null, fields)
  }
  return parseLayout(raw, fields)
}

/**
 * Read one layout out of a raw stored string.
 *
 * The parse half of {@link readLayout}, split out for two reasons: it is the half
 * worth reviewing and showing (what happens to a value another version wrote),
 * and it has no storage to stub in order to be exercised. A missing entry, an
 * unreadable one, and a field of the wrong shape are the three cases, and each
 * costs only what it names.
 *
 * @param raw - the entry's text, or null when there is none.
 * @param fields - one reader per field.
 * @returns the layout to draw, always usable.
 */
export function parseLayout<T extends Record<string, unknown>>(
  raw: string | null,
  fields: { readonly [K in keyof T]: LayoutField<T[K]> },
): T {
  if (raw === null) return defaultsOf(fields)

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return defaultsOf(fields)
  }
  const saved = (typeof parsed === 'object' && parsed !== null ? parsed : {}) as Record<string, unknown>
  const result: Record<string, unknown> = {}
  for (const [name, field] of Object.entries(fields) as [string, LayoutField<unknown>][]) {
    result[name] = field.read(saved[name])
  }
  return result as T
}

/**
 * Build the all-defaults layout.
 *
 * @param fields - the readers the layout is made of.
 * @returns one value per field, all of them the fallbacks.
 */
function defaultsOf<T extends Record<string, unknown>>(
  fields: { readonly [K in keyof T]: LayoutField<T[K]> },
): T {
  const result = {} as Record<string, unknown>
  for (const [name, field] of Object.entries(fields) as [string, LayoutField<unknown>][]) {
    result[name] = field.fallback
  }
  return result as T
}

/**
 * Record one stored layout.
 *
 * A storage that refuses the write is not worth surfacing: no workspace state is
 * involved, and the drag holds for as long as the page is open either way.
 *
 * @param key - the plugin's own `localStorage` entry.
 * @param layout - the layout to save.
 */
export function writeLayout(key: string, layout: object): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(layout))
  } catch {
    /* persistence is a convenience, never a precondition */
  }
}

/**
 * The widest a fixed sidebar may be drawn in a page this wide.
 *
 * Two bounds at once: the width a sidebar stops being worth dragging past, and
 * what is left of the page once the main pane keeps its own floor. The sidebar's
 * floor wins when the window cannot hold both, so a narrow window still draws a
 * whole sidebar and leaves the main pane to suffer — a sidebar narrower than its
 * own header would have no honest reading at all.
 *
 * @param preferred - the width the pointer, or the saved layout, asks for.
 * @param available - the page's width, in CSS pixels.
 * @param bounds - the sidebar's floor and cap, and the main pane's floor.
 * @returns the width to draw.
 */
export function clampSideWidth(
  preferred: number,
  available: number,
  bounds: { readonly min: number; readonly max: number; readonly mainMin: number },
): number {
  const ceiling = Math.max(bounds.min, Math.min(bounds.max, available - bounds.mainMin))
  return Math.min(Math.max(preferred, bounds.min), ceiling)
}
