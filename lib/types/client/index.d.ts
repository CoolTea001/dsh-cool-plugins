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
export declare const name = "dsh-cool-daily/client";
/**
 * The locale service is a required collaborator: the row and the page are worded
 * entirely from this package's dictionaries, so a composition without the
 * service could only draw the wrong language. Declaring the dependency also
 * keeps this plugin from applying before the service it reads exists.
 */
export declare const inject: string[];
export declare function apply(ctx: any): void;
//# sourceMappingURL=index.d.ts.map