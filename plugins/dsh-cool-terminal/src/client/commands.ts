/**
 * Common-command model for the terminal tab.
 *
 * A common command is a reusable shell snippet the user saves once and sends
 * to any console later. The list is global (not per-Workspace): a run-book
 * like `pnpm dev` applies wherever it is invoked. The account persists across
 * page reloads exactly like the console account does (see terminals.ts), and
 * every list operation is pure so the React half can treat the account as
 * immutable state.
 */

/** One saved shell snippet. */
export interface CommandDef {
  readonly id: string
  /** The shell line to send. */
  readonly body: string
  /** What the command does; shown under the command body. */
  readonly description: string
}

/** Monotone counter; combined with the clock so ids stay unique across resets. */
let sequence = 0

const STORAGE_KEY = 'dsh-cool-terminal.commands.v1'

/** Read the saved commands. Malformed entries are dropped, not fatal. */
export function loadCommands(): CommandDef[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw === null) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    const list: CommandDef[] = []
    for (const item of parsed) {
      const command = parseCommand(item)
      if (command !== undefined) list.push(command)
    }
    return list
  } catch {
    return []
  }
}

/**
 * Persist the commands. Storage failures (quota, blocked third-party storage)
 * are not worth surfacing: the commands keep working for this page's lifetime.
 */
export function saveCommands(commands: readonly CommandDef[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...commands]))
  } catch {
    /* persistence is a convenience, never a precondition */
  }
}

/**
 * Append a command.
 * @param list - current list.
 * @param body - the shell snippet.
 * @param description - what the command does.
 * @returns the next list.
 */
export function addCommand(list: readonly CommandDef[], body: string, description: string): CommandDef[] {
  const trimmed = body.trim()
  if (trimmed === '') return [...list]
  sequence += 1
  const id = `c${Date.now().toString(36)}${sequence.toString(36)}`
  return [...list, { id, body: trimmed, description: description.trim() }]
}

/**
 * Replace a command's body and description. Ignored when the body is blank.
 * @param list - current list.
 * @param id - command to replace.
 */
export function updateCommand(list: readonly CommandDef[], id: string, body: string, description: string): CommandDef[] {
  const trimmed = body.trim()
  if (trimmed === '') return [...list]
  return list.map((command) => (command.id === id ? { ...command, body: trimmed, description: description.trim() } : command))
}

/** Remove one command; removing an absent id is a harmless no-op. */
export function removeCommand(list: readonly CommandDef[], id: string): CommandDef[] {
  const next = list.filter((command) => command.id !== id)
  return next.length === list.length ? [...list] : next
}

/**
 * How command bodies compare for display.
 *
 * One collator for the whole module rather than a comparator per call: the
 * object is the expensive part of a locale-aware comparison, and building it per
 * sort would rebuild it on every keystroke in the dialog's search field.
 *
 * `numeric` is what makes `pnpm test:2` sort before `pnpm test:10` instead of
 * after it — a shell run-book is full of numbered variants, and the string
 * order ("1" < "10" < "2") reads as a bug to anyone scanning the list.
 * `sensitivity: 'base'` folds case and accents, so `Git status` and `git status`
 * land together instead of at opposite ends.
 */
const BODY_COLLATOR = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })

/**
 * Order a list for display, alphabetically by the command body.
 *
 * This is a view concern, not a storage one: the persisted account keeps its
 * insertion order (see `addCommand`), so the saved file records what the user
 * added and when, while every surface that draws the list sorts a copy here.
 * That split is deliberate — sorting on write would rewrite the whole list on
 * each edit, and would lose the only record of which command came first.
 *
 * The sort is stable, so two commands with the same body keep the order they
 * were added in; `addCommand` does not refuse a duplicate body, and a tidier
 * tie-break than "as added" does not exist here.
 *
 * @param list - the list to order, left untouched.
 * @returns a sorted copy.
 */
export function sortCommands(list: readonly CommandDef[]): CommandDef[] {
  return [...list].sort((left, right) => BODY_COLLATOR.compare(left.body, right.body))
}

/**
 * Filter the list by a free-text needle. Both the command body and its
 * description match, case-insensitively.
 */
export function filterCommands(list: readonly CommandDef[], query: string): CommandDef[] {
  const needle = query.trim().toLowerCase()
  if (needle === '') return [...list]
  return list.filter(
    (command) => command.body.toLowerCase().includes(needle) || command.description.toLowerCase().includes(needle),
  )
}

/** Parse one persisted command entry, or undefined when it is malformed. */
function parseCommand(item: unknown): CommandDef | undefined {
  if (item === null || typeof item !== 'object') return undefined
  const record = item as Record<string, unknown>
  if (typeof record.id !== 'string' || record.id === '') return undefined
  if (typeof record.body !== 'string' || record.body.trim() === '') return undefined
  const description = typeof record.description === 'string' ? record.description : ''
  return { id: record.id, body: record.body, description }
}
