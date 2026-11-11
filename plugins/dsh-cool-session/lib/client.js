window.__ModuleLoader__.load({
	id: "dsh-cool-session",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		let react = require("react");
		let react_jsx_runtime = require("react/jsx-runtime");
		// src/client/api.ts
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
		// src/client/reason.ts
		/**
		* The activity families a dictionary names, keyed by the Host's kind.
		*
		* The Host sends `turn`, `subagent`, `job` and `schedule` because those are the
		* provider identifiers it works with, not prose. Only this half knows the
		* language to read them in, so the translation happens here; a kind a future
		* build adds stays as its identifier rather than disappearing.
		*/
		const ACTIVITY_KEYS = {
			turn: "activity.turn",
			subagent: "activity.subagent",
			job: "activity.job",
			schedule: "activity.schedule"
		};
		/**
		* Word the work a refusal names, in the active language.
		*
		* @param t - the page's translate seat.
		* @param raw - the Host's comma-separated kind list, when it named any.
		* @returns the phrase to put in the sentence's `{activity}` position.
		*/
		function activityPhrase(t, raw) {
			const kinds = typeof raw === "string" ? raw.split(",").map((kind) => kind.trim()).filter((kind) => kind !== "") : [];
			if (kinds.length === 0) return t("error.activityFallback");
			return kinds.map((kind) => {
				const key = ACTIVITY_KEYS[kind];
				return key === void 0 ? kind : t(key);
			}).join(t("activity.separator"));
		}
		/**
		* Word one coded refusal as a sentence.
		*
		* @param t - the page's translate seat.
		* @param failure - the refusal code and the values its sentence interpolates.
		* @returns the sentence to show.
		*/
		function failureText(t, failure) {
			if (failure.code === "delete-active") return t("error.delete-active", {
				...failure.params,
				activity: activityPhrase(t, failure.params?.activity)
			});
			return t(`error.${failure.code}`, failure.params);
		}
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
				const sentence = failureText(t, payload.failure);
				if (payload.failure.code === "delete-partial" && typeof payload.error === "string" && payload.error !== "") return `${sentence} ${payload.error}`;
				return sentence;
			}
			if (payload.error === "HTTP 405") return t("error.host-stale");
			return typeof payload.error === "string" && payload.error !== "" ? payload.error : t(fallback);
		}
		// src/client/session-menu.tsx
		/**
		* The native Session menu's delete row and its confirmation overlay.
		*
		* The row is contributed to `sidebar.workspaces.session.menu.item` by builds
		* that have no `contextMenus` service; the client entry registers a plain-data
		* action instead wherever that service exists, because the shipped Archive row
		* is a footer action and only a footer action can follow it. Menus unmount as
		* soon as they close, so either row only records a request; the frame-wide
		* `shell.overlay` entry owns the dialog's state and the Host call. That split is
		* also what lets the dialog survive the menu's portal disappearing on click.
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
		/** Whether the menu service has taken over the Delete row. */
		let serviceOwnsRow = false;
		/**
		* Stop drawing the legacy Slot row.
		*
		* The client entry installs that row when `apply` runs before `contextMenus` is
		* mounted; the service then contributes Delete as a footer action so it can
		* follow Archive. This flag keeps the two paths from drawing the row twice.
		*/
		function retireLegacyDeleteRow() {
			serviceOwnsRow = true;
		}
		/**
		* The legacy delete row for builds without `contextMenus`, placed after Copy
		* Session ID and separated from the shipped group. Selecting it closes the menu
		* and raises the confirmation overlay.
		*
		* @param props - the row identity, menu hook, and locale seat.
		* @returns the menu row, or null once the menu service owns it.
		*/
		function SessionDeleteMenuItem({ sessionId, useMenuOpenState, t }) {
			const [, setMenuOpen] = useMenuOpenState();
			if (serviceOwnsRow) return null;
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
		// src/client/icons.ts
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
		// src/client/locales/zh.ts
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
			"sessions.bulkPartial.one": "已删除 1 个会话，{failed} 个删除失败。",
			"sessions.bulkPartial.other": "已删除 {deleted} 个会话，{failed} 个删除失败。",
			"sessions.bulkStopped.one": "已删除 1 个会话，其余未能继续处理。",
			"sessions.bulkStopped.other": "已删除 {deleted} 个会话，其余未能继续处理。",
			"sessions.bulkArchivePartial.one": "已归档 1 个会话，{skipped} 个运行中的会话已跳过。",
			"sessions.bulkArchivePartial.other": "已归档 {archived} 个会话，{skipped} 个运行中的会话已跳过。",
			"sessions.bulkArchiveFailed.one": "已归档 1 个会话，{failed} 个归档失败。",
			"sessions.bulkArchiveFailed.other": "已归档 {archived} 个会话，{failed} 个归档失败。",
			"sessions.deleteSelectedTitle": "删除选中的会话",
			"sessions.deleteBatchDescription": "从磁盘移除选中的 {count} 个会话及其所有子会话的日志，正在运行的会话将被终止。此操作不可撤销！",
			"sessions.archiveStopTitle": "停止并归档此会话？",
			"sessions.archiveStopDescription": "“{title}”仍有正在进行的工作。归档会先停止这些工作，停止的工作不会自动继续。",
			"sessions.archiveActivity": "将被停止的工作",
			"sessions.activityTurn": "进行中的回合",
			"sessions.activitySubagents.one": "1 个运行中的子智能体",
			"sessions.activitySubagents.other": "{count} 个运行中的子智能体",
			"sessions.activityJobs.one": "1 个后台任务",
			"sessions.activityJobs.other": "{count} 个后台任务",
			"sessions.activitySchedules.one": "1 条定时提醒",
			"sessions.activitySchedules.other": "{count} 条定时提醒",
			"sessions.activityOther.one": "1 项其他工作（{kind}）",
			"sessions.activityOther.other": "{count} 项其他工作（{kind}）",
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
			"error.delete-partial": "已删除 {deleted} 个会话，但还有 {remaining} 个未能删除；请重试剩余项",
			"error.session-running": "会话仍在运行，无法归档",
			"error.activityFallback": "进行中的工作",
			"activity.turn": "进行中的回合",
			"activity.subagent": "运行中的子智能体",
			"activity.job": "后台任务",
			"activity.schedule": "定时提醒",
			"activity.separator": "、"
		};
		// src/client/locales/en.ts
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
			"sessions.bulkPartial.one": "Deleted 1 session; {failed} could not be deleted.",
			"sessions.bulkPartial.other": "Deleted {deleted} sessions; {failed} could not be deleted.",
			"sessions.bulkStopped.one": "Deleted 1 session; the rest could not be processed.",
			"sessions.bulkStopped.other": "Deleted {deleted} sessions; the rest could not be processed.",
			"sessions.bulkArchivePartial.one": "Archived 1 session; {skipped} skipped because work was still running.",
			"sessions.bulkArchivePartial.other": "Archived {archived} sessions; {skipped} skipped because work was still running.",
			"sessions.bulkArchiveFailed.one": "Archived 1 session; {failed} could not be archived.",
			"sessions.bulkArchiveFailed.other": "Archived {archived} sessions; {failed} could not be archived.",
			"sessions.deleteSelectedTitle": "Delete selected sessions",
			"sessions.deleteBatchDescription": "This removes the {count} selected sessions and all of their subagent sessions from disk, including their logs. Running sessions will be terminated. This cannot be undone!",
			"sessions.archiveStopTitle": "Stop and archive this session?",
			"sessions.archiveStopDescription": "“{title}” still has work in progress. Archiving stops it first; the stopped work will not resume on its own.",
			"sessions.archiveActivity": "Work that will be stopped",
			"sessions.activityTurn": "The turn in progress",
			"sessions.activitySubagents.one": "1 running subagent",
			"sessions.activitySubagents.other": "{count} running subagents",
			"sessions.activityJobs.one": "1 background job",
			"sessions.activityJobs.other": "{count} background jobs",
			"sessions.activitySchedules.one": "1 scheduled reminder",
			"sessions.activitySchedules.other": "{count} scheduled reminders",
			"sessions.activityOther.one": "1 other item of work ({kind})",
			"sessions.activityOther.other": "{count} other items of work ({kind})",
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
			"error.delete-partial": "Some sessions could not be deleted: {deleted} removed, {remaining} still present. Retry the remaining ones",
			"error.session-running": "The session is still running and could not be archived",
			"error.activityFallback": "work in progress",
			"activity.turn": "the turn in progress",
			"activity.subagent": "running subagents",
			"activity.job": "background jobs",
			"activity.schedule": "scheduled reminders",
			"activity.separator": ", "
		};
		// src/client/locales/ja.ts
		const ja = {
			"action.delete": "セッションを削除",
			"action.cancel": "キャンセル",
			"action.close": "閉じる",
			"settings.nav": "セッション",
			"settings.title": "セッション",
			"settings.description": "セッションの検索・絞り込み・アーカイブ・削除を行います。",
			"sessions.search": "セッション名を検索",
			"sessions.searchPlaceholder": "検索...",
			"sessions.allWorkspaces": "すべてのワークスペース",
			"sessions.noWorkspace": "ワークスペースなし",
			"sessions.allSessions": "すべてのセッション",
			"sessions.unarchived": "未アーカイブ",
			"sessions.archived": "アーカイブ済み",
			"sessions.running": "実行中",
			"sessions.selectAll": "すべて選択",
			"sessions.selectOne": "{title} を選択",
			"sessions.archiveSelected": "選択項目をアーカイブ",
			"sessions.deleteSelected": "選択項目を削除",
			"sessions.selectedCount": "{count} 件選択中",
			"sessions.columnTitle": "セッション名",
			"sessions.columnStatus": "状態",
			"sessions.columnActions": "操作",
			"sessions.archive": "アーカイブ",
			"sessions.unarchive": "アーカイブを解除",
			"sessions.delete": "削除",
			"sessions.loading": "セッションを読み込み中…",
			"sessions.empty": "セッションはまだありません",
			"sessions.noMatches": "一致するセッションはありません",
			"sessions.loadFailed": "セッション一覧を読み込めませんでした",
			"sessions.retry": "再試行",
			"sessions.unavailable": "セッションサービスが準備できていないため、アーカイブできません",
			"sessions.actionFailed": "操作に失敗しました",
			"sessions.bulkPartial.one": "セッションを 1 件削除しました。{failed} 件は削除できませんでした。",
			"sessions.bulkPartial.other": "セッションを {deleted} 件削除しました。{failed} 件は削除できませんでした。",
			"sessions.bulkStopped.one": "セッションを 1 件削除しました。残りは処理できませんでした。",
			"sessions.bulkStopped.other": "セッションを {deleted} 件削除しました。残りは処理できませんでした。",
			"sessions.bulkArchivePartial.one": "セッションを 1 件アーカイブしました。{skipped} 件は作業中のためスキップしました。",
			"sessions.bulkArchivePartial.other": "セッションを {archived} 件アーカイブしました。{skipped} 件は作業中のためスキップしました。",
			"sessions.bulkArchiveFailed.one": "セッションを 1 件アーカイブしました。{failed} 件はアーカイブできませんでした。",
			"sessions.bulkArchiveFailed.other": "セッションを {archived} 件アーカイブしました。{failed} 件はアーカイブできませんでした。",
			"sessions.deleteSelectedTitle": "選択したセッションを削除",
			"sessions.deleteBatchDescription": "選択した {count} 件のセッションとそのすべてのサブエージェントセッションを、ログを含めてディスクから削除します。実行中のセッションは終了されます。この操作は元に戻せません！",
			"sessions.archiveStopTitle": "このセッションを停止してアーカイブしますか？",
			"sessions.archiveStopDescription": "「{title}」には進行中の作業があります。アーカイブするとまず停止され、停止された作業は自動的に再開されません。",
			"sessions.archiveActivity": "停止される作業",
			"sessions.activityTurn": "進行中のターン",
			"sessions.activitySubagents.one": "実行中のサブエージェント 1 件",
			"sessions.activitySubagents.other": "実行中のサブエージェント {count} 件",
			"sessions.activityJobs.one": "バックグラウンドジョブ 1 件",
			"sessions.activityJobs.other": "バックグラウンドジョブ {count} 件",
			"sessions.activitySchedules.one": "スケジュールされたリマインダー 1 件",
			"sessions.activitySchedules.other": "スケジュールされたリマインダー {count} 件",
			"sessions.activityOther.one": "その他の作業 1 件（{kind}）",
			"sessions.activityOther.other": "その他の作業 {count} 件（{kind}）",
			"sessions.archiveStopAction": "停止してアーカイブ",
			"sessions.archiveStopPending": "停止してアーカイブ中…",
			"delete.title": "セッションを削除",
			"delete.description": "このセッションとそのすべてのサブエージェントセッションを、ログを含めてディスクから削除します。実行中のセッションは終了されます。この操作は元に戻せません！",
			"delete.pending": "停止して削除中…",
			"delete.confirm": "削除",
			"error.host-stale": "Host 側が古いビルドのままです。DSH を再起動してから再試行してください。",
			"error.missing-session": "セッションが指定されていません",
			"error.unknown-session": "そのセッションは既に存在しません",
			"error.subagent-delete": "サブエージェントのセッションは単独では削除できません。親の会話を削除してください",
			"error.delete-failed": "セッションを削除できませんでした",
			"error.delete-unsupported": "この Harness は削除に必要なディスク上のセッション配置を公開していません",
			"error.delete-active": "セッションはまだ実行中（{activity}）で停止できなかったため、削除しませんでした",
			"error.session-live": "セッションがまだ活動中で、解放できませんでした",
			"error.delete-partial": "一部のセッションを削除できませんでした：{deleted} 件を削除、{remaining} 件が残っています。残りを再試行してください",
			"error.session-running": "セッションはまだ実行中で、アーカイブできませんでした",
			"error.activityFallback": "進行中の作業",
			"activity.turn": "進行中のターン",
			"activity.subagent": "実行中のサブエージェント",
			"activity.job": "バックグラウンドジョブ",
			"activity.schedule": "スケジュールされたリマインダー",
			"activity.separator": "、"
		};
		// src/client/locales/es.ts
		const es = {
			"action.delete": "Eliminar sesión",
			"action.cancel": "Cancelar",
			"action.close": "Cerrar",
			"settings.nav": "Sesiones",
			"settings.title": "Sesiones",
			"settings.description": "Busca, filtra, archiva o elimina sesiones.",
			"sessions.search": "Buscar títulos de sesión",
			"sessions.searchPlaceholder": "Buscar...",
			"sessions.allWorkspaces": "Todos los espacios de trabajo",
			"sessions.noWorkspace": "Sin espacio de trabajo",
			"sessions.allSessions": "Todas las sesiones",
			"sessions.unarchived": "Sin archivar",
			"sessions.archived": "Archivadas",
			"sessions.running": "En ejecución",
			"sessions.selectAll": "Seleccionar todo",
			"sessions.selectOne": "Seleccionar {title}",
			"sessions.archiveSelected": "Archivar seleccionadas",
			"sessions.deleteSelected": "Eliminar seleccionadas",
			"sessions.selectedCount": "Seleccionadas: {count}",
			"sessions.columnTitle": "Sesión",
			"sessions.columnStatus": "Estado",
			"sessions.columnActions": "Acciones",
			"sessions.archive": "Archivar",
			"sessions.unarchive": "Desarchivar",
			"sessions.delete": "Eliminar",
			"sessions.loading": "Cargando sesiones…",
			"sessions.empty": "Aún no hay sesiones",
			"sessions.noMatches": "No hay sesiones coincidentes",
			"sessions.loadFailed": "No se pudo cargar la lista de sesiones",
			"sessions.retry": "Reintentar",
			"sessions.unavailable": "Los servicios de sesiones no están listos, por lo que no se puede archivar",
			"sessions.actionFailed": "La acción falló",
			"sessions.bulkPartial.one": "Se eliminó 1 sesión; {failed} no se pudo eliminar.",
			"sessions.bulkPartial.other": "Se eliminaron {deleted} sesiones; {failed} no se pudieron eliminar.",
			"sessions.bulkStopped.one": "Se eliminó 1 sesión; el resto no se pudo procesar.",
			"sessions.bulkStopped.other": "Se eliminaron {deleted} sesiones; el resto no se pudo procesar.",
			"sessions.bulkArchivePartial.one": "Se archivó 1 sesión; {skipped} se omitió porque seguía trabajando.",
			"sessions.bulkArchivePartial.other": "Se archivaron {archived} sesiones; {skipped} se omitieron porque seguían trabajando.",
			"sessions.bulkArchiveFailed.one": "Se archivó 1 sesión; {failed} no se pudo archivar.",
			"sessions.bulkArchiveFailed.other": "Se archivaron {archived} sesiones; {failed} no se pudieron archivar.",
			"sessions.deleteSelectedTitle": "Eliminar las sesiones seleccionadas",
			"sessions.deleteBatchDescription": "Esto elimina del disco las {count} sesiones seleccionadas y todas sus sesiones de subagente, incluidos sus registros. Las sesiones en ejecución se terminarán. ¡Esta acción no se puede deshacer!",
			"sessions.archiveStopTitle": "¿Detener y archivar esta sesión?",
			"sessions.archiveStopDescription": "«{title}» todavía tiene trabajo en progreso. Al archivarla se detiene primero; el trabajo detenido no se reanudará por sí solo.",
			"sessions.archiveActivity": "Trabajo que se detendrá",
			"sessions.activityTurn": "El turno en progreso",
			"sessions.activitySubagents.one": "1 subagente en ejecución",
			"sessions.activitySubagents.other": "{count} subagentes en ejecución",
			"sessions.activityJobs.one": "1 tarea en segundo plano",
			"sessions.activityJobs.other": "{count} tareas en segundo plano",
			"sessions.activitySchedules.one": "1 recordatorio programado",
			"sessions.activitySchedules.other": "{count} recordatorios programados",
			"sessions.activityOther.one": "1 elemento de trabajo más ({kind})",
			"sessions.activityOther.other": "{count} elementos de trabajo más ({kind})",
			"sessions.archiveStopAction": "Detener y archivar",
			"sessions.archiveStopPending": "Deteniendo y archivando…",
			"delete.title": "Eliminar sesión",
			"delete.description": "Esto elimina del disco esta sesión y todas sus sesiones de subagente, incluidos sus registros. Las sesiones en ejecución se terminarán. ¡Esta acción no se puede deshacer!",
			"delete.pending": "Deteniendo y eliminando…",
			"delete.confirm": "Eliminar",
			"error.host-stale": "La mitad Host sigue ejecutando una compilación anterior; reinicia DSH y vuelve a intentarlo.",
			"error.missing-session": "No se indicó ninguna sesión",
			"error.unknown-session": "Esa sesión ya no existe",
			"error.subagent-delete": "Una sesión de subagente no se puede eliminar por sí sola; elimina su conversación principal",
			"error.delete-failed": "No se pudo eliminar la sesión",
			"error.delete-unsupported": "Este Harness no expone la disposición de sesiones en disco necesaria para eliminarlas",
			"error.delete-active": "La sesión sigue en ejecución ({activity}) y no se pudo detener, por lo que no se eliminó",
			"error.session-live": "La sesión sigue activa y no se pudo liberar",
			"error.delete-partial": "No se pudieron eliminar algunas sesiones: {deleted} eliminadas, {remaining} aún presentes. Reintenta las restantes",
			"error.session-running": "La sesión sigue en ejecución y no se pudo archivar",
			"error.activityFallback": "trabajo en progreso",
			"activity.turn": "el turno en progreso",
			"activity.subagent": "subagentes en ejecución",
			"activity.job": "tareas en segundo plano",
			"activity.schedule": "recordatorios programados",
			"activity.separator": ", "
		};
		// src/client/locales/fr.ts
		const fr = {
			"action.delete": "Supprimer la séance",
			"action.cancel": "Annuler",
			"action.close": "Fermer",
			"settings.nav": "Séances",
			"settings.title": "Séances",
			"settings.description": "Recherchez, filtrez, archivez ou supprimez des séances.",
			"sessions.search": "Rechercher les titres de séance",
			"sessions.searchPlaceholder": "Rechercher...",
			"sessions.allWorkspaces": "Tous les espaces de travail",
			"sessions.noWorkspace": "Aucun espace de travail",
			"sessions.allSessions": "Toutes les séances",
			"sessions.unarchived": "Non archivées",
			"sessions.archived": "Archivées",
			"sessions.running": "En cours",
			"sessions.selectAll": "Tout sélectionner",
			"sessions.selectOne": "Sélectionner {title}",
			"sessions.archiveSelected": "Archiver la sélection",
			"sessions.deleteSelected": "Supprimer la sélection",
			"sessions.selectedCount": "Sélection : {count}",
			"sessions.columnTitle": "Séance",
			"sessions.columnStatus": "État",
			"sessions.columnActions": "Actions",
			"sessions.archive": "Archiver",
			"sessions.unarchive": "Désarchiver",
			"sessions.delete": "Supprimer",
			"sessions.loading": "Chargement des séances…",
			"sessions.empty": "Aucune séance pour l’instant",
			"sessions.noMatches": "Aucune séance correspondante",
			"sessions.loadFailed": "Impossible de charger la liste des séances",
			"sessions.retry": "Réessayer",
			"sessions.unavailable": "Les services de séance ne sont pas prêts, l’archivage est donc indisponible",
			"sessions.actionFailed": "L’action a échoué",
			"sessions.bulkPartial.one": "1 séance supprimée ; {failed} n’a pas pu l’être.",
			"sessions.bulkPartial.other": "{deleted} séances supprimées ; {failed} n’ont pas pu l’être.",
			"sessions.bulkStopped.one": "1 séance supprimée ; le reste n’a pas pu être traité.",
			"sessions.bulkStopped.other": "{deleted} séances supprimées ; le reste n’a pas pu être traité.",
			"sessions.bulkArchivePartial.one": "1 séance archivée ; {skipped} ignorée car elle travaillait encore.",
			"sessions.bulkArchivePartial.other": "{archived} séances archivées ; {skipped} ignorées car elles travaillaient encore.",
			"sessions.bulkArchiveFailed.one": "1 séance archivée ; {failed} n’a pas pu l’être.",
			"sessions.bulkArchiveFailed.other": "{archived} séances archivées ; {failed} n’ont pas pu l’être.",
			"sessions.deleteSelectedTitle": "Supprimer les séances sélectionnées",
			"sessions.deleteBatchDescription": "Cela supprime du disque les {count} séances sélectionnées et toutes leurs séances de sous-agent, journaux compris. Les séances en cours seront interrompues. Cette action est irréversible !",
			"sessions.archiveStopTitle": "Arrêter et archiver cette séance ?",
			"sessions.archiveStopDescription": "« {title} » a encore du travail en cours. L’archivage l’arrête d’abord ; le travail arrêté ne reprendra pas de lui-même.",
			"sessions.archiveActivity": "Travail qui sera arrêté",
			"sessions.activityTurn": "Le tour en cours",
			"sessions.activitySubagents.one": "1 sous-agent en cours d’exécution",
			"sessions.activitySubagents.other": "{count} sous-agents en cours d’exécution",
			"sessions.activityJobs.one": "1 tâche en arrière-plan",
			"sessions.activityJobs.other": "{count} tâches en arrière-plan",
			"sessions.activitySchedules.one": "1 rappel programmé",
			"sessions.activitySchedules.other": "{count} rappels programmés",
			"sessions.activityOther.one": "1 autre élément de travail ({kind})",
			"sessions.activityOther.other": "{count} autres éléments de travail ({kind})",
			"sessions.archiveStopAction": "Arrêter et archiver",
			"sessions.archiveStopPending": "Arrêt et archivage…",
			"delete.title": "Supprimer la séance",
			"delete.description": "Cela supprime du disque cette séance et toutes ses séances de sous-agent, journaux compris. Les séances en cours seront interrompues. Cette action est irréversible !",
			"delete.pending": "Arrêt et suppression…",
			"delete.confirm": "Supprimer",
			"error.host-stale": "La moitié Host exécute encore une compilation plus ancienne ; redémarrez DSH et réessayez.",
			"error.missing-session": "Aucune séance n’a été indiquée",
			"error.unknown-session": "Cette séance n’existe plus",
			"error.subagent-delete": "Une séance de sous-agent ne peut pas être supprimée seule ; supprimez sa conversation parente",
			"error.delete-failed": "La séance n’a pas pu être supprimée",
			"error.delete-unsupported": "Ce Harness n’expose pas la disposition des séances sur disque nécessaire à la suppression",
			"error.delete-active": "La séance est encore en cours ({activity}) et n’a pas pu être arrêtée ; elle n’a donc pas été supprimée",
			"error.session-live": "La séance est encore active et n’a pas pu être libérée",
			"error.delete-partial": "Certaines séances n’ont pas pu être supprimées : {deleted} supprimées, {remaining} encore présentes. Réessayez les restantes",
			"error.session-running": "La séance est encore en cours et n’a pas pu être archivée",
			"error.activityFallback": "travail en cours",
			"activity.turn": "le tour en cours",
			"activity.subagent": "sous-agents en cours d’exécution",
			"activity.job": "tâches en arrière-plan",
			"activity.schedule": "rappels programmés",
			"activity.separator": ", "
		};
		// src/client/locales/de.ts
		const de = {
			"action.delete": "Sitzung löschen",
			"action.cancel": "Abbrechen",
			"action.close": "Schließen",
			"settings.nav": "Sitzungen",
			"settings.title": "Sitzungen",
			"settings.description": "Sitzungen suchen, filtern, archivieren oder löschen.",
			"sessions.search": "Sitzungstitel suchen",
			"sessions.searchPlaceholder": "Suchen...",
			"sessions.allWorkspaces": "Alle Arbeitsbereiche",
			"sessions.noWorkspace": "Kein Arbeitsbereich",
			"sessions.allSessions": "Alle Sitzungen",
			"sessions.unarchived": "Nicht archiviert",
			"sessions.archived": "Archiviert",
			"sessions.running": "Läuft",
			"sessions.selectAll": "Alle auswählen",
			"sessions.selectOne": "{title} auswählen",
			"sessions.archiveSelected": "Ausgewählte archivieren",
			"sessions.deleteSelected": "Ausgewählte löschen",
			"sessions.selectedCount": "{count} ausgewählt",
			"sessions.columnTitle": "Sitzung",
			"sessions.columnStatus": "Status",
			"sessions.columnActions": "Aktionen",
			"sessions.archive": "Archivieren",
			"sessions.unarchive": "Dearchivieren",
			"sessions.delete": "Löschen",
			"sessions.loading": "Sitzungen werden geladen…",
			"sessions.empty": "Noch keine Sitzungen",
			"sessions.noMatches": "Keine passenden Sitzungen",
			"sessions.loadFailed": "Die Sitzungsliste konnte nicht geladen werden",
			"sessions.retry": "Erneut versuchen",
			"sessions.unavailable": "Die Sitzungsdienste sind noch nicht bereit, daher ist das Archivieren nicht möglich",
			"sessions.actionFailed": "Die Aktion ist fehlgeschlagen",
			"sessions.bulkPartial.one": "1 Sitzung gelöscht; {failed} konnte nicht gelöscht werden.",
			"sessions.bulkPartial.other": "{deleted} Sitzungen gelöscht; {failed} konnten nicht gelöscht werden.",
			"sessions.bulkStopped.one": "1 Sitzung gelöscht; der Rest konnte nicht verarbeitet werden.",
			"sessions.bulkStopped.other": "{deleted} Sitzungen gelöscht; der Rest konnte nicht verarbeitet werden.",
			"sessions.bulkArchivePartial.one": "1 Sitzung archiviert; {skipped} übersprungen, weil noch Arbeit lief.",
			"sessions.bulkArchivePartial.other": "{archived} Sitzungen archiviert; {skipped} übersprungen, weil noch Arbeit lief.",
			"sessions.bulkArchiveFailed.one": "1 Sitzung archiviert; {failed} konnte nicht archiviert werden.",
			"sessions.bulkArchiveFailed.other": "{archived} Sitzungen archiviert; {failed} konnten nicht archiviert werden.",
			"sessions.deleteSelectedTitle": "Ausgewählte Sitzungen löschen",
			"sessions.deleteBatchDescription": "Dadurch werden die {count} ausgewählten Sitzungen und alle ihre Subagenten-Sitzungen samt Protokollen von der Festplatte entfernt. Laufende Sitzungen werden beendet. Dies kann nicht rückgängig gemacht werden!",
			"sessions.archiveStopTitle": "Diese Sitzung stoppen und archivieren?",
			"sessions.archiveStopDescription": "„{title}“ hat noch laufende Arbeit. Das Archivieren stoppt sie zuerst; die gestoppte Arbeit wird nicht von selbst fortgesetzt.",
			"sessions.archiveActivity": "Arbeit, die gestoppt wird",
			"sessions.activityTurn": "Die laufende Runde",
			"sessions.activitySubagents.one": "1 laufender Subagent",
			"sessions.activitySubagents.other": "{count} laufende Subagenten",
			"sessions.activityJobs.one": "1 Hintergrundjob",
			"sessions.activityJobs.other": "{count} Hintergrundjobs",
			"sessions.activitySchedules.one": "1 geplante Erinnerung",
			"sessions.activitySchedules.other": "{count} geplante Erinnerungen",
			"sessions.activityOther.one": "1 weiterer Arbeitsschritt ({kind})",
			"sessions.activityOther.other": "{count} weitere Arbeitsschritte ({kind})",
			"sessions.archiveStopAction": "Stoppen und archivieren",
			"sessions.archiveStopPending": "Wird gestoppt und archiviert…",
			"delete.title": "Sitzung löschen",
			"delete.description": "Dadurch werden diese Sitzung und alle ihre Subagenten-Sitzungen samt Protokollen von der Festplatte entfernt. Laufende Sitzungen werden beendet. Dies kann nicht rückgängig gemacht werden!",
			"delete.pending": "Wird gestoppt und gelöscht…",
			"delete.confirm": "Löschen",
			"error.host-stale": "Die Host-Hälfte läuft noch mit einem älteren Build; starte DSH neu und versuche es erneut.",
			"error.missing-session": "Es wurde keine Sitzung benannt",
			"error.unknown-session": "Diese Sitzung existiert nicht mehr",
			"error.subagent-delete": "Eine Subagenten-Sitzung kann nicht allein gelöscht werden; lösche ihre übergeordnete Unterhaltung",
			"error.delete-failed": "Die Sitzung konnte nicht gelöscht werden",
			"error.delete-unsupported": "Dieses Harness legt die für das Löschen nötige Sitzungsablage auf der Festplatte nicht offen",
			"error.delete-active": "Die Sitzung läuft noch ({activity}) und konnte nicht gestoppt werden, daher wurde sie nicht gelöscht",
			"error.session-live": "Die Sitzung ist noch aktiv und konnte nicht freigegeben werden",
			"error.delete-partial": "Einige Sitzungen konnten nicht gelöscht werden: {deleted} entfernt, {remaining} weiterhin vorhanden. Versuche es bei den restlichen erneut",
			"error.session-running": "Die Sitzung läuft noch und konnte nicht archiviert werden",
			"error.activityFallback": "laufende Arbeit",
			"activity.turn": "die laufende Runde",
			"activity.subagent": "laufende Subagenten",
			"activity.job": "Hintergrundjobs",
			"activity.schedule": "geplante Erinnerungen",
			"activity.separator": ", "
		};
		// src/client/locales/ru.ts
		const ru = {
			"action.delete": "Удалить сеанс",
			"action.cancel": "Отмена",
			"action.close": "Закрыть",
			"settings.nav": "Сеансы",
			"settings.title": "Сеансы",
			"settings.description": "Поиск, фильтрация, архивирование и удаление сеансов.",
			"sessions.search": "Поиск по названиям сеансов",
			"sessions.searchPlaceholder": "Поиск...",
			"sessions.allWorkspaces": "Все рабочие области",
			"sessions.noWorkspace": "Без рабочей области",
			"sessions.allSessions": "Все сеансы",
			"sessions.unarchived": "Неархивированные",
			"sessions.archived": "Архивированные",
			"sessions.running": "Выполняется",
			"sessions.selectAll": "Выбрать все",
			"sessions.selectOne": "Выбрать {title}",
			"sessions.archiveSelected": "Архивировать выбранные",
			"sessions.deleteSelected": "Удалить выбранные",
			"sessions.selectedCount": "Выбрано: {count}",
			"sessions.columnTitle": "Сеанс",
			"sessions.columnStatus": "Состояние",
			"sessions.columnActions": "Действия",
			"sessions.archive": "Архивировать",
			"sessions.unarchive": "Разархивировать",
			"sessions.delete": "Удалить",
			"sessions.loading": "Загрузка сеансов…",
			"sessions.empty": "Сеансов пока нет",
			"sessions.noMatches": "Подходящих сеансов нет",
			"sessions.loadFailed": "Не удалось загрузить список сеансов",
			"sessions.retry": "Повторить",
			"sessions.unavailable": "Службы сеансов не готовы, поэтому архивирование недоступно",
			"sessions.actionFailed": "Действие не выполнено",
			"sessions.bulkPartial.one": "Удалён 1 сеанс; {failed} удалить не удалось.",
			"sessions.bulkPartial.other": "Удалено сеансов: {deleted}; удалить не удалось: {failed}.",
			"sessions.bulkStopped.one": "Удалён 1 сеанс; остальные обработать не удалось.",
			"sessions.bulkStopped.other": "Удалено сеансов: {deleted}; остальные обработать не удалось.",
			"sessions.bulkArchivePartial.one": "Архивирован 1 сеанс; {skipped} пропущен, так как в нём ещё шла работа.",
			"sessions.bulkArchivePartial.other": "Архивировано сеансов: {archived}; пропущено из-за незавершённой работы: {skipped}.",
			"sessions.bulkArchiveFailed.one": "Архивирован 1 сеанс; {failed} архивировать не удалось.",
			"sessions.bulkArchiveFailed.other": "Архивировано сеансов: {archived}; архивировать не удалось: {failed}.",
			"sessions.deleteSelectedTitle": "Удалить выбранные сеансы",
			"sessions.deleteBatchDescription": "Это удалит с диска {count} выбранных сеансов и все их сеансы субагентов вместе с журналами. Выполняющиеся сеансы будут прерваны. Отменить это невозможно!",
			"sessions.archiveStopTitle": "Остановить и заархивировать этот сеанс?",
			"sessions.archiveStopDescription": "В «{title}» ещё идёт работа. Архивирование сначала остановит её; остановленная работа не возобновится сама по себе.",
			"sessions.archiveActivity": "Работа, которая будет остановлена",
			"sessions.activityTurn": "Текущий ход",
			"sessions.activitySubagents.one": "1 работающий субагент",
			"sessions.activitySubagents.other": "Работающих субагентов: {count}",
			"sessions.activityJobs.one": "1 фоновое задание",
			"sessions.activityJobs.other": "Фоновых заданий: {count}",
			"sessions.activitySchedules.one": "1 запланированное напоминание",
			"sessions.activitySchedules.other": "Запланированных напоминаний: {count}",
			"sessions.activityOther.one": "1 другой элемент работы ({kind})",
			"sessions.activityOther.other": "Других элементов работы: {count} ({kind})",
			"sessions.archiveStopAction": "Остановить и заархивировать",
			"sessions.archiveStopPending": "Остановка и архивирование…",
			"delete.title": "Удалить сеанс",
			"delete.description": "Это удалит с диска этот сеанс и все его сеансы субагентов вместе с журналами. Выполняющиеся сеансы будут прерваны. Отменить это невозможно!",
			"delete.pending": "Остановка и удаление…",
			"delete.confirm": "Удалить",
			"error.host-stale": "Host-часть всё ещё работает на старой сборке; перезапустите DSH и повторите попытку.",
			"error.missing-session": "Сеанс не указан",
			"error.unknown-session": "Такого сеанса больше нет",
			"error.subagent-delete": "Сеанс субагента нельзя удалить отдельно; удалите его родительский диалог",
			"error.delete-failed": "Не удалось удалить сеанс",
			"error.delete-unsupported": "Этот Harness не предоставляет раскладку сеансов на диске, необходимую для удаления",
			"error.delete-active": "Сеанс всё ещё выполняется ({activity}) и остановить его не удалось, поэтому он не удалён",
			"error.session-live": "Сеанс всё ещё активен, и освободить его не удалось",
			"error.delete-partial": "Часть сеансов удалить не удалось: удалено {deleted}, осталось {remaining}. Повторите попытку для оставшихся",
			"error.session-running": "Сеанс всё ещё выполняется, и заархивировать его не удалось",
			"error.activityFallback": "идущая работа",
			"activity.turn": "текущий ход",
			"activity.subagent": "работающие субагенты",
			"activity.job": "фоновые задания",
			"activity.schedule": "запланированные напоминания",
			"activity.separator": ", "
		};
		// src/client/locales/pt.ts
		const pt = {
			"action.delete": "Excluir sessão",
			"action.cancel": "Cancelar",
			"action.close": "Fechar",
			"settings.nav": "Sessões",
			"settings.title": "Sessões",
			"settings.description": "Pesquise, filtre, arquive ou exclua sessões.",
			"sessions.search": "Pesquisar títulos de sessão",
			"sessions.searchPlaceholder": "Pesquisar...",
			"sessions.allWorkspaces": "Todos os espaços de trabalho",
			"sessions.noWorkspace": "Sem espaço de trabalho",
			"sessions.allSessions": "Todas as sessões",
			"sessions.unarchived": "Não arquivadas",
			"sessions.archived": "Arquivadas",
			"sessions.running": "Em execução",
			"sessions.selectAll": "Selecionar tudo",
			"sessions.selectOne": "Selecionar {title}",
			"sessions.archiveSelected": "Arquivar selecionadas",
			"sessions.deleteSelected": "Excluir selecionadas",
			"sessions.selectedCount": "Selecionadas: {count}",
			"sessions.columnTitle": "Sessão",
			"sessions.columnStatus": "Status",
			"sessions.columnActions": "Ações",
			"sessions.archive": "Arquivar",
			"sessions.unarchive": "Desarquivar",
			"sessions.delete": "Excluir",
			"sessions.loading": "Carregando sessões…",
			"sessions.empty": "Ainda não há sessões",
			"sessions.noMatches": "Nenhuma sessão correspondente",
			"sessions.loadFailed": "Não foi possível carregar a lista de sessões",
			"sessions.retry": "Tentar novamente",
			"sessions.unavailable": "Os serviços de sessão não estão prontos, então o arquivamento não está disponível",
			"sessions.actionFailed": "A ação falhou",
			"sessions.bulkPartial.one": "1 sessão excluída; {failed} não pôde ser excluída.",
			"sessions.bulkPartial.other": "{deleted} sessões excluídas; {failed} não puderam ser excluídas.",
			"sessions.bulkStopped.one": "1 sessão excluída; o restante não pôde ser processado.",
			"sessions.bulkStopped.other": "{deleted} sessões excluídas; o restante não pôde ser processado.",
			"sessions.bulkArchivePartial.one": "1 sessão arquivada; {skipped} ignorada porque ainda havia trabalho em andamento.",
			"sessions.bulkArchivePartial.other": "{archived} sessões arquivadas; {skipped} ignoradas porque ainda havia trabalho em andamento.",
			"sessions.bulkArchiveFailed.one": "1 sessão arquivada; {failed} não pôde ser arquivada.",
			"sessions.bulkArchiveFailed.other": "{archived} sessões arquivadas; {failed} não puderam ser arquivadas.",
			"sessions.deleteSelectedTitle": "Excluir as sessões selecionadas",
			"sessions.deleteBatchDescription": "Isso remove do disco as {count} sessões selecionadas e todas as suas sessões de subagente, incluindo seus registros. As sessões em execução serão encerradas. Esta ação não pode ser desfeita!",
			"sessions.archiveStopTitle": "Parar e arquivar esta sessão?",
			"sessions.archiveStopDescription": "“{title}” ainda tem trabalho em andamento. Arquivar interrompe esse trabalho primeiro; o trabalho interrompido não será retomado sozinho.",
			"sessions.archiveActivity": "Trabalho que será interrompido",
			"sessions.activityTurn": "O turno em andamento",
			"sessions.activitySubagents.one": "1 subagente em execução",
			"sessions.activitySubagents.other": "{count} subagentes em execução",
			"sessions.activityJobs.one": "1 tarefa em segundo plano",
			"sessions.activityJobs.other": "{count} tarefas em segundo plano",
			"sessions.activitySchedules.one": "1 lembrete agendado",
			"sessions.activitySchedules.other": "{count} lembretes agendados",
			"sessions.activityOther.one": "1 outro item de trabalho ({kind})",
			"sessions.activityOther.other": "{count} outros itens de trabalho ({kind})",
			"sessions.archiveStopAction": "Parar e arquivar",
			"sessions.archiveStopPending": "Parando e arquivando…",
			"delete.title": "Excluir sessão",
			"delete.description": "Isso remove do disco esta sessão e todas as suas sessões de subagente, incluindo seus registros. As sessões em execução serão encerradas. Esta ação não pode ser desfeita!",
			"delete.pending": "Parando e excluindo…",
			"delete.confirm": "Excluir",
			"error.host-stale": "A metade Host ainda está executando uma compilação mais antiga; reinicie o DSH e tente novamente.",
			"error.missing-session": "Nenhuma sessão foi indicada",
			"error.unknown-session": "Essa sessão não existe mais",
			"error.subagent-delete": "Uma sessão de subagente não pode ser excluída sozinha; exclua a conversa principal dela",
			"error.delete-failed": "Não foi possível excluir a sessão",
			"error.delete-unsupported": "Este Harness não expõe o layout de sessões em disco necessário para excluir",
			"error.delete-active": "A sessão ainda está em execução ({activity}) e não pôde ser interrompida, então não foi excluída",
			"error.session-live": "A sessão ainda está ativa e não pôde ser liberada",
			"error.delete-partial": "Algumas sessões não puderam ser excluídas: {deleted} removidas, {remaining} ainda presentes. Tente novamente as restantes",
			"error.session-running": "A sessão ainda está em execução e não pôde ser arquivada",
			"error.activityFallback": "trabalho em andamento",
			"activity.turn": "o turno em andamento",
			"activity.subagent": "subagentes em execução",
			"activity.job": "tarefas em segundo plano",
			"activity.schedule": "lembretes agendados",
			"activity.separator": ", "
		};
		// src/client/locales.ts
		/** The dictionary namespace this page owns. */
		const NS = "coolSession";
		/** Every dictionary, in the shape the locale service registers. */
		const DICTIONARIES = {
			zh,
			en,
			ja,
			es,
			fr,
			de,
			ru,
			pt
		};
		/**
		* Pick the singular or plural spelling of a count-bearing message.
		*
		* @param base - the message family, whose `.one` and `.other` entries exist.
		* @param count - the number the sentence reports.
		* @returns the key to translate.
		*/
		function countKey(base, count) {
			return `${base}.${count === 1 ? "one" : "other"}`;
		}
		/**
		* Every spelling of the Settings navigation label this package ships.
		*
		* The Settings navigation glyph is patched by matching the rendered label, and
		* the shell's CSS module class names rotate between releases, so the label is
		* the only stable handle on that cell. A language switch can land between
		* registration and that read, so the set covers all eight dictionaries rather
		* than only the active one.
		*
		* @returns the distinct navigation labels, in dictionary order.
		*/
		function navLabels() {
			return [...new Set(Object.values(DICTIONARIES).map((dict) => dict["settings.nav"]))];
		}
		// src/client/settings-section.tsx
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
			if (problem.failure !== void 0) parts.push(failureText(t, problem.failure));
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
				case "subagent": return t(countKey("sessions.activitySubagents", activity.count), { count: activity.count });
				case "job": return t(countKey("sessions.activityJobs", activity.count), { count: activity.count });
				case "schedule": return t(countKey("sessions.activitySchedules", activity.count), { count: activity.count });
				default: return t(countKey("sessions.activityOther", activity.count), {
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
							key: countKey("sessions.bulkPartial", succeeded.length),
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
						key: countKey("sessions.bulkStopped", succeeded.length),
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
							key: countKey("sessions.bulkArchiveFailed", archivedIds.length),
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
					key: countKey("sessions.bulkArchivePartial", archivedIds.length),
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
					setArchiveError(failureText(t, result.failure));
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
		// src/client/archive.ts
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
						failure: { code: "session-running" }
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
		// src/client/nav-icon.ts
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
		/** The nav label in every translated language, plus the one this render is reading. */
		function settingsLabels(t) {
			const labels = new Set(navLabels());
			try {
				const current = t("settings.nav");
				if (current !== "") labels.add(current);
			} catch {}
			return [...labels];
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
		// src/client/styles.ts
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
		// src/client/index.ts
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
			ctx.effect(() => locale.register(NS, DICTIONARIES), "dsh-cool-session: dictionaries");
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
			ctx.effect(() => ctx.inject(["contextMenus"], (menuCtx) => {
				retireLegacyDeleteRow();
				menuCtx.slots.inject("contextMenu.icon", () => menuCtx.slots.register({
					name: "contextMenu.icon",
					key: "dsh-cool-session.delete"
				}, _deepseek_ai_dsh_client_ui_primitives.IconTrashOutlineRegular));
				menuCtx.effect(() => menuCtx.contextMenus.register({
					id: "dsh-cool-session.delete",
					target: "session",
					order: 700,
					observe: () => [locale],
					resolve: ({ sessionId }) => [{
						id: "delete",
						label: t("action.delete"),
						icon: { key: "dsh-cool-session.delete" },
						afterContent: true,
						separatorBefore: true,
						danger: true,
						run: () => requestDeleteSession(sessionId)
					}]
				}), "dsh-cool-session: session menu action");
			}).dispose, "dsh-cool-session: session menu service");
			slots.inject("shell.overlay", () => slots.register({
				name: "shell.overlay",
				id: "dsh-cool-session.delete-dialog",
				locale: NS,
				inject: () => ({ onDeleted: afterDelete })
			}, SessionDeleteDialog));
		}
		exports.apply = apply;
		exports.inject = inject;
		exports.name = name;
		return module.exports;
	}
});
