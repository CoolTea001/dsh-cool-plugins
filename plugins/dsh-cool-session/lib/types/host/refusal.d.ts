/**
 * How one Host answer refuses, in the two forms the payloads carry.
 *
 * A refusal this plugin can name travels as a code, because the page is what
 * knows the language to word it in: `shared/contract.ts` defines the code and
 * its params, and `client/locales.ts` owns the sentences. Anything else is text
 * another program wrote — a DSH service message above all — which no dictionary
 * can own, so it travels verbatim.
 */
import type { Failure, FailureCode } from '../shared/contract.js';
/** One refusal, as an `ok: false` payload carries it. */
export type Refusal = {
    readonly failure: Failure;
} | {
    readonly error: string;
};
/**
 * One coded refusal, shaped as a payload carries it.
 *
 * @param code - the refusal, whose sentence the page owns.
 * @param params - the values that sentence interpolates, when it has any.
 * @returns the payload fragment to spread into an `ok: false` answer.
 */
export declare function coded(code: FailureCode, params?: Readonly<Record<string, string | number>>): Refusal;
//# sourceMappingURL=refusal.d.ts.map