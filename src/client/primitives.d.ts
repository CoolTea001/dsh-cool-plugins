/**
 * The Host primitives this package borrows.
 *
 * The Web loader seeds `@deepseek-ai/dsh-client-ui-primitives` before any plugin
 * bundle runs, so the client half resolves this as an external module at runtime
 * (tsdown lists it in `neverBundle`). The package is not a dependency of this
 * checkout, so the narrow surface used here is declared locally instead of
 * pulling the whole Host component library into the build.
 */

declare module '@deepseek-ai/dsh-client-ui-primitives' {
  import type { ButtonHTMLAttributes, ReactElement, ReactNode } from 'react'

  /** The dialog chrome: portaled card, blurred mask, focus trap, Escape handling. */
  export interface ModalProps {
    readonly open: boolean
    readonly onClose: () => void
    readonly title: string
    readonly description?: string
    readonly closeLabel: string
    readonly children?: ReactNode
    readonly footer?: ReactNode
    readonly className?: string
    readonly contentClassName?: string
  }

  export function Modal(props: ModalProps): ReactElement | null

  /** The token-styled button atom. */
  export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    readonly variant?: 'primary' | 'ghost' | 'outline' | 'toolbar'
    readonly size?: 'md' | 'sm'
    readonly icon?: ReactNode
  }

  export function Button(props: ButtonProps): ReactElement

  /**
   * One labelled settings row: its own label, a bordered text input, and an
   * optional hint. `numeric` switches the input to a numeric keyboard while
   * keeping it a plain text field, so no browser spinner appears.
   */
  export interface SettingsValueFieldProps {
    readonly id: string
    readonly label: string
    readonly text: string
    readonly onEdit: (text: string) => void
    readonly numeric?: boolean
    readonly placeholder?: string
    readonly disabled?: boolean
    readonly invalid?: boolean
    readonly invalidLabel?: string
    readonly hint?: string
  }

  export function SettingsValueField(props: SettingsValueFieldProps): ReactElement
  /**
   * The chip atom: an inline label, or a toggle chip when `onClick` is given
   * (it then renders a `<button>` with `active` as its selected state).
   */
  export interface PillProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    readonly active?: boolean
  }

  export function Pill(props: PillProps): ReactElement

  /** The read-only metadata label. */
  export interface TagProps {
    readonly tone?: 'outline' | 'solid' | 'neutral' | 'quiet'
    readonly className?: string
    readonly children?: ReactNode
  }

  export function Tag(props: TagProps): ReactElement
}
