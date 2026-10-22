/**
 * The wire contract both halves of dsh-cool-session agree on.
 *
 * The browser half never sees the Host Cordis context, so the one destructive
 * command crosses a same-origin HTTP route as JSON shaped by the types below.
 * Nothing here touches Node or the DOM, so the module is bundled into both
 * halves unchanged.
 *
 * Every answer carries `ok`: an `ok: false` result is a normal answer the dialog
 * reports in place, never a rejected promise. The one exception is a transport
 * failure, which the fetch wrapper turns into the same shape.
 *
 * An `ok: false` answer says why in one of two ways. `failure` is a code plus the
 * values its sentence interpolates: only the browser knows the language to name
 * it in, so the page words it from its own dictionaries. `error` is raw diagnostic
 * text from another program, which no dictionary can own.
 */

/**
 * Every refusal this plugin can name, as a code rather than a sentence.
 *
 * The page renders each one from its own dictionary, so the same refusal reads
 * in whatever language the browser is set to. The sentences live in
 * `client/locales.ts` keyed `error.<code>`.
 */
export type FailureCode =
  // The request's own guards.
  | 'missing-session'
  // Resolving the Session to remove.
  | 'unknown-session'
  | 'subagent-delete'
  // Stopping, retiring, and removing the artifacts.
  | 'delete-failed'
  | 'delete-unsupported'
  | 'delete-active'
  | 'session-live'
  | 'delete-partial'

/** One coded refusal, with the values its sentence interpolates. */
export interface Failure {
  /** The refusal, whose sentence is the page's `error.<code>` entry. */
  readonly code: FailureCode
  /** Values for the sentence's `{name}` placeholders. */
  readonly params?: Readonly<Record<string, string | number>>
}

/** `POST /delete-many`: remove several Sessions in one request, in order. */
export interface DeleteManyPayload {
  readonly ok: boolean
  /**
   * Raw refusal when a batch request could not be carried out. Results from
   * batches that finished before it are still present.
   */
  readonly error?: string
  /** One answer per attempted Session, in request order. */
  readonly results?: readonly DeletePayload[]
}

/** `POST /delete`: remove one Session and every subagent Session beneath it. */
export interface DeletePayload {
  readonly ok: boolean
  readonly error?: string
  readonly failure?: Failure
  readonly sessionId?: string
  /** Every Session whose artifact was removed, descendants first. */
  readonly deletedSessions?: readonly string[]
  /** The subagent Sessions included in {@link deletedSessions}. */
  readonly deletedSubagents?: readonly string[]
  /** Sessions still present after a partial deletion. */
  readonly remainingSessions?: readonly string[]
  /** Whether at least one on-disk Session directory was removed. */
  readonly filesRemoved?: boolean
  /** Cleanup that failed after the artifacts were already removed. */
  readonly warnings?: readonly string[]
}
