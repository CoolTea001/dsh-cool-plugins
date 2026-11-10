/**
 * Per-console terminal geometry remembered across page loads.
 *
 * A console that autostarts while DSH is opening has no visible xterm to
 * measure, yet the Host must pick a PTY size at spawn. Remembering the size
 * the console was last fitted to gives that background shell a plausible
 * geometry; when the terminal tab opens, the View measures itself again and
 * the Host resizes the existing session, so the remembered value is only a
 * starting point.
 *
 * The values mirror the Host's own bounds (all of which it clamps again on
 * arrival), so a hand-edited entry cannot ask for a zero-column PTY.
 */

/** localStorage key holding the console-id to geometry map. */
const GEOMETRY_KEY = 'dsh-cool-terminal.geometry.v1'

/** Bound on remembered consoles; the oldest entry is dropped first. */
const MAX_ENTRIES = 200

/** The Host's accepted geometry range, mirrored here for validation. */
const MIN_COLS = 20
const MAX_COLS = 400
const MIN_ROWS = 5
const MAX_ROWS = 200

/** What a console with no remembered size gets: a normal, roomy pane. */
const FALLBACK: ConsoleGeometry = { cols: 100, rows: 30 }

/** One terminal's fitted character grid. */
export interface ConsoleGeometry {
  readonly cols: number
  readonly rows: number
}

/**
 * Validate one persisted entry.
 * @param value - one map value.
 * @returns the geometry, or undefined when it is malformed or out of range.
 */
function parseGeometry(value: unknown): ConsoleGeometry | undefined {
  if (value === null || typeof value !== 'object') return undefined
  const record = value as Record<string, unknown>
  if (typeof record.cols !== 'number' || typeof record.rows !== 'number') return undefined
  if (!Number.isFinite(record.cols) || !Number.isFinite(record.rows)) return undefined
  const cols = Math.round(record.cols)
  const rows = Math.round(record.rows)
  if (cols < MIN_COLS || cols > MAX_COLS || rows < MIN_ROWS || rows > MAX_ROWS) return undefined
  return { cols, rows }
}

/** Read the whole map, dropping anything malformed. */
function readAll(): Record<string, ConsoleGeometry> {
  try {
    const raw = window.localStorage.getItem(GEOMETRY_KEY)
    if (raw === null) return {}
    const parsed: unknown = JSON.parse(raw)
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    const all: Record<string, ConsoleGeometry> = {}
    for (const [id, value] of Object.entries(parsed as Record<string, unknown>)) {
      const geometry = parseGeometry(value)
      if (geometry !== undefined) all[id] = geometry
    }
    return all
  } catch {
    return {}
  }
}

/**
 * The last fitted size for one console.
 * @param id - console id.
 * @returns its remembered geometry, or the fallback when there is none.
 */
export function readGeometry(id: string): ConsoleGeometry {
  return readAll()[id] ?? FALLBACK
}

/**
 * Remember one console's fitted size.
 *
 * Storage failures are not worth surfacing: the next launch simply falls back
 * to a default pane instead of the last one.
 *
 * @param id - console id.
 * @param cols - fitted column count.
 * @param rows - fitted row count.
 */
export function writeGeometry(id: string, cols: number, rows: number): void {
  if (!Number.isFinite(cols) || !Number.isFinite(rows)) return
  const geometry: ConsoleGeometry = {
    cols: Math.min(MAX_COLS, Math.max(MIN_COLS, Math.round(cols))),
    rows: Math.min(MAX_ROWS, Math.max(MIN_ROWS, Math.round(rows))),
  }
  try {
    const all = readAll()
    // Re-inserting matters: object key order is insertion order, so this
    // refreshes the console's place in the age order the bound below trims by.
    delete all[id]
    all[id] = geometry
    const ids = Object.keys(all)
    if (ids.length > MAX_ENTRIES) {
      for (const stale of ids.slice(0, ids.length - MAX_ENTRIES)) delete all[stale]
    }
    window.localStorage.setItem(GEOMETRY_KEY, JSON.stringify(all))
  } catch {
    /* persistence is a convenience, never a precondition */
  }
}
