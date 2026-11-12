import type { ReactElement, ReactNode } from 'react'

/** What every icon in this package accepts. */
export interface IconProps {
  /** Square edge length in px. Defaults to 16, the box the artwork is drawn for. */
  size?: number
  className?: string
  /**
   * Accessible name. Without it the glyph is decorative and gets
   * `aria-hidden="true"`, which is the right default when the control around it
   * already carries the label.
   */
  title?: string
}

/** The shared root every icon renders. */
export interface IconBaseProps extends IconProps {
  /** The source artwork's viewBox, kept per icon rather than assumed to be 24. */
  viewBox: string
  children: ReactNode
}

/**
 * Draw an icon's root `<svg>`.
 *
 * Icons own their artwork: their fills, strokes and stroke widths sit on the
 * children, not here. This wrapper owns only the contract every icon shares —
 * the namespace, the square size, the decorative/accessible default — so a
 * plugin-specific glyph can use it too without copying the root attributes.
 */
export function IconBase({
  size = 16,
  className,
  title,
  viewBox,
  children,
}: IconBaseProps): ReactElement {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox={viewBox}
      className={className}
      role={title === undefined ? undefined : 'img'}
      aria-hidden={title === undefined ? true : undefined}
      focusable="false"
    >
      {title === undefined ? null : <title>{title}</title>}
      {children}
    </svg>
  )
}
