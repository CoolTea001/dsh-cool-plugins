window.__ModuleLoader__.load({
	id: "dsh-cool-file",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let react_jsx_runtime = require("react/jsx-runtime");
		// src/client/locales.ts
		/**
		* The Files tab's copy, in the two locales DSH ships.
		*
		* The locale service re-renders the tab when the language is switched, which
		* only works if the copy is looked up at render time through the `t` seat rather
		* than captured in a constant. Placeholders are `{name}` and are filled by the
		* locale service; the two dictionaries must carry exactly the same keys, and
		* `zh` is typed as `typeof en` so a key forgotten in one is a compile error.
		*/
		/** The dictionary namespace this page owns. */
		const NS = "coolFile";
		/** The copy the page draws. */
		const en = {
			/** The tab's own name in the session's tab bar. */
			"view.files": "Files",
			"side.root": "Workspace",
			"side.empty": "This folder is empty",
			"side.error": "Could not read this folder",
			"side.loading": "Loading…",
			"side.truncated": "Only the first entries are shown",
			"side.filtered": "Only hidden items here",
			"action.refresh": "Refresh",
			"action.toggleHidden": "Show hidden files",
			"preview.empty": "Select a file to preview it",
			"preview.emptyHint": "Files in this session’s workspace appear here.",
			"preview.loading": "Reading file…",
			"preview.lines": "{count} lines",
			"preview.truncated": "Showing the first {count} lines; the file continues.",
			"error.read": "Could not read this file"
		};
		/** The Chinese copy, key for key the same page. */
		const zh = {
			"view.files": "文件",
			"side.root": "工作区",
			"side.empty": "此文件夹为空",
			"side.error": "无法读取该文件夹",
			"side.loading": "加载中…",
			"side.truncated": "仅显示前若干个条目",
			"side.filtered": "此处只有隐藏项",
			"action.refresh": "刷新",
			"action.toggleHidden": "显示隐藏文件",
			"preview.empty": "选择一个文件以预览",
			"preview.emptyHint": "此处显示当前会话工作区中的文件。",
			"preview.loading": "正在读取文件…",
			"preview.lines": "{count} 行",
			"preview.truncated": "仅显示前 {count} 行，文件还有更多内容。",
			"error.read": "无法读取该文件"
		};
		// src/client/api.ts
		const BASE = "/dsh-cool-file/api";
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
		* Ask the Host for one workspace directory's direct children.
		*
		* @param sessionId - the session whose workspace is browsed, when known.
		* @param path - the directory as a workspace path; empty for the root.
		* @returns the listing payload.
		*/
		function fetchListing(sessionId, path) {
			return postJson("/list", {
				sessionId,
				path
			});
		}
		/**
		* Ask the Host for one page of one workspace text file.
		*
		* @param sessionId - the session whose workspace is browsed, when known.
		* @param path - the file as a workspace path.
		* @returns the read payload.
		*/
		function fetchFile(sessionId, path) {
			return postJson("/read", {
				sessionId,
				path
			});
		}
		// src/client/chrome.ts
		/**
		* Composer-seat suppression for the Files tab.
		*
		* The Conversation shell mounts its composer seat — the input card plus the
		* `conversation.input.dock` rows above it — for every View. It also publishes
		* the hook a View uses to take the whole body for itself: the View root
		* declares `data-conversation-composer-overlay`, and the shell then drops the
		* transcript width handles and floats the seat over the page. That hook
		* repositions the seat; it never removes it, so a page with no input of its own
		* — this one — has to take the seat out itself.
		*
		* The removal is a DOM write on the seat element instead of only a stylesheet
		* rule. Both are presentation, but the write depends on nothing beyond the
		* rendered tree: not on this plugin's sheet being inserted, not on the shell
		* ranking our selector above its own, not on the attribute names this version
		* of the shell happens to use. The declarative twin in `styles.ts` states the
		* same fact for the frames the shell paints before this runs.
		*/
		/** The shell's marker on the Conversation body that owns one composer seat. */
		const CONVERSATION_BODY = "[data-conversation-content]";
		/** The shell's marker on the seat itself. */
		const COMPOSER_SEAT = "[data-composer-seat]";
		/**
		* Hide the composer seat of the Conversation hosting `view`.
		*
		* The seat is a sibling of the View inside the same body, rendered
		* unconditionally by the same component that renders the View: when that body
		* is replaced the View remounts with it, so one write per mount reaches every
		* seat this page can coexist with.
		*
		* @param view - the mounted View root, or null before React attaches it.
		* @returns disposer restoring exactly the inline display it replaced.
		*/
		function suppressComposerSeat(view) {
			if (view === null) return () => {};
			const scope = view.closest(CONVERSATION_BODY) ?? view.ownerDocument;
			const hidden = /* @__PURE__ */ new Map();
			for (const seat of scope.querySelectorAll(COMPOSER_SEAT)) {
				hidden.set(seat, seat.style.display);
				seat.style.display = "none";
			}
			return () => {
				for (const [seat, display] of hidden) if (display === "") seat.style.removeProperty("display");
				else seat.style.display = display;
				hidden.clear();
			};
		}
		// src/client/icons.tsx
		/**
		* The page's glyphs — the header's refresh and eye, and the arrow each tree
		* branch turns when it opens — are the SVGs under `src/client/assets/`: the
		* client bundle is one JS file the platform's module loader evaluates, so a
		* sibling asset would never be fetched. `tsdown.config.ts` reads the artwork at
		* build time and exposes it as the `__DSH_CF_ICONS__` string map consumed here.
		*
		* Each asset is 24-unit stroke markup riding `currentColor`, so the glyph tints
		* with the surrounding CSS, and it carries no size of its own: the seat that
		* wraps it decides that (`.dsh-cf-icon-btn svg` in `styles.ts`).
		*
		* The folder and file glyphs are drawn inline instead — they are small enough
		* that a separate asset would only add a file — and also ride `currentColor`.
		*/
		/**
		* Parse one asset's raw SVG into the artwork its component renders.
		*
		* The root element is dropped rather than copied: its `width`/`height` belong to
		* the asset, not to this seat, and the root's `xmlns` would be redundant once the
		* markup is part of a larger document.
		*
		* @param name - the asset filename stem, e.g. `refresh` for `assets/refresh.svg`.
		* @returns the viewBox and inner markup to render.
		*/
		function iconArtwork(name) {
			const raw = {
				"refresh": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"1em\" height=\"1em\" viewBox=\"0 0 24 24\">\n	<path d=\"M0 0h24v24H0z\" fill=\"none\" />\n	<g fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\">\n		<path d=\"M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8\" />\n		<path d=\"M21 3v5h-5\" />\n	</g>\n</svg>\n",
				"show": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"1em\" height=\"1em\" viewBox=\"0 0 24 24\">\n	<path d=\"M0 0h24v24H0z\" fill=\"none\" />\n	<g fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\">\n		<path d=\"M2.062 12.348a1 1 0 0 1 0-.696a10.75 10.75 0 0 1 19.876 0a1 1 0 0 1 0 .696a10.75 10.75 0 0 1-19.876 0\" />\n		<circle cx=\"12\" cy=\"12\" r=\"3\" />\n	</g>\n</svg>\n",
				"hide": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"1em\" height=\"1em\" viewBox=\"0 0 24 24\">\n	<path d=\"M0 0h24v24H0z\" fill=\"none\" />\n	<g fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\">\n		<path d=\"M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575a1 1 0 0 1 0 .696a10.8 10.8 0 0 1-1.444 2.49m-6.41-.679a3 3 0 0 1-4.242-4.242\" />\n		<path d=\"M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151a1 1 0 0 1 0-.696a10.75 10.75 0 0 1 4.446-5.143M2 2l20 20\" />\n	</g>\n</svg>\n",
				"arrow": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"1em\" height=\"1em\" viewBox=\"0 0 24 24\">\n	<path d=\"M0 0h24v24H0z\" fill=\"none\" />\n	<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"m9 18l6-6l-6-6\" />\n</svg>\n"
			}[name];
			if (raw === void 0) throw new Error(`dsh-cool-file: missing icon asset '${name}.svg'`);
			return {
				viewBox: /viewBox="([^"]+)"/.exec(raw)?.[1] ?? "0 0 24 24",
				inner: /<svg[^>]*>([\s\S]*)<\/svg>/.exec(raw)?.[1] ?? ""
			};
		}
		const REFRESH = iconArtwork("refresh");
		const SHOW = iconArtwork("show");
		const HIDE = iconArtwork("hide");
		const ARROW = iconArtwork("arrow");
		/**
		* Render one asset's artwork as a glyph.
		*
		* @param artwork - the asset parsed by {@link iconArtwork}.
		* @returns the svg element, sized and tinted by its seat.
		*/
		function assetIcon(artwork) {
			return (0, react.createElement)("svg", {
				viewBox: artwork.viewBox,
				width: "1em",
				height: "1em",
				"aria-hidden": "true",
				focusable: "false",
				dangerouslySetInnerHTML: { __html: artwork.inner }
			});
		}
		/** A closed folder. */
		function IconFolder({ size = 15 }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
				width: size,
				height: size,
				viewBox: "0 0 16 16",
				fill: "none",
				"aria-hidden": "true",
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
					d: "M1.75 3.25c0-.55.45-1 1-1h2.94c.3 0 .58.13.77.36l1.13 1.39h5.66c.55 0 1 .45 1 1v7.5c0 .55-.45 1-1 1H2.75c-.55 0-1-.45-1-1V3.25Z",
					stroke: "currentColor",
					strokeWidth: "1.1",
					strokeLinejoin: "round"
				})
			});
		}
		/** A text file with a folded corner. */
		function IconFile({ size = 15 }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
				width: size,
				height: size,
				viewBox: "0 0 16 16",
				fill: "none",
				"aria-hidden": "true",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
					d: "M4 1.75h4.9L12.5 5.4v8.85c0 .55-.45 1-1 1h-7.5c-.55 0-1-.45-1-1V2.75c0-.55.45-1 1-1Z",
					stroke: "currentColor",
					strokeWidth: "1.1",
					strokeLinejoin: "round"
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
					d: "M8.75 1.9v3.6h3.5",
					stroke: "currentColor",
					strokeWidth: "1.1",
					strokeLinejoin: "round"
				})]
			});
		}
		/** The circular arrow that re-reads the tree (assets/refresh.svg). */
		function IconRefresh() {
			return assetIcon(REFRESH);
		}
		/** An open eye: the tree is showing entries the system hides (assets/show.svg). */
		function IconShow() {
			return assetIcon(SHOW);
		}
		/** A struck-through eye: the tree is hiding those entries (assets/hide.svg). */
		function IconHide() {
			return assetIcon(HIDE);
		}
		/** The arrow a branch turns from closed to open (assets/arrow.svg). */
		function IconArrow() {
			return assetIcon(ARROW);
		}
		// src/client/layout.tsx
		/**
		* The Files page's resizable boundary, and the width it remembers.
		*
		* The page is a fixed sidebar beside an absorbing preview pane, and the reader
		* sets the sidebar's width by dragging its right edge. That width is a preference
		* for a window — not workspace state — so it is kept in localStorage under this
		* plugin's own key, the way the Terminal and Git tabs keep theirs.
		*
		* Every bound is stated once, here, and `styles.ts` interpolates these constants
		* into the rules that enforce them at rest. A drag and a stylesheet that disagreed
		* about the narrowest sidebar would be a divider that stops where the pointer does
		* not; two numbers in two files would drift.
		*
		* A drag never renders React. The pointer writes the width to the page root's own
		* custom property — `--dsh-cf-side-width` — and only the release records one
		* layout, into the page's state and localStorage together. That keeps the frame
		* rate of a drag independent of how many file rows the page happens to be
		* drawing; DSH's own transcript width handle makes the same trade for the same
		* reason.
		*/
		/** The localStorage entry holding the sidebar width, as one JSON object. */
		const LAYOUT_KEY = "dsh-cool-file.layout.v1";
		/** The layout of a page nobody has resized. */
		const DEFAULT_LAYOUT = { sideWidth: 300 };
		/**
		* The saved layout, with every part that is missing or unusable replaced by its
		* default.
		*
		* A saved value was written in another window size, by another version of this
		* page, in a browser that may not give the entry back at all, so it is read as
		* data rather than trusted: the width has to be a positive finite number, and
		* anything else — an unreadable entry, a JSON error, a field of the wrong shape —
		* falls back to the default.
		*
		* @returns the layout to draw, always usable.
		*/
		function readLayout() {
			let raw;
			try {
				raw = localStorage.getItem(LAYOUT_KEY);
			} catch {
				return DEFAULT_LAYOUT;
			}
			if (raw === null) return DEFAULT_LAYOUT;
			let parsed;
			try {
				parsed = JSON.parse(raw);
			} catch {
				return DEFAULT_LAYOUT;
			}
			const { sideWidth } = typeof parsed === "object" && parsed !== null ? parsed : {};
			return { sideWidth: typeof sideWidth === "number" && Number.isFinite(sideWidth) && sideWidth > 0 ? sideWidth : DEFAULT_LAYOUT.sideWidth };
		}
		/**
		* Record the layout.
		*
		* A storage that refuses the write (quota, or third-party storage blocked) is not
		* worth surfacing: no workspace state is involved, and the drag holds for as long
		* as this page is open either way.
		*
		* @param layout - the layout to save.
		*/
		function writeLayout(layout) {
			try {
				localStorage.setItem(LAYOUT_KEY, JSON.stringify(layout));
			} catch {}
		}
		/**
		* The widest the sidebar may be drawn in a page this wide.
		*
		* Two bounds at once: the width a sidebar stops being worth dragging past, and
		* what is left of the page once the preview pane keeps its own floor. The
		* sidebar's floor wins when the window cannot hold both, so a narrow window still
		* draws a whole sidebar and leaves the preview to suffer — a sidebar narrower
		* than its own header would have no honest reading at all.
		*
		* @param available - the page's width, in CSS pixels.
		* @returns the widest sidebar to draw.
		*/
		function sideWidthCeiling(available) {
			return Math.max(220, Math.min(560, available - 320));
		}
		/**
		* Clamp a preferred sidebar width to what this page can draw.
		*
		* @param preferred - the width the pointer, or the saved layout, asks for.
		* @param available - the page's width, in CSS pixels.
		* @returns the width to draw.
		*/
		function clampSideWidth(preferred, available) {
			return Math.min(Math.max(preferred, 220), sideWidthCeiling(available));
		}
		/**
		* The sidebar's right edge, dragged with the pointer.
		*
		* The gesture is the platform's own width handle (client-ui-conversation's
		* `WidthHandle`): the press captures the pointer and records where it started and
		* the width the page was drawing, each move asks the caller to draw the width the
		* pointer now implies — at most once a frame, since a pointer reports more often
		* than a page paints — and the release records that one number. A press that never
		* moved records nothing, so a click on the boundary cannot overwrite a saved width
		* with the window-clamped width it happens to be drawn at.
		*
		* The two terminal paths mean different things. `onCommit` is a new width to
		* record and draw; `onEnd` is a gesture that produced no width — a click, or a
		* pointer lost mid-drag — and the caller draws the recorded layout again, which is
		* what makes a cancelled drag leave the page exactly as it found it.
		*
		* The element sits on the boundary itself, which is a 1px line a pointer cannot be
		* asked to hold, so the stylesheet puts an invisible band around it and this
		* component owns the line in the middle.
		*/
		function ResizeHandle(props) {
			/** Whether a gesture this component started is still running. */
			const dragging = (0, react.useRef)(false);
			/** The pointer's X where the gesture started. */
			const origin = (0, react.useRef)(0);
			/** The width the page was drawing where the gesture started. */
			const start = (0, react.useRef)(0);
			/** The pointer's latest X. */
			const latest = (0, react.useRef)(0);
			/** The frame awaiting the pointer's latest coordinate, if one is. */
			const frame = (0, react.useRef)(null);
			const live = (0, react.useRef)(props);
			live.current = props;
			/** The width the pointer's latest coordinate implies. */
			const implied = () => start.current + (latest.current - origin.current);
			const cancelFrame = () => {
				if (frame.current !== null) {
					cancelAnimationFrame(frame.current);
					frame.current = null;
				}
			};
			/**
			* End the gesture, and either record a width or re-state the layout.
			*
			* @param element - the handle the gesture was captured on.
			* @param pointerId - the pointer to release.
			* @param moved - whether this release holds a width the pointer chose.
			*/
			const settle = (element, pointerId, moved) => {
				dragging.current = false;
				element.toggleAttribute("data-dragging", false);
				if (element.hasPointerCapture(pointerId)) element.releasePointerCapture(pointerId);
				cancelFrame();
				if (moved && latest.current !== origin.current) live.current.onCommit(implied());
				else live.current.onEnd();
			};
			const onPointerDown = (0, react.useCallback)((event) => {
				if (event.button !== 0) return;
				event.preventDefault();
				event.currentTarget.setPointerCapture(event.pointerId);
				event.currentTarget.toggleAttribute("data-dragging", true);
				origin.current = event.clientX;
				latest.current = origin.current;
				start.current = live.current.onStart();
				dragging.current = true;
			}, []);
			const onPointerMove = (0, react.useCallback)((event) => {
				if (!dragging.current) return;
				if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
				latest.current = event.clientX;
				if (frame.current !== null) return;
				frame.current = requestAnimationFrame(() => {
					frame.current = null;
					live.current.onDrag(implied());
				});
			}, []);
			const onPointerUp = (0, react.useCallback)((event) => {
				if (!dragging.current) return;
				if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
				latest.current = event.clientX;
				settle(event.currentTarget, event.pointerId, true);
			}, []);
			const onPointerCancel = (0, react.useCallback)((event) => {
				if (!dragging.current) return;
				settle(event.currentTarget, event.pointerId, false);
			}, []);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: "dsh-cf-resize",
				onPointerDown,
				onPointerMove,
				onPointerUp,
				onPointerCancel,
				onLostPointerCapture: onPointerCancel
			});
		}
		// src/client/styles.ts
		/**
		* Package-owned stylesheet for the Files tab.
		*
		* Four jobs live here.
		*
		* 1. The Conversation shell keeps its composer seat mounted for every View, so
		*    the Files page removes it. The handle the View root declares —
		*    `data-conversation-composer-overlay` — is the shell's own opt-in and drops
		*    the transcript width handles; the seat itself is hidden by this rule and by
		*    the mounted View (`chrome.ts`), so the seat is gone on every frame the
		*    shell paints, not only after the mount effect has run. The selector is
		*    scoped by this plugin's own root class, which exists only while the Files
		*    tab is mounted: Chat, Trajectory, Terminal and Git keep their composer
		*    untouched, and the rule disappears with the View.
		*
		* 2. The page itself: a sidebar drawing the workspace as one expandable tree
		*    beside an absorbing preview pane. Every color is a `--dsw-*` theme token, so
		*    the tab follows the active light or dark appearance — including third-party
		*    theme presets — instead of forcing a palette of its own.
		*
		* 3. The draggable boundary between them: the sidebar's width is a custom
		*    property the page publishes, and the handle on its right edge lights up
		*    under the pointer. The bounds are imported from `layout.tsx` rather than
		*    restated, so the width a drag may reach and the width a rule allows cannot
		*    drift apart.
		*
		* 4. The wallpaper hand-off. `dsh-cool-theme` paints a fixed image behind the
		*    shell and marks the document with `ct-bg-on` while it is mounted; the page
		*    then rebinds the two canvas tokens it paints with, so the image shows
		*    through this tab exactly as it does through Chat and Git. Without the
		*    theme, or with its wallpaper off, the selector never matches and the tab
		*    keeps its opaque canvas.
		*/
		/** Class the Files View renders on its root; the stylesheet's only anchor. */
		const FILES_ROOT_CLASS = "dsh-cf-root";
		/** CSS rules, one selector per line. */
		const FILES_CSS = [
			`[data-conversation-scroll]:has(.${FILES_ROOT_CLASS})>[data-composer-seat]{display:none}`,
			`.${FILES_ROOT_CLASS}{display:flex;flex:1 1 auto;flex-direction:row;box-sizing:border-box;width:100%;height:100%;min-height:0;overflow:hidden;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font-family:var(--dsw-font-family,sans-serif);font-size:12.5px;line-height:1.5}`,
			`.${FILES_ROOT_CLASS} *{box-sizing:border-box}`,
			`.dsh-cf-side{position:relative;flex:none;display:flex;flex-direction:column;width:var(--dsh-cf-side-width,300px);min-width:220px;max-width:min(560px,calc(100% - 320px));min-height:0;border-right:.5px solid var(--dsw-alias-border-l3)}`,
			".dsh-cf-resize{position:absolute;z-index:2;top:0;right:-1px;bottom:0;width:1px;cursor:col-resize;touch-action:none}",
			".dsh-cf-resize::before{content:\"\";position:absolute;inset:0;opacity:0;background:linear-gradient(to bottom,transparent,var(--dsw-alias-label-secondary) 50%,transparent) center / 1px 100% no-repeat;transition:opacity .12s ease-out}",
			".dsh-cf-resize::after{content:\"\";position:absolute;inset:0 -4px}",
			".dsh-cf-resize:hover::before,.dsh-cf-resize[data-dragging]::before{opacity:1}",
			`.${FILES_ROOT_CLASS}[data-resizing],.${FILES_ROOT_CLASS}[data-resizing] *{user-select:none}`,
			`.${FILES_ROOT_CLASS}[data-resizing=col],.${FILES_ROOT_CLASS}[data-resizing=col] *{cursor:col-resize}`,
			".dsh-cf-side-head{flex:none;display:flex;align-items:center;gap:6px;height:36px;padding:0 6px 0 10px}",
			".dsh-cf-side-title{flex:1 1 auto;min-width:0;display:flex;align-items:center;overflow:hidden}",
			".dsh-cf-side-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--dsw-alias-label-primary);font-size:11.5px;font-weight:600}",
			".dsh-cf-icon-btn{flex:none;display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;padding:0;border:0;border-radius:5px;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer}",
			".dsh-cf-icon-btn:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}",
			".dsh-cf-icon-btn[aria-pressed=true]{color:var(--dsw-alias-label-primary)}",
			".dsh-cf-icon-btn:disabled{opacity:.45;cursor:default}",
			".dsh-cf-icon-btn svg{display:block;width:14px;height:14px}",
			".dsh-cf-list{flex:1 1 auto;min-height:0;overflow:auto;padding:4px 6px 10px;border-top:.5px solid var(--dsw-alias-border-l3)}",
			".dsh-cf-node{display:block}",
			".dsh-cf-row{display:flex;align-items:center;gap:6px;width:100%;padding:4px 6px;border:0;border-radius:5px;background:transparent;color:inherit;font:inherit;text-align:left;cursor:pointer}",
			".dsh-cf-row:hover{background:var(--dsw-alias-interactive-bg-hover)}",
			".dsh-cf-row[data-selected]{background:var(--dsw-alias-interactive-bg-active)}",
			".dsh-cf-row[data-type=other]{cursor:default;opacity:.55}",
			".dsh-cf-twist{flex:none;display:inline-flex;align-items:center;justify-content:center;width:12px;height:16px;color:var(--dsw-alias-label-secondary);opacity:.75}",
			".dsh-cf-twist svg{width:12px;height:12px;transition:transform .12s ease-out}",
			".dsh-cf-row[data-open] .dsh-cf-twist svg{transform:rotate(90deg)}",
			".dsh-cf-children{padding-left:16px}",
			".dsh-cf-row-icon{flex:none;display:inline-flex;color:var(--dsw-alias-label-secondary)}",
			".dsh-cf-row[data-type=directory] .dsh-cf-row-icon{color:var(--dsw-alias-brand-primary)}",
			".dsh-cf-row-name{flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
			".dsh-cf-row-size{flex:none;color:var(--dsw-alias-label-secondary);opacity:.75;font-size:11px;font-variant-numeric:tabular-nums}",
			".dsh-cf-note{padding:10px 12px;color:var(--dsw-alias-label-secondary);font-size:11.5px}",
			".dsh-cf-error{margin:8px 10px;padding:8px 10px;border:1px solid var(--dsw-alias-border-l2);border-radius:6px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-state-error-primary);font-size:11.5px;word-break:break-word}",
			".dsh-cf-main{flex:1 1 auto;display:flex;flex-direction:column;min-width:0;min-height:0}",
			".dsh-cf-main-head{flex:none;display:flex;align-items:center;gap:10px;height:34px;padding:0 12px;border-bottom:.5px solid var(--dsw-alias-border-l3)}",
			".dsh-cf-file-name{flex:0 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12.5px;font-weight:600}",
			".dsh-cf-file-path{flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--dsw-alias-label-secondary);opacity:.8;font-size:11px}",
			".dsh-cf-body{flex:1 1 auto;min-height:0;overflow:auto}",
			".dsh-cf-code{margin:0;padding:12px 16px 24px;font-family:var(--dsw-font-family-mono,ui-monospace,SFMono-Regular,Menlo,Consolas,monospace);font-size:12px;line-height:1.6;white-space:pre;tab-size:2;color:var(--dsw-alias-label-primary)}",
			".dsh-cf-truncated{flex:none;margin:8px 16px 0;padding:6px 10px;border-radius:5px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);font-size:11px}",
			".dsh-cf-empty{flex:1 1 auto;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;padding:24px;text-align:center;color:var(--dsw-alias-label-secondary)}",
			".dsh-cf-empty-title{color:var(--dsw-alias-label-primary);font-size:13px}",
			".dsh-cf-empty-hint{max-width:320px;font-size:11.5px}",
			`html.ct-bg-on .${FILES_ROOT_CLASS}{--dsw-alias-bg-base:transparent;--dsw-alias-bg-layer-1:transparent}`
		];
		/**
		* Insert this plugin's stylesheet once and hand back its disposer.
		*
		* @returns the function that removes the element again.
		*/
		function insertFilesStyles() {
			const element = document.createElement("style");
			element.setAttribute("data-plugin", "dsh-cool-file");
			element.setAttribute("data-dsh-cool-file", "styles");
			element.textContent = FILES_CSS.join("\n");
			document.head.appendChild(element);
			return () => {
				element.remove();
			};
		}
		// src/client/files.tsx
		/**
		* The Files conversation view.
		*
		* The page is the whole of the tab: a sidebar holding one workspace tree and a
		* preview pane taking every remaining pixel. The tree is expanded in place —
		* opening a folder inserts its children under its own row instead of replacing
		* the list — so the workspace keeps one continuous shape while the reader walks
		* it. Directories are read lazily: the root when the tab mounts, then one
		* directory per folder the reader opens, cached for the life of the page.
		*
		* The page owns no workspace state of its own: every answer is a plain value
		* fetched from the Host over this package's own same-origin routes (see
		* `api.ts`), and the only local state is which folders are open, which children
		* have arrived, whether the entries the system hides are drawn, which file is
		* selected, and which request is in flight.
		*
		* The page is read-only on purpose. It lists entries, expands them, and shows
		* the first page of a text file; it never writes, renames, or deletes. That
		* keeps the Host route a read and the tab safe to leave open.
		*
		* The page is full-bleed, the same way the Terminal and Git tabs are: the root
		* class gives the stylesheet a handle on this subtree, the root declares the
		* shell's composer-overlay hook (which drops the transcript width handles), and
		* the mounted View suppresses the composer seat the shell mounts for every View
		* — see `chrome.ts`.
		*/
		/** The root is the whole conversation body, sized the way the shell hands it over. */
		const PAGE = {
			height: "100%",
			width: "100%"
		};
		/** A directory whose children have not arrived yet. */
		const PENDING = {
			loading: true,
			error: null,
			entries: [],
			truncated: false
		};
		/** Where the page remembers whether the entries the system hides are drawn. */
		const HIDDEN_KEY = "dsh-cool-file.hidden.v1";
		/**
		* The saved choice about dotted entries; shown until the reader says otherwise.
		*
		* The default is "shown" because that is what the tree did before the toggle
		* existed: a reader who has never touched the eye keeps the workspace they were
		* already browsing, dotted entries and all.
		*
		* @returns whether hidden entries are drawn.
		*/
		function readShowHidden() {
			try {
				return window.localStorage.getItem(HIDDEN_KEY) !== "false";
			} catch {
				return true;
			}
		}
		/**
		* Save the choice about dotted entries.
		*
		* @param show - whether hidden entries are drawn.
		*/
		function writeShowHidden(show) {
			try {
				window.localStorage.setItem(HIDDEN_KEY, String(show));
			} catch {}
		}
		/**
		* A byte count as the list row shows it.
		*
		* @param bytes - the size to format.
		* @returns a short human-readable size.
		*/
		function formatSize(bytes) {
			if (bytes < 1024) return `${bytes} B`;
			const units = [
				"KB",
				"MB",
				"GB",
				"TB"
			];
			let value = bytes / 1024;
			let unit = 0;
			while (value >= 1024 && unit < units.length - 1) {
				value /= 1024;
				unit += 1;
			}
			return `${value < 10 ? value.toFixed(1) : String(Math.round(value))} ${units[unit]}`;
		}
		/**
		* The last segment of a workspace path.
		*
		* @param path - a `/`-joined path.
		* @returns the basename, or the path itself when it has no separator.
		*/
		function baseName(path) {
			const at = path.lastIndexOf("/");
			return at === -1 ? path : path.slice(at + 1);
		}
		/**
		* The last segment of an absolute workspace root.
		*
		* Kept separate from {@link baseName} because a root arrives in the Host's own
		* path form, which carries the platform separator: the workspace-relative paths
		* this page walks are always `/`-joined, but `C:\Users\me\project` is not.
		*
		* @param root - the absolute workspace root.
		* @returns the directory's own name.
		*/
		function workspaceNameOf(root) {
			const segments = root.split(/[\\/]/).filter((segment) => segment !== "");
			return segments[segments.length - 1] ?? "";
		}
		/** How one directory orders its children: folders first, then names naturally. */
		function compareEntries(a, b) {
			const rank = (entry) => entry.type === "directory" ? 0 : 1;
			if (rank(a) !== rank(b)) return rank(a) - rank(b);
			return a.name.localeCompare(b.name, void 0, {
				numeric: true,
				sensitivity: "base"
			});
		}
		/** The workspace path of one child, given its parent and its own name. */
		function childPath(parent, name) {
			return parent === "" ? name : `${parent}/${name}`;
		}
		/**
		* Render the Files tab's body.
		*
		* @param props - the standard conversation-View props; the session id is used,
		*   and `t` is the locale seat the framework hands every entry that declares a
		*   dictionary namespace.
		* @returns the Files page element.
		*/
		function FilesView(props) {
			const { t } = props;
			const sessionId = typeof props?.sessionId === "string" ? props.sessionId : void 0;
			const page = (0, react.useRef)(null);
			/** The sidebar itself, whose measured width is where a drag takes hold. */
			const side = (0, react.useRef)(null);
			/**
			* The workspace's own display name, which titles the sidebar.
			*
			* Kept beside the tree rather than derived from it on every render: a reload
			* replaces the directories, and the name must not blink out of the header
			* while the next answer is in flight.
			*/
			const [workspaceName, setWorkspaceName] = (0, react.useState)("");
			/** Every directory whose children have been asked for, by workspace path. */
			const [directories, setDirectories] = (0, react.useState)({});
			/** The directories whose children are drawn, by workspace path. */
			const [expanded, setExpanded] = (0, react.useState)([]);
			/** Whether entries whose names start with a dot are drawn. */
			const [showHidden, setShowHidden] = (0, react.useState)(readShowHidden);
			/** The selected file path, or null while the empty state is showing. */
			const [selected, setSelected] = (0, react.useState)(null);
			const [preview, setPreview] = (0, react.useState)(null);
			const [fileError, setFileError] = (0, react.useState)(null);
			const [fileLoading, setFileLoading] = (0, react.useState)(false);
			/** Guards the preview against an answer for a file that is no longer selected. */
			const previewToken = (0, react.useRef)(0);
			/** Directories with a request in flight, so a double click asks once. */
			const inFlight = (0, react.useRef)(/* @__PURE__ */ new Set());
			/**
			* Bumped whenever the whole tree is replaced. An answer carrying an older
			* generation belongs to a tree that is no longer on screen and is dropped.
			*/
			const generation = (0, react.useRef)(0);
			/** The sidebar width the page draws and saves. */
			const [layout, setLayout] = (0, react.useState)(readLayout);
			/** Whether this page's own boundary is being dragged. */
			const [resizing, setResizing] = (0, react.useState)(false);
			/**
			* Draw one layout: the sidebar's width, as a custom property on the root.
			*
			* The width lives on the root rather than in the sidebar's inline style for one
			* reason: a drag can then move it from the pointer without rendering React,
			* which keeps the frame rate independent of how many file rows the tree holds.
			*/
			const publish = (0, react.useCallback)((next) => {
				page.current?.style.setProperty("--dsh-cf-side-width", `${next.sideWidth}px`);
			}, []);
			(0, react.useLayoutEffect)(() => {
				publish(layout);
			}, [layout, publish]);
			/** The page's own width, which is the room the sidebar and the preview share. */
			const available = (0, react.useCallback)(() => page.current?.getBoundingClientRect().width ?? 0, []);
			/**
			* Record one layout: what the page draws from, and what it saves.
			*
			* The two are written together on purpose. A width drawn but not saved is one
			* the next visit forgets; a width saved but not drawn is a drag that looks like
			* it did nothing until the tab is reopened.
			*/
			const record = (0, react.useCallback)((next) => {
				setLayout(next);
				writeLayout(next);
			}, []);
			/**
			* Where the sidebar's edge is, as a drag starts.
			*
			* Measured off the box rather than read from the layout: the stylesheet is what
			* clamps a saved width to the window it is drawn in, so the edge on screen —
			* not the preference behind it — is where the pointer has actually taken hold.
			*/
			const startSideResize = (0, react.useCallback)(() => {
				setResizing(true);
				return side.current?.getBoundingClientRect().width ?? layout.sideWidth;
			}, [layout.sideWidth]);
			/** Draw the sidebar width the pointer implies, for this frame. */
			const dragSideResize = (0, react.useCallback)((width) => {
				const room = available();
				if (room <= 0) return;
				page.current?.style.setProperty("--dsh-cf-side-width", `${clampSideWidth(width, room)}px`);
			}, [available]);
			/** Record the sidebar width the gesture settled on. */
			const commitSideResize = (0, react.useCallback)((width) => {
				setResizing(false);
				const room = available();
				if (room <= 0) return;
				record({ sideWidth: clampSideWidth(width, room) });
			}, [available, record]);
			/**
			* A gesture that produced no width — a click on the boundary, or a pointer lost
			* mid-drag — draws the recorded layout again, so the preview a cancelled drag
			* left on screen cannot outlive the gesture.
			*/
			const endResize = (0, react.useCallback)(() => {
				setResizing(false);
				publish(layout);
			}, [layout, publish]);
			(0, react.useLayoutEffect)(() => suppressComposerSeat(page.current), []);
			/**
			* Ask the Host for one directory's children and file the answer under its path.
			*
			* The answer is merged into the map rather than replacing it: every open branch
			* keeps its own children, and a request for one folder never disturbs another.
			* A request already in flight for the same path is not repeated, and an answer
			* from before the tree was replaced is dropped.
			*
			* @param path - the directory as a workspace path; empty for the root.
			*/
			const loadDirectory = (0, react.useCallback)((path) => {
				if (inFlight.current.has(path)) return;
				const token = generation.current;
				inFlight.current.add(path);
				setDirectories((previous) => ({
					...previous,
					[path]: {
						...previous[path] ?? PENDING,
						loading: true,
						error: null
					}
				}));
				fetchListing(sessionId, path).then((payload) => {
					if (token !== generation.current) return;
					inFlight.current.delete(path);
					if (payload.ok === true) {
						const name = typeof payload.workspace === "string" && payload.workspace !== "" ? payload.workspace : typeof payload.root === "string" ? workspaceNameOf(payload.root) : "";
						if (name !== "") setWorkspaceName(name);
						setDirectories((previous) => ({
							...previous,
							[path]: {
								loading: false,
								error: null,
								entries: payload.entries ?? [],
								truncated: payload.truncated === true
							}
						}));
						return;
					}
					setDirectories((previous) => ({
						...previous,
						[path]: {
							loading: false,
							error: typeof payload.error === "string" ? payload.error : "",
							entries: [],
							truncated: false
						}
					}));
				});
			}, [sessionId]);
			(0, react.useEffect)(() => {
				generation.current += 1;
				inFlight.current.clear();
				previewToken.current += 1;
				setWorkspaceName("");
				setDirectories({});
				setExpanded([]);
				setSelected(null);
				setPreview(null);
				setFileError(null);
				setFileLoading(false);
				loadDirectory("");
			}, [sessionId, loadDirectory]);
			const openFile = (0, react.useCallback)((path) => {
				const token = previewToken.current + 1;
				previewToken.current = token;
				setSelected(path);
				setPreview(null);
				setFileError(null);
				setFileLoading(true);
				fetchFile(sessionId, path).then((payload) => {
					if (previewToken.current !== token) return;
					setFileLoading(false);
					if (payload.ok !== true) {
						setFileError(payload.error ?? t("error.read"));
						return;
					}
					setPreview({
						text: pendingText(payload.text),
						lines: typeof payload.lines === "number" ? payload.lines : 0,
						eof: payload.eof !== false,
						...typeof payload.bytes === "number" ? { bytes: payload.bytes } : {}
					});
				});
			}, [sessionId, t]);
			/**
			* Open one branch, or close it again.
			*
			* A folder's children are asked for the first time it opens, and asked again
			* when the last answer was an error — closing and reopening is the reader's
			* retry for one branch, without reloading the tree around it.
			*/
			const toggleDirectory = (0, react.useCallback)((path) => {
				if (expanded.includes(path)) {
					setExpanded(expanded.filter((item) => item !== path));
					return;
				}
				setExpanded([...expanded, path]);
				const state = directories[path];
				if (state === void 0 || state.error !== null) loadDirectory(path);
			}, [
				directories,
				expanded,
				loadDirectory
			]);
			/**
			* Show or hide the entries the system hides.
			*
			* Nothing is re-read: the listing already carries every child, so the choice
			* only changes what is drawn. A hidden folder keeps its branch state, which is
			* what lets the reader bring it back exactly as they left it.
			*/
			const toggleHidden = (0, react.useCallback)(() => {
				const next = !showHidden;
				setShowHidden(next);
				writeShowHidden(next);
			}, [showHidden]);
			/**
			* Re-read the tree that is on screen: the root and every open branch.
			*
			* Open branches are kept open on purpose — Refresh is "ask again", not "start
			* over" — and the selected file is read again beside them, so a change on disk
			* shows everywhere the reader is looking.
			*/
			const refresh = (0, react.useCallback)(() => {
				generation.current += 1;
				inFlight.current.clear();
				const open = expanded.filter((path) => directories[path] !== void 0);
				setDirectories({});
				for (const path of ["", ...open]) loadDirectory(path);
				if (selected !== null) openFile(selected);
			}, [
				directories,
				expanded,
				loadDirectory,
				openFile,
				selected
			]);
			/**
			* One directory's rows, and the rows of every open folder inside it.
			*
			* Recursion rather than a flattened list: an open folder owns its children in
			* the DOM, which is what gives each branch its indented block
			* without pairing rows back up with their depth afterwards.
			*
			* @param path - the directory to draw; empty for the root.
			* @returns its children, the open ones followed by their own.
			*/
			const drawLevel = (path) => {
				const state = directories[path];
				if (state === void 0) return [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: "dsh-cf-note",
					children: t("side.loading")
				}, `${path}:pending`)];
				if (state.error !== null) return [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: "dsh-cf-error",
					children: state.error === "" ? t("side.error") : state.error
				}, `${path}:error`)];
				if (state.entries.length === 0) return [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: "dsh-cf-note",
					children: state.loading ? t("side.loading") : t("side.empty")
				}, `${path}:empty`)];
				const entries = showHidden ? state.entries : state.entries.filter((entry) => !entry.name.startsWith("."));
				if (entries.length === 0) return [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: "dsh-cf-note",
					children: t("side.filtered")
				}, `${path}:filtered`)];
				const rows = [...entries].sort(compareEntries).map((entry) => {
					const target = childPath(path, entry.name);
					const isDirectory = entry.type === "directory";
					const open = isDirectory && expanded.includes(target);
					return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "dsh-cf-node",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
							type: "button",
							className: "dsh-cf-row",
							"data-type": entry.type,
							"data-open": open ? "" : void 0,
							"data-selected": !isDirectory && selected === target ? "" : void 0,
							title: entry.name,
							"aria-expanded": isDirectory ? open : void 0,
							disabled: entry.type === "other",
							onClick: () => {
								if (isDirectory) {
									toggleDirectory(target);
									return;
								}
								if (entry.type === "file") openFile(target);
							},
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "dsh-cf-twist",
									"aria-hidden": "true",
									children: isDirectory ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconArrow, {}) : null
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "dsh-cf-row-icon",
									"aria-hidden": "true",
									children: isDirectory ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconFolder, {}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconFile, {})
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "dsh-cf-row-name",
									children: entry.name
								}),
								entry.type === "file" && entry.size !== void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "dsh-cf-row-size",
									children: formatSize(entry.size)
								}) : null
							]
						}), open ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: "dsh-cf-children",
							children: drawLevel(target)
						}) : null]
					}, target);
				});
				if (state.truncated) rows.push(/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: "dsh-cf-note",
					children: t("side.truncated")
				}, `${path}:truncated`));
				return rows;
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				ref: page,
				className: FILES_ROOT_CLASS,
				"data-dsh-cool-file": "view",
				"data-conversation-composer-overlay": "",
				"data-resizing": resizing ? "col" : void 0,
				style: PAGE,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("aside", {
					ref: side,
					className: "dsh-cf-side",
					"aria-label": t("side.root"),
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "dsh-cf-side-head",
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: "dsh-cf-side-title",
									title: workspaceName,
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: "dsh-cf-side-name",
										children: workspaceName
									})
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: "dsh-cf-icon-btn",
									"aria-label": t("action.toggleHidden"),
									"aria-pressed": showHidden,
									title: t("action.toggleHidden"),
									onClick: toggleHidden,
									children: showHidden ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconShow, {}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconHide, {})
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: "dsh-cf-icon-btn",
									"aria-label": t("action.refresh"),
									title: t("action.refresh"),
									onClick: refresh,
									disabled: directories[""]?.loading === true,
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconRefresh, {})
								})
							]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: "dsh-cf-list",
							children: drawLevel("")
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ResizeHandle, {
							onStart: startSideResize,
							onDrag: dragSideResize,
							onCommit: commitSideResize,
							onEnd: endResize
						})
					]
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("section", {
					className: "dsh-cf-main",
					children: selected === null ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "dsh-cf-empty",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: "dsh-cf-empty-title",
							children: t("preview.empty")
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: "dsh-cf-empty-hint",
							children: t("preview.emptyHint")
						})]
					}) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("header", {
							className: "dsh-cf-main-head",
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "dsh-cf-file-name",
									title: selected,
									children: baseName(selected)
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "dsh-cf-file-path",
									title: selected,
									children: selected
								}),
								preview !== null ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
									className: "dsh-cf-row-size",
									children: [t("preview.lines", { count: preview.lines }), preview.bytes === void 0 ? "" : ` · ${formatSize(preview.bytes)}`]
								}) : null
							]
						}),
						preview !== null && preview.eof === false ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: "dsh-cf-truncated",
							children: t("preview.truncated", { count: preview.lines })
						}) : null,
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: "dsh-cf-body",
							children: fileLoading ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: "dsh-cf-note",
								children: t("preview.loading")
							}) : fileError !== null ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: "dsh-cf-error",
								children: fileError
							}) : preview !== null ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("pre", {
								className: "dsh-cf-code",
								children: preview.text
							}) : null
						})
					] })
				})]
			});
		}
		/**
		* The page text of a read answer, defaulting to nothing.
		*
		* @param text - the payload's text, when it carried one.
		* @returns the text to draw.
		*/
		function pendingText(text) {
			return typeof text === "string" ? text : "";
		}
		// src/client/index.ts
		/**
		* Client entry for dsh-cool-file.
		*
		* Contributes exactly one 'conversation.view' entry, which is what turns into
		* a tab in the session's tab bar. The page reads the session's workspace over
		* this package's own same-origin routes (see the Host half), so there are no
		* optional collaborators here. The shell's composer seat is taken out while
		* this tab is mounted, the same way the Terminal and Git tabs do it.
		*
		* The tab's copy enters through the locale service, which owns the active
		* language and re-renders this entry when it changes: the dictionaries are
		* registered here, the slot entry declares the namespace it reads, and the
		* framework hands the rendered View the `t` seat bound to it.
		*/
		const name = "dsh-cool-file/client";
		/**
		* The locale service is a required collaborator rather than an optional one:
		* the tab is worded entirely from its dictionaries, so a composition without
		* the service could only draw the wrong language.
		*/
		const inject = ["slots", "locale"];
		function apply(ctx) {
			const slots = ctx.get("slots");
			if (slots === void 0) return;
			const locale = ctx.get("locale");
			ctx.effect(() => insertFilesStyles(), "dsh-cool-file: styles");
			ctx.effect(() => locale.register(NS, {
				zh,
				en
			}), "dsh-cool-file: dictionaries");
			const t = locale.bind(NS);
			slots.inject("conversation.view", () => slots.register({
				name: "conversation.view",
				id: "files",
				order: 13,
				locale: NS,
				label: () => t("view.files")
			}, FilesView));
		}
		exports.apply = apply;
		exports.inject = inject;
		exports.name = name;
		return module.exports;
	}
});
