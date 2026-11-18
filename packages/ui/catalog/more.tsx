/**
 * A second shelf of shell controls: the atoms `shell.tsx` does not carry.
 *
 * `shell.tsx` covers the ten controls a plugin reaches for first — a button, a
 * field, a dialog, a tab strip. This file adds the seven beside them whose whole
 * surface is React, tokens and the shell's own icon set, so a reader can see a
 * checkbox or a menu without leaving the page.
 *
 * The list is a decision, not a census. Most of the shell's sixty-nine exports
 * are deliberately not here:
 *
 * - **The Markdown and code families** — `MarkdownText`, `CodeBlock`,
 *   `DiffBlock`, `TerminalBlock`, `JsonTree` and neighbours — pull in Shiki,
 *   KaTeX and micromark, none of which this repository installs. They need a
 *   preview harness before they can be shown honestly.
 * - **The icon and artwork exports** — `FishLogo`, `PermissionIcon*`,
 *   `PluginArtwork*` and their kin. They already have a catalog of their own in
 *   `packages/icons`, and a second wall of glyphs here would answer a question
 *   nobody asked on this page.
 * - **The chrome that only means something in place.** `AnimatedRows`,
 *   `DisclosureRow`, `InlineEditor`, `MenuGroup`, `MenuSurface`, `PathLabel`,
 *   `TextShimmer`, `ConnectionIndicator` and `ZoomControls` are parts of a
 *   larger surface: a list that animates between renders, a material a menu
 *   floats on, a path that truncates against a real sidebar's width, an edit
 *   that only means its affordance beside the label it replaces. Drawn in a tile
 *   they were a blank box or a fragment without its context, which taught a
 *   reader less than the source would have. They stay reachable, documented by
 *   their own code.
 *
 * The same two rules as `shell.tsx` apply to every entry below: the component is
 * the shell's own source (never a redraw), and the props table is a copy
 * transcribed from that source rather than a checked type — the shell types its
 * props inline, and re-declaring them here is exactly what `primitives.ts`
 * refuses to do.
 */

import { useState, type ReactElement } from 'react'
import { Checkbox } from '@deepseek-ai/dsh-client-ui-primitives/src/Checkbox.tsx'
import { HoverCard } from '@deepseek-ai/dsh-client-ui-primitives/src/HoverCard.tsx'
import { HoverCardGroup } from '@deepseek-ai/dsh-client-ui-primitives/src/HoverCardGroup.tsx'
import { Menu } from '@deepseek-ai/dsh-client-ui-primitives/src/Menu.tsx'
import { RiskConfirmation } from '@deepseek-ai/dsh-client-ui-primitives/src/RiskConfirmation.tsx'
import { ShortcutKeys } from '@deepseek-ai/dsh-client-ui-primitives/src/ShortcutKeys.tsx'
import { StateDot } from '@deepseek-ai/dsh-client-ui-primitives/src/StateDot.tsx'
import { Toast } from '@deepseek-ai/dsh-client-ui-primitives/src/Toast.tsx'
import { Button } from '@deepseek-ai/dsh-client-ui-primitives/src/Button.tsx'
import { IconChevronRight, IconCopy, IconPlus, IconTrash } from '@dsh-cool/icons'
import type { CatalogEntry } from './types.js'
import { Variant, Variants } from './ui.js'

/** The five states `StateDot` paints. */
const STATE_DOT_STATES = ['done', 'warning', 'ongoing', 'error', 'idle'] as const

function CheckboxDemo(): ReactElement {
  const [a, setA] = useState(true)
  const [b, setB] = useState(false)
  return (
    <Variants size="sm">
      <Variant label="checked">
        <Checkbox checked={a} onChange={setA} label="Include dependencies" />
      </Variant>
      <Variant label="unchecked">
        <Checkbox checked={b} onChange={setB} label="Include dependencies" />
      </Variant>
      <Variant label="disabled · checked">
        <Checkbox checked disabled onChange={() => {}} label="Locked on" />
      </Variant>
      <Variant label="disabled · unchecked">
        <Checkbox checked={false} disabled onChange={() => {}} label="Locked off" />
      </Variant>
      <Variant label="with title">
        <Checkbox checked onChange={() => {}} label="Recursive" title="Applies to nested folders too" />
      </Variant>
    </Variants>
  )
}

function StateDotDemo(): ReactElement {
  return (
    <Variants size="sm">
      {STATE_DOT_STATES.map((state) => (
        <Variant key={state} label={`dot · ${state}`}>
          <StateDot state={state} />
        </Variant>
      ))}
      {STATE_DOT_STATES.map((state) => (
        <Variant key={`step-${state}`} label={`step · ${state}`}>
          <StateDot state={state} appearance="step" />
        </Variant>
      ))}
      <Variant label="size · 18">
        <StateDot state="ongoing" size={18} />
      </Variant>
    </Variants>
  )
}

