import { join } from "node:path";
// src/shared/kinds.ts
/**
* What kind of preview one workspace path earns.
*
* Both halves read this table. The browser half asks it which pane to draw, and
* the Host half asks it which paths its raw-bytes route may answer — so the set
* of files the page can display as an image and the set the server will send as
* an image are one list, not two tables that can drift.
*
* A path not in either table is text: the preview reads its lines and colours
* them, and the editor may write it back. Nothing here reads the file itself —
* a kind is decided by the name the workspace already gave it, which is what
* keeps the decision available before a byte is requested.
*/
/** Where the Host serves a workspace file's raw bytes. */
const RAW_ROUTE = "/dsh-cool-file/api/raw";
/**
* Largest image the preview will serve, in bytes.
*
* Both halves need it: the Host refuses to send more, and the page can tell a
* reader that a picture is over the cap before it asks for one. It is generous
* because a photograph or a screenshot routinely passes the editor's 2 MiB limit.
*/
const IMAGE_MAX_BYTES = 25165824;
/**
* Media type per image extension, the only extensions the raw route answers.
*
* Every entry is a format this page's browsers decode. TIFF is deliberately
* absent even though it is an image: no browser renders one, so listing it would
* only offer a reader a pane that can never fill — and, worse, would deny them the
* source view that is the only thing they could actually read. ICO stays because
* Chromium and WebKit both decode it.
*/
const IMAGE_MEDIA_TYPES = {
	apng: "image/apng",
	avif: "image/avif",
	bmp: "image/bmp",
	gif: "image/gif",
	ico: "image/x-icon",
	jpe: "image/jpeg",
	jpeg: "image/jpeg",
	jpg: "image/jpeg",
	png: "image/png",
	svg: "image/svg+xml",
	webp: "image/webp"
};
/**
* The extension of a workspace path, lower-cased and without its dot.
*
* @param path - a `/`-joined workspace path.
* @returns the final segment's extension, or '' when it has none.
*/
function extensionOf(path) {
	const name = path.slice(path.lastIndexOf("/") + 1).toLowerCase();
	const dot = name.lastIndexOf(".");
	return dot <= 0 ? "" : name.slice(dot + 1);
}
/**
* The media type the raw route should answer for one path.
*
* @param path - a `/`-joined workspace path.
* @returns the image media type, or undefined when the path is not an image.
*/
function imageMediaTypeOf(path) {
	return IMAGE_MEDIA_TYPES[extensionOf(path)];
}
// src/host/gitignore.ts
/**
* Which listed children the workspace's own ignore rules leave out.
*
* A project's `.gitignore` is the author's statement about the tree: it says
* which paths are generated, vendored, or private. The Files tab still lists
* them — the tab shows what the disk holds — but a row the project has excluded
* is drawn one step quieter, so the tree reads the way the repository does.
*
* The rules are Git's, so Git is what answers: `check-ignore` already resolves
* the whole chain a hand-rolled matcher would have to reimplement — nested
* `.gitignore` files, `.git/info/exclude`, the global excludes file, `.ignore`,
* negations, and directory-only patterns — and it answers a whole level in one
* run. A tracked file that happens to match a pattern is *not* ignored by Git,
* and `check-ignore` reports exactly that without `--no-index`, which is the
* reading wanted here: an entry the repository tracks is part of the project
* whatever a pattern says.
*
* Like the hidden-mark probe, this is best-effort. A directory outside any
* repository, a host without Git, and a run that fails all leave the level
* undimmed rather than guessed at: a quieter row is a hint, and a hint is not
* worth an error state or a second implementation of Git's matcher.
*/
/** Largest stdin one run may carry; a level's names, NUL-joined. */
const MAX_STDIN_BYTES = 131072;
/** Largest stdout one run may collect; one NUL-terminated name per match. */
const MAX_STDOUT_BYTES = 262144;
/** Largest stderr one run may collect; a diagnosis is one short line. */
const MAX_STDERR_BYTES = 8192;
/** How long a killed run may take to settle before its result is ignored. */
const GRACE_MS = 1e3;
/** How long one run may take before it is killed. */
const TIMEOUT_MS = 3e3;
/**
* Environment every run gets.
*
* `GIT_OPTIONAL_LOCKS` keeps a read-only question from touching the index, and
* the prompt pin turns an unexpected credential request into a failed run rather
* than a hung one — nothing here can answer a prompt. Colour is irrelevant to a
* `-z` answer but costs nothing to pin.
*/
const GIT_ENV = {
	NO_COLOR: "1",
	GIT_OPTIONAL_LOCKS: "0",
	GIT_TERMINAL_PROMPT: "0"
};
/**
* The names of one level that the workspace's ignore rules exclude.
*
* @param ctx - the Host plugin context.
* @param directory - the absolute directory the listing answered for.
* @param names - the level's child names, in listing order.
* @returns the ignored names; empty when no rule, no repository, or no Git can answer.
*/
async function ignoredNames(ctx, directory, names) {
	const wanted = names.filter((name) => name !== "");
	if (wanted.length === 0) return /* @__PURE__ */ new Set();
	const sent = [];
	let bytes = 0;
	for (const name of wanted) {
		const size = Buffer.byteLength(name, "utf8") + 1;
		if (bytes + size > MAX_STDIN_BYTES) break;
		sent.push(name);
		bytes += size;
	}
	if (sent.length === 0) return /* @__PURE__ */ new Set();
	const reported = await runCheckIgnore(ctx, directory, `${sent.join("\0")}\0`);
	if (reported === void 0) return /* @__PURE__ */ new Set();
	const wantedSet = new Set(sent);
	const ignored = /* @__PURE__ */ new Set();
	for (const name of reported) if (wantedSet.has(name)) ignored.add(name);
	return ignored;
}
/**
* Run `git check-ignore` over one level and read the names it reported.
*
* Exit `0` means at least one name matched, `1` means none did; both are ordinary
* answers. Anything else — most commonly `128` for a directory outside any
* repository — leaves the level unmarked.
*
* @param ctx - the Host plugin context.
* @param directory - the absolute directory the run is made against.
* @param input - the NUL-joined names, terminated by a NUL.
* @returns the reported names, or undefined when Git could not answer.
*/
async function runCheckIgnore(ctx, directory, input) {
	const subprocess = ctx.get("subprocess");
	if (subprocess === void 0 || typeof subprocess.spawn !== "function") return void 0;
	let handle;
	try {
		handle = subprocess.spawn({
			argv: [
				"git",
				"check-ignore",
				"--stdin",
				"-z"
			],
			cwd: directory,
			stdio: {
				stdin: { data: input },
				stdout: { maxBytes: MAX_STDOUT_BYTES },
				stderr: { maxBytes: MAX_STDERR_BYTES }
			},
			graceMs: GRACE_MS,
			env: GIT_ENV
		});
	} catch {
		return;
	}
	const readers = handle?.collected;
	if (typeof handle?.done?.then !== "function" || readers === void 0) {
		try {
			handle?.terminate?.();
		} catch {}
		return;
	}
	const timer = setTimeout(() => {
		try {
			handle.terminate();
		} catch {}
	}, TIMEOUT_MS);
	try {
		if ((await handle.done)?.exitCode !== 0) return void 0;
		const read = typeof readers.stdout?.readFrom === "function" ? readers.stdout.readFrom(0) : void 0;
		if (read?.lossy === true || typeof read?.text !== "string") return void 0;
		return read.text.split("\0").filter((name) => name !== "");
	} catch {
		return;
	} finally {
		clearTimeout(timer);
	}
}
// src/host/hidden.ts
/**
* Which listed children the host platform itself treats as hidden.
*
* A dot-prefixed name is the POSIX convention, and it is the only "hidden" mark
* a plain directory read carries: neither Node's dirents nor the filesystem
* service's listing exposes a platform visibility bit, so a name has to be
* judged here rather than read off the entry. Two judgements are combined — the
* convention, and a probe of the platform's own hidden mark — and the union is
* what the page filters on:
*
* - Linux and every other system with no attribute to ask about: a leading `.`
*   is the convention, and it is the whole answer.
* - macOS: the Finder's invisible mark is the `UF_HIDDEN` flag (which is also
*   what `chflags hidden` and `SetFile -a V` set), and it is not part of a
*   `readdir` answer. One `find -flags hidden` over the listed level reports
*   those names.
* - Windows: the hidden attribute is `FILE_ATTRIBUTE_HIDDEN`, which dirents drop
*   as well; `attrib` reports it per child.
*
* The probe is best-effort by construction. A host without a process substrate,
* a platform with no attribute worth asking about, and a probe that exits
* non-zero all leave the convention in charge, so the page never draws a folder
* differently just because a helper process could not run. Nothing here throws:
* a visibility hint is not worth failing a listing over.
*/
/** Largest stdout one probe may collect; a level's hidden names are short. */
const PROBE_MAX_BYTES = 65536;
/** Largest stderr one probe may collect; a diagnosis is one short line. */
const PROBE_STDERR_BYTES = 8192;
/** How long a killed probe may take to settle before its result is ignored. */
const PROBE_GRACE_MS = 1e3;
/** How long one probe may run before it is killed. */
const PROBE_TIMEOUT_MS = 1500;
/**
* Whether a name carries the POSIX hidden mark.
*
* @param name - the basename of one listed child.
* @returns true for a dot-prefixed name.
*/
function isHiddenName(name) {
	return name.startsWith(".");
}
/**
* The probes that answer for this host, if any.
*
* The `find` output is NUL-delimited and relative to the probe's own working
* directory, so a name holding a newline or a space needs no quoting and no
* shell sits between this module and the answer. `attrib` insists on printing
* whole paths, so its mask is made absolute and the name is read back off that
* prefix rather than off a column position — the tool's column widths vary with
* the attributes present.
*
* @param platform - the Host's own `process.platform`.
* @returns the probes to run, in order; empty when the platform has none.
*/
function probesFor(platform) {
	if (platform === "darwin") return [{
		argv: () => [
			"/usr/bin/find",
			".",
			"-mindepth",
			"1",
			"-maxdepth",
			"1",
			"-flags",
			"hidden",
			"-print0"
		],
		parse: (stdout) => stdout.split("\0").filter((line) => line.startsWith("./")).map((line) => line.slice(2))
	}];
	if (platform === "win32") {
		/**
		* Read `attrib`'s rows for one directory.
		*
		* A row is `<attribute letters><spaces><absolute path>`; the letters are
		* everything before the directory prefix this run was given, and `H` among
		* them is the hidden attribute. A name that itself contains the prefix or an
		* `H` is never misread, because only the letters column is scanned.
		*/
		const parse = (stdout, directory) => {
			const prefix = directory.endsWith("\\") ? directory : `${directory}\\`;
			const names = [];
			for (const line of stdout.split(/\r?\n/)) {
				if (line.trim() === "") continue;
				const at = line.indexOf(prefix);
				if (at === -1) continue;
				if (!line.slice(0, at).toUpperCase().includes("H")) continue;
				const name = line.slice(at + prefix.length).trim();
				if (name !== "") names.push(name);
			}
			return names;
		};
		return [{
			argv: (directory) => ["attrib", `${directory}\\*`],
			parse
		}, {
			argv: (directory) => [
				"attrib",
				`${directory}\\*`,
				"/d"
			],
			parse
		}];
	}
	return [];
}
/**
* Run one probe and read the names it reported.
*
* @param ctx - the Host plugin context.
* @param directory - the absolute directory the probe runs in.
* @param probe - the invocation to make.
* @returns the reported names, or undefined when the probe could not answer.
*/
async function runProbe(ctx, directory, probe) {
	const subprocess = ctx.get("subprocess");
	if (subprocess === void 0 || typeof subprocess.spawn !== "function") return void 0;
	let handle;
	try {
		handle = subprocess.spawn({
			argv: [...probe.argv(directory)],
			cwd: directory,
			stdio: {
				stdin: "ignore",
				stdout: { maxBytes: PROBE_MAX_BYTES },
				stderr: { maxBytes: PROBE_STDERR_BYTES }
			},
			graceMs: PROBE_GRACE_MS
		});
	} catch {
		return;
	}
	const readers = handle?.collected;
	if (typeof handle?.done?.then !== "function" || readers === void 0) {
		try {
			handle?.terminate?.();
		} catch {}
		return;
	}
	const timer = setTimeout(() => {
		try {
			handle.terminate();
		} catch {}
	}, PROBE_TIMEOUT_MS);
	try {
		const outcome = await handle.done;
		if (typeof outcome?.exitCode !== "number" || outcome.exitCode !== 0) return void 0;
		const read = typeof readers.stdout?.readFrom === "function" ? readers.stdout.readFrom(0) : void 0;
		if (read?.lossy === true || typeof read?.text !== "string") return void 0;
		return probe.parse(read.text, directory);
	} catch {
		return;
	} finally {
		clearTimeout(timer);
	}
}
/**
* The names of one directory level that the platform itself marks hidden.
*
* @param ctx - the Host plugin context.
* @param directory - the absolute directory the listing answered for.
* @returns the hidden basenames; empty when no probe can answer.
*/
async function platformHiddenNames(ctx, directory) {
	const probes = probesFor(process.platform);
	if (probes.length === 0) return /* @__PURE__ */ new Set();
	const names = /* @__PURE__ */ new Set();
	for (const probe of probes) {
		const reported = await runProbe(ctx, directory, probe);
		if (reported === void 0) continue;
		for (const name of reported) if (name !== "") names.add(name);
	}
	return names;
}
// src/host/files.ts
/**
* Workspace reads — and the editor's one guarded write — for the Files tab.
*
* Two questions the page asks, and one answer it gives: what a directory holds,
* what a text file says (paged for the preview, whole for the editor), and the
* text the editor wants written back. Reads are answered through the composed
* `workspaceFiles` service, so the session's own workspace root is the only
* directory a page can reach and every listing stays inside it. The write is the
* exception: that service is read-only, so saving goes through `ctx.fs`, fenced
* by the session's own sandbox policy and guarded by the freshness token the
* editor was handed. A session that is not live yet still owns a durable header,
* and that header's `cwd` is what lets a reopened page answer for its workspace
* on the first request.
*
* A session the Host cannot name at all falls back to the executor's default
* directory, which is at least a directory that exists; the page then shows
* whatever that directory holds rather than an empty tab.
*/
/** How many lines one preview asks for; the service's own cap still applies. */
const READ_LINES = 5e3;
/**
* Largest file the editor will open or overwrite, in bytes.
*
* The preview pages its answer, so it can show the head of any file; the editor
* cannot — it hands back a whole document, and a whole document is what must be
* written. A cap keeps a mistaken click on a 500 MB log from pinning the Host
* and the browser at once. Refusing is the honest answer: the page says the file
* is too large and leaves it in preview.
*/
const EDIT_BYTES = 2097152;
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
		const entries = Array.isArray(listing.entries) ? listing.entries : [];
		const absolute = typeof listing.path === "string" && listing.path !== "" ? join(root, listing.path) : root;
		const names = entries.map((entry) => String(entry.name));
		const [marked, excluded] = await Promise.all([platformHiddenNames(ctx, absolute), ignoredNames(ctx, absolute, names)]);
		return {
			ok: true,
			path: typeof listing.path === "string" ? listing.path : path,
			root,
			...workspace === void 0 ? {} : { workspace },
			entries: entries.map((entry, index) => {
				const name = names[index] ?? String(entry.name);
				return {
					name,
					type: entry.type === "directory" || entry.type === "file" ? entry.type : "other",
					...typeof entry.size === "number" ? { size: entry.size } : {},
					hidden: isHiddenName(name) || marked.has(name),
					...excluded.has(name) ? { ignored: true } : {}
				};
			}),
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
/**
* The complete raw text of one workspace file, for the editor.
*
* The preview's paged read is the wrong input for an editor — it is a window,
* and it drops the terminator after the last line — so this is a second read of
* the file as it is stored. The freshness token travels with it: a save quotes
* that token, and the backend refuses the write if the file moved on in between.
*
* @param ctx - the Host plugin context.
* @param sessionId - the session the page belongs to, when it named one.
* @param rawPath - the file as a workspace path.
* @returns the text, or an `ok: false` answer.
*/
async function readWholeFile(ctx, sessionId, rawPath) {
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
	const fs = ctx.get("fs");
	if (fs === void 0) return {
		ok: false,
		error: "The filesystem service is not mounted"
	};
	try {
		const target = await fs.resolve(path, { cwd: root });
		const info = await fs.stat(target);
		if (info === void 0) return {
			ok: false,
			reason: "missing",
			error: "This file no longer exists"
		};
		if (info.type !== "file") return {
			ok: false,
			error: "This path is not a regular file"
		};
		if (typeof info.size === "number" && info.size > EDIT_BYTES) return {
			ok: false,
			reason: "too-large",
			error: `This file is larger than ${EDIT_BYTES} bytes and can only be previewed`
		};
		const data = await fs.readBytes(target, void 0, EDIT_BYTES);
		if (data.includes(0)) return {
			ok: false,
			reason: "not-text",
			error: "This file is not a text file"
		};
		let text;
		try {
			text = new TextDecoder("utf-8", { fatal: true }).decode(data);
		} catch {
			return {
				ok: false,
				reason: "not-text",
				error: "This file is not UTF-8 text"
			};
		}
		return {
			ok: true,
			path,
			text,
			bytes: data.length,
			version: String(info.version)
		};
	} catch (error) {
		return {
			ok: false,
			error: messageOf(error)
		};
	}
}
/**
* The raw bytes of one workspace image, for the preview's `<img>`.
*
* The text routes answer JSON; this one answers a body, because what the page
* wants is the picture itself. Three fences keep it as narrow as the reads: the
* path must stay inside the workspace, the name must be an extension the shared
* kind table calls an image — which is the same table the page used to decide to
* ask — and the file must sit under the image cap, checked before it is read so
* an oversized file is refused rather than buffered and dropped.
*
* @param ctx - the Host plugin context.
* @param sessionId - the session the page belongs to, when it named one.
* @param rawPath - the file as a workspace path.
* @returns the media type and bytes, or a failure the route answers with.
*/
async function readImage(ctx, sessionId, rawPath) {
	const path = readPath(rawPath);
	if (path === void 0 || path === "") return {
		ok: false,
		error: "The path must name a workspace file"
	};
	const mediaType = imageMediaTypeOf(path);
	if (mediaType === void 0) return {
		ok: false,
		error: "This file is not an image"
	};
	const root = await resolveRoot(ctx, sessionId);
	if (root === void 0) return {
		ok: false,
		error: "This session has no working directory to browse"
	};
	const fs = ctx.get("fs");
	if (fs === void 0) return {
		ok: false,
		error: "The filesystem service is not mounted"
	};
	try {
		const target = await fs.resolve(path, { cwd: root });
		const info = await fs.stat(target);
		if (info === void 0) return {
			ok: false,
			error: "This file no longer exists"
		};
		if (info.type !== "file") return {
			ok: false,
			error: "This path is not a regular file"
		};
		if (typeof info.size === "number" && info.size > 25165824) return {
			ok: false,
			reason: "too-large",
			error: `This image is larger than ${IMAGE_MAX_BYTES} bytes`
		};
		return {
			ok: true,
			mediaType,
			data: await fs.readBytes(target, void 0, IMAGE_MAX_BYTES)
		};
	} catch (error) {
		return {
			ok: false,
			error: messageOf(error)
		};
	}
}
/**
* The sandbox policy one save runs under.
*
* The session's own mode and `cwd` are the fence, exactly as they are for the
* agent's write tool — the editor must not be a way around a read-only session.
* A request that names no live session has no policy to inherit; the deployment
* default then applies, bounded by its own fallback root, and a workspace the
* default does not cover is refused rather than quietly widened.
*
* @param ctx - the Host plugin context.
* @param sessionId - the session the page belongs to, when it named one.
* @returns the policy for this call, or undefined when no service owns one.
*/
function policyFor(ctx, sessionId) {
	const policy = ctx.get("sandboxPolicy");
	if (policy === void 0 || typeof policy.resolve !== "function") return void 0;
	try {
		const sessions = ctx.get("sessions");
		const session = typeof sessionId === "string" && sessionId !== "" ? sessions?.get(sessionId) : void 0;
		return policy.resolve(session === void 0 ? {} : { session });
	} catch {
		return;
	}
}
/** Whether a caught error carries one of the filesystem service's stable codes. */
function hasCode(error, code) {
	return typeof error === "object" && error !== null && "code" in error && error.code === code;
}
/**
* How many lines a stored text holds, by the read service's own convention: a
* final newline terminates the last line instead of starting an empty one.
*/
function lineCount(text) {
	if (text === "") return 0;
	const trimmed = text.endsWith("\n") ? text.slice(0, -1) : text;
	let lines = 1;
	for (let at = trimmed.indexOf("\n"); at !== -1; at = trimmed.indexOf("\n", at + 1)) lines += 1;
	return lines;
}
/**
* Replace one workspace text file with what the editor holds.
*
* Three fences stand between the page and the disk. The path must stay inside
* the workspace (the same grammar the reads use); the content must be UTF-8 text
* within the edit cap; and the write is version-guarded by the token the editor
* read, so a file the agent — or another editor — changed since it was opened is
* refused with `reason: 'stale'` instead of silently losing that change.
*
* @param ctx - the Host plugin context.
* @param sessionId - the session the page belongs to, when it named one.
* @param rawPath - the file as a workspace path.
* @param rawText - the complete new content.
* @param rawVersion - the freshness token the editor's read returned.
* @returns the save outcome, or an `ok: false` answer.
*/
async function saveFile(ctx, sessionId, rawPath, rawText, rawVersion) {
	const path = readPath(rawPath);
	if (path === void 0 || path === "") return {
		ok: false,
		error: "The path must name a workspace file"
	};
	if (typeof rawText !== "string") return {
		ok: false,
		error: "The content must be text"
	};
	const bytes = Buffer.byteLength(rawText, "utf8");
	if (bytes > EDIT_BYTES) return {
		ok: false,
		error: `The content is larger than ${EDIT_BYTES} bytes`
	};
	const root = await resolveRoot(ctx, sessionId);
	if (root === void 0) return {
		ok: false,
		error: "This session has no working directory to browse"
	};
	const fs = ctx.get("fs");
	if (fs === void 0) return {
		ok: false,
		error: "The filesystem service is not mounted"
	};
	try {
		const target = await fs.resolve(path, { cwd: root });
		const info = await fs.stat(target);
		if (info === void 0) return {
			ok: false,
			reason: "missing",
			error: "This file no longer exists"
		};
		if (info.type !== "file") return {
			ok: false,
			error: "This path is not a regular file"
		};
		const version = typeof rawVersion === "string" && rawVersion !== "" ? rawVersion : String(info.version);
		const outcome = await fs.writeText(target, rawText, {
			kind: "replaceIfVersion",
			version
		}, void 0, policyFor(ctx, sessionId));
		return {
			ok: true,
			path,
			lines: lineCount(rawText),
			bytes,
			version: String(outcome.version)
		};
	} catch (error) {
		if (hasCode(error, "FS_STALE_VERSION")) return {
			ok: false,
			reason: "stale",
			error: "The file changed on disk since it was opened"
		};
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
* error state. The one exception is the raw route, which answers bytes rather
* than JSON because its caller is an `<img>` that cannot read either.
*
* The Host stays authoritative about *which* workspace is browsed. A request may
* name the session it belongs to, but never a directory: the root is read from
* that session's own header, so a page cannot point the plugin at a tree the
* session does not own. Four routes read; the fifth is the editor's save, and
* it accepts nothing but the text of one file already inside that workspace.
*/
/** Route table, kept in one place so the two halves cannot drift. */
const ROUTES = {
	list: "/dsh-cool-file/api/list",
	read: "/dsh-cool-file/api/read",
	text: "/dsh-cool-file/api/text",
	write: "/dsh-cool-file/api/write",
	raw: RAW_ROUTE
};
/** Longest body the read routes accept; each is a path and a session id. */
const MAX_BODY_BYTES = 16384;
/**
* Longest body the save route accepts: the content cap, with room for the JSON
* escaping of control characters (a newline doubles, a control byte becomes six)
* plus the path and the freshness token.
*/
const MAX_WRITE_BODY_BYTES = 16777216;
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
* @param limit - largest body accepted, in bytes.
* @returns the parsed body; `{}` for an empty one.
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
* Run one answer and send it as JSON.
*
* @param req - the incoming request.
* @param res - the response to write.
* @param run - the answer, given the parsed body.
* @param limit - largest body accepted, in bytes.
*/
async function handle(req, res, run, limit = MAX_BODY_BYTES) {
	if (!methodAllowed(req, res, ["POST"])) return;
	let body;
	try {
		body = await readBody(req, limit);
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
* Answer one image request with the file's own bytes.
*
* A `GET` with the path in the query string, because the caller is an `<img>`
* element and not this plugin's `fetch`: an image address cannot carry a body,
* and a browser will not let script read the answer either way. Everything else
* is the same fence the JSON routes stand behind — the same cross-origin
* refusal, the same workspace-confined path — and a failure is answered with a
* status and a short text body, which is what an `<img>` turns into its own
* broken-image state rather than into a picture.
*
* @param ctx - the Host plugin context.
* @param req - the incoming request; its query names the session and the file.
* @param res - the response to write.
*/
async function handleRaw(ctx, req, res) {
	if (!methodAllowed(req, res, ["GET", "HEAD"])) return;
	const query = new URL(typeof req.url === "string" ? req.url : "/", "http://localhost").searchParams;
	const answer = await readImage(ctx, query.get("sessionId") ?? void 0, query.get("path") ?? "");
	if (answer.ok !== true) {
		res.writeHead(404, {
			"content-type": "text/plain; charset=utf-8",
			"cache-control": "no-store"
		});
		res.end(answer.error);
		return;
	}
	res.writeHead(200, {
		"content-type": answer.mediaType,
		"content-length": String(answer.data.length),
		"cache-control": "no-store",
		"content-security-policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
		"x-content-type-options": "nosniff"
	});
	res.end(req.method === "HEAD" ? void 0 : Buffer.from(answer.data));
}
/**
* Register the five routes on the browser HTTP carrier.
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
	const disposers = [
		route(ROUTES.list, (req, res) => handle(req, res, (body) => listDirectory(ctx, body.sessionId, body.path))),
		route(ROUTES.read, (req, res) => handle(req, res, (body) => readFile(ctx, body.sessionId, body.path))),
		route(ROUTES.text, (req, res) => handle(req, res, (body) => readWholeFile(ctx, body.sessionId, body.path))),
		route(ROUTES.write, (req, res) => handle(req, res, (body) => saveFile(ctx, body.sessionId, body.path, body.text, body.version), MAX_WRITE_BODY_BYTES)),
		route(ROUTES.raw, (req, res) => handleRaw(ctx, req, res))
	];
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
