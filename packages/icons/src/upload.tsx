/**
 * An arrow pointing out of a tray: send something out.
 */
import type { ReactElement } from 'react'
import { IconBase, type IconProps } from './icon.js'

export function IconUpload(props: IconProps): ReactElement {
  return (
    <IconBase {...props} viewBox="0 0 24 24">
      <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v12m5-7l-5-5l-5 5m14 7v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    </IconBase>
  )
}
