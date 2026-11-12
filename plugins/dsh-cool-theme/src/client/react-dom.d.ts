/**
 * The root API React 18's `react-dom` entry exports for the shell-rendered
 * navigation seat. `@types/react-dom` declares it under `react-dom/client`, but
 * the platform seeds the bare `react-dom` specifier, so the shape is added here.
 */

import type { ReactNode } from 'react'

declare module 'react-dom' {
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
