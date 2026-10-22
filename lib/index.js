import { lstat, realpath, rm } from "node:fs/promises";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
//#region src/host/refusal.ts
/**
* One coded refusal, shaped as a payload carries it.
*
* @param code - the refusal, whose sentence the page owns.
* @param params - the values that sentence interpolates, when it has any.
* @returns the payload fragment to spread into an `ok: false` answer.
*/
function coded(code, params) {
	return { failure: params === void 0 ? { code } : {
		code,
		params
	} };
}
//#endregion
//#region src/host/deletion.ts
/**
* On-disk Session deletion, including the subagent Sessions beneath one root.
*
* DSH exposes no deletion command of its own, so this Host module treats the
* Session artifact as the unit of removal. It first stops whatever the Session
* still runs, retires the live Session entry, and only then removes the
* header-verified directory. Paths never come from the request: every directory
* is derived from the persistence backend's own `locate()` answer and checked
* to be exactly one Session directory below the configured root.
*
* The operation is intentionally fail-closed. A descendant scan that cannot be
* completed, a directory that leaves the root, a symlink, an artifact whose
* header names another Session, or a Session that cannot be retired all abort
* the delete before the first `rm`. A failure after some descendants were
* already removed is reported as `delete-partial`, with the remaining ids.
*/
/** Bound on one Agent teardown before the Session is considered still live. */
const STOP_TIMEOUT_MS = 3e3;
/** Window allowed for the persistence writer to finish after a Session detach. */
const RETIRE_WAIT_MS = 200;
/** One coded deletion refusal thrown inside this module. */
var DeleteError = class extends Error {
	failure;
	constructor(code, params, message) {
		super(message ?? code);
		this.name = "DeleteError";
		this.failure = params === void 0 ? { code } : {
			code,
			params
		};
	}
};
function sleep(ms) {
	return new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
}
/**
* Turn an arbitrary service failure into the payload's `failure` / `error` pair.
*
* A coded refusal is worded by the page. Raw text stays raw because it belongs
* to DSH, not to this plugin's dictionaries. The one exception is a generic
* delete failure, where the service's own message is the useful diagnostic.
*
* @param error - what the service threw.
* @param fallback - the code to use when the error carries no known identity.
* @returns the failure fragment to spread into an `ok: false` answer.
*/
function failureOf(error, fallback) {
	if (error instanceof DeleteError) return error.failure.code === "delete-failed" ? { error: error.message } : { failure: error.failure };
	const name = error?.name;
	if (name === "WorkspaceActiveSessionError") {
		const kinds = (error.activity ?? []).map((entry) => typeof entry?.kind === "string" ? entry.kind : "").filter((kind) => kind !== "");
		return { failure: {
			code: "delete-active",
			...kinds.length === 0 ? {} : { params: { activity: kinds.join(", ") } }
		} };
	}
	if (name === "WorkspaceUnknownSessionError") return { failure: { code: "unknown-session" } };
	if (error?.code === "session/not-found") return { failure: { code: "unknown-session" } };
	const message = error instanceof Error ? error.message : String(error);
	return message === "" ? { failure: { code: fallback } } : { error: message };
}
/**
* Read every header this Host can name, live or persisted.
*
* @param ctx - the Host plugin context.
* @returns the persistence backend and the id-to-header lookup.
*/
async function readHeaders(ctx) {
	const persistence = ctx.get("sessionPersistence");
	if (persistence === void 0 || typeof persistence.list !== "function" || typeof persistence.locate !== "function") throw new DeleteError("delete-unsupported", void 0, "the mounted persistence backend cannot locate Session artifacts");
	const headers = /* @__PURE__ */ new Map();
	let snapshots;
	try {
		snapshots = await persistence.list();
	} catch (error) {
		throw new DeleteError("delete-failed", void 0, `could not list Session artifacts: ${error instanceof Error ? error.message : String(error)}`);
	}
	for (const item of Array.isArray(snapshots) ? snapshots : []) {
		const header = item?.header ?? item;
		if (typeof header?.id === "string") headers.set(header.id, {
			id: header.id,
			header
		});
	}
	const live = ctx.get("sessions")?.list?.();
	for (const session of Array.isArray(live) ? live : []) {
		const header = session?.header;
		if (typeof header?.id === "string") headers.set(header.id, {
			id: header.id,
			header
		});
	}
	return {
		persistence,
		headers
	};
}
/** Flatten one Session-query descendant tree into its Session ids. */
function flattenDescendants(nodes) {
	const ids = [];
	const visit = (list) => {
		for (const node of Array.isArray(list) ? list : []) {
			const header = node?.session?.header ?? node?.header;
			if (typeof header?.id === "string") ids.push(header.id);
			visit(node?.descendants);
		}
	};
	visit(nodes);
	return ids;
}
/**
* Collect every subagent descendant of one root.
*
* `sessionQuery.traceSession` is the authoritative relationship trace when the
* composition mounts it; the header parent pointers cover the same tree when it
* does not. Both are unioned so a live child absent from one source is still
* included.
*
* @param ctx - the Host plugin context.
* @param rootId - the Session whose tree is wanted.
* @param headers - the header lookup.
* @returns descendant ids, excluding the root.
*/
async function collectDescendants(ctx, rootId, headers) {
	const ids = /* @__PURE__ */ new Set();
	const query = ctx.get("sessionQuery");
	if (query !== void 0 && typeof query.traceSession === "function") {
		let lineage;
		try {
			lineage = await query.traceSession(rootId);
		} catch (error) {
			throw new DeleteError("delete-failed", void 0, `could not trace Session descendants: ${error instanceof Error ? error.message : String(error)}`);
		}
		for (const id of flattenDescendants(lineage?.descendants)) {
			if (id === rootId) continue;
			if (headers.get(id)?.header?.origin === "subagent" && descendsFrom(id, rootId, headers)) ids.add(id);
		}
	}
	const byParent = /* @__PURE__ */ new Map();
	for (const { id, header } of headers.values()) {
		if (header?.origin !== "subagent" || typeof header?.parentSession !== "string") continue;
		const children = byParent.get(header.parentSession) ?? [];
		children.push(id);
		byParent.set(header.parentSession, children);
	}
	const queue = [rootId];
	const seen = /* @__PURE__ */ new Set([rootId]);
	while (queue.length > 0) {
		const parent = queue.shift();
		for (const child of byParent.get(parent) ?? []) {
			if (seen.has(child)) continue;
			seen.add(child);
			ids.add(child);
			queue.push(child);
		}
	}
	ids.delete(rootId);
	return [...ids];
}
/** Whether one header's parent chain reaches the given root. */
function descendsFrom(id, rootId, headers) {
	let current = headers.get(id)?.header;
	const seen = /* @__PURE__ */ new Set();
	while (typeof current?.parentSession === "string" && !seen.has(current.parentSession)) {
		if (current.parentSession === rootId) return true;
		seen.add(current.parentSession);
		current = headers.get(current.parentSession)?.header;
	}
	return false;
}
/** Distance from a Session to the root, used to delete leaves before parents. */
function depthOf(id, headers) {
	let depth = 0;
	let current = headers.get(id)?.header;
	const seen = /* @__PURE__ */ new Set();
	while (typeof current?.parentSession === "string" && !seen.has(current.parentSession)) {
		seen.add(current.parentSession);
		depth += 1;
		current = headers.get(current.parentSession)?.header;
	}
	return depth;
}
/** DSH's on-disk session directory encoding, mirroring the JSONL backend. */
function encodeSegment(raw) {
	if (raw === ".") return "~002E";
	if (raw === "..") return "~002E~002E";
	let out = "";
	for (let index = 0; index < raw.length; index += 1) {
		const code = raw.charCodeAt(index);
		const character = String.fromCharCode(code);
		out += character !== "~" && /^[A-Za-z0-9._-]$/u.test(character) ? character : `~${code.toString(16).toUpperCase().padStart(4, "0")}`;
	}
	return out;
}
/**
* Resolve and verify one Session's artifact directory.
*
* The directory is exactly `<root>/<project>/<session-directory>`; the session
* directory must name this Session, every component must be a real directory
* (never a symlink or junction), and its real path must stay below the real
* root. A missing artifact returns `undefined` so a blank Session can still be
* retired without inventing a path.
*
* @param persistence - the mounted persistence backend.
* @param header - the Session header whose artifact is wanted.
* @returns the verified directory, or undefined when no artifact was written.
*/
async function sessionDirectory(persistence, header) {
	let located;
	try {
		located = persistence.locate(header);
	} catch (error) {
		throw new DeleteError("delete-unsupported", void 0, `could not locate the Session artifact: ${error instanceof Error ? error.message : String(error)}`);
	}
	if (typeof located?.path !== "string" || located.path === "") return void 0;
	const target = resolve(dirname(located.path));
	const root = typeof persistence.root === "string" ? resolve(persistence.root) : resolve(target, "..", "..");
	let base;
	try {
		base = await realpath(root);
	} catch {
		base = root;
	}
	const rel = relative(root, target);
	const parts = rel.split(sep).filter((part) => part !== "");
	const encoded = encodeSegment(header.id);
	if (isAbsolute(rel) || parts.length !== 2 || parts.some((part) => part === "." || part === "..") || parts[1] !== header.id && parts[1] !== encoded) throw new DeleteError("delete-unsupported", void 0, "the Session artifact lies outside the allowed directory");
	let current = root;
	try {
		for (const part of parts) {
			current = join(current, part);
			const info = await lstat(current);
			if (info.isSymbolicLink() || !info.isDirectory()) throw new DeleteError("delete-unsupported", void 0, "the Session artifact directory is not a real directory");
			const canonical = await realpath(current);
			const child = relative(base, canonical);
			if (isAbsolute(child) || child === "" || child.split(sep).includes("..")) throw new DeleteError("delete-unsupported", void 0, "the Session artifact resolves outside the allowed directory");
		}
	} catch (error) {
		if (error?.code === "ENOENT") return void 0;
		throw error;
	}
	return target;
}
/** Read the activity families the workspace registry publishes for one Session. */
async function sessionActivity(ctx, id) {
	if (typeof ctx.waterfall !== "function") return [];
	try {
		const answer = await ctx.waterfall("workspace/session-activity", { sessionId: id }, () => Promise.resolve([]));
		return Array.isArray(answer) ? answer : [];
	} catch (error) {
		throw new DeleteError("delete-failed", void 0, `could not inspect the Session's activity: ${error instanceof Error ? error.message : String(error)}`);
	}
}
/** A human-readable activity list for a refusal sentence. */
function activityText(activities) {
	const kinds = activities.map((entry) => typeof entry?.kind === "string" ? entry.kind : "").filter((kind) => kind !== "");
	return kinds.length === 0 ? "running work" : kinds.join(", ");
}
/**
* Stop whatever one Session still runs, or refuse when it cannot be stopped.
*
* The user-facing policy is stop-then-delete: a running turn, subagent, job, or
* reminder is cancelled first. The Session is re-inspected afterwards; if the
* work survived the stop request, the deletion aborts before any file changes.
*
* @param ctx - the Host plugin context.
* @param id - the Session to quiesce.
*/
async function stopSession(ctx, id) {
	const sessions = ctx.get("sessions");
	const agents = ctx.get("agents");
	const session = sessions?.get?.(id);
	const agent = agents?.get?.(id);
	const activities = await sessionActivity(ctx, id);
	const activeTurn = session?.activeTurn !== void 0;
	const running = agent?.status === "running" || agent?.busy === true;
	if (!activeTurn && !running && activities.length === 0) return;
	const registry = ctx.get("workspaceRegistry");
	if (!(typeof agent?.cancel === "function" || typeof agent?.scope?.dispose === "function" || typeof registry?.stopSessionActivity === "function" || typeof ctx.parallel === "function")) throw new DeleteError("delete-active", { activity: activityText(activities) }, "the Session is active and this Host exposes no stop interface");
	try {
		if (typeof agent?.cancel === "function") agent.cancel({ kind: "disposed" });
		if (typeof agent?.scope?.dispose === "function") await Promise.race([agent.scope.dispose(), sleep(STOP_TIMEOUT_MS)]);
		else if (typeof agent?.whenIdle === "function") await Promise.race([agent.whenIdle(), sleep(STOP_TIMEOUT_MS)]);
	} catch {}
	try {
		if (typeof registry?.stopSessionActivity === "function") await registry.stopSessionActivity(id);
		else if (typeof ctx.parallel === "function") await ctx.parallel("workspace/session-stop", { sessionId: id });
	} catch (error) {
		throw new DeleteError("delete-active", { activity: activityText(activities) }, `could not stop the Session's work: ${error instanceof Error ? error.message : String(error)}`);
	}
	await sleep(250);
	const afterAgent = agents?.get?.(id);
	const afterSession = sessions?.get?.(id);
	if (afterAgent?.status === "running" || afterAgent?.busy === true || afterSession?.activeTurn !== void 0) throw new DeleteError("delete-active", { activity: activityText(activities) }, "the Session is still active after the stop request");
	const remainingActivity = await sessionActivity(ctx, id);
	if (remainingActivity.length > 0) throw new DeleteError("delete-active", { activity: activityText(remainingActivity) }, "the Session still has reported activity after the stop request");
}
/**
* Retire one live Session and its Agent, then make sure neither survives.
*
* A cold Session still gets a `session/disposed` notification so every connected
* client drops its row; a live one is flushed and detached through its store
* entry, which is the path that also closes the persistence writer.
*
* @param ctx - the Host plugin context.
* @param id - the Session to retire.
*/
async function retireSession(ctx, id) {
	const sessions = ctx.get("sessions");
	const agents = ctx.get("agents");
	const agent = agents?.get?.(id);
	if (agent !== void 0) {
		try {
			if (typeof agent.cancel === "function") agent.cancel({ kind: "disposed" });
			if (typeof agent.scope?.dispose === "function") await Promise.race([agent.scope.dispose(), sleep(STOP_TIMEOUT_MS)]);
		} catch {}
		try {
			agents.store?.delete?.(id);
		} catch {}
	}
	const session = sessions?.get?.(id);
	let detached = false;
	if (session !== void 0) {
		try {
			if (typeof sessions.flush === "function") await sessions.flush(session);
		} catch {}
		const entry = sessions.store?.get?.(id);
		if (entry !== void 0 && typeof entry.detach === "function") try {
			entry.detach();
			detached = true;
			await sleep(RETIRE_WAIT_MS);
		} catch {
			detached = false;
		}
	}
	if (!detached) try {
		ctx.emit?.("session/disposed", { id });
	} catch {}
	if (sessions?.get?.(id) !== void 0 || agents?.get?.(id) !== void 0) throw new DeleteError("session-live", void 0, "the Session is still live after its teardown");
}
/** Remove one Session from Workspace accounting, the archive set, and the pin set. */
async function cleanupRegistry(ctx, id, warnings) {
	const registry = ctx.get("workspaceRegistry");
	if (registry === void 0) return;
	try {
		for (const entity of registry.list?.() ?? []) {
			const recordIds = entity?.record?.sessionIds;
			const ids = Array.isArray(recordIds) ? recordIds : entity?.sessionIds;
			if (Array.isArray(ids) && ids.includes(id) && typeof entity.detachSession === "function") try {
				await entity.detachSession(id);
			} catch (error) {
				warnings.push(`Workspace membership cleanup failed for ${id}: ${error instanceof Error ? error.message : String(error)}`);
			}
		}
	} catch (error) {
		warnings.push(`Workspace cleanup failed for ${id}: ${error instanceof Error ? error.message : String(error)}`);
	}
	try {
		if (typeof registry.unarchiveSession === "function") await registry.unarchiveSession(id);
	} catch (error) {
		warnings.push(`Archive cleanup failed for ${id}: ${error instanceof Error ? error.message : String(error)}`);
	}
	try {
		if (typeof registry.unpinSession === "function") await registry.unpinSession(id);
	} catch (error) {
		warnings.push(`Pin cleanup failed for ${id}: ${error instanceof Error ? error.message : String(error)}`);
	}
}
/**
* Delete one Session and every subagent Session beneath it.
*
* @param ctx - the Host plugin context.
* @param sessionId - the root Session to delete.
* @returns the deletion summary, or one coded refusal.
*/
async function deleteSession(ctx, sessionId) {
	try {
		if (sessionId === "") throw new DeleteError("missing-session");
		const { persistence, headers } = await readHeaders(ctx);
		const target = headers.get(sessionId);
		if (target === void 0) throw new DeleteError("unknown-session");
		if (target.header?.origin === "subagent") throw new DeleteError("subagent-delete");
		const descendants = await collectDescendants(ctx, sessionId, headers);
		for (const id of descendants) if (!headers.has(id)) throw new DeleteError("delete-failed", void 0, `cannot resolve the descendant Session '${id}'`);
		const orderedDescendants = [...descendants].sort((left, right) => depthOf(right, headers) - depthOf(left, headers));
		const stopOrder = [...orderedDescendants, sessionId];
		const directories = /* @__PURE__ */ new Map();
		for (const id of stopOrder) {
			const header = headers.get(id)?.header;
			directories.set(id, header === void 0 ? void 0 : await sessionDirectory(persistence, header));
		}
		for (const id of stopOrder) await stopSession(ctx, id);
		const deleteOrder = [...orderedDescendants, sessionId];
		const deleted = [];
		const warnings = [];
		let filesRemoved = false;
		for (let index = 0; index < deleteOrder.length; index += 1) {
			const id = deleteOrder[index];
			try {
				await retireSession(ctx, id);
				const header = headers.get(id)?.header;
				const directory = directories.get(id) ?? (header === void 0 ? void 0 : await sessionDirectory(persistence, header));
				if (directory !== void 0) try {
					await rm(directory, {
						recursive: true,
						force: true
					});
					filesRemoved = true;
				} catch (error) {
					throw new DeleteError("delete-failed", void 0, `could not remove the Session artifact: ${error instanceof Error ? error.message : String(error)}`);
				}
				await cleanupRegistry(ctx, id, warnings);
				deleted.push(id);
			} catch (error) {
				const refusal = failureOf(error, "delete-failed");
				const remaining = deleteOrder.slice(index);
				if (deleted.length === 0) return {
					ok: false,
					...refusal,
					sessionId,
					deletedSessions: deleted,
					deletedSubagents: [],
					remainingSessions: remaining,
					filesRemoved,
					...warnings.length === 0 ? {} : { warnings }
				};
				const detail = refusal.error ?? (error instanceof Error && error.message !== "" ? error.message : void 0) ?? (refusal.failure === void 0 ? void 0 : `failure: ${refusal.failure.code}`);
				return {
					ok: false,
					failure: {
						code: "delete-partial",
						params: {
							deleted: deleted.length,
							remaining: remaining.length
						}
					},
					...detail === void 0 ? {} : { error: detail },
					sessionId,
					deletedSessions: deleted,
					deletedSubagents: deleted.filter((deletedId) => deletedId !== sessionId),
					remainingSessions: remaining,
					filesRemoved,
					...warnings.length === 0 ? {} : { warnings }
				};
			}
		}
		try {
			ctx.logger?.info?.(`dsh-cool-session: deleted ${deleted.length} Session artifact(s): ${deleted.join(", ")}`);
		} catch {}
		return {
			ok: true,
			sessionId,
			deletedSessions: deleted,
			deletedSubagents: deleted.filter((deletedId) => deletedId !== sessionId),
			filesRemoved,
			...warnings.length === 0 ? {} : { warnings }
		};
	} catch (error) {
		return {
			ok: false,
			...failureOf(error, "delete-failed"),
			sessionId
		};
	}
}
//#endregion
//#region src/host/routes.ts
/**
* The Host half's HTTP surface.
*
* The browser half has no Cordis context and no remote namespace of its own, so
* the one destructive command crosses a same-origin route registered on the
* `webServer` carrier. The route answers JSON and never rejects: a transport,
* service, or filesystem failure becomes an `{ ok: false }` result the dialog
* reports in place.
*
* The Host stays authoritative about *what* is deleted. A request names a
* Session id but never a directory or an Agent: the artifact path is derived and
* verified by `deletion.ts`, never by the caller. That keeps the page a
* management surface over DSH's own state rather than a second source of truth.
*/
/** Route table, kept in one place so the two halves cannot drift. */
const ROUTES = { delete: "/dsh-cool-session/api/delete" };
/** Longest Session id a route will accept; DSH ids are far shorter. */
const MAX_SESSION_ID_LENGTH = 200;
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
async function readBody(req) {
	const chunks = [];
	for await (const chunk of req) chunks.push(Buffer.from(chunk));
	const text = Buffer.concat(chunks).toString("utf8");
	if (text === "") return {};
	const parsed = JSON.parse(text);
	if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("body must be a JSON object");
	return parsed;
}
/**
* Reject a cross-site request.
*
* This route can destroy a Session, so a page on another origin has no business
* asking. A same-origin `fetch` omits `Origin` on some requests, so an absent
* header is allowed.
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
* Read one request's Session id.
*
* The id names a Session, not a path or a command, so the shape checked here is
* only what can be passed back to DSH at all.
*
* @param body - the parsed request body.
* @returns the id, or undefined when the body names none.
*/
function readSessionId(body) {
	const sessionId = body.sessionId;
	if (typeof sessionId !== "string" || sessionId === "" || sessionId.length > MAX_SESSION_ID_LENGTH) return;
	return sessionId;
}
/**
* Run one JSON route body.
*
* Every route repeats the same three steps — method, body, handler — so they are
* taken once here and the route only supplies its own work. A malformed body is
* a 400; everything later is a 200 carrying `ok: false`, because a service's own
* refusal is an answer the page should show, not an HTTP error.
*
* @param ctx - the Host plugin context.
* @param req - the incoming request.
* @param res - the response to write.
* @param run - the route's own work, given the parsed body.
*/
async function handle(ctx, req, res, run) {
	if (!methodAllowed(req, res, ["POST"])) return;
	let body;
	try {
		body = await readBody(req);
	} catch (error) {
		sendJson(res, 400, {
			ok: false,
			error: error instanceof Error ? error.message : String(error)
		});
		return;
	}
	try {
		sendJson(res, 200, await run(body));
	} catch (error) {
		sendJson(res, 200, {
			ok: false,
			error: error instanceof Error ? error.message : String(error)
		});
	}
}
/**
* Serve the deletion route for one plugin instance.
*
* @param ctx - the Host plugin context.
* @returns a disposer that unregisters exactly this route.
*/
function registerRoutes(ctx) {
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
	const route = (path, handler) => ctx.webServer.register({
		kind: "exact",
		path,
		handler: guard(handler)
	});
	const disposers = [route(ROUTES.delete, (req, res) => handle(ctx, req, res, (body) => {
		const sessionId = readSessionId(body);
		if (sessionId === void 0) return Promise.resolve({
			ok: false,
			...coded("missing-session")
		});
		return deleteSession(ctx, sessionId);
	}))];
	return () => {
		for (const dispose of disposers) dispose();
	};
}
//#endregion
//#region src/host/index.ts
/**
* Host entry for dsh-cool-session.
*
* The browser half owns the native Session-menu row and its confirmation; this
* half owns the one destructive artifact operation behind that confirmation.
* Every question the page asks crosses a same-origin HTTP route served by the
* `webServer` carrier, because an out-of-tree bundle cannot generate a
* `ctx.remote` namespace and its Client half never sees the Host Cordis context.
*
* The Session and Agent capabilities are read per request rather than declared
* as hard dependencies: a composition without them still loads the plugin and
* answers one clear refusal instead of failing the menu row.
*/
const name = "dsh-cool-session";
/** The web carrier is a hard dependency: without it there is no route to serve. */
const inject = ["webServer"];
function apply(ctx) {
	ctx.effect(() => registerRoutes(ctx), "dsh-cool-session: session routes");
}
//#endregion
export { ROUTES, apply, inject, name };
