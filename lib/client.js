window.__ModuleLoader__.load({
	id: "dsh-cool-daily",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		// \0rolldown/runtime.js
		var __create = Object.create;
		var __defProp = Object.defineProperty;
		var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
		var __getOwnPropNames = Object.getOwnPropertyNames;
		var __getProtoOf = Object.getPrototypeOf;
		var __hasOwnProp = Object.prototype.hasOwnProperty;
		var __copyProps = (to, from, except, desc) => {
			if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
				key = keys[i];
				if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
					get: ((k) => from[k]).bind(null, key),
					enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
				});
			}
			return to;
		};
		var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule || !__hasOwnProp.call(mod, "default") ? __defProp(target, "default", {
			value: mod,
			enumerable: true
		}) : target, mod));
		let react = require("react");
		react = __toESM(react, 1);
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		let react_jsx_runtime = require("react/jsx-runtime");
		let react_dom = require("react-dom");
		// src/shared/contract.ts
		/** Every route below this prefix is owned by this plugin. */
		const API_PREFIX = "/dsh-cool-daily/api";
		/** Route paths, kept in one place so both halves address the same surface. */
		const API_PATHS = {
			state: `${API_PREFIX}/state`,
			settings: `${API_PREFIX}/settings`,
			generate: `${API_PREFIX}/generate`,
			article: `${API_PREFIX}/article`,
			read: `${API_PREFIX}/read`,
			models: `${API_PREFIX}/models`,
			efforts: `${API_PREFIX}/efforts`
		};
		// src/client/api.ts
		/**
		* Client half of the package-private bridge to the Host routes.
		*
		* Every route answers JSON and never rejects: a transport failure becomes an
		* `{ ok: false }` result the page draws in its own error state, so the page has
		* exactly one failure shape no matter how the answer went wrong.
		*/
		/** POST or PUT one JSON body and read a JSON answer. */
		async function sendJson(url, method, body) {
			try {
				const response = await fetch(url, {
					method,
					headers: { "content-type": "application/json" },
					body: body === void 0 ? void 0 : JSON.stringify(body),
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
		/** Read one JSON answer from a GET route. */
		async function getJson(url) {
			try {
				const response = await fetch(url, {
					credentials: "same-origin",
					cache: "no-store"
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
		/** Read settings, articles, and the current generation state. */
		function fetchState() {
			return getJson(API_PATHS.state);
		}
		/** Persist the complete settings record. */
		function saveSettings(settings) {
			return sendJson(API_PATHS.settings, "PUT", { settings });
		}
		/** Ask the Host to start one manual batch. */
		function startGeneration() {
			return sendJson(API_PATHS.generate, "POST");
		}
		/** Ask the Host to delete one article file. */
		function deleteArticle(id) {
			return sendJson(`${API_PATHS.article}?id=${encodeURIComponent(id)}`, "DELETE");
		}
		/** Read one article body by id. */
		function fetchArticle(id) {
			return getJson(`${API_PATHS.article}?id=${encodeURIComponent(id)}`);
		}
		/** Read the model catalog the settings picker offers. */
		function fetchModels() {
			return getJson(API_PATHS.models);
		}
		/** Read the reasoning levels one route offers. */
		function fetchModelEfforts(provider, model) {
			const query = `provider=${encodeURIComponent(provider)}&model=${encodeURIComponent(model)}`;
			return getJson(`${API_PATHS.efforts}?${query}`);
		}
		/** Record that the reader opened one article. */
		function markRead(id) {
			return sendJson(API_PATHS.read, "PUT", { id });
		}
		// src/client/assets/arrow-right.svg
		var arrow_right_default = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"1em\" height=\"1em\" viewBox=\"0 0 24 24\">\n	<path d=\"M0 0h24v24H0z\" fill=\"none\" />\n	<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"m9 18l6-6l-6-6\" />\n</svg>\n";
		// src/client/assets/arrow-up.svg
		var arrow_up_default = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"1em\" height=\"1em\" viewBox=\"0 0 24 24\">\n	<g fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\">\n		<path d=\"M12 19V5m-7 6 7-7 7 7\" />\n	</g>\n</svg>\n";
		// src/client/assets/back.svg
		var back_default = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"1em\" height=\"1em\" viewBox=\"0 0 24 24\">\n	<g fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\">\n		<path d=\"M19 12H5m6-7-7 7 7 7\" />\n	</g>\n</svg>\n";
		// src/client/assets/check.svg
		var check_default = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"1em\" height=\"1em\" viewBox=\"0 0 24 24\">\n	<path d=\"M0 0h24v24H0z\" fill=\"none\" />\n	<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M20 6L9 17l-5-5\" />\n</svg>\n";
		// src/client/assets/doc.svg
		var doc_default = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"1em\" height=\"1em\" viewBox=\"0 0 24 24\">\n	<path d=\"M0 0h24v24H0z\" fill=\"none\" />\n	<g fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\">\n		<path d=\"M13.75 2.75h-6.5a2.5 2.5 0 0 0-2.5 2.5v13.5a2.5 2.5 0 0 0 2.5 2.5h9.5a2.5 2.5 0 0 0 2.5-2.5V8.25Z\" />\n		<path d=\"M13.75 2.75v3.5a2 2 0 0 0 2 2h3.5m-10.5 5h6.5m-6.5 3.5h4\" />\n	</g>\n</svg>\n";
		// src/client/assets/search.svg
		var search_default = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"1em\" height=\"1em\" viewBox=\"0 0 24 24\">\n	<path d=\"M0 0h24v24H0z\" fill=\"none\" />\n	<g fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\">\n		<path d=\"m21 21l-4.34-4.34\" />\n		<circle cx=\"11\" cy=\"11\" r=\"8\" />\n	</g>\n</svg>\n";
		// src/client/assets/settings.svg
		var settings_default = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"1em\" height=\"1em\" viewBox=\"0 0 24 24\">\n	<path d=\"M0 0h24v24H0z\" fill=\"none\" />\n	<g fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\">\n		<path d=\"M14 17H5M19 7h-9\" />\n		<circle cx=\"17\" cy=\"17\" r=\"3\" />\n		<circle cx=\"7\" cy=\"7\" r=\"3\" />\n	</g>\n</svg>\n";
		// src/client/assets/sparkle.svg
		var sparkle_default = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"1em\" height=\"1em\" viewBox=\"0 0 24 24\">\n	<path d=\"M0 0h24v24H0z\" fill=\"none\" />\n	<g fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\">\n		<path d=\"M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594zM20 2v4m2-2h-4\" />\n		<circle cx=\"4\" cy=\"20\" r=\"2\" />\n	</g>\n</svg>\n";
		// src/client/icons.tsx
		/**
		* The plugin's own icon set.
		*
		* Every glyph lives in `assets/` as an SVG, and that file is the source of
		* truth for its artwork: `tsdown` inlines it as text (the `loader` map in
		* tsdown.config.ts, described by assets.d.ts), and the wrapper below narrows the
		* markup to the same `{ size, className }` surface the shell's icons expose, so
		* a call site swaps one for the other without touching its layout.
		*
		* Two properties of the artwork the wrapper keeps: the strokes draw in
		* `currentColor`, so whichever control owns an icon goes on painting it — the
		* sidebar row's hover and selected states included — with no CSS here; and
		* React owns the `<svg>` root, so `size` stays a real prop instead of riding on
		* the asset's own `1em` box.
		*/
		/**
		* Splits the root `<svg>` off an asset. The halves are needed separately because
		* React draws the root — that is where `size` and `className` land — while the
		* inside ships exactly as the file wrote it.
		*
		* A source that is not one `<svg>` carrying a `viewBox` is a mistake in this repo
		* and not something a user can reach, so it throws instead of quietly drawing an
		* empty box.
		*/
		function parseAsset(source, file) {
			const match = /<svg\b[^>]*\bviewBox="([^"]+)"[^>]*>([\s\S]*)<\/svg>/.exec(source);
			if (match === null) throw new Error(`dsh-cool-daily: assets/${file} is not a single <svg> with a viewBox`);
			return {
				viewBox: match[1],
				inner: match[2]
			};
		}
		/**
		* Build one icon component from an asset.
		*
		* The inner markup is this repo's own build-time text, never user input — which
		* is what makes `dangerouslySetInnerHTML` safe here, and the only way to keep the
		* paths byte-identical to the asset's own drawing, `stroke-width` and all.
		*/
		function icon(displayName, file, source) {
			const { viewBox, inner } = parseAsset(source, file);
			const Icon = ({ size = 16, className }) => react.createElement("svg", {
				xmlns: "http://www.w3.org/2000/svg",
				width: size,
				height: size,
				viewBox,
				className,
				"aria-hidden": "true",
				dangerouslySetInnerHTML: { __html: inner }
			});
			Icon.displayName = displayName;
			return Icon;
		}
		/** The sheet-of-paper glyph: the sidebar entry's icon, and the empty page's mark. */
		const DocIcon = icon("DocIcon", "doc.svg", doc_default);
		/** The sliders glyph: the page's settings entry. */
		const SettingsIcon = icon("SettingsIcon", "settings.svg", settings_default);
		/** The sparkle glyph: the manual generation action and its running state. */
		const SparkleIcon = icon("SparkleIcon", "sparkle.svg", sparkle_default);
		/** The up arrow: the reading view's back-to-top control. */
		const ArrowUpIcon = icon("ArrowUpIcon", "arrow-up.svg", arrow_up_default);
		/** The magnifier glyph: the article search field. */
		const SearchIcon = icon("SearchIcon", "search.svg", search_default);
		/** The left arrow: the article reader's way back to the list. */
		const BackIcon = icon("BackIcon", "back.svg", back_default);
		/**
		* The disclosure mark, drawn pointing right and turned by the stylesheet: the
		* model picker's trigger turns it down while closed and up while open, and a
		* provider row turns it down while its models are showing.
		*/
		const ArrowRightIcon = icon("ArrowRightIcon", "arrow-right.svg", arrow_right_default);
		/** The check a chosen row carries. */
		const CheckIcon = icon("CheckIcon", "check.svg", check_default);
		// src/client/markdown.tsx
		/**
		* A small Markdown renderer for the article reader.
		*
		* The articles are this plugin's own model output, and they are rendered as
		* React elements rather than injected HTML, so a model that emits a `<script>`
		* or an `onerror` attribute cannot turn into markup. Only the block and inline
		* forms the prompt actually asks for are supported: headings, paragraphs,
		* emphasis, inline code, fenced code, lists, quotes, links, and rules. Anything
		* else stays literal text, which is the safe failure for a reader.
		*/
		/** Matches one heading line. */
		const HEADING = /^(#{1,6})\s+(.*)$/;
		/** Matches one fenced code opener. */
		const FENCE = /^```(\S*)\s*$/;
		/** Matches a closing fence. */
		const FENCE_CLOSE = /^```\s*$/;
		/** Matches a horizontal rule. */
		const RULE = /^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/;
		/** Matches one unordered-list item. */
		const UNORDERED = /^\s*[-*+]\s+(.*)$/;
		/** Matches one ordered-list item. */
		const ORDERED = /^\s*\d+[.)]\s+(.*)$/;
		/** Matches one blockquote line. */
		const QUOTE = /^\s*>\s?(.*)$/;
		/** Inline forms, tried left to right at the current position. */
		const INLINE = /(`[^`]+`)|(\*\*[^*]+\*\*)|(__[^_]+__)|(\*[^*]+\*)|(_[^_]+_)|(\[[^\]]+\]\([^)\s]+\))/g;
		/** Whether one line starts a block that ends the paragraph it is in. */
		function startsBlock(line) {
			return FENCE.test(line) || HEADING.test(line) || RULE.test(line) || UNORDERED.test(line) || ORDERED.test(line) || QUOTE.test(line);
		}
		/** Render the emphasis, code, and link forms inside one line of text. */
		function inline(text, keyBase) {
			const nodes = [];
			let last = 0;
			let index = 0;
			INLINE.lastIndex = 0;
			for (let match = INLINE.exec(text); match !== null; match = INLINE.exec(text)) {
				if (match.index > last) nodes.push(text.slice(last, match.index));
				const token = match[0];
				const key = `${keyBase}-${index}`;
				index += 1;
				if (token.startsWith("`")) nodes.push(react.createElement("code", { key }, token.slice(1, -1)));
				else if (token.startsWith("**") || token.startsWith("__")) nodes.push(react.createElement("strong", { key }, token.slice(2, -2)));
				else if (token.startsWith("[")) {
					const link = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(token);
					const href = link?.[2] ?? "";
					if (!/^(?:https?:\/\/|mailto:|\/|#)/i.test(href)) nodes.push(token);
					else nodes.push(react.createElement("a", {
						key,
						href,
						target: "_blank",
						rel: "noreferrer noopener"
					}, link?.[1] ?? token));
				} else nodes.push(react.createElement("em", { key }, token.slice(1, -1)));
				last = match.index + token.length;
			}
			if (last < text.length) nodes.push(text.slice(last));
			return nodes;
		}
		/** Split Markdown text into React block elements. */
		function blocks(source) {
			const lines = source.replace(/\r\n?/g, "\n").split("\n");
			const nodes = [];
			let index = 0;
			let key = 0;
			while (index < lines.length) {
				const line = lines[index];
				if (line.trim() === "") {
					index += 1;
					continue;
				}
				const fence = FENCE.exec(line);
				if (fence !== null) {
					const code = [];
					index += 1;
					while (index < lines.length && !FENCE_CLOSE.test(lines[index])) {
						code.push(lines[index]);
						index += 1;
					}
					index += 1;
					nodes.push(react.createElement("pre", { key: `block-${key}` }, react.createElement("code", fence[1] === "" ? null : { "data-language": fence[1] }, code.join("\n"))));
					key += 1;
					continue;
				}
				const heading = HEADING.exec(line);
				if (heading !== null) {
					nodes.push(react.createElement(`h${heading[1].length}`, { key: `block-${key}` }, inline(heading[2], `heading-${key}`)));
					key += 1;
					index += 1;
					continue;
				}
				if (RULE.test(line)) {
					nodes.push(react.createElement("hr", { key: `block-${key}` }));
					key += 1;
					index += 1;
					continue;
				}
				if (QUOTE.test(line)) {
					const quote = [];
					while (index < lines.length) {
						const quoted = QUOTE.exec(lines[index]);
						if (quoted === null) break;
						quote.push(quoted[1]);
						index += 1;
					}
					nodes.push(react.createElement("blockquote", { key: `block-${key}` }, blocks(quote.join("\n"))));
					key += 1;
					continue;
				}
				if (UNORDERED.test(line) || ORDERED.test(line)) {
					const ordered = ORDERED.test(line);
					const items = [];
					while (index < lines.length) {
						const item = (ordered ? ORDERED : UNORDERED).exec(lines[index]);
						if (item === null) break;
						items.push(item[1]);
						index += 1;
					}
					nodes.push(react.createElement(ordered ? "ol" : "ul", { key: `block-${key}` }, items.map((item, itemIndex) => react.createElement("li", { key: `item-${key}-${itemIndex}` }, inline(item, `item-${key}-${itemIndex}`)))));
					key += 1;
					continue;
				}
				const paragraph = [];
				while (index < lines.length && lines[index].trim() !== "" && (paragraph.length === 0 || !startsBlock(lines[index]))) {
					paragraph.push(lines[index].trim());
					index += 1;
				}
				if (paragraph.length > 0) {
					nodes.push(react.createElement("p", { key: `block-${key}` }, inline(paragraph.join(" "), `paragraph-${key}`)));
					key += 1;
				}
			}
			return nodes;
		}
		/**
		* Render one Markdown document.
		* @param props.text - the article body as stored on disk.
		* @returns the rendered block sequence.
		*/
		function Markdown({ text }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: "dsh-cd-md",
				children: blocks(text)
			});
		}
		// src/client/article.tsx
		/**
		* The article reader.
		*
		* One article is fetched by id when the reader opens, so the list payload stays
		* small however many days the directory holds. The Markdown body renders through
		* the plugin's own renderer — React elements, never injected HTML.
		*/
		/**
		* Render one article.
		* @param props - article id and the back action.
		* @returns the article header, metadata, and rendered body.
		*/
		function ArticleView({ t, id, onBack }) {
			const [article, setArticle] = react.useState(null);
			const [loading, setLoading] = react.useState(true);
			const [error, setError] = react.useState(null);
			const load = react.useCallback(async () => {
				setLoading(true);
				setError(null);
				const answer = await fetchArticle(id);
				if (answer.ok === true) {
					setArticle(answer.article);
					setError(null);
				} else {
					setArticle(null);
					setError(answer.error);
				}
				setLoading(false);
			}, [id]);
			react.useEffect(() => {
				load();
			}, [load]);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "dsh-cd-article",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: "dsh-cd-back",
						onClick: onBack,
						"aria-label": t("article.back"),
						title: t("article.back"),
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(BackIcon, { size: 16 })
					}),
					loading && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: "dsh-cd-state",
						children: t("article.loading")
					}),
					!loading && error !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "dsh-cd-state",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: t("article.missing") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: "dsh-cd-btn",
							onClick: () => {
								load();
							},
							children: t("article.retry")
						})]
					}),
					!loading && article !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("article", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("header", {
						className: "dsh-cd-article-head",
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h1", {
								className: "dsh-cd-article-title",
								children: article.title
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "dsh-cd-article-meta",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: article.date }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Tag, {
									tone: "neutral",
									children: article.category
								})]
							}),
							article.tags.length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: "dsh-cd-article-tags",
								role: "group",
								"aria-label": t("tags.label"),
								children: article.tags.map((tag) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Tag, {
									tone: "outline",
									children: tag
								}, tag))
							})
						]
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Markdown, { text: article.content })] })
				]
			});
		}
		// src/client/delete-dialog.tsx
		/**
		* The delete confirmation.
		*
		* Deleting an article removes the user's Markdown file, so the list never does it
		* on a single click: this small dialog names the article, says what will be
		* removed, and keeps the failure inside itself so a refused delete leaves the
		* card where it was. The chrome is the platform's `Modal` and `Button`, the same
		* pair the settings dialog uses.
		*/
		/**
		* Render the confirmation.
		* @param props - the article title, the busy flag, and the two actions.
		* @returns the modal dialog.
		*/
		function DeleteDialog({ t, title, busy, error, onCancel, onConfirm }) {
			const description = t("delete.description").replace("{name}", title);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Modal, {
				open: true,
				onClose: () => {
					if (!busy) onCancel();
				},
				title: t("delete.title"),
				description,
				closeLabel: t("delete.cancel"),
				className: "dsh-cd-dialog-narrow",
				footer: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
					variant: "outline",
					"data-modal-autofocus": true,
					disabled: busy,
					onClick: onCancel,
					children: t("delete.cancel")
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
					variant: "primary",
					className: "dsh-cd-btn-danger",
					disabled: busy,
					onClick: onConfirm,
					children: busy ? t("delete.deleting") : t("delete.confirm")
				})] }),
				children: error !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
					className: "dsh-cd-dialog-error",
					role: "alert",
					children: error
				})
			});
		}
		// src/client/model-picker.tsx
		/**
		* The model picker inside the settings dialog.
		*
		* The shape is dsh-cool-git's settings picker, carried over rather than
		* approximated: the trigger repeats the dialog's field material, and the list is
		* a fixed-height popover with a search row, provider groups that fold away, and
		* the plugin's own overlay scrollbar. The platform has no `Popover` primitive,
		* so the panel is assembled from the pieces its own menus use —
		* `useAnchoredPosition` keeps it against the trigger, `useModalLayer` puts it on
		* the dialog's layer stack so Escape closes the list before the card and Tab
		* stays inside it, and the panel is portaled to `document.body` because the
		* dialog body is a scrollport that would clip a child.
		*
		* The field speaks the effective route — the pinned one, or DSH's default while
		* nothing is pinned — exactly as the reference does, and the list holds only
		* routes that can be saved: choosing a model is what pins it, and until a reader
		* does that this plugin goes on following DSH.
		*/
		/** How tall the panel is: a fixed sheet keeps it from jumping while a search narrows the list. */
		const PICKER_HEIGHT = 370;
		/** The shortest the overlay scrollbar thumb may get. */
		const PICKER_THUMB_MIN = 28;
		/** The gap and margin the panel is placed with. */
		const PICKER_GAP = 6;
		const PICKER_MARGIN = 12;
		/** The width the panel opens at, and the narrowest a narrow field may shrink it to. */
		const PICKER_WIDTH_INITIAL = 320;
		const PICKER_WIDTH_MIN = 280;
		/** The layer the panel sits on, and how far above the field's own layer it starts. */
		const PICKER_Z_BASE = 1e3;
		const PICKER_Z_STEP = 10;
		/**
		* What a row's effort control says when the route pins no level.
		*
		* Deliberately not translated: the ids listed beside it come from the adapter
		* (`high`, `medium`, …), so the name for "no pinned level" belongs to that same
		* vocabulary rather than to either dictionary.
		*/
		const DEFAULT_EFFORT = "Default";
		/** The effort menu's id for "no pinned level", kept clear of the adapter's ids. */
		const EFFORT_DEFAULT_ID = "dsh-cd-effort-default";
		/** Join a route into one comparable key. */
		function keyOf(route) {
			return `${route.provider}\u0000${route.model}`;
		}
		/** Name one route through the catalog, falling back to its raw ids. */
		function labelOf$1(route, groups) {
			const group = groups.find((entry) => entry.provider === route.provider);
			const model = group?.models.find((entry) => entry.id === route.model);
			return `${group?.name ?? route.provider} / ${model?.name ?? route.model}`;
		}
		/**
		* Render the picker.
		* @param props - catalog, current choice, and the change callback.
		* @returns the trigger and, while open, its popover.
		*/
		function ModelPicker({ t, groups, current, value, disabled, onChange }) {
			const [open, setOpen] = react.useState(false);
			const [query, setQuery] = react.useState("");
			const [collapsed, setCollapsed] = react.useState([]);
			const [effortOpen, setEffortOpen] = react.useState(null);
			const [effortLists, setEffortLists] = react.useState({});
			const [effortFailures, setEffortFailures] = react.useState([]);
			const [effortLoading, setEffortLoading] = react.useState([]);
			const [thumb, setThumb] = react.useState(null);
			const [layout, setLayout] = react.useState({
				width: PICKER_WIDTH_INITIAL,
				zIndex: 1010,
				side: "bottom"
			});
			const fieldRef = react.useRef(null);
			const panelRef = react.useRef(null);
			const listRef = react.useRef(null);
			const panelId = react.useId();
			/** Routes whose effort list has been asked for, so one row asks once. */
			const effortsAsked = react.useRef(/* @__PURE__ */ new Set());
			const close = react.useCallback(() => {
				setOpen(false);
				setEffortOpen(null);
			}, []);
			/**
			* Place the list's own scrollbar thumb over the rows.
			*
			* The native bar is hidden because a platform scrollbar is 5px of real width
			* taken out of the rows' right edge; the thumb is drawn over the rows' padding
			* instead, so the layout is the same width whether the catalog overflows or not.
			*/
			const measureThumb = react.useCallback(() => {
				const list = listRef.current;
				if (list === null) return;
				const { scrollTop, scrollHeight, clientHeight } = list;
				if (scrollHeight <= clientHeight + 1) {
					setThumb((currentThumb) => currentThumb === null ? currentThumb : null);
					return;
				}
				const height = Math.max(PICKER_THUMB_MIN, Math.round(clientHeight / scrollHeight * clientHeight));
				const top = Math.round(scrollTop / (scrollHeight - clientHeight) * (clientHeight - height));
				setThumb((currentThumb) => currentThumb !== null && currentThumb.top === top && currentThumb.height === height ? currentThumb : {
					top,
					height
				});
			}, []);
			react.useLayoutEffect(() => {
				if (open) measureThumb();
			});
			react.useLayoutEffect(() => {
				if (!open) return;
				const measure = () => {
					const trigger = fieldRef.current;
					if (trigger === null) return;
					const rect = trigger.getBoundingClientRect();
					const width = Math.max(PICKER_WIDTH_MIN, Math.min(rect.width, window.innerWidth - 24));
					const below = window.innerHeight - rect.bottom - PICKER_GAP - PICKER_MARGIN;
					const above = rect.top - PICKER_GAP - PICKER_MARGIN;
					const openUp = below < PICKER_HEIGHT && above > below;
					let layer = 0;
					for (let node = trigger.parentElement; node !== null && node !== document.body; node = node.parentElement) {
						const zIndex = Number(window.getComputedStyle(node).zIndex);
						if (Number.isFinite(zIndex)) layer = Math.max(layer, zIndex);
					}
					const next = {
						width,
						zIndex: Math.max(layer + PICKER_Z_STEP, PICKER_Z_BASE),
						side: openUp ? "top" : "bottom"
					};
					setLayout((currentLayout) => currentLayout.width === next.width && currentLayout.zIndex === next.zIndex && currentLayout.side === next.side ? currentLayout : next);
				};
				measure();
				const followScroll = (event) => {
					if (event.target instanceof Node && panelRef.current?.contains(event.target) === true) return;
					measure();
				};
				window.addEventListener("resize", measure);
				window.addEventListener("scroll", followScroll, true);
				return () => {
					window.removeEventListener("resize", measure);
					window.removeEventListener("scroll", followScroll, true);
				};
			}, [open]);
			const placement = (0, _deepseek_ai_dsh_client_ui_primitives.useAnchoredPosition)({
				open,
				anchorRef: fieldRef,
				panelRef,
				side: layout.side,
				gap: PICKER_GAP,
				margin: PICKER_MARGIN
			});
			(0, _deepseek_ai_dsh_client_ui_primitives.useModalLayer)(panelRef, open, close);
			react.useEffect(() => {
				if (!open) return;
				const dismiss = (event) => {
					const target = event.target;
					if (!(target instanceof Node)) return;
					if (fieldRef.current?.contains(target) === true) return;
					if (panelRef.current?.contains(target) === true) return;
					if (target instanceof Element && target.closest("[role=\"menu\"]") !== null) return;
					close();
				};
				document.addEventListener("pointerdown", dismiss);
				return () => {
					document.removeEventListener("pointerdown", dismiss);
				};
			}, [close, open]);
			const needle = query.trim().toLowerCase();
			const matches = (text) => text.toLowerCase().includes(needle);
			const visibleGroups = needle === "" ? groups : groups.map((group) => {
				const models = matches(group.name) || matches(group.provider) ? group.models : group.models.filter((model) => matches(model.name) || matches(model.id));
				return {
					...group,
					models
				};
			}).filter((group) => group.models.length > 0);
			const known = new Set(groups.flatMap((group) => group.models.map((model) => keyOf({
				provider: group.provider,
				model: model.id
			}))));
			const stale = value !== null && !known.has(keyOf(value)) ? value : null;
			const choose = (next) => {
				onChange(next);
				setOpen(false);
			};
			const closeEfforts = () => {
				setEffortOpen(null);
			};
			/**
			* Read one row's effort list, once per model per opening.
			*
			* The list is adapter metadata resolved per model, so it is read when the
			* control is opened rather than with the catalog. A failed read stays beside
			* its row: it is not the dialog's failure, and the row must not pretend the
			* model offers no level.
			*/
			const loadEfforts = (route) => {
				const key = keyOf(route);
				if (effortsAsked.current.has(key)) return;
				effortsAsked.current.add(key);
				setEffortLoading((current) => [...current, key]);
				fetchModelEfforts(route.provider, route.model).then((result) => {
					setEffortLoading((current) => current.filter((entry) => entry !== key));
					if (result.ok === true) {
						setEffortLists((current) => ({
							...current,
							[key]: result.efforts
						}));
						return;
					}
					setEffortLists((current) => ({
						...current,
						[key]: []
					}));
					setEffortFailures((current) => current.includes(key) ? current : [...current, key]);
				});
			};
			/** Open one row's effort control, or close it when it is already open. */
			const toggleEfforts = (route) => {
				const key = keyOf(route);
				if (effortOpen === key) {
					setEffortOpen(null);
					return;
				}
				setEffortOpen(key);
				loadEfforts(route);
			};
			const effective = value ?? current;
			const triggerLabel = effective === null ? t("settings.modelUnknown") : `${labelOf$1(effective, groups)} / ${effective.reasoningEffort ?? DEFAULT_EFFORT}`;
			const rowCheck = (chosen) => chosen ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
				className: "dsh-cd-picker-row-check",
				"aria-hidden": "true",
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(CheckIcon, { size: 12 })
			}) : null;
			/**
			* Draw one model row and the effort control that row owns.
			*
			* Naming a model and naming a level are two controls, like the reference: the
			* name selects the model, and the control opens the adapter's own levels in the
			* platform `Menu` — a short list of named levels is what a menu is, and its
			* portal keeps it out of the panel's scrollport. Choosing a level pins the route
			* with it, which is why the control only shows the level a chosen route stores.
			*/
			const renderRow = (route, label, chosen, hint) => {
				const key = keyOf(route);
				const pinned = chosen && value !== null ? value.reasoningEffort ?? null : null;
				const menuOpen = effortOpen === key;
				const efforts = effortLists[key] ?? [];
				const orphan = pinned !== null && !efforts.includes(pinned) ? [pinned] : [];
				const items = [{
					id: EFFORT_DEFAULT_ID,
					label: DEFAULT_EFFORT
				}];
				if (effortLoading.includes(key)) items.push({
					type: "label",
					id: `${key}-loading`,
					text: t("settings.loading")
				});
				else if (effortFailures.includes(key)) items.push({
					type: "label",
					id: `${key}-failure`,
					text: t("settings.effortReadFailed")
				});
				for (const effort of [...efforts, ...orphan]) items.push({
					id: effort,
					label: effort
				});
				return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: "dsh-cd-picker-row",
					"data-selected": chosen,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
						type: "button",
						className: "dsh-cd-picker-row-name",
						"aria-pressed": chosen,
						onClick: () => {
							choose(route);
						},
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "dsh-cd-picker-row-text",
								children: label
							}),
							hint !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "dsh-cd-picker-row-hint",
								children: hint
							}),
							rowCheck(chosen)
						]
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Menu, {
						open: menuOpen,
						className: "dsh-cd-picker-effort-control",
						anchor: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
							type: "button",
							className: "dsh-cd-picker-row-effort",
							"aria-haspopup": "menu",
							"aria-expanded": menuOpen,
							"aria-label": `${t("settings.effort")}: ${pinned ?? DEFAULT_EFFORT}`,
							onClick: () => {
								toggleEfforts(route);
							},
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: pinned ?? DEFAULT_EFFORT }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "dsh-cd-picker-row-arrow",
								"aria-hidden": "true",
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ArrowRightIcon, { size: 12 })
							})]
						}),
						items,
						selectedId: pinned ?? EFFORT_DEFAULT_ID,
						onSelect: (id) => {
							closeEfforts();
							choose(id === EFFORT_DEFAULT_ID ? route : {
								...route,
								reasoningEffort: id
							});
						},
						onClose: closeEfforts,
						align: "end",
						side: "bottom",
						portal: true
					})]
				}, key);
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "dsh-cd-picker",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
					ref: fieldRef,
					id: `${panelId}-field`,
					type: "button",
					className: "dsh-cd-picker-trigger",
					"aria-expanded": open,
					"aria-controls": panelId,
					"aria-haspopup": "dialog",
					disabled,
					onClick: () => {
						setOpen((currentOpen) => !currentOpen);
						setQuery("");
					},
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: "dsh-cd-picker-value",
						children: triggerLabel
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: "dsh-cd-picker-chevron",
						"data-open": open,
						"aria-hidden": "true",
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ArrowRightIcon, { size: 14 })
					})]
				}), open && (0, react_dom.createPortal)(/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					id: panelId,
					ref: panelRef,
					className: "dsh-cd-picker-popover",
					role: "group",
					"aria-label": t("settings.model"),
					style: {
						left: placement?.left ?? 0,
						top: placement?.top ?? 0,
						width: layout.width,
						height: PICKER_HEIGHT,
						zIndex: layout.zIndex
					},
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "dsh-cd-picker-search",
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
							type: "text",
							className: "dsh-cd-picker-input",
							value: query,
							placeholder: t("settings.modelSearch"),
							"aria-label": t("settings.modelSearch"),
							spellCheck: false,
							onChange: (event) => {
								setQuery(event.target.value);
							}
						})
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "dsh-cd-picker-listwrap",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "dsh-cd-picker-list",
							ref: listRef,
							onScroll: measureThumb,
							children: [
								stale !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [renderRow(stale, t("settings.modelStale"), true, labelOf$1(stale, groups)), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: "dsh-cd-picker-rule",
									role: "presentation"
								})] }),
								visibleGroups.map((group) => {
									const expanded = needle !== "" || !collapsed.includes(group.provider);
									return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: "dsh-cd-picker-group",
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
											className: "dsh-cd-picker-group-sticky",
											children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
												type: "button",
												className: "dsh-cd-picker-group-head",
												"aria-expanded": expanded,
												onClick: () => {
													setCollapsed((currentCollapsed) => currentCollapsed.includes(group.provider) ? currentCollapsed.filter((entry) => entry !== group.provider) : [...currentCollapsed, group.provider]);
												},
												children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
													className: "dsh-cd-picker-group-name",
													children: group.name
												}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
													className: "dsh-cd-picker-group-arrow",
													"data-open": expanded,
													"aria-hidden": "true",
													children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ArrowRightIcon, { size: 12 })
												})]
											})
										}), expanded ? group.models.map((model) => {
											const route = {
												provider: group.provider,
												model: model.id
											};
											const chosen = value !== null && keyOf(value) === keyOf(route);
											return renderRow(route, model.name, chosen);
										}) : null]
									}, group.provider);
								}),
								visibleGroups.length === 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
									className: "dsh-cd-picker-empty",
									children: t("settings.searchEmpty")
								})
							]
						}), thumb !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: "dsh-cd-picker-thumb",
							style: {
								top: thumb.top,
								height: thumb.height
							},
							"aria-hidden": "true"
						})]
					})]
				}), document.body)]
			});
		}
		// src/client/settings.tsx
		/**
		* The settings dialog, drawn with DSH's own Modal and Button primitives so its
		* chrome, mask, focus trap, Escape handling, and action row match the rest of
		* the product instead of being re-implemented here.
		*
		* It edits one draft of the complete settings document and writes it in one
		* request, so the prompt, the repeat days, and the batch size can never be
		* saved half-applied. The dialog owns its own failure state: a refused write
		* leaves the draft on screen so the user can retry instead of losing the text
		* they just typed.
		*/
		/** Display order of the weekday toggles: Monday first, Sunday last. */
		const WEEK_ORDER = [
			1,
			2,
			3,
			4,
			5,
			6,
			0
		];
		/** Clamp one numeric draft to the range the Host accepts. */
		function clampCount(value) {
			const parsed = Number.parseInt(value, 10);
			if (!Number.isFinite(parsed)) return 1;
			return Math.min(10, Math.max(1, parsed));
		}
		/**
		* Keep the count draft inside the accepted 1-10 range while it is typed.
		* An empty draft is allowed through so the field can be cleared and retyped;
		* it settles on the lower bound when the dialog is saved.
		*/
		function limitCount(value) {
			const digits = value.replace(/\D+/gu, "").replace(/^0+/u, "").slice(0, 2);
			if (digits === "") return "";
			return String(Math.min(10, Number.parseInt(digits, 10)));
		}
		/**
		* Render the settings dialog.
		* @param props - stored settings, close and save callbacks.
		* @returns the modal dialog.
		*/
		function SettingsDialog({ t, settings, onClose, onSaved }) {
			const [prompt, setPrompt] = react.useState(settings.prompt);
			const [count, setCount] = react.useState(String(settings.count));
			const [days, setDays] = react.useState(settings.days);
			const [model, setModel] = react.useState(settings.model);
			const [saving, setSaving] = react.useState(false);
			const [error, setError] = react.useState(null);
			const [groups, setGroups] = react.useState([]);
			const [current, setCurrent] = react.useState(null);
			react.useEffect(() => {
				let alive = true;
				fetchModels().then((answer) => {
					if (!alive || answer.ok !== true) return;
					setGroups(answer.groups);
					setCurrent(answer.current);
				});
				return () => {
					alive = false;
				};
			}, []);
			const close = () => {
				if (!saving) onClose();
			};
			const toggleDay = (day) => {
				setDays((current) => current.includes(day) ? current.filter((value) => value !== day) : [...current, day].sort((left, right) => left - right));
			};
			const save = async () => {
				if (saving) return;
				setSaving(true);
				setError(null);
				const answer = await saveSettings({
					prompt: prompt.trim(),
					count: clampCount(count),
					days,
					model
				});
				if (answer.ok !== true) {
					setSaving(false);
					setError(`${t("settings.failed")}${answer.error === "" ? "" : `: ${answer.error}`}`);
					return;
				}
				onSaved(answer.settings);
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Modal, {
				open: true,
				onClose: close,
				className: "dsh-cd-dialog-wide",
				title: t("settings.title"),
				description: t("settings.description"),
				closeLabel: t("settings.close"),
				footer: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
					variant: "outline",
					"data-modal-autofocus": true,
					disabled: saving,
					onClick: close,
					children: t("settings.cancel")
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
					variant: "primary",
					disabled: saving,
					onClick: () => {
						save();
					},
					children: saving ? t("settings.saving") : t("settings.save")
				})] }),
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: "dsh-cd-dialog-scroll",
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "dsh-cd-field",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "dsh-cd-field-label",
								children: t("settings.model")
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ModelPicker, {
								t,
								groups,
								current,
								value: model,
								disabled: saving,
								onChange: setModel
							})]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
							className: "dsh-cd-field",
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "dsh-cd-field-label",
									children: t("settings.prompt")
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("textarea", {
									className: "dsh-cd-textarea",
									value: prompt,
									rows: 6,
									onChange: (event) => {
										setPrompt(event.target.value);
									},
									disabled: saving
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "dsh-cd-hint",
									children: t("settings.promptHint")
								})
							]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "dsh-cd-field",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "dsh-cd-field-label",
								children: t("settings.days")
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: "dsh-cd-days",
								children: WEEK_ORDER.map((day) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: days.includes(day) ? "dsh-cd-day dsh-cd-day-active" : "dsh-cd-day",
									"aria-pressed": days.includes(day),
									onClick: () => {
										toggleDay(day);
									},
									disabled: saving,
									children: t(`weekday.${day}`)
								}, day))
							})]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: "dsh-cd-count",
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.SettingsValueField, {
								id: "dsh-cd-count",
								label: t("settings.count"),
								text: count,
								numeric: true,
								disabled: saving,
								onEdit: (value) => {
									setCount(limitCount(value));
								}
							})
						}),
						error !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
							className: "dsh-cd-dialog-error",
							role: "alert",
							children: error
						})
					]
				})
			});
		}
		// src/client/unread.ts
		/**
		* Shared unread count behind the sidebar entry's dot.
		*
		* The Host generates on its own schedule, so the entry cannot learn about a new
		* article from the page: the sidebar row is rendered outside the main panel, and
		* the generation happens while that panel is closed or showing something else.
		* The count therefore lives in the entry's own subscription — a slow poll of the
		* state route, a re-read whenever the window is focused again, and an event the
		* page fires after it changes something the count depends on (opening an article
		* marks it read, deleting removes it).
		*
		* The entry never caches the articles themselves: only the number matters here,
		* and the page keeps the list it already renders.
		*/
		/**
		* How often the entry re-reads the count on its own, in milliseconds.
		*
		* The scheduler writes its batch in the morning; a minute of latency is
		* invisible, and one request a minute costs nothing next to the page's own
		* polling while a generation runs.
		*/
		const POLL_INTERVAL_MS$1 = 6e4;
		/** Window event the page fires after a read/delete, so the dot tracks it at once. */
		const CHANGED_EVENT = "dsh-cool-daily:changed";
		/**
		* Tell the sidebar entry that the unread set probably changed.
		*
		* Cheap enough to fire on every mutation: listeners re-read the count from one
		* route rather than being handed the new value, so a missed event can only
		* delay the dot, never put it out of step.
		*/
		function notifyUnreadChanged() {
			window.dispatchEvent(new Event(CHANGED_EVENT));
		}
		/**
		* Follow the number of unread articles.
		*
		* @returns the count, 0 until the first answer arrives and after any failure
		* (an unreachable Host has no articles to announce).
		*/
		function useUnreadCount() {
			const [count, setCount] = react.useState(0);
			react.useEffect(() => {
				let live = true;
				const load = async () => {
					const answer = await fetchState();
					if (!live || answer.ok !== true) return;
					setCount(answer.articles.filter((article) => !article.read).length);
				};
				load();
				const timer = window.setInterval(() => {
					load();
				}, POLL_INTERVAL_MS$1);
				const reread = () => {
					load();
				};
				window.addEventListener(CHANGED_EVENT, reread);
				window.addEventListener("focus", reread);
				return () => {
					live = false;
					window.clearInterval(timer);
					window.removeEventListener(CHANGED_EVENT, reread);
					window.removeEventListener("focus", reread);
				};
			}, []);
			return count;
		}
		// src/client/page.tsx
		/**
		* The Daily Post page.
		*
		* The page is a thin, honest projection of the Host's state: it lists the
		* Markdown files the Host has written, filters them locally, and follows a
		* running generation by polling the state route while the Host reports one. It
		* never writes an article itself — the manual button only asks the Host to start
		* a batch, and the settings dialog only stores the prompt, batch size, repeat
		* days, and model the Host schedules from.
		*/
		/** How often a running generation is polled, in milliseconds. */
		const POLL_INTERVAL_MS = 2500;
		/**
		* How far into an article the reader must be before the back-to-top control
		* appears, in px. Roughly one screen of a 13" display: below that the top of the
		* article is still a glance away and a floating button would only be clutter.
		*/
		const BACK_TO_TOP_AT = 320;
		/**
		* Render one article card: the title first, the opening sentence beneath it, and
		* a footer that pairs the content tags with the publication day and the delete
		* control.
		*
		* @param props - the article summary, the plugin's translate seat, and the two actions.
		* @returns the list row.
		*/
		function ArticleCard({ article, t, onOpen, onDelete }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "dsh-cd-card",
				role: "button",
				tabIndex: 0,
				onClick: onOpen,
				onKeyDown: (event) => {
					if (event.target !== event.currentTarget) return;
					if (event.key !== "Enter" && event.key !== " ") return;
					event.preventDefault();
					onOpen();
				},
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
						className: "dsh-cd-card-head",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: "dsh-cd-card-title",
							children: article.title
						}), !article.read && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: "dsh-cd-new",
							children: t("card.new")
						})]
					}),
					article.excerpt !== "" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: "dsh-cd-card-excerpt",
						children: article.excerpt
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
						className: "dsh-cd-card-foot",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: "dsh-cd-card-tags",
							children: article.tags.slice(0, 3).map((tag) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Tag, {
								tone: "neutral",
								children: tag
							}, tag))
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
							className: "dsh-cd-card-meta",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "dsh-cd-date",
								children: article.date
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: "dsh-cd-delete",
								onClick: (event) => {
									event.stopPropagation();
									onDelete();
								},
								children: t("card.delete")
							})]
						})]
					})
				]
			});
		}
		/**
		* Render the Daily Post page.
		* @param props - the plugin's translate seat.
		* @returns the page frame: heading, toolbar, article list, and the reader.
		*/
		function DailyPage({ t }) {
			const [state, setState] = react.useState(null);
			const [view, setView] = react.useState({ kind: "list" });
			const [settingsOpen, setSettingsOpen] = react.useState(false);
			const [query, setQuery] = react.useState("");
			const [category, setCategory] = react.useState("");
			const [loadError, setLoadError] = react.useState(null);
			const [busy, setBusy] = react.useState(false);
			const [pendingDelete, setPendingDelete] = react.useState(null);
			const [deleteBusy, setDeleteBusy] = react.useState(false);
			const [deleteError, setDeleteError] = react.useState(null);
			const scrollRef = react.useRef(null);
			const scrollWrapRef = react.useRef(null);
			react.useEffect(() => {
				if (scrollRef.current !== null) scrollRef.current.scrollTop = 0;
			}, [view]);
			const unreadSeen = react.useRef(0);
			const refresh = react.useCallback(async () => {
				const answer = await fetchState();
				if (answer.ok === true) {
					setState(answer);
					setLoadError(null);
					const unread = answer.articles.filter((article) => !article.read).length;
					if (unread !== unreadSeen.current) {
						unreadSeen.current = unread;
						notifyUnreadChanged();
					}
				} else setLoadError(answer.error);
			}, []);
			react.useEffect(() => {
				refresh();
			}, [refresh]);
			const generating = state?.generating === true;
			react.useEffect(() => {
				if (!generating) return;
				const timer = window.setInterval(() => {
					refresh();
				}, POLL_INTERVAL_MS);
				return () => {
					window.clearInterval(timer);
				};
			}, [generating, refresh]);
			/**
			* Show each edge fade only where the scroll region really hides something.
			*
			* Scrolling fires far too often to push this through React state, so the
			* answer is written straight onto the wrapper as `data-fade-top` and
			* `data-fade-bottom`; the stylesheet turns those attributes into the scroller's
			* mask. The same pass records the scrollbar gutter in `--dsh-cd-fade-right`: a
			* mask also applies to the scrollbar, so the sheet lays the fade over the
			* content column and a second, opaque layer over the gutter — without that the
			* bar would be masked away instead of merely left alone.
			* No dependency list: every content change arrives as a commit, and re-running
			* is what re-reads the new heights.
			*/
			react.useEffect(() => {
				const scroll = scrollRef.current;
				const wrap = scrollWrapRef.current;
				if (scroll === null || wrap === null) return;
				const update = () => {
					const overflow = scroll.scrollHeight - scroll.clientHeight > 1;
					wrap.toggleAttribute("data-fade-top", overflow && scroll.scrollTop > 1);
					wrap.toggleAttribute("data-fade-bottom", overflow && scroll.scrollTop + scroll.clientHeight < scroll.scrollHeight - 1);
					wrap.toggleAttribute("data-can-top", overflow && scroll.scrollTop > BACK_TO_TOP_AT);
					const gutter = `${scroll.offsetWidth - scroll.clientWidth}px`;
					if (wrap.style.getPropertyValue("--dsh-cd-fade-right") !== gutter) wrap.style.setProperty("--dsh-cd-fade-right", gutter);
				};
				update();
				scroll.addEventListener("scroll", update, { passive: true });
				const observer = typeof ResizeObserver === "undefined" ? void 0 : new ResizeObserver(update);
				observer?.observe(scroll);
				return () => {
					scroll.removeEventListener("scroll", update);
					observer?.disconnect();
				};
			});
			react.useEffect(() => {
				if (category === "") return;
				if ((state?.articles ?? []).some((article) => article.category === category)) return;
				setCategory("");
			}, [category, state]);
			const categories = react.useMemo(() => {
				const counts = /* @__PURE__ */ new Map();
				for (const article of state?.articles ?? []) counts.set(article.category, (counts.get(article.category) ?? 0) + 1);
				return [...counts.entries()].sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0])).map(([name]) => name);
			}, [state]);
			const articles = react.useMemo(() => {
				const text = query.trim().toLowerCase();
				return (state?.articles ?? []).filter((article) => {
					if (category !== "" && article.category !== category) return false;
					if (text === "") return true;
					return article.title.toLowerCase().includes(text) || article.excerpt.toLowerCase().includes(text) || article.category.toLowerCase().includes(text);
				});
			}, [
				state,
				category,
				query
			]);
			const openArticle = react.useCallback((id) => {
				setView({
					kind: "article",
					id
				});
				setState((current) => current === null ? current : {
					...current,
					articles: current.articles.map((article) => article.id === id ? {
						...article,
						read: true
					} : article)
				});
				markRead(id).then(() => {
					notifyUnreadChanged();
				});
			}, []);
			/**
			* Return the reading view to its first line.
			*
			* The scroller is the one the article is drawn in, so this is a scroll of the
			* page's own region — not of the window — and it keeps the article view mounted
			* (the reader's place in the list is preserved by the page's own state).
			*/
			const scrollToTop = react.useCallback(() => {
				const scroll = scrollRef.current;
				if (scroll === null) return;
				const reduce = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
				scroll.scrollTo({
					top: 0,
					behavior: reduce ? "auto" : "smooth"
				});
			}, []);
			/**
			* Delete the article the confirmation names.
			*
			* The card leaves the list only after the Host answers, so a refused delete
			* keeps the article and its confirmation on screen with the reason.
			*/
			const confirmDelete = async () => {
				const target = pendingDelete;
				if (target === null || deleteBusy) return;
				setDeleteBusy(true);
				setDeleteError(null);
				const answer = await deleteArticle(target.id);
				setDeleteBusy(false);
				if (answer.ok !== true) {
					setDeleteError(answer.error);
					return;
				}
				setPendingDelete(null);
				setState((current) => current === null ? current : {
					...current,
					articles: current.articles.filter((article) => article.id !== target.id)
				});
				notifyUnreadChanged();
			};
			const generate = async () => {
				if (generating || busy) return;
				setBusy(true);
				const answer = await startGeneration();
				setBusy(false);
				if (answer.ok !== true) {
					setLoadError(answer.error);
					return;
				}
				setState((current) => current === null ? current : {
					...current,
					generating: true,
					lastError: null
				});
				refresh();
			};
			const onSaved = (settings) => {
				setSettingsOpen(false);
				setState((current) => current === null ? current : {
					...current,
					settings
				});
			};
			const reading = view.kind === "article";
			const status = loadError !== null ? `${t("state.error")}${loadError === "" ? "" : ` (${loadError})`}` : state?.lastError ?? null;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
				className: "dsh-cd-page",
				"aria-labelledby": reading ? void 0 : "dsh-cd-title",
				children: [
					reading ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "dsh-cd-content dsh-cd-content-head",
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("header", {
								className: "dsh-cd-head",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "dsh-cd-head-copy",
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h1", {
										id: "dsh-cd-title",
										className: "dsh-cd-title",
										tabIndex: -1,
										children: t("panel")
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
										className: "dsh-cd-description",
										children: t("page.description")
									})]
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "dsh-cd-actions",
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
										type: "button",
										className: "dsh-cd-btn",
										onClick: () => {
											setSettingsOpen(true);
										},
										disabled: state === null,
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(SettingsIcon, { size: 15 }), t("settings.action")]
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
										type: "button",
										className: "dsh-cd-btn dsh-cd-btn-primary",
										onClick: () => {
											generate();
										},
										disabled: generating || busy || state === null,
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(SparkleIcon, {
											size: 15,
											className: generating ? "dsh-cd-spin" : void 0
										}), generating ? t("generate.running") : t("generate.action")]
									})]
								})]
							}),
							status !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "dsh-cd-banner dsh-cd-banner-error",
								role: "alert",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: status }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: "dsh-cd-link",
									onClick: () => {
										loadError === null ? generate() : refresh();
									},
									children: t("state.retry")
								})]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "dsh-cd-toolbar",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
									className: "dsh-cd-search",
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(SearchIcon, {
										size: 15,
										className: "dsh-cd-search-icon"
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
										type: "search",
										value: query,
										onChange: (event) => {
											setQuery(event.target.value);
										},
										placeholder: t("search.placeholder"),
										"aria-label": t("search.placeholder")
									})]
								}), categories.length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "dsh-cd-badges",
									role: "group",
									"aria-label": t("categories.label"),
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Pill, {
										active: category === "",
										"aria-pressed": category === "",
										onClick: () => {
											setCategory("");
										},
										children: t("categories.all")
									}), categories.map((name) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Pill, {
										active: category === name,
										"aria-pressed": category === name,
										onClick: () => {
											setCategory(category === name ? "" : name);
										},
										children: name
									}, name))]
								})]
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "dsh-cd-scroll-wrap",
						ref: scrollWrapRef,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: "dsh-cd-scroll",
							ref: scrollRef,
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: "dsh-cd-content",
								children: reading ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ArticleView, {
									t,
									id: view.id,
									onBack: () => {
										setView({ kind: "list" });
									}
								}) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
									state === null && loadError === null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
										className: "dsh-cd-state",
										children: t("state.loading")
									}),
									state !== null && articles.length === 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: "dsh-cd-empty",
										children: [
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												className: "dsh-cd-empty-icon",
												children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(DocIcon, { size: 24 })
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
												className: "dsh-cd-empty-title",
												children: state.articles.length === 0 ? t("list.emptyTitle") : t("list.noMatchTitle")
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
												className: "dsh-cd-empty-hint",
												children: state.articles.length === 0 ? t("list.emptyHint") : t("list.noMatchHint")
											})
										]
									}),
									articles.length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: "dsh-cd-list",
										children: articles.map((article) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ArticleCard, {
											article,
											t,
											onOpen: () => {
												openArticle(article.id);
											},
											onDelete: () => {
												setDeleteError(null);
												setPendingDelete(article);
											}
										}, article.id))
									})
								] })
							})
						}), reading && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: "dsh-cd-totop",
							onClick: scrollToTop,
							"aria-label": t("article.top"),
							title: t("article.top"),
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ArrowUpIcon, { size: 16 })
						})]
					}),
					pendingDelete !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(DeleteDialog, {
						t,
						title: pendingDelete.title,
						busy: deleteBusy,
						error: deleteError,
						onCancel: () => {
							setPendingDelete(null);
						},
						onConfirm: () => {
							confirmDelete();
						}
					}),
					settingsOpen && state !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SettingsDialog, {
						t,
						settings: state.settings,
						onClose: () => {
							setSettingsOpen(false);
						},
						onSaved
					})
				]
			});
		}
		// src/client/panel-icon.tsx
		/**
		* The sidebar row's glyph, plus the unread mark that rides with it.
		*
		* The shell owns the row — the button, the label, the tooltip, and the hover and
		* selected fills — and hands this slot a `size` and the active flag inside a
		* fixed 16px glyph box. It renders the label itself and offers no seat beside it,
		* so the mark is measured into place: it stays a child of this slot (absolutely
		* positioned against the glyph's own box) and is laid out against the row's own
		* box — pinned to the row's right edge, centred on its height, clear of the text
		* with room to spare. When the row is too narrow for both, the mark steps aside
		* rather than covering the name.
		*
		* Collapsed to the icon rail there is no label and no width to spend on a word,
		* so the mark falls back to a dot on the glyph's top-right corner: with the text
		* gone, the icon is the only place left to say "there is something new here".
		*
		* The mark is decorative: the row's label is the accessible name (the shell wraps
		* this slot in `aria-hidden`), and the article list, not this mark, is where
		* unread state is actually acted on.
		*/
		/** Minimum gap kept between the end of the label and the mark, in px. */
		const LABEL_CLEARANCE = 8;
		/**
		* Find the label the shell draws beside this glyph.
		*
		* The shell's class names are hashed, so the label is recognised structurally:
		* the row is a button, and the label is the one child of it that carries text and
		* does not contain the glyph. `null` means the row is collapsed to the rail, where
		* the label is not rendered at all.
		*
		* @param glyph - this slot's element, already in the document.
		* @returns the label element, or null when there is none.
		*/
		function labelOf(glyph) {
			const button = glyph.closest("button");
			if (button === null) return null;
			for (const child of Array.from(button.children)) {
				if (child === glyph || child.contains(glyph)) continue;
				if ((child.textContent ?? "").trim() !== "") return child;
			}
			return null;
		}
		/**
		* Render the entry's document glyph, marked while anything is unread.
		*
		* @param props - the glyph size the shell asks for and the locale seat.
		* @returns the glyph, plus the "New" mark (or the rail's dot) while unread.
		*/
		function DailyPanelIcon({ size, t }) {
			const unread = useUnreadCount();
			const glyphRef = react.useRef(null);
			react.useLayoutEffect(() => {
				const glyph = glyphRef.current;
				const mark = glyph?.querySelector(".dsh-cd-mark") ?? null;
				const dot = glyph?.querySelector(".dsh-cd-mark-dot") ?? null;
				if (glyph === null || mark === null || dot === null) return;
				const observer = typeof ResizeObserver === "undefined" ? void 0 : new ResizeObserver(() => {
					place();
				});
				const watched = /* @__PURE__ */ new WeakSet();
				const watch = (target) => {
					if (target === null || watched.has(target)) return;
					watched.add(target);
					observer?.observe(target);
				};
				const place = () => {
					const row = glyph.closest("button");
					if (row === null) return;
					const box = glyph.getBoundingClientRect();
					const rowBox = row.getBoundingClientRect();
					const label = labelOf(glyph);
					watch(label);
					if (label === null) {
						mark.style.display = "none";
						dot.style.display = "block";
						dot.style.left = `${Math.round(box.width - 5)}px`;
						dot.style.top = "-2px";
						dot.style.visibility = "visible";
						return;
					}
					dot.style.display = "none";
					dot.style.visibility = "hidden";
					mark.style.display = "inline-flex";
					const width = mark.offsetWidth;
					const height = mark.offsetHeight;
					const paddingRight = Number.parseFloat(getComputedStyle(row).paddingRight) || 0;
					const contentRight = rowBox.right - paddingRight;
					if (contentRight - label.getBoundingClientRect().right < width + LABEL_CLEARANCE) {
						mark.style.visibility = "hidden";
						return;
					}
					mark.style.left = `${Math.round(contentRight - box.left - width)}px`;
					mark.style.top = `${Math.round(rowBox.top + (rowBox.height - height) / 2 - box.top)}px`;
					mark.style.visibility = "visible";
				};
				watch(glyph.closest("button"));
				place();
				return () => {
					observer?.disconnect();
				};
			}, [unread, size]);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
				className: "dsh-cd-glyph",
				ref: glyphRef,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(DocIcon, { size }), unread > 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					className: "dsh-cd-mark",
					"aria-hidden": "true",
					children: t("card.new")
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					className: "dsh-cd-mark-dot",
					"aria-hidden": "true"
				})] }) : null]
			});
		}
		// src/client/locales.ts
		/**
		* The copy of the sidebar entry, the Daily Post page, and its settings dialog,
		* in the two locales DSH ships.
		*
		* The two dictionaries must carry exactly the same keys: `zh` is typed as
		* `typeof en`, so a key added to one and forgotten in the other is a compile
		* error rather than a page that falls back mid-sentence.
		*/
		/** The dictionary namespace this plugin owns. */
		const NS = "coolDaily";
		/** The English copy, which is also the fallback every lookup ends at. */
		const en = {
			"panel": "Daily Post",
			"page.description": "Articles written for you every day from your own prompt.",
			"search.placeholder": "Search titles or content",
			"categories.all": "All",
			"categories.label": "Categories",
			"categories.unknown": "Uncategorized",
			"generate.action": "Write another",
			"generate.running": "Writing…",
			"settings.action": "Settings",
			"settings.title": "Daily Post settings",
			"settings.description": "Tell the model what to write, how much, and when.",
			"settings.model": "Model",
			"settings.modelUnknown": "No default model",
			"settings.modelSearch": "Search models",
			"settings.effort": "Reasoning effort",
			"settings.effortReadFailed": "Could not read levels",
			"settings.loading": "Loading…",
			"settings.modelStale": "Saved model (no longer listed)",
			"settings.searchEmpty": "No matching models",
			"settings.prompt": "Prompt",
			"settings.promptHint": "Describe the topics, angle, or style you want to read.",
			"settings.count": "Articles per generation",
			"settings.days": "Repeat days",
			"settings.cancel": "Cancel",
			"settings.close": "Close",
			"settings.save": "Save",
			"settings.saving": "Saving…",
			"settings.failed": "Could not save settings",
			"card.new": "New",
			"card.delete": "Delete",
			"tags.label": "Tags",
			"delete.title": "Delete article",
			"delete.description": "Deleting “{name}” cannot be undone.",
			"delete.cancel": "Cancel",
			"delete.confirm": "Delete",
			"delete.deleting": "Deleting…",
			"list.emptyTitle": "No daily posts yet",
			"list.emptyHint": "Generated articles will appear here.",
			"list.noMatchTitle": "No matching articles",
			"list.noMatchHint": "Try another search or category.",
			"article.back": "Back to list",
			"article.top": "Back to top",
			"article.loading": "Loading article…",
			"article.missing": "This article no longer exists",
			"article.retry": "Retry",
			"state.loading": "Loading daily posts…",
			"state.error": "The plugin Host half did not answer. Restart DSH and try again.",
			"state.retry": "Retry",
			"weekday.0": "Sun",
			"weekday.1": "Mon",
			"weekday.2": "Tue",
			"weekday.3": "Wed",
			"weekday.4": "Thu",
			"weekday.5": "Fri",
			"weekday.6": "Sat"
		};
		/** The Chinese copy, key for key the same page. */
		const zh = {
			"panel": "每日贴",
			"page.description": "根据你的提示词，每天为你生成值得阅读的文章。",
			"search.placeholder": "搜索标题或内容",
			"categories.all": "全部",
			"categories.label": "分类",
			"categories.unknown": "未分类",
			"generate.action": "再来一篇",
			"generate.running": "正在生成…",
			"settings.action": "设置",
			"settings.title": "每日贴设置",
			"settings.description": "告诉 AI 写什么、写多少，以及什么时候写。",
			"settings.model": "模型",
			"settings.modelUnknown": "尚未配置默认模型",
			"settings.modelSearch": "搜索模型",
			"settings.effort": "思考强度",
			"settings.effortReadFailed": "读取强度失败",
			"settings.loading": "加载中…",
			"settings.modelStale": "已保存的模型（当前列表中没有）",
			"settings.searchEmpty": "没有匹配的模型",
			"settings.prompt": "提示词",
			"settings.promptHint": "描述你想读的主题、角度或写作风格。",
			"settings.count": "每次生成数量",
			"settings.days": "重复生成的日期",
			"settings.cancel": "取消",
			"settings.close": "关闭",
			"settings.save": "保存",
			"settings.saving": "保存中…",
			"settings.failed": "设置保存失败",
			"card.new": "New",
			"card.delete": "删除",
			"tags.label": "标签",
			"delete.title": "删除文章",
			"delete.description": "删除《{name}》后将无法恢复。",
			"delete.cancel": "取消",
			"delete.confirm": "删除",
			"delete.deleting": "删除中…",
			"list.emptyTitle": "还没有每日贴",
			"list.emptyHint": "生成后的每日贴会显示在这里。",
			"list.noMatchTitle": "没有匹配的文章",
			"list.noMatchHint": "换个关键词或分类试试。",
			"article.back": "返回列表",
			"article.top": "回到顶部",
			"article.loading": "正在读取文章…",
			"article.missing": "这篇文章已不存在",
			"article.retry": "重试",
			"state.loading": "正在载入每日贴…",
			"state.error": "插件 Host 端没有响应，请重启 DSH 后重试。",
			"state.retry": "重试",
			"weekday.0": "日",
			"weekday.1": "一",
			"weekday.2": "二",
			"weekday.3": "三",
			"weekday.4": "四",
			"weekday.5": "五",
			"weekday.6": "六"
		};
		// src/client/styles.ts
		/** CSS rules, one selector per line. */
		const PLUGIN_CSS = [
			".dsh-cd-glyph{position:relative;display:inline-flex;align-items:center;justify-content:center}",
			".dsh-cd-mark{position:absolute;left:0;top:0;display:inline-flex;align-items:center;height:19px;padding:0 7px;border-radius:999px;background:color-mix(in srgb,var(--dsw-alias-state-success-primary) 14%,transparent);color:var(--dsw-alias-state-success-primary);font-size:11px;font-weight:500;line-height:1;white-space:nowrap;visibility:hidden;pointer-events:none;z-index:1}",
			".dsh-cd-mark-dot{position:absolute;left:0;top:0;display:none;width:7px;height:7px;border-radius:50%;background:var(--dsw-alias-state-success-primary);visibility:hidden;pointer-events:none;z-index:1}",
			".dsh-cd-page{display:flex;flex-direction:column;width:100%;height:100%;min-width:0;min-height:0;overflow:hidden;background:transparent;color:var(--dsw-alias-label-primary);font-size:14px;line-height:1.6}",
			".dsh-cd-scroll-wrap{position:relative;display:flex;flex:1;flex-direction:column;min-height:0}",
			".dsh-cd-scroll{flex:1;min-height:0;overflow:auto;scrollbar-gutter:stable both-edges;--dsh-scrollbar-width:9px;--dsh-scrollbar-thumb-border:2px;--dsh-cd-fade:linear-gradient(#000,#000);mask-image:var(--dsh-cd-fade),linear-gradient(#000,#000);mask-repeat:no-repeat;mask-position:0 0,100% 0;mask-size:calc(100% - var(--dsh-cd-fade-right,0px)) 100%,var(--dsh-cd-fade-right,0px) 100%}",
			"[data-fade-top] .dsh-cd-scroll{--dsh-cd-fade:linear-gradient(to bottom,#0000,#000 28px)}",
			"[data-fade-bottom] .dsh-cd-scroll{--dsh-cd-fade:linear-gradient(to top,#0000,#000 28px)}",
			"[data-fade-top][data-fade-bottom] .dsh-cd-scroll{--dsh-cd-fade:linear-gradient(to bottom,#0000,#000 28px,#000 calc(100% - 28px),#0000)}",
			".dsh-cd-content{box-sizing:border-box;width:100%;max-width:860px;margin:0 auto;padding:0 clamp(20px,5vw,48px) 64px}",
			".dsh-cd-content-head{flex:none;padding-bottom:0}",
			".dsh-cd-head{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;padding-top:32px;margin-bottom:20px}",
			"[data-platform='darwin'] .dsh-cd-head{padding-top:calc(32px + var(--dsh-frame-top-clearance,0px))}",
			".dsh-cd-head-copy{min-width:0}",
			".dsh-cd-title{margin:0;font-size:28px;line-height:1.3;font-weight:600;letter-spacing:-.01em}",
			".dsh-cd-title:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:3px;border-radius:4px}",
			".dsh-cd-description{margin:8px 0 0;color:var(--dsw-alias-label-secondary);font-size:13px;line-height:20px}",
			".dsh-cd-actions{display:flex;flex:0 0 auto;align-items:center;gap:8px}",
			".dsh-cd-btn{display:inline-flex;align-items:center;justify-content:center;gap:7px;box-sizing:border-box;height:34px;padding:0 14px;border:.5px solid var(--dsw-alias-border-l3);border-radius:9px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font:inherit;font-size:13px;line-height:1;white-space:nowrap;cursor:pointer;transition:background-color .15s ease,border-color .15s ease,opacity .15s ease}",
			".dsh-cd-btn:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover);border-color:var(--dsw-alias-border-l4)}",
			".dsh-cd-btn:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}",
			".dsh-cd-btn:disabled{opacity:.55;cursor:default}",
			".dsh-cd-btn-primary{border-color:transparent;background:var(--dsw-alias-brand-primary);color:var(--dsw-alias-label-primary-foreground)}",
			".dsh-cd-btn-primary:hover:not(:disabled){background:var(--dsw-alias-button-primary-hover,var(--dsw-alias-brand-primary));border-color:transparent;filter:brightness(.97)}",
			".dsh-cd-btn-primary:disabled{opacity:.6}",
			".dsh-cd-banner{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:0 0 14px;padding:9px 12px;border:.5px solid var(--dsw-alias-border-l2);border-radius:10px;background:color-mix(in srgb,var(--dsw-alias-bg-layer-1) 78%,transparent);color:var(--dsw-alias-label-secondary);font-size:12.5px;line-height:18px}",
			".dsh-cd-banner-error{border-color:color-mix(in srgb,var(--dsw-alias-state-error-primary) 35%,transparent);color:var(--dsw-alias-state-error-primary);background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 8%,transparent)}",
			".dsh-cd-link{padding:0;border:none;background:none;color:var(--dsw-alias-brand-primary);font:inherit;font-size:12.5px;white-space:nowrap;cursor:pointer;text-decoration:underline;text-underline-offset:2px}",
			".dsh-cd-link:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px;border-radius:3px}",
			".dsh-cd-toolbar{display:flex;flex-direction:column;align-items:stretch;gap:10px;margin-bottom:18px}",
			".dsh-cd-search{position:relative;display:flex;flex:0 0 auto;align-items:center;width:100%;min-width:0}",
			".dsh-cd-search-icon{position:absolute;left:11px;color:var(--dsw-alias-label-secondary);pointer-events:none}",
			".dsh-cd-search input{box-sizing:border-box;width:100%;height:38px;padding:0 12px 0 33px;border:.5px solid var(--dsw-alias-border-l3);border-radius:9px;background:color-mix(in srgb,var(--dsw-alias-bg-layer-1) 82%,transparent);color:var(--dsw-alias-label-primary);font:inherit;font-size:13px;line-height:1;appearance:none}",
			".dsh-cd-search input::placeholder{color:var(--dsw-alias-label-secondary)}",
			".dsh-cd-search input:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}",
			".dsh-cd-badges{display:flex;flex-wrap:wrap;align-items:center;gap:6px;padding-left:1px}",
			".dsh-cd-list{display:flex;flex-direction:column;gap:10px;padding-top:8px}",
			".dsh-cd-card{display:flex;flex-direction:column;align-items:stretch;gap:7px;box-sizing:border-box;width:100%;padding:16px 18px;border:.5px solid var(--dsw-alias-border-l2);border-radius:12px;background:color-mix(in srgb,var(--dsw-alias-bg-layer-1) 82%,transparent);color:var(--dsw-alias-label-primary);font:inherit;text-align:left;cursor:pointer;transition:border-color .15s ease,box-shadow .15s ease}",
			".dsh-cd-card:hover{border-color:var(--dsw-alias-brand-primary);box-shadow:0 0 0 .5px var(--dsw-alias-brand-primary)}",
			".dsh-cd-card:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}",
			".dsh-cd-card-foot{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px 12px;margin-top:2px}",
			".dsh-cd-card-tags{display:flex;flex-wrap:wrap;align-items:center;gap:6px;min-width:0}",
			".dsh-cd-card-meta{display:inline-flex;flex:none;align-items:center;gap:8px;margin-left:auto;color:var(--dsw-alias-label-secondary);font-size:11.5px;line-height:17px;font-variant-numeric:tabular-nums}",
			".dsh-cd-delete{padding:0;border:0;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:11.5px;line-height:17px;cursor:pointer}",
			".dsh-cd-delete:hover{color:var(--dsw-alias-state-error-primary)}",
			".dsh-cd-delete:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px;border-radius:2px}",
			".dsh-cd-card-head{display:flex;align-items:flex-start;gap:10px}",
			".dsh-cd-new{flex:none;display:inline-flex;align-items:center;height:20px;margin-top:1px;padding:0 8px;border-radius:999px;background:color-mix(in srgb,var(--dsw-alias-state-success-primary) 14%,transparent);color:var(--dsw-alias-state-success-primary);font-size:11px;font-weight:500;line-height:1;white-space:nowrap}",
			".dsh-cd-date{color:var(--dsw-alias-label-secondary);font-size:11.5px;font-variant-numeric:tabular-nums}",
			".dsh-cd-card-title{flex:1;min-width:0;font-size:15px;line-height:1.5;font-weight:600;overflow-wrap:anywhere}",
			".dsh-cd-card-excerpt{display:-webkit-box;overflow:hidden;color:var(--dsw-alias-label-secondary);font-size:12.5px;line-height:1.7;-webkit-box-orient:vertical;-webkit-line-clamp:2}",
			".dsh-cd-empty{display:flex;flex-direction:column;align-items:center;gap:4px;padding:56px 24px;border:.5px solid var(--dsw-alias-border-l2);border-radius:12px;background:color-mix(in srgb,var(--dsw-alias-bg-layer-1) 62%,transparent);text-align:center}",
			".dsh-cd-empty-icon{display:inline-flex;align-items:center;justify-content:center;width:48px;height:48px;margin-bottom:8px;border-radius:12px;background:color-mix(in srgb,var(--dsw-alias-bg-layer-2) 80%,transparent);color:var(--dsw-alias-label-secondary)}",
			".dsh-cd-empty-title{margin:0;font-size:14px;font-weight:500}",
			".dsh-cd-empty-hint{margin:0;color:var(--dsw-alias-label-secondary);font-size:12.5px;line-height:19px}",
			".dsh-cd-state{display:flex;flex-direction:column;align-items:center;gap:12px;padding:48px 16px;color:var(--dsw-alias-label-secondary);font-size:13px;text-align:center}",
			".dsh-cd-article{padding-top:32px}",
			"[data-platform='darwin'] .dsh-cd-article{padding-top:calc(32px + var(--dsh-frame-top-clearance,0px))}",
			".dsh-cd-back{display:inline-flex;align-items:center;justify-content:center;box-sizing:border-box;width:32px;height:32px;padding:0;border:0;border-radius:50%;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);cursor:pointer;transition:background-color .15s ease}",
			".dsh-cd-back:hover{background:var(--dsw-alias-bg-layer-3)}",
			".dsh-cd-back:active{background:var(--dsw-alias-interactive-bg-active)}",
			".dsh-cd-back:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}",
			".dsh-cd-totop{position:absolute;right:max(24px,calc((100% - 860px) / 2 - 44px));bottom:24px;z-index:2;display:inline-flex;align-items:center;justify-content:center;box-sizing:border-box;width:36px;height:36px;padding:0;border:0;border-radius:50%;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);box-shadow:var(--dsw-shadow-lv2);cursor:pointer;opacity:0;visibility:hidden;pointer-events:none;transform:translateY(4px);transition:opacity .15s ease,transform .15s ease,visibility .15s ease,background-color .15s ease}",
			"[data-can-top] .dsh-cd-totop{opacity:1;visibility:visible;pointer-events:auto;transform:none}",
			".dsh-cd-totop:hover{background:var(--dsw-alias-bg-layer-3)}",
			".dsh-cd-totop:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}",
			".dsh-cd-article-head{margin:18px 0 22px;padding-bottom:18px;border-bottom:.5px solid var(--dsw-alias-border-l2)}",
			".dsh-cd-article-title{margin:0;font-size:25px;line-height:1.4;font-weight:600;letter-spacing:-.01em}",
			".dsh-cd-article-meta{display:flex;align-items:center;gap:10px;margin-top:12px;color:var(--dsw-alias-label-secondary);font-size:12px}",
			".dsh-cd-article-tags{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin-top:10px}",
			".dsh-cd-md{max-width:760px;font-size:14px;line-height:1.85;overflow-wrap:anywhere}",
			".dsh-cd-md h1,.dsh-cd-md h2,.dsh-cd-md h3,.dsh-cd-md h4{margin:26px 0 10px;line-height:1.45;font-weight:600}",
			".dsh-cd-md h1{font-size:22px}",
			".dsh-cd-md h2{font-size:18px}",
			".dsh-cd-md h3{font-size:15.5px}",
			".dsh-cd-md h4{font-size:14px}",
			".dsh-cd-md p{margin:0 0 14px}",
			".dsh-cd-md ul,.dsh-cd-md ol{margin:0 0 14px;padding-left:22px}",
			".dsh-cd-md li{margin:4px 0}",
			".dsh-cd-md blockquote{margin:0 0 14px;padding:6px 14px;border-left:3px solid var(--dsw-alias-border-l3);background:color-mix(in srgb,var(--dsw-alias-bg-layer-1) 60%,transparent);color:var(--dsw-alias-label-secondary)}",
			".dsh-cd-md blockquote p:last-child{margin-bottom:0}",
			".dsh-cd-md code{padding:1px 5px;border-radius:4px;background:color-mix(in srgb,var(--dsw-alias-bg-layer-2) 85%,transparent);font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:12.5px}",
			".dsh-cd-md pre{margin:0 0 16px;padding:12px 14px;overflow:auto;border:.5px solid var(--dsw-alias-border-l1);border-radius:10px;background:color-mix(in srgb,var(--dsw-alias-bg-layer-1) 85%,transparent)}",
			".dsh-cd-md pre code{padding:0;border-radius:0;background:none;font-size:12.5px;line-height:1.7}",
			".dsh-cd-md a{color:var(--dsw-alias-brand-primary);text-decoration:underline;text-underline-offset:2px}",
			".dsh-cd-md hr{margin:26px 0;border:none;border-top:.5px solid var(--dsw-alias-border-l2)}",
			".dsh-cd-md strong{font-weight:600}",
			".dsh-cd-field{display:flex;flex-direction:column;gap:6px;margin-top:18px}",
			".dsh-cd-field:first-child{margin-top:0}",
			".dsh-cd-dialog-wide.dsh-cd-dialog-wide{width:min(570px,100%)}",
			".dsh-cd-dialog-scroll{max-height:min(52vh,470px);overflow:auto;margin:0 -24px;padding:0 24px;scrollbar-gutter:stable}",
			".dsh-cd-field-label{display:block;font-size:13px;font-weight:500;line-height:1.5}",
			".dsh-cd-textarea{box-sizing:border-box;width:100%;min-height:124px;padding:10px 12px;border:.5px solid var(--dsw-alias-border-l4);border-radius:var(--dsw-radius-md);background:var(--dsw-alias-bg-layer-3);color:var(--dsw-alias-label-primary);font:inherit;font-size:13px;line-height:1.6;resize:vertical}",
			".dsh-cd-textarea:focus-visible{outline:none;border-color:var(--dsw-alias-brand-primary)}",
			".dsh-cd-count{margin-top:6px}",
			".dsh-cd-picker{display:flex;flex-direction:column;min-width:0}",
			".dsh-cd-picker-trigger{display:flex;align-items:center;justify-content:space-between;gap:8px;box-sizing:border-box;width:100%;height:36px;padding:0 10px;border:.5px solid var(--dsw-alias-border-l4);border-radius:var(--dsw-radius-sm,6px);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);font:inherit;font-size:12.5px;line-height:34px;text-align:left;cursor:pointer}",
			".dsh-cd-picker-trigger:hover:not(:disabled){border-color:var(--dsw-alias-border-l3)}",
			".dsh-cd-picker-trigger:focus-visible{outline:none;border-color:var(--dsw-alias-state-business-primary)}",
			".dsh-cd-picker-trigger:disabled{opacity:.6;cursor:default}",
			".dsh-cd-picker-value{flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
			".dsh-cd-picker-chevron{flex:none;display:inline-flex;align-items:center;justify-content:center;color:var(--dsw-alias-label-tertiary)}",
			".dsh-cd-picker-chevron svg{display:block;width:14px;height:14px;transform:rotate(90deg);transition:transform .12s ease}",
			".dsh-cd-picker-chevron[data-open=true] svg{transform:rotate(-90deg)}",
			".dsh-cd-picker-popover{position:fixed;box-sizing:border-box;display:flex;flex-direction:column;border:.5px solid var(--dsw-alias-border-l4);border-radius:var(--dsw-radius-sm,6px);background:var(--dsw-alias-bg-module-platform);box-shadow:var(--dsw-shadow-lv3,0 12px 32px rgba(0,0,0,.18));overflow:hidden}",
			".dsh-cd-picker-search{flex:none;display:flex;align-items:center;height:40px;padding:0 12px;border-bottom:.5px solid var(--dsw-alias-border-l4)}",
			".dsh-cd-picker-input{box-sizing:border-box;width:100%;height:100%;padding:0;border:0;outline:none;background:transparent;color:var(--dsw-alias-label-primary);font:inherit;font-size:12.5px}",
			".dsh-cd-picker-input::placeholder{color:var(--dsw-alias-label-tertiary)}",
			".dsh-cd-picker-listwrap{position:relative;flex:1 1 auto;min-height:0}",
			".dsh-cd-picker-list{height:100%;overflow-y:auto;scrollbar-width:none}",
			".dsh-cd-picker-list::-webkit-scrollbar{display:none}",
			".dsh-cd-picker-thumb{position:absolute;right:2px;z-index:2;width:5px;border-radius:999px;background:var(--dsw-alias-scrollbar-bg-l2);pointer-events:none}",
			".dsh-cd-picker-row{display:flex;align-items:center;gap:2px;min-width:0}",
			".dsh-cd-picker-row:hover{background:var(--dsw-alias-interactive-bg-hover)}",
			".dsh-cd-picker-row[data-selected=true]{background:var(--dsw-alias-interactive-bg-active)}",
			".dsh-cd-picker-row-name{display:flex;align-items:center;gap:6px;flex:1 1 auto;min-width:0;padding:7px 4px 7px 8px;border:0;border-radius:var(--dsw-radius-xs,4px);background:transparent;color:var(--dsw-alias-label-primary);font:inherit;font-size:12.5px;line-height:20px;text-align:left;cursor:pointer}",
			".dsh-cd-picker-row-text{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
			".dsh-cd-picker-row-hint{flex:none;min-width:0;overflow:hidden;color:var(--dsw-alias-label-tertiary);font-size:11.5px;text-overflow:ellipsis;white-space:nowrap}",
			".dsh-cd-picker-row-check{flex:none;display:inline-flex;color:var(--dsw-alias-state-business-primary)}",
			".dsh-cd-picker-row-check svg{display:block;width:12px;height:12px}",
			".dsh-cd-picker-row-effort{align-self:stretch;flex:none;display:inline-flex;align-items:center;gap:4px;padding:0 10px 0 8px;border:0;background:transparent;color:var(--dsw-alias-label-tertiary);font:inherit;font-size:12px;cursor:pointer}",
			"button.dsh-cd-picker-row-effort:hover{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-interactive-bg-hover)}",
			".dsh-cd-picker-row-arrow{display:inline-flex;align-items:center;justify-content:center}",
			".dsh-cd-picker-row-arrow svg{display:block;width:12px;height:12px;transform:rotate(90deg)}",
			".dsh-cd-picker-effort-control{align-self:stretch}",
			".dsh-cd-picker-group-sticky{position:sticky;top:0;z-index:1}",
			".dsh-cd-picker-group-head{display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;padding:7px 10px 7px 8px;border:0;background:var(--dsw-alias-bg-overlay);color:var(--dsw-alias-label-primary);font:inherit;font-size:12px;font-weight:600;line-height:20px;text-align:left;cursor:pointer}",
			".dsh-cd-picker-group-arrow{flex:none;display:inline-flex;align-items:center;justify-content:center;color:var(--dsw-alias-label-tertiary)}",
			".dsh-cd-picker-group-arrow svg{display:block;width:12px;height:12px;transform:rotate(0);transition:transform .12s ease}",
			".dsh-cd-picker-group-arrow[data-open=true] svg{transform:rotate(90deg)}",
			".dsh-cd-picker-group-name{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
			".dsh-cd-picker-row-name:focus-visible,.dsh-cd-picker-row-effort:focus-visible,.dsh-cd-picker-group-head:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:-2px}",
			".dsh-cd-picker-rule{margin:6px 4px;border-top:.5px solid var(--dsw-alias-border-l3)}",
			".dsh-cd-picker-empty{margin:8px 8px 10px;color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px}",
			".dsh-cd-days{display:flex;flex-wrap:wrap;gap:6px}",
			".dsh-cd-day{width:36px;height:36px;padding:0;border:.5px solid var(--dsw-alias-border-l3);border-radius:var(--dsw-radius-md);background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:13px;cursor:pointer}",
			".dsh-cd-day:hover{border-color:var(--dsw-alias-border-l4);color:var(--dsw-alias-label-primary)}",
			".dsh-cd-day:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}",
			".dsh-cd-day-active{border-color:transparent;background:var(--dsw-alias-brand-primary);color:var(--dsw-alias-label-primary-foreground)}",
			".dsh-cd-day-active:hover{border-color:transparent;color:var(--dsw-alias-label-primary-foreground)}",
			".dsh-cd-hint{color:var(--dsw-alias-label-secondary);font-size:12px;line-height:1.5}",
			".dsh-cd-dialog-narrow.dsh-cd-dialog-narrow{width:min(380px,100%)}",
			".dsh-cd-btn-danger.dsh-cd-btn-danger{background:var(--dsw-alias-state-error-primary);color:var(--dsw-alias-label-primary-foreground)}",
			".dsh-cd-btn-danger.dsh-cd-btn-danger:hover:not(:disabled){background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 86%,#000)}",
			".dsh-cd-dialog-error{margin:16px 0 0;padding:8px 10px;border:.5px solid color-mix(in srgb,var(--dsw-alias-state-error-primary) 35%,transparent);border-radius:8px;background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 8%,transparent);color:var(--dsw-alias-state-error-primary);font-size:12px;line-height:18px}",
			"@keyframes dsh-cd-spin{to{transform:rotate(360deg)}}",
			".dsh-cd-spin{animation:dsh-cd-spin 1.1s linear infinite}",
			"@media (max-width:720px){.dsh-cd-head{flex-direction:column;align-items:stretch;gap:14px}.dsh-cd-actions{justify-content:flex-end}}"
		].join("");
		/**
		* Mount the page's stylesheet for the plugin's lifetime.
		* @returns the disposer that removes the style element.
		*/
		function insertStyles() {
			const element = document.createElement("style");
			element.setAttribute("data-plugin", "dsh-cool-daily");
			element.setAttribute("data-dsh-cool-daily", "styles");
			element.textContent = PLUGIN_CSS;
			document.head.appendChild(element);
			return () => {
				element.remove();
			};
		}
		// src/client/index.ts
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
		const name = "dsh-cool-daily/client";
		/**
		* The locale service is a required collaborator: the row and the page are worded
		* entirely from this package's dictionaries, so a composition without the
		* service could only draw the wrong language. Declaring the dependency also
		* keeps this plugin from applying before the service it reads exists.
		*/
		const inject = ["slots", "locale"];
		/**
		* The panel id shared by the sidebar row and the main panel.
		*
		* It is fresh rather than the id of a shipped panel, so the row is added beside
		* Plugins and Automated Tasks instead of replacing either of them.
		*/
		const PANEL_ID = "daily";
		function apply(ctx) {
			const slots = ctx.get("slots");
			if (slots === void 0) return;
			const locale = ctx.get("locale");
			ctx.effect(() => insertStyles(), "dsh-cool-daily: styles");
			ctx.effect(() => locale.register(NS, {
				zh,
				en
			}), "dsh-cool-daily: dictionaries");
			const t = locale.bind(NS);
			slots.inject("main", () => slots.register({
				name: "main",
				key: PANEL_ID,
				locale: NS
			}, DailyPage));
			slots.inject("sidebar.panellist", () => slots.register({
				name: "sidebar.panellist",
				id: PANEL_ID,
				order: 20,
				locale: NS,
				label: () => t("panel")
			}, DailyPanelIcon));
		}
		exports.apply = apply;
		exports.inject = inject;
		exports.name = name;
		return module.exports;
	}
});
