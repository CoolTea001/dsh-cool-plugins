/**
 * The delete confirmation.
 *
 * Deleting an article removes the user's Markdown file, so the list never does it
 * on a single click: this small dialog names the article, says what will be
 * removed, and keeps the failure inside itself so a refused delete leaves the
 * card where it was. The chrome is the platform's `Modal` and `Button`, the same
 * pair the settings dialog uses.
 */

import * as React from 'react'
import { Button, Modal } from '@deepseek-ai/dsh-client-ui-primitives'

import type { Translate } from './locales.js'

/** The props the page hands the confirmation. */
export interface DeleteDialogProps {
  /** The plugin's translate seat. */
  t: Translate
  /** The article being deleted, named in the body. */
  title: string
  /** Whether the Host call is in flight. */
  busy: boolean
  /** Why the last attempt failed, if it did. */
  error: string | null
  /** Close without deleting. */
  onCancel: () => void
  /** Delete the article. */
  onConfirm: () => void
}

/**
 * Render the confirmation.
 * @param props - the article title, the busy flag, and the two actions.
 * @returns the modal dialog.
 */
export function DeleteDialog({
  t,
  title,
  busy,
  error,
  onCancel,
  onConfirm,
}: DeleteDialogProps): React.ReactElement {
  // The name is folded into the sentence rather than given a line of its own, so
  // the dialog reads as one statement about one file.
  const description = t('delete.description').replace('{name}', title)
  return (
    <Modal
      open
      onClose={() => { if (!busy) onCancel() }}
      title={t('delete.title')}
      description={description}
      closeLabel={t('delete.cancel')}
      className="dsh-cd-dialog-narrow"
      footer={(
        <>
          <Button variant="outline" data-modal-autofocus disabled={busy} onClick={onCancel}>
            {t('delete.cancel')}
          </Button>
          <Button
            variant="primary"
            className="dsh-cd-btn-danger"
            disabled={busy}
            onClick={onConfirm}
          >
            {busy ? t('delete.deleting') : t('delete.confirm')}
          </Button>
        </>
      )}
    >
      {error !== null && <p className="dsh-cd-dialog-error" role="alert">{error}</p>}
    </Modal>
  )
}
