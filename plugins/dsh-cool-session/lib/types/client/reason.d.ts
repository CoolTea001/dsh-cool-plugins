/**
 * One Host answer's refusal, as the sentence a page shows.
 *
 * A coded refusal is worded here from the page's dictionary, so the same answer
 * reads in the active language; diagnostics another program wrote stay verbatim.
 * Both the native menu's dialog and the management panel render their failures
 * through this one function, which keeps the two surfaces agreeing about a
 * partial deletion's detail line.
 */
import type { DeletePayload } from '../shared/contract.js';
import type { MessageKey, Translate } from './locales.js';
/** The refusal fragment any Host answer may carry. */
type Refusal = Pick<DeletePayload, 'failure' | 'error'>;
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