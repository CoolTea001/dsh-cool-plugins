/**
 * The sidebar's title bar: the column's name, and the one menu that shapes it.
 *
 * The bar is the top seam of the terminal sidebar, above the scrolling
 * workspace list. Its menu collects what used to be scattered across the
 * column — creating a console (`New terminal`, with a workspace chooser as its
 * second level), which workspaces the list shows, whether consoles are drawn as
 * a tree or as cards, and the common-commands dialog that used to have its own
 * footer button. One entry point means the sidebar's footer can go away
 * entirely, and the list gets the whole column.
 *
 * The menu itself is the shell's `Menu`: it owns the anchored card, the child
 * card, the keyboard walk, Escape, and focus return, so this file only decides
 * what the rows are and what choosing one means. It is portaled because the
 * page root clips its overflow, which would crop an in-place card.
 *
 * Both preference groups are independent, so each pair of rows shares one
 * `selectedIds` list: the shell marks whichever row in each group is in force.
 */

import * as React from 'react'
import { Menu, type MenuEntry } from '@dsh-cool/ui'
import { IconMore } from './icons.js'
import type { SidebarFilter } from './sidebar-prefs.js'
import type { Translate } from './locales.js'

const h = React.createElement

/** One workspace the "New terminal" child card can offer. */
export interface SidebarGroupOption {
  readonly key: string
  readonly title: string
}

/** Menu id prefix for the "New terminal" child rows, so a workspace id can never collide with a sibling entry. */
const NEW_PREFIX = 'new:'

export interface SidebarHeaderProps {
  /** Translator for every string the bar and its menu render. */
  readonly t: Translate
  /** The workspaces a console can be created in, in the column's order. */
  readonly groups: readonly SidebarGroupOption[]
  readonly filter: SidebarFilter
  readonly onFilter: (next: SidebarFilter) => void
  /** Create a console in one workspace and reveal it. */
  readonly onNewTerminal: (key: string) => void
  /** Open the common-commands dialog. */
  readonly onCommands: () => void
}

/**
 * Render the sidebar's title bar.
 *
 * @param props - the copy, the workspaces, both preferences, and the actions.
 * @returns the header element with its More menu.
 */
export function SidebarHeader(props: SidebarHeaderProps): React.ReactElement {
  const { t, groups, filter, onFilter, onNewTerminal, onCommands } = props
  const [open, setOpen] = React.useState(false)
  /** The trigger, named as the portaled card's CSS anchor. */
  const anchor = React.useRef<HTMLButtonElement | null>(null)

  // The child card lists every workspace, not only the ones the list filter
  // currently shows. The narrower filter hides groups with no console, and a
  // chooser that honoured it could never seed the first console into one — the
  // very console that would make the group appear. Creating one reveals it, so
  // the two never disagree for longer than the click.
  //
  // No row carries a leading icon: this menu is four labels and one check, and
  // a glyph beside one of them would make it look like a different kind of row
  // than the rest. The chevron on the submenu parent and the trailing check on
  // the selected filter are the only marks, and they carry meaning.
  const items: readonly MenuEntry[] = [
    {
      id: 'new',
      label: t('sidebar.menu.new'),
      disabled: groups.length === 0,
      submenu: groups.map((group) => ({ id: `${NEW_PREFIX}${group.key}`, label: group.title })),
    },
    { type: 'separator', id: 'after-new' },
    { id: 'filter-all', label: t('sidebar.filter.all') },
    { id: 'filter-with', label: t('sidebar.filter.withTerminals') },
    { type: 'separator', id: 'after-filter' },
    { id: 'commands', label: t('commands.title') },
  ]

  return h('div', { className: 'dsh-ct-side-head' },
    h('span', { key: 'title', className: 'dsh-ct-side-title' }, t('sidebar.header')),
    h('span', { key: 'menu', className: 'dsh-ct-side-more' },
      h(Menu, {
        open,
        items,
        portal: true,
        align: 'end',
        anchorRef: anchor,
        // The card's own class, which the stylesheet uses to scope two rules:
        // every row reserves the trailing mark's column, and the mark is drawn
        // in it. That is what keeps the card's width off the row that happens
        // to be checked — see the note in `styles.ts`. It is also a stable hook
        // for a portaled card, which renders under `document.body` outside any
        // of this page's scoping classes.
        listClassName: 'dsh-ct-side-menu',
        selectedIds: [filter === 'all' ? 'filter-all' : 'filter-with'],
        onSelect: (id: string) => {
          setOpen(false)
          if (id.startsWith(NEW_PREFIX)) onNewTerminal(id.slice(NEW_PREFIX.length))
          else if (id === 'filter-all') onFilter('all')
          else if (id === 'filter-with') onFilter('withTerminals')
          else if (id === 'commands') onCommands()
        },
        onClose: () => setOpen(false),
        anchor: h('button', {
          type: 'button',
          className: 'dsh-ct-icon dsh-ct-side-more-btn',
          title: t('terminal.more'),
          'aria-label': t('terminal.more'),
          'aria-haspopup': 'menu',
          'aria-expanded': open,
          onClick: (event: React.MouseEvent<HTMLButtonElement>) => {
            anchor.current = event.currentTarget
            setOpen((current) => !current)
          },
        }, h(IconMore)),
      }),
    ),
  )
}
