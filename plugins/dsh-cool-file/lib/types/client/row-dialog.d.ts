/**
 * The three questions the row menu asks before it changes anything.
 *
 * Rename and the two creations are the same dialog with different copy: one
 * descriptive line, then one field, pre-filled for a rename and empty for a
 * creation, committed on Enter. The line names the subject — the entry being
 * renamed, or the folder a creation lands in — because the card covers the tree
 * the reader right-clicked, so "this item" would have nothing left to point at.
 * It also gives the card the same rhythm every other shell dialog has: a title,
 * a line under it, then the body. The field itself carries no visible label; the
 * line above already says what it wants, and the title is its accessible name.
 *
 * Delete is the other shape — no field, a sentence naming exactly what is about
 * to go, and a confirming action drawn in the error colour, because deleting a
 * folder takes everything under it.
 *
 * All three are the shell's own `Modal`, which owns the portal, the mask, the
 * focus trap, Escape and returning focus to the row that opened it. This module
 * decides only what the dialog says and what the two actions do. The draft is
 * local to the component, which is mounted fresh for every opening, so typing a
 * name re-renders the dialog and nothing else.
 */
import { type ReactElement } from 'react';
import type { Translate } from './locales.js';
/** A name question: rename one entry, or create one. */
export interface NamePrompt {
    readonly kind: 'rename' | 'create-file' | 'create-folder';
    /**
     * The entry a rename is about, or the folder a creation goes into.
     *
     * A rename is answered with the entry's new path, which the page uses to move
     * everything that named the old one; a creation is answered with where it
     * went, and the dialog never needs to know which kind of entry either was.
     */
    readonly path: string;
    /** The name the field starts with; empty for a creation. */
    readonly initial: string;
}
/** A delete question. */
export interface DeletePrompt {
    readonly kind: 'delete';
    /** The entry as a workspace path. */
    readonly path: string;
    /** The entry's own name, which the question repeats. */
    readonly name: string;
    /** Whether the entry is a folder, which the question says out loud. */
    readonly directory: boolean;
}
/** What the row menu asked the page to confirm. */
export type RowPrompt = NamePrompt | DeletePrompt;
interface RowDialogProps {
    readonly prompt: RowPrompt;
    /** Whether a request for the answer is in flight, which disables both actions. */
    readonly busy: boolean;
    /** The Host's failure for the last answer, worded for the reader; null when there is none. */
    readonly error: string | null;
    readonly onCancel: () => void;
    /** Submit a name, for the two name questions. */
    readonly onSubmitName: (name: string) => void;
    /** Confirm a delete. */
    readonly onConfirmDelete: () => void;
    readonly t: Translate;
}
/**
 * Render the dialog one row command needs.
 *
 * @param props - the question, the in-flight state, and the answers.
 * @returns the modal, or nothing when there is no question.
 */
export declare function RowDialog(props: RowDialogProps): ReactElement;
export {};
//# sourceMappingURL=row-dialog.d.ts.map