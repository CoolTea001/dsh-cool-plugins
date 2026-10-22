/**
 * Client half of the package-private bridge to the Host routes.
 *
 * Every route answers JSON and never rejects: a transport failure becomes an
 * `{ ok: false }` result the dialog reports in place, so the page has exactly
 * one failure shape to render no matter how the answer went wrong.
 */
import type { DeletePayload } from '../shared/contract.js';
/**
 * Ask the Host to delete one Session and every subagent Session beneath it.
 *
 * The Host stops running work first, then removes the artifacts. This is the
 * only call in this wrapper, and it destroys data.
 *
 * @param sessionId - the root Session to delete.
 * @returns the deletion summary, or a coded refusal.
 */
export declare function deleteSession(sessionId: string): Promise<DeletePayload>;
//# sourceMappingURL=api.d.ts.map