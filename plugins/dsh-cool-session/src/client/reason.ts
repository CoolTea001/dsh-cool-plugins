/**
 * One Host answer's refusal, as the sentence a page shows.
 *
 * A coded refusal is worded here from the page's dictionary, so the same answer
 * reads in the active language; diagnostics another program wrote stay verbatim.
 * Both the native menu's dialog and the management panel render their failures
 * through this one function, which keeps the two surfaces agreeing about a
 * partial deletion's detail line.
 */

import type { DeletePayload } from '../shared/contract.js'
import type { MessageKey, Translate } from './locales.js'

/** The refusal fragment any Host answer may carry. */
type Refusal = Pick<DeletePayload, 'failure' | 'error'>

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
    const sentence = t(`error.${payload.failure.code}` as MessageKey, payload.failure.params)
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
