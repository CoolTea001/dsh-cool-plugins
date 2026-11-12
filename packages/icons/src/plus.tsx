/**
 * A plus sign: add.
 */
import type { ReactElement } from 'react'
import { IconBase, type IconProps } from './icon.js'

export function IconPlus(props: IconProps): ReactElement {
  return (
    <IconBase {...props} viewBox="0 0 24 24">
      <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14m-7-7v14" />
    </IconBase>
  )
}
