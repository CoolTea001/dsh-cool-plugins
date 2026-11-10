/** Input and timing for a command injected into a freshly spawned shell. */

/** Upper bound on a console's startup command, in UTF-16 code units. */
const MAX_STARTUP_CHARS = 4_096

/** Quiet period before typing when the line editor never announces itself. */
const STARTUP_SETTLE_MS = 800

/** A short prompt-printing grace after the line editor's ready marker. */
const STARTUP_READY_SETTLE_MS = 120

/** Fallback for a shell that prints nothing before waiting for input. */
const STARTUP_DEADLINE_MS = 5_000

/** Bracketed-paste-on, printed when zsh's zle or bash's readline starts. */
const STARTUP_READY_MARKER = Buffer.from('\x1b[?2004h')

/** Normalize a persisted command and cap the input one request may queue. */
export function normalizeStartupCommand(value: unknown): string {
  if (typeof value !== 'string') return ''
  return value.replace(/\r\n?/g, '\n').trim().slice(0, MAX_STARTUP_CHARS)
}

/** The output-listener subset of the subprocess terminal primitive. */
export interface StartupOutput {
  on(event: 'data', listener: (chunk: unknown) => void): unknown
  removeListener?(event: 'data', listener: (chunk: unknown) => void): unknown
}

type Timer = ReturnType<typeof setTimeout>

/**
 * Wait for shell readiness, inject once, and release every owned resource.
 *
 * Writing immediately after spawn races shell startup: zsh and bash install
 * their line editors only after their startup files run, and earlier input may
 * be echoed above the prompt or flushed. Their bracketed-paste marker allows a
 * short grace; other shells use a longer output silence. A deadline covers a
 * shell that emits nothing. Both timers are unref'd.
 */
export class StartupCommand {
  private quiet: Timer | undefined
  private deadline: Timer | undefined
  private listener: ((chunk: unknown) => void) | undefined
  private finished = false
  private ready = false
  /** A short suffix lets a marker split across output chunks still match. */
  private tail = Buffer.alloc(0)

  constructor(
    private readonly output: StartupOutput | undefined,
    private readonly command: string,
    private readonly write: (command: string) => void,
  ) {}

  /** Begin waiting; the caller invokes `cancel` when the shell ends. */
  start(): void {
    this.listener = (chunk: unknown): void => {
      if (this.finished) return
      const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as Uint8Array)
      const joined = Buffer.concat([this.tail, bytes])
      if (!this.ready && joined.includes(STARTUP_READY_MARKER)) this.ready = true
      this.tail = joined.subarray(Math.max(0, joined.length - 16))
      this.settle(this.ready ? STARTUP_READY_SETTLE_MS : STARTUP_SETTLE_MS)
    }
    this.output?.on('data', this.listener)
    this.deadline = setTimeout(() => this.fire(), STARTUP_DEADLINE_MS)
    this.deadline.unref?.()
  }

  /** Stop waiting without injecting, e.g. when the shell exits or is deleted. */
  cancel(): void {
    this.finish()
  }

  private settle(delay: number): void {
    if (this.quiet !== undefined) clearTimeout(this.quiet)
    this.quiet = setTimeout(() => this.fire(), delay)
    this.quiet.unref?.()
  }

  private fire(): void {
    if (this.finished) return
    this.finish()
    this.write(this.command)
  }

  private finish(): void {
    if (this.finished) return
    this.finished = true
    if (this.quiet !== undefined) clearTimeout(this.quiet)
    if (this.deadline !== undefined) clearTimeout(this.deadline)
    this.quiet = undefined
    this.deadline = undefined
    if (this.listener !== undefined) this.output?.removeListener?.('data', this.listener)
    this.listener = undefined
    this.tail = Buffer.alloc(0)
  }
}
