/**
 * Which listed children the host platform itself treats as hidden.
 *
 * A dot-prefixed name is the POSIX convention, and it is the only "hidden" mark
 * a plain directory read carries: neither Node's dirents nor the filesystem
 * service's listing exposes a platform visibility bit, so a name has to be
 * judged here rather than read off the entry. Two judgements are combined — the
 * convention, and a probe of the platform's own hidden mark — and the union is
 * what the page filters on:
 *
 * - Linux and every other system with no attribute to ask about: a leading `.`
 *   is the convention, and it is the whole answer.
 * - macOS: the Finder's invisible mark is the `UF_HIDDEN` flag (which is also
 *   what `chflags hidden` and `SetFile -a V` set), and it is not part of a
 *   `readdir` answer. One `find -flags hidden` over the listed level reports
 *   those names.
 * - Windows: the hidden attribute is `FILE_ATTRIBUTE_HIDDEN`, which dirents drop
 *   as well; `attrib` reports it per child.
 *
 * The probe is best-effort by construction. A host without a process substrate,
 * a platform with no attribute worth asking about, and a probe that exits
 * non-zero all leave the convention in charge, so the page never draws a folder
 * differently just because a helper process could not run. Nothing here throws:
 * a visibility hint is not worth failing a listing over.
 */

/** Largest stdout one probe may collect; a level's hidden names are short. */
const PROBE_MAX_BYTES = 64 * 1024

/** Largest stderr one probe may collect; a diagnosis is one short line. */
const PROBE_STDERR_BYTES = 8 * 1024

/** How long a killed probe may take to settle before its result is ignored. */
const PROBE_GRACE_MS = 1_000

/** How long one probe may run before it is killed. */
const PROBE_TIMEOUT_MS = 1_500

/**
 * Whether a name carries the POSIX hidden mark.
 *
 * @param name - the basename of one listed child.
 * @returns true for a dot-prefixed name.
 */
export function isHiddenName(name: string): boolean {
  return name.startsWith('.')
}

/** One invocation of a platform probe, and how to read the names it reported. */
interface HiddenProbe {
  /**
   * The executable and its arguments for one directory; `argv[0]` is the program.
   *
   * @param directory - the absolute directory being listed.
   * @returns the words to spawn.
   */
  readonly argv: (directory: string) => readonly string[]
  /**
   * The hidden basenames in one successful run.
   *
   * @param stdout - the collected standard output.
   * @param directory - the absolute directory the run was made against.
   * @returns the names the run reported as hidden.
   */
  readonly parse: (stdout: string, directory: string) => readonly string[]
}

/**
 * The probes that answer for this host, if any.
 *
 * The `find` output is NUL-delimited and relative to the probe's own working
 * directory, so a name holding a newline or a space needs no quoting and no
 * shell sits between this module and the answer. `attrib` insists on printing
 * whole paths, so its mask is made absolute and the name is read back off that
 * prefix rather than off a column position — the tool's column widths vary with
 * the attributes present.
 *
 * @param platform - the Host's own `process.platform`.
 * @returns the probes to run, in order; empty when the platform has none.
 */
function probesFor(platform: NodeJS.Platform): readonly HiddenProbe[] {
  if (platform === 'darwin') {
    return [
      {
        argv: () => ['/usr/bin/find', '.', '-mindepth', '1', '-maxdepth', '1', '-flags', 'hidden', '-print0'],
        parse: (stdout) =>
          stdout
            .split('\0')
            .filter((line) => line.startsWith('./'))
            .map((line) => line.slice(2)),
      },
    ]
  }
  if (platform === 'win32') {
    /**
     * Read `attrib`'s rows for one directory.
     *
     * A row is `<attribute letters><spaces><absolute path>`; the letters are
     * everything before the directory prefix this run was given, and `H` among
     * them is the hidden attribute. A name that itself contains the prefix or an
     * `H` is never misread, because only the letters column is scanned.
     */
    const parse = (stdout: string, directory: string): readonly string[] => {
      const prefix = directory.endsWith('\\') ? directory : `${directory}\\`
      const names: string[] = []
      for (const line of stdout.split(/\r?\n/)) {
        if (line.trim() === '') continue
        const at = line.indexOf(prefix)
        if (at === -1) continue
        if (!line.slice(0, at).toUpperCase().includes('H')) continue
        const name = line.slice(at + prefix.length).trim()
        if (name !== '') names.push(name)
      }
      return names
    }
    // Files and directories are separate runs: `attrib` applies `/d` to folders,
    // and a level holds both kinds.
    return [
      { argv: (directory) => ['attrib', `${directory}\\*`], parse },
      { argv: (directory) => ['attrib', `${directory}\\*`, '/d'], parse },
    ]
  }
  return []
}

/**
 * Run one probe and read the names it reported.
 *
 * @param ctx - the Host plugin context.
 * @param directory - the absolute directory the probe runs in.
 * @param probe - the invocation to make.
 * @returns the reported names, or undefined when the probe could not answer.
 */
async function runProbe(ctx: any, directory: string, probe: HiddenProbe): Promise<readonly string[] | undefined> {
  const subprocess = ctx.get('subprocess')
  if (subprocess === undefined || typeof subprocess.spawn !== 'function') return undefined

  let handle: any
  try {
    handle = subprocess.spawn({
      argv: [...probe.argv(directory)],
      cwd: directory,
      stdio: {
        stdin: 'ignore',
        stdout: { maxBytes: PROBE_MAX_BYTES },
        stderr: { maxBytes: PROBE_STDERR_BYTES },
      },
      graceMs: PROBE_GRACE_MS,
    })
  } catch {
    // No process was created, so the platform's mark goes unread.
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
  }, PROBE_TIMEOUT_MS)

  try {
    const outcome = await handle.done
    if (typeof outcome?.exitCode !== 'number' || outcome.exitCode !== 0) return undefined
    const read = typeof readers.stdout?.readFrom === 'function' ? readers.stdout.readFrom(0) : undefined
    // A lossy read is an incomplete answer, and an incomplete answer would make
    // some hidden names read as visible; the convention alone is better than a
    // half-truth.
    if (read?.lossy === true || typeof read?.text !== 'string') return undefined
    return probe.parse(read.text, directory)
  } catch {
    return undefined
  } finally {
    clearTimeout(timer)
  }
}

/**
 * The names of one directory level that the platform itself marks hidden.
 *
 * @param ctx - the Host plugin context.
 * @param directory - the absolute directory the listing answered for.
 * @returns the hidden basenames; empty when no probe can answer.
 */
export async function platformHiddenNames(ctx: any, directory: string): Promise<ReadonlySet<string>> {
  const probes = probesFor(process.platform)
  if (probes.length === 0) return new Set()

  const names = new Set<string>()
  for (const probe of probes) {
    const reported = await runProbe(ctx, directory, probe)
    if (reported === undefined) continue
    for (const name of reported) if (name !== '') names.add(name)
  }
  return names
}
