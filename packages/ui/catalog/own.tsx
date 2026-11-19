/**
 * This package's own components — the ones whose appearance the package owns.
 *
 * Every rule they draw with lives in `UI_CSS`, and every value in those rules is
 * a `--dsw-*` token, which is why these previews are worth looking at next to the
 * shell's: a change to a token or to the shared sheet shows up here, and nowhere
 * else in the repository before it ships.
 *
 * Unlike the shell entries, these tables are checked. The `PropRow` type is
 * parameterised by `keyof` the component's real props, so a renamed or deleted
 * prop fails `pnpm --check-types` instead of leaving a table describing an API
 * the package no longer has.
 */

import { useEffect, useRef, useState, type ReactElement } from 'react'
import type { PanelBounds } from '../src/layout/resizable-panel.js'
import type { ResizeHandleProps } from '../src/layout/resize-handle.js'
import type { PanelScrollProps } from '../src/panel/panel-scroll.js'
import type { PanelShadowProps } from '../src/panel/panel-shadow.js'
import { PanelScroll } from '../src/panel/panel-scroll.js'
import { PanelShadow } from '../src/panel/panel-shadow.js'
import { ResizablePanel, type ResizablePanelProps } from '../src/layout/resizable-panel-view.js'
import { ResizeHandle } from '../src/layout/resize-handle.js'
import type { CatalogEntry } from './types.js'
import { Variant, Variants } from './ui.js'

/** Enough rows that a panel has something to scroll. */
const ROWS = Array.from({ length: 24 }, (_, index) => `Row ${String(index + 1)}`)

function PanelScrollDemo(): ReactElement {
  return (
    <Variants size="lg">
      <Variant label="direction · both" tall>
        <PanelScroll className="demo-panel" barWidth={6}>
          <ul className="demo-list">
            {ROWS.map((row) => <li key={row} className="demo-list-row">{row}</li>)}
          </ul>
        </PanelScroll>
      </Variant>
      <Variant label="direction · y" tall>
        <PanelScroll className="demo-panel" direction="y" hideDelay={0}>
          <ul className="demo-list">
            {ROWS.map((row) => <li key={row} className="demo-list-row">{row}</li>)}
          </ul>
        </PanelScroll>
      </Variant>
      <Variant label="barWidth · 3" tall>
        <PanelScroll className="demo-panel" barWidth={3}>
          <ul className="demo-list">
            {ROWS.map((row) => <li key={row} className="demo-list-row">{row}</li>)}
          </ul>
        </PanelScroll>
      </Variant>
      <Variant label="barOpacity · 0.4" tall>
        <PanelScroll className="demo-panel" barOpacity={0.4}>
          <ul className="demo-list">
            {ROWS.map((row) => <li key={row} className="demo-list-row">{row}</li>)}
          </ul>
        </PanelScroll>
      </Variant>
    </Variants>
  )
}

function PanelShadowDemo(): ReactElement {
  return (
    <Variants size="lg">
      <Variant label="axis · y" tall>
        <PanelShadow className="demo-panel" shadeSize={28}>
          <ul className="demo-list">
            {ROWS.map((row) => <li key={row} className="demo-list-row">{row}</li>)}
          </ul>
        </PanelShadow>
      </Variant>
      <Variant label="axis · y · shadeSize 12" tall>
        <PanelShadow className="demo-panel" shadeSize={12}>
          <ul className="demo-list">
            {ROWS.map((row) => <li key={row} className="demo-list-row">{row}</li>)}
          </ul>
        </PanelShadow>
      </Variant>
      <Variant label="axis · x" tall>
        <PanelShadow className="demo-panel demo-panel-wide" axis="x">
          <p className="demo-long-line">A single line far wider than the pane, so the shade has an edge to dissolve on.</p>
        </PanelShadow>
      </Variant>
      <Variant label="content fits · no shade" tall>
        <PanelShadow className="demo-panel">
          <ul className="demo-list">
            {ROWS.slice(0, 2).map((row) => <li key={row} className="demo-list-row">{row}</li>)}
          </ul>
        </PanelShadow>
      </Variant>
    </Variants>
  )
}

/**
 * The bounds the demo column is drawn and clamped by.
 *
 * Exported so the entry point can build the same geometry rule from the same
 * numbers: a drag and a stylesheet that disagreed about the narrowest sidebar
 * would be a divider that stops where the pointer does not.
 */
export const PANEL_DEMO = {
  property: '--demo-side-width',
  bounds: { fallback: 220, min: 160, max: 380, mainMin: 160 } as PanelBounds,
} as const

