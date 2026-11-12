/**
 * A three-quarter ring: loading.
 */
import type { ReactElement } from 'react'
import { IconBase, type IconProps } from './icon.js'

export function IconLoader(props: IconProps): ReactElement {
  return (
    <IconBase {...props} viewBox="0 0 24 24">
      <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 1 1-6.219-8.56" />
    </IconBase>
  )
}
