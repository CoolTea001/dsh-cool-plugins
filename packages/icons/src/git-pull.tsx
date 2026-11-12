/**
 * An arrow pointing down: pull changes in.
 */
import type { ReactElement } from 'react'
import { IconBase, type IconProps } from './icon.js'

export function IconGitPull(props: IconProps): ReactElement {
  return (
    <IconBase {...props} viewBox="0 0 24 24">
      <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v14m7-7l-7 7l-7-7" />
    </IconBase>
  )
}
