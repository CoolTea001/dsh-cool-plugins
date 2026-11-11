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
import type { DeletePayload, Failure } from '../shared/contract.js';
import type { MessageKey, Translate } from './locales.js';
/** The refusal fragment any Host answer may carry. */
type Refusal = Pick<DeletePayload, 'failure' | 'error'>;
/**
 * Word the work a refusal names, in the active language.
 *
 * @param t - the page's translate seat.
 * @param raw - the Host's comma-separated kind list, when it named any.
 * @returns the phrase to put in the sentence's `{activity}` position.
 */
export declare function activityPhrase(t: Translate, raw: string | number | undefined): string;
/**
 * Word one coded refusal as a sentence.
 *
 * @param t - the page's translate seat.
 * @param failure - the refusal code and the values its sentence interpolates.
 * @returns the sentence to show.
 */
export declare function failureText(t: Translate, failure: Failure): string;
/**
 * Word one refused answer.
 *
 * @param t - the page's translate seat.
 * @param payload - the Host answer.
 * @param fallback - the entry to state when the answer carried no reason.
 * @returns the reason to show.
 */
export declare function reasonOf(t: Translate, payload: Refusal, fallback: MessageKey): string;
export {};
//# sourceMappingURL=reason.d.ts.map