/**
 * A branch with two commits.
 */
import type { ReactElement } from 'react'
import { IconBase, type IconProps } from './icon.js'

export function IconGitBranch(props: IconProps): ReactElement {
  return (
    <IconBase {...props} viewBox="0 0 24 24">
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
        <path d="M15 6a9 9 0 0 0-9 9V3" />
        <circle cx="18" cy="6" r="3" />
        <circle cx="6" cy="18" r="3" />
      </g>
    </IconBase>
  )
}
