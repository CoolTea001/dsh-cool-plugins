/**
 * Client entry for dsh-cool-session.
 *
 * Contributes one native Session-menu row and the frame-wide confirmation it
 * opens. The row lives in `sidebar.workspaces.session.menu.item`; the dialog
 * lives in `shell.overlay`, because the menu unmounts as soon as it closes and
 * cannot own a dialog that must outlive that click.
 */

import { SessionDeleteDialog, SessionDeleteMenuItem } from './session-menu.js'
import { en, NS, zh, type Translate } from './locales.js'
import { insertStyles } from './styles.js'

export const name = 'dsh-cool-session/client'

/**
 * The locale service is a required collaborator rather than an optional one.
 *
 * The confirmation is worded entirely from this package's dictionaries, so a
 * composition without the service could only draw the wrong language: declaring
 * the dependency is what makes the framework apply this plugin once the service
 * is there, and what makes `ctx.get('locale')` below answer. DSH mounts the
 * service with the web client tree itself (`@deepseek-ai/dsh-web-app`), so
 * nothing this menu row can run in is without it.
 */
export const inject = ['slots', 'locale']

/**
 * The slice of DSH's locale service this plugin uses.
 *
 * The two methods are the ones documented for plugin authors: register the
 * dictionaries, then bind the namespace to a translate function. The bound
 * function reads the active language at call time, which is what lets the row
 * and dialog follow a switch that happened after this plugin was applied.
 */
interface LocaleService {
  /** Register one namespace's dictionaries for the shipped locales. */
  register(ns: string, dicts: Readonly<Record<'zh' | 'en', Readonly<Record<string, string>>>>): () => void
  /** Bind a namespace to a stable translate function reading the active locale. */
  bind(ns: string): Translate
}

export function apply(ctx: any): void {
  const slots = ctx.get('slots')
  if (slots === undefined) return
  const locale: LocaleService = ctx.get('locale')

  ctx.effect(() => insertStyles(), 'dsh-cool-session: styles')
  // The registration's lifetime is the plugin's, so a reload or an HMR update
  // replaces the dictionaries rather than leaving two of them behind.
  ctx.effect(() => locale.register(NS, { zh, en }), 'dsh-cool-session: dictionaries')
  const t = locale.bind(NS)

  // A deleted Session must not stay in the shell's main view or in either
  // client store. Each lookup is optional: the row still deletes when a
  // composition does not mount that collaborator.
  const afterDelete = (sessionId: string): void => {
    const uiWorkspace: any = ctx.get('uiWorkspace')
    try {
      if (uiWorkspace?.mainReference?.sessionId === sessionId) uiWorkspace.clearMain?.()
    } catch { /* optional shell navigation */ }
    try { void (ctx.get('sessions') as any)?.refresh?.() } catch { /* optional client store */ }
    try { void (ctx.get('workspaces') as any)?.refresh?.() } catch { /* optional client store */ }
  }

  // The native sidebar menu is a list slot owned by ui-workspace. This row is
  // ordered after the shipped Copy Session ID row (450) and opens the frame-wide
  // confirmation through a `shell.overlay` entry. Both registrations disappear
  // with their owner declaration, exactly like the shipped menu rows.
  slots.inject('sidebar.workspaces.session.menu.item', () =>
    slots.register({
      name: 'sidebar.workspaces.session.menu.item',
      id: 'dsh-cool-session.delete',
      order: 500,
      locale: NS,
    }, SessionDeleteMenuItem))

  slots.inject('shell.overlay', () =>
    slots.register({
      name: 'shell.overlay',
      id: 'dsh-cool-session.delete-dialog',
      locale: NS,
      inject: () => ({ onDeleted: afterDelete }),
    }, SessionDeleteDialog))
}