function ShortcutKeysDemo(): ReactElement {
  return (
    <Variants size="sm">
      <Variant label="plain">
        <ShortcutKeys keys={['⌘', 'K']} />
      </Variant>
      <Variant label="with a chord">
        <ShortcutKeys keys={['⌘', '+', 'Shift', '+', 'P']} />
      </Variant>
      <Variant label="tooltip variant">
        <ShortcutKeys keys={['⌘', '+', 'S']} variant="tooltip" />
      </Variant>
    </Variants>
  )
}

function MenuDemo(): ReactElement {
  // Two menus, two open flags: one `open` between them made both popups appear
  // when either trigger was pressed, which is a bug in the demo, not the menu.
  const [anchoredOpen, setAnchoredOpen] = useState(false)
  const [submenuOpen, setSubmenuOpen] = useState(false)
  const [picked, setPicked] = useState('rename')
  return (
    <>
      <Variants size="sm">
        <Variant label="anchored menu">
          <Menu
            open={anchoredOpen}
            anchor={<Button variant="outline" onClick={() => { setAnchoredOpen(!anchoredOpen) }}>Open menu</Button>}
            items={[
              { type: 'label', id: 'file', text: 'File' },
              { id: 'rename', label: 'Rename', shortcut: { keys: ['F2'] } },
              { id: 'duplicate', label: 'Duplicate', icon: <IconCopy /> },
              { type: 'separator', id: 'sep' },
              { id: 'delete', label: 'Delete', icon: <IconTrash />, danger: true },
            ]}
            selectedId={picked}
            onSelect={(id) => { setPicked(id); setAnchoredOpen(false) }}
            onClose={() => { setAnchoredOpen(false) }}
          />
        </Variant>
        <Variant label="last selection">
          <p className="demo-prose">{picked}</p>
        </Variant>
      </Variants>
      <Variants size="sm">
        <Variant label="submenu">
          <Menu
            open={submenuOpen}
            anchor={<Button variant="outline" onClick={() => { setSubmenuOpen(!submenuOpen) }}>Open with submenu</Button>}
            items={[
              { id: 'copy', label: 'Copy' },
              {
                id: 'more',
                label: 'More',
                submenu: [
                  { id: 'pin', label: 'Pin' },
                  { id: 'archive', label: 'Archive' },
                ],
              },
            ]}
            onSelect={(id) => { setPicked(id); setSubmenuOpen(false) }}
            onClose={() => { setSubmenuOpen(false) }}
          />
        </Variant>
      </Variants>
    </>
  )
}

function HoverCardDemo(): ReactElement {
  return (
    <Variants size="sm">
      <Variant label="single card">
        <HoverCard
          anchor={<Button variant="outline">Hover or focus</Button>}
          content={<p className="demo-prose">A clamp-to-viewport card. Escape or moving away closes it.</p>}
        />
      </Variant>
      <Variant label="copyable">
        <HoverCard
          anchor={<Button variant="outline">Hover to copy</Button>}
          content={<p className="demo-prose">Copied value</p>}
          copyText="copied value"
          copyLabel="Copy"
          copiedLabel="Copied"
        />
      </Variant>
      <Variant label="group · shared open">
        <HoverCardGroup>
          <HoverCard anchor={<Button variant="outline">One</Button>} content={<p className="demo-prose">First</p>} grouped />
          <HoverCard anchor={<Button variant="outline">Two</Button>} content={<p className="demo-prose">Second</p>} grouped />
        </HoverCardGroup>
      </Variant>
    </Variants>
  )
}

function RiskConfirmationDemo(): ReactElement {
  const [open, setOpen] = useState(false)
  const [ack, setAck] = useState(false)
  return (
    <>
      <Variants size="sm">
        <Variant label="open the dialog">
          <Button variant="outline" onClick={() => { setOpen(true) }}>Delete everything</Button>
        </Variant>
      </Variants>
      <RiskConfirmation
        open={open}
        title="Delete this workspace?"
        description="Every session in it is removed. This cannot be undone."
        acknowledgeLabel="I understand this cannot be undone"
        cancelLabel="Cancel"
        closeLabel="Close"
        confirmLabel="Delete"
        acknowledged={ack}
        onAcknowledgedChange={setAck}
        onCancel={() => { setOpen(false); setAck(false) }}
        onConfirm={() => { setOpen(false); setAck(false) }}
      />
    </>
  )
}

