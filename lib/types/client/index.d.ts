/**
 * Client entry for dsh-cool-session.
 *
 * Contributes one native Session-menu row, the frame-wide confirmation it
 * opens, and the Sessions section of the Settings panel. The row lives in
 * `sidebar.workspaces.session.menu.item`; the dialog lives in `shell.overlay`,
 * because the menu unmounts as soon as it closes and cannot own a dialog that
 * must outlive that click; the section lives in `settings.section`, which the
 * settings shell projects into its navigation.
 */
export declare const name = "dsh-cool-session/client";
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
export declare const inject: string[];
export declare function apply(ctx: any): void;
//# sourceMappingURL=index.d.ts.map