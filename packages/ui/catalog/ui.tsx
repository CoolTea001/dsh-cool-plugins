/**
 * The two pieces of catalog chrome: a variants grid and a props table.
 *
 * Both are deliberately plain markup. The page's subject is the components, and
 * chrome that competed with them would make a preview of a quiet control look
 * like a preview of a busy one — the same reasoning the icon catalog follows.
 */

import type { ReactElement, ReactNode } from 'react'
import type { PropRow } from './types.js'

/**
 * How much room a tile asks for.
 *
 * A catalog's grid cannot please every demo at one width: `Tag` and `Switch`
 * drawn in a 340px tile are two small controls centred in a lot of nothing,
 * while `PanelScroll` drawn in a 200px tile is a bar pressed against the edge.
 * So the width belongs to the demo — the one that knows what shape its
 * component wants — and the grid only supplies the scale:
 *
 * - `sm` — a control judged on its own: a button, a tag, a switch.
 * - `md` — a control whose shape is a short row: a field, a dialog trigger, a
 *   panel. The default, because most controls are one.
 * - `lg` — a control that is itself a strip: a segmented control, a group of
 *   buttons, a pane whose edges only mean something with area.
 *
 * Tiles still stretch to fill the row (`auto-fit`), so a demo with two samples
 * ends up with two half-width tiles rather than a half-empty row.
 */
export type TileSize = 'sm' | 'md' | 'lg'

/** The grid every demo draws its samples into. */
export function Variants(
  { size = 'md', children }: {
    /** The smallest width one tile may be drawn at. */
    readonly size?: TileSize
    readonly children: ReactNode
  },
): ReactElement {
  return <div className="variants" data-size={size}>{children}</div>
}

/** One sample: the component, and the choice it demonstrates. */
export function Variant(
  { label, children, span = false, tall = false }: {
    /** What this sample shows, in the vocabulary of the prop, not of the picture. */
    readonly label: string
    readonly children: ReactNode
    /** Take the whole row, for a sample that needs width to mean anything. */
    readonly span?: boolean
    /** Reserve height, for a sample whose content scrolls or drops down. */
    readonly tall?: boolean
  },
): ReactElement {
  return (
    <figure
      className="variant"
      data-span={span ? '' : undefined}
      data-tall={tall ? '' : undefined}
    >
      <div className="variant-sample">{children}</div>
      <figcaption className="variant-label">{label}</figcaption>
    </figure>
  )
}

/**
 * The table every entry ends with.
 *
 * The columns read left to right as the question a reader arrives with: what is
 * the prop called, what does it do, what does it take, and what happens if I
 * leave it out. Description sits beside the name rather than at the far edge
 * because it is prose — a variable-width block — while `Type` is the one column
 * that wraps a long union over several lines. Putting the wide prose column
 * second leaves the short `Type` and `Default` columns to size themselves, and
 * keeps a description from being pushed off the panel by a three-line type.
 */
export function PropsTable({ rows }: { readonly rows: readonly PropRow[] }): ReactElement {
  return (
    <section className="props" aria-label="Props">
      <div className="props-scroll">
        <table className="props-table">
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Description</th>
              <th scope="col">Type</th>
              <th scope="col">Default</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.name}>
                <th scope="row">
                  <code>{row.name}</code>
                </th>
                <td className="props-description">{row.description}</td>
                <td>
                  <code className="props-type">{row.type}</code>
                </td>
                <td>
                  {row.default === undefined
                    ? <span className="props-none">—</span>
                    : <code>{row.default}</code>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
