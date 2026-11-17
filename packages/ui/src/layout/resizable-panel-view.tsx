/**
 * A panel beside an absorbing pane, with the reader setting its width.
 *
 * The shape three pages share: a fixed column on one side of the page, a
 * neighbouring pane taking the rest, and a boundary between them that the reader
 * drags. What this component owns is only the seam — the column's box, the
 * boundary on its edge, and the width both of them are measured against. The page
 * keeps its root, its surface, its rows and its own chrome: a component that
 * painted a canvas would cover a theme's wallpaper for the whole tab, and that
 * decision is the page's to make.
 *
 * The width is written to a custom property on the page root rather than to this
 * element's inline style, because that is what lets a drag move the boundary from
 * the pointer without rendering React — the frame rate of a drag stays
 * independent of how many rows the column happens to be drawing. Only the
 * release renders, and only to record what was chosen.
 *
 * Everything drawn inside is the caller's: the header, the scrolling list, the
 * footer. This component adds no padding, no surface and no text, so a page's own
 * rhythm survives being wrapped in it unchanged.
 */

import {
  useCallback,
  useRef,
  type HTMLAttributes,
  type ReactElement,
  type Ref,
  type RefObject,
} from 'react'
import { ResizeHandle } from './resize-handle.js'
import {
  useResizablePanel,
  widthFit,
  type PanelBounds,
  type PanelStore,
} from './resizable-panel.js'

/** What {@link ResizablePanel} takes. */
export interface ResizablePanelProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  /** The page root: the width property and `data-resizing` are written to it. */
  readonly root: RefObject<HTMLElement | null>
  /** The custom property that draws the width, e.g. `--dsh-ct-side-width`. */
  readonly property: `--${string}`
  /** The width's floor, cap, fallback and the neighbouring pane's floor. */
  readonly bounds: PanelBounds
  /** Where the width is remembered. Omitted, it lives only while the page is open. */
  readonly store?: PanelStore
  /**
   * Which side of the page the column sits on.
   *
   * Decides which edge carries the boundary and which way a drag grows it: a
   * column on the left has its boundary on its right edge (`end`), which is also
   * how a drag grows it. A right-hand column is the mirrored case.
   *
   * @default 'end'
   */
  readonly side?: 'start' | 'end'
  /**
   * The column's own element, for a caller that has to measure it.
   *
   * The Git tab's split divides the space below its toolbar, so it needs this
   * box's height; the component already measures the same element for a drag, and
   * one ref filled from both is the only arrangement in which the caller cannot
   * silently replace the component's own measurement.
   */
  readonly paneRef?: Ref<HTMLElement>
  /** The column's contents. */
  readonly children?: React.ReactNode
}

/**
 * Render a panel whose width the reader drags.
 *
 * The element is an `<aside>` and takes any attribute one takes, so a page that
 * already had `className` and `aria-label` on its sidebar keeps both.
 *
 * @param props - the page root, the property and bounds, the side, and the column's contents.
 * @returns the aside element with its boundary.
 */
export function ResizablePanel(props: ResizablePanelProps): ReactElement {
  const { root, property, bounds, store, side = 'end', paneRef, children, ...rest } = props
  /** This column's own box, which is what a drag measures and what the boundary is placed on. */
  const pane = useRef<HTMLElement | null>(null)

  /** Fill the caller's ref from the same element the component measures. */
  const attach = useCallback((element: HTMLElement | null): void => {
    pane.current = element
    if (typeof paneRef === 'function') paneRef(element)
    else if (paneRef !== undefined && paneRef !== null) {
      (paneRef as { current: HTMLElement | null }).current = element
    }
  }, [paneRef])

  /** The room the boundary may move through: the page's own width. */
  const room = useCallback((): number => root.current?.getBoundingClientRect().width ?? 0, [root])

  /** Paint one width on the page root, without rendering. */
  const draw = useCallback((width: number): void => {
    root.current?.style.setProperty(property, `${width}px`)
  }, [root, property])

  const panel = useResizablePanel({
    root,
    axis: 'col',
    side,
    bounds,
    store,
    measure: useCallback(
      () => pane.current?.getBoundingClientRect().width ?? bounds.fallback,
      [bounds.fallback],
    ),
    room,
    fit: widthFit(bounds),
    draw,
  })

  return (
    <aside {...rest} ref={attach}>
      {children}
      <ResizeHandle {...panel.handle} />
    </aside>
  )
}
