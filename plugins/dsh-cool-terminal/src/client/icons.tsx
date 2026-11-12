/**
 * The plugin's icon seats.
 *
 * Every glyph comes from `@dsh-cool/icons`; these wrappers only add the shared
 * `.dsh-ct-svg` seat when a caller does not supply its own class, so existing
 * menu and toolbar layouts keep their 16px square.
 */

import * as React from 'react'
import {
  IconCopy as BaseCopy,
  IconEdit as BaseEdit,
  IconFolder as BaseFolder,
  IconFolderOpened as BaseFolderOpened,
  IconList as BaseList,
  IconMoreHorizontal as BaseMore,
  IconPlus as BasePlus,
  IconRefreshCw as BaseRefresh,
  IconSquareTerminal as BaseTerminal,
  IconTrash as BaseTrash,
} from '@dsh-cool/icons'

/** Props accepted by the seated icon components. */
export interface DshCtIconProps {
  /** Square edge length in px; the seat's stylesheet normally owns this. */
  size?: number
  /** Extra class for layout placement; defaults to the shared 16px seat. */
  className?: string
  /** Accessible name; omitted for the decorative default. */
  title?: string
}

/** Build one icon that defaults to the terminal's shared 16px seat. */
function seat(Icon: (props: DshCtIconProps) => React.ReactElement): (props: DshCtIconProps) => React.ReactElement {
  return function SeatedIcon(props: DshCtIconProps): React.ReactElement {
    return <Icon {...props} className={props.className ?? 'dsh-ct-svg'} />
  }
}

/** A console's leading mark. */
export const IconTerminal = seat(BaseTerminal)

/** Sidebar group marker when a Workspace is collapsed. */
export const IconFolderClosed = seat(BaseFolder)

/** Sidebar group marker when a Workspace is expanded. */
export const IconFolderOpened = seat(BaseFolderOpened)

/** Row overflow trigger glyph. */
export const IconMore = seat(BaseMore)

/** Add a console. */
export const IconPlus = seat(BasePlus)

/** Rename a console. */
export const IconEdit = seat(BaseEdit)

/** Command autostart. */
export const IconAutostart = seat(BaseRefresh)

/** Delete a console. */
export const IconTrash = seat(BaseTrash)

/** Common-commands entry. */
export const IconList = seat(BaseList)

/** Copy a command to the clipboard. */
export const IconCopy = seat(BaseCopy)