function ResizablePanelDemo(): ReactElement {
  const root = useRef<HTMLDivElement>(null)
  const pane = useRef<HTMLElement>(null)
  const [drawn, setDrawn] = useState<number>(PANEL_DEMO.bounds.fallback)

  // The component writes each drag straight to a custom property on the root —
  // it never renders React, which is what keeps a drag's frame rate independent
  // of the page. So the number under the column cannot come from state; it comes
  // from measuring the box the pointer actually resized.
  useEffect(() => {
    const element = pane.current
    if (element === null || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => {
      setDrawn(Math.round(element.getBoundingClientRect().width))
    })
    observer.observe(element)
    return () => { observer.disconnect() }
  }, [])

  return (
    <Variants size="lg">
      <Variant label="drag the boundary" span tall>
        <div className="demo-split" ref={root}>
          <ResizablePanel
            className="demo-side"
            root={root}
            property={PANEL_DEMO.property}
            bounds={PANEL_DEMO.bounds}
            paneRef={pane}
          >
            <div className="demo-side-body">
              <p className="demo-side-width">{drawn}px drawn</p>
              <button
                type="button"
                className="demo-reset"
                onClick={() => { root.current?.style.setProperty(PANEL_DEMO.property, `${PANEL_DEMO.bounds.fallback}px`) }}
              >
                Reset
              </button>
            </div>
          </ResizablePanel>
          <div className="demo-main">
            <p>The rest of the page takes every pixel the column does not.</p>
          </div>
        </div>
      </Variant>
    </Variants>
  )
}

/**
 * The gesture on its own, without `ResizablePanel` wiring a property for it.
 *
 * The demo follows the contract the component documents rather than the shape
 * that is easiest to write: `onDrag` writes the size straight to the box's own
 * style, because a drag that rendered React would cost a frame proportional to
 * whatever the page happens to be drawing. State is set at the commit only, so
 * the number under the box is what a release recorded — not what the pointer is
 * passing through.
 */
function ResizeHandleDemo(): ReactElement {
  const colBox = useRef<HTMLDivElement>(null)
  const rowBox = useRef<HTMLDivElement>(null)
  const [col, setCol] = useState(180)
  const [row, setRow] = useState(80)

  /** Clamp a pointer-implied size into what this box may be drawn at. */
  const fitCol = (size: number): number => Math.max(80, Math.min(360, size))
  /** Clamp a vertical drag the same way. */
  const fitRow = (size: number): number => Math.max(40, Math.min(160, size))

  return (
    <Variants size="lg">
      <Variant label="axis · col" span>
        <div className="demo-gesture">
          <div className="demo-gesture-box" ref={colBox} style={{ width: col }}>
            <span>{Math.round(col)}px</span>
            <ResizeHandle
              axis="col"
              onStart={() => colBox.current?.getBoundingClientRect().width ?? col}
              onDrag={(size) => { colBox.current?.style.setProperty('width', `${String(fitCol(size))}px`) }}
              onCommit={(size) => { setCol(fitCol(size)) }}
              onEnd={() => { colBox.current?.style.setProperty('width', `${String(col)}px`) }}
            />
          </div>
          <div className="demo-gesture-rest" />
        </div>
      </Variant>
      <Variant label="axis · row" span>
        <div className="demo-gesture demo-gesture-column">
          <div className="demo-gesture-box demo-gesture-box-row" ref={rowBox} style={{ height: row }}>
            <span>{Math.round(row)}px</span>
            <ResizeHandle
              axis="row"
              onStart={() => rowBox.current?.getBoundingClientRect().height ?? row}
              onDrag={(size) => { rowBox.current?.style.setProperty('height', `${String(fitRow(size))}px`) }}
              onCommit={(size) => { setRow(fitRow(size)) }}
              onEnd={() => { rowBox.current?.style.setProperty('height', `${String(row)}px`) }}
            />
          </div>
          <div className="demo-gesture-rest" />
        </div>
      </Variant>
    </Variants>
  )
}

/**
 * One row of a checked props table.
 *
 * `Keys` is the union of `keyof` the component's real props, so a row that names
 * a renamed or removed prop fails the typecheck instead of leaving a table that
 * describes an API the package no longer has. `…rest` is the one exception: a
 * table summarising the native attributes a component forwards cannot enumerate
 * them, so the catch-all is spelled once, here, rather than loosening every row
 * to `string` and losing the check.
 */
type PropName<Keys extends string> = {
  readonly name: Keys | '…rest'
  readonly type: string
  readonly default?: string
  readonly description: string
}