function ToastDemo(): ReactElement {
  // One toast at a time, and the variant that raised it decides its shape: a
  // single shared `text` with a fixed `tone` and `actions` would have made all
  // three buttons show the same success banner, which is not what any of them
  // is demonstrating.
  const [shown, setShown] = useState<'plain' | 'success' | 'action' | null>(null)
  const show = (kind: 'plain' | 'success' | 'action'): void => { setShown(kind) }
  const text = shown === 'plain' ? 'Copied to the clipboard'
    : shown === 'success' ? 'Saved to the workspace'
      : 'Branch deleted'
  return (
    <>
      <Variants size="sm">
        <Variant label="plain">
          <Button variant="outline" onClick={() => { show('plain') }}>Show toast</Button>
        </Variant>
        <Variant label="success tone">
          <Button variant="outline" onClick={() => { show('success') }}>Show success</Button>
        </Variant>
        <Variant label="with action">
          <Button variant="outline" onClick={() => { show('action') }}>Show with action</Button>
        </Variant>
      </Variants>
      {shown !== null && (
        <Toast
          text={text}
          {...shown === 'success' ? { tone: 'success' as const } : {}}
          holdMs={1800}
          {...shown === 'action' ? { actions: [{ label: 'Undo', onClick: () => { setShown(null) } }] } : {}}
          onDone={() => { setShown(null) }}
        />
      )}
    </>
  )
}

