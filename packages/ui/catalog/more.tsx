/**
 * The rest of the shell's controls: the primitives the first pass left out.
 *
 * `shell.tsx` covers the ten controls a plugin reaches for first — a button, a
 * field, a dialog, a tab strip. The package ships sixty-nine components, and
 * the other fifty-nine were reachable but undocumented, which made the catalog
 * read as "this is everything" when it was a sample. This file closes the part
 * of that gap that can be drawn here without new third-party dependencies: the
 * atoms whose whole surface is React, tokens and the shell's own icon set.
 *
 * Two groups are deliberately still absent:
 *
 * - **The Markdown and code families** — `MarkdownText`, `CodeBlock`,
 *   `DiffBlock`, `TerminalBlock`, `JsonTree` and neighbours — pull in Shiki,
 *   KaTeX and micromark, none of which this repository installs. They need a
 *   preview harness before they can be shown honestly.
 * - **The icon and artwork exports** — `FishLogo`, `PermissionIcon*`,
 *   `PluginArtwork*` and their kin. They already have a catalog of their own in
 *   `packages/icons`, and a second wall of glyphs here would answer a question
 *   nobody asked on this page.
 *
 * The same two rules as `shell.tsx` apply to every entry below: the component is
 * the shell's own source (never a redraw), and the props table is a copy
 * transcribed from that source rather than a checked type — the shell types its
 * props inline, and re-declaring them here is exactly what `primitives.ts`
 * refuses to do.
 */

import { useState, type ReactElement } from 'react'
import { AnimatedRows } from '@deepseek-ai/dsh-client-ui-primitives/src/AnimatedRows.tsx'
import { Checkbox } from '@deepseek-ai/dsh-client-ui-primitives/src/Checkbox.tsx'
import { ConnectionIndicator } from '@deepseek-ai/dsh-client-ui-primitives/src/ConnectionIndicator.tsx'
import { DisclosureRow } from '@deepseek-ai/dsh-client-ui-primitives/src/DisclosureRow.tsx'
import { HoverCard } from '@deepseek-ai/dsh-client-ui-primitives/src/HoverCard.tsx'
import { HoverCardGroup } from '@deepseek-ai/dsh-client-ui-primitives/src/HoverCardGroup.tsx'
import { InlineEditor } from '@deepseek-ai/dsh-client-ui-primitives/src/InlineEditor.tsx'
import { Menu } from '@deepseek-ai/dsh-client-ui-primitives/src/Menu.tsx'
import { MenuGroup } from '@deepseek-ai/dsh-client-ui-primitives/src/MenuGroup.tsx'
import { MenuSurface } from '@deepseek-ai/dsh-client-ui-primitives/src/MenuSurface.tsx'
import { PathLabel } from '@deepseek-ai/dsh-client-ui-primitives/src/PathLabel.tsx'
import { RiskConfirmation } from '@deepseek-ai/dsh-client-ui-primitives/src/RiskConfirmation.tsx'
import { ShortcutKeys } from '@deepseek-ai/dsh-client-ui-primitives/src/ShortcutKeys.tsx'
import { StateDot } from '@deepseek-ai/dsh-client-ui-primitives/src/StateDot.tsx'
import { TextShimmer } from '@deepseek-ai/dsh-client-ui-primitives/src/TextShimmer.tsx'
import { Toast } from '@deepseek-ai/dsh-client-ui-primitives/src/Toast.tsx'
import { ZoomControls } from '@deepseek-ai/dsh-client-ui-primitives/src/ZoomControls.tsx'
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

