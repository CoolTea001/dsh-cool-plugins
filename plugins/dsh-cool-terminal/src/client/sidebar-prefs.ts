/**
 * The reader preference the sidebar's title bar sets: whether it lists every
 * workspace or only the ones that hold a console.
 *
 * It is a window preference rather than workspace state — it says how this
 * reader wants to see the column, not what the column contains — so it is kept
 * in localStorage beside the sidebar width (see `layout.ts`), under this
 * plugin's own key.
 *
 * Storage that refuses the write is not worth surfacing: the preference still
 * holds for as long as the page is open, which is what `read*` falling back to
 * the default already covers for the next load.
 */

/**
 * Where the preference is remembered.
 *
 * The stored values are the two spellings this setting had as a two-way choice
 * (`all` / `withTerminals`). They are kept deliberately: the setting is one
 * checkbox now, but a reader who had already picked "hide empty workspaces"
 * must not be silently flipped back on upgrade, and keeping the vocabulary
 * means the rewrite is a no-op for them.
 */
const FILTER_KEY = 'dsh-cool-terminal.filter.v1'

/** The stored token for each state. */
const STORED = { showAll: 'all', hideEmpty: 'withTerminals' } as const

/**
 * Read the preference: whether every workspace is listed.
 *
 * The default is on, and it matters more than a default usually does: with it
 * off, a workspace that holds no console draws no row at all, and the row is
 * where its own ＋ lives — so hiding empty workspaces by default would hide the
 * one control a new user needs to create their first console. The title bar's
 * `新增终端` still reaches every workspace either way, but the column should not
 * start out looking emptier than it is.
 *
 * @returns true to list every workspace; false to hide the ones with no console.
 */
export function readShowAll(): boolean {
  try {
    return window.localStorage.getItem(FILTER_KEY) !== STORED.hideEmpty
  } catch {
    return true
  }
}

/** Remember the preference. Storage that refuses the write is not surfaced. */
export function writeShowAll(showAll: boolean): void {
  try {
    window.localStorage.setItem(FILTER_KEY, showAll ? STORED.showAll : STORED.hideEmpty)
  } catch {
    /* persistence is a convenience, never a precondition */
  }
}