export const OWN_ENTRIES: readonly CatalogEntry[] = [
  {
    id: 'panel-scroll',
    name: 'PanelScroll',
    summary: 'A scroll container whose bar follows the pointer, and whose scrollable axes are a decision rather than a side effect of `overflow: auto`.',
    file: 'packages/ui/src/panel/panel-scroll.tsx',
    Demo: PanelScrollDemo,
    props: [
      { name: 'direction', type: "'none' | 'both' | 'x' | 'y'", default: "'both'", description: 'Which axes the port scrolls on. `none` clips instead of scrolling.' },
      { name: 'barOpacity', type: 'number', default: '1', description: 'The thumb\'s alpha, 0..1. `0` keeps the bar\'s box — and so the layout — while painting nothing.' },
      { name: 'barWidth', type: 'number', default: '5', description: 'The bar\'s width in CSS pixels, capped at 32.' },
      { name: 'hideDelay', type: 'number', default: '1', description: 'Seconds the bar stays after the pointer leaves. `0` means it leaves with the pointer.' },
      { name: '…rest', type: 'HTMLAttributes<HTMLDivElement>', description: 'Any attribute a `div` takes, plus a forwarded ref to the scrollport.' },
    ] satisfies readonly PropName<keyof PanelScrollProps>[],
  },
  {
    id: 'panel-shadow',
    name: 'PanelShadow',
    summary: 'A scroll container that dissolves its own edges where content continues — a mask, so whatever is behind the pane shows through.',
    file: 'packages/ui/src/panel/panel-shadow.tsx',
    Demo: PanelShadowDemo,
    props: [
      { name: 'axis', type: "'x' | 'y'", default: "'y'", description: 'The axis whose edges dissolve. Only one may be chosen: a pane shaded on both axes is a frame that says nothing in particular.' },
      { name: 'shadeSize', type: 'number', default: '28', description: 'How far the shade reaches in from each edge, in CSS pixels. Matching a row\'s height makes the dissolve read as one row.' },
      { name: 'direction', type: "'none' | 'both' | 'x' | 'y'", default: "'both'", description: 'Which axes the port scrolls on, exposed so a pane can shade `y` and still allow a horizontal gesture.' },
      { name: 'barOpacity', type: 'number', default: '1', description: 'The thumb\'s alpha, 0..1.' },
      { name: 'barWidth', type: 'number', default: '5', description: 'The bar\'s width in CSS pixels.' },
      { name: 'hideDelay', type: 'number', default: '1', description: 'Seconds the bar stays after the pointer leaves.' },
      { name: '…rest', type: 'HTMLAttributes<HTMLDivElement>', description: 'Any attribute a `div` takes, plus a forwarded ref to the scrollport.' },
    ] satisfies readonly PropName<keyof PanelShadowProps>[],
  },
  {
    id: 'resizable-panel',
    name: 'ResizablePanel',
    summary: 'A fixed column beside an absorbing pane, with the reader dragging the boundary. The page keeps its own canvas, rows and chrome.',
    file: 'packages/ui/src/layout/resizable-panel-view.tsx',
    Demo: ResizablePanelDemo,
    props: [
      { name: 'root', type: 'RefObject<HTMLElement | null>', description: 'The page root. The width property and `data-resizing` are written to it, which is what lets a drag move the boundary without rendering React.' },
      { name: 'property', type: '`--${string}`', description: 'The custom property that draws the width, e.g. `--dsh-ct-side-width`.' },
      { name: 'bounds', type: 'PanelBounds', description: 'The width\'s floor, cap, fallback and the neighbouring pane\'s floor. `resizablePanelCss` builds the matching rule from the same object.' },
      { name: 'store', type: 'PanelStore', description: 'Where the width is remembered. Omitted, it lives only while the page is open.' },
      { name: 'side', type: "'start' | 'end'", default: "'end'", description: 'Which edge carries the boundary, and which way a drag grows the column.' },
      { name: 'paneRef', type: 'Ref<HTMLElement>', description: 'The column\'s own element, for a caller that has to measure it.' },
      { name: '…rest', type: 'HTMLAttributes<HTMLElement>', description: 'Any attribute an `<aside>` takes: `className`, `aria-label`.' },
    ] satisfies readonly PropName<keyof ResizablePanelProps>[],
  },
  {
    id: 'resize-handle',
    name: 'ResizeHandle',
    summary: 'The one pointer gesture behind every resizable boundary: capture, at most one callback a frame, a click that records nothing, a cancel that puts the page back.',
    file: 'packages/ui/src/layout/resize-handle.tsx',
    Demo: ResizeHandleDemo,
    props: [
      { name: 'axis', type: "'col' | 'row'", description: 'Which pointer coordinate drives the gesture, and where the line is drawn.' },
      { name: 'side', type: "'start' | 'end'", default: "'end'", description: 'Which edge of the pane the boundary sits on. A near-edge boundary grows the pane against the axis.' },
      { name: 'onStart', type: '() => number', description: 'The size the page is drawing as the gesture starts, in CSS pixels.' },
      { name: 'onDrag', type: '(size: number) => void', description: 'Draw the size the pointer now implies. Called at most once a frame; must not render React.' },
      { name: 'onCommit', type: '(size: number) => void', description: 'Record and draw the size the gesture settled on.' },
      { name: 'onEnd', type: '() => void', description: 'The gesture ended without a size — draw the recorded layout again.' },
    ] satisfies readonly PropName<keyof ResizeHandleProps>[],
  },
]
