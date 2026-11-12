/**
 * A magnifying glass.
 */
import type { ReactElement } from 'react'
import { IconBase, type IconProps } from './icon.js'

export function IconSearch(props: IconProps): ReactElement {
  return (
    <IconBase {...props} viewBox="0 0 24 24">
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
        <path d="m21 21l-4.34-4.34" />
        <circle cx="11" cy="11" r="8" />
      </g>
    </IconBase>
  )
}
