/**
 * Which listed children the workspace's own ignore rules leave out.
 *
 * A project's `.gitignore` is the author's statement about the tree: it says
 * which paths are generated, vendored, or private. The Files tab still lists
 * them — the tab shows what the disk holds — but a row the project has excluded
 * is drawn one step quieter, so the tree reads the way the repository does.
 *
 * The rules are Git's, so Git is what answers: `check-ignore` already resolves
 * the whole chain a hand-rolled matcher would have to reimplement — nested
 * `.gitignore` files, `.git/info/exclude`, the global excludes file, `.ignore`,
 * negations, and directory-only patterns — and it answers a whole level in one
 * run. A tracked file that happens to match a pattern is *not* ignored by Git,
 * and `check-ignore` reports exactly that without `--no-index`, which is the
 * reading wanted here: an entry the repository tracks is part of the project
 * whatever a pattern says.
 *
 * Like the hidden-mark probe, this is best-effort. A directory outside any
 * repository, a host without Git, and a run that fails all leave the level
 * undimmed rather than guessed at: a quieter row is a hint, and a hint is not
 * worth an error state or a second implementation of Git's matcher.
 */

/** Largest stdin one run may carry; a level's names, NUL-joined. */
const MAX_STDIN_BYTES = 128 * 1024

/** Largest stdout one run may collect; one NUL-terminated name per match. */
const MAX_STDOUT_BYTES = 256 * 1024

/** Largest stderr one run may collect; a diagnosis is one short line. */
const MAX_STDERR_BYTES = 8 * 1024

/** How long a killed run may take to settle before its result is ignored. */
const GRACE_MS = 1_000

/** How long one run may take before it is killed. */
const TIMEOUT_MS = 3_000

/**
 * Environment every run gets.
 *
 * `GIT_OPTIONAL_LOCKS` keeps a read-only question from touching the index, and
 * the prompt pin turns an unexpected credential request into a failed run rather
 * than a hung one — nothing here can answer a prompt. Colour is irrelevant to a
 * `-z` answer but costs nothing to pin.
 */
const GIT_ENV: Readonly<Record<string, string>> = { NO_COLOR: '1', GIT_OPTIONAL_LOCKS: '0', GIT_TERMINAL_PROMPT: '0' }

/**
 * The names of one level that the workspace's ignore rules exclude.
 *
 * @param ctx - the Host plugin context.
 * @param directory - the absolute directory the listing answered for.
 * @param names - the level's child names, in listing order.
 * @returns the ignored names; empty when no rule, no repository, or no Git can answer.
 */
export async function ignoredNames(
  ctx: any,
  directory: string,
  names: readonly string[],
): Promise<ReadonlySet<string>> {
  const wanted = names.filter((name) => name !== '')
  if (wanted.length === 0) return new Set()

  // Names are NUL-separated so a name holding a newline, a quote, or a space
  // needs no quoting, and `-z` answers in the same shape — both ends are exact,
  // and no shell parses either.
  const sent: string[] = []
  let bytes = 0
  for (const name of wanted) {
    const size = Buffer.byteLength(name, 'utf8') + 1
    if (bytes + size > MAX_STDIN_BYTES) break
    sent.push(name)
    bytes += size
  }
  if (sent.length === 0) return new Set()

  const reported = await runCheckIgnore(ctx, directory, `${sent.join('\0')}\0`)
  if (reported === undefined) return new Set()

  const wantedSet = new Set(sent)
  const ignored = new Set<string>()
  for (const name of reported) if (wantedSet.has(name)) ignored.add(name)
  return ignored
}

/**
 * Run `git check-ignore` over one level and read the names it reported.
 *
 * Exit `0` means at least one name matched, `1` means none did; both are ordinary
 * answers. Anything else — most commonly `128` for a directory outside any
 * repository — leaves the level unmarked.
 *
 * @param ctx - the Host plugin context.
 * @param directory - the absolute directory the run is made against.
 * @param input - the NUL-joined names, terminated by a NUL.
 * @returns the reported names, or undefined when Git could not answer.
 */
async function runCheckIgnore(ctx: any, directory: string, input: string): Promise<readonly string[] | undefined> {
  const subprocess = ctx.get('subprocess')
  if (subprocess === undefined || typeof subprocess.spawn !== 'function') return undefined

  let handle: any
  try {
    handle = subprocess.spawn({
      argv: ['git', 'check-ignore', '--stdin', '-z'],
      cwd: directory,
      stdio: {
        stdin: { data: input },
        stdout: { maxBytes: MAX_STDOUT_BYTES },
        stderr: { maxBytes: MAX_STDERR_BYTES },
      },
      graceMs: GRACE_MS,
      env: GIT_ENV,
    })
  } catch {
    // No Git, or no process: nothing was asked, so nothing is ignored.
    return undefined
  }

  const readers = handle?.collected
  if (typeof handle?.done?.then !== 'function' || readers === undefined) {
    try {
      handle?.terminate?.()
    } catch {
      /* the range is already gone */
    }
    return undefined
  }

  const timer = setTimeout(() => {
    try {
      handle.terminate()
    } catch {
      /* the range is already gone */
    }
  }, TIMEOUT_MS)

  try {
    const outcome = await handle.done
    // 128 is "not a repository"; any other non-zero is a failure. Neither is an
    // error this route should carry.
    if (outcome?.exitCode !== 0) return undefined
    const read = typeof readers.stdout?.readFrom === 'function' ? readers.stdout.readFrom(0) : undefined
    // A lossy answer is incomplete, and an incomplete answer would dim some rows
    // and not others for no reason the reader could see; leaving the level plain
    // is the honest reading of a truncated one.
    if (read?.lossy === true || typeof read?.text !== 'string') return undefined
    return read.text.split('\0').filter((name: string) => name !== '')
  } catch {
    return undefined
  } finally {
    clearTimeout(timer)
  }
}
