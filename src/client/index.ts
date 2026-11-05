/**
 * Client entry for dsh-cool-daily.
 *
 * Contributes one global panel: a sidebar row in `sidebar.panellist` and the
 * page it opens through the layout's root-scoped `main` keyed slot. Both carry
 * the same id, because the sidebar row addresses the main panel by it and a
 * selection with no matching main entry throws without changing the view.
 *
 * The row is ordered after the shipped Automated Tasks entry (order 10), so it
 * sits above the panel list's More row. The label is a thunk read at projection
 * time, which is what lets it follow a language switch without re-registering.
 */

import { DailyPage } from './page.js'
import { DailyPanelIcon } from './panel-icon.js'
import { en, NS, zh, type Translate } from './locales.js'
import { insertStyles } from './styles.js'

export const name = 'dsh-cool-daily/client'

/**
 * The locale service is a required collaborator: the row and the page are worded
 * entirely from this package's dictionaries, so a composition without the
 * service could only draw the wrong language. Declaring the dependency also
 * keeps this plugin from applying before the service it reads exists.
 */
export const inject = ['slots', 'locale']

/** The slice of DSH's locale service this plugin uses. */
interface LocaleService {
  /** Register one namespace's dictionaries for the shipped locales. */
  register(ns: string, dicts: Readonly<Record<'zh' | 'en', Readonly<Record<string, string>>>>): () => void
  /** Bind a namespace to a stable translate function reading the active locale. */
  bind(ns: string): Translate
}

/**
 * The panel id shared by the sidebar row and the main panel.
 *
 * It is fresh rather than the id of a shipped panel, so the row is added beside
 * Plugins and Automated Tasks instead of replacing either of them.
 */
const PANEL_ID = 'daily'

export function apply(ctx: any): void {
  const slots = ctx.get('slots')
  if (slots === undefined) return
  const locale: LocaleService = ctx.get('locale')

  ctx.effect(() => insertStyles(), 'dsh-cool-daily: styles')
  // The registration's lifetime is the plugin's, so a reload or an HMR update
  // replaces the dictionaries rather than leaving two of them behind.
  ctx.effect(() => locale.register(NS, { zh, en }), 'dsh-cool-daily: dictionaries')
  const t = locale.bind(NS)

  // The page has no Session binding: the layout hands a non-conversation panel
  // the framework props only, and this registration asks for nothing else.
  slots.inject('main', () =>
    slots.register(
      {
        name: 'main',
        key: PANEL_ID,
        locale: NS,
      },
      DailyPage,
    ),
  )

  // The icon fills the sidebar's own glyph box; the shell owns the button, the
  // label, the tooltip, and the selected state around it.
  slots.inject('sidebar.panellist', () =>
    slots.register(
      {
        name: 'sidebar.panellist',
        id: PANEL_ID,
        order: 20,
        locale: NS,
        label: () => t('panel'),
      },
      DailyPanelIcon,
    ),
  )
}
