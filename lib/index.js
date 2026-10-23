// src/host/files.ts
/** How many lines one preview asks for; the service's own cap still applies. */
const READ_LINES = 5e3;
/** A stand-in session identity for a request that named none. */
const LOCAL_SESSION = "local";
/**
* The session's own workspace root.
*
* Live header first, then the durable header of a session the Host has not
* resumed yet, then the executor's default directory. Every read is
* best-effort: an unreadable store is not this route's answer to give.
*
* @param ctx - the Host plugin context.
* @param sessionId - the session the page belongs to, when it named one.
* @returns the absolute workspace root, or undefined when none can be named.
*/
async function resolveRoot(ctx, sessionId) {
	if (typeof sessionId === "string" && sessionId !== "") {
		const sessions = ctx.get("sessions");
		try {
			const cwd = sessions?.get(sessionId)?.header?.cwd;
			if (typeof cwd === "string" && cwd !== "") return cwd;
		} catch {}
		const controller = ctx.get("sessionController");
		if (controller !== void 0 && typeof controller.inspect === "function") try {
			const cwd = (await controller.inspect(sessionId))?.meta?.cwd;
			if (typeof cwd === "string" && cwd !== "") return cwd;
		} catch {}
	}
	const shell = ctx.get("shell");
	try {
		const spec = shell?.resolve({ command: "pwd" });
		if (typeof spec?.workdir === "string" && spec.workdir !== "") return spec.workdir;
	} catch {}
}
/**
* The header-derived scope the workspace service expects.
*
* @param sessionId - the session the page belongs to, when it named one.
* @param root - the session's absolute workspace root.
* @returns the scope for one request.
*/
function scopeOf(sessionId, root) {
	return {
		sessionId: typeof sessionId === "string" && sessionId !== "" ? sessionId : LOCAL_SESSION,
		workspaceRoot: root
	};
}
/**
* Read a path the page named as a workspace-relative `/`-separated path.
*
* Absolute paths and parent segments are refused here rather than passed on:
* the tab's vocabulary is the workspace tree, and a route is not the place to
* widen it.
*
* @param value - the raw body value.
* @returns the normalized path, or undefined when it is not one.
*/
function readPath(value) {
	if (typeof value !== "string") return void 0;
	if (value.includes("\0")) return void 0;
	const path = value.replace(/\\/g, "/").replace(/^\.\//, "").replace(/\/+$/, "");
	if (path.startsWith("/")) return void 0;
	for (const segment of path.split("/")) if (segment === "..") return void 0;
	return path;
}
/**
* One failure, as the page's error state words it.
*
* @param error - whatever the service threw.
* @returns the text the page draws.
*/
function messageOf(error) {
	if (error instanceof Error && error.message !== "") return error.message;
	return String(error);
}
/**
* The workspace's display name for the page's breadcrumb.
*
* The registry title is authoritative: a Workspace can be renamed, and the
* directory basename would then disagree with the name the sidebar shows. A
* composition without a registry, or a directory it has not registered, falls
* back to the root's own basename so the page still names the project instead
* of a generic word.
*
* @param ctx - the Host plugin context.
* @param root - the session's absolute workspace root.
* @returns the name to draw, or undefined when neither source has one.
*/
async function workspaceName(ctx, root) {
	const registry = ctx.get("workspaceRegistry");
	if (registry !== void 0 && typeof registry.resolveByPath === "function") try {
		const title = (await registry.resolveByPath(root))?.title;
		if (typeof title === "string" && title.trim() !== "") return title;
	} catch {}
	const base = root.split(/[\\/]/).filter((segment) => segment !== "").pop();
	return base === void 0 || base === "" ? void 0 : base;
}
/**
* The direct children of one workspace directory.
*
* @param ctx - the Host plugin context.
* @param sessionId - the session the page belongs to, when it named one.
* @param rawPath - the directory as a workspace path; empty or absent for the root.
* @returns the listing, or an `ok: false` answer.
*/
async function listDirectory(ctx, sessionId, rawPath) {
	const path = readPath(rawPath);
	if (path === void 0) return {
		ok: false,
		error: "The path must be a workspace-relative path"
	};
	const root = await resolveRoot(ctx, sessionId);
	if (root === void 0) return {
		ok: false,
		error: "This session has no working directory to browse"
	};
	const files = ctx.get("workspaceFiles");
	if (files === void 0) return {
		ok: false,
		error: "The workspace file service is not mounted"
	};
	const workspace = await workspaceName(ctx, root);
	try {
		const listing = await files.list(scopeOf(sessionId, root), path === "" ? "." : path, void 0);
		return {
			ok: true,
			path: typeof listing.path === "string" ? listing.path : path,
			root,
			...workspace === void 0 ? {} : { workspace },
			entries: listing.entries.map((entry) => ({
				name: String(entry.name),
				type: entry.type === "directory" || entry.type === "file" ? entry.type : "other",
				...typeof entry.size === "number" ? { size: entry.size } : {}
			})),
			truncated: listing.truncated === true
		};
	} catch (error) {
		return {
			ok: false,
			error: messageOf(error)
		};
	}
}
/**
* One page of one workspace text file.
*
* @param ctx - the Host plugin context.
* @param sessionId - the session the page belongs to, when it named one.
* @param rawPath - the file as a workspace path.
* @returns the page, or an `ok: false` answer.
*/
async function readFile(ctx, sessionId, rawPath) {
	const path = readPath(rawPath);
	if (path === void 0 || path === "") return {
		ok: false,
		error: "The path must name a workspace file"
	};
	const root = await resolveRoot(ctx, sessionId);
	if (root === void 0) return {
		ok: false,
		error: "This session has no working directory to browse"
	};
	const files = ctx.get("workspaceFiles");
	if (files === void 0) return {
		ok: false,
		error: "The workspace file service is not mounted"
	};
	try {
		const page = await files.read(scopeOf(sessionId, root), path, { limit: READ_LINES }, void 0);
		return {
			ok: true,
			path,
			text: page.text,
			lines: page.lines,
			eof: page.eof === true,
			...typeof page.bytes === "number" ? { bytes: page.bytes } : {}
		};
	} catch (error) {
		return {
			ok: false,
			error: messageOf(error)
		};
	}
}
// src/host/routes.ts
/**
* The Host half's HTTP surface.
*
* The browser half has no Cordis context and no remote namespace of its own, so
* every question it asks the Host crosses a same-origin route registered on the
* `webServer` carrier. Each route answers JSON and never rejects: a transport or
* service failure becomes an `{ ok: false }` result the page draws in its own
* error state.
*
* The Host stays authoritative about *which* workspace is browsed. A request may
* name the session it belongs to, but never a directory: the root is read from
* that session's own header, so a page cannot point the plugin at a tree the
* session does not own. Both routes are reads; this plugin exposes no write.
*/
/** Route table, kept in one place so the two halves cannot drift. */
const ROUTES = {
	list: "/dsh-cool-file/api/list",
	read: "/dsh-cool-file/api/read"
};
/** Longest request body a route accepts; both bodies are a path and an id. */
const MAX_BODY_BYTES = 16384;
function sendJson(res, status, body) {
	res.writeHead(status, {
		"content-type": "application/json; charset=utf-8",
		"cache-control": "no-store"
	});
	res.end(JSON.stringify(body));
}
/**
* Answer 405 unless the request uses one of the allowed methods.
*
* @returns true when the handler may proceed.
*/
function methodAllowed(req, res, allowed) {
	if (allowed.includes(req.method)) return true;
	sendJson(res, 405, {
		ok: false,
		error: "method not allowed"
	});
	return false;
}
/**
* Read a JSON object body, bounded before it is parsed.
*
* @param req - the incoming request.
* @returns the parsed body; `{}` for an empty one.
* @throws when the body is too large or is not a JSON object.
*/
async function readBody(req) {
	const chunks = [];
	let size = 0;
	for await (const chunk of req) {
		const buffer = Buffer.from(chunk);
		size += buffer.length;
		if (size > MAX_BODY_BYTES) throw new Error("body is too large");
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
* These routes expose a session's workspace to whoever can reach the server, so
* a page on another origin has no business asking. A same-origin `fetch` omits
* `Origin` on some requests, so an absent header is allowed.
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
/**
* Run one read and answer it as JSON.
*
* @param req - the incoming request.
* @param res - the response to write.
* @param run - the read, given the parsed body.
*/
async function handle(req, res, run) {
	if (!methodAllowed(req, res, ["POST"])) return;
	let body;
	try {
		body = await readBody(req);
	} catch (error) {
		sendJson(res, 400, {
			ok: false,
			error: error instanceof Error ? error.message : "bad request"
		});
		return;
	}
	sendJson(res, 200, await run(body));
}
/**
* Register both routes on the browser HTTP carrier.
*
* @param ctx - the Host plugin context.
* @returns the disposer that removes the routes with the plugin.
*/
function registerRoutes(ctx) {
	const server = ctx.get("webServer");
	if (server === void 0) return () => {};
	const guard = (handler) => (req, res) => {
		if (!sameOrigin(req)) {
			sendJson(res, 403, {
				ok: false,
				error: "cross-origin request refused"
			});
			return;
		}
		return handler(req, res);
	};
	const route = (path, handler) => server.register({
		kind: "exact",
		path,
		handler: guard(handler)
	});
	const disposers = [route(ROUTES.list, (req, res) => handle(req, res, (body) => listDirectory(ctx, body.sessionId, body.path))), route(ROUTES.read, (req, res) => handle(req, res, (body) => readFile(ctx, body.sessionId, body.path)))];
	return () => {
		for (const dispose of disposers) dispose();
	};
}
// src/host/index.ts
/**
* Host entry for dsh-cool-file.
*
* The browser half owns the Files tab's rendering; this half owns the answer to
* "what is in this session's workspace". Every read crosses a same-origin HTTP
* route served by the `webServer` carrier, because an out-of-tree bundle cannot
* generate a `ctx.remote` namespace and its Client half never sees the Host
* Cordis context.
*
* The routed reads go through the composed `workspaceFiles` service rather than
* touching `node:fs`: that service already resolves paths against the session's
* own workspace root, confines directory listings to it, decodes text, and
* refuses binary or oversized pages. This plugin therefore adds no filesystem
* authority of its own.
*/
const name = "dsh-cool-file";
/** The web carrier is a hard dependency: without it there is no route to serve. */
const inject = ["webServer"];
function apply(ctx) {
	ctx.effect(() => registerRoutes(ctx), "dsh-cool-file: routes");
}
export { ROUTES, apply, inject, name };
