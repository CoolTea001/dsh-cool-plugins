/**
 * The model directory the settings picker reads.
 *
 * Two answers live here because the page needs both: which route writes an
 * article when this plugin has pinned none, and which routes it may offer. Both
 * are read from DSH's own services on every request instead of being copied into
 * the settings file, so a model added, removed, or made current elsewhere in the
 * app shows up the next time the dialog opens.
 *
 * `agentDefaultModel` is the deployment's current default selection — the same
 * choice DSH's own model picker saves, and the one this plugin follows until the
 * reader pins a route of their own.
 */
import type { DailyModel, ModelEffortsPayload, ModelGroup } from '../shared/contract.js';
/**
 * Read DSH's current default selection.
 *
 * @param ctx - the Host plugin context.
 * @returns the route, or null when there is no usable default.
 */
export declare function defaultSelection(ctx: any): DailyModel | null;
/**
 * Read every registered provider's catalog for the picker.
 *
 * One provider at a time: a provider whose endpoint is unreachable, whose
 * credential is missing, or whose adapter answers with an unusable list is left
 * out rather than taking every other provider's rows with it.
 *
 * @param ctx - the Host plugin context.
 * @returns provider groups in registration order, each in catalog order.
 */
export declare function readModelGroups(ctx: any): Promise<ModelGroup[]>;
/**
 * Read the reasoning levels one exact route offers.
 *
 * Effort metadata is adapter-owned and resolved per model, which is why the
 * picker asks when a row's control is opened rather than shipping every model's
 * list with the catalog. A failed read is reported instead of flattened into an
 * empty list: a row that could not be asked must not look like a model with
 * nothing to choose.
 *
 * @param ctx - the Host plugin context.
 * @param provider - the registered provider route.
 * @param model - the provider-owned model id.
 * @returns the effort ids, or the failure to report.
 */
export declare function readModelEfforts(ctx: any, provider: string, model: string): Promise<ModelEffortsPayload>;
//# sourceMappingURL=models.d.ts.map