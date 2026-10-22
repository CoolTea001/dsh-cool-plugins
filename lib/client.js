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
		* The Host stops running work first, then removes the artifacts.
		*
		* @param sessionId - the root Session to delete.
		* @returns the deletion summary, or a coded refusal.
		*/
		function deleteSession(sessionId) {
			return postJson("/delete", { sessionId });
		}
		/**
		* Whether an answer means the Host half predates the batch route.
		*
		* The browser bundle reloads with the page while the Host half lives until the
		* process restarts, so a freshly updated plugin can be newer than the routes it
		* is talking to. A missing route is not a deletion failure: the single route is
		* still there and can finish the same selection.
		*
		* @param payload - the answer to inspect.
		* @returns true when `deleteSessions` should fall back to single requests.
		*/
		function batchRouteMissing(payload) {
			return payload.error === "HTTP 404" || payload.error === "HTTP 405";
		}
		/**
		* Sessions per batch request.
		*
		* Smaller than the Host's own ceiling so a very large selection is a sequence
		* of bounded requests; each batch still stops and removes its own Sessions in
		* order, so the persistence writer never sees two deletions at once.
		*/
		const DELETE_BATCH_SIZE = 100;
		/**
		* Ask the Host to delete several Sessions.
		*
		* The Host runs the same stop-then-remove sequence as {@link deleteSession} for
		* each id, sequentially, and answers one result per id. When this Host half does
		* not serve the batch route yet, the same work is done through the single route
		* so the panel keeps working across a live plugin upgrade and a later restart.
		*
		* @param sessionIds - the root Sessions to delete, in request order.
		* @returns the per-session summaries, or a request-level refusal.
		*/
		async function deleteSessions(sessionIds) {
			const results = [];
			for (let start = 0; start < sessionIds.length; start += DELETE_BATCH_SIZE) {
				const chunk = sessionIds.slice(start, start + DELETE_BATCH_SIZE);
				const payload = await postJson("/delete-many", { sessionIds: chunk });
				if (batchRouteMissing(payload)) {
					for (const sessionId of chunk) results.push(await deleteSession(sessionId));
					continue;
				}
				if (!Array.isArray(payload.results)) return {
					ok: false,
					error: typeof payload.error === "string" && payload.error !== "" ? payload.error : "the delete request failed",
					results
				};
				results.push(...payload.results);
			}
			return {
				ok: results.every((result) => result.ok),
				results
			};
		}
		//#endregion
		//#region src/client/reason.ts
		/**
		* Word one refused answer.
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
			const raw = {
				"archive": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"1em\" height=\"1em\" viewBox=\"0 0 24 24\">\n	<path d=\"M0 0h24v24H0z\" fill=\"none\" />\n	<g fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\">\n		<rect width=\"20\" height=\"5\" x=\"2\" y=\"3\" rx=\"1\" />\n		<path d=\"M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8m-10 4h4\" />\n	</g>\n</svg>\n",
				"arrow-down": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"1em\" height=\"1em\" viewBox=\"0 0 24 24\">\n	<path d=\"M0 0h24v24H0z\" fill=\"none\" />\n	<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"m6 9l6 6l6-6\" />\n</svg>\n"
			}[name];
			if (raw === void 0) throw new Error(`dsh-cool-session: missing icon asset '${name}.svg'`);
			return {
				viewBox: /viewBox="([^"]+)"/.exec(raw)?.[1] ?? "0 0 24 24",
				inner: /<svg[^>]*>([\s\S]*)<\/svg>/.exec(raw)?.[1] ?? ""
			};
		}
		/** Complete SVG markup for one asset at a fixed square size. */
		function iconMarkup(name, size) {
			const artwork = iconArtwork(name);
			return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="${artwork.viewBox}" aria-hidden="true" focusable="false">${artwork.inner}</svg>`;
		}
		/** The Settings navigation's icon seat: the shell draws its own glyphs at 16px. */
		const NAV_ICON_SIZE = 16;
		/** The filter triggers' caret, sized to sit inside a 32px control. */
		const CARET_SIZE = 12;
		/**
		* The Sessions glyph as complete markup for the shell's navigation seat.
		*
		* It carries its own 16px size because the asset's `1em` would resolve against
		* the nav cell's 14px text, and the stroke is `currentColor`, so the glyph takes
		* the label's color in both appearances.
		*/
		const ARCHIVE_NAV_MARKUP = iconMarkup("archive", NAV_ICON_SIZE);
		/**
		* The caret beside the panel's two filter triggers.
		*
		* `assets/arrow-down.svg` strokes with `currentColor`, so the trigger's label
		* color reaches it; the fixed 12px keeps it clear of the control's 13px text.
		*/
		const ARROW_DOWN_MARKUP = iconMarkup("arrow-down", CARET_SIZE);
		//#endregion
		//#region src/client/settings-section.tsx
		/**
		* The Sessions page of the Settings panel: list, search, filter, selection,
		* archive, and deletion.
		*
		* The list itself is not fetched here. DSH already keeps the Host-authoritative
		* Session catalog and Workspace archive set in the two client stores the shell
		* exposes to every slot (`useSessions` / `useWorkspaces`), and every archive is
		* a Workspace-controller call whose reply updates those stores. Reading them
		* directly means this page shares the sidebar's rows and running states instead
		* of maintaining a second, drifting catalog; deletion is the one operation the
		* client face does not expose, so it still crosses this package's own Host
		* route.
		*
		* Search is deliberately title-only: the row's title is the display title the
		* shell computes (durable title, then project directory name, then id), so the
		* text a reader can see in the row is exactly the text the box matches.
		*/
		/** Flatten the two stores into the rows this page renders. */
		function buildRows(state, workspaces) {
			const archived = new Set(workspaces.archivedSessionIds ?? []);
			const workspaceBySession = /* @__PURE__ */ new Map();
			for (const workspace of workspaces.items ?? []) for (const id of workspace.sessionIds ?? []) if (!workspaceBySession.has(id)) workspaceBySession.set(id, {
				id: workspace.workspaceId,
				title: workspace.title
			});
			const rows = [];
			for (const id of state.ids ?? []) {
				const summary = state.byId?.[id];
				if (summary === void 0) continue;
				if (summary.origin === "subagent") continue;
				const workspace = workspaceBySession.get(id);
				const durable = typeof summary.title === "string" && summary.title.trim() !== "" ? summary.title.trim() : void 0;
				const display = typeof summary.displayTitle === "string" && summary.displayTitle.trim() !== "" ? summary.displayTitle.trim() : void 0;
				rows.push({
					id,
					title: durable ?? display ?? id,
					...summary.cwd === void 0 ? {} : { cwd: summary.cwd },
					...workspace === void 0 ? {} : {
						workspaceId: workspace.id,
						workspaceTitle: workspace.title
					},
					archived: archived.has(id),
					running: summary.running === true,
					updatedAt: typeof summary.updatedAt === "number" && Number.isFinite(summary.updatedAt) ? summary.updatedAt : 0
				});
			}
			rows.sort((left, right) => right.updatedAt - left.updatedAt || left.title.localeCompare(right.title));
			return rows;
		}
		/** Read the document language the locale service keeps in sync. */
		function localeTag() {
			if (typeof document === "undefined") return void 0;
			const language = document.documentElement.lang;
			return language === "" ? void 0 : language;
		}
		/** Format one epoch instant, or an em dash when the row carries none. */
		function formatDay(ms) {
			if (!Number.isFinite(ms) || ms <= 0) return "—";
			try {
				return new Intl.DateTimeFormat(localeTag(), {
					year: "numeric",
					month: "2-digit",
					day: "2-digit"
				}).format(ms);
			} catch {
				return "—";
			}
		}
		/** Format the same instant with its time, for the row's hover text. */
		function formatFull(ms) {
			if (!Number.isFinite(ms) || ms <= 0) return "";
			try {
				return new Intl.DateTimeFormat(localeTag(), {
					dateStyle: "medium",
					timeStyle: "short"
				}).format(ms);
			} catch {
				return "";
			}
		}
		/** Word one failure, keeping the retryable summary ahead of its detail. */
		function problemText(t, problem) {
			const parts = [];
			if (problem.prefix !== void 0) parts.push(t(problem.prefix.key, problem.prefix.params));
			if (problem.failure !== void 0) parts.push(t(`error.${problem.failure.code}`, problem.failure.params));
			else if (typeof problem.error === "string" && problem.error !== "") parts.push(problem.error === "HTTP 405" ? t("error.host-stale") : problem.error);
			else if (problem.prefix === void 0) parts.push(t(problem.fallback ?? "sessions.actionFailed"));
			return parts.join(" ");
		}
		/** Word a request-level failure, translating the one code the page knows. */
		function rawReason(t, error, fallback) {
			if (error === "HTTP 405") return t("error.host-stale");
			return typeof error === "string" && error !== "" ? error : t(fallback);
		}
		/** One activity family, as the stop-and-archive dialog names it. */
		function activityLine(t, activity) {
			switch (activity.kind) {
				case "turn": return t("sessions.activityTurn");
				case "subagent": return t("sessions.activitySubagents", { count: activity.count });
				case "job": return t("sessions.activityJobs", { count: activity.count });
				case "schedule": return t("sessions.activitySchedules", { count: activity.count });
				default: return t("sessions.activityOther", {
					count: activity.count,
					kind: activity.kind
				});
			}
		}
		/**
		* One toolbar filter: the product's Menu anchored to a control shaped like the
		* search box, so both filters share its 32px height and its border.
		*
		* The list portals to the document body: the options column is a scroll
		* container, and an in-place card would be clipped at its edge (or add a
		* horizontal scrollbar) instead of floating over the panel.
		*
		* @param props - the current option, the rows to offer, and the change callback.
		* @returns the trigger and its dropdown.
		*/
		function FilterMenu({ label, items, selectedId, onSelect, className, align = "start", listClassName }) {
			const [open, setOpen] = (0, react.useState)(false);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Menu, {
				open,
				portal: true,
				align,
				items,
				selectedId,
				listClassName,
				className: "dsh-cs-filter-wrap",
				onSelect: (id) => {
					setOpen(false);
					onSelect(id);
				},
				onClose: () => {
					setOpen(false);
				},
				anchor: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
					type: "button",
					className: className === void 0 ? "dsh-cs-filter" : `dsh-cs-filter ${className}`,
					"aria-haspopup": "menu",
					"aria-expanded": open,
					onClick: () => {
						setOpen((value) => !value);
					},
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: "dsh-cs-filter-label",
						children: label
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: "dsh-cs-caret",
						"aria-hidden": "true",
						dangerouslySetInnerHTML: { __html: ARROW_DOWN_MARKUP }
					})]
				})
			});
		}
		/**
		* Render the Sessions page.
		*
		* @param props - the locale seat, the two catalog hooks, and the injected actions.
		* @returns the management surface and its confirmations.
		*/
		function SessionsSection({ t, useSessions, useWorkspaces, setArchived, refresh, onDeleted }) {
			const sessionState = useSessions((state) => state);
			const workspaceState = useWorkspaces((state) => state);
			const [removed, setRemoved] = (0, react.useState)(() => /* @__PURE__ */ new Set());
			const rows = (0, react.useMemo)(() => buildRows(sessionState, workspaceState).filter((row) => !removed.has(row.id)), [
				sessionState,
				workspaceState,
				removed
			]);
			const [query, setQuery] = (0, react.useState)("");
			const [workspaceFilter, setWorkspaceFilter] = (0, react.useState)("all");
			const [archiveFilter, setArchiveFilter] = (0, react.useState)("all");
			const [selected, setSelected] = (0, react.useState)(() => /* @__PURE__ */ new Set());
			const [busyId, setBusyId] = (0, react.useState)(null);
			const [bulkArchiving, setBulkArchiving] = (0, react.useState)(false);
			const [problem, setProblem] = (0, react.useState)(null);
			const [deleteTarget, setDeleteTarget] = (0, react.useState)(null);
			const [deleting, setDeleting] = (0, react.useState)(false);
			const [deleteError, setDeleteError] = (0, react.useState)(void 0);
			const [archiveStop, setArchiveStop] = (0, react.useState)(null);
			const [archiving, setArchiving] = (0, react.useState)(false);
			const [archiveError, setArchiveError] = (0, react.useState)(void 0);
			const selectAllRef = (0, react.useRef)(null);
			(0, react.useEffect)(() => {
				setSelected((previous) => {
					if (previous.size === 0) return previous;
					const existing = new Set(rows.map((row) => row.id));
					let changed = false;
					const next = /* @__PURE__ */ new Set();
					for (const id of previous) if (existing.has(id)) next.add(id);
					else changed = true;
					return changed ? next : previous;
				});
			}, [rows]);
			const workspaceOptions = (0, react.useMemo)(() => {
				const titles = /* @__PURE__ */ new Map();
				for (const row of rows) if (row.workspaceId !== void 0) titles.set(row.workspaceId, row.workspaceTitle ?? "");
				return [...titles].map(([id, title]) => ({
					id,
					title
				})).sort((left, right) => left.title.localeCompare(right.title));
			}, [rows]);
			const hasUnassigned = (0, react.useMemo)(() => rows.some((row) => row.workspaceId === void 0), [rows]);
			const workspaceItems = (0, react.useMemo)(() => [
				{
					id: "all",
					label: t("sessions.allWorkspaces")
				},
				...workspaceOptions.map((option) => ({
					id: option.id,
					label: option.title
				})),
				...hasUnassigned ? [{
					id: "none",
					label: t("sessions.noWorkspace")
				}] : []
			], [
				t,
				workspaceOptions,
				hasUnassigned
			]);
			const archiveItems = (0, react.useMemo)(() => [
				{
					id: "all",
					label: t("sessions.allSessions")
				},
				{
					id: "unarchived",
					label: t("sessions.unarchived")
				},
				{
					id: "archived",
					label: t("sessions.archived")
				}
			], [t]);
			const workspaceLabel = workspaceFilter === "all" ? t("sessions.allWorkspaces") : workspaceFilter === "none" ? t("sessions.noWorkspace") : workspaceOptions.find((option) => option.id === workspaceFilter)?.title ?? t("sessions.allWorkspaces");
			const archiveLabel = archiveFilter === "all" ? t("sessions.allSessions") : archiveFilter === "unarchived" ? t("sessions.unarchived") : t("sessions.archived");
			(0, react.useEffect)(() => {
				if (workspaceFilter === "none") {
					if (!hasUnassigned) setWorkspaceFilter("all");
					return;
				}
				if (workspaceFilter !== "all" && !workspaceOptions.some((option) => option.id === workspaceFilter)) setWorkspaceFilter("all");
			}, [
				workspaceFilter,
				workspaceOptions,
				hasUnassigned
			]);
			const filtered = (0, react.useMemo)(() => {
				const needle = query.trim().toLocaleLowerCase();
				return rows.filter((row) => {
					if (workspaceFilter !== "all") {
						if (workspaceFilter === "none") {
							if (row.workspaceId !== void 0) return false;
						} else if (row.workspaceId !== workspaceFilter) return false;
					}
					if (archiveFilter === "archived" && !row.archived) return false;
					if (archiveFilter === "unarchived" && row.archived) return false;
					if (needle !== "" && !row.title.toLocaleLowerCase().includes(needle)) return false;
					return true;
				});
			}, [
				rows,
				query,
				workspaceFilter,
				archiveFilter
			]);
			const visibleIds = (0, react.useMemo)(() => filtered.map((row) => row.id), [filtered]);
			const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selected.has(id));
			const someSelected = visibleIds.some((id) => selected.has(id));
			(0, react.useEffect)(() => {
				const node = selectAllRef.current;
				if (node !== null) node.indeterminate = someSelected && !allSelected;
			}, [someSelected, allSelected]);
			const clearSelection = () => {
				setSelected(/* @__PURE__ */ new Set());
			};
			const archivableSelected = (0, react.useMemo)(() => rows.filter((row) => selected.has(row.id) && !row.archived), [rows, selected]);
			const toggleAll = () => {
				setSelected((previous) => {
					const next = new Set(previous);
					if (allSelected) for (const id of visibleIds) next.delete(id);
					else for (const id of visibleIds) next.add(id);
					return next;
				});
			};
			const toggleRow = (id, checked) => {
				setSelected((previous) => {
					const next = new Set(previous);
					if (checked) next.add(id);
					else next.delete(id);
					return next;
				});
			};
			const openDelete = (ids) => {
				if (ids.length === 0) return;
				setDeleteError(void 0);
				setDeleteTarget({ ids: [...ids] });
			};
			const closeDelete = () => {
				if (deleting) return;
				setDeleteTarget(null);
				setDeleteError(void 0);
			};
			const confirmDelete = async () => {
				const target = deleteTarget;
				if (deleting || target === null) return;
				setDeleting(true);
				setDeleteError(void 0);
				const payload = await deleteSessions(target.ids);
				const results = payload.results ?? [];
				const requestError = typeof payload.error === "string" && payload.error !== "" ? payload.error : void 0;
				if (results.length === 0) {
					setDeleting(false);
					setDeleteError(rawReason(t, requestError, "sessions.actionFailed"));
					return;
				}
				const succeeded = results.filter((result) => result.ok === true && typeof result.sessionId === "string").map((result) => result.sessionId);
				const failed = results.filter((result) => result.ok !== true);
				for (const id of succeeded) onDeleted?.(id);
				if (succeeded.length > 0) {
					setRemoved((previous) => {
						const next = new Set(previous);
						for (const id of succeeded) next.add(id);
						return next;
					});
					setSelected((previous) => {
						if (previous.size === 0) return previous;
						const next = new Set(previous);
						for (const id of succeeded) next.delete(id);
						return next;
					});
				}
				setDeleting(false);
				if (succeeded.length === 0) {
					const first = failed[0];
					setDeleteError(first === void 0 ? rawReason(t, requestError, "sessions.actionFailed") : reasonOf(t, first, "error.delete-failed"));
					return;
				}
				setDeleteTarget(null);
				if (failed.length > 0) {
					const first = failed[0];
					const detail = requestError ?? first?.error;
					setProblem({
						prefix: {
							key: "sessions.bulkPartial",
							params: {
								deleted: succeeded.length,
								failed: failed.length
							}
						},
						...first === void 0 || first.failure === void 0 ? {} : { failure: first.failure },
						...detail === void 0 ? {} : { error: detail }
					});
				} else if (requestError !== void 0) setProblem({
					prefix: {
						key: "sessions.bulkStopped",
						params: { deleted: succeeded.length }
					},
					error: requestError
				});
			};
			const toggleArchive = async (row) => {
				if (setArchived === void 0) {
					setProblem({ error: t("sessions.unavailable") });
					return;
				}
				setBusyId(row.id);
				setProblem(null);
				const result = await setArchived(row.id, row.archived, false);
				setBusyId(null);
				if (result.ok) return;
				if (result.unavailable === true) {
					setProblem({ error: t("sessions.unavailable") });
					return;
				}
				if (result.active !== void 0) {
					setArchiveError(void 0);
					setArchiveStop({
						row,
						activity: result.active
					});
					return;
				}
				setProblem({
					...result.failure === void 0 ? {} : { failure: result.failure },
					...result.message === void 0 ? {} : { error: result.message }
				});
			};
			/**
			* Archive every selected row that is not archived yet.
			*
			* Running rows are left for the single-row stop-and-archive confirmation:
			* stopping work in bulk without naming the sessions would hide what is about
			* to be interrupted, so this pass skips them and reports the count instead.
			*/
			const archiveSelected = async () => {
				if (setArchived === void 0) {
					setProblem({ error: t("sessions.unavailable") });
					return;
				}
				if (bulkArchiving) return;
				const targets = rows.filter((row) => selected.has(row.id) && !row.archived);
				if (targets.length === 0) return;
				setBulkArchiving(true);
				setProblem(null);
				const archivedIds = [];
				let skipped = 0;
				let firstFailure;
				for (const row of targets) {
					const result = await setArchived(row.id, false, false);
					if (result.ok) archivedIds.push(row.id);
					else if (result.active !== void 0) skipped += 1;
					else firstFailure ??= result;
				}
				setBulkArchiving(false);
				if (archivedIds.length > 0) setSelected((previous) => {
					const next = new Set(previous);
					for (const id of archivedIds) next.delete(id);
					return next;
				});
				const failed = targets.length - archivedIds.length - skipped;
				if (failed > 0) {
					setProblem({
						...archivedIds.length === 0 ? {} : { prefix: {
							key: "sessions.bulkArchiveFailed",
							params: {
								archived: archivedIds.length,
								failed
							}
						} },
						...firstFailure?.failure === void 0 ? {} : { failure: firstFailure.failure },
						...firstFailure?.message === void 0 ? {} : { error: firstFailure.message }
					});
					return;
				}
				if (skipped > 0) setProblem({ prefix: {
					key: "sessions.bulkArchivePartial",
					params: {
						archived: archivedIds.length,
						skipped
					}
				} });
			};
			const closeArchiveStop = () => {
				if (archiving) return;
				setArchiveStop(null);
				setArchiveError(void 0);
			};
			const confirmStopArchive = async () => {
				const pending = archiveStop;
				if (archiving || pending === null || setArchived === void 0) return;
				setArchiving(true);
				setArchiveError(void 0);
				const result = await setArchived(pending.row.id, false, true);
				setArchiving(false);
				if (result.ok) {
					setArchiveStop(null);
					return;
				}
				if (result.failure !== void 0) {
					setArchiveError(t(`error.${result.failure.code}`, result.failure.params));
					return;
				}
				setArchiveError(typeof result.message === "string" && result.message !== "" ? result.message : t("sessions.actionFailed"));
			};
			const loading = sessionState.phase === "pending" && rows.length === 0;
			const loadFailed = !loading && rows.length === 0 && sessionState.error !== void 0 && sessionState.error !== null;
			const deleteIsBatch = (deleteTarget?.ids.length ?? 0) > 1;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "dsh-cs-settings",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h2", {
						className: "dsh-cs-settings-heading",
						children: t("settings.title")
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: "dsh-cs-settings-description",
						children: t("settings.description")
					})] }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "dsh-cs-toolbar",
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Input, {
								className: "dsh-cs-search",
								type: "search",
								value: query,
								placeholder: t("sessions.searchPlaceholder"),
								"aria-label": t("sessions.search"),
								onChange: (event) => {
									setQuery(event.target.value);
									clearSelection();
								}
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(FilterMenu, {
								label: workspaceLabel,
								items: workspaceItems,
								selectedId: workspaceFilter,
								className: "dsh-cs-filter-workspace",
								listClassName: "dsh-cs-menu",
								onSelect: (id) => {
									if (id === workspaceFilter) return;
									setWorkspaceFilter(id);
									clearSelection();
								}
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(FilterMenu, {
								label: archiveLabel,
								items: archiveItems,
								selectedId: archiveFilter,
								className: "dsh-cs-filter-archive",
								align: "end",
								onSelect: (id) => {
									if (id === archiveFilter) return;
									setArchiveFilter(id);
									clearSelection();
								}
							})
						]
					}),
					problem !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "dsh-cs-problem",
						role: "alert",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: problemText(t, problem) }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: "dsh-cs-problem-dismiss",
							"aria-label": t("action.close"),
							onClick: () => {
								setProblem(null);
							},
							children: "×"
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "dsh-cs-selection-bar",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: "dsh-cs-selection-count",
							children: t("sessions.selectedCount", { count: selected.size })
						}), selected.size > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "dsh-cs-bulk-actions",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: "dsh-cs-link",
								disabled: archivableSelected.length === 0 || bulkArchiving,
								onClick: () => {
									archiveSelected();
								},
								children: t("sessions.archiveSelected")
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: "dsh-cs-link dsh-cs-danger",
								disabled: deleting || bulkArchiving,
								onClick: () => {
									openDelete([...selected]);
								},
								children: t("sessions.deleteSelected")
							})]
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "dsh-cs-table",
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "dsh-cs-table-body",
							role: "table",
							"aria-label": t("settings.title"),
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "dsh-cs-table-head",
									role: "row",
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											role: "columnheader",
											className: "dsh-cs-head-check",
											children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
												ref: selectAllRef,
												type: "checkbox",
												checked: allSelected,
												disabled: visibleIds.length === 0 || bulkArchiving,
												"aria-label": t("sessions.selectAll"),
												title: t("sessions.selectAll"),
												onChange: toggleAll
											})
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											role: "columnheader",
											children: t("sessions.columnTitle")
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											role: "columnheader",
											children: t("sessions.columnStatus")
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											role: "columnheader",
											className: "dsh-cs-head-actions",
											children: t("sessions.columnActions")
										})
									]
								}),
								loading && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: "dsh-cs-empty",
									children: t("sessions.loading")
								}),
								loadFailed && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "dsh-cs-empty",
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: t("sessions.loadFailed") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
										variant: "outline",
										size: "sm",
										onClick: () => {
											refresh?.();
										},
										children: t("sessions.retry")
									})]
								}),
								!loading && !loadFailed && filtered.map((row) => {
									const full = formatFull(row.updatedAt);
									const state = row.running ? "running" : row.archived ? "archived" : "unarchived";
									const stateLabel = row.running ? t("sessions.running") : row.archived ? t("sessions.archived") : t("sessions.unarchived");
									return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: "dsh-cs-row",
										role: "row",
										"data-session-id": row.id,
										"data-archived": row.archived ? "1" : "0",
										"data-running": row.running ? "1" : "0",
										children: [
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
												className: "dsh-cs-row-check",
												type: "checkbox",
												checked: selected.has(row.id),
												disabled: bulkArchiving,
												"aria-label": t("sessions.selectOne", { title: row.title }),
												onChange: (event) => {
													toggleRow(row.id, event.target.checked);
												}
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
												className: "dsh-cs-main",
												role: "cell",
												children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
													className: "dsh-cs-title",
													title: row.title,
													children: row.title
												}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
													className: "dsh-cs-meta",
													children: [
														/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
															className: "dsh-cs-workspace",
															title: row.cwd ?? row.workspaceTitle,
															children: row.workspaceTitle ?? t("sessions.noWorkspace")
														}),
														/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
															className: "dsh-cs-sep",
															"aria-hidden": "true",
															children: "·"
														}),
														/* @__PURE__ */ (0, react_jsx_runtime.jsx)("time", {
															className: "dsh-cs-date",
															dateTime: row.updatedAt > 0 ? new Date(row.updatedAt).toISOString() : void 0,
															title: full,
															children: formatDay(row.updatedAt)
														})
													]
												})]
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												className: `dsh-cs-status dsh-cs-status-${state}`,
												role: "cell",
												children: stateLabel
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
												className: "dsh-cs-actions",
												role: "cell",
												children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
													type: "button",
													className: "dsh-cs-link",
													disabled: busyId === row.id || bulkArchiving,
													onClick: () => {
														toggleArchive(row);
													},
													children: row.archived ? t("sessions.unarchive") : t("sessions.archive")
												}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
													type: "button",
													className: "dsh-cs-link dsh-cs-danger",
													disabled: deleting || busyId === row.id || bulkArchiving,
													onClick: () => {
														openDelete([row.id]);
													},
													children: t("sessions.delete")
												})]
											})
										]
									}, row.id);
								}),
								!loading && !loadFailed && filtered.length === 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: "dsh-cs-empty",
									children: rows.length === 0 ? t("sessions.empty") : t("sessions.noMatches")
								})
							]
						})
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Modal, {
						open: deleteTarget !== null,
						onClose: closeDelete,
						title: deleteIsBatch ? t("sessions.deleteSelectedTitle") : t("delete.title"),
						description: deleteIsBatch ? t("sessions.deleteBatchDescription", { count: deleteTarget?.ids.length ?? 0 }) : t("delete.description"),
						closeLabel: t("action.close"),
						footer: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
							variant: "outline",
							"data-modal-autofocus": true,
							disabled: deleting,
							onClick: closeDelete,
							children: t("action.cancel")
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
							variant: "outline",
							className: "dsh-cs-delete-action",
							disabled: deleting,
							onClick: () => {
								confirmDelete();
							},
							children: deleting ? t("delete.pending") : t("delete.confirm")
						})] }),
						children: deleteError === void 0 ? void 0 : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: "dsh-cs-delete-error",
							role: "alert",
							children: deleteError
						})
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)(_deepseek_ai_dsh_client_ui_primitives.Modal, {
						open: archiveStop !== null,
						onClose: closeArchiveStop,
						title: t("sessions.archiveStopTitle"),
						description: archiveStop === null ? void 0 : t("sessions.archiveStopDescription", { title: archiveStop.row.title }),
						closeLabel: t("action.close"),
						footer: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
							variant: "outline",
							"data-modal-autofocus": true,
							disabled: archiving,
							onClick: closeArchiveStop,
							children: t("action.cancel")
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
							variant: "outline",
							className: "dsh-cs-delete-action",
							disabled: archiving,
							onClick: () => {
								confirmStopArchive();
							},
							children: archiving ? t("sessions.archiveStopPending") : t("sessions.archiveStopAction")
						})] }),
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("ul", {
							className: "dsh-cs-activity",
							"aria-label": t("sessions.archiveActivity"),
							children: (archiveStop?.activity ?? []).map((entry, index) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("li", { children: activityLine(t, entry) }, `${entry.kind}-${String(index)}`))
						}), archiveError === void 0 ? void 0 : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: "dsh-cs-delete-error",
							role: "alert",
							children: archiveError
						})]
					})
				]
			});
		}
		//#endregion
		//#region src/client/archive.ts
		/** Read the activity families out of a `workspace/session-active` refusal. */
		function activityOf(details) {
			const entries = details?.activity;
			if (!Array.isArray(entries)) return [];
			const activity = [];
			for (const entry of entries) {
				if (entry === null || typeof entry !== "object") continue;
				const record = entry;
				if (typeof record.kind !== "string" || record.kind === "") continue;
				const count = Array.isArray(record.items) && record.items.length > 0 ? record.items.length : 1;
				activity.push({
					kind: record.kind,
					count
				});
			}
			return activity;
		}
		/**
		* Archive or restore one Session.
		*
		* @param workspaces - the client Workspace service, when the composition mounts one.
		* @param sessionId - the Session to move between the two sets.
		* @param archived - which set it should end in.
		* @param stopActivity - ask the Host to stop running work instead of refusing.
		* @returns the outcome the panel renders.
		*/
		async function setSessionArchived(workspaces, sessionId, archived, stopActivity) {
			if (workspaces === void 0 || workspaces === null || typeof workspaces.archiveSession !== "function" || typeof workspaces.unarchiveSession !== "function") return {
				ok: false,
				unavailable: true
			};
			try {
				if (archived) await workspaces.unarchiveSession(sessionId);
				else await workspaces.archiveSession(sessionId, stopActivity ? { stopActivity: true } : void 0);
				return { ok: true };
			} catch (error) {
				const failure = error;
				const code = failure?.rpcError?.code;
				if (code === "workspace/session-active") {
					const activity = activityOf(failure.rpcError?.details);
					if (activity.length > 0) return {
						ok: false,
						active: activity
					};
					return {
						ok: false,
						message: typeof failure.rpcError?.message === "string" && failure.rpcError.message !== "" ? failure.rpcError.message : "the session is still running"
					};
				}
				if (code === "session/not-found") return {
					ok: false,
					failure: { code: "unknown-session" }
				};
				return {
					ok: false,
					message: error instanceof Error ? error.message : String(error)
				};
			}
		}
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
			"settings.description": "Search, filter, archive, or delete sessions.",
			"sessions.search": "Search session titles",
			"sessions.searchPlaceholder": "Search...",
			"sessions.allWorkspaces": "All workspaces",
			"sessions.noWorkspace": "No workspace",
			"sessions.allSessions": "All sessions",
			"sessions.unarchived": "Unarchived",
			"sessions.archived": "Archived",
			"sessions.running": "Running",
			"sessions.selectAll": "Select all",
			"sessions.selectOne": "Select {title}",
			"sessions.archiveSelected": "Archive selected",
			"sessions.deleteSelected": "Delete selected",
			"sessions.selectedCount": "{count} selected",
			"sessions.columnTitle": "Session",
			"sessions.columnStatus": "Status",
			"sessions.columnActions": "Actions",
			"sessions.archive": "Archive",
			"sessions.unarchive": "Unarchive",
			"sessions.delete": "Delete",
			"sessions.loading": "Loading sessions…",
			"sessions.empty": "No sessions yet",
			"sessions.noMatches": "No matching sessions",
			"sessions.loadFailed": "The session list could not be loaded",
			"sessions.retry": "Retry",
			"sessions.unavailable": "Session services are not ready, so the archive action is unavailable",
			"sessions.actionFailed": "The action failed",
			"sessions.bulkPartial": "Deleted {deleted} session(s); {failed} could not be deleted.",
			"sessions.bulkStopped": "Deleted {deleted} session(s); the rest could not be processed.",
			"sessions.bulkArchivePartial": "Archived {archived} session(s); {skipped} running session(s) were skipped.",
			"sessions.bulkArchiveFailed": "Archived {archived} session(s); {failed} could not be archived.",
			"sessions.deleteSelectedTitle": "Delete selected sessions",
			"sessions.deleteBatchDescription": "This removes the {count} selected sessions and all of their subagent sessions from disk, including their logs. Running sessions will be terminated. This cannot be undone!",
			"sessions.archiveStopTitle": "Stop and archive this session?",
			"sessions.archiveStopDescription": "“{title}” still has work in progress. Archiving stops it first; the stopped work will not resume on its own.",
			"sessions.archiveActivity": "Work that will be stopped",
			"sessions.activityTurn": "The turn in progress",
			"sessions.activitySubagents": "{count} running subagent(s)",
			"sessions.activityJobs": "{count} background job(s)",
			"sessions.activitySchedules": "{count} scheduled reminder(s)",
			"sessions.activityOther": "{count} other item(s) of work ({kind})",
			"sessions.archiveStopAction": "Stop and archive",
			"sessions.archiveStopPending": "Stopping and archiving…",
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
			"settings.description": "搜索、筛选、归档或删除会话。",
			"sessions.search": "搜索会话标题",
			"sessions.searchPlaceholder": "搜索...",
			"sessions.allWorkspaces": "全部工作区",
			"sessions.noWorkspace": "未关联工作区",
			"sessions.allSessions": "全部会话",
			"sessions.unarchived": "未归档",
			"sessions.archived": "已归档",
			"sessions.running": "运行中",
			"sessions.selectAll": "全选",
			"sessions.selectOne": "选择 {title}",
			"sessions.archiveSelected": "归档已选",
			"sessions.deleteSelected": "删除已选",
			"sessions.selectedCount": "已选择 {count} 个",
			"sessions.columnTitle": "会话标题",
			"sessions.columnStatus": "状态",
			"sessions.columnActions": "操作",
			"sessions.archive": "归档",
			"sessions.unarchive": "取消归档",
			"sessions.delete": "删除",
			"sessions.loading": "正在载入会话…",
			"sessions.empty": "暂无会话",
			"sessions.noMatches": "没有匹配的会话",
			"sessions.loadFailed": "无法读取会话列表",
			"sessions.retry": "重试",
			"sessions.unavailable": "会话服务尚未就绪，无法归档",
			"sessions.actionFailed": "操作失败",
			"sessions.bulkPartial": "已删除 {deleted} 个会话，{failed} 个删除失败。",
			"sessions.bulkStopped": "已删除 {deleted} 个会话，其余未能继续处理。",
			"sessions.bulkArchivePartial": "已归档 {archived} 个会话，{skipped} 个运行中的会话已跳过。",
			"sessions.bulkArchiveFailed": "已归档 {archived} 个会话，{failed} 个归档失败。",
			"sessions.deleteSelectedTitle": "删除选中的会话",
			"sessions.deleteBatchDescription": "从磁盘移除选中的 {count} 个会话及其所有子会话的日志，正在运行的会话将被终止。此操作不可撤销！",
			"sessions.archiveStopTitle": "停止并归档此会话？",
			"sessions.archiveStopDescription": "“{title}”仍有正在进行的工作。归档会先停止这些工作，停止的工作不会自动继续。",
			"sessions.archiveActivity": "将被停止的工作",
			"sessions.activityTurn": "进行中的回合",
			"sessions.activitySubagents": "{count} 个运行中的子智能体",
			"sessions.activityJobs": "{count} 个后台任务",
			"sessions.activitySchedules": "{count} 条定时提醒",
			"sessions.activityOther": "{count} 项其他工作（{kind}）",
			"sessions.archiveStopAction": "停止并归档",
			"sessions.archiveStopPending": "正在停止并归档…",
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
			".dsh-cs-settings{display:flex;flex-direction:column;box-sizing:border-box;height:100%;min-height:0;gap:12px;max-width:760px;color:var(--dsw-alias-label-primary)}",
			".dsh-cs-settings-heading{margin:0;font-size:18px;font-weight:600;line-height:26px}",
			".dsh-cs-settings-description{margin:2px 0 0;color:var(--dsw-alias-label-tertiary);font-size:13px;line-height:20px}",
			".dsh-cs-toolbar{display:flex;align-items:center;gap:8px;min-width:0}",
			".dsh-cs-search{flex:1;min-width:120px;box-sizing:border-box}",
			".dsh-cs-filter-wrap{flex:none;min-width:0}",
			".dsh-cs-filter{display:inline-flex;align-items:center;gap:6px;box-sizing:border-box;height:32px;max-width:180px;padding:0 8px 0 10px;border:.5px solid var(--dsw-alias-border-l4);border-radius:var(--dsw-radius-md);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font:inherit;font-size:13px;line-height:20px;text-align:left;cursor:pointer}",
			".dsh-cs-filter:hover{border-color:var(--dsw-alias-border-l3)}",
			".dsh-cs-filter:focus-visible{outline:var(--dsw-focus-ring-width) solid var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary));outline-offset:1px}",
			".dsh-cs-filter-label{flex:1;min-width:0;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}",
			".dsh-cs-filter-workspace{width:150px}",
			".dsh-cs-filter-archive{width:120px}",
			".dsh-cs-caret{display:inline-flex;flex:none;align-items:center;justify-content:center;margin-left:auto;color:var(--dsw-alias-label-tertiary)}",
			".dsh-cs-caret svg{display:block;width:12px;height:12px}",
			".dsh-cs-menu.dsh-cs-menu{min-width:180px;max-width:280px}",
			".dsh-cs-selection-bar{display:flex;align-items:center;gap:10px;min-height:22px}",
			".dsh-cs-selection-count{font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary)}",
			".dsh-cs-bulk-actions{display:flex;align-items:center;gap:2px;margin-left:auto}",
			".dsh-cs-head-check{display:flex;align-items:center;justify-content:center}",
			".dsh-cs-row-check{justify-self:center}",
			".dsh-cs-head-check input,.dsh-cs-row-check{margin:0;accent-color:var(--dsw-alias-state-business-primary);cursor:pointer}",
			".dsh-cs-head-check input:disabled,.dsh-cs-row-check:disabled{cursor:not-allowed;opacity:.4}",
			".dsh-cs-problem{display:flex;align-items:flex-start;gap:8px;padding:7px 9px;border:.5px solid color-mix(in srgb,var(--dsw-alias-state-error-primary) 35%,transparent);border-radius:var(--dsw-radius-sm,6px);background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 9%,transparent);color:var(--dsw-alias-state-error-primary);font-size:12px;line-height:18px}",
			".dsh-cs-problem span{flex:1;min-width:0;white-space:pre-wrap}",
			".dsh-cs-problem-dismiss{flex:none;border:0;background:transparent;padding:0 2px;color:inherit;font:inherit;font-size:14px;line-height:18px;cursor:pointer;opacity:.7}",
			".dsh-cs-problem-dismiss:hover{opacity:1}",
			".dsh-cs-table{display:flex;flex:1;flex-direction:column;min-height:0;border:.5px solid var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-md);overflow:hidden}",
			".dsh-cs-table-body{flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain}",
			".dsh-cs-table-head,.dsh-cs-row{display:grid;grid-template-columns:22px minmax(0,1fr) 66px 112px;align-items:center;column-gap:8px;padding:8px 10px}",
			".dsh-cs-table-head{position:sticky;top:0;z-index:1;background:var(--dsw-alias-bg-layer-1);border-bottom:.5px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-tertiary);font-size:11.5px;line-height:18px}",
			".dsh-cs-head-actions{padding-right:5px;text-align:right}",
			".dsh-cs-row+.dsh-cs-row{border-top:.5px solid var(--dsw-alias-border-l2)}",
			".dsh-cs-row:hover{background:var(--dsw-alias-interactive-bg-hover)}",
			".dsh-cs-main{display:flex;flex-direction:column;gap:1px;min-width:0}",
			".dsh-cs-title{overflow:hidden;white-space:nowrap;text-overflow:ellipsis;font-size:13px;line-height:20px;color:var(--dsw-alias-label-primary)}",
			".dsh-cs-meta{display:flex;align-items:center;gap:4px;min-width:0;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;font-size:11.5px;line-height:17px;color:var(--dsw-alias-label-tertiary)}",
			".dsh-cs-workspace{overflow:hidden;text-overflow:ellipsis}",
			".dsh-cs-sep{flex:none;opacity:.7}",
			".dsh-cs-status{font-size:12px;line-height:18px;white-space:nowrap}",
			".dsh-cs-status-running{color:var(--dsw-alias-state-success-primary)}",
			".dsh-cs-status-unarchived{color:var(--dsw-alias-state-warn-primary)}",
			".dsh-cs-status-archived{color:var(--dsw-alias-label-tertiary)}",
			".dsh-cs-actions{display:flex;justify-content:flex-end;gap:2px;min-width:0}",
			".dsh-cs-link{border:0;border-radius:var(--dsw-radius-sm);padding:2px 4px;background:transparent;color:var(--dsw-alias-label-tertiary);font:inherit;font-size:12px;line-height:18px;white-space:nowrap;cursor:pointer}",
			".dsh-cs-link:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}",
			".dsh-cs-link:disabled{opacity:.45;cursor:not-allowed}",
			".dsh-cs-danger:hover:not(:disabled){color:var(--dsw-alias-state-error-primary)}",
			".dsh-cs-date{flex:none;font-size:11.5px;line-height:17px;white-space:nowrap;color:var(--dsw-alias-label-tertiary);font-variant-numeric:tabular-nums}",
			".dsh-cs-empty{padding:26px 12px;text-align:center;font-size:13px;line-height:20px;color:var(--dsw-alias-label-tertiary)}",
			".dsh-cs-empty p{margin:0 0 10px}",
			".dsh-cs-activity{display:flex;flex-direction:column;gap:4px;margin:0;padding:0;list-style:none;font-size:12.5px;line-height:19px;color:var(--dsw-alias-label-secondary)}",
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
		*
		* The section reads the shell's Session and Workspace stores directly and
		* archives through the Workspace controller, so only deletion — the operation
		* the client face does not expose — needs this package's own Host route.
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
			const setArchived = (sessionId, archived, stopActivity) => setSessionArchived(ctx.get("workspaces"), sessionId, archived, stopActivity);
			const refreshSessions = () => {
				try {
					ctx.get("sessions")?.refresh?.();
				} catch {}
			};
			slots.inject("settings.section", () => slots.register({
				name: "settings.section",
				id: "dsh-cool-session.sessions",
				order: 12,
				label: () => t("settings.nav"),
				locale: NS,
				inject: () => ({
					setArchived,
					refresh: refreshSessions,
					onDeleted: afterDelete
				})
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
