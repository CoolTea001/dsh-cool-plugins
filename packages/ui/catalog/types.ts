/**
 * What one catalog page is made of.
 *
 * The registry is data rather than markup so the sidebar and the preview panel
 * cannot disagree about what exists: an entry is selectable because it is in the
 * list, and the list is what the page renders from.
 */

import type { ComponentType } from 'react'

/**
 * One row of a component's props table.
 *
 * `Name` is what keeps a table honest: parameterised by `keyof` a component's
 * props, a row that names a renamed or removed prop is a compile error instead
 * of prose describing an API the package no longer has. It defaults to `string`
 * because the shell's components type their props inline rather than exporting
 * the type, so those rows cannot be checked without re-declaring the shell's API
 * here — which is the one thing this package refuses to do. `own.tsx` is where
 * the checked rows live; `shell.tsx` says in its header why its own are copies.
 */
export interface PropRow<Name extends string = string> {
  /** The prop's name, exactly as a caller writes it. */
  readonly name: Name
  /** The accepted type, as a reader would write it. */
  readonly type: string
  /** The value it takes when the caller omits it, or nothing when it is required. */
  readonly default?: string
  /** One line saying what choosing the value does. */
  readonly description: string
}

/** One previewable component. */
export interface CatalogEntry {
  /** Stable id: the selection, the DOM keys and the sidebar's `aria-current`. */
  readonly id: string
  /** The exported name, which is also the sidebar label. */
  readonly name: string
  /** One sentence: what this component is for. */
  readonly summary: string
  /** Where the source lives, so a reader can go and change it. */
  readonly file: string
  /** Draws the variants grid. Owns whatever state a variant needs. */
  readonly Demo: ComponentType
  /** The props table drawn under the variants. */
  readonly props: readonly PropRow[]
}
