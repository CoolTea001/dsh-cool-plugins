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

import { useState, type KeyboardEvent, type ReactElement } from 'react'
import { Button, Input, Modal } from '@dsh-cool/ui'
import type { Translate } from './locales.js'

/** A name question: rename one entry, or create one. */
export interface NamePrompt {
  readonly kind: 'rename' | 'create-file' | 'create-folder'
  /**
   * The entry a rename is about, or the folder a creation goes into.
   *
   * A rename is answered with the entry's new path, which the page uses to move
   * everything that named the old one; a creation is answered with where it
   * went, and the dialog never needs to know which kind of entry either was.
   */
  readonly path: string
  /** The name the field starts with; empty for a creation. */
  readonly initial: string
}

/** A delete question. */
export interface DeletePrompt {
  readonly kind: 'delete'
  /** The entry as a workspace path. */
  readonly path: string
  /** The entry's own name, which the question repeats. */
  readonly name: string
  /** Whether the entry is a folder, which the question says out loud. */
  readonly directory: boolean
}

/** What the row menu asked the page to confirm. */
export type RowPrompt = NamePrompt | DeletePrompt

interface RowDialogProps {
  readonly prompt: RowPrompt
  /** Whether a request for the answer is in flight, which disables both actions. */
  readonly busy: boolean
  /** The Host's failure for the last answer, worded for the reader; null when there is none. */
  readonly error: string | null
  readonly onCancel: () => void
  /** Submit a name, for the two name questions. */
  readonly onSubmitName: (name: string) => void
  /** Confirm a delete. */
  readonly onConfirmDelete: () => void
  readonly t: Translate
}

/**
 * The last segment of a workspace path.
 *
 * @param path - a `/`-joined path; the root is `/`.
 * @returns the basename, or the path itself when it has no separator.
 */
function baseName(path: string): string {
  const at = path.lastIndexOf('/')
  return at === -1 ? path : path.slice(at + 1)
}

/**
 * The copy one prompt uses: its title, its description, and its confirming label.
 *
 * Every prompt has a description. The name questions use it to name their
 * subject — the entry, or the folder a creation lands in — and the delete
 * question uses it to say exactly what is going.
 *
 * @param prompt - the question being asked.
 * @param t - the page's translator.
 * @returns the strings the dialog draws from.
 */
function copyOf(prompt: RowPrompt, t: Translate): {
  readonly title: string
  readonly description: string
  readonly confirm: string
} {
  if (prompt.kind === 'delete') {
    return {
      title: prompt.directory ? t('menu.deleteFolderTitle') : t('menu.deleteFileTitle'),
      description: prompt.directory
        ? t('menu.deleteFolderDescription', { name: prompt.name })
        : t('menu.deleteFileDescription', { name: prompt.name }),
      confirm: t('menu.delete'),
    }
  }
  if (prompt.kind === 'rename') {
    return {
      title: t('menu.renameTitle'),
      description: t('menu.renameDescription', { name: baseName(prompt.path) }),
      confirm: t('menu.rename'),
    }
  }
  // A creation lands in the folder the menu was opened on, and the line names
  // it: the card covers the tree, so a wording of "this folder" would leave the
  // reader with nothing to check it against. The root has no basename of its
  // own, so it is named the way the sidebar names it.
  const folder = prompt.path === '' ? t('side.root') : baseName(prompt.path)
  if (prompt.kind === 'create-folder') {
    return {
      title: t('menu.createFolderTitle'),
      description: t('menu.createFolderDescription', { folder }),
      confirm: t('menu.createFolder'),
    }
  }
  return {
    title: t('menu.createFileTitle'),
    description: t('menu.createFileDescription', { folder }),
    confirm: t('menu.createFile'),
  }
}

/**
 * Render the dialog one row command needs.
 *
 * @param props - the question, the in-flight state, and the answers.
 * @returns the modal, or nothing when there is no question.
 */
export function RowDialog(props: RowDialogProps): ReactElement {
  const { prompt, busy, error, onCancel, onSubmitName, onConfirmDelete, t } = props
  const [name, setName] = useState(prompt.kind === 'delete' ? '' : prompt.initial)
  const copy = copyOf(prompt, t)
  const naming = prompt.kind !== 'delete'
  const trimmed = name.trim()
  const canSubmit = !busy && (!naming || trimmed !== '')

  /**
   * Commit the field's answer.
   *
   * A rename to the name it already has is not a change, so it closes rather
   * than asking the Host to move a file onto itself — which the filesystem
   * service refuses as the same target.
   */
  const submit = (): void => {
    if (!canSubmit) return
    if (prompt.kind === 'rename' && trimmed === prompt.initial) {
      onCancel()
      return
    }
    onSubmitName(trimmed)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key !== 'Enter' || event.nativeEvent.isComposing) return
    submit()
  }

  const footer = (
    <>
      <Button
        variant="outline"
        onClick={onCancel}
        disabled={busy}
        // A question with no field would otherwise leave the header's close
        // glyph holding initial focus, where Enter does nothing. Cancel is the
        // action a reader who meant to stop reaches for, and it is the safe
        // default for a destructive question.
        data-modal-autofocus={prompt.kind === 'delete' ? true : undefined}
      >
        {t('menu.cancel')}
      </Button>
      {prompt.kind === 'delete' ? (
        <Button
          variant="outline"
          className="dsh-cf-danger-button"
          onClick={onConfirmDelete}
          disabled={busy}
        >
          {busy ? t('menu.working') : copy.confirm}
        </Button>
      ) : (
        <Button variant="primary" onClick={submit} disabled={!canSubmit}>
          {busy ? t('menu.working') : copy.confirm}
        </Button>
      )}
    </>
  )

  return (
    <Modal
      open
      onClose={onCancel}
      title={copy.title}
      closeLabel={t('menu.cancel')}
      description={copy.description}
      footer={footer}
    >
      {naming ? (
        <div className="dsh-cf-prompt-field">
          <Input
            value={name}
            spellCheck={false}
            autoComplete="off"
            // The Modal layer looks for the field flagged this way rather than
            // for React's `autoFocus`, so the row that opened the dialog still
            // gets focus back when it closes.
            modalAutofocus
            // The card draws no visible label, so the title is what a screen
            // reader is given instead — it says what the field is for without a
            // second line of text above it.
            aria-label={copy.title}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={onKeyDown}
          />
        </div>
      ) : null}
      {error === null ? null : (
        <div className="dsh-cf-prompt-error" role="alert">
          {error}
        </div>
      )}
    </Modal>
  )
}
