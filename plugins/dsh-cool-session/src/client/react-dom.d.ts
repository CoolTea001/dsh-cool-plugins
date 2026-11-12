/**
 * Ambient shape of the platform-seeded `react-dom` module.
 *
 * The web boot answers `react-dom` as a seed for every client bundle, so this
 * package must not inline it and has no build dependency on its types. This
 * declaration covers the root API used to render the archive glyph into the
 * shell's settings navigation seat.
 */

declare module 'react-dom' {
  import type { ReactNode } from 'react'

  /** A React root mounted into a DOM container. */
  export interface Root {
    /** Render one React tree into the container. */
    render(children: ReactNode): void
    /** Tear the tree down and release the container. */
    unmount(): void
  }

  /**
   * Create a React root for a DOM container.
   *
   * @param container - the element the tree is rendered into.
   * @returns the root, ready for `render`.
   */
  export function createRoot(container: Element | DocumentFragment): Root
}
