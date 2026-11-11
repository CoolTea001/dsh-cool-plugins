/**
 * One Host answer's refusal, as the sentence a page shows.
 *
 * A coded refusal is worded here from the page's dictionary, so the same answer
 * reads in the active language; diagnostics another program wrote stay verbatim.
 * Both the native menu's dialog and the management panel render their failures
 * through this one module, which keeps the two surfaces agreeing about a
 * partial deletion's detail line and about the work named in a still-running
 * refusal.
 */

import type { DeletePayload, Failure } from '../shared/contract.js'
import type { MessageKey, Translate } from './locales.js'

/** The refusal fragment any Host answer may carry. */
type Refusal = Pick<DeletePayload, 'failure' | 'error'>

/**
 * The activity families a dictionary names, keyed by the Host's kind.
 *
 * The Host sends `turn`, `subagent`, `job` and `schedule` because those are the
 * provider identifiers it works with, not prose. Only this half knows the
 * language to read them in, so the translation happens here; a kind a future
 * build adds stays as its identifier rather than disappearing.
 */
const ACTIVITY_KEYS = {
  turn: 'activity.turn',
  subagent: 'activity.subagent',
  job: 'activity.job',
  schedule: 'activity.schedule',
} as const satisfies Record<string, MessageKey>

/**
 * Word the work a refusal names, in the active language.
 *
 * @param t - the page's translate seat.
 * @param raw - the Host's comma-separated kind list, when it named any.
 * @returns the phrase to put in the sentence's `{activity}` position.
 */
export function activityPhrase(t: Translate, raw: string | number | undefined): string {
  const kinds = typeof raw === 'string'
    ? raw.split(',').map(kind => kind.trim()).filter(kind => kind !== '')
    : []
  if (kinds.length === 0) return t('error.activityFallback')
  const words = kinds.map((kind) => {
    const key = ACTIVITY_KEYS[kind as keyof typeof ACTIVITY_KEYS]
    return key === undefined ? kind : t(key)
  })
  return words.join(t('activity.separator'))
}

/**
 * Word one coded refusal as a sentence.
 *
 * @param t - the page's translate seat.
 * @param failure - the refusal code and the values its sentence interpolates.
 * @returns the sentence to show.
 */
export function failureText(t: Translate, failure: Failure): string {
  // Only the still-running refusal carries activity kinds, and only it needs
  // them turned from identifiers into words.
  if (failure.code === 'delete-active') {
    return t('error.delete-active', {
      ...failure.params,
      activity: activityPhrase(t, failure.params?.activity),
    })
  }
  return t(`error.${failure.code}` as MessageKey, failure.params)
}

/**
 * Word one refused answer.
 *
 * @param t - the page's translate seat.
 * @param payload - the Host answer.
 * @param fallback - the entry to state when the answer carried no reason.
 * @returns the reason to show.
 */
export function reasonOf(t: Translate, payload: Refusal, fallback: MessageKey): string {
  if (payload.failure !== undefined) {
    const sentence = failureText(t, payload.failure)
    // A partial delete carries both the retryable summary and the service's own
    // reason for the item that failed; keep the detail visible after the count.
    if (payload.failure.code === 'delete-partial' && typeof payload.error === 'string' && payload.error !== '') {
      return `${sentence} ${payload.error}`
    }
    return sentence
  }
  if (payload.error === 'HTTP 405') return t('error.host-stale')
  return typeof payload.error === 'string' && payload.error !== '' ? payload.error : t(fallback)
}