/** Every entry this file adds, in the one order the catalog sorts them into. */
export const MORE_ENTRIES: readonly CatalogEntry[] = [
  {
    id: 'checkbox',
    name: 'Checkbox',
    summary: 'A labelled checkbox whose `label` is required, so a box can never ship without a name.',
    file: '@deepseek-ai/dsh-client-ui-primitives/src/Checkbox.tsx',
    Demo: CheckboxDemo,
    props: [
      { name: 'checked', type: 'boolean', description: 'The current state. Required: the control holds nothing itself.' },
      { name: 'onChange', type: '(next: boolean) => void', description: 'Receives the state the press asks for.' },
      { name: 'label', type: 'string', description: 'The visible text and the accessible name. Required.' },
      { name: 'disabled', type: 'boolean', default: 'false', description: 'Refuses input.' },
      { name: 'title', type: 'string', description: 'Hover text, typically the reason the box is locked.' },
      { name: 'modalAutofocus', type: 'boolean', default: 'false', description: 'Writes `data-modal-autofocus`, so the enclosing `Modal` focuses this box on open.' },
      { name: 'className', type: 'string', description: 'Extra class for layout placement.' },
    ],
  },
  {
    id: 'state-dot',
    name: 'StateDot',
    summary: 'One 10px mark reporting a step\'s state, drawn as a dot or as a numbered step.',
    file: '@deepseek-ai/dsh-client-ui-primitives/src/StateDot.tsx',
    Demo: StateDotDemo,
    props: [
      { name: 'state', type: "'done' | 'warning' | 'ongoing' | 'error' | 'idle'", description: 'Which colour and glyph the mark paints. `ongoing` spins.' },
      { name: 'size', type: 'number', description: 'The edge length in pixels. Defaults to 10, or 14 while `ongoing`.' },
      { name: 'appearance', type: "'dot' | 'step'", default: "'dot'", description: 'A plain dot, or a ringed step that reads as a point in a sequence.' },
      { name: 'className', type: 'string', description: 'Extra class for layout placement.' },
    ],
  },
  {
    id: 'shortcut-keys',
    name: 'ShortcutKeys',
    summary: 'Keycaps for one binding, drawn as a chord with visible separators when a `+` is among the keys.',
    file: '@deepseek-ai/dsh-client-ui-primitives/src/ShortcutKeys.tsx',
    Demo: ShortcutKeysDemo,
    props: [
      { name: 'keys', type: 'readonly string[]', description: 'The labels in order. A `+` entry is drawn as a separator, not a key.' },
      { name: 'variant', type: "'plain' | 'tooltip'", default: "'plain'", description: '`tooltip` is the smaller pairing used inside a tooltip bubble.' },
      { name: 'className', type: 'string', description: 'Extra class for layout placement.' },
    ],
  },
  {
    id: 'menu',
    name: 'Menu',
    summary: 'An anchored menu with its own dismissal, keyboard walk and submenus; the owner supplies the rows.',
    file: '@deepseek-ai/dsh-client-ui-primitives/src/Menu.tsx',
    Demo: MenuDemo,
    props: [
      { name: 'open', type: 'boolean', description: 'Whether the popup is showing. The owner controls it.' },
      { name: 'anchor', type: 'ReactNode', description: 'The element the popup is placed against and positioned from.' },
      { name: 'items', type: 'readonly MenuEntry[]', default: '[]', description: 'The rows: items, separators and labels, in display order.' },
      { name: 'onSelect', type: '(id: string) => void', description: 'Receives the id of the row that was chosen.' },
      { name: 'selectedId', type: 'string', description: 'The row drawn as the current one.' },
      { name: 'selectedIds', type: 'readonly string[]', description: 'Several current rows, for a menu that reports a set.' },
      { name: 'onClose', type: '() => void', description: 'Called by Escape, an outside click, or a selection.' },
      { name: 'align', type: "'start' | 'end'", default: "'start'", description: 'Which anchor edge the popup aligns to.' },
      { name: 'side', type: "'bottom' | 'top' | 'right'", default: "'bottom'", description: 'The preferred placement. Fitting tries the others.' },
      { name: 'portal', type: 'boolean', default: 'false', description: 'Renders under `document.body`, so a clipping ancestor cannot cut it off.' },
      { name: 'dense', type: 'boolean', default: 'false', description: 'Tighter row metrics.' },
      { name: 'compact', type: 'boolean', default: 'false', description: 'The smaller outer radius the compact menu uses.' },
      { name: 'footer', type: 'readonly MenuEntry[]', description: 'Rows pinned below the list.' },
      { name: 'submenuBackLabel', type: 'string', description: 'The localized return action inside a submenu.' },
      { name: 'children', type: 'ReactNode', description: 'Custom popup content instead of `items`.' },
    ],
  },
  {
    id: 'hover-card',
    name: 'HoverCard',
    summary: 'A rich preview on hover or focus, clamped to the viewport and dismissible without moving the pointer.',
    file: '@deepseek-ai/dsh-client-ui-primitives/src/HoverCard.tsx',
    Demo: HoverCardDemo,
    props: [
      { name: 'content', type: 'ReactNode', description: 'What the card draws.' },
      { name: 'children', type: 'ReactElement', description: 'The anchor. Its ref and handlers are chained, not replaced.' },
      { name: 'className', type: 'string', description: 'Extra class for layout placement.' },
      { name: '…rest', type: 'HTMLAttributes<HTMLSpanElement>', description: 'Attributes for the anchor\'s wrapper.' },
    ],
  },
  {
    id: 'risk-confirmation',
    name: 'RiskConfirmation',
    summary: 'A destructive dialog that will not fire until the reader ticks the acknowledgement.',
    file: '@deepseek-ai/dsh-client-ui-primitives/src/RiskConfirmation.tsx',
    Demo: RiskConfirmationDemo,
    props: [
      { name: 'open', type: 'boolean', description: 'Whether the dialog is showing. The owner controls it.' },
      { name: 'title', type: 'string', description: 'The dialog heading and its accessible name.' },
      { name: 'description', type: 'string', description: 'The consequence, stated plainly.' },
      { name: 'acknowledgeLabel', type: 'string', description: 'The checkbox text the reader must tick.' },
      { name: 'cancelLabel', type: 'string', description: 'The cancel action.' },
      { name: 'closeLabel', type: 'string', description: 'The close button\'s accessible name.' },
      { name: 'confirmLabel', type: 'string', description: 'The destructive action. Stays disabled until acknowledged.' },
      { name: 'acknowledged', type: 'boolean', description: 'Whether the box is ticked. The owner holds it.' },
      { name: 'onAcknowledgedChange', type: '(acknowledged: boolean) => void', description: 'Receives the tick.' },
      { name: 'onCancel', type: '() => void', description: 'Called by cancel, close or Escape.' },
      { name: 'onConfirm', type: '() => void', description: 'Called by the destructive action.' },
      { name: 'disabled', type: 'boolean', default: 'false', description: 'Locks every control, typically while a write is in flight.' },
    ],
  },
  {
    id: 'toast',
    name: 'Toast',
    summary: 'A transient top-centre banner that holds, fades, and reports when it is finished.',
    file: '@deepseek-ai/dsh-client-ui-primitives/src/Toast.tsx',
    Demo: ToastDemo,
    props: [
      { name: 'text', type: 'string', description: 'The message.' },
      { name: 'onDone', type: '() => void', description: 'Called once the fade ends, so the owner can unmount it.' },
      { name: 'tone', type: "'success'", description: 'Draws the success glyph.' },
      { name: 'icon', type: 'ReactNode', description: 'Replaces the tone glyph.' },
      { name: 'holdMs', type: 'number', description: 'Full-opacity hold before the fade starts.' },
      { name: 'actions', type: 'readonly { label, prefix?, onClick }[]', description: 'Inline actions drawn after the text, e.g. Undo.' },
      { name: 'anchor', type: 'HTMLElement | null', description: 'Positions the banner against a window other than the page\'s own.' },
    ],
  },
]
