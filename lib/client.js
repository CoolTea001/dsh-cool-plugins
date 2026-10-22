window.__ModuleLoader__.load({
	id: "dsh-cool-session",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region src/client/api.ts
		const BASE = "/dsh-cool-session/api";
		/**
		* POST one JSON body and read a JSON answer.
		*
		* @param path - route path below {@link BASE}.
		* @param body - the request body.
		* @returns the parsed payload, or an `{ ok: false }` result when the transport failed.
		*/
		async function postJson(path, body) {
			try {
				const response = await fetch(`${BASE}${path}`, {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify(body),
					credentials: "same-origin"
				});
				const payload = await response.json().catch(() => null);
				if (payload === null || typeof payload !== "object") return {
					ok: false,
					error: `HTTP ${response.status}`
				};
				return payload;
			} catch (error) {
				return {
					ok: false,
					error: error instanceof Error ? error.message : String(error)
				};
			}
		}
		/**
		* Ask the Host to delete one Session and every subagent Session beneath it.
		*
		* The Host stops running work first, then removes the artifacts. This is the
		* only call in this wrapper, and it destroys data.
		*
		* @param sessionId - the root Session to delete.
		* @returns the deletion summary, or a coded refusal.
		*/
		function deleteSession(sessionId) {
			return postJson("/delete", { sessionId });
		}
		//#endregion
		//#region src/client/session-menu.tsx
		/**
		* The native Session menu's delete row and its confirmation overlay.
		*
		* The row is contributed to `sidebar.workspaces.session.menu.item`, after the
		* shipped Copy Session ID row (450). Menus unmount as soon as they close, so the
		* row only records a request; the frame-wide `shell.overlay` entry owns the
		* dialog's state and the Host call. That split is also what lets the dialog
		* survive the menu's portal disappearing on click.
		*
		* Deletion is permanent, so the confirmation is the only path: it asks before
		* the Host stops running work and removes the artifacts, and disables itself
		* while that happens.
		*/
		let pendingDelete = null;
		const deleteListeners = /* @__PURE__ */ new Set();
		function emitDelete() {
			for (const listener of [...deleteListeners]) listener();
		}
		function subscribeDelete(listener) {
			deleteListeners.add(listener);
			return () => {
				deleteListeners.delete(listener);
			};
		}
		function deleteSnapshot() {
			return pendingDelete;
		}
		/**
		* Open the delete confirmation for one Session.
		*
		* @param sessionId - the Session the menu row belongs to.
		*/
		function requestDeleteSession(sessionId) {
			pendingDelete = { sessionId };
			emitDelete();
		}
		/** Dismiss the confirmation without deleting. */
		function clearDeleteRequest() {
			if (pendingDelete === null) return;
			pendingDelete = null;
			emitDelete();
		}
		/**
		* The delete row, placed after Copy Session ID and separated from the shipped
		* group. Selecting it closes the menu and raises the confirmation overlay.
		*
		* @param props - the row identity, menu hook, and locale seat.
		* @returns the menu row.
		*/
		function SessionDeleteMenuItem({ sessionId, useMenuOpenState, t }) {
			const [, setMenuOpen] = useMenuOpenState();
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.MenuItemButton, {
				separatorBefore: true,
				icon: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					className: "dsh-cs-menu-delete-icon",
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconTrashOutlineRegular, {})
				}),
				onSelect: () => {
					setMenuOpen(false);
					requestDeleteSession(sessionId);
				},
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					className: "dsh-cs-menu-delete-label",
					children: t("action.delete")
				})
			});
		}
		/**
		* One failed delete as the sentence the dialog shows.
		*
		* @param t - the page's translate seat.
		* @param payload - the Host answer.
		* @param fallback - the entry to state when the answer carried no reason.
		* @returns the reason to show.
		*/
		function reasonOf(t, payload, fallback) {
			if (payload.failure !== void 0) {
				const sentence = t(`error.${payload.failure.code}`, payload.failure.params);
				if (payload.failure.code === "delete-partial" && typeof payload.error === "string" && payload.error !== "") return `${sentence} ${payload.error}`;
				return sentence;
			}
			if (payload.error === "HTTP 405") return t("error.host-stale");
			return typeof payload.error === "string" && payload.error !== "" ? payload.error : t(fallback);
		}
		/**
		* The frame-wide confirmation entry, drawn with DSH's own `Modal` primitive so
		* its chrome, blurred mask, focus trap, and Escape handling match the rest of
		* the product instead of being re-implemented here.
		*
		* @param props - the locale seat and the post-delete callback.
		* @returns the dialog, or null while no delete is pending.
		*/
		function SessionDeleteDialog({ t, onDeleted }) {
			const request = (0, react.useSyncExternalStore)(subscribeDelete, deleteSnapshot, deleteSnapshot);
			const [busy, setBusy] = (0, react.useState)(false);
			const [error, setError] = (0, react.useState)(void 0);
			(0, react.useEffect)(() => {
				if (request === null) return;
				setBusy(false);
				setError(void 0);
			}, [request]);
			const close = () => {
				if (!busy) clearDeleteRequest();
			};
			const confirm = async () => {
				if (busy || request === null) return;
				setBusy(true);
				setError(void 0);
				const payload = await deleteSession(request.sessionId);
				if (payload.ok !== true) {
					setError(reasonOf(t, payload, "error.delete-failed"));
					setBusy(false);
					if ((payload.deletedSessions?.length ?? 0) > 0) onDeleted?.(request.sessionId);
					return;
				}
				if (payload.warnings !== void 0 && payload.warnings.length > 0) console.warn("[dsh-cool-session] delete cleanup warnings:", payload.warnings);
				clearDeleteRequest();
				onDeleted?.(request.sessionId);
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Modal, {
				open: request !== null,
				onClose: close,
				title: t("delete.title"),
				description: t("delete.description"),
				closeLabel: t("action.close"),
				footer: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
					variant: "outline",
					"data-modal-autofocus": true,
					disabled: busy,
					onClick: close,
					children: t("action.cancel")
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
					variant: "outline",
					className: "dsh-cs-delete-action",
					disabled: busy,
					onClick: () => {
						confirm();
					},
					children: busy ? t("delete.pending") : t("delete.confirm")
				})] }),
				children: error === void 0 ? void 0 : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: "dsh-cs-delete-error",
					role: "alert",
					children: error
				})
			});
		}
		//#endregion
		//#region src/client/settings-section.tsx
		/**
		* Render the empty Sessions page.
		*
		* @param props - the section's locale seat.
		* @returns the section element tree.
		*/
		function SessionsSection({ t }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "dsh-cs-settings",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h2", {
					className: "dsh-cs-settings-heading",
					children: t("settings.title")
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
					className: "dsh-cs-settings-empty",
					children: t("settings.empty")
				})]
			});
		}
		//#endregion
		//#region src/client/icons.ts
		/**
		* Parse one asset's raw SVG into the artwork the nav patch inserts.
		*
		* The root element is dropped rather than copied: its `width`/`height` belong to
		* the asset, not to the shell's 16px icon seat, and the root's `xmlns` would be
		* redundant once the markup is part of the page.
		*
		* @param name - the asset filename stem, e.g. `archive` for `assets/archive.svg`.
		* @returns the viewBox and inner markup to render.
		*/
		function iconArtwork(name) {
			const raw = { "archive": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"1em\" height=\"1em\" viewBox=\"0 0 24 24\">\n	<path d=\"M0 0h24v24H0z\" fill=\"none\" />\n	<g fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\">\n		<rect width=\"20\" height=\"5\" x=\"2\" y=\"3\" rx=\"1\" />\n		<path d=\"M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8m-10 4h4\" />\n	</g>\n</svg>\n" }[name];
			if (raw === void 0) throw new Error(`dsh-cool-session: missing icon asset '${name}.svg'`);
			return {
				viewBox: /viewBox="([^"]+)"/.exec(raw)?.[1] ?? "0 0 24 24",
				inner: /<svg[^>]*>([\s\S]*)<\/svg>/.exec(raw)?.[1] ?? ""
			};
		}
		/** The Settings navigation's icon seat: the shell draws its own glyphs at 16px. */
		const NAV_ICON_SIZE = 16;
		const ARCHIVE = iconArtwork("archive");
		/**
		* The Sessions glyph as complete markup for the shell's navigation seat.
		*
		* It carries its own 16px size because the asset's `1em` would resolve against
		* the nav cell's 14px text, and the stroke is `currentColor`, so the glyph takes
		* the label's color in both appearances.
		*/
		const ARCHIVE_NAV_MARKUP = `<svg xmlns="http://www.w3.org/2000/svg" width="${NAV_ICON_SIZE}" height="${NAV_ICON_SIZE}" viewBox="${ARCHIVE.viewBox}" aria-hidden="true" focusable="false">${ARCHIVE.inner}</svg>`;
		//#endregion
		//#region src/client/locales.ts
		/** The dictionary namespace this page owns. */
		const NS = "coolSession";
		/** The English copy, which is also the fallback every lookup ends at. */
		const en = {
			"action.delete": "Delete session",
			"action.cancel": "Cancel",
			"action.close": "Close",
			"settings.nav": "Sessions",
			"settings.title": "Sessions",
			"settings.empty": "Session management will appear here in a later release.",
			"delete.title": "Delete session",
			"delete.description": "This removes this session and all of its subagent sessions from disk, including their logs. Running sessions will be terminated. This cannot be undone!",
			"delete.pending": "Stopping and deleting…",
			"delete.confirm": "Delete",
			"error.host-stale": "The Host half is still running an older build; restart DSH and try again.",
			"error.missing-session": "No session was named",
			"error.unknown-session": "That session no longer exists",
			"error.subagent-delete": "A subagent session cannot be deleted on its own; delete its parent conversation",
			"error.delete-failed": "The session could not be deleted",
			"error.delete-unsupported": "This Harness does not expose the on-disk session layout needed for deletion",
			"error.delete-active": "The session is still running ({activity}) and could not be stopped, so it was not deleted",
			"error.session-live": "The session is still live and could not be released",
			"error.delete-partial": "Deleted {deleted} session(s), but {remaining} could not be deleted; retry the remaining ones"
		};
		/** The Chinese copy, key for key the same page. */
		const zh = {
			"action.delete": "删除会话",
			"action.cancel": "取消",
			"action.close": "关闭",
			"settings.nav": "会话管理",
			"settings.title": "会话管理",
			"settings.empty": "会话管理功能将在后续版本中开放。",
			"delete.title": "删除会话",
			"delete.description": "从磁盘移除此会话及其所有子会话的日志，正在运行的会话将被终止。此操作不可撤销！",
			"delete.pending": "正在停止并删除…",
			"delete.confirm": "删除",
			"error.host-stale": "Host 端仍在运行旧版本，请重启 DSH 后重试。",
			"error.missing-session": "未指定会话",
			"error.unknown-session": "该会话已不存在",
			"error.subagent-delete": "子代理会话不能单独删除，请删除其父会话",
			"error.delete-failed": "无法删除该会话",
			"error.delete-unsupported": "当前 Harness 未暴露删除会话所需的磁盘目录信息",
			"error.delete-active": "会话仍在运行（{activity}），无法停止，因此未删除",
			"error.session-live": "会话仍处于活动状态，无法释放",
			"error.delete-partial": "已删除 {deleted} 个会话，但还有 {remaining} 个未能删除；请重试剩余项"
		};
		//#endregion
		//#region src/client/nav-icon.ts
		/**
		* The archive glyph on the Settings panel's Sessions entry.
		*
		* A section registration carries a label, not an icon: the shipped settings
		* shell picks its navigation glyph from the section id (`navIcon(row.id)` in
		* ui-settings-general), and every id it does not know — a plugin's id included —
		* gets the generic gear. The entry therefore owns its glyph the only way a
		* plugin can: after the cell renders, hide the shell's gear and put the parsed
		* `assets/archive.svg` artwork in the seat beside the label. dsh-cool-theme
		* patches its palette into the same seat for the same reason.
		*
		* Matching is by the rendered label rather than by class hash, because the
		* shell's CSS module hashes rotate between releases. The observer only watches
		* child-list changes: opening and closing Settings replaces the cell's children,
		* while typing elsewhere in the page usually edits text nodes and must not
		* trigger a scan.
		*/
		/** Marks the span this module inserts, so re-patching stays idempotent. */
		const ICON_ATTRIBUTE = "data-dsh-cs-nav-icon";
		/** Marks the gear this module hid, so disposal can restore it. */
		const HIDDEN_ATTRIBUTE = "data-dsh-cs-nav-hidden";
		/** The nav label in every locale, plus the one this render is reading. */
		function settingsLabels(t) {
			let current = "";
			try {
				current = t("settings.nav");
			} catch {}
			return [
				zh["settings.nav"],
				en["settings.nav"],
				current
			];
		}
		/**
		* Find the settings navigation cells, tolerating a rotated class hash.
		*
		* The panel carries `data-shortcut-modal="settings"` in the shipped shell; using
		* it as the scope keeps the observer from scanning the rest of the page while
		* Settings is closed. Inside the panel the cell class may be rehashed, so the
		* fallback reads every button under the nav column.
		*
		* @returns the cells to inspect, or every button under a nav-like element when
		* the hashed name is not present.
		*/
		function navCells() {
			const panel = document.querySelector("[data-shortcut-modal=\"settings\"]");
			if (panel === null) return [];
			const cells = panel.querySelectorAll("[class*=\"navCell\"]");
			if (cells.length > 0) return [...cells];
			return [...panel.querySelectorAll("[class*=\"nav\"] button")];
		}
		/**
		* Replace the gear on the Sessions cell with the plugin's archive glyph.
		*
		* @param labels - the label spellings that identify this section's cell.
		*/
		function patch(labels) {
			for (const cell of navCells()) {
				const label = cell.querySelector("[class*=\"navLabel\"]")?.textContent ?? cell.textContent ?? "";
				if (!labels.has(label.trim())) continue;
				if (cell.querySelector(`[${ICON_ATTRIBUTE}]`) !== null) continue;
				const svg = cell.querySelector("svg");
				if (svg === null) continue;
				svg.style.display = "none";
				svg.setAttribute(HIDDEN_ATTRIBUTE, "1");
				const holder = document.createElement("span");
				holder.className = "dsh-cs-nav-icon";
				holder.setAttribute(ICON_ATTRIBUTE, "1");
				holder.setAttribute("aria-hidden", "true");
				holder.innerHTML = ARCHIVE_NAV_MARKUP;
				svg.after(holder);
			}
		}
		/**
		* Keep the Sessions entry's glyph patched for the plugin's lifetime.
		*
		* Runs once for a panel that is already open and again whenever the shell mounts
		* or re-renders the navigation. The disposer removes the inserted spans and
		* restores the gears, so an HMR update does not leave two glyphs in the seat.
		*
		* @param t - the plugin's translate seat, for the current locale's label.
		* @returns the disposer that stops observation and restores the shell's DOM.
		*/
		function installSessionNavIcon(t) {
			if (typeof document === "undefined" || typeof MutationObserver === "undefined") return () => {};
			const labels = new Set(settingsLabels(t).filter((label) => label.length > 0));
			const apply = () => {
				patch(labels);
			};
			apply();
			let frame;
			const schedule = () => {
				if (frame !== void 0) return;
				if (typeof requestAnimationFrame !== "function") {
					apply();
					return;
				}
				frame = requestAnimationFrame(() => {
					frame = void 0;
					apply();
				});
			};
			const observer = new MutationObserver(schedule);
			observer.observe(document.body, {
				childList: true,
				subtree: true
			});
			return () => {
				observer.disconnect();
				if (frame !== void 0) cancelAnimationFrame(frame);
				for (const holder of document.querySelectorAll(`[${ICON_ATTRIBUTE}]`)) holder.remove();
				for (const svg of document.querySelectorAll(`svg[${HIDDEN_ATTRIBUTE}]`)) {
					svg.style.display = "";
					svg.removeAttribute(HIDDEN_ATTRIBUTE);
				}
			};
		}
		//#endregion
		//#region src/client/styles.ts
		/** CSS rules, one selector per line. */
		const PLUGIN_CSS = [
			".dsh-cs-menu-delete-icon{display:inline-flex;align-items:center;justify-content:center;color:var(--dsw-alias-state-error-primary)}",
			".dsh-cs-menu-delete-label{color:var(--dsw-alias-state-error-primary)}",
			".dsh-cs-delete-action:not(:disabled){color:var(--dsw-alias-state-error-primary)}",
			".dsh-cs-delete-error{padding:8px 9px;border:.5px solid color-mix(in srgb,var(--dsw-alias-state-error-primary) 35%,transparent);border-radius:var(--dsw-radius-sm,6px);background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 9%,transparent);color:var(--dsw-alias-state-error-primary);font-size:11.5px;line-height:1.55;white-space:pre-wrap}",
			".dsh-cs-settings{display:flex;flex-direction:column;gap:12px;max-width:760px;color:var(--dsw-alias-label-primary)}",
			".dsh-cs-settings-heading{margin:0;font-size:18px;font-weight:600}",
			".dsh-cs-settings-empty{margin:0;color:var(--dsw-alias-label-tertiary);font-size:13px}",
			".dsh-cs-nav-icon{display:inline-flex;flex:none;align-items:center;justify-content:center}",
			".dsh-cs-nav-icon svg{width:16px;height:16px;display:block}"
		].join("\n");
		/**
		* Insert the stylesheet once for the plugin lifetime.
		*
		* The tag carries the platform's style-ownership record — `data-plugin` with this
		* package's id, which is what every DSH bundle writes on the tags it injects. A
		* tag carrying no attribute is claimed by whichever module materializes next and
		* deleted with it, so naming the owner here keeps the sheet this plugin's own:
		* only a reload of `dsh-cool-session` retires it, and this effect's disposer
		* removes it then anyway.
		*
		* @returns disposer that removes exactly this element.
		*/
		function insertStyles() {
			const element = document.createElement("style");
			element.setAttribute("data-plugin", "dsh-cool-session");
			element.setAttribute("data-dsh-cool-session", "styles");
			element.textContent = PLUGIN_CSS;
			document.head.appendChild(element);
			return () => {
				element.remove();
			};
		}
		//#endregion
		//#region src/client/index.ts
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
		const name = "dsh-cool-session/client";
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
		const inject = ["slots", "locale"];
		function apply(ctx) {
			const slots = ctx.get("slots");
			if (slots === void 0) return;
			const locale = ctx.get("locale");
			ctx.effect(() => insertStyles(), "dsh-cool-session: styles");
			ctx.effect(() => locale.register(NS, {
				zh,
				en
			}), "dsh-cool-session: dictionaries");
			const t = locale.bind(NS);
			const afterDelete = (sessionId) => {
				const uiWorkspace = ctx.get("uiWorkspace");
				try {
					if (uiWorkspace?.mainReference?.sessionId === sessionId) uiWorkspace.clearMain?.();
				} catch {}
				try {
					ctx.get("sessions")?.refresh?.();
				} catch {}
				try {
					ctx.get("workspaces")?.refresh?.();
				} catch {}
			};
			slots.inject("settings.section", () => slots.register({
				name: "settings.section",
				id: "dsh-cool-session.sessions",
				order: 12,
				label: () => t("settings.nav"),
				locale: NS
			}, SessionsSection));
			ctx.effect(() => installSessionNavIcon(t), "dsh-cool-session: settings nav icon");
			slots.inject("sidebar.workspaces.session.menu.item", () => slots.register({
				name: "sidebar.workspaces.session.menu.item",
				id: "dsh-cool-session.delete",
				order: 500,
				locale: NS
			}, SessionDeleteMenuItem));
			slots.inject("shell.overlay", () => slots.register({
				name: "shell.overlay",
				id: "dsh-cool-session.delete-dialog",
				locale: NS,
				inject: () => ({ onDeleted: afterDelete })
			}, SessionDeleteDialog));
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		exports.name = name;
		return module.exports;
	}
});
