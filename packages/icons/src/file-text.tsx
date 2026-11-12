/**
 * A sheet with text lines.
 */
import type { ReactElement } from 'react'
import { IconBase, type IconProps } from './icon.js'

export function IconFileText(props: IconProps): ReactElement {
  return (
    <IconBase {...props} viewBox="0 0 24 24">
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5">
        <path d="M13.75 2.75h-6.5a2.5 2.5 0 0 0-2.5 2.5v13.5a2.5 2.5 0 0 0 2.5 2.5h9.5a2.5 2.5 0 0 0 2.5-2.5V8.25Z" />
        <path d="M13.75 2.75v3.5a2 2 0 0 0 2 2h3.5m-10.5 5h6.5m-6.5 3.5h4" />
      </g>
    </IconBase>
  )
}
