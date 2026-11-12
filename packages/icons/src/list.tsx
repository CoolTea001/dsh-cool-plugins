/**
 * A bulleted list.
 */
import type { ReactElement } from 'react'
import { IconBase, type IconProps } from './icon.js'

export function IconList(props: IconProps): ReactElement {
  return (
    <IconBase {...props} viewBox="0 0 24 24">
      <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h.01M3 12h.01M3 19h.01M8 5h13M8 12h13M8 19h13" />
    </IconBase>
  )
}
