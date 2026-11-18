/**
 * The shell's controls, drawn by the shell's own components.
 *
 * These entries import the installed DSH's control sources directly, and that
 * choice is the point of the page: a catalog that re-drew `Button` with this
 * package's rules would show a button the product does not have. The import is
 * the `./src/*` export the shell publishes rather than its barrel — the barrel
 * pulls in Shiki, KaTeX and the Markdown pipeline, none of which this repository
 * installs, and none of which a button can reach.
 *
 * What the preview can and cannot show follows from that:
 *
 * - **Light only.** `catalog/tokens.css` carries the resolved light values, so a
 *   control whose dark fill is the interesting part is not shown in the dark.
 * - **The demo's own copy.** Labels here are the catalog's; every one of these
 *   components takes its text as props by design.
 * - **One exception draws this package's wrapper.** `Input` comes from
 *   `../src/input.js`, not from the shell, because the wrapper is what a plugin
 *   imports: it is the shell's field plus the typed `modalAutofocus` flag, and it
 *   renders the shell's control underneath. Showing both as separate entries
 *   made the same control look like two.
 * - **Tables are copies.** Each `props` list describes the shell's inline prop
 *   type for a reader deciding whether to draw with it. Nothing checks those
 *   rows against the shell — the alternative is exporting the shell's prop types
 *   from this package, which is exactly what `primitives.ts` refuses to do. The
 *   rows for this package's own components are checked, in `own.tsx`.
 */

import { useState, type ReactElement } from 'react'
import { Button, type ButtonVariant } from '@deepseek-ai/dsh-client-ui-primitives/src/Button.tsx'
import { Modal } from '@deepseek-ai/dsh-client-ui-primitives/src/Modal.tsx'
import { Pill } from '@deepseek-ai/dsh-client-ui-primitives/src/Pill.tsx'
import { SegmentedControl } from '@deepseek-ai/dsh-client-ui-primitives/src/SegmentedControl.tsx'
import { SegmentedTabs } from '@deepseek-ai/dsh-client-ui-primitives/src/SegmentedTabs.tsx'
import { SettingsValueField } from '@deepseek-ai/dsh-client-ui-primitives/src/settings-form/fields.tsx'
import { Switch } from '@deepseek-ai/dsh-client-ui-primitives/src/Switch.tsx'
import { Tag, type TagTone } from '@deepseek-ai/dsh-client-ui-primitives/src/Tag.tsx'
import { Tooltip } from '@deepseek-ai/dsh-client-ui-primitives/src/Tooltip.tsx'
import { IconCopy, IconPlus, IconTrash } from '@dsh-cool/icons'
import { Input } from '../src/input.js'
import type { CatalogEntry } from './types.js'
import { Variant, Variants } from './ui.js'

/** The four fill families the shell's `Button` paints, in the order the guide lists them. */
const BUTTON_VARIANTS: readonly ButtonVariant[] = ['primary', 'ghost', 'outline', 'toolbar']

/** The eight tones the shell's `Tag` paints. */
const TAG_TONES: readonly TagTone[] = [
  'outline',
  'solid',
  'neutral',
  'quiet',
  'success',
  'info',
  'warning',
  'danger',
]

function ButtonDemo(): ReactElement {
  return (
    <Variants size="sm">
      {BUTTON_VARIANTS.map((variant) => (
        <Variant key={variant} label={variant}>
          <Button variant={variant}>Action</Button>
        </Variant>
      ))}
      {BUTTON_VARIANTS.map((variant) => (
        <Variant key={`sm-${variant}`} label={`${variant} · sm`}>
          <Button variant={variant} size="sm">Action</Button>
        </Variant>
      ))}
      <Variant label="icon">
        <Button variant="outline" icon={<IconPlus />}>New</Button>
      </Variant>
      <Variant label="disabled">
        <Button variant="primary" disabled>Action</Button>
      </Variant>
    </Variants>
  )
}

function TagDemo(): ReactElement {
  return (
    <Variants size="sm">
      {TAG_TONES.map((tone) => (
        <Variant key={tone} label={tone}>
          <Tag tone={tone}>{tone}</Tag>
        </Variant>
      ))}
    </Variants>
  )
}

