import type { BundleDiff } from "../bundle-diff.ts";
import type { BundleSize } from "../bundle-size.ts";
import { compareBundle } from "./compare-bundle.ts";

/**
 * Compare two arrays of `BundleSize`, calculating the diff between each bundle.
 *
 * Bundles are matched by `id`. Returns diffs for bundles that are added,
 * removed, or updated.
 *
 * @public
 */
export function compareBundles(base: BundleSize[], current: BundleSize[]): BundleDiff[] {
	const baseMap = new Map(base.map((b) => [b.id, b]));
	const currentMap = new Map(current.map((b) => [b.id, b]));

	// Preserve order: base ids first, then any current-only ids in current order.
	const ids = Array.from(new Set([...base.map((b) => b.id), ...current.map((b) => b.id)]));

	return ids.map((id) => {
		const base = baseMap.get(id);
		const current = currentMap.get(id);
		if (current && base) {
			return compareBundle(base, current);
		} else if (current) {
			return compareBundle(undefined, current);
		} else if (base) {
			return compareBundle(base, undefined);
		} else {
			/* v8 ignore next -- @preserve */
			throw new Error(`Unreachable: no base or current bundle for id "${id}"`);
		}
	});
}
