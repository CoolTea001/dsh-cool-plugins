/**
 * The native Session menu's delete row and its confirmation overlay.
 *
 * The row is contributed to `sidebar.workspaces.session.menu.item`, after the
 * shipped Copy Session ID row (450). Menus unmount as soon as they close, so the
 * row only records a request; the frame-wide `shell.overlay` entry owns the
 * dialog's state and the Host call. That split is also what lets the dialog
 * survive the menu's portal disappearing on click.
 *
 * Deletion is permanent, so the confirmation is the only path: it asks before
 * the Host stops running work and removes the artifacts, and disables itself
 * while that happens.
 */

import { useEffect, useState, useSyncExternalStore, type ReactElement } from 'react'
import { Button, IconTrashOutlineRegular, MenuItemButton, Modal } from '@deepseek-ai/dsh-client-ui-primitives'
import { deleteSession } from './api.js'
import { reasonOf } from './reason.js'
import type { Translate } from './locales.js'

/** One pending delete, raised by the menu row and consumed by the overlay. */
interface DeleteRequest {
  readonly sessionId: string
}

let pendingDelete: DeleteRequest | null = null
const deleteListeners = new Set<() => void>()

function emitDelete(): void {
  for (const listener of [...deleteListeners]) listener()
}

function subscribeDelete(listener: () => void): () => void {
  deleteListeners.add(listener)
  return () => {
    deleteListeners.delete(listener)
  }
}

function deleteSnapshot(): DeleteRequest | null {
  return pendingDelete
}

/**
 * Open the delete confirmation for one Session.
 *
 * @param sessionId - the Session the menu row belongs to.
 */
export function requestDeleteSession(sessionId: string): void {
  pendingDelete = { sessionId }
  emitDelete()
}

/** Dismiss the confirmation without deleting. */
export function clearDeleteRequest(): void {
  if (pendingDelete === null) return
  pendingDelete = null
  emitDelete()
}

/** The menu row's owner share and the slot's menu-open hook. */
interface DeleteMenuItemProps {
  readonly sessionId: string
  readonly useMenuOpenState: () => readonly [boolean, (open: boolean) => void]
  readonly t: Translate
}

/**
 * The delete row, placed after Copy Session ID and separated from the shipped
 * group. Selecting it closes the menu and raises the confirmation overlay.
 *
 * @param props - the row identity, menu hook, and locale seat.
 * @returns the menu row.
 */
export function SessionDeleteMenuItem({
  sessionId,
  useMenuOpenState,
  t,
}: DeleteMenuItemProps): ReactElement {
  const [, setMenuOpen] = useMenuOpenState()
  return (
    <MenuItemButton
      separatorBefore
      icon={<span className="dsh-cs-menu-delete-icon"><IconTrashOutlineRegular /></span>}
      onSelect={() => {
        setMenuOpen(false)
        requestDeleteSession(sessionId)
      }}
    >
      <span className="dsh-cs-menu-delete-label">{t('action.delete')}</span>
    </MenuItemButton>
  )
}

/** The dialog's injected callback, supplied by the client entry. */
interface DeleteDialogProps {
  readonly t: Translate
  /** Called after a successful deletion so the shell can clear its main view. */
  readonly onDeleted?: (sessionId: string) => void
}

/**
 * The frame-wide confirmation entry, drawn with DSH's own `Modal` primitive so
 * its chrome, blurred mask, focus trap, and Escape handling match the rest of
 * the product instead of being re-implemented here.
 *
 * @param props - the locale seat and the post-delete callback.
 * @returns the dialog, or null while no delete is pending.
 */
export function SessionDeleteDialog({ t, onDeleted }: DeleteDialogProps): ReactElement | null {
  const request = useSyncExternalStore(subscribeDelete, deleteSnapshot, deleteSnapshot)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | undefined>(undefined)

  // A new request starts a new attempt: the refusal and pending state belong to
  // the Session that was named before.
  useEffect(() => {
    if (request === null) return
    setBusy(false)
    setError(undefined)
  }, [request])

  const close = (): void => {
    if (!busy) clearDeleteRequest()
  }

  const confirm = async (): Promise<void> => {
    if (busy || request === null) return
    setBusy(true)
    setError(undefined)
    const payload = await deleteSession(request.sessionId)
    if (payload.ok !== true) {
      setError(reasonOf(t, payload, 'error.delete-failed'))
      setBusy(false)
      // A partial delete may already have removed descendants; refresh the
      // shell's Session lists so those rows do not linger behind the error.
      if ((payload.deletedSessions?.length ?? 0) > 0) onDeleted?.(request.sessionId)
      return
    }
    if (payload.warnings !== undefined && payload.warnings.length > 0) {
      console.warn('[dsh-cool-session] delete cleanup warnings:', payload.warnings)
    }
    clearDeleteRequest()
    onDeleted?.(request.sessionId)
  }

  return (
    <Modal
      open={request !== null}
      onClose={close}
      title={t('delete.title')}
      description={t('delete.description')}
      closeLabel={t('action.close')}
      footer={(
        <>
          {/* Initial focus belongs on the safe action, which is why the cancel
              button carries the primitive's autofocus marker. */}
          <Button variant="outline" data-modal-autofocus disabled={busy} onClick={close}>
            {t('action.cancel')}
          </Button>
          <Button
            variant="outline"
            className="dsh-cs-delete-action"
            disabled={busy}
            onClick={() => { void confirm() }}
          >
            {busy ? t('delete.pending') : t('delete.confirm')}
          </Button>
        </>
      )}
    >
      {/* `undefined` keeps the primitive from drawing its empty body region;
          a refusal needs that region for the reason. */}
      {error === undefined ? undefined : <div className="dsh-cs-delete-error" role="alert">{error}</div>}
    </Modal>
  )
}