function TextShimmerDemo(): ReactElement {
  return (
    <Variants>
      <Variant label="idle">
        <TextShimmer>Waiting for input</TextShimmer>
      </Variant>
      <Variant label="active">
        <TextShimmer active>Thinking about the next step</TextShimmer>
      </Variant>
      <Variant label="nested fragments">
        <TextShimmer active>
          <span>Reading</span>
          <span data-shimmer-decoration> · </span>
          <TextShimmer>four files</TextShimmer>
        </TextShimmer>
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

function DisclosureRowDemo(): ReactElement {
  const [open, setOpen] = useState(true)
  const [runningOpen, setRunningOpen] = useState(false)
  return (
    <Variants size="lg">
      <Variant label="open · with content">
        <DisclosureRow
          icon={<IconChevronRight />}
          title="Ran 3 commands"
          open={open}
          expandable
          onToggle={() => { setOpen(!open) }}
          expandOnRowClick
        >
          <p className="demo-prose">The row expands to whatever the owner renders below it.</p>
        </DisclosureRow>
      </Variant>
      <Variant label="collapsed · inline summary">
        <DisclosureRow
          icon={<IconChevronRight />}
          title="Edited 2 files"
          open={false}
          expandable
          onToggle={() => {}}
          collapsedContent={<span className="demo-muted">· branch.ts, git.tsx</span>}
        />
      </Variant>
      <Variant label="running">
        {/* `running` belongs to the header alone: a control inside the body would
            be shimmered and clipped with it, which is why the toggle lives
            outside the row rather than inside its children. */}
        <DisclosureRow
          icon={<IconCopy />}
          title="Running the test suite"
          open={runningOpen}
          expandable
          running
          onToggle={() => { setRunningOpen(!runningOpen) }}
        >
          <p className="demo-prose">The header shimmers until the owner clears `running`.</p>
        </DisclosureRow>
      </Variant>
    </Variants>
  )
}

function ConnectionIndicatorDemo(): ReactElement {
  const [state, setState] = useState<'disconnected' | 'connecting' | 'recovered'>('disconnected')
  const labels = {
    disconnectedLabel: 'Connection lost',
    connectingLabel: 'Reconnecting',
    recoveredLabel: 'Reconnected',
    reconnectActionLabel: 'Reconnect now',
    restartActionLabel: 'Restart the attempt',
  }
  return (
    <>
      <Variants size="sm">
        <Variant label="disconnected">
          <ConnectionIndicator state="disconnected" {...labels} onReconnect={() => { setState('connecting') }} />
        </Variant>
        <Variant label="connecting">
          <ConnectionIndicator state="connecting" {...labels} onReconnect={() => {}} />
        </Variant>
        <Variant label="recovered">
          <ConnectionIndicator state="recovered" {...labels} onReconnect={() => {}} />
        </Variant>
        <Variant label="state undefined · nothing drawn">
          <ConnectionIndicator state={undefined} {...labels} onReconnect={() => {}} />
        </Variant>
      </Variants>
      <Variants size="sm">
        <Variant label="live · press to reconnect">
          <Button variant="outline" size="sm" onClick={() => { setState(state === 'disconnected' ? 'connecting' : 'disconnected') }}>
            {state === 'disconnected' ? 'Simulate an outage' : 'Reset'}
          </Button>
        </Variant>
      </Variants>
    </>
  )
}

function InlineEditorDemo(): ReactElement {
  const [value, setValue] = useState('session-name')
  const [committed, setCommitted] = useState('session-name')
  return (
    <Variants>
      <Variant label="editing">
        <InlineEditor
          value={value}
          label="Session name"
          onChange={setValue}
          onSave={() => { setCommitted(value) }}
          onCancel={() => { setValue(committed) }}
        />
      </Variant>
      <Variant label="committed value">
        <p className="demo-prose">{committed}</p>
      </Variant>
    </Variants>
  )
}

function PathLabelDemo(): ReactElement {
  return (
    <Variants>
      <Variant label="long path">
        <PathLabel path="/home/dev/projects/dsh-cool-plugins/packages/ui/src/input.tsx" />
      </Variant>
      <Variant label="short path">
        <PathLabel path="src/index.ts" />
      </Variant>
      <Variant label="root">
        <PathLabel path="/" />
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

function MenuSurfaceDemo(): ReactElement {
  return (
    <Variants size="sm">
      <Variant label="surface">
        <MenuSurface className="demo-menu-surface">
          <MenuGroup label="Recent">
            <span className="demo-list-row">session-one</span>
            <span className="demo-list-row">session-two</span>
          </MenuGroup>
        </MenuSurface>
      </Variant>
      <Variant label="compact">
        <MenuSurface compact className="demo-menu-surface">
          <span className="demo-list-row">Dense rows</span>
        </MenuSurface>
      </Variant>
    </Variants>
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

function AnimatedRowsDemo(): ReactElement {
  const [rows, setRows] = useState(['alpha', 'beta', 'gamma'])
  const [ready, setReady] = useState(true)
  const shuffle = (): void => {
    setRows((current) => [...current].reverse())
  }
  const add = (): void => {
    setRows((current) => [...current, `row-${current.length + 1}`])
  }
  return (
    <>
      <Variants size="sm">
        <Variant label="shuffle">
          <Button variant="outline" onClick={shuffle}>Reverse</Button>
        </Variant>
        <Variant label="add a row">
          <Button variant="outline" onClick={add}>Add</Button>
        </Variant>
        <Variant label="ready">
          <Button variant="outline" onClick={() => { setReady(!ready) }}>{ready ? 'Mark not ready' : 'Mark ready'}</Button>
        </Variant>
      </Variants>
      <Variants size="lg">
        <Variant label="rows" span>
          <AnimatedRows className="demo-animated-rows" rowKeys={rows} ready={ready} resetKey="demo">
            {rows.map((row) => (
              <div key={row} data-row-key={row} className="demo-list-row">{row}</div>
            ))}
          </AnimatedRows>
        </Variant>
      </Variants>
    </>
  )
}

function ZoomControlsDemo(): ReactElement {
  const [zoom, setZoom] = useState(1)
  const labels = {
    controls: 'Zoom controls',
    menu: 'Zoom options',
    out: 'Zoom out',
    into: 'Zoom in',
    value: (percent: number) => `${percent}%`,
  }
  return (
    <Variants size="sm">
      <Variant label="visible">
        {/* The cluster positions itself against its nearest positioned ancestor,
            the way it does against a document pane in the product. The demo box
            supplies that ancestor so it stays inside the tile. */}
        <div className="demo-zoom-stage">
          <ZoomControls
            zoom={zoom}
            fit={{ label: 'Fit', selected: false, onSelect: () => { setZoom(1) } }}
            labels={labels}
            visible
            onZoom={setZoom}
            onActiveChange={() => {}}
          />
        </div>
      </Variant>
      <Variant label="current zoom">
        <p className="demo-prose">{Math.round(zoom * 100)}%</p>
      </Variant>
    </Variants>
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
    id: 'text-shimmer',
    name: 'TextShimmer',
    summary: 'Text with a shared highlight while the work it labels is running, still selectable and readable.',
    file: '@deepseek-ai/dsh-client-ui-primitives/src/TextShimmer.tsx',
    Demo: TextShimmerDemo,
    props: [
      { name: 'children', type: 'ReactNode', description: 'The text. Nested `TextShimmer` instances inherit the outer activity.' },
      { name: 'active', type: 'boolean', default: 'false', description: 'Runs the highlight. An idle shimmer draws plain text.' },
      { name: 'className', type: 'string', description: 'Class for the outer span.' },
      { name: 'contentClassName', type: 'string', description: 'Layout class applied equally to the base and decorative copy.' },
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
    id: 'disclosure-row',
    name: 'DisclosureRow',
    summary: 'A collapsible row: a leading mark, a title, and the body or inline summary the owner supplies.',
    file: '@deepseek-ai/dsh-client-ui-primitives/src/DisclosureRow.tsx',
    Demo: DisclosureRowDemo,
    props: [
      { name: 'icon', type: 'ReactNode', description: 'The leading mark.' },
      { name: 'title', type: 'string', description: 'The row\'s text.' },
      { name: 'open', type: 'boolean', description: 'Whether the body is showing. The owner holds it.' },
      { name: 'expandable', type: 'boolean', description: 'Whether the row may open at all.' },
      { name: 'onToggle', type: '() => void', description: 'Receives the toggle request.' },
      { name: 'running', type: 'boolean', default: 'false', description: 'Shimmers the header while its operation is in flight.' },
      { name: 'expandOnRowClick', type: 'boolean', default: 'false', description: 'Makes the whole title row the target instead of a chevron.' },
      { name: 'previewChevron', type: 'boolean', default: 'false', description: 'Swaps the collapsed icon for a chevron on hover.' },
      { name: 'keepContentWhenOpen', type: 'boolean', default: 'false', description: 'Keeps `collapsedContent` inline while open.' },
      { name: 'collapsedContent', type: 'ReactNode', description: 'The summary drawn beside the title while collapsed.' },
      { name: 'headerAccessory', type: 'ReactNode', description: 'An independent action beside the title, outside the disclosure target.' },
      { name: 'children', type: 'ReactNode', description: 'The body.' },
      { name: 'className', type: 'string', description: 'Class for the outer element.' },
      { name: 'titleClassName', type: 'string', description: 'Class for the title text.' },
    ],
  },
  {
    id: 'connection-indicator',
    name: 'ConnectionIndicator',
    summary: 'The inline recovery control: an outage, a retry attempt, or the confirmation that the link is back.',
    file: '@deepseek-ai/dsh-client-ui-primitives/src/ConnectionIndicator.tsx',
    Demo: ConnectionIndicatorDemo,
    props: [
      { name: 'state', type: "'disconnected' | 'connecting' | 'recovered' | undefined", description: 'Which feedback is showing. `undefined` draws nothing at all.' },
      { name: 'disconnectedLabel', type: 'string', description: 'The outage text, which must name the retry action.' },
      { name: 'connectingLabel', type: 'string', description: 'The retry text; attempt dots follow it.' },
      { name: 'recoveredLabel', type: 'string', description: 'The recovery confirmation.' },
      { name: 'reconnectActionLabel', type: 'string', description: 'The accessible name for the outage action.' },
      { name: 'restartActionLabel', type: 'string', description: 'The accessible name for replacing an active attempt.' },
      { name: 'onReconnect', type: '() => void', description: 'Requests an immediate reconnect.' },
    ],
  },
  {
    id: 'inline-editor',
    name: 'InlineEditor',
    summary: 'A one-line edit that grows in place: Enter saves, Escape cancels, and the owner holds the draft.',
    file: '@deepseek-ai/dsh-client-ui-primitives/src/InlineEditor.tsx',
    Demo: InlineEditorDemo,
    props: [
      { name: 'value', type: 'string', description: 'The draft the control renders.' },
      { name: 'label', type: 'string', description: 'The accessible name. Required.' },
      { name: 'onChange', type: '(value: string) => void', description: 'Receives every keystroke. The control never writes.' },
      { name: 'onSave', type: '() => void', description: 'Called on Enter.' },
      { name: 'onCancel', type: '() => void', description: 'Called on Escape.' },
      { name: 'className', type: 'string', description: 'Extra class for layout placement.' },
    ],
  },
  {
    id: 'path-label',
    name: 'PathLabel',
    summary: 'A file path that keeps its basename readable: the directory truncates from the left before the name does.',
    file: '@deepseek-ai/dsh-client-ui-primitives/src/PathLabel.tsx',
    Demo: PathLabelDemo,
    props: [
      { name: 'path', type: 'string', description: 'The path to draw. The basename keeps its space; the directory gives way.' },
      { name: 'className', type: 'string', description: 'Extra class for layout placement.' },
      { name: '…rest', type: 'HTMLAttributes<HTMLSpanElement>', description: 'Span attributes pass through, except `children` and `title` — the label owns both.' },
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
    id: 'menu-surface',
    name: 'MenuSurface',
    summary: 'The material a menu sits on: the fill, the blur, the elevation and the group headings.',
    file: '@deepseek-ai/dsh-client-ui-primitives/src/MenuSurface.tsx',
    Demo: MenuSurfaceDemo,
    props: [
      { name: 'compact', type: 'boolean', default: 'false', description: 'Matches the shared compact menu\'s smaller outer radius.' },
      { name: 'phase', type: "'enter' | 'dismiss' | 'replace'", description: 'Fades the surface and its material without isolating the backdrop.' },
      { name: 'children', type: 'ReactNode', description: 'The rows. Wrap them in `MenuGroup` to get sticky headings.' },
      { name: '…rest', type: 'HTMLAttributes<HTMLDivElement>', description: 'Div attributes pass through, including `className`.' },
    ],
  },
  {
    id: 'menu-group',
    name: 'MenuGroup',
    summary: 'A named section inside a menu, with an id it owns and a heading that sticks to the scroll top.',
    file: '@deepseek-ai/dsh-client-ui-primitives/src/MenuGroup.tsx',
    Demo: MenuSurfaceDemo,
    props: [
      { name: 'label', type: 'string', description: 'The heading text, which also names the section for a screen reader.' },
      { name: 'children', type: 'ReactNode', description: 'The rows in the section.' },
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
  {
    id: 'animated-rows',
    name: 'AnimatedRows',
    summary: 'A list that animates rows into place when the order changes, and only once it is told it is ready.',
    file: '@deepseek-ai/dsh-client-ui-primitives/src/AnimatedRows.tsx',
    Demo: AnimatedRowsDemo,
    props: [
      { name: 'children', type: 'ReactNode', description: 'The rows. Each needs a `data-row-key` matching `rowKeys`.' },
      { name: 'rowKeys', type: 'readonly string[]', description: 'The keys in DOM order, which is how the move is measured.' },
      { name: 'ready', type: 'boolean', description: 'Arms the animation. Rows arriving before this settle instantly.' },
      { name: 'resetKey', type: 'string', description: 'Changing it replaces the view, so the rows settle instead of sliding.' },
      { name: 'className', type: 'string', description: 'Class for the list element. Required.' },
      { name: 'role', type: 'AriaRole', description: 'The list\'s role, when the rows are not a plain list.' },
      { name: 'label', type: 'string', description: 'The list\'s accessible name.' },
    ],
  },
  {
    id: 'zoom-controls',
    name: 'ZoomControls',
    summary: 'The document zoom cluster: a stepper, an exact-size menu, and a fit-to-width action.',
    file: '@deepseek-ai/dsh-client-ui-primitives/src/ZoomControls.tsx',
    Demo: ZoomControlsDemo,
    props: [
      { name: 'zoom', type: 'number', description: 'The current factor. The owner holds it.' },
      { name: 'onZoom', type: '(zoom: number) => void', description: 'Receives the factor a press asks for.' },
      { name: 'fit', type: '{ label, selected, onSelect }', description: 'The fit-to-width action, and whether it is the current mode.' },
      { name: 'labels', type: 'DocumentZoomLabels', description: 'Every string the control draws. Required: the component owns no copy.' },
      { name: 'visible', type: 'boolean', description: 'Whether the cluster is drawn at all.' },
      { name: 'onActiveChange', type: '(active: boolean) => void', description: 'Reports whether the menu is open, so the owner can dim the page.' },
      { name: 'className', type: 'string', description: 'Extra class for layout placement.' },
    ],
  },
]
