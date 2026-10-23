/**
 * Client half of the package-private bridge to the Host routes.
 *
 * Every route answers JSON and never rejects: a transport failure becomes an
 * `{ ok: false }` result the page draws in its own error state, so the page has
 * exactly one failure shape no matter how the answer went wrong.
 */
import type { ListPayload, ReadPayload } from '../shared/contract.js';
/**
 * Ask the Host for one workspace directory's direct children.
 *
 * @param sessionId - the session whose workspace is browsed, when known.
 * @param path - the directory as a workspace path; empty for the root.
 * @returns the listing payload.
 */
export declare function fetchListing(sessionId: string | undefined, path: string): Promise<ListPayload>;
/**
 * Ask the Host for one page of one workspace text file.
 *
 * @param sessionId - the session whose workspace is browsed, when known.
 * @param path - the file as a workspace path.
 * @returns the read payload.
 */
export declare function fetchFile(sessionId: string | undefined, path: string): Promise<ReadPayload>;
//# sourceMappingURL=api.d.ts.map