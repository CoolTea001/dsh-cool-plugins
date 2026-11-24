/**
 * Client half of the package-private bridge to the Host routes.
 *
 * Every route answers JSON and never rejects: a transport failure becomes an
 * `{ ok: false }` result the page draws in its own error state, so the page has
 * exactly one failure shape no matter how the answer went wrong.
 */
import type { ListPayload, MutationPayload, ReadPayload, RevealPayload, SavePayload, TextPayload } from '../shared/contract.js';
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
/**
 * Ask the Host for one workspace file's complete raw text, for the editor.
 *
 * @param sessionId - the session whose workspace is browsed, when known.
 * @param path - the file as a workspace path.
 * @param purpose - copying does not impose the editor's smaller document cap.
 * @returns the text payload, with the freshness token a save must quote.
 */
export declare function fetchText(sessionId: string | undefined, path: string, purpose?: 'edit' | 'copy'): Promise<TextPayload>;
/**
 * Ask the Host to replace one workspace file with the editor's content.
 *
 * @param sessionId - the session whose workspace is browsed, when known.
 * @param path - the file as a workspace path.
 * @param text - the complete new content.
 * @param version - the freshness token the read returned, so a stale save is refused.
 * @returns the save payload.
 */
export declare function saveFile(sessionId: string | undefined, path: string, text: string, version: string | undefined): Promise<SavePayload>;
/**
 * Rename one entry in place.
 *
 * @param sessionId - the session whose workspace holds it, when known.
 * @param path - the entry as a workspace path.
 * @param name - the new name, as one path segment.
 * @returns the new workspace path, or an `ok: false` answer.
 */
export declare function renameEntry(sessionId: string | undefined, path: string, name: string): Promise<MutationPayload>;
/**
 * Create one new file or directory under an existing directory.
 *
 * @param sessionId - the session whose workspace holds it, when known.
 * @param path - the parent directory as a workspace path; empty for the root.
 * @param name - the new entry's name, as one path segment.
 * @param kind - which kind of entry to create.
 * @returns the new workspace path, or an `ok: false` answer.
 */
export declare function createEntry(sessionId: string | undefined, path: string, name: string, kind: 'file' | 'directory'): Promise<MutationPayload>;
/**
 * Delete one file or directory.
 *
 * @param sessionId - the session whose workspace holds it, when known.
 * @param path - the entry as a workspace path.
 * @returns the removed path, or an `ok: false` answer.
 */
export declare function deleteEntry(sessionId: string | undefined, path: string): Promise<MutationPayload>;
/**
 * Show one entry in the Host desktop's file manager.
 *
 * @param sessionId - the session whose workspace holds it, when known.
 * @param path - the entry as a workspace path.
 * @returns the reveal outcome, or an `ok: false` answer.
 */
export declare function revealEntry(sessionId: string | undefined, path: string): Promise<RevealPayload>;
//# sourceMappingURL=api.d.ts.map