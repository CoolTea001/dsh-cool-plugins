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
import * as React from 'react';
import type { Translate } from './locales.js';
import type { DailyModel, ModelGroup } from '../shared/contract.js';
/** The props the settings dialog hands the picker. */
export interface ModelPickerProps {
    /** The plugin's translate seat. */
    t: Translate;
    /** The catalog to offer. */
    groups: readonly ModelGroup[];
    /** DSH's current default selection, shown when this plugin follows it. */
    current: DailyModel | null;
    /** The pinned route, or null when following the default. */
    value: DailyModel | null;
    /** Whether the dialog is mid-save. */
    disabled: boolean;
    /** The route the reader chose. */
    onChange: (value: DailyModel) => void;
}
/**
 * Render the picker.
 * @param props - catalog, current choice, and the change callback.
 * @returns the trigger and, while open, its popover.
 */
export declare function ModelPicker({ t, groups, current, value, disabled, onChange, }: ModelPickerProps): React.ReactElement;
//# sourceMappingURL=model-picker.d.ts.map