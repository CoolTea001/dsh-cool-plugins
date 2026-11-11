/**
 * The wire contract both halves of dsh-cool-file agree on.
 *
 * The browser half never sees the Host Cordis context, so every fact about the
 * workspace crosses the same-origin HTTP routes as JSON shaped by the types
 * below. The Host half reads the composed filesystem through the
 * `workspaceFiles` service and the browser half renders what it answered;
 * nothing here touches Node or the DOM, so the module is bundled into both
 * halves unchanged.
 *
 * Every answer carries `ok`: an `ok: false` result is a normal answer the page
 * draws in its own error state, never a rejected promise. Paths are
 * workspace-relative and `/`-joined everywhere; the absolute workspace root is
 * carried separately so the page can name it without guessing.
 */
/** What one directory entry is, as the listing reports it. */
export type FileEntryType = 'file' | 'directory' | 'other';
/** One direct child of a listed workspace directory. */
export interface FileEntry {
    /** Basename inside the listed directory. */
    readonly name: string;
    /** What the child resolves to. */
    readonly type: FileEntryType;
    /** Byte size, present only for a regular file whose backend reports it. */
    readonly size?: number;
}
/** `POST /list`: the direct children of one workspace directory. */
export interface ListPayload {
    readonly ok: boolean;
    /** Raw diagnostic text, when the answer failed. */
    readonly error?: string;
    /** The listed directory as a workspace path, empty for the root. */
    readonly path?: string;
    /** Absolute path of the session's workspace root. */
    readonly root?: string;
    /**
     * The workspace's display name: its registry title when the Host can read
     * one, else the root directory's basename. The sidebar's breadcrumb starts
     * here rather than with a generic word, so the page names the project the
     * session actually lives in.
     */
    readonly workspace?: string;
    readonly entries?: readonly FileEntry[];
    /** The Host's entry cap dropped children from `entries`. */
    readonly truncated?: boolean;
}
/** `POST /read`: one page of one workspace text file. */
export interface ReadPayload {
    readonly ok: boolean;
    /** Raw diagnostic text, when the answer failed. */
    readonly error?: string;
    /** The file's workspace path. */
    readonly path?: string;
    /** The page's lines joined by `\n`, without a terminator after the last one. */
    readonly text?: string;
    /** How many lines the page holds; `0` when the page lies past the file's last line. */
    readonly lines?: number;
    /** Whether the page includes the file's last line. */
    readonly eof?: boolean;
    /** Byte size of the complete file, when the backend reports it. */
    readonly bytes?: number;
}
//# sourceMappingURL=contract.d.ts.map