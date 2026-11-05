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
		// src/shared/contract.ts
		/** Every route below this prefix is owned by this plugin. */
		const API_PREFIX = "/dsh-cool-daily/api";
		/** Route paths, kept in one place so both halves address the same surface. */
		const API_PATHS = {
			state: `${API_PREFIX}/state`,
			settings: `${API_PREFIX}/settings`,
			generate: `${API_PREFIX}/generate`,
			article: `${API_PREFIX}/article`
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
		/** Read one article body by id. */
		function fetchArticle(id) {
			return getJson(`${API_PATHS.article}?id=${encodeURIComponent(id)}`);
		}
		// src/client/assets/back.svg
		var back_default = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"1em\" height=\"1em\" viewBox=\"0 0 24 24\">\n	<g fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\">\n		<path d=\"M19 12H5m6-7-7 7 7 7\" />\n	</g>\n</svg>\n";
		// src/client/assets/doc.svg
		var doc_default = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"1em\" height=\"1em\" viewBox=\"0 0 24 24\">\n	<path d=\"M0 0h24v24H0z\" fill=\"none\" />\n	<g fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\">\n		<path d=\"M13.75 2.75h-6.5a2.5 2.5 0 0 0-2.5 2.5v13.5a2.5 2.5 0 0 0 2.5 2.5h9.5a2.5 2.5 0 0 0 2.5-2.5V8.25Z\" />\n		<path d=\"M13.75 2.75v3.5a2 2 0 0 0 2 2h3.5m-10.5 5h6.5m-6.5 3.5h4\" />\n	</g>\n</svg>\n";
		// src/client/assets/search.svg
		var search_default = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"1em\" height=\"1em\" viewBox=\"0 0 24 24\">\n	<g fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\">\n		<circle cx=\"11\" cy=\"11\" r=\"6.25\" />\n		<path d=\"m16 16 4 4\" />\n	</g>\n</svg>\n";
		// src/client/assets/settings.svg
		var settings_default = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"1em\" height=\"1em\" viewBox=\"0 0 24 24\">\n	<g fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\">\n		<path d=\"M4 7h9m4 0h3M4 17h3m4 0h9\" />\n		<circle cx=\"15\" cy=\"7\" r=\"2\" />\n		<circle cx=\"9\" cy=\"17\" r=\"2\" />\n	</g>\n</svg>\n";
		// src/client/assets/sparkle.svg
		var sparkle_default = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"1em\" height=\"1em\" viewBox=\"0 0 24 24\">\n	<g fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\">\n		<path d=\"M11 3.5 12.8 8.7 18 10.5 12.8 12.3 11 17.5 9.2 12.3 4 10.5 9.2 8.7Z\" />\n		<path d=\"m18 15 .9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9Z\" />\n	</g>\n</svg>\n";
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
		/** The magnifier glyph: the article search field. */
		const SearchIcon = icon("SearchIcon", "search.svg", search_default);
		/** The left arrow: the article reader's way back to the list. */
		const BackIcon = icon("BackIcon", "back.svg", back_default);
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
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
						type: "button",
						className: "dsh-cd-btn dsh-cd-back",
						onClick: onBack,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(BackIcon, { size: 14 }), t("article.back")]
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
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h1", {
							className: "dsh-cd-article-title",
							children: article.title
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "dsh-cd-article-meta",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: article.date }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Tag, {
								tone: "neutral",
								children: article.category
							})]
						})]
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Markdown, { text: article.content })] })
				]
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
			const [saving, setSaving] = react.useState(false);
			const [error, setError] = react.useState(null);
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
					days
				});
				if (answer.ok !== true) {
					setSaving(false);
					setError(`${t("settings.failed")}${answer.error === "" ? "" : `: ${answer.error}`}`);
					return;
				}
				onSaved(answer.settings);
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(_deepseek_ai_dsh_client_ui_primitives.Modal, {
				open: true,
				onClose: close,
				className: "dsh-cd-dialog-wide",
				title: t("settings.title"),
				description: t("settings.description"),
				closeLabel: t("settings.close"),
				contentClassName: "dsh-cd-dialog-content",
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
				children: [
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
			});
		}
		// src/client/page.tsx
		/**
		* The Daily Post page.
		*
		* The page is a thin, honest projection of the Host's state: it lists the
		* Markdown files the Host has written, filters them locally, and follows a
		* running generation by polling the state route while the Host reports one. It
		* never writes an article itself — the manual button only asks the Host to start
		* a batch, and the settings dialog only stores the prompt, batch size, and
		* repeat days the Host schedules from.
		*/
		/** How often a running generation is polled, in milliseconds. */
		const POLL_INTERVAL_MS = 2500;
		/**
		* Render one article card.
		* @param props - the article summary and the open action.
		* @returns the list row.
		*/
		function ArticleCard({ article, onOpen }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
				type: "button",
				className: "dsh-cd-card",
				onClick: onOpen,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
						className: "dsh-cd-card-top",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Tag, {
							tone: "neutral",
							children: article.category
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: "dsh-cd-date",
							children: article.date
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: "dsh-cd-card-title",
						children: article.title
					}),
					article.excerpt !== "" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: "dsh-cd-card-excerpt",
						children: article.excerpt
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
			const scrollRef = react.useRef(null);
			react.useEffect(() => {
				if (scrollRef.current !== null) scrollRef.current.scrollTop = 0;
			}, [view]);
			const refresh = react.useCallback(async () => {
				const answer = await fetchState();
				if (answer.ok === true) {
					setState(answer);
					setLoadError(null);
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
							}),
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
									onOpen: () => {
										setView({
											kind: "article",
											id: article.id
										});
									}
								}, article.id))
							})
						] })
					})
				}), settingsOpen && state !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SettingsDialog, {
					t,
					settings: state.settings,
					onClose: () => {
						setSettingsOpen(false);
					},
					onSaved
				})]
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
			"generate.action": "Generate now",
			"generate.running": "Generating…",
			"settings.action": "Settings",
			"settings.title": "Daily Post settings",
			"settings.description": "Tell the model what to write, how much, and when.",
			"settings.prompt": "Prompt",
			"settings.promptHint": "Describe the topics, angle, or style you want to read.",
			"settings.count": "Articles per generation",
			"settings.days": "Repeat days",
			"settings.cancel": "Cancel",
			"settings.close": "Close",
			"settings.save": "Save",
			"settings.saving": "Saving…",
			"settings.failed": "Could not save settings",
			"list.emptyTitle": "No daily posts yet",
			"list.emptyHint": "Generated articles will appear here.",
			"list.noMatchTitle": "No matching articles",
			"list.noMatchHint": "Try another search or category.",
			"article.back": "Back to list",
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
			"generate.action": "立即生成",
			"generate.running": "正在生成…",
			"settings.action": "设置",
			"settings.title": "每日贴设置",
			"settings.description": "告诉 AI 写什么、写多少，以及什么时候写。",
			"settings.prompt": "提示词",
			"settings.promptHint": "描述你想读的主题、角度或写作风格。",
			"settings.count": "每次生成数量",
			"settings.days": "重复生成的日期",
			"settings.cancel": "取消",
			"settings.close": "关闭",
			"settings.save": "保存",
			"settings.saving": "保存中…",
			"settings.failed": "设置保存失败",
			"list.emptyTitle": "还没有每日贴",
			"list.emptyHint": "生成后的每日贴会显示在这里。",
			"list.noMatchTitle": "没有匹配的文章",
			"list.noMatchHint": "换个关键词或分类试试。",
			"article.back": "返回列表",
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
			".dsh-cd-page{display:flex;flex-direction:column;width:100%;height:100%;min-width:0;min-height:0;overflow:hidden;background:transparent;color:var(--dsw-alias-label-primary);font-size:14px;line-height:1.6}",
			".dsh-cd-scroll{flex:1;min-height:0;overflow:auto;scrollbar-gutter:stable;--dsh-scrollbar-width:9px;--dsh-scrollbar-thumb-border:2px}",
			".dsh-cd-content{box-sizing:border-box;width:100%;max-width:860px;margin:0 auto;padding:0 clamp(20px,5vw,48px) 64px}",
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
			".dsh-cd-list{display:flex;flex-direction:column;gap:10px}",
			".dsh-cd-card{display:flex;flex-direction:column;align-items:stretch;gap:7px;box-sizing:border-box;width:100%;padding:16px 18px;border:.5px solid var(--dsw-alias-border-l2);border-radius:12px;background:color-mix(in srgb,var(--dsw-alias-bg-layer-1) 82%,transparent);color:var(--dsw-alias-label-primary);font:inherit;text-align:left;cursor:pointer;transition:background-color .15s ease,border-color .15s ease,transform .15s ease}",
			".dsh-cd-card:hover{background:var(--dsw-alias-interactive-bg-hover);border-color:var(--dsw-alias-border-l3);transform:translateY(-1px)}",
			".dsh-cd-card:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}",
			".dsh-cd-card-top{display:flex;align-items:center;gap:9px}",
			".dsh-cd-date{color:var(--dsw-alias-label-secondary);font-size:11.5px;font-variant-numeric:tabular-nums}",
			".dsh-cd-card-title{font-size:15px;line-height:1.5;font-weight:600;overflow-wrap:anywhere}",
			".dsh-cd-card-excerpt{display:-webkit-box;overflow:hidden;color:var(--dsw-alias-label-secondary);font-size:12.5px;line-height:1.7;-webkit-box-orient:vertical;-webkit-line-clamp:2}",
			".dsh-cd-empty{display:flex;flex-direction:column;align-items:center;gap:4px;padding:56px 24px;border:.5px solid var(--dsw-alias-border-l2);border-radius:12px;background:color-mix(in srgb,var(--dsw-alias-bg-layer-1) 62%,transparent);text-align:center}",
			".dsh-cd-empty-icon{display:inline-flex;align-items:center;justify-content:center;width:48px;height:48px;margin-bottom:8px;border-radius:12px;background:color-mix(in srgb,var(--dsw-alias-bg-layer-2) 80%,transparent);color:var(--dsw-alias-label-secondary)}",
			".dsh-cd-empty-title{margin:0;font-size:14px;font-weight:500}",
			".dsh-cd-empty-hint{margin:0;color:var(--dsw-alias-label-secondary);font-size:12.5px;line-height:19px}",
			".dsh-cd-state{display:flex;flex-direction:column;align-items:center;gap:12px;padding:48px 16px;color:var(--dsw-alias-label-secondary);font-size:13px;text-align:center}",
			".dsh-cd-article{padding-top:32px}",
			"[data-platform='darwin'] .dsh-cd-article{padding-top:calc(32px + var(--dsh-frame-top-clearance,0px))}",
			".dsh-cd-back{height:30px;padding:0 10px;background:transparent;border-color:transparent;color:var(--dsw-alias-label-secondary)}",
			".dsh-cd-back:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover);border-color:transparent;color:var(--dsw-alias-label-primary)}",
			".dsh-cd-article-head{margin:18px 0 22px;padding-bottom:18px;border-bottom:.5px solid var(--dsw-alias-border-l2)}",
			".dsh-cd-article-title{margin:0;font-size:25px;line-height:1.4;font-weight:600;letter-spacing:-.01em}",
			".dsh-cd-article-meta{display:flex;align-items:center;gap:10px;margin-top:12px;color:var(--dsw-alias-label-secondary);font-size:12px}",
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
			".dsh-cd-dialog-content{max-height:min(68vh,620px);overflow:auto}",
			".dsh-cd-field-label{display:block;font-size:13px;font-weight:500;line-height:1.5}",
			".dsh-cd-textarea{box-sizing:border-box;width:100%;min-height:124px;padding:10px 12px;border:.5px solid var(--dsw-alias-border-l4);border-radius:var(--dsw-radius-md);background:var(--dsw-alias-bg-layer-3);color:var(--dsw-alias-label-primary);font:inherit;font-size:13px;line-height:1.6;resize:vertical}",
			".dsh-cd-textarea:focus-visible{outline:none;border-color:var(--dsw-alias-brand-primary)}",
			".dsh-cd-count{margin-top:6px}",
			".dsh-cd-days{display:flex;flex-wrap:wrap;gap:6px}",
			".dsh-cd-day{width:36px;height:36px;padding:0;border:.5px solid var(--dsw-alias-border-l3);border-radius:var(--dsw-radius-md);background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:13px;cursor:pointer}",
			".dsh-cd-day:hover{border-color:var(--dsw-alias-border-l4);color:var(--dsw-alias-label-primary)}",
			".dsh-cd-day:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}",
			".dsh-cd-day-active{border-color:transparent;background:var(--dsw-alias-brand-primary);color:var(--dsw-alias-label-primary-foreground)}",
			".dsh-cd-day-active:hover{border-color:transparent;color:var(--dsw-alias-label-primary-foreground)}",
			".dsh-cd-hint{color:var(--dsw-alias-label-secondary);font-size:12px;line-height:1.5}",
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
			}, DocIcon));
		}
		exports.apply = apply;
		exports.inject = inject;
		exports.name = name;
		return module.exports;
	}
});
