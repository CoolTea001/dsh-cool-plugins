import { mkdir, readFile, readdir, rename, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { homedir } from "node:os";
import { randomUUID } from "node:crypto";
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
// src/host/paths.ts
/**
* Where dsh-cool-daily keeps its data.
*
* The same convention the other cool plugins use: `$DSH_HOME/cool-daily`, with
* `DSH_HOME` winning and `~/.dsh` as the fallback. The articles directory is the
* plugin's durable output — Markdown files a user can open in any editor — so it
* is a visible directory rather than an opaque store.
*/
/** The harness home, resolved the way the rest of DSH resolves it. */
function harnessHome() {
	const configured = process.env.DSH_HOME?.trim();
	return configured ? configured : join(homedir(), ".dsh");
}
/** Root of this plugin's data. */
function dataRoot() {
	return join(harnessHome(), "cool-daily");
}
/** The Markdown article directory. */
function articlesDir() {
	return join(dataRoot(), "articles");
}
/** The settings document. */
function settingsPath() {
	return join(dataRoot(), "settings.json");
}
// src/host/articles.ts
/**
* The Markdown article store.
*
* An article is one file under `articles/`, named by its id, with a small
* front-matter header for the fields the list needs. The files are the source of
* truth: the list is rebuilt by reading the directory, so a file dropped in by
* hand appears on the page and a deleted one disappears, without an index that
* could disagree with the disk.
*
* Every write is one `writeFile` with an exclusive flag, so two generations
* racing on the same second cannot silently overwrite each other.
*/
/** Generated ids; anything read back from a request must match this. */
const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,119}$/;
/** Front matter is this plugin's own header, not a general YAML document. */
const FRONT_MATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;
/** Characters left in a list card's excerpt. */
const EXCERPT_LENGTH = 150;
/**
* Validate an article id coming from the browser.
*
* The id becomes a path segment, so it is restricted to a conservative set and
* anything else is refused before a path is built.
*/
function isArticleId(value) {
	return typeof value === "string" && ID_PATTERN.test(value);
}
/** Render one front-matter value as a JSON/YAML double-quoted scalar. */
function scalar(value) {
	return JSON.stringify(value);
}
/** Build the header written above every article body. */
function frontMatter(fields) {
	return [
		"---",
		`title: ${scalar(fields.title)}`,
		`date: ${scalar(fields.date)}`,
		`category: ${scalar(fields.category)}`,
		`createdAt: ${scalar(fields.createdAt)}`,
		"---",
		""
	].join("\n");
}
/** Read a scalar written by {@link frontMatter}, tolerating a plain value. */
function readScalar(raw) {
	const value = raw.trim();
	if (value.startsWith("\"") && value.endsWith("\"")) try {
		const parsed = JSON.parse(value);
		if (typeof parsed === "string") return parsed;
	} catch {}
	if (value.startsWith("'") && value.endsWith("'")) return value.slice(1, -1).replace(/''/g, "'");
	return value;
}
/** Split one file into its stored fields and Markdown body. */
function parseArticle(text) {
	const match = FRONT_MATTER.exec(text);
	if (match === null) return {
		fields: {},
		content: text
	};
	const fields = {};
	for (const line of match[1].split(/\r?\n/)) {
		const field = /^([A-Za-z][A-Za-z0-9]*):\s*(.*)$/.exec(line);
		if (field === null) continue;
		const value = readScalar(field[2]);
		if (field[1] === "title" || field[1] === "date" || field[1] === "category" || field[1] === "createdAt") fields[field[1]] = value;
	}
	return {
		fields,
		content: text.slice(match[0].length)
	};
}
/** Turn one body into the plain opening sentence a card shows. */
function excerptOf(content) {
	return content.replace(/```[\s\S]*?```/g, " ").replace(/!\[[^\]]*\]\([^)]*\)/g, " ").replace(/\[([^\]]*)\]\([^)]*\)/g, "$1").replace(/<[^>]+>/g, " ").replace(/[#>*_`~]+/g, " ").replace(/\s+/g, " ").trim().slice(0, EXCERPT_LENGTH);
}
/** The local calendar day of one instant, as `YYYY-MM-DD`. */
function localDate(now = /* @__PURE__ */ new Date()) {
	const month = String(now.getMonth() + 1).padStart(2, "0");
	const day = String(now.getDate()).padStart(2, "0");
	return `${now.getFullYear()}-${month}-${day}`;
}
function summaryOf(id, text) {
	const { fields, content } = parseArticle(text);
	const date = fields.date ?? id.slice(0, 10);
	return {
		id,
		title: fields.title?.trim() || "未命名每日贴",
		date,
		category: fields.category?.trim() || "未分类",
		createdAt: fields.createdAt ?? "",
		excerpt: excerptOf(content)
	};
}
/** Read every article, newest first. */
async function listArticles() {
	let names;
	try {
		names = await readdir(articlesDir());
	} catch {
		return [];
	}
	const articles = [];
	for (const name of names) {
		if (!name.endsWith(".md")) continue;
		const id = name.slice(0, -3);
		if (!isArticleId(id)) continue;
		try {
			const text = await readFile(join(articlesDir(), name), "utf8");
			articles.push(summaryOf(id, text));
		} catch {}
	}
	return articles.sort((left, right) => right.date.localeCompare(left.date) || right.createdAt.localeCompare(left.createdAt));
}
/** Read one article, or `undefined` when it does not exist or is unreadable. */
async function readArticle(id) {
	if (!isArticleId(id)) return void 0;
	const directory = resolve(articlesDir());
	const file = resolve(directory, `${id}.md`);
	if (!file.startsWith(`${directory}/`)) return void 0;
	try {
		const text = await readFile(file, "utf8");
		return {
			...summaryOf(id, text),
			content: parseArticle(text).content
		};
	} catch {
		return;
	}
}
/**
* Write one generated article as its own Markdown file.
*
* @param article - title, category, and Markdown body.
* @param date - the local day it belongs to.
* @param index - its position in the batch, which only distinguishes ids.
* @returns the stored summary.
*/
async function saveArticle(article, date, index) {
	await mkdir(articlesDir(), { recursive: true });
	const now = /* @__PURE__ */ new Date();
	const base = `${date}-${[
		now.getHours(),
		now.getMinutes(),
		now.getSeconds()
	].map((part) => String(part).padStart(2, "0")).join("")}-${index + 1}`;
	const content = `${frontMatter({
		title: article.title,
		date,
		category: article.category,
		createdAt: now.toISOString()
	})}${article.content.trim()}\n`;
	for (let attempt = 0; attempt < 20; attempt += 1) {
		const id = attempt === 0 ? base : `${base}-${attempt + 1}`;
		try {
			await writeFile(join(articlesDir(), `${id}.md`), content, {
				encoding: "utf8",
				flag: "wx"
			});
			return summaryOf(id, content);
		} catch (error) {
			if (error.code !== "EEXIST") throw error;
		}
	}
	throw new Error("无法为文章分配文件名");
}
// src/host/settings.ts
/**
* The settings document.
*
* A missing or unreadable file reads as the defaults rather than failing the
* page: settings are a preference, and a half-written JSON file must not take
* the Daily Post page down. Every write is validated and clamped here so the
* browser cannot hand the model an unbounded prompt or a thousand articles.
*/
/** Longest prompt accepted, in characters. */
const PROMPT_MAX = 4e3;
/** Bounds of {@link DailySettings.count}. */
const COUNT_MIN = 1;
const COUNT_MAX = 10;
/** A fresh install generates one article every day; the user may deselect days. */
const DEFAULT_SETTINGS = {
	prompt: "围绕科技、学习与效率，写一篇能带来新视角的短文：有一个具体的观点，并用可靠的例子或方法支撑它。",
	count: 1,
	days: [
		0,
		1,
		2,
		3,
		4,
		5,
		6
	]
};
function isRecord(value) {
	return value !== null && typeof value === "object" && !Array.isArray(value);
}
/** Coerce one stored or submitted settings record into the accepted shape. */
function normalizeSettings(value) {
	if (!isRecord(value)) return {
		...DEFAULT_SETTINGS,
		days: [...DEFAULT_SETTINGS.days]
	};
	const prompt = typeof value.prompt === "string" ? value.prompt.trim().slice(0, PROMPT_MAX) : "";
	const countNumber = typeof value.count === "number" ? value.count : NaN;
	const count = Number.isFinite(countNumber) ? Math.min(COUNT_MAX, Math.max(COUNT_MIN, Math.round(countNumber))) : DEFAULT_SETTINGS.count;
	const days = Array.isArray(value.days) ? [...new Set(value.days.filter((day) => typeof day === "number" && Number.isInteger(day) && day >= 0 && day <= 6))].sort((left, right) => left - right) : [];
	return {
		prompt: prompt === "" ? DEFAULT_SETTINGS.prompt : prompt,
		count,
		days
	};
}
/** Read the stored settings, falling back to the defaults. */
async function readSettings() {
	try {
		const text = await readFile(settingsPath(), "utf8");
		return normalizeSettings(JSON.parse(text));
	} catch {
		return {
			...DEFAULT_SETTINGS,
			days: [...DEFAULT_SETTINGS.days]
		};
	}
}
/**
* Validate and persist one settings record, then return what was stored.
*
* The write goes through a sibling temporary file and a rename so a crash
* midway leaves the previous document intact instead of a truncated one.
*/
async function writeSettings(value) {
	const settings = normalizeSettings(value);
	const file = settingsPath();
	await mkdir(dirname(file), { recursive: true });
	const temporary = `${file}.${process.pid}.${Date.now()}.tmp`;
	await writeFile(temporary, `${JSON.stringify(settings, null, 2)}\n`, "utf8");
	await rename(temporary, file);
	return settings;
}
// src/host/generate.ts
/**
* Generation: one model call per batch, turned into Markdown files.
*
* The Host asks the currently selected default model for a JSON array of
* articles, validates what came back, and writes each article through the
* article store. The call goes through `ctx.llm` directly rather than through a
* Session, so a daily batch costs one request and leaves no conversation
* behind — and so the scheduler can run with no Session at all.
*
* The prompt asks for Markdown; the model's answer is parsed into title,
* category, and body. A malformed answer is not thrown away: the body is kept as
* one article so a partial result still reaches the page, and the parse problem
* becomes a notice rather than an empty day.
*/
/** Longest one batch may run before it is cancelled. */
const GENERATION_TIMEOUT_MS = 24e4;
/** Upper bound on the model's answer, in tokens. */
const MAX_TOKENS = 16e3;
const runtime = {
	generating: false,
	lastError: null,
	lastFinishedAt: null
};
/** Read the current in-memory generation state. */
function generationState() {
	return { ...runtime };
}
/** One opaque id per generation, used only as the provider's routing header. */
function sessionIdForBatch() {
	return `cool-daily-${randomUUID()}`;
}
/** The system message for one batch. */
function systemPrompt(count) {
	return [
		"你是「每日贴」的专栏作者，为读者持续产出值得阅读的原创短文。",
		`本轮需要写 ${count} 篇文章，每篇彼此独立：主题不同、角度不同，不要重复同一论点。`,
		"",
		"只输出一个 JSON 数组，不要输出解释、前言或 Markdown 代码围栏。数组恰好包含以下对象：",
		"{ \"title\": \"文章标题\", \"category\": \"分类\", \"content\": \"Markdown 正文\" }",
		"",
		"写作用户指定的语言。要求：",
		"- title：具体、有信息量，不超过 30 字，不写序号。",
		"- category：2-6 个字的短分类，用于列表筛选（例如：科技、学习、效率、生活、观点）。",
		"- content：完整的 Markdown 正文，600-900 字；包含一级或二级小标题、自然段落，必要时使用列表或引用；不要出现文章标题本身，不要使用代码围栏包裹全文。",
		"- 观点要有依据，方法要可执行，避免空泛的口号与营销腔。"
	].join("\n");
}
/** The user message: the topic instruction plus the batch shape. */
function userPrompt(settings, date) {
	return [
		`日期：${date}`,
		`主题与要求：${settings.prompt}`,
		`请按上述要求生成 ${settings.count} 篇文章，并只返回 JSON 数组。`
	].join("\n");
}
/**
* Resolve the model route the rest of DSH uses for its default selection.
*
* @throws when no default model is configured, which is also why the model
*   cannot be resolved per batch at settings-save time.
*/
function resolveModel(ctx) {
	const selection = ctx.get("agentDefaultModel")?.currentSelection();
	const provider = selection?.provider;
	const model = selection?.model;
	if (typeof provider !== "string" || typeof model !== "string" || provider === "" || model === "") throw new Error("尚未配置默认模型，无法生成每日贴");
	return {
		provider,
		model
	};
}
/** Translate one failed stream chunk into an error message. */
function failureMessage(chunk) {
	const failure = chunk.reason?.failure;
	const code = failure?.code === void 0 ? "" : ` (${failure.code})`;
	return `${chunk.reason?.kind === "aborted" ? "生成已取消" : "模型调用失败"}${code}：${failure?.message ?? "未知错误"}`;
}
/**
* Run one model call and return its complete text.
*
* The stream is drained into one string; a terminal `error` or `aborted` chunk
* becomes a thrown error, and a stream that ends without any terminal chunk is
* treated as a failure instead of a silent empty answer.
*/
async function callModel(ctx, settings, date) {
	const llm = ctx.get("llm");
	if (llm === void 0) throw new Error("LLM 服务未就绪，无法生成每日贴");
	const { provider, model } = resolveModel(ctx);
	const controller = new AbortController();
	const timer = setTimeout(() => {
		controller.abort();
	}, GENERATION_TIMEOUT_MS);
	let text = "";
	let finished = false;
	try {
		for await (const chunk of llm.stream({
			provider,
			model,
			system: systemPrompt(settings.count),
			messages: [{
				role: "user",
				content: [{
					type: "text",
					text: userPrompt(settings, date)
				}]
			}],
			temperature: .7,
			maxTokens: MAX_TOKENS,
			signal: controller.signal,
			sessionId: sessionIdForBatch()
		})) {
			if (chunk.type === "text-delta" && typeof chunk.text === "string") text += chunk.text;
			if (chunk.type !== "finish") continue;
			finished = true;
			if (chunk.reason?.kind === "error" || chunk.reason?.kind === "aborted") throw new Error(failureMessage(chunk));
			if (chunk.reason?.kind !== "stop") throw new Error(`模型返回了未完成的结束原因：${chunk.reason?.kind ?? "unknown"}`);
		}
	} finally {
		clearTimeout(timer);
	}
	if (!finished) throw new Error("模型流在结束前中断，未收到完整结果");
	return text.trim();
}
/** Keep the model's category short enough for a badge, or fall back. */
function categoryOf(value) {
	if (typeof value !== "string") return "每日贴";
	const category = value.trim().replace(/\s+/g, " ");
	return category === "" ? "每日贴" : category.slice(0, 8);
}
/** Whether one parsed entry has the two fields an article cannot do without. */
function isRawArticle(value) {
	return value !== null && typeof value === "object";
}
/**
* Parse the model's answer into at most `count` articles.
*
* The answer may be bare JSON or a fenced block; both are accepted. When
* nothing usable comes back, the raw text is kept as one article so the day is
* not silently empty.
*/
function parseGenerated(raw, count, date) {
	const fenced = /```(?:json)?\s*([\s\S]*?)```/i.exec(raw);
	const candidate = fenced === null ? raw : fenced[1];
	const start = candidate.indexOf("[");
	const end = candidate.lastIndexOf("]");
	if (start >= 0 && end > start) try {
		const parsed = JSON.parse(candidate.slice(start, end + 1));
		if (Array.isArray(parsed)) {
			const articles = [];
			for (const entry of parsed) {
				if (!isRawArticle(entry)) continue;
				const title = typeof entry.title === "string" ? entry.title.trim().slice(0, 60) : "";
				const content = typeof entry.content === "string" ? entry.content.trim() : "";
				if (title === "" || content === "") continue;
				articles.push({
					title,
					category: categoryOf(entry.category),
					content
				});
				if (articles.length >= count) break;
			}
			if (articles.length > 0) return articles;
		}
	} catch {}
	if (raw.trim() === "") throw new Error("模型没有返回内容");
	return [{
		title: `${date} 每日贴`,
		category: "每日贴",
		content: raw.trim()
	}];
}
/**
* Generate and store one batch.
*
* Only one batch runs at a time: the scheduler and the page's manual button
* share this guard, so a second request is refused instead of doubling the
* model bill. The returned summary is the stored articles, newest last.
*/
async function generateNow(ctx) {
	if (runtime.generating) return {
		ok: false,
		error: "正在生成每日贴，请稍候"
	};
	runtime.generating = true;
	runtime.lastError = null;
	try {
		const settings = await readSettings();
		const date = localDate();
		const generated = parseGenerated(await callModel(ctx, settings, date), settings.count, date);
		const stored = [];
		for (const [index, article] of generated.entries()) stored.push(await saveArticle(article, date, index));
		runtime.lastFinishedAt = (/* @__PURE__ */ new Date()).toISOString();
		return {
			ok: true,
			articles: stored
		};
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		runtime.lastError = message;
		return {
			ok: false,
			error: message
		};
	} finally {
		runtime.generating = false;
	}
}
/**
* Start one batch in the background.
*
* Routes and the scheduler both call this: the HTTP answer returns immediately
* and the page follows progress through the state route, so a slow model call
* never holds a request open or blocks the browser.
*
* @returns false when a batch was already running, so the caller can tell the
*   user their click was not queued.
*/
function startGeneration(ctx) {
	if (runtime.generating) return false;
	generateNow(ctx);
	return true;
}
// src/host/routes.ts
/** Longest body a settings write accepts. */
const MAX_BODY_BYTES = 65536;
function sendJson(res, status, body) {
	res.writeHead(status, {
		"content-type": "application/json; charset=utf-8",
		"cache-control": "no-store"
	});
	res.end(JSON.stringify(body));
}
/** Answer 405 unless the request uses one of the allowed methods. */
function methodAllowed(req, res, allowed) {
	if (allowed.includes(req.method ?? "")) return true;
	sendJson(res, 405, {
		ok: false,
		error: "method not allowed"
	});
	return false;
}
/**
* Read a JSON object body, bounded before it is parsed.
*
* @throws when the body is too large or is not a JSON object.
*/
async function readBody(req, limit) {
	const chunks = [];
	let size = 0;
	for await (const chunk of req) {
		const buffer = Buffer.from(chunk);
		size += buffer.length;
		if (size > limit) throw new Error("body is too large");
		chunks.push(buffer);
	}
	const text = Buffer.concat(chunks).toString("utf8");
	if (text === "") return {};
	const parsed = JSON.parse(text);
	if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("body must be a JSON object");
	return parsed;
}
/**
* Reject a cross-site request.
*
* These routes read and write this user's own article directory, so a page on
* another origin has no business asking. A same-origin `fetch` omits `Origin` on
* some requests, so an absent header is allowed.
*/
function sameOrigin(req) {
	const origin = req.headers?.origin;
	if (typeof origin !== "string" || origin === "" || origin === "null") return true;
	const host = req.headers?.host;
	if (typeof host !== "string" || host === "") return false;
	try {
		return new URL(origin).host === host;
	} catch {
		return false;
	}
}
/** Answer the current page state. */
async function handleState(res) {
	const [settings, articles] = await Promise.all([readSettings(), listArticles()]);
	const generation = generationState();
	sendJson(res, 200, {
		ok: true,
		settings,
		articles,
		generating: generation.generating,
		lastError: generation.lastError
	});
}
/** Persist one settings write and answer what was stored. */
async function handleSettings(req, res) {
	let body;
	try {
		body = await readBody(req, MAX_BODY_BYTES);
	} catch (error) {
		sendJson(res, 400, {
			ok: false,
			error: error instanceof Error ? error.message : String(error)
		});
		return;
	}
	sendJson(res, 200, {
		ok: true,
		settings: await writeSettings(body.settings)
	});
}
/** Start one manual batch; the page follows it through the state route. */
function handleGenerate(res, ctx) {
	if (!startGeneration(ctx)) {
		sendJson(res, 202, {
			ok: false,
			error: "正在生成每日贴，请稍候"
		});
		return;
	}
	sendJson(res, 200, {
		ok: true,
		started: true
	});
}
/** Read one article body by id. */
async function handleArticle(url, res) {
	const id = url.searchParams.get("id");
	if (!isArticleId(id)) {
		sendJson(res, 400, {
			ok: false,
			error: "invalid article id"
		});
		return;
	}
	const article = await readArticle(id);
	if (article === void 0) {
		sendJson(res, 404, {
			ok: false,
			error: "article not found"
		});
		return;
	}
	sendJson(res, 200, {
		ok: true,
		article
	});
}
/** Dispatch one request below the plugin prefix. */
async function dispatch(req, res, ctx) {
	const url = new URL(req.url ?? "/", "http://dsh.invalid");
	const path = url.pathname;
	try {
		if (path === API_PATHS.state) {
			if (!methodAllowed(req, res, ["GET"])) return;
			return await handleState(res);
		}
		if (path === API_PATHS.settings) {
			if (!methodAllowed(req, res, ["PUT"])) return;
			return await handleSettings(req, res);
		}
		if (path === API_PATHS.generate) {
			if (!methodAllowed(req, res, ["POST"])) return;
			return handleGenerate(res, ctx);
		}
		if (path === API_PATHS.article) {
			if (!methodAllowed(req, res, ["GET"])) return;
			return await handleArticle(url, res);
		}
		sendJson(res, 404, {
			ok: false,
			error: "not found"
		});
	} catch (error) {
		sendJson(res, 500, {
			ok: false,
			error: error instanceof Error ? error.message : String(error)
		});
	}
}
/**
* Register every route under the plugin prefix.
*
* The prefix handler is tied to the plugin's fiber by the caller, so stopping or
* reloading the plugin takes its routes down with it.
*
* @param ctx - the Host plugin context exposing `webServer`.
* @returns the disposer that unregisters the prefix.
*/
function registerRoutes(ctx) {
	return ctx.webServer.register({
		kind: "prefix",
		path: API_PREFIX,
		handler: (req, res) => {
			if (!sameOrigin(req)) {
				sendJson(res, 403, {
					ok: false,
					error: "cross-origin request refused"
				});
				return;
			}
			return dispatch(req, res, ctx);
		}
	});
}
// src/host/scheduler.ts
/**
* The daily scheduler.
*
* DSH has no cron for this plugin, and a durable reminder is a Session feature
* this page does not own, so the Host checks the clock once a minute instead:
* when today is one of the selected weekdays, the local hour has reached
* {@link AUTO_GENERATION_HOUR}, no article exists for today yet, and nothing is
* already generating, one batch starts.
*
* The check is idempotent and stateless — "does today have an article?" is read
* from the article directory, not from a private cursor — so a restart, a
* long-closed laptop, or a changed schedule all converge on the same answer. A
* failed batch retries after a cooldown rather than every minute.
*/
/** How often the clock is checked. */
const CHECK_INTERVAL_MS = 6e4;
/** The first check waits for the Host to finish booting. */
const INITIAL_CHECK_MS = 5e3;
/** No retry sooner than this after a failed automatic batch. */
const RETRY_COOLDOWN_MS = 6e5;
let lastAttempt = 0;
/**
* Run one clock check.
*
* Every early return is a reason not to generate: no repeat day selected, today
* not selected, too early in the day, a batch already running, a recent failure,
* or an article already written for today.
*/
async function check(ctx) {
	const settings = await readSettings();
	if (settings.days.length === 0) return;
	const now = /* @__PURE__ */ new Date();
	if (!settings.days.includes(now.getDay())) return;
	if (now.getHours() < 8) return;
	if (generationState().generating) return;
	if (Date.now() - lastAttempt < RETRY_COOLDOWN_MS) return;
	const today = localDate(now);
	if ((await listArticles()).some((article) => article.date === today)) return;
	lastAttempt = Date.now();
	startGeneration(ctx);
}
/**
* Start the periodic check and return its disposer.
*
* The first check runs shortly after load so a Host started at 09:00 still
* catches up on the day; the interval takes over from there.
*
* @param ctx - the Host plugin context, used to resolve the model route later.
* @returns the disposer that stops both timers.
*/
function startScheduler(ctx) {
	let running = false;
	const run = () => {
		if (running) return;
		running = true;
		check(ctx).catch(() => {}).finally(() => {
			running = false;
		});
	};
	const initial = setTimeout(run, INITIAL_CHECK_MS);
	const interval = setInterval(run, CHECK_INTERVAL_MS);
	return () => {
		clearTimeout(initial);
		clearInterval(interval);
	};
}
// src/host/index.ts
/**
* Host entry for dsh-cool-daily.
*
* This half owns the articles and the model call behind them. It answers the
* browser through same-origin HTTP routes (the browser half has no Cordis
* context) and runs the daily check on a timer. Settings and Markdown files live
* under `$DSH_HOME/cool-daily`, next to the other cool plugins' data, so the
* generated articles are ordinary files the user can open and keep.
*/
const name = "dsh-cool-daily";
/** The web carrier is a hard dependency: without it there is no route to serve. */
const inject = ["webServer"];
function apply(ctx) {
	ctx.effect(() => registerRoutes(ctx), "dsh-cool-daily: routes");
	ctx.effect(() => startScheduler(ctx), "dsh-cool-daily: scheduler");
}
export { apply, inject, name };
