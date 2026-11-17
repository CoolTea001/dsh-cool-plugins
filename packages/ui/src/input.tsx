/**
 * The shell's text field, with the one attribute its `Modal` looks for.
 *
 * `Input` is the shell's own control, so this module wraps rather than restates
 * it: the markup, the icon gutter, the focus ring and the fill all stay the
 * platform's. What it adds is a single, typed spelling of `data-modal-autofocus`.
 *
 * The attribute is how the platform's `Modal` picks the control that takes
 * initial focus (`element.querySelector('[data-modal-autofocus]')`), and it is
 * deliberately not React's `autoFocus`: React's runs before the layer stack has
 * captured the invoking control, so returning focus on close would land in the
 * wrong place. But the shell types `Input`'s props as the native input
 * attributes, and TypeScript does not admit an arbitrary `data-*` key on a
 * component whose props are an intersection — so a caller that wants the
 * attribute has to spell it in a way the type system refuses, and a plugin that
 * worked around that with its own ambient declaration would be describing an API
 * the shell does not publish.
 *
 * A named boolean is the fix: the wrapper turns it into the attribute, the
 * caller stays inside the published props, and the trick is written once.
 */

import { createElement, type InputHTMLAttributes, type ReactElement, type ReactNode } from 'react'
import { Input as ShellInput } from '@deepseek-ai/dsh-client-ui-primitives'

/** The shell text field's props, plus the dialog's initial-focus flag. */
export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Optional 16px leading icon node, rendered inside the frame before the field. */
  icon?: ReactNode
  /** Extra class for the frame element that carries the field's border and fill. */
  className?: string
  /**
   * Take the enclosing `Modal`'s initial focus.
   *
   * Prefer this over React's `autoFocus`: the platform's layer stack restores
   * focus to the control that opened the dialog, and `autoFocus` runs before
   * that stack can record it.
   */
  modalAutofocus?: boolean
}

/**
 * Render the shell's text field.
 *
 * @param props - the field's own props and the initial-focus flag.
 * @returns the field, with `data-modal-autofocus` set when asked for.
 */
export function Input({ modalAutofocus, ...rest }: InputProps): ReactElement {
  const attributes = modalAutofocus === true ? { 'data-modal-autofocus': true } : {}
  return createElement(ShellInput, { ...attributes, ...rest })
}
