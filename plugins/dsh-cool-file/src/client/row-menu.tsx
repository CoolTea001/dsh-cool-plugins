/**
 * The tree's row menu — what a right-click on a file or folder offers.
 *
 * The menu is one list for both kinds of row, with the rows that only apply to
 * a folder left out where the target is a file: a file has no children, so
 * "New file" and "New folder" there would create into its parent while looking
 * like they belonged to it. The order is the order of use — rename first, since
 * that is what a right-click on a tree row is almost always for — then the two
 * creations, then the one command that leaves the browser, then the one that
 * destroys.
 *
 * Two facts decide what is drawn enabled, and both come from the Host rather
 * than being guessed here. `writable` is the session's own sandbox policy: a
 * read-only session lists its workspace and refuses every change. `reveal` is
 * whether the serving Host has a desktop file manager that can be handed a path
 * at all. A command that cannot succeed is drawn disabled rather than offered
 * and then failed, and its label says what the gesture means on this platform.
 *
 * The menu is the shell's `Menu` in its contextual mode: it opens at the
 * pointer, is portaled so the tree's own scrollport cannot crop it, keeps the
 * keyboard walk and Escape, and hands focus back to the row it was opened on.
 */

import { useRef, type ReactNode } from 'react'
import { IconEdit, IconFilePlus, IconFolder, IconFolderPlus, IconTrash } from '@dsh-cool/icons'
import { Menu, type MenuEntry } from '@dsh-cool/ui'
import type { Translate } from './locales.js'
import type { FileEntryType } from '../shared/contract.js'

/** Everything one right-click captured, so an open menu keeps its subject. */
export interface RowTarget {
  /** The entry's workspace path. */
  readonly path: string
  /** What the entry is, which decides whether the two creations are offered. */
  readonly type: FileEntryType
  /** Where the pointer was, in client coordinates. */
  readonly x: number
  /** Where the pointer was, in client coordinates. */
  readonly y: number
  /** The row element, which takes focus back when the menu closes. */
  readonly element: HTMLElement | null
  /**
   * Whether this is the workspace root rather than a row inside it.
   *
   * The root is a directory like any other for the two creations and for the
   * reveal, but it is not an entry the tree can rename or delete: renaming it
   * would move the workspace out from under the session, and deleting it would
   * take the workspace with it. Those two rows are therefore left out.
   */
  readonly root?: boolean
}

/** The commands the menu can run. */
export type RowCommand = 'rename' | 'create-file' | 'create-folder' | 'reveal' | 'delete'

interface RowMenuProps {
  /** The row the menu is open on; null while it is closed. */
  readonly target: RowTarget | null
  /** Whether the session's policy allows changes to this workspace. */
  readonly writable: boolean
  /** Whether this Host can show a path in a desktop file manager. */
  readonly reveal: boolean
  /** Which file manager that would be, when it said. */
  readonly fileManager: 'finder' | 'explorer' | 'directory' | undefined
  readonly onClose: () => void
  /** Run one command against the row the menu is open on, which closes it. */
  readonly onCommand: (command: RowCommand, target: RowTarget) => void
  readonly t: Translate
}

/**
 * The label for the reveal row on this platform.
 *
 * Finder and File Explorer are named because that is what the reader calls the
 * thing that will open; every other desktop keeps the generic phrasing, because
 * the shell's own file manager has no name this page can promise.
 *
 * @param t - the page's translator.
 * @param fileManager - the manager the Host reported, when it reported one.
 * @returns the row's label.
 */
function revealLabel(
  t: Translate,
  fileManager: RowMenuProps['fileManager'],
  available: boolean,
): string {
  if (!available) return t('menu.reveal')
  if (fileManager === 'finder') return t('menu.revealFinder')
  if (fileManager === 'explorer') return t('menu.revealExplorer')
  return t('menu.reveal')
}

/**
 * Render the row menu for the row a right-click captured.
 *
 * @param props - the captured target, the two capability facts, and the commands.
 * @returns the anchored contextual menu.
 */
export function RowMenu(props: RowMenuProps): ReactNode {
  const { target, writable, fileManager, reveal, onClose, onCommand, t } = props
  const isDirectory = target?.type === 'directory'
  /**
   * The row the menu last opened on.
   *
   * A ref rather than the `target` prop, because closing the menu clears that
   * prop first: the primitive asks for the focus target after the close, and a
   * closure over a cleared target would hand it nothing.
   */
  const opener = useRef<HTMLElement | null>(null)
  if (target !== null) opener.current = target.element

  // A restricted session says why before the reader picks a greyed row: the
  // menu's own heading row states the policy, and the rows below it stay in
  // place so the list does not change shape between sessions.
  const blocked: MenuEntry[] = writable ? [] : [{ type: 'label', id: 'read-only', text: t('menu.readOnly') }]

  const items: MenuEntry[] = target === null
    ? []
    : [
        ...blocked,
        ...(target.root === true
          ? []
          : ([
              {
                id: 'rename',
                label: t('menu.rename'),
                icon: <IconEdit size={14} />,
                disabled: !writable || target.type === 'other',
              },
            ] satisfies MenuEntry[])),
        ...(isDirectory
          ? ([
              { type: 'separator', id: 'create-separator' },
              {
                id: 'create-file',
                label: t('menu.createFile'),
                icon: <IconFilePlus size={14} />,
                disabled: !writable,
              },
              {
                id: 'create-folder',
                label: t('menu.createFolder'),
                icon: <IconFolderPlus size={14} />,
                disabled: !writable,
              },
            ] satisfies MenuEntry[])
          : []),
        { type: 'separator', id: 'reveal-separator' },
        {
          id: 'reveal',
          label: revealLabel(t, fileManager, reveal),
          icon: <IconFolder size={14} />,
          // Never disabled: whether a path can be shown is the Host's answer, and
          // its refusal arrives as a sentence in the banner. A greyed row would
          // state the same fact without saying why or what would change it.
          disabled: false,
        },
        ...(target.root === true
          ? []
          : ([
              { type: 'separator', id: 'delete-separator' },
              {
                id: 'delete',
                label: t('menu.delete'),
                icon: <IconTrash size={14} />,
                danger: true,
                disabled: !writable || target.type === 'other',
              },
            ] satisfies MenuEntry[])),
      ]

  return (
    <Menu
      open={target !== null}
      contextual
      autoFocus
      portal
      anchor={null}
      // The captured row, not this plugin's root: a menu opened on a row must
      // hand the keyboard back to that row, and the row is what the reader's
      // next keystroke is meant for.
      returnFocus={() => opener.current}
      {...(target === null ? {} : { anchorPoint: { x: target.x, y: target.y } })}
      items={items}
      onSelect={(id) => {
        if (target === null) return
        onCommand(id as RowCommand, target)
        onClose()
      }}
      onClose={onClose}
    />
  )
}
