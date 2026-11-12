/**
 * A terminal window with a prompt.
 */
import type { ReactElement } from 'react'
import { IconBase, type IconProps } from './icon.js'

export function IconSquareTerminal(props: IconProps): ReactElement {
  return (
    <IconBase {...props} viewBox="0 0 24 24">
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
        <path d="m7 11l2-2l-2-2m4 6h4" />
        <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      </g>
    </IconBase>
  )
}