function PillDemo(): ReactElement {
  const [chosen, setChosen] = useState<'preview' | 'source'>('preview')
  return (
    <Variants size="sm">
      <Variant label="static">
        <Pill>Static</Pill>
      </Variant>
      <Variant label="static · active">
        <Pill active>Static</Pill>
      </Variant>
      <Variant label="interactive">
        <Pill active={chosen === 'preview'} onClick={() => { setChosen('preview') }}>Preview</Pill>
      </Variant>
      <Variant label="interactive · unselected">
        <Pill active={chosen === 'source'} onClick={() => { setChosen('source') }}>Source</Pill>
      </Variant>
    </Variants>
  )
}

function SwitchDemo(): ReactElement {
  const [on, setOn] = useState(true)
  const [off, setOff] = useState(false)
  return (
    <Variants size="sm">
      <Variant label="checked">
        <Switch checked={on} onChange={setOn} label="Checked switch" />
      </Variant>
      <Variant label="unchecked">
        <Switch checked={off} onChange={setOff} label="Unchecked switch" />
      </Variant>
      <Variant label="disabled · checked">
        <Switch checked disabled onChange={() => {}} label="Disabled checked switch" />
      </Variant>
      <Variant label="disabled · unchecked">
        <Switch checked={false} disabled onChange={() => {}} label="Disabled unchecked switch" />
      </Variant>
    </Variants>
  )
}

/**
 * This package's field: the shell's control, plus the one typed spelling of
 * `data-modal-autofocus`.
 *
 * The catalog used to carry two entries — the shell's `Input` and this
 * package's wrapper — and they drew the same control. A reader looking for "the
 * text field" found two pages that differed by one prop, which made the wrapper
 * look like a second component rather than the one plugins import. There is one
 * entry now, and its samples include the autofocus case that is the only
 * reason the wrapper exists.
 */
function InputDemo(): ReactElement {
  return (
    <Variants>
      <Variant label="empty">
        <Input className="demo-field" placeholder="Placeholder" />
      </Variant>
      <Variant label="with icon">
        <Input className="demo-field" icon={<IconCopy />} placeholder="Search" />
      </Variant>
      <Variant label="filled">
        <Input className="demo-field" defaultValue="A value" />
      </Variant>
      <Variant label="disabled">
        <Input className="demo-field" disabled defaultValue="A value" />
      </Variant>
      <Variant label="modalAutofocus">
        <Input className="demo-field" modalAutofocus placeholder="Takes the dialog's focus" />
      </Variant>
    </Variants>
  )
}

/** A segmented control, and the same one with a locked segment. */
function SegmentedControlDemo(): ReactElement {
  const [mode, setMode] = useState<'preview' | 'source' | 'diff'>('preview')
  return (
    <Variants size="lg">
      <Variant label="three segments">
        <div className="demo-frame">
          <SegmentedControl
            id="demo-segments"
            value={mode}
            onChange={setMode}
            label="View mode"
            options={[
              { value: 'preview', label: 'Preview' },
              { value: 'source', label: 'Source' },
              { value: 'diff', label: 'Diff' },
            ]}
          />
        </div>
      </Variant>
      <Variant label="segment disabled">
        <div className="demo-frame">
          <SegmentedControl
            id="demo-segments-locked"
            value={mode}
            onChange={setMode}
            label="View mode with a locked segment"
            options={[
              { value: 'preview', label: 'Preview' },
              { value: 'source', label: 'Source', disabled: true },
              { value: 'diff', label: 'Diff' },
            ]}
          />
        </div>
      </Variant>
    </Variants>
  )
}

