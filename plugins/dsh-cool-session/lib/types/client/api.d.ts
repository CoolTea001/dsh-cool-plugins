/**
 * Client half of the package-private bridge to the Host routes.
 *
 * Every route answers JSON and never rejects: a transport failure becomes an
 * `{ ok: false }` result the dialog reports in place, so the page has exactly
 * one failure shape to render no matter how the answer went wrong.
 */
import type { DeleteManyPayload, DeletePayload } from '../shared/contract.js';
/**
 * Ask the Host to delete one Session and every subagent Session beneath it.
 *
 * The Host stops running work first, then removes the artifacts.
 *
 * @param sessionId - the root Session to delete.
 * @returns the deletion summary, or a coded refusal.
 */
export declare function deleteSession(sessionId: string): Promise<DeletePayload>;
/**
 * Ask the Host to delete several Sessions.
 *
 * The Host runs the same stop-then-remove sequence as {@link deleteSession} for
 * each id, sequentially, and answers one result per id. When this Host half does
 * not serve the batch route yet, the same work is done through the single route
 * so the panel keeps working across a live plugin upgrade and a later restart.
 *
 * @param sessionIds - the root Sessions to delete, in request order.
 * @returns the per-session summaries, or a request-level refusal.
 */
export declare function deleteSessions(sessionIds: readonly string[]): Promise<DeleteManyPayload>;
//# sourceMappingURL=api.d.ts.map