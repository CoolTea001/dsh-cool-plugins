/**
 * The preview/editor switch: what the Files tab does with the open file, and the
 * menu in the preview header that picks it.
 *
 * The choice belongs to the reader, not to one file, so it is saved like the
 * hidden-entries toggle: the next visit opens in the mode this one was left in.
 * `preview` draws the syntax-coloured, read-only page; `editor` keeps the same
 * page and puts a caret in it.
 *
 * The list is the shell's own `Menu` rather than a popover of this page's
 * invention: its card, its row metrics, its keyboard walk, its outside-click and
 * its focus return are the ones every other dropdown in the window has, so this
 * one matches them instead of approximating them. The module is supplied by the
 * platform (see `neverBundle` in `tsdown.config.ts`), never inlined: a second
 * copy of the shell's primitives would bring a second set of styles.
 */

import { useState, type ReactElement } from 'react'
import { IconChevronDown } from '@dsh-cool/icons'
import { Menu, type MenuEntry } from '@deepseek-ai/dsh-client-ui-primitives'
import type { Translate } from './locales.js'

/** What the page does with the open file. */
export type FilesMode = 'preview' | 'editor'

/** Where the page remembers that choice. */
const MODE_KEY = 'dsh-cool-file.mode.v1'

/** The two modes, in menu order. */
const MODES: readonly FilesMode[] = ['preview', 'editor']

/**
 * The saved mode; `preview` until the reader says otherwise.
 *
 * Preview is the safe default: it is what the tab did before the editor existed,
 * and it cannot change a file by being looked at.
 *
 * @returns the mode to open in.
 */
export function readMode(): FilesMode {
  try {
    return window.localStorage.getItem(MODE_KEY) === 'editor' ? 'editor' : 'preview'
  } catch {
    /* storage unavailable: preview lasts for this page */
    return 'preview'
  }
}

/**
 * Save the reader's choice of mode.
 *
 * @param mode - the mode now active.
 */
export function writeMode(mode: FilesMode): void {
  try {
    window.localStorage.setItem(MODE_KEY, mode)
  } catch {
    /* storage unavailable: the choice lasts for this page */
  }
}

/** The header copy of one mode. */
function labelOf(mode: FilesMode, t: Translate): string {
  return mode === 'preview' ? t('mode.preview') : t('mode.editor')
}

/** Props of the header's mode menu. */
interface ModeMenuProps {
  /** The mode currently active. */
  readonly mode: FilesMode
  /** Called with the mode the reader picked. */
  readonly onSelect: (mode: FilesMode) => void
  /** The page's translate seat. */
  readonly t: Translate
}

/**
 * The header's Preview/Editor dropdown.
 *
 * @param props - the active mode, the picker, and the copy.
 * @returns the shell menu, anchored on this page's own trigger button.
 */
export function ModeMenu({ mode, onSelect, t }: ModeMenuProps): ReactElement {
  const [open, setOpen] = useState(false)
  // One data row per mode: the shell draws the check beside `selectedId`, and
  // reports the pick by id rather than by index.
  const items: readonly MenuEntry[] = MODES.map((value) => ({ id: value, label: labelOf(value, t) }))

  return (
    <Menu
      open={open}
      // The list hangs from the header's right edge, where the button sits.
      align="end"
      className="dsh-cf-mode"
      anchor={
        <button
          type="button"
          className="dsh-cf-mode-btn"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label={t('mode.label')}
          title={t('mode.label')}
          onClick={() => setOpen((was) => !was)}
        >
          <span>{labelOf(mode, t)}</span>
          <IconChevronDown size={12} />
        </button>
      }
      items={items}
      selectedId={mode}
      onSelect={(id) => {
        setOpen(false)
        onSelect(id as FilesMode)
      }}
      onClose={() => setOpen(false)}
    />
  )
}