/** The tab strip, in both sizes. */
function SegmentedTabsDemo(): ReactElement {
  const [tab, setTab] = useState<'conversation' | 'trajectory'>('conversation')
  return (
    <Variants size="lg">
      <Variant label="md">
        <div className="demo-tabs">
          <SegmentedTabs
            value={tab}
            onChange={setTab}
            label="Detail views"
            items={[
              { value: 'conversation', label: 'Conversation', id: 'tab-md-conversation', panelId: 'tab-md-conversation-panel' },
              { value: 'trajectory', label: 'Trajectory', id: 'tab-md-trajectory', panelId: 'tab-md-trajectory-panel' },
            ]}
          />
        </div>
      </Variant>
      <Variant label="sm">
        <div className="demo-tabs">
          <SegmentedTabs
            size="sm"
            value={tab}
            onChange={setTab}
            label="Detail views, compact"
            items={[
              { value: 'conversation', label: 'Conversation', id: 'tab-sm-conversation', panelId: 'tab-sm-conversation-panel' },
              { value: 'trajectory', label: 'Trajectory', id: 'tab-sm-trajectory', panelId: 'tab-sm-trajectory-panel' },
            ]}
          />
        </div>
      </Variant>
    </Variants>
  )
}

/** The settings field's four states, each with the props a row needs to reach it. */
function SettingsValueFieldDemo(): ReactElement {
  const [text, setText] = useState('0.5')
  return (
    <Variants size="lg">
      <Variant label="valid">
        <SettingsValueField
          id="demo-settings-valid"
          label="Sampling temperature"
          hint="Between 0 and 1."
          text={text}
          overridden={false}
          invalid={false}
          overriddenLabel="Overridden"
          resetLabel="Reset"
          invalidLabel="Not a number between 0 and 1"
          disabled={false}
          numeric
          onEdit={setText}
          onReset={() => { setText('0.5') }}
        />
      </Variant>
      <Variant label="invalid">
        <SettingsValueField
          id="demo-settings-invalid"
          label="Sampling temperature"
          hint="Between 0 and 1."
          text="2"
          overridden={false}
          invalid
          overriddenLabel="Overridden"
          resetLabel="Reset"
          invalidLabel="Not a number between 0 and 1"
          disabled={false}
          numeric
          onEdit={() => {}}
          onReset={() => {}}
        />
      </Variant>
      <Variant label="overridden">
        <SettingsValueField
          id="demo-settings-overridden"
          label="Sampling temperature"
          hint="Between 0 and 1."
          text={text}
          overridden
          invalid={false}
          overriddenLabel="Overridden"
          resetLabel="Reset"
          invalidLabel="Not a number between 0 and 1"
          disabled={false}
          numeric
          onEdit={setText}
          onReset={() => { setText('0.5') }}
        />
      </Variant>
      <Variant label="disabled">
        <SettingsValueField
          id="demo-settings-disabled"
          label="Sampling temperature"
          hint="Between 0 and 1."
          text="0.5"
          overridden={false}
          invalid={false}
          overriddenLabel="Overridden"
          resetLabel="Reset"
          invalidLabel="Not a number between 0 and 1"
          disabled
          numeric
          onEdit={() => {}}
          onReset={() => {}}
        />
      </Variant>
    </Variants>
  )
}

/** The dialog, opened in its default and warning tones. */
function ModalDemo(): ReactElement {
  const [open, setOpen] = useState(false)
  const [warning, setWarning] = useState(false)

  const show = (tone: boolean): void => {
    setWarning(tone)
    setOpen(true)
  }

  return (
    <>
      <Variants>
        <Variant label="default">
          <Button variant="outline" onClick={() => { show(false) }}>Open dialog</Button>
        </Variant>
        <Variant label="warning">
          <Button variant="outline" onClick={() => { show(true) }}>Open warning</Button>
        </Variant>
      </Variants>
      <Modal
        open={open}
        onClose={() => { setOpen(false) }}
        title={warning ? 'Delete this session?' : 'Rename the session'}
        closeLabel="Close"
        {...warning ? { tone: 'warning' as const, description: 'This cannot be undone.' } : {}}
        footer={(
          <>
            <Button onClick={() => { setOpen(false) }}>Cancel</Button>
            <Button variant="primary" onClick={() => { setOpen(false) }}>
              {warning ? 'Delete' : 'Rename'}
            </Button>
          </>
        )}
      >
        {warning
          ? <p className="demo-prose">The transcript is removed from this workspace. Other sessions keep their own copies.</p>
          : <Input className="demo-field" modalAutofocus defaultValue="Session name" />}
      </Modal>
    </>
  )
}

