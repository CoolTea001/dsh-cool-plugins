/**
 * The reader preferences and the two More menus: the file header's and the
 * workspace tree's.
 *
 * Preview/editor and wrap/no-wrap are two independent choices, so each selected
 * row carries the shell's check. The header's menu replaces a pair of icon
 * buttons that a 36px bar could not grow beside; the sidebar's does the same for
 * Refresh and the hidden-entries eye, and its one check marks the eye as on.
 *
 * Both menus draw through the shell's `Menu`, which owns the anchored card, the
 * keyboard walk, Escape, and focus return. Neither passes `compact`: the default
 * row metrics are what the rest of this page's menus use.
 */

import { useState, type ReactNode } from 'react'
import { IconCheck, IconMoreHorizontal } from '@dsh-cool/icons'
import { Menu, type MenuEntry } from '@dsh-cool/ui'
import type { Translate } from './locales.js'

/** What the page does with the open file. */
export type FilesMode = 'preview' | 'editor'

/** Where the page remembers the reading preferences. */
const MODE_KEY = 'dsh-cool-file.mode.v1'
const WRAP_KEY = 'dsh-cool-file.wrap.v1'

/** Read the saved mode, defaulting to the non-mutating preview. */
export function readMode(): FilesMode {
  try {
    return window.localStorage.getItem(MODE_KEY) === 'editor' ? 'editor' : 'preview'
  } catch {
    return 'preview'
  }
}

/** Remember the reader's preview/editor preference. */
export function writeMode(mode: FilesMode): void {
  try {
    window.localStorage.setItem(MODE_KEY, mode)
  } catch {
    /* Storage may be unavailable; the state still lasts for this mount. */
  }
}

/** Read whether long source lines wrap, which they do by default. */
export function readWrap(): boolean {
  try {
    return window.localStorage.getItem(WRAP_KEY) !== 'off'
  } catch {
    return true
  }
}

/** Remember whether long source lines wrap. */
export function writeWrap(wrap: boolean): void {
  try {
    window.localStorage.setItem(WRAP_KEY, wrap ? 'on' : 'off')
  } catch {
    /* Storage may be unavailable; the state still lasts for this mount. */
  }
}

/**
 * The More trigger both menus draw.
 *
 * One button rather than two copies, so the header and the sidebar cannot drift
 * apart in size, hover, or the copied-state glyph. The parent owns the open flag
 * and the click, because a menu's anchor is rendered in place by `Menu`.
 */
function MoreTrigger(props: {
  readonly open: boolean
  readonly label: string
  readonly copied?: boolean
  readonly disabled?: boolean
  readonly onClick: () => void
}): ReactNode {
  const { open, label, copied = false, disabled = false, onClick } = props
  return (
    <button
      type="button"
      className="dsh-cf-icon-btn dsh-cf-mode-trigger"
      aria-label={label}
      title={label}
      aria-haspopup="menu"
      aria-expanded={open}
      disabled={disabled}
      onClick={onClick}
    >
      {copied ? <IconCheck size={16} /> : <IconMoreHorizontal size={16} />}
    </button>
  )
}

interface FileMenuProps {
  readonly mode: FilesMode
  readonly editable: boolean
  readonly wrap: boolean
  readonly canCopy: boolean
  readonly canWrap: boolean
  readonly copied: boolean
  readonly onSelectMode: (mode: FilesMode) => void
  readonly onSelectWrap: (wrap: boolean) => void
  readonly onCopy: () => void
  readonly t: Translate
}

/** The header's More menu: how the pane draws the file, and copying it. */
export function FileMenu(props: FileMenuProps): ReactNode {
  const { mode, editable, wrap, canCopy, canWrap, copied, onSelectMode, onSelectWrap, onCopy, t } = props
  const [open, setOpen] = useState(false)
  const items: readonly MenuEntry[] = [
    { id: 'mode-preview', label: t('mode.previewMode') },
    { id: 'mode-editor', label: t('mode.editorMode'), disabled: !editable },
    { type: 'separator', id: 'wrap-separator' },
    { id: 'wrap-on', label: t('wrap.on'), disabled: !canWrap },
    { id: 'wrap-off', label: t('wrap.off'), disabled: !canWrap },
    { type: 'separator', id: 'copy-separator' },
    { id: 'copy', label: copied ? t('action.copied') : t('action.copy'), disabled: !canCopy },
  ]
  const selectedIds = [mode === 'editor' ? 'mode-editor' : 'mode-preview', wrap ? 'wrap-on' : 'wrap-off']

  return (
    <Menu
      open={open}
      className="dsh-cf-mode"
      anchor={(
        <MoreTrigger
          open={open}
          label={copied ? t('action.copied') : t('action.more')}
          copied={copied}
          onClick={() => setOpen(value => !value)}
        />
      )}
      items={items}
      selectedIds={selectedIds}
      onSelect={(id) => {
        setOpen(false)
        if (id === 'mode-preview' || id === 'mode-editor') onSelectMode(id === 'mode-editor' ? 'editor' : 'preview')
        else if (id === 'wrap-on' || id === 'wrap-off') onSelectWrap(id === 'wrap-on')
        else if (id === 'copy') onCopy()
      }}
      onClose={() => setOpen(false)}
      align="end"
      side="bottom"
    />
  )
}

interface TreeMenuProps {
  /** Whether entries the system hides are drawn, which the check marks. */
  readonly showHidden: boolean
  /** Whether a re-read of the root and every open branch is in flight. */
  readonly refreshing: boolean
  readonly onRefresh: () => void
  readonly onToggleHidden: () => void
  readonly t: Translate
}

/**
 * The workspace tree's More menu.
 *
 * Refresh is a command and the eye is a checked option, so the two sit either
 * side of one rule: the menu states the action once at the top and lets the
 * check below say what the tree is currently doing. Refresh is disabled while the
 * root is still being read, which is the same guard the button it replaced had.
 */
export function TreeMenu(props: TreeMenuProps): ReactNode {
  const { showHidden, refreshing, onRefresh, onToggleHidden, t } = props
  const [open, setOpen] = useState(false)
  const items: readonly MenuEntry[] = [
    { id: 'refresh', label: t('action.refresh'), disabled: refreshing },
    { type: 'separator', id: 'hidden-separator' },
    { id: 'toggle-hidden', label: t('action.toggleHidden') },
  ]

  return (
    <Menu
      open={open}
      className="dsh-cf-mode"
      anchor={(
        <MoreTrigger
          open={open}
          label={t('action.more')}
          onClick={() => setOpen(value => !value)}
        />
      )}
      items={items}
      selectedIds={showHidden ? ['toggle-hidden'] : []}
      onSelect={(id) => {
        setOpen(false)
        if (id === 'refresh') onRefresh()
        else if (id === 'toggle-hidden') onToggleHidden()
      }}
      onClose={() => setOpen(false)}
      align="end"
      side="bottom"
    />
  )
}