/** The tooltip, on three sides, with and without keycaps. */
function TooltipDemo(): ReactElement {
  return (
    <Variants size="sm">
      <Variant label="right">
        <Tooltip label="Copied to the clipboard" side="right">
          <Button variant="outline" icon={<IconCopy />}>Hover</Button>
        </Tooltip>
      </Variant>
      <Variant label="bottom · shortcut">
        <Tooltip label="Copy the selection" side="bottom" shortcutKeys={['Mod', 'C']}>
          <Button variant="outline" icon={<IconCopy />}>Hover</Button>
        </Tooltip>
      </Variant>
      <Variant label="top">
        <Tooltip label="Removes the file" side="top">
          <Button variant="outline" icon={<IconTrash />}>Hover</Button>
        </Tooltip>
      </Variant>
    </Variants>
  )
}

export const SHELL_ENTRIES: readonly CatalogEntry[] = [
  {
    id: 'button',
    name: 'Button',
    summary: 'The shell\'s button atom: four fill families, two control sizes, an optional leading icon.',
    file: '@deepseek-ai/dsh-client-ui-primitives/src/Button.tsx',
    Demo: ButtonDemo,
    props: [
      { name: 'variant', type: "'primary' | 'ghost' | 'outline' | 'toolbar'", default: "'ghost'", description: 'Which family paints the fill. `outline` draws a DPR-aware inset hairline.' },
      { name: 'size', type: "'md' | 'sm'", default: "'md'", description: '`md` is the 36px control with 12px corners; `sm` is 28px with 8px.' },
      { name: 'icon', type: 'ReactNode', description: 'Optional leading 16px glyph, drawn before the label.' },
      { name: 'className', type: 'string', description: 'Extra class for layout placement.' },
      { name: 'children', type: 'ReactNode', description: 'The label. Owned by the render site, never by the control.' },
      { name: '…rest', type: 'ButtonHTMLAttributes<HTMLButtonElement>', description: 'Native button attributes pass through: `disabled`, `onClick`, `title`, `aria-*`.' },
    ],
  },
  {
    id: 'tag',
    name: 'Tag',
    summary: 'A read-only capsule badge in eight tones. The selectable capsule is `Pill`.',
    file: '@deepseek-ai/dsh-client-ui-primitives/src/Tag.tsx',
    Demo: TagDemo,
    props: [
      { name: 'tone', type: "'outline' | 'solid' | 'neutral' | 'quiet' | 'success' | 'info' | 'warning' | 'danger'", default: "'outline'", description: 'Which palette the badge paints. `outline` is the read-only default; `solid` is the inverted fill for the current selection.' },
      { name: 'className', type: 'string', description: 'Extra class for layout placement.' },
      { name: 'children', type: 'ReactNode', description: 'The localized label.' },
    ],
  },
  {
    id: 'pill',
    name: 'Pill',
    summary: 'A 24px capsule chip: a static span, or a button once it is given `onClick`.',
    file: '@deepseek-ai/dsh-client-ui-primitives/src/Pill.tsx',
    Demo: PillDemo,
    props: [
      { name: 'active', type: 'boolean', default: 'false', description: 'Draws the selected fill.' },
      { name: 'onClick', type: '(event) => void', description: 'Supplying it turns the chip into a `<button>`; omitting it leaves a `<span>`.' },
      { name: 'className', type: 'string', description: 'Extra class for layout placement.' },
      { name: 'children', type: 'ReactNode', description: 'The label.' },
      { name: '…rest', type: 'ButtonHTMLAttributes<HTMLButtonElement>', description: 'Button attributes, forwarded in the interactive shape only.' },
    ],
  },
  {
    id: 'switch',
    name: 'Switch',
    summary: 'A controlled two-state toggle. `label` is required, so the control cannot ship unnamed.',
    file: '@deepseek-ai/dsh-client-ui-primitives/src/Switch.tsx',
    Demo: SwitchDemo,
    props: [
      { name: 'checked', type: 'boolean', description: 'The current state. Required: the control holds nothing itself.' },
      { name: 'onChange', type: '(next: boolean) => void', description: 'Receives the state the press asks for.' },
      { name: 'label', type: 'string', description: 'The accessible name. Required, with no default.' },
      { name: 'disabled', type: 'boolean', default: 'false', description: 'Refuses input. Owners also set it while a write is in flight.' },
      { name: 'title', type: 'string', description: 'Hover text, typically why the control is locked.' },
      { name: 'className', type: 'string', description: 'Extra class for layout placement.' },
    ],
  },
  {
    id: 'input',
    name: 'Input',
    summary: 'The shell\'s single-line text field with an optional 16px leading icon, plus one typed spelling of `data-modal-autofocus` for the field a `Modal` should focus first.',
    file: 'packages/ui/src/input.tsx',
    Demo: InputDemo,
    props: [
      { name: 'icon', type: 'ReactNode', description: 'Optional 16px leading glyph, drawn in the field\'s gutter.' },
      { name: 'className', type: 'string', description: 'Extra class for the frame that carries the border and fill.' },
      { name: 'modalAutofocus', type: 'boolean', default: 'false', description: 'Writes `data-modal-autofocus`, the attribute the shell\'s `Modal` reads to pick initial focus. Prefer it over React\'s `autoFocus`: the layer stack restores focus to the opener, and `autoFocus` runs before that stack can record it.' },
      { name: '…rest', type: 'InputHTMLAttributes<HTMLInputElement>', description: 'Native input attributes pass through.' },
    ],
  },
  {
    id: 'segmented-control',
    name: 'SegmentedControl',
    summary: 'A tablist of equal-width segments with one sliding indicator, for switching a panel between a few modes.',
    file: '@deepseek-ai/dsh-client-ui-primitives/src/SegmentedControl.tsx',
    Demo: SegmentedControlDemo,
    props: [
      { name: 'id', type: 'string', description: 'Base id: each tab is `<id>-<value>` and names `<id>-<value>-panel` as the panel it controls.' },
      { name: 'value', type: 'Value', description: 'The selected option. Required: the owner holds the selection.' },
      { name: 'options', type: 'readonly SegmentedControlOption<Value>[]', description: 'The segments in display order; at least two.' },
      { name: 'onChange', type: '(next: Value) => void', description: 'Receives the value a click or a walk key asks for, never the selected one.' },
      { name: 'label', type: 'string', description: 'The tablist\'s accessible name. Required.' },
      { name: 'disabled', type: 'boolean', default: 'false', description: 'Locks every segment, typically while the shown panel has a write in flight.' },
      { name: 'className', type: 'string', description: 'Extra class for layout placement.' },
    ],
  },
  {
    id: 'segmented-tabs',
    name: 'SegmentedTabs',
    summary: 'Equal-width controlled tabs with a sliding selection indicator; the panels stay with the caller.',
    file: '@deepseek-ai/dsh-client-ui-primitives/src/SegmentedTabs.tsx',
    Demo: SegmentedTabsDemo,
    props: [
      { name: 'items', type: 'readonly [SegmentedTab<Value>, ...SegmentedTab<Value>[]]', description: 'Non-empty ordered tabs with unique values and DOM ids. The tuple type is what stops an empty list.' },
      { name: 'value', type: 'Value', description: 'The selected value, which must belong to `items`.' },
      { name: 'onChange', type: '(value: Value) => void', description: 'Selection asked for by click, Left/Right, or Home/End.' },
      { name: 'label', type: 'string', description: 'The tab list\'s accessible name. Required.' },
      { name: 'size', type: "'sm' | 'md'", default: "'md'", description: '`sm` draws 30px tabs with a 2px inset; `md` draws 34px tabs with a 4px inset.' },
      { name: 'className', type: 'string', description: 'Extra class for layout placement.' },
    ],
  },
  {
    id: 'settings-value-field',
    name: 'SettingsValueField',
    summary: 'A labelled settings input that stages a draft: valid, invalid, overridden and disabled, plus the reset that clears an override.',
    file: '@deepseek-ai/dsh-client-ui-primitives/src/settings-form/fields.tsx',
    Demo: SettingsValueFieldDemo,
    props: [
      { name: 'id', type: 'string', description: 'Associates the label with the control.' },
      { name: 'label', type: 'string', description: 'The visible label.' },
      { name: 'text', type: 'string', description: 'The draft the control renders.' },
      { name: 'invalid', type: 'boolean', description: 'Marks the draft as one this field does not accept, and swaps the hint for `invalidLabel`.' },
      { name: 'overridden', type: 'boolean', description: 'Shows the overridden badge and the reset control.' },
      { name: 'disabled', type: 'boolean', description: 'Disables every control in the field.' },
      { name: 'hint', type: 'string', description: 'One-line explanation under the control.' },
      { name: 'numeric', type: 'boolean', default: 'false', description: 'Hints a numeric keypad without narrowing what the field accepts.' },
      { name: 'onEdit', type: '(text: string) => void', description: 'Stages the draft. The control never writes.' },
      { name: 'onReset', type: '() => void', description: 'Stages a clear so the field re-inherits its composition layer.' },
    ],
  },
  {
    id: 'modal',
    name: 'Modal',
    summary: 'A body-portaled dialog. It owns the mask, the focus walk, Escape and returning focus to the opener — which is why no plugin re-implements it.',
    file: '@deepseek-ai/dsh-client-ui-primitives/src/Modal.tsx',
    Demo: ModalDemo,
    props: [
      { name: 'open', type: 'boolean', description: 'Whether the dialog is showing. The owner controls it.' },
      { name: 'onClose', type: '() => void', description: 'Called by the close command, Escape, or a mask click — but an open menu inside takes Escape first.' },
      { name: 'title', type: 'string', description: 'The dialog heading, also its accessible name.' },
      { name: 'closeLabel', type: 'string', description: 'The close button\'s accessible name. Required unless `headless`.' },
      { name: 'description', type: 'string', description: 'Optional supporting sentence under the title.' },
      { name: 'tone', type: "'warning'", description: 'Adds the amber title glyph and tighter title-to-body spacing.' },
      { name: 'footer', type: 'ReactNode', description: 'The action row.' },
      { name: 'headless', type: 'boolean', default: 'false', description: 'Renders children directly in the card, keeping the mask, card, Escape and accessible name.' },
      { name: 'backdropBlur', type: 'boolean', default: 'true', description: 'Turn it off when the caller already blurs the page.' },
    ],
  },
  {
    id: 'tooltip',
    name: 'Tooltip',
    summary: 'A hover and focus bubble clamped to the viewport, with optional shortcut keycaps.',
    file: '@deepseek-ai/dsh-client-ui-primitives/src/Tooltip.tsx',
    Demo: TooltipDemo,
    props: [
      { name: 'label', type: 'string | (() => string)', description: 'The bubble text, or a resolver evaluated only while visible.' },
      { name: 'shortcutKeys', type: 'readonly string[]', description: 'Key labels drawn as keycaps after the text.' },
      { name: 'side', type: "'top' | 'right' | 'bottom' | 'left'", default: "'right'", description: 'The preferred placement. Fitting tries the opposite side, then the perpendicular ones.' },
      { name: 'align', type: "'center' | 'end'", default: "'center'", description: 'Horizontal alignment for `bottom`/`top` bubbles.' },
      { name: 'delayMs', type: 'number', default: '0', description: 'Hover delay before the bubble appears.' },
      { name: 'focusDelayMs', type: 'number', default: '0', description: 'Keyboard-focus delay before the bubble appears.' },
      { name: 'gap', type: 'number', default: '8', description: 'Anchor-to-bubble distance for `bottom`/`top`; horizontal placements use 10.' },
      { name: 'disabled', type: 'boolean', default: 'false', description: 'Suppresses the bubble without remounting the anchor.' },
      { name: 'portal', type: 'boolean', default: 'false', description: 'Renders the bubble under `document.body`, so an ancestor cannot clip it.' },
      { name: 'children', type: 'ReactElement', description: 'A single anchor element; its own ref and handlers are chained, not replaced.' },
    ],
  },
]
